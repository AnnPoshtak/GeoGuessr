from app.core.util import validate_player_count
from flask import current_app
import random
import numpy as np
from redis import Redis

class RedisRepository:
    '''
    A base class used to represent a Repository for certain object inside
    redis. For example, game queue or game room.
    '''
    def __init__(self, redis: Redis, key: str):
        if not redis:
            raise ValueError('Redis instance has to be provided!')
        self.redis = redis
        if not key:
            raise ValueError('key has to be provided!')
        self.key = key
    
    def _is_null(self, val) -> bool:
        return val is None or val == 'null'