FROM python:3.12-slim

WORKDIR /app

# Install required Python dependencies directly with pip for fast and reliable builds
RUN pip install --no-cache-dir \
    "fastapi>=0.115,<1.0" \
    "uvicorn>=0.34,<1.0" \
    "sqlalchemy[asyncio]>=2.0.36,<2.1" \
    "asyncpg>=0.30,<1.0" \
    "alembic>=1.14,<2.0" \
    "pydantic>=2.10,<3.0" \
    "pydantic-settings>=2.7,<3.0"

COPY . /app

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
