from flask import Blueprint, jsonify
from flask_wtf.csrf import generate_csrf

csrf_bp = Blueprint('csrf', __name__)

@csrf_bp.route('/')
def csrf():
    return jsonify({
        'csrf': generate_csrf()
    })