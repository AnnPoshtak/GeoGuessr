import pytest
from app import app_redis, game_queue
import uuid
import random

    
def test_game_queue_join_empty(app):
    key = 'gamequeue:2'
    assert app_redis.llen(key) == 0
    with app.test_request_context():
        game_queue.join_queue(1, 2)
    assert int(app_redis.lpop(key)) == 1

def test_game_queue_join_game_start(mocker, app):
    key = 'gamequeue:2'
    game_key = uuid.uuid4()
    app_redis.lpush(key, 1)
    mocker.patch.object(uuid, 'uuid4', return_value=game_key)
    with app.test_request_context():
        game_queue.join_queue(2, 2)
    game_key = f'gameroom:{game_key.hex}'
    assert app_redis.llen(key) == 0
    assert app_redis.json().get(game_key) is not None

def test_join_queue_while_in_another_queue(app):
    key1 = 'gamequeue:4'
    with app.test_request_context():
        game_queue.join_queue(1, 4)
    key2 = 'gamequeue:2'
    with app.test_request_context():
        game_queue.join_queue(1, 2)
    assert app_redis.llen(key1) == 1
    assert app_redis.llen(key2) == 0

def test_form_teams(mocker):
    teams = {
        0: 'team1',
        1: 'team2',
    }
    players = [12, 17]
    mocker.patch.object(random, 'shuffle', return_value=players)
    players = game_queue.form_teams(players, teams)
    assert len(players) == 2
    assert players[0]['team'] == teams[0]
    assert players[1]['team'] == teams[1]

def test_form_teams_uneven_player_count(mocker):
    teams = {
        0: 'team1',
        1: 'team2',
    }
    players = [12, 17, 6, 13, 19]
    mocker.patch.object(random, 'shuffle', return_value=players)
    players = game_queue.form_teams(players, teams)
    assert len(players) == 5
    assert players[0]['team'] == teams[0]
    assert players[1]['team'] == teams[0]
    assert players[2]['team'] == teams[0]
    assert players[3]['team'] == teams[1]
    assert players[4]['team'] == teams[1]

def test_form_teams_not_enough_players():
    players = [18]
    with pytest.raises(ValueError, match='At least two players are required to form teams!'):
        game_queue.form_teams(players, {})

def test_form_teams_not_teams():
    players = [18, 19]
    with pytest.raises(ValueError, match='At least two teams have to be provided!'):
        game_queue.form_teams(players, {})

def test_leave_queue(app):
    key = 'gamequeue:2'
    with app.test_request_context():
        game_queue.join_queue(1, 2)
    assert int(app_redis.lpop(key)) == 1
    game_queue.leave_queue(1, key)
    assert app_redis.llen(key) == 0

def test_is_player_in_queue(app):
    with app.test_request_context():
        game_queue.join_queue(1, 2)
    assert game_queue.is_player_in_queue(1)