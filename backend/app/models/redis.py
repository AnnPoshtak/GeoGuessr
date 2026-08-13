from aredis_om import JsonModel, Field
from ..schemas.game import MapLocation, StreetViewLocation
from pydantic import ConfigDict
from app.core import redis
from app.config import settings

class BaseJsonModel(JsonModel):
    model_config = ConfigDict(from_attributes=True)

    class Meta:
        database = redis

class Player(BaseJsonModel, index=True):
    firebase_uid: str = Field(index=True)
    team: str | None = Field(None, index=True)
    current_game: str | None = Field(None, index=True)
    guess: MapLocation | None = None
    is_connected: bool
    
class Team(BaseJsonModel, index=True):
    game: str = Field(index=True)
    players: list[Player]
    name: str = Field(index=True)
    health: int
    score: int
    distance: float

class GameRoom(BaseJsonModel, index=True):
    round: int
    target: StreetViewLocation
    multiplier: float
    temp_target: StreetViewLocation | None = Field(None)
    players: list[Player]
    teams: list[Team]
