import pytest
from app.core.game_room import GameRoom
import uuid
from app import app_redis
import json

def test_game_create(mocker, app):
    players = [
        {
            'id': 1,
            'team': 'red'
        },
        {
            'id': 2,
            'team': 'blue'
        }
    ]
    game_uuid = uuid.uuid4()
    loc = {
        "lat": 46.3, 
        "lng": 46.4, 
        "heading": 269
    }
    mocker.patch.object(uuid, 'uuid4', return_value=game_uuid)
    mocker.patch('app.core.game_room.get_random_location', return_value=loc)
    game_id = GameRoom.create_game(players)
    assert game_id == f'game:{game_uuid.hex}'
    game = app_redis.hgetall(game_id)
    assert json.loads(game['location']) == loc
    assert game['id'] == game_uuid.hex
    assert app_redis.ttl( game_id) == app.config['GAMEROOM_EXPIRY_TIME']

def test_game_create_not_enough_players():
    players = [
        {
            'id': 1,
            'team': 'red'
        },
    ]
    with pytest.raises(ValueError):
        GameRoom.create_game(players)
    
def test_game_create_no_unique_teams():
    players = [
        {
            'id': 1,
            'team': 'red'
        },
        {
            'id': 2,
            'team': 'red'
        },
    ]
    with pytest.raises(ValueError):
        GameRoom.create_game(players)

def test_set_player_health(test_game_room, app):
    game_id = f"game:{test_game_room['id']}"
    players = GameRoom.get_player_ids(game_id)
    p1 = app_redis.hgetall(f"{game_id}:players:{players[0]}")
    with app.app_context():
        assert int(p1['health']) == app.config['STARTING_PLAYER_HEALTH']
    GameRoom.set_player_health(game_id, p1['id'], 2000)
    p1_health = app_redis.hget(f"{game_id}:players:{players[0]}", 'health')
    assert int(p1_health) == 2000

def test_move_next_round(test_game_room, mocker):
    game_id = f"game:{test_game_room['id']}"
    players = GameRoom.get_player_ids(game_id)
    players = GameRoom.get_player_ids(game_id)
    app_redis.hset(f'{game_id}:players:{players[0]}', 'submitted_guess', json.dumps(True))
    assert int(app_redis.hget(game_id, 'round')) == 1
    assert app_redis.hget(game_id, 'location') == test_game_room['location']
    loc = {
        "lat": 15, 
        "lng": 16, 
        "heading": 120
    }
    mocker.patch('app.core.game_room.get_random_location', return_value=loc)
    GameRoom.move_next_round(game_id)
    assert int(app_redis.hget(game_id, 'round')) == 2
    assert app_redis.hget(game_id, 'location') == json.dumps(loc)
    assert app_redis.hget(f'{game_id}:players:{players[0]}', 'submitted_guess') == json.dumps(False)

def test_end_game(test_game_room, mocker):
    game_id = f"game:{test_game_room['id']}"
    player_ids = GameRoom.get_player_ids(game_id)
    assert app_redis.hgetall(game_id)
    GameRoom.end_game(game_id)
    assert not app_redis.hgetall(game_id)
    for p in player_ids:
        assert not app_redis.hgetall(f"{game_id}:players:{p}")

def test_update_game_expiry(test_game_room, app):
    game_id = f"game:{test_game_room['id']}"
    assert app_redis.ttl(game_id) == app.config['GAMEROOM_EXPIRY_TIME']
    app_redis.expire(game_id, 200)
    GameRoom.update_game_expiry(game_id)
    with app.app_context():
        assert app_redis.ttl(game_id) == app.config['GAMEROOM_EXPIRY_TIME']