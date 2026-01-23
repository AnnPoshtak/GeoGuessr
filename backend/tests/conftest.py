import pytest
from app import create_app, db
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
    # Setups db and drops it after each test, so tests can run in isolation
    with app.app_context():
        db.create_all()
        yield 
        db.session.remove()
        db.drop_all()