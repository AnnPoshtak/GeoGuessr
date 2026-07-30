from flask_login import current_user
from app.schemas import UserSchema
from flask import abort
from . import users_bp


@users_bp.route('/me/')
def me():
    if not current_user.is_authenticated:
        return abort(401)

    return UserSchema().model_dump(current_user, mode='json')