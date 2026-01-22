from flask_login import current_user
from app.schemas import user_schema
from flask import abort
from . import users_bp

@users_bp.route('/me/')
def me():
    if not current_user.is_authenticated:
        return abort(401)

    return user_schema.dump(current_user)