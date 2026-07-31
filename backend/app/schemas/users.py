from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    firebase_uid: str
    username: str

class UserStatsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_score: int
    user_id: int

class UserPublicSchema(UserSchema):
    model_config = ConfigDict(from_attributes=True)

    stats: UserStatsSchema | None = None
    created_at: datetime
    updated_at: datetime
