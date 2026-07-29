from app import socketio
from flask import current_app
from .game import GameNamespace
from .queue import QueueNamespace

socketio.on_namespace(QueueNamespace('/queue'))
socketio.on_namespace(GameNamespace('/game'))

@socketio.on_error_default
def handle_error(e: Exception):
    current_app.logger.error(f'A SocketIO error occured: {e}', exc_info=True)