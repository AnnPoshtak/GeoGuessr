from flask import Flask
from app.config import DevelopmentConfig, settings, configure_settings
from app.extensions import cors, db, migrate, login_manager, ma, oauth, server_session, socketio, scheduler
import os
from redis import Redis
from app.core import GameQueueRepository, GameRoomRepository

session_redis = Redis.from_url(os.environ['REDIS_URL'])
app_redis = Redis.from_url(os.environ['REDIS_URL'], decode_responses=True) 
game_queue = GameQueueRepository(app_redis)
game_room = GameRoomRepository(app_redis)

from .models import UserModel
from . import ws

@login_manager.user_loader
def load_user(id):
    return UserModel.query.filter_by(id=id).first()

def create_app(config=DevelopmentConfig) -> Flask:
    app = Flask(__name__)
    configure_settings(config)

    app.config['SECRET_KEY'] = settings.SECRET_KEY
    app.config['SESSION_TYPE'] = settings.SESSION_TYPE
    app.config['SESSION_COOKIE_HTTPONLY'] = settings.SESSION_COOKIE_HTTPONLY
    app.config['SESSION_COOKIE_SAMESITE'] = settings.SESSION_COOKIE_SAMESITE
    app.config['SQLALCHEMY_DATABASE_URI'] = settings.SQLALCHEMY_DATABASE_URI
    app.config.update({
        'SESSION_REDIS': session_redis
    })

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, origins=settings.CORS_ORIGINS, supports_credentials=True)
    ma.init_app(app)
    login_manager.init_app(app)
    oauth.init_app(app)
    server_session.init_app(app)
    socketio.init_app(app, cors_allowed_origins=settings.CORS_ORIGINS,
                      logger=True, async_mode=os.environ.get('SOCKETIO_ASYNC_MODE', 'threading'),
                      manage_session=False)

    from redis import ConnectionPool
    from apscheduler.jobstores.redis import RedisJobStore
    pool = ConnectionPool.from_url(os.environ['REDIS_URL'])
    app.config['SCHEDULER_JOBSTORES'] = {
        'default': RedisJobStore(jobs_key='scheduler_jobs', run_times_key='scheduler_run_times', connection_pool=pool)
    }
    scheduler.init_app(app)

    for p_name, p_data in settings.OAUTH_PROVIDERS.items():
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
        from .blueprints import oauth_bp, users_bp, auth_bp, game_bp
        scheduler.start()
        app.register_blueprint(oauth_bp, url_prefix='/oauth')
        app.register_blueprint(users_bp, url_prefix='/users')
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(game_bp, url_prefix='/game')

    return app
