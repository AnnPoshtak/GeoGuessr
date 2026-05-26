import os
from dotenv import load_dotenv
from pathlib import Path
from redis import Redis

PROJECT_PATH = Path(__file__).resolve().parents[2]
ENV_PATH = Path(PROJECT_PATH) / "backend" / ".env"

load_dotenv(ENV_PATH)

class BaseConfig():
    SECRET_KEY = os.environ['SECRET_KEY']
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax' # Set to Lax from Strict because OAuth will not work otherwise
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URI']
    CORS_ORIGINS = [os.environ['CORS_ORIGINS'].strip("'\"")]
    OAUTH_PROVIDERS = {
        'google': {
            'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
            'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
            'authorize_url': 'https://accounts.google.com/o/oauth2/v2/auth',
            'access_token_url': 'https://oauth2.googleapis.com/token',
            'api_base_url': 'https:/googleapis.com/',
            'userinfo': {
                'url': 'https://www.googleapis.com/oauth2/v3/userinfo',
                # This field exists because different oauth providers give different emails, i.e. github 
                # provides you with a list of emals attached to an account
                'email': lambda json: json['email'],
            },
            'scopes': ['email']
        },
    }
    FRONTEND_URL = os.environ['FRONTEND_URL']
    # An url for frontend oauth callback
    FRONTEND_OAUTH_CALLBACK_URL = f"{FRONTEND_URL}/oauth/callback/"
    # Flask session-related settings
    SESSION_TYPE = 'redis'
    # Game config
    SCORE_CALCULATION_SCALE = 300_000 # Distance after which score starts to drop drammatically, in metres
    MIN_PLAYERS = 2
    GAMEROOM_EXPIRY_TIME = 86400 # 24 hours
    # TODO: sync this config option with frontend
    STARTING_PLAYER_HEALTH = 200
    ROUND_HEALTH_MULTIPLIER = 0.5 # The damage equals to score_diff * round * this multiplier
    GAME_PLAYERCOUNT = (2, 4)
    GAME_TEAMS = {
        0: 'red',
        1: 'blue'
    }
    
    REDIS_URL = os.environ['REDIS_URL']

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    FLASK_ENV = 'DEVELOPMENT'

class TestingConfig(BaseConfig):
    TESTING = True
    FLASK_ENV = 'TESTING'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'