import functools
from flask_login import current_user
from app.ws import sio
from app.core import game_room
from app.schemas import FullPlayerDataSchema, UserPublicSchema
from app.models import UserModel
from app.core.scheduler import scheduler
import datetime
from apscheduler.job import Job
from apscheduler.jobstores.base import JobLookupError

def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        # TODO: replace this with actual auth logic when ready
        if True:
            sio.disconnect()
        else:
            return f(*args, **kwargs)
    return wrapped

def join_game(player_id: int, game_key: str):
    if not game_key:
        return
    join_room(game_key)
    game_room.join_game(player_id, game_key)
    sio.emit('game_joined', {
        'game_key': game_key
    }, to=game_key)

def join_game_currently_in() -> bool:
    '''Return True if user joined the game'''
    game_key = game_room.get_current_game(current_user.id)
    if game_key:
        join_game(current_user.id, game_key)
        player = game_room.get_player(game_key, current_user.id)
        if scheduler.get_job(f"record_technical_defeat:{game_key}:{player['team']}"):
            sio.emit(
                'record_defeat_cancelled',
                to=game_key
            )
        safe_remove_job(f"record_technical_defeat:{game_key}:{player['team']}")
        safe_remove_job(f'send_disconnect_event:{current_user.id}')
        game_room.set_player_key(game_key, current_user.id, 'is_connected', True)
        return True
    return False

def get_full_player_data(game_key: str, player_id: int) -> dict:
    u = UserModel.query.get(player_id)
    player_data = game_room.get_player(game_key, player_id)
    player_data.update(UserPublicSchema().model_dump(u, mode='json'))
    return FullPlayerDataSchema().model_dump(player_data, mode='json')

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
            current_app.logger.info(f'An error occured when trying to remove job {job_name}: {e}', exc_info=False)

def get_job_seconds_left(job: Job) -> int | None:
    if not job:
        return
    run_time = job.next_run_time.replace(tzinfo=datetime.timezone.utc)
    seconds = round((run_time - datetime.datetime.now(tz=datetime.timezone.utc)).total_seconds())
    return seconds