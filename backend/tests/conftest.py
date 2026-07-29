import os
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
os.environ['CORS_ORIGINS'] = 'http://localhost:3000'
os.environ['FRONTEND_URL'] = 'http://localhost:3000'
os.environ['GOOGLE_CLIENT_ID'] = 'test-google-client-id'
os.environ['GOOGLE_CLIENT_SECRET'] = 'test-google-client-secret'
os.environ['REDIS_URL'] = 'redis://localhost:6379/3'
import pytest
from unittest.mock import patch
from app import create_app
from app.config import TestingConfig

@pytest.fixture(scope='session')
def app():
    app = create_app(TestingConfig)
    app.config['SERVER_NAME'] = 'localhost:5000'

    yield app

@pytest.fixture(scope='session')
def client(app):
    yield app.test_client()

@pytest.fixture(autouse=True)
def reset_db(app):
    from app import db
    # Setups db and drops it after each test, so tests can run in isolation
    with app.app_context():
        db.create_all()
        yield 
        db.session.remove()
        db.drop_all()

@pytest.fixture(autouse=True)
def reset_redis():
    from app import app_redis, session_redis
    yield
    app_redis.flushdb()
    session_redis.flushdb()