import math

def calculate_line_distance(loc1: dict, loc2: dict) -> float:
    '''
    Calculates and returns distance between `loc1` and `loc2` using
    Haversine formula
    https://en.wikipedia.org/wiki/Haversine_formula
    
    :param loc1: A dictionary representing location on Earth with lattitude and longtitude keys
    :param loc2: A dictionary representing location on Earth with lattitude and longtitude keys
    :return: Shortest distance between loc1 and loc2
    :rtype: float
    '''
    EARTH_RAD = 6371 * 1000 # in metres
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

def calculate_score(distance: float, scale=350_000) -> int:
    '''
    Calculates score based on distance between guess and actual location.
    The smaller the distance, the bigger the score.
    
    :param distance: distance between guess and actual location, in metres
    :param scale: the distance at which score starts to drop a lot, in metres
    :return: Score awarded for the guess
    :rtype: int
    '''
    MAX_SCORE = 1000

    score = MAX_SCORE * math.exp(-distance / scale)
    return max(0, round(score))