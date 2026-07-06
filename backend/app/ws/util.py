import functools
from flask_login import current_user
from flask_socketio import disconnect, emit, join_room
from app import game_room
from app.schemas import user_public_schema, full_player_data_schema
from app.models import UserModel
from app.core.scheduler import scheduler
import json
from apscheduler.jobstores.base import JobLookupError
from flask import current_app

def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            disconnect()
        else:
            return f(*args, **kwargs)
    return wrapped

def join_game(player_id: int, game_key: str):
    if not game_key:
        return
    join_room(game_key)
    game_room.join_game(player_id, game_key)
    emit('game_joined', {
        'game_key': game_key
    }, to=game_key)

def join_game_currently_in() -> bool:
    '''Return True if user joined the game'''
    game_key = game_room.get_current_game(current_user.id)
    if game_key:
        join_game(current_user.id, game_key)
        player = game_room.get_player(game_key, current_user.id)
        try:
            scheduler.remove_job(f"record_technical_defeat:{game_key}:{player['team']}")
            emit(
                'record_defeat_cancelled',
                to=game_key
            )
        except JobLookupError:
            pass
        try:
            scheduler.remove_job(f'send_disconnect_event:{current_user.id}')
        except JobLookupError:
            pass
        game_room.set_player_key(game_key, current_user.id, 'is_connected', True)
        return True
    return False

def get_full_player_data(game_key: str, player_id: int) -> dict:
    u = UserModel.query.get(player_id)
    player_data = game_room.get_player(game_key, player_id)
    player_data.update(user_public_schema.dump(u))
    return full_player_data_schema.dump(player_data)