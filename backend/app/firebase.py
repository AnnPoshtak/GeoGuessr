from pathlib import Path
from firebase_admin import credentials, initialize_app
from app.config import settings, logger

firebase = None

cert_path = Path(settings.FIREBASE_CERT_PATH)
try:
    cred = credentials.Certificate(settings.FIREBASE_CERT_PATH)
    firebase = initialize_app(cred)
except Exception as e:
    logger.error('An error occurred when trying to initialize firebase app: {e}')