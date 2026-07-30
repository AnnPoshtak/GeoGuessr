from redis import Redis

from app.config import settings

from .game_room import GameRoomRepository
from .util import get_random_location, validate_player_count
from .game_queue import GameQueueRepository
from .scheduler import scheduler

redis_client = Redis.from_url(settings.REDIS_URL)

game_queue = GameQueueRepository(redis_client)
game_room = GameRoomRepository(redis_client)