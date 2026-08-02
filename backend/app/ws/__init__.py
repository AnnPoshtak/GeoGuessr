import socketio
from app.config import settings, logger

sio = socketio.AsyncServer(cors_allowed_origins=settings.CORS_ORIGINS, async_mode="asgi", logger=settings.DEBUG)

from .game import GameNamespace
from .queue import QueueNamespace

sio.register_namespace(QueueNamespace('/queue'))
sio.register_namespace(GameNamespace('/game'))