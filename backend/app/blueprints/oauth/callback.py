from . import oauth_bp
from flask import current_app, abort, redirect, session, request, url_for
from flask_login import current_user, login_user
from app.models import UserStatsModel, db, UserModel
from app import oauth

def _get_frontend_oauth_callback_url(status: str) -> str:
    return f"{current_app.config['FRONTEND_OAUTH_CALLBACK_URL']}?status={status}"

@oauth_bp.route('/callback/<provider>/')
def oauth_callback(provider):
    if not provider in current_app.config['OAUTH_PROVIDERS']:
        return redirect(_get_frontend_oauth_callback_url('error'))
    
    if current_user.is_authenticated:
        return redirect(current_app.config['FRONTEND_URL'])
    
    client = oauth.create_client(provider)
    client.authorize_access_token()
    provider_data = current_app.config['OAUTH_PROVIDERS'][provider]

    resp = client.get(provider_data['userinfo']['url'])
    resp.raise_for_status()
    userinfo = resp.json()
    email = provider_data['userinfo']['email'](userinfo)

    user = UserModel.query.filter_by(username=email).first()
    if user is None:
        user = UserModel(username=email)
        stats = UserStatsModel()
        user.stats = stats
        db.session.add_all([user, stats])
        db.session.commit()
    
    login_user(user)
    return redirect(_get_frontend_oauth_callback_url('success'))