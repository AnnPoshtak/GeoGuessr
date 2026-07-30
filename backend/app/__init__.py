from app.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import socketio
import app.routes.single_player as single_player

@asynccontextmanager
async def lifespan(app: FastAPI):
    from .core.scheduler import scheduler
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)
app.state.user_websocket_sessions = {}

app.include_router(single_player.router, prefix='/single-player')

from .ws import sio

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
