import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app:socket_app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG
    )   