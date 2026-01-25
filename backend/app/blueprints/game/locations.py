from . import game_bp
from app.locations import EUROPE_LOCATIONS
import random
from flask import jsonify

@game_bp.route('/get_random_location/')
def get_random_location():
    location = random.choice(EUROPE_LOCATIONS)

    return jsonify(location)