# Build context: monorepo root. Poetry installs only locked production dependencies.
FROM python:3.12-slim-bookworm AS builder
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 POETRY_NO_INTERACTION=1
RUN pip install --no-cache-dir poetry==2.2.1
WORKDIR /build
COPY flameguard-ai-backend/pyproject.toml flameguard-ai-backend/poetry.lock ./
RUN python -m venv /opt/venv && . /opt/venv/bin/activate && poetry install --only main --no-root

FROM python:3.12-slim-bookworm AS runtime
ENV PATH="/opt/venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    APP_ENV=production DEBUG=false PORT=8000
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 flameguard && useradd --uid 10001 --gid 10001 --no-create-home flameguard \
    && mkdir -p /var/lib/flameguard/artifacts /var/lib/flameguard/collection \
    && chown -R 10001:10001 /var/lib/flameguard
COPY --from=builder /opt/venv /opt/venv
WORKDIR /app/backend
COPY --chown=10001:10001 flameguard-ai-backend/app ./app
COPY --chown=10001:10001 flameguard-ai-backend/alembic ./alembic
COPY --chown=10001:10001 flameguard-ai-backend/alembic.ini ./
COPY --chown=10001:10001 flameguard-ai-backend/data ./data
COPY --chown=10001:10001 flameguard-ai-backend/scripts/seed_demo_data.py ./scripts/seed_demo_data.py
COPY --chown=10001:10001 deploy/runtime ./deployment
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["python", "deployment/probe.py", "health"]
ENTRYPOINT ["python", "deployment/entrypoint.py"]
