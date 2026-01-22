from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_marshmallow import Marshmallow
from app.config import DevelopmentConfig
from flask_wtf.csrf import CSRFProtect

cors = CORS()
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
ma = Marshmallow()
csrf = CSRFProtect()

from .models import UserModel

@login_manager.user_loader
def load_user(id):
    return UserModel.query.filter_by(id=id).first()

def create_app(config=DevelopmentConfig) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config())

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    ma.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)

    with app.app_context():
        db.create_all()
        from .blueprints import oauth_bp, csrf_bp
        app.register_blueprint(oauth_bp, url_prefix='/oauth')
        app.register_blueprint(csrf_bp, url_prefix='/csrf')


    return app