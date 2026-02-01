import random
from app.locations import EUROPE_LOCATIONS

def get_random_location() -> dict:
    return random.choice(EUROPE_LOCATIONS)