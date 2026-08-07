import os
from pathlib import Path
from pydantic import model_validator, Field
from pydantic_settings import BaseSettings, YamlConfigSettingsSource, SettingsConfigDict
import logging

PROJECT_PATH = Path(__file__).resolve().parents[2]
ENV_PATH = str(PROJECT_PATH / "backend" / ".env")
YAML_CONFIG_PATH = str(PROJECT_PATH / "shared" / "config.yml")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        yaml_file=YAML_CONFIG_PATH,
        extra='ignore',
        env_ignore_empty=True
    )
    # .env
    SECRET_KEY: str
    SQLALCHEMY_DATABASE_URI: str
    FRONTEND_URL: str
    REDIS_URL: str
    HOST: str
    PORT: int
    DEBUG: bool

    # python-defined settings
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: str = 'Lax'
    CORS_ORIGINS: list[str] = Field(default=[], validation_alias='CORS_ORIGINS_CONFIG')
    OAUTH_PROVIDERS: dict = {
        'google': {
            'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
            'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
            'authorize_url': 'https://accounts.google.com/o/oauth2/v2/auth',
            'access_token_url': 'https://oauth2.googleapis.com/token',
            'api_base_url': 'https:/googleapis.com/',
            'userinfo': {
                'url': 'https://www.googleapis.com/oauth2/v3/userinfo',
                'email': lambda json: json['email'],
            },
            'scopes': ['email']
        },
    }
    FRONTEND_OAUTH_CALLBACK_URL: str = ""
    SESSION_TYPE: str = 'redis'
    SCHEDULER_TIMEZONE: str = 'UTC'
    SCHEDULER_JOB_DEFAULTS: dict = {
        'misfire_grace_time': 5,
        'coalesce': True,
        'max_instances': 1,
    }
    FIREBASE_CERT_PATH: str = str(Path(PROJECT_PATH, "backend", "serviceAccountKey.json"))

    # config.yml
    score_calculation_scale: int
    min_players: int
    gameroom_expiry_time: int
    starting_player_health: int
    round_health_multiplier: float
    game_playercount: list
    game_teams: dict
    defeat_team_interval: int
    disconnect_event_interval: int
    leave_queue_event_interval: int 
    autosubmit_interval: int
    round_automove_cooldown: int
    inactivity_kick_cooldown: int
    inactivity_kick_notification_left: int

    @model_validator(mode='after')
    def _set_computed_fields(self):
        self.FRONTEND_OAUTH_CALLBACK_URL = f"{self.FRONTEND_URL}/oauth/callback/"
        if not self.CORS_ORIGINS:
            self.CORS_ORIGINS = [os.environ.get('CORS_ORIGINS', 'http://localhost:5173').strip("'\"")]
        self.round_automove_cooldown = int(self.round_automove_cooldown / 1000)
        return self

    @property
    def ASYNC_SQLALCHEMY_DATABASE_URI(self) -> str:
        uri = self.SQLALCHEMY_DATABASE_URI
        if uri.startswith('postgresql+asyncpg://'):
            return uri
        for scheme in ('postgresql+psycopg2://', 'postgresql://', 'postgres://'):
            if uri.startswith(scheme):
                return uri.replace(scheme, 'postgresql+asyncpg://', 1)
        if uri.startswith('sqlite://'):
            return uri.replace('sqlite://', 'sqlite+aiosqlite://', 1)
        return uri

    @classmethod
    def settings_customise_sources(cls, settings_cls, env_settings, dotenv_settings, **kwargs):
        return (
            env_settings,
            dotenv_settings,
            YamlConfigSettingsSource(settings_cls),
        )


settings = Settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
