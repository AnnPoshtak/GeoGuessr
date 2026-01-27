from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_marshmallow import Marshmallow
from app.config import DevelopmentConfig
from flask_wtf.csrf import CSRFProtect
from authlib.integrations.flask_client import OAuth
from flask_session import Session

cors = CORS()
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
ma = Marshmallow()
csrf = CSRFProtect()
oauth = OAuth()
sess = Session()

from .models import UserModel

@login_manager.user_loader
def load_user(id):
    return UserModel.query.filter_by(id=id).first()

def create_app(config=DevelopmentConfig) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config())

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    ma.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)
    oauth.init_app(app)
    sess.init_app(app)

    for p_name, p_data in app.config['OAUTH_PROVIDERS'].items():
        oauth.register(
            p_name,
            client_id=p_data['client_id'],
            client_secret=p_data['client_secret'],
            access_token_url=p_data['access_token_url'],
            access_token_params=None,
            authorize_url=p_data['authorize_url'],
            authorize_params=None,
            api_base_url=p_data['api_base_url'],
            client_kwargs={
                'scope': ' '.join(p_data['scopes'])
            }
        )

    with app.app_context():
        db.create_all()
        from .blueprints import oauth_bp, csrf_bp, users_bp, auth_bp, game_bp
        app.register_blueprint(oauth_bp, url_prefix='/oauth')
        app.register_blueprint(csrf_bp, url_prefix='/csrf')
        app.register_blueprint(users_bp, url_prefix='/users')
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(game_bp, url_prefix='/game')


    return app