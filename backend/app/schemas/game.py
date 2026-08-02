from pydantic import BaseModel, ConfigDict

from .users import UserStatsSchema


class MapLocation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lat: float
    lng: float


class StreetViewLocation(MapLocation):
    heading: int


class GuessSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lat: float
    lng: float

class SubmitLocationResponse(BaseModel):
    guess: MapLocation
    target: MapLocation
    distance: float
    score: float


class PlayerGameDataSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team: str
    guess: GuessSchema | None = None


class FullPlayerDataSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    stats: UserStatsSchema | None = None
    team: str
    guess: GuessSchema | None = None
    is_connected: bool | None = None