from sqlalchemy import select
from app.core import game_room
from app.schemas import FullPlayerDataSchema, UserPublicSchema
from app.models import UserModel
from app.core.scheduler import scheduler
import datetime
from apscheduler.job import Job
from apscheduler.jobstores.base import JobLookupError
from app.dependencies import get_user, get_current_user
from app.schemas import UserPublicSchema
from app.ws import sio
from app.config import logger

async def get_user_by_sid(sid: str, namespace: str) -> UserModel | None:
    data = await sio.get_session(sid, namespace=namespace)
    if not data or not data['firebase_uid']:
        return
    user = await get_user(data['firebase_uid'])
    return user

async def save_user_session(sid: str, auth: dict, namespace: str) -> UserModel | None:
    try:
        user = await get_current_user(auth["token"])
        data = UserPublicSchema.model_validate(user).model_dump()
        await sio.save_session(sid, data, namespace=namespace)
        return user
    except Exception as e:
        logger.error(f'Could not save user session: {e}')
        return

async def join_game(sid: str, player_id: int, game_key: str, namespace: str):
    if not game_key:
        return
    await sio.enter_room(sid, game_key, namespace=namespace)
    game_room.join_game(player_id, game_key)
    await sio.emit('game_joined', {
        'game_key': game_key
    }, to=game_key, namespace=namespace)

async def join_game_currently_in(sid: str, namespace: str) -> bool:
    '''Return True if user joined the game'''
    current_user: UserModel | None = await get_user_by_sid(sid, namespace)
    if not current_user:
        return False

    game_key = game_room.get_current_game(current_user.firebase_uid)
    if not game_key:
        return False

    await join_game(sid, current_user.firebase_uid, game_key, namespace)
    player = game_room.get_player(game_key, current_user.firebase_uid)
    safe_remove_job(f'send_disconnect_event:{current_user.firebase_uid}')

    if player:
        team = player.get('team')
        if team:
            record_job_name = f"record_technical_defeat:{game_key}:{team}"
            if scheduler.get_job(record_job_name):
                await sio.emit(
                    'record_defeat_cancelled',
                    to=game_key,
                    namespace=namespace
                )
            safe_remove_job(record_job_name)
            game_room.set_player_key(game_key, current_user.firebase_uid, 'is_connected', True)

    return True

def get_full_player_data(game_key: str, player_id: int) -> dict:
    from app.db import SessionLocal

    with SessionLocal() as session:
        u = session.scalar(select(UserModel).where(UserModel.firebase_uid == player_id))
    player_data = game_room.get_player(game_key, player_id)
    player_data.update(UserPublicSchema.model_validate(u).model_dump())
    return FullPlayerDataSchema.model_validate(player_data).model_dump(mode='json')

def get_full_teams_data(game_key: str) -> list[dict]:
    teams = game_room.get_teams(game_key)
    for i, t in enumerate(teams):
        teams[i]['players'] = [get_full_player_data(game_key, p['id']) for p in t['players']]

    return teams

def safe_remove_job(job_name: str) -> None:
    if scheduler.get_job(job_name):
        try:
            scheduler.remove_job(job_name)
        except JobLookupError as e:
            logger.info(f'An error occured when trying to remove job {job_name}: {e}', exc_info=False)

def get_job_seconds_left(job: Job) -> int | None:
    if not job:
        return
    run_time = job.next_run_time.replace(tzinfo=datetime.timezone.utc)
    seconds = round((run_time - datetime.datetime.now(tz=datetime.timezone.utc)).total_seconds())
    return seconds