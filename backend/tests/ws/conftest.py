import pytest
from flask_socketio.test_client import SocketIOTestClient
from app import socketio

@pytest.fixture(scope='module')
def socket_client(app, client):
    yield socketio.test_client(app, flask_test_client=client)