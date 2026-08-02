import datetime
from sqlalchemy import select
from app.config import settings
from app.db import SessionLocal
from app.models import UserModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.redis import RedisJobStore
from redis import ConnectionPool
from app.core import game_queue, game_room

pool = ConnectionPool.from_url(settings.REDIS_URL)
jobstores = {
    'default': RedisJobStore(jobs_key='scheduler_jobs', run_times_key='scheduler_run_times', connection_pool=pool)
}

scheduler = AsyncIOScheduler(jobstores=jobstores)

async def record_technical_defeat(game_key: str, team: str) -> None:
    from app.ws.util import get_full_teams_data
    from app.ws import sio
    game = game_room.get_game(game_key)
    if not game or not 'teams' in game:
        return
    teams = [t for t in get_full_teams_data(game_key) if t['name'] != team]
    winning_team = game_room.get_winning_team(game_key, teams)
    await sio.emit(
        'game_end',
        {
            'winner': winning_team,
            'target': game['target'],
            'teams': get_full_teams_data(game_key),
            'scores': game_room.get_scores(game_key),
        }, 
        to=game_key, 
        namespace='/game'
    )
    return game_room.end_game(game_key)

async def send_disconnect_event(game_key: str, user_id: str):
    from app.schemas import UserPublicSchema
    from app.ws import sio
    with SessionLocal() as session:
        user = session.scalar(select(UserModel).where(UserModel.firebase_uid == user_id))
        if not user:
            return
        player = game_room.get_player(game_key, user.firebase_uid)
        if not player or not player['is_connected']:
            return
        if game_key:
            game_room.set_player_key(game_key, user.firebase_uid, 'is_connected', False)
            run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=settings.defeat_team_interval)
            team = game_room.get_player(game_key, user.firebase_uid)['team']
            record_defeat = True
            for p in game_room.get_team(game_key, team)['players']:
                if game_room.get_player(game_key, p)['is_connected']:
                    record_defeat = False
                    break
            if record_defeat:
                scheduler.add_job(
                    record_technical_defeat,
                    args=(game_key, team),
                    id=f'record_technical_defeat:{game_key}:{team}',
                    next_run_time=run_time,
                    replace_existing=True
                )
                await sio.emit(
                    'record_defeat_started',
                    {'team': team},
                    to=game_key,
                    namespace='/game'
                )
            await sio.emit(
                'player_disconnected', 
                UserPublicSchema().model_validate(user).model_dump(mode='json'),
            )

async def send_queue_leave_event(user_id: str):
    from app.ws import sio
    with SessionLocal() as session:
        user = session.scalar(select(UserModel).where(UserModel.firebase_uid == user_id))
        if not user:
            return
        if not game_queue.is_player_in_queue(user_id):
            return
        key = game_queue.get_player_queue(user_id)
        game_queue.leave_queue(user_id, key)
        queue = game_queue.get_queue(key)
        await sio.emit(
            'queue_left', 
            {
                'queue': queue
            }, 
            to=key, 
            namespace='/queue'
        )

async def send_real_target(game_key: str):
    from app.ws import sio
    if game_room.get_temp_target(game_key) and not scheduler.get_job(f'send_real_target:{game_key}'):
        ttl = game_room.get_temp_target_ttl(game_key) or 1
        run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=ttl)
        scheduler.add_job(
            send_real_target,
            args=(game_key),
            id=f'send_real_target:{game_key}',
            next_run_time=run_time,
            replace_existing=True,
        )
        return
    game = game_room.get_game(game_key)
    await sio.emit('real_target', 
        {
            'target': game['target']
        }, 
        to=game_key,
        namespace='/game'
    )

async def send_inactivity_kick_notification(sid: str, user_id: str):
    from app.ws import sio
    from app.ws.util import get_job_seconds_left
    game_key = game_room.get_current_game(user_id)
    if game_key and scheduler.get_job(f'team_submitted:{game_key}'):
        return
    job = scheduler.get_job(f'inactivity_kick:{user_id}')
    seconds = get_job_seconds_left(job) or -1
    await sio.emit('inactivity_kick_notification', 
        {
            'current_cooldown': seconds,
            'cooldown_message': "Inactivity kick in:",
        }, 
        to=sid, 
        namespace='/game'
    )