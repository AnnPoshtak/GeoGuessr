import pytest
import random
from flask import url_for

def test_get_random_location(client, mocker):
    loc1 = {
        'lat': 100,
        'lng': 200,
        'heding': 90
    }
    loc2 = loc1.copy()
    loc2['lat'] = 250
    mocker.patch.object(random, 'choice', return_value=loc2)
    mocker.patch('app.blueprints.game.locations.EUROPE_LOCATIONS', [loc1, loc2])
    resp = client.get(url_for('game.get_random_location'))

    assert resp.status_code == 200
    assert resp.get_json() == loc2