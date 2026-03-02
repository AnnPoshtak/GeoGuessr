import pytest
import uuid
from app import app_redis, game_room
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
    game_id = game_room.create_game(players)
    assert game_id == f'gameroom:{game_uuid.hex}'
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
        game_room.create_game(players)
    
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
        game_room.create_game(players)

def test_set_team_health(test_game_room, app):
    game_id = f"gameroom:{test_game_room['id']}"
    h = app_redis.hget(f"{game_id}:teams:red", 'health')
    with app.app_context():
        assert int(h) == app.config['STARTING_PLAYER_HEALTH']
    game_room.set_team_health(game_id, 'red', 2000)
    h = app_redis.hget(f"{game_id}:teams:red", 'health')
    assert int(h) == 2000

def test_move_next_round(test_game_room, mocker):
    game_id = f"gameroom:{test_game_room['id']}"
    players = game_room.get_player_ids(game_id)
    players = game_room.get_player_ids(game_id)
    guess = {
        "lat": 12, 
        "lng": 15, 
    }
    app_redis.hset(f'{game_id}:players:{players[0]}', 'guess', json.dumps(guess))
    assert int(app_redis.hget(game_id, 'round')) == 1
    assert app_redis.hget(game_id, 'location') == test_game_room['location']
    loc = {
        "lat": 15, 
        "lng": 16, 
        "heading": 120
    }
    mocker.patch('app.core.game_room.get_random_location', return_value=loc)
    game_room.move_next_round(game_id)
    assert int(app_redis.hget(game_id, 'round')) == 2
    assert app_redis.hget(game_id, 'location') == json.dumps(loc)
    assert app_redis.hget(f'{game_id}:players:{players[0]}', 'guess') == json.dumps(None)

def test_end_game(test_game_room, mocker):
    game_id = f"gameroom:{test_game_room['id']}"
    player_ids = game_room.get_player_ids(game_id)
    assert app_redis.hgetall(game_id)
    game_room.end_game(game_id)
    assert not app_redis.hgetall(game_id)
    for p in player_ids:
        assert not app_redis.hgetall(f"{game_id}:players:{p}")

def test_update_game_expiry(test_game_room, app):
    game_id = f"gameroom:{test_game_room['id']}"
    assert app_redis.ttl(game_id) == app.config['GAMEROOM_EXPIRY_TIME']
    app_redis.expire(game_id, 200)
    game_room.update_game_expiry(game_id)
    with app.app_context():
        assert app_redis.ttl(game_id) == app.config['GAMEROOM_EXPIRY_TIME']