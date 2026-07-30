from . import oauth_bp
from flask import abort, redirect, session, url_for
from flask_login import current_user
from app import oauth
from app.config import settings

@oauth_bp.route('/authorize/<provider>/')
def oauth_authorize(provider):
    if not provider in settings.OAUTH_PROVIDERS:
        return abort(404)
    
    if current_user.is_authenticated:
        return redirect(settings.FRONTEND_URL)
    
    redirect_uri = url_for('oauth.oauth_callback', provider=provider, _external=True)
    client = oauth.create_client(provider)
    return client.authorize_redirect(redirect_uri=redirect_uri)