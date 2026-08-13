from . import sio
import socketio
from app.core import game_room
from app.config import settings, logger
from .util import join_game, join_game_currently_in, get_full_player_data, \
safe_remove_job, get_job_seconds_left, save_user_session, get_user_by_sid
from app.core.scheduler import scheduler, send_disconnect_event, send_real_target, send_inactivity_kick_notification
import datetime
from app.models import UserModel
from app.schemas import MapLocation

async def move_next_round(game_key: str):
    game = await game_room.get_game(game_key)
    if not game:
        return
    team_scores = []
    winning_team = await game_room.get_winning_team(game_key)
    for team in game.teams:
        avg_score = await game_room.get_team_average_score(game_key, team.name)
        team_scores.append(avg_score)

    best_score = max(team_scores)
    scores = await game_room.get_scores(game_key)
    for i, t in enumerate(game.teams):
        score_diff = best_score - team_scores[i]
        health = t.health
        if t.name != winning_team.name:
            health = max(0, health - round(score_diff * (int(game.round) * settings.round_health_multiplier)))
            await game_room.set_team_health(game_key, t.name, health)
            if health <= 0:
                game = await game_room.get_game(game_key)
                game = game.model_dump(mode='json')
                await sio.emit('game_end', {
                    'winner': winning_team.model_dump(mode='json'),
                    'target': game['target'],
                    'teams': game['teams'],
                    'scores': scores,
                }, to=game_key,  namespace='/game')
                return await game_room.end_game(game_key)
    await game_room.set_temp_target(game_key)
    game = await game_room.get_game(game_key)
    await game_room.move_next_round(game_key)
    game = game.model_dump(mode='json')
    
    await sio.emit('new_round', {
        'target': game['target'],
        'teams': game['teams'],
        'scores': scores,
    }, to=game_key,  namespace='/game')


class GameNamespace(socketio.AsyncNamespace):
    async def on_connect(self, sid, environ, auth):
        user = await save_user_session(sid, auth, '/game')
        if not user:
            await sio.disconnect(sid)
            return
        await join_game_currently_in(sid, '/game')

    async def on_disconnect(self, sid, reason=None):
        try:
            current_user: UserModel = await get_user_by_sid(sid, '/game')
        except Exception as e:
            logger.error(f'User not found: {e}')
            return
        if not current_user:
            return
        run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=3)
        game_key = await game_room.get_current_game(current_user.firebase_uid)
        if not game_key:
            return
        scheduler.add_job(
            send_disconnect_event,
            args=(game_key, current_user.firebase_uid),
            id=f'send_disconnect_event:{current_user.firebase_uid}',
            next_run_time=run_time,
            replace_existing=True
        )

    async def on_fetch_game(self, sid):
        try:
            current_user: UserModel = await get_user_by_sid(sid, '/game')
        except Exception as e:
            logger.error(f'User not found: {e}')
            return
        if not current_user:
            return
        game_key = await game_room.get_current_game(current_user.firebase_uid)
        if not game_key:
            return await sio.send('You have to be part of the ongoing game')
        game = await game_room.get_game(game_key)
        # Anti AFK logic
        if not scheduler.get_job(f'inactivity_kick:{current_user.firebase_uid}'):
            inactivity_run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=settings.inactivity_kick_cooldown)
            scheduler.add_job(
                send_disconnect_event,
                args=(game_key, current_user.firebase_uid),
                id=f'inactivity_kick:{current_user.firebase_uid}',
                next_run_time=inactivity_run_time,
                replace_existing=True
            )
            notification_run_time = datetime.datetime.now(tz=datetime.timezone.utc) + \
                datetime.timedelta(seconds=settings.inactivity_kick_cooldown - settings.inactivity_kick_notification_left)
            scheduler.add_job(
                send_inactivity_kick_notification,
                args=(sid, current_user.firebase_uid),
                id=f'send_inactivity_kick_notification:{current_user.firebase_uid}',
                next_run_time=notification_run_time,
                replace_existing=True,
            )
        # Delay sending the real target right after new round    
        if game.temp_target:
            game.target = game.temp_target
            if not scheduler.get_job(f'send_real_target:{game_key}'):
                ttl = await game_room.get_temp_target_ttl(game_key) or 1
                run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=ttl)
                scheduler.add_job(
                    send_real_target,
                    args=(game_key,),
                    id=f'send_real_target:{game_key}',
                    next_run_time=run_time,
                    replace_existing=True
                )

        autosubmit_job = scheduler.get_job(f'team_submitted:{game_key}')
        inactivity_notification_job = scheduler.get_job(f'send_inactivity_kick_notification:{current_user.firebase_uid}')
        inactivity_job = scheduler.get_job(f'inactivity_kick:{current_user.firebase_uid}')
        print(autosubmit_job)
        current_cooldown = -1
        cooldown_message = None

        if autosubmit_job:
            current_cooldown = get_job_seconds_left(autosubmit_job)
            cooldown_message = "Auto-submitting in:"
        elif inactivity_job and not inactivity_notification_job:
            current_cooldown = get_job_seconds_left(inactivity_job)
            cooldown_message = "Inactivity kick in:"

        state = game.model_dump(mode='json')
        state['current_cooldown'] = current_cooldown
        state['cooldown_message'] = cooldown_message

        player = await game_room.get_player(game_key, current_user.firebase_uid)
        guess = player.guess.model_dump(mode='json') if player.guess else None
        state['guess'] = guess
        return {
            'game': state
        }

    async def on_join(self, sid, data: dict = {}):
        try:
            current_user: UserModel = await get_user_by_sid(sid, '/game')
        except Exception as e:
            logger.error(f'User not found: {e}')
            return
        if not current_user:
            return
        if not 'game_key' in data or not isinstance(data['game_key'], str):
            return await sio.send('Please, select a game you wish to join')
        game_key = data['game_key']
        await join_game(sid, current_user.firebase_uid, game_key, '/game')

    async def on_submit(self, sid, data: MapLocation | None = None):
        if not data:
            return
        try:
            current_user: UserModel = await get_user_by_sid(sid, '/game')
        except Exception as e:
            logger.error(f'User not found: {e}')
            return
        if not current_user:
            return
        game_key = await game_room.get_current_game(current_user.firebase_uid)
        if not game_key:
            return await sio.send('You have to be part of the ongoing game')
        player = await game_room.get_player(game_key, current_user.firebase_uid)
        if player.guess:
            return await sio.send('You have already submitted the guess')
        guess = MapLocation.model_validate(data)
        await game_room.set_guess(game_key, current_user.firebase_uid, guess)
        safe_remove_job(f'inactivity_kick:{current_user.firebase_uid}')
        if scheduler.get_job(f'send_inactivity_kick_notification:{current_user.firebase_uid}'):
            await sio.emit('inactivity_kick_cancelled', namespace='/game')
            
        if await game_room.team_submitted(game_key, player.team) and not await game_room.all_players_submitted(game_key):
            run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=settings.autosubmit_interval)
            scheduler.add_job(
                move_next_round,
                args=(game_key,),
                id=f"team_submitted:{game_key}",
                next_run_time=run_time,
                replace_existing=True
            )
            await sio.emit('team_submitted', 
                {
                    'current_cooldown': settings.autosubmit_interval,
                    'cooldown_message': "Auto-submitting in:",
                },
                to=game_key,
                namespace='/game'
            )
        if await game_room.all_players_submitted(game_key):
            safe_remove_job(f"team_submitted:{game_key}")
            await move_next_round(game_key)
