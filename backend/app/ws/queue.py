from app.core import GameQueue, validate_player_count
from flask_socketio import Namespace, emit, join_room, leave_room
from flask_login import current_user
from .util import authenticated_only
from flask import session
import json

class QueueNamespace(Namespace):
    @authenticated_only
    def on_join(self, data):
        if 'game_key' in session:
            return
        if not 'player_count' in data:
            return
        try:
            player_count = int(data['player_count'])
            validate_player_count(player_count)
        except ValueError:
            return
        game_key = GameQueue.join_queue(current_user.id, player_count)
        queue_key = GameQueue.get_queue_key(player_count)
        session['queue'] = queue_key
        join_room(queue_key)
        queue = GameQueue.get_queue(player_count)
        if game_key:
            session['game_key'] = game_key
            return emit('queue_joined', {
                'game': game_key,
                'queue': json.dumps(queue)
            }, to=queue_key)
        emit('queue_joined', {
            'queue': json.dumps(queue)
        }, to=queue_key)
    
    @authenticated_only
    def on_leave(self):
        if 'game_key' in session:
            return
        if not GameQueue.is_player_in_queue(current_user.id):
            return
        if not 'queue' in session:
            return
        key = session.pop('queue')
        GameQueue.leave_queue(current_user.id, key)
        queue = GameQueue.get_queue(key)
        emit('queue_left', {
            'queue': json.dumps(queue)
        }, to=key)
        leave_room(key)