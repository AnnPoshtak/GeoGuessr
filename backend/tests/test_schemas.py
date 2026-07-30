from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas import GuessSchema, StreetViewLocation, UserSchema


def test_user_schema_serializes_nested_stats():
    user = {
        "id": 1,
        "username": "alice",
        "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2024, 1, 2, tzinfo=timezone.utc),
        "stats": {"id": 2, "total_score": 42, "user_id": 1},
    }

    payload = UserSchema.model_validate(user).model_dump(mode="json")

    assert payload["username"] == "alice"
    assert payload["stats"]["total_score"] == 42
    assert payload["created_at"] == "2024-01-01T00:00:00+00:00"


def test_guess_schema_rejects_invalid_payload():
    with pytest.raises(ValidationError):
        GuessSchema.model_validate({"lat": "bad", "lng": 12.3})


def test_street_view_location_requires_heading():
    with pytest.raises(ValidationError):
        StreetViewLocation.model_validate({"lat": 1.0, "lng": 2.0})
