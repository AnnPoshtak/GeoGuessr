import random
from app.locations import EUROPE_LOCATIONS
from flask import current_app

def get_random_location() -> dict:
    return random.choice(EUROPE_LOCATIONS)

def validate_player_count(player_count: int) -> None:
     with current_app.app_context():
            if not player_count in current_app.config['GAME_PLAYERCOUNT']:
                raise ValueError(f'Wrong player count. Valid ones are: {current_app.config["GAME_PLAYERCOUNT"]}')