from . import game_bp
from app.locations import EUROPE_LOCATIONS
import random
from flask import jsonify, session, request, abort
from app.util import calculate_line_distance, calculate_score

@game_bp.route('/random_location/')
def random_location():
    location = random.choice(EUROPE_LOCATIONS)

    session['location'] = location

    return jsonify(location)

@game_bp.route('/submit_location/', methods=['POST'])
def submit_location():
    data = request.get_json()
    if not 'guess' in data:
        return abort(400)
    if not 'lat' in data['guess'] or not 'lng' in data['guess']:
        return abort(400)
    if not session.get('location'):
        return abort(400)
    target_loc = session.pop('location')
    distance = calculate_line_distance(target_loc, data['guess'])
    score = calculate_score(distance)
    result = {
        'guess': data['guess'],
        'target_location': target_loc,
        'distance': distance,
        'score': score
    }

    return jsonify(result)