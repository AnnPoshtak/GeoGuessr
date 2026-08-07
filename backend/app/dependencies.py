import asyncio
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from fastapi.security import HTTPBearer
from firebase_admin import auth
from firebase_admin.auth import (
    InvalidIdTokenError,
    ExpiredIdTokenError,
    RevokedIdTokenError,
    CertificateFetchError,
    UserDisabledError,
)
from app.db import SessionLocal
from app.models import UserModel
from app.firebase import firebase
from app.config import logger

async def get_or_create_user_from_token(token: dict) -> UserModel:
    try:
        u: auth.UserRecord = await asyncio.to_thread(auth.get_user_by_email, token["email"])
    except auth.UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Firebase user not found"
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error",
        ) from e
    async with SessionLocal() as session:
        statement = select(UserModel).where(
            or_(UserModel.firebase_uid == u.uid, UserModel.email == u.email)
        ).options(selectinload(UserModel.stats))
        user = await session.scalar(statement)
        if user:
            return user

        if not u.display_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is null!"
            )
        user = UserModel(firebase_uid=u.uid, username=u.display_name, email=u.email)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        await session.refresh(user, attribute_names=["stats"])
        return user

async def get_current_user(
    token: Annotated[HTTPBearer | str, Depends(HTTPBearer())]
) -> UserModel:
    try:
        # If using http
        if hasattr(token, "credentials"):
            token = auth.verify_id_token(token.credentials, firebase)
        # If using websockets
        else:
            token = auth.verify_id_token(token, firebase)
            
        user = await get_or_create_user_from_token(token)
    except (
        ValueError,
        InvalidIdTokenError,
        ExpiredIdTokenError,
        RevokedIdTokenError,
        CertificateFetchError,
        UserDisabledError,
    ) as e:
        logger.error(f'An error occured on login {e}')
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid id token!")
    return user

async def get_user(identifier: str | int):
    async with SessionLocal() as session:
        statement = select(UserModel).where(
            or_(UserModel.firebase_uid == identifier, UserModel.email == identifier)
        ).options(selectinload(UserModel.stats))
        user = await session.scalar(statement)

        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found!")
        return user

current_user_dependency = Depends(get_current_user)
CurrentUserDep = Annotated[UserModel, current_user_dependency]
