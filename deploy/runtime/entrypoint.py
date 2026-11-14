"""Deployment process launcher; never migrates or imports on API startup."""

import os
import sys

from sqlalchemy.engine import make_url


def validate_environment():
    if os.environ.get("APP_ENV", "production") != "production":
        return
    for name in ("DATABASE_URL", "RUNTIME_DATABASE_URL"):
        raw = os.environ.get(name)
        if not raw:
            if name == "DATABASE_URL":
                raise ValueError("DATABASE_URL is required")
            continue
        url = make_url(raw)
        if url.drivername != "postgresql+asyncpg" or url.query.get("ssl") != "verify-full":
            raise ValueError("Production database connections require asyncpg ssl=verify-full")
    if os.environ.get("DEBUG", "false").lower() not in {"false", "0"}:
        raise ValueError("DEBUG must be false")


def main():
    try:
        validate_environment()
        port = int(os.environ.get("PORT", "8000"))
        if not 1 <= port <= 65535:
            raise ValueError("Invalid PORT")
    except Exception:
        # Driver/parser exceptions can contain credentials. Never print them.
        print(
            "Invalid deployment settings; check TLS, DATABASE_URL, DEBUG and PORT.", file=sys.stderr
        )
        return 2
    command = sys.argv[1:] or [
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(port),
        "--workers",
        "1",
        "--no-access-log",
        "--limit-concurrency",
        "32",
        "--timeout-keep-alive",
        "5",
    ]
    os.execvp(command[0], command)


if __name__ == "__main__":
    sys.exit(main())
