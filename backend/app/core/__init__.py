from app.config import settings
from aredis_om import get_redis_connection

redis = get_redis_connection(url=settings.REDIS_OM_URL, decode_responses=True)

from .game_room import GameRoomRepository
from .util import get_random_location, validate_player_count
from .game_queue import GameQueueRepository

game_room = GameRoomRepository()
game_queue = GameQueueRepository(redis)

from .scheduler import scheduler