import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from app.factories import UserFactory
from app.core.scheduler import scheduler
from flask_login import login_user
from app import game_room, game_queue
from app.ws.util import join_game_currently_in

def test_queue_join_empty(socket_client, mocker, app):
    mocker.patch.object(game_queue, 'join_queue', return_value=None)
    mocker.patch.object(game_queue, 'get_queue_key', return_value='testqueue')
    u = UserFactory()
    mocker.patch.object(game_queue, 'get_queue', return_value=[u.firebase_uid])
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 2,
    }, namespace='/queue')
    assert 'queue_joined' == socket_client.get_received('/queue')[0]['name']

def test_queue_join_empty_no_args(socket_client, mocker, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('join', namespace='/queue')
    assert len(socket_client.get_received('/queue')) == 0

def test_queue_join_wrong_player_count_type(socket_client, mocker, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 'string'
    }, namespace='/queue')
    assert socket_client.get_received('/queue')[0]['args'] == 'You have tried to join the wrong queue!'

def test_queue_join_wrong_player_count(socket_client, mocker, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 16
    }, namespace='/queue')
    assert socket_client.get_received('/queue')[0]['args'] == 'You have tried to join the wrong queue!'

def test_queue_join_in_game(socket_client, mocker, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    game_key = 'test'
    mocker.patch.object(game_room, 'get_current_game', return_value=game_key)
    mocker.patch.object(game_room, 'get_player', return_value={
        'team': 'test'
    })
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 2
    }, namespace='/queue')
    resp = socket_client.get_received('/queue')
    assert len(resp) == 2
    assert resp[0]['name'] == 'game_joined'
    assert resp[1]['name'] == 'message'
    assert resp[1]['args'] == "You can't join a queue when you are in active game"

def test_queue_join_non_empty(socket_client, mocker, app):
    mocker.patch.object(game_queue, 'join_queue', return_value='test')
    mocker.patch.object(game_queue, 'get_queue_key', return_value='testqueue')
    u = UserFactory()
    mocker.patch.object(game_queue, 'get_queue', return_value=[u.firebase_uid])
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 2,
    }, namespace='/queue')
    resp = socket_client.get_received('/queue')[0]
    assert resp['name'] == 'game_started'
    assert resp['args'][0]['game_key'] == 'test'

def test_queue_join_leave(socket_client, mocker, app, client):
    leave_spy = mocker.spy(game_queue, 'leave_queue')
    u = UserFactory()
    mocker.patch.object(game_queue, 'get_queue', return_value=[])
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('join', {'player_count': 2}, namespace='/queue')
    socket_client.emit('leave', namespace='/queue')
    resp = socket_client.get_received('/queue')
    assert 'queue_joined' == resp[0]['name']
    assert 'queue_left' == resp[1]['name']
    assert leave_spy.call_count == 1
    assert resp[1]['args'][0]['queue'] == []

def test_queue_leave_in_game(socket_client, app, client):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('leave', namespace='/queue')
    assert socket_client.get_received('/queue')[0]['args'] == 'You have to be in the queue to leave it!'

def test_queue_leave_player_not_in_queue(socket_client, mocker, app, client):
    mocker.patch.object(game_queue, 'is_player_in_queue', return_value=False)
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('leave', namespace='/queue')
    assert socket_client.get_received('/queue')[0]['args'] == 'You have to be in the queue to leave it!'

def test_queue_leave_success(socket_client, mocker, app):
    mocker.patch.object(game_queue, 'is_player_in_queue', return_value=True)
    u = UserFactory()
    mocker.patch.object(game_queue, 'get_queue', return_value=[])
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('leave', namespace='/queue')
    resp = socket_client.get_received('/queue')
    assert len(resp) == 0

def test_queue_quick_reconnect(socket_client, mocker, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    game_key = 'test'
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 2
    }, namespace='/queue')
    mocker.patch.object(game_queue, 'get_player_queue', return_value=game_key)
    socket_client.disconnect('/queue')
    assert scheduler.get_job(f'send_queue_leave_event:{u.firebase_uid}')
    socket_client.connect('/queue')
    assert not scheduler.get_job(f'send_queue_leave_event:{u.firebase_uid}')

    resp = socket_client.get_received('/queue')
    assert len(resp) == 1 # Only queue_joined should be emitted back to player
    assert resp[0]['name'] == 'queue_joined'
    assert resp[0]['args'][0]['queue'] == [u.firebase_uid]


@pytest.mark.asyncio
async def test_join_game_currently_in_handles_missing_player(mocker):
    sid = 'sid'
    current_user = SimpleNamespace(firebase_uid='user-1')
    mocker.patch('app.ws.util.get_user_by_sid', new=AsyncMock(return_value=current_user))
    mocker.patch.object(game_room, 'get_current_game', return_value='game-1')
    mocker.patch.object(game_room, 'get_player', return_value=None)
    mocker.patch('app.ws.util.join_game', new=AsyncMock(return_value=None))
    mocker.patch('app.ws.util.safe_remove_job')
    mocker.patch('app.ws.util.sio.emit', new=AsyncMock(return_value=None))
    mocker.patch.object(game_room, 'set_player_key')

    result = await join_game_currently_in(sid, '/queue')

    assert result is True