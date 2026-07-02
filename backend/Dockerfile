FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt

COPY backend ./backend

WORKDIR /app/backend

EXPOSE 5000

CMD ["alemic", "upgrade", "head"]

CMD ["python", "wsgi.py"]