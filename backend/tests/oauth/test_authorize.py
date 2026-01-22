import pytest
from flask import url_for
from flask_login import login_user
from app.factories import UserFactory
from urllib.parse import quote_plus

def test_authorize_wrong_provider(client):
    resp = client.get(url_for('oauth.oauth_authorize', provider='gitlab'))

    assert resp.status_code == 404

def test_authorize_authenticated(client, app):
    u = UserFactory()
    with app.test_request_context():
        login_user(u)
    resp = client.get(url_for('oauth.oauth_authorize', provider='google'))

    assert resp.status_code == 302

def test_authorize_redirect(client):
    resp = client.get(url_for('oauth.oauth_authorize', provider='google'))
    redirect_uri = quote_plus(url_for('oauth.oauth_callback', provider='google', _external=True))
    assert resp.status_code == 302
    assert redirect_uri in resp.location