from pydantic import BaseModel, ConfigDict

from .users import UserStatsSchema


class MapLocation(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra='ignore')

    lat: float
    lng: float


class StreetViewLocation(MapLocation):
    heading: int


class SubmitLocationResponse(BaseModel):
    guess: MapLocation
    target: MapLocation
    distance: float
    score: float

class CreatePlayer(BaseModel):
    firebase_uid: str
    team: str

class FullPlayerDataSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    stats: UserStatsSchema | None = None
    team: str
    guess: MapLocation | None = None
    is_connected: bool | None = None