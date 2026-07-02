import pytest
import uuid
from app import app_redis, game_room
from app.config import settings

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
    game_key = game_room.create_game(players)
    assert game_key == f'gameroom:{game_uuid.hex}'
    game = app_redis.json().get(game_key)
    assert game['location'] == loc
    assert game['id'] == game_uuid.hex
    assert app_redis.ttl(game_key) == settings.gameroom_expiry_time

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
    game_key = f"gameroom:{test_game_room['id']}"
    h = app_redis.json().get(f"{game_key}:teams:red", 'health')
    with app.app_context():
        assert h == settings.starting_player_health
    game_room.set_team_health(game_key, 'red', 2000)
    h = app_redis.json().get(f"{game_key}:teams:red", 'health')
    assert h == 2000

def test_move_next_round(test_game_room, mocker):
    game_key = f"gameroom:{test_game_room['id']}"
    players = game_room.get_player_ids(game_key)
    players = game_room.get_player_ids(game_key)
    guess = {
        "lat": 12, 
        "lng": 15, 
    }
    app_redis.json().set(f'{game_key}:players:{players[0]}', '$.guess', guess)
    assert app_redis.json().get(game_key, 'round') == 1
    assert app_redis.json().get(game_key, 'location') == test_game_room['location']
    loc = {
        "lat": 15, 
        "lng": 16, 
        "heading": 120
    }
    mocker.patch('app.core.game_room.get_random_location', return_value=loc)
    game_room.move_next_round(game_key)
    assert app_redis.json().get(game_key, 'round') == 2
    assert app_redis.json().get(game_key, 'location') == loc
    assert app_redis.json().get(f'{game_key}:players:{players[0]}', 'guess') is None \
        or app_redis.json().get(f'{game_key}:players:{players[0]}', 'guess') == 'null'

def test_end_game(test_game_room, mocker):
    game_key = f"gameroom:{test_game_room['id']}"
    player_ids = game_room.get_player_ids(game_key)
    assert app_redis.json().get(game_key) is not None
    game_room.end_game(game_key)
    assert app_redis.json().get(game_key) is None
    for p in player_ids:
        assert app_redis.json().get(f"{game_key}:players:{p}") is None

def test_update_game_expiry(test_game_room, app):
    game_key = f"gameroom:{test_game_room['id']}"
    assert app_redis.ttl(game_key) == settings.gameroom_expiry_time
    app_redis.expire(game_key, 200)
    game_room.update_game_expiry(game_key)
    with app.app_context():
        assert app_redis.ttl(game_key) == settings.gameroom_expiry_time