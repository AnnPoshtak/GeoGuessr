import random
from app.locations import EUROPE_LOCATIONS
from app.config import settings
import math

def get_random_location() -> dict:
    return random.choice(EUROPE_LOCATIONS)

def validate_player_count(player_count: int) -> None:
    if not player_count in settings.game_playercount:
        raise ValueError(f'Wrong player count. Valid ones are: {settings.game_playercount}')

def calculate_line_distance(loc1: dict, loc2: dict) -> float:
    EARTH_RAD = 6371 * 1000
    lat1 = math.radians(loc1['lat'])
    lng1 = math.radians(loc1['lng'])

    lat2 = math.radians(loc2['lat'])
    lng2 = math.radians(loc2['lng'])

    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    a = math.sin(d_lat / 2) ** 2 +\
        math.cos(lat1) * math.cos(lat2) *\
        math.sin(d_lng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), 
                       math.sqrt(1 - a))
    dist = EARTH_RAD * c
    return dist

def calculate_score(distance: float, scale: int = None) -> int:
    if not scale:
        scale = settings.score_calculation_scale
    if scale < 1:
        raise ValueError('Scale must be bigger than zero')
    MAX_SCORE = 1000

    score = MAX_SCORE * math.exp(-distance / scale)
    return max(0, round(score))