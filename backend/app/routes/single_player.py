from app.core.util import calculate_line_distance, calculate_score
from app.core.util import get_random_location
from fastapi import Request, APIRouter, HTTPException, status
from app.schemas import StreetViewLocation, MapLocation, SubmitLocationResponse

router = APIRouter(tags=['single_player'])


@router.get('/random_location/')
def random_location(request: Request) -> StreetViewLocation:
    location = get_random_location()
    request.session['location'] = location.model_dump(mode='json')

    return location


@router.post('/submit_location/')
def submit_location(request: Request, location: MapLocation) -> SubmitLocationResponse:
    data = location.model_dump()
    if not request.session.get('location'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No map location was generated!')
    target = request.session.pop('location')
    distance = calculate_line_distance(target, data)
    score = calculate_score(distance)
    result = {
        'guess': data,
        'target': target,
        'distance': distance,
        'score': score,
    }

    return result