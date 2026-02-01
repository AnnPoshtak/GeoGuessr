import os
from dotenv import load_dotenv
from pathlib import Path
from redis import Redis

PROJECT_PATH = Path(__file__).resolve().parents[2]
ENV_PATH = Path(PROJECT_PATH) / "backend" / ".env"

load_dotenv(ENV_PATH)

class BaseConfig():
    SECRET_KEY = os.environ['SECRET_KEY']
    SESSION_COOKIE_HTTPONLY=True
    SESSION_COOKIE_SAMESITE='Strict'
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        user = os.environ['DB_USER']
        password = os.environ['DB_PASSWORD']
        host = os.environ['DB_HOST']
        port = os.environ['DB_PORT']
        dbname = os.environ['DB_NAME']
        return (
            f'postgresql+psycopg2://{user}:{password}'
            f'@{host}:{port}/{dbname}'
        )
    CORS_ORIGINS = {
        '/*': os.environ['CORS_ORIGINS']
    }
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
    FRONTEND_URL = os.environ['FRONTEND_URL'].rstrip('/')
    # An url for frontend oauth callback
    FRONTEND_OAUTH_CALLBACK_URL = f"{FRONTEND_URL}/oauth/callback/"
    # Flask session-related settings
    SESSION_TYPE = 'redis'
    # Game config
    SCORE_CALCULATION_SCALE = 300_000 # Distance after which score starts to drop drammatically, in metres
    MIN_PLAYERS = 2
    GAMEROOM_EXPIRY_TIME = 86400 # 24 hours
    STARTING_PLAYER_HEALTH = 5000

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    FLASK_ENV = 'DEVELOPMENT'

class TestingConfig(BaseConfig):
    TESTING = True
    FLASK_ENV = 'TESTING'