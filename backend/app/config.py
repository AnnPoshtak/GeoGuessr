import os
from dotenv import load_dotenv
from pathlib import Path
from pydantic import model_validator, Field
from pydantic_settings import BaseSettings, YamlConfigSettingsSource, SettingsConfigDict, EnvSettingsSource

PROJECT_PATH = Path(__file__).resolve().parents[2]
ENV_PATH = str(PROJECT_PATH / "backend" / ".env")
YAML_CONFIG_PATH = str(PROJECT_PATH / "shared" / "config.yml")

load_dotenv(ENV_PATH)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        yaml_file=YAML_CONFIG_PATH,
        extra='ignore',
        env_ignore_empty=True
    )
    SECRET_KEY: str
    SQLALCHEMY_DATABASE_URI: str
    FRONTEND_URL: str
    REDIS_URL: str

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

    @classmethod
    def settings_customise_sources(cls, settings_cls, **kwargs):
        return (
            EnvSettingsSource(settings_cls),
            YamlConfigSettingsSource(settings_cls),
        )


class DevelopmentConfig(Settings):
    DEBUG: bool = True
    FLASK_ENV: str = 'DEVELOPMENT'


class TestingConfig(Settings):
    TESTING: bool = True
    FLASK_ENV: str = 'TESTING'
    SQLALCHEMY_DATABASE_URI: str = 'sqlite://'


_settings: Settings | None = None


class _SettingsProxy:
    def __getattr__(self, name):
        if _settings is None:
            raise RuntimeError("Settings not configured. Call configure_settings() first.")
        return getattr(_settings, name)


settings: Settings = _SettingsProxy()


def configure_settings(config_class=DevelopmentConfig) -> Settings:
    global _settings
    _settings = config_class()
    return _settings
