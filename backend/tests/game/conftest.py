import pytest
from app import app_redis, game_room

@pytest.fixture
def test_game_room(mocker):
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
    loc = {
        "lat": 46.3, 
        "lng": 46.4, 
        "heading": 269
    }
    mocker.patch('app.core.game_room.get_random_location', return_value=loc)
    game_key = game_room.create_game(players)
    return app_redis.json().get(game_key)