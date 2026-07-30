from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserStatsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_score: int
    user_id: int


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str = Field(..., min_length=1, max_length=255)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    stats: UserStatsSchema | None = None


class UserPublicSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    stats: UserStatsSchema | None = None
