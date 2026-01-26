import pytest
import random
from flask import url_for, session

def test_random_location(client, mocker):
    loc1 = {
        'lat': 100,
        'lng': 200,
        'heding': 90
    }
    loc2 = loc1.copy()
    loc2['lat'] = 250
    mocker.patch.object(random, 'choice', return_value=loc2)
    mocker.patch('app.blueprints.game.locations.EUROPE_LOCATIONS', [loc1, loc2])
    resp = client.get(url_for('game.random_location'))

    assert resp.status_code == 200
    assert resp.get_json() == loc2

def test_submit_location_no_loc(client):
    resp = client.post(url_for('game.submit_location'), json={
        'heading': 17
    })

    assert resp.status_code == 400

def test_submit_location(client, mocker, app):
    loc1 = {
        'lat': 16.5,
        'lng': 15.6
    }
    guess = {
        'lat': 17.5,
        'lng': 22.6
    }
    mocker.patch('app.blueprints.game.locations.calculate_line_distance', return_value=15)
    mocker.patch('app.blueprints.game.locations.calculate_score', return_value=122)
    with app.test_request_context():
        with client.session_transaction() as sess:
            sess['location'] = loc1
        resp = client.post(url_for('game.submit_location'), json={
            'guess': guess
        })

    assert resp.status_code == 200
    assert resp.get_json()['distance'] == 15
    assert resp.get_json()['score'] == 122
    assert resp.get_json()['guess'] == guess
    assert resp.get_json()['actual_location'] == loc1