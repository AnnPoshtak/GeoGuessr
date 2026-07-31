import datetime
from app.ws import sio
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

def record_technical_defeat(game_key: str, team: str) -> None:
    from app.ws.util import get_full_teams_data
    with scheduler.app.app_context():
        game = game_room.get_game(game_key)
        if not game or not 'teams' in game:
            return
        teams = [t for t in get_full_teams_data(game_key) if t['name'] != team]
        winning_team = game_room.get_winning_team(game_key, teams)
        sio.emit(
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

def send_disconnect_event(game_key: str, user_id: int):
    from app.schemas import UserPublicSchema
    with scheduler.app.app_context():
        with SessionLocal as session:
            user = session.query(UserModel).filter_by(id=user_id).first()
            if not user:
                return
            player = game_room.get_player(game_key, user.id)
            if not player or not player['is_connected']:
                return
            if game_key:
                game_room.set_player_key(game_key, user.id, 'is_connected', False)
                run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=settings.defeat_team_interval)
                team = game_room.get_player(game_key, user.id)['team']
                record_defeat = True
                for p in game_room.get_team(game_key, team)['players']:
                    if game_room.get_player(game_key, p)['is_connected']:
                        record_defeat = False
                        break
                if record_defeat:
                    scheduler.add_job(
                        f'record_technical_defeat:{game_key}:{team}',
                        record_technical_defeat, 
                        args=(game_key, team),
                        next_run_time=run_time,
                        replace_existing=True
                    )
                    sio.emit(
                        'record_defeat_started',
                        {'team': team},
                        to=game_key,
                        namespace='/game'
                    )
                sio.emit(
                    'player_disconnected', 
                UserPublicSchema().model_dump(user, mode='json'),
                )

def send_queue_leave_event(user_id: int):
    with scheduler.app.app_context():
        with SessionLocal as session:
            user = session.query(UserModel).filter_by(id=user_id).first()
            if not user:
                return
            if not game_queue.is_player_in_queue(user_id):
                return
            key = game_queue.get_player_queue(user_id)
            game_queue.leave_queue(user_id, key)
            queue = game_queue.get_queue(key)
            sio.emit(
                'queue_left', 
                {
                    'queue': queue
                }, 
                to=key, 
                namespace='/queue'
            )

def send_real_target(game_key: str):
    with scheduler.app.app_context():
        if game_room.get_temp_target(game_key) and not scheduler.get_job(f'send_real_target:{game_key}'):
            ttl = game_room.get_temp_target_ttl(game_key) or 1
            run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=ttl)
            scheduler.add_job(
                f'send_real_target:{game_key}',
                send_real_target,
                args=(game_key),
                next_run_time=run_time,
                replace_existing=True,
            )
            return
        game = game_room.get_game(game_key)
        sio.emit('real_target', {
            'target': game['target']
        }, 
        to=game_key,
        namespace='/game'
        )

def send_inactivity_kick_notification(sid: str, user_id: int):
    from app.ws.util import get_job_seconds_left
    with scheduler.app.app_context():
        game_key = game_room.get_current_game(user_id)
        if game_key and scheduler.get_job(f'team_submitted:{game_key}'):
            return
        job = scheduler.get_job(f'inactivity_kick:{user_id}')
        seconds = get_job_seconds_left(job) or -1
        sio.emit('inactivity_kick_notification', {
            'current_cooldown': seconds,
            'cooldown_message': "Inactivity kick in:",
        }, to=sid, namespace='/game')