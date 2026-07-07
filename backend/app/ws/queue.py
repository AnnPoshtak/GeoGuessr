from app.core import validate_player_count
from flask import current_app
from flask_socketio import Namespace, emit, join_room, leave_room, close_room, send
from flask_login import current_user
from .util import authenticated_only
from app import game_queue
from apscheduler.jobstores.base import JobLookupError
from app.core.scheduler import scheduler
from .util import join_game_currently_in
import datetime
from app.config import settings
from app.core.scheduler import send_queue_leave_event

class QueueNamespace(Namespace):
    @authenticated_only
    def on_connect(self):
        job_name = f'send_queue_leave_event:{current_user.id}'
        if scheduler.get_job(job_name):
            try:
                scheduler.remove_job(job_name)
            except JobLookupError as e:
                current_app.logger.info(f'An error occured when trying to remove job {job_name}: {e}', exc_info=False)
        join_game_currently_in()
    
    def on_disconnect(self, reason):
        if not current_user.is_authenticated:
            return
        run_time = datetime.datetime.now() + datetime.timedelta(seconds=settings.leave_queue_event_interval)
        scheduler.add_job(
            f'send_queue_leave_event:{current_user.id}',
            send_queue_leave_event, 
            args=(current_user.id,),
            next_run_time=run_time,
            coalesce=True,
            max_instances=1,
            replace_existing=True
        )

    @authenticated_only
    def on_fetch_queue(self):
        queue = game_queue.get_player_queue(current_user.id)
        if not queue:
            return
        return {
            'key': queue,
            'players': game_queue.get_queue(queue),
            'player_count': int(queue.split(':')[-1])
        }

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
        join_room(queue_key)
        queue = game_queue.get_queue(player_count)
        if game_key:
            emit('game_started', {
                'game_key': game_key
            }, to=queue_key)
            return close_room(queue_key)
        
        emit('queue_joined', {
            'queue': queue
        }, to=queue_key)
    
    @authenticated_only
    def on_leave(self):
        if not game_queue.is_player_in_queue(current_user.id):
            return send('You have to be in the queue to leave it!')
        key = game_queue.get_player_queue(current_user.id)
        game_queue.leave_queue(current_user.id, key)
        queue = game_queue.get_queue(key)
        emit('queue_left', {
            'queue': queue
        }, to=key)
        leave_room(key)