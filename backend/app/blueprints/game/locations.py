from . import game_bp
from app.locations import EUROPE_LOCATIONS
import random
from flask import jsonify, session, request, abort
from app.core.util import calculate_line_distance, calculate_score
from app.core.util import get_random_location
from flask_login import current_user

@game_bp.route('/random_location/')
def random_location():
    location = get_random_location()
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
    target = session.pop('location')
    distance = calculate_line_distance(target, data['guess'])
    score = calculate_score(distance)
    result = {
        'guess': data['guess'],
        'target': target,
        'distance': distance,
        'score': score
    }

    return jsonify(result)