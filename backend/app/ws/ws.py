from app import socketio
from .game import GameNamespace

socketio.on_namespace(GameNamespace('/game'))

@socketio.on_error_default
def handle_error(e):
    print(f'A SocketIO error occured: {e}')