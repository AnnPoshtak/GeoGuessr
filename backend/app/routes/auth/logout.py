from flask_login import logout_user
from flask import jsonify
from . import auth_bp

@auth_bp.route('/logout/')
def logout():
    logout_user()
    return jsonify(status_code=200)