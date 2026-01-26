import pytest
from app.util import *

def test_calculate_line_distance():
    loc1 = {
        "lat": 48.8566,
        "lng": 2.3522
    }

    loc2 = {
        "lat": 52.52,
        "lng": 13.4050
    }
    exp_res = 877464
    assert math.ceil(calculate_line_distance(loc1, loc2)) == exp_res

def test_calculate_score():
    dist = 0
    res = calculate_score(dist)
    assert res == 1000

    dist = 600 * 1000
    res = calculate_score(dist)
    assert res == 180
    
    dist = 950.47 * 1000
    res = calculate_score(dist)
    assert res == 66
    