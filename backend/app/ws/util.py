import functools
from flask_login import current_user
from flask_socketio import disconnect, emit, join_room, rooms
from app import game_room

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
            {
                'username': current_user.username,
            },
            broadcast=True,
            to=game_key
        )
        return True
    return False