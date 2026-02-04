from flask_socketio import Namespace, emit, join_room, close_room
from flask import session

class GameNamespace(Namespace):
    def on_submit(self, data):
        pass