from app.core import validate_player_count, game_queue, game_room
from app.core.scheduler import scheduler
from .util import join_game_currently_in, safe_remove_job, get_user_by_sid, save_user_session
from app.models import UserModel
import datetime
from app.config import settings, logger
from app.core.scheduler import send_queue_leave_event
import socketio
from . import sio

class QueueNamespace(socketio.AsyncNamespace):
    async def on_connect(self, sid: str, environ, auth: str):
        user = await save_user_session(sid, auth, '/queue')
        if not user:
            await sio.disconnect(sid)
            return
        safe_remove_job(f'send_queue_leave_event:{user.firebase_uid}')
        await join_game_currently_in(sid, '/queue')
    
    async def on_disconnect(self, sid: str, reason=None):
        try:
            current_user: UserModel = await get_user_by_sid(sid, '/queue')
        except Exception as e:
            logger.error(f'User not found: {e}')
            return
        
        if not current_user:
            return

        queue = await game_queue.get_player_queue(current_user.firebase_uid)
        if not queue:
            return

        run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=settings.leave_queue_event_interval)
        scheduler.add_job(
            send_queue_leave_event,
            args=(current_user.firebase_uid,),
            id=f'send_queue_leave_event:{current_user.firebase_uid}',
            next_run_time=run_time,
            replace_existing=True
        )
        async with sio.session(sid, namespace='/queue') as session:
            session.clear()

    async def on_fetch_queue(self, sid: str):
        current_user: UserModel = await get_user_by_sid(sid, '/queue')
        queue = await game_queue.get_player_queue(current_user.firebase_uid)
        if not queue:
            return
        q = await game_queue.get_queue(queue)
        return {
            'players': q,
            'player_count': int(queue.split(':')[-1])
        }

    async def on_join(self, sid: str, data: dict = {}):
        current_user: UserModel = await get_user_by_sid(sid, '/queue')
        if not data: 
            return
        if not current_user:
            return
        if not 'player_count' in data:
            return await sio.send('Please select the queue you wish to join', namespace='/queue')
        if await game_queue.is_player_in_queue(current_user.firebase_uid):
            return await sio.send('You have already joined the queue', namespace='/queue')
        if await game_room.get_current_game(current_user.firebase_uid):
            return await sio.send("You can't join a queue when you are in active game", namespace='/queue')
        try:
            player_count = int(data['player_count'])
            validate_player_count(player_count)
        except ValueError:
            return await sio.send('You have tried to join the wrong queue!', namespace='/queue')
        game_key = await game_queue.join_queue(current_user.firebase_uid, player_count)
        key = game_queue.get_queue_key(player_count)
        await sio.enter_room(sid, key, namespace=self.namespace)
        q = await game_queue.get_queue(key)
        if game_key:
            await sio.emit('game_started', {
                'game_key': game_key
            }, to=key, namespace='/queue')
            return await sio.close_room(key, namespace='/queue')
        
        await sio.emit('queue_joined', {
            'queue': q
        }, to=key, namespace='/queue')
    
    async def on_leave(self, sid: str):
        current_user: UserModel = await get_user_by_sid(sid, '/queue')
        if not await game_queue.is_player_in_queue(current_user.firebase_uid):
            return
        key = await game_queue.get_player_queue(current_user.firebase_uid)
        await game_queue.leave_queue(current_user.firebase_uid, key)
        q = await game_queue.get_queue(key)
        await sio.emit('queue_left', {
            'queue': q
        }, to=key, namespace='/queue')
        await sio.leave_room(sid, key, namespace='/queue')
