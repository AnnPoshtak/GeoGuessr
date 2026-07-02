from app.core import validate_player_count
from flask_socketio import Namespace, emit, join_room, leave_room, close_room, send
from flask_login import current_user
from .util import authenticated_only
from flask import session
from app import game_queue
import json
from .util import join_game_currently_in

class QueueNamespace(Namespace):
    @authenticated_only
    def on_connect(self):
        join_game_currently_in()

    @authenticated_only
    def on_join(self, data: dict = {}):
        if not data: 
            return
        if not 'player_count' in data:
            return send('Please select the queue you wish to join')
        if game_queue.is_player_in_queue(current_user.id):
            return send('You have already joined the queue')
        try:
            player_count = int(data['player_count'])
            validate_player_count(player_count)
        except ValueError:
            return send('You have tried to join the wrong queue!')
        game_key = game_queue.join_queue(current_user.id, player_count)
        queue_key = game_queue.get_queue_key(player_count)
        session['queue'] = queue_key
        join_room(queue_key)
        queue = game_queue.get_queue(player_count)
        if game_key:
            session.pop('queue')
            emit('game_started', {
                'game_key': game_key
            }, to=queue_key, broadcast=True)
            return close_room(queue_key)
        
        emit('queue_joined', {
            'queue': queue
        }, to=queue_key, broadcast=True)
    
    @authenticated_only
    def on_leave(self):
        if not game_queue.is_player_in_queue(current_user.id) or not 'queue' in session:
            return send('You have to be in the queue to leave it!')
        key = session.pop('queue')
        game_queue.leave_queue(current_user.id, key)
        queue = game_queue.get_queue(key)
        emit('queue_left', {
            'queue': queue
        }, to=key, broadcast=True)
        leave_room(key)