from app import socketio
from .game import GameNamespace
from .queue import QueueNamespace

socketio.on_namespace(QueueNamespace('/queue'))
socketio.on_namespace(GameNamespace('/game'))

@socketio.on_error_default
def handle_error(e):
    print(f'A SocketIO error occured: {e}')