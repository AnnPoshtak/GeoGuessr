import pytest
from app.core import GameRoom
from app import app_redis

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
    game_id = GameRoom.create_game(players)
    return app_redis.hgetall(game_id)