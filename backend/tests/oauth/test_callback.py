import pytest
from flask import url_for
from flask_login import login_user, current_user
from app.factories import UserFactory, UserModel
from app import oauth

def test_callback_wrong_provider(client):
    resp = client.get(url_for('oauth.oauth_callback', provider='gitlab'))

    assert resp.status_code == 302
    assert 'error' in resp.location

def test_callback_authenticated(client, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    resp = client.get(url_for('oauth.oauth_callback', provider='google'))

    assert resp.status_code == 302

class MockOAuthClient():
    def authorize_access_token(): pass
    def get(url: str): pass

class MockUserInfoResponse():
    def raise_for_status(): pass
    def json(): pass

def test_callback_create_user(client, app, mocker):
    mocker.patch.object(oauth, 'create_client', return_value=MockOAuthClient)
    mocker.patch.object(MockOAuthClient, 'get', return_value=MockUserInfoResponse)
    mocker.patch.object(MockUserInfoResponse, 'json', return_value={
        'email': 'johndoe@gmail.com'
    })
    with app.test_request_context():
        resp = client.get(url_for('oauth.oauth_callback', provider='google'))
        assert resp.status_code == 302
        assert app.config['FRONTEND_OAUTH_CALLBACK_URL'] in resp.location
        assert UserModel.query.filter_by(username='johndoe@gmail.com').first()
        assert current_user.is_authenticated