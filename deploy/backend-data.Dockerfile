# Build context is the monorepo root. Build backend.Dockerfile from this checkout first.
ARG BACKEND_IMAGE=flameguard-api:base
FROM ${BACKEND_IMAGE}

ARG NASA_BUNDLE_DIR=.demo/azure-nasa-bundle-v1
# This directory contains the exported NASA bundle and its database-bound manifest.
COPY --chown=10001:10001 ${NASA_BUNDLE_DIR}/ /app/backend/data/nasa/

ENV CATALOG_COLLECTION_MANIFEST=/app/backend/data/nasa/collection.json \
    CHAT_PROVIDER=extractive \
    PGSSLROOTCERT=/etc/ssl/certs/ca-certificates.crt
