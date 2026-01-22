import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

class BaseConfig():
    SECRET_KEY = os.environ['SECRET_KEY']
    SESSION_COOKIE_HTTPONLY=True
    SESSION_COOKIE_SAMESITE='Lax'
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

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    FLASK_ENV = 'DEVELOPMENT'

class TestingConfig(BaseConfig):
    TESTING = True
    FLASK_ENV = 'TESTING'
    WTF_CSRF_ENABLED = False