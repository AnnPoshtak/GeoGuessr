from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from flask_session import Session
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler

cors = CORS()
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
ma = Marshmallow()
oauth = OAuth()
server_session = Session()
socketio = SocketIO()
scheduler = APScheduler()
