import pytest
from app.core import GameQueueRepository
from app.factories import UserFactory
from flask_login import login_user
from app import game_room
import json

def test_queue_join_empty(socket_client, mocker, app):
    mocker.patch.object(GameQueueRepository, 'join_queue', return_value=None)
    mocker.patch.object(GameQueueRepository, 'get_queue_key', return_value='testqueue')
    u = UserFactory()
    mocker.patch.object(GameQueueRepository, 'get_queue', return_value=[u.id])
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

def test_queue_join_in_game(socket_client, client, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    game_room.join_game(u.id, 'test')
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 2
    }, namespace='/queue')
    assert len(socket_client.get_received('/queue')) == 1

def test_queue_join_non_empty(socket_client, mocker, app):
    mocker.patch.object(GameQueueRepository, 'join_queue', return_value='test')
    mocker.patch.object(GameQueueRepository, 'get_queue_key', return_value='testqueue')
    u = UserFactory()
    mocker.patch.object(GameQueueRepository, 'get_queue', return_value=[u.id])
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('join', {
        'player_count': 2,
    }, namespace='/queue')
    resp = socket_client.get_received('/queue')[0]
    assert resp['name'] == 'game_started'
    assert resp['args'][0]['game_key'] == 'test'

def test_queue_leave(socket_client, mocker, app, client):
    leave_spy = mocker.spy(GameQueueRepository, 'leave_queue')
    mocker.patch.object(GameQueueRepository, 'is_player_in_queue', return_value=True)
    u = UserFactory()
    mocker.patch.object(GameQueueRepository, 'get_queue', return_value=[])
    with app.test_request_context():
        login_user(u)
        with client.session_transaction() as sess:
            sess['queue'] = 'test'
    socket_client.connect('/queue')
    socket_client.emit('join', {'player_count': 2}, namespace='/queue')
    socket_client.emit('leave', namespace='/queue')
    resp = socket_client.get_received('/queue')
    assert 'queue_left' == resp[1]['name']
    assert leave_spy.call_count == 1
    assert json.loads(resp[1]['args'][0]['queue']) == []

def test_queue_leave_in_game(socket_client, app, client):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
        with client.session_transaction() as sess:
            sess['game_key'] = 'test'
    socket_client.connect('/queue')
    socket_client.emit('leave', namespace='/queue')
    assert socket_client.get_received('/queue')[0]['args'] == 'You have to be in the queue to leave it!'

def test_queue_leave_player_not_in_queue(socket_client, mocker, app, client):
    mocker.patch.object(GameQueueRepository, 'is_player_in_queue', return_value=False)
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('leave', namespace='/queue')
    assert socket_client.get_received('/queue')[0]['args'] == 'You have to be in the queue to leave it!'

def test_queue_leave(socket_client, mocker, app):
    mocker.patch.object(GameQueueRepository, 'is_player_in_queue', return_value=True)
    u = UserFactory()
    mocker.patch.object(GameQueueRepository, 'get_queue', return_value=[])
    with app.test_request_context():
        login_user(u)
    socket_client.connect('/queue')
    socket_client.emit('leave', namespace='/queue')
    resp = socket_client.get_received('/queue')
    assert len(resp) == 0