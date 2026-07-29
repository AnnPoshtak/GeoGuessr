import pytest
from flask_socketio.test_client import SocketIOTestClient
from app import socketio

@pytest.fixture
def socket_client(app, client):
    c = socketio.test_client(app, flask_test_client=client)
    yield c
    c.disconnect()