import datetime
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.config import settings
from app.db import SessionLocal
from app.models import UserModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.redis import RedisJobStore
from redis import ConnectionPool
from app.core import game_queue, game_room

pool = ConnectionPool.from_url(settings.REDIS_CACHE_URL)
jobstores = {
    'default': RedisJobStore(jobs_key='scheduler_jobs', run_times_key='scheduler_run_times', connection_pool=pool)
}

scheduler = AsyncIOScheduler(jobstores=jobstores, jobdefaults=settings.SCHEDULER_JOB_DEFAULTS)

async def record_technical_defeat(game_key: str, team: str) -> None:
    from app.ws import sio
    game = await game_room.get_game(game_key)
    if not game:
        return
    teams = [t for t in game.teams if t.name != team]
    winning_team = await game_room.get_winning_team(game_key, teams)
    game = game.model_dump(mode='json')
    await sio.emit(
        'game_end',
        {
            'winner': winning_team.model_dump(mode='json'),
            'target': game['target'],
            'teams': game['teams'],
            'scores': await game_room.get_scores(game_key),
        }, 
        to=game_key, 
        namespace='/game'
    )
    await game_room.end_game(game_key)

async def send_disconnect_event(game_key: str, user_id: str) -> None:
    from app.schemas import UserPublicSchema
    from app.ws import sio
    async with SessionLocal() as session:
        user = await session.scalar(
            select(UserModel)
            .where(UserModel.firebase_uid == user_id)
            .options(selectinload(UserModel.stats))
        )
    if not user:
        return
    if not game_key:
        return
    player = await game_room.get_player(game_key, user.firebase_uid)
    if not player or not player.is_connected:
        return
    if game_key:
        await game_room.set_is_connected(game_key, user.firebase_uid, False)
        run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=settings.defeat_team_interval)
        team = await game_room.get_team(game_key, player.team)
        record_defeat = True
        for p in team.players:
            if p.is_connected:
                record_defeat = False
                break
        if record_defeat:
            scheduler.add_job(
                record_technical_defeat,
                args=(game_key, team),
                id=f'record_technical_defeat:{game_key}:{team.name}',
                next_run_time=run_time,
                replace_existing=True
            )
            await sio.emit(
                'record_defeat_started',
                {'team': team.model_dump(mode='json')},
                to=game_key,
                namespace='/game'
            )
        await sio.emit(
            'player_disconnected',
            UserPublicSchema.model_validate(user).model_dump(mode='json'),
            to=game_key,
            namespace='/game'
        )

async def send_queue_leave_event(user_id: str):
    from app.ws import sio
    async with SessionLocal() as session:
        user = await session.scalar(
            select(UserModel)
            .where(UserModel.firebase_uid == user_id)
            .options(selectinload(UserModel.stats))
        )
    if not user:
        return
    if not await game_queue.is_player_in_queue(user_id):
        return
    key = await game_queue.get_player_queue(user_id)
    await game_queue.leave_queue(user_id, key)
    queue = await game_queue.get_queue(key)
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
    game = await game_room.get_game(game_key)
    if not game:
        return
    
    game = game.model_dump(mode='json')
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
    game_key = await game_room.get_current_game(user_id)
    if not game_key:
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
