from fastapi import APIRouter
from app.dependencies import CurrentUserDep
from app.schemas import UserPublicSchema

router = APIRouter(tags=['users'])


@router.get('/me/')
def me(current_user: CurrentUserDep) -> UserPublicSchema:
    # Serialize SQLAlchemy user model to pydantic-friendly dict
    return UserPublicSchema.model_validate(current_user).model_dump()