import pytest
from app.core.util import *

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
    res1 = calculate_score(dist)
    assert res1 == 1000

    dist = 600 * 1000
    res2 = calculate_score(dist)
    assert res2 < res1
    
    dist = 950.47 * 1000
    res3 = calculate_score(dist)
    assert res3 < res1
    