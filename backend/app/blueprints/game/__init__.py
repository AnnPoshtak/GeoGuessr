from flask import Blueprint

game_bp = Blueprint('game', __name__)

from .locations import *