from flask_socketio import Namespace, emit

class GameNamespace(Namespace):
    def on_connect(self):
        pass
    def on_message(self, data):
        print(self, data)