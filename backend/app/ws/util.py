import functools
from flask_login import current_user
from flask_socketio import disconnect, emit, join_room
from app import game_room
from app.schemas import user_public_schema, full_player_data_schema
from app.models import UserModel

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
        emit(
            'player_reconnected', 
            user_public_schema.dump(current_user),
            broadcast=True,
            to=game_key
        )
        return True
    return False

def get_full_player_data(game_id: str, player_id: int) -> dict:
    u = UserModel.query.get(player_id)
    player_data = game_room.get_player(game_id, player_id)
    player_data.update(user_public_schema.dump(u))
    return full_player_data_schema.dump(player_data)