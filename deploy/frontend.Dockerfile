# Next standalone output preserves SSR and the existing build-time rewrites.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY FlameInFreewall_Tourbillion/package.json FlameInFreewall_Tourbillion/package-lock.json ./
RUN npm ci
COPY FlameInFreewall_Tourbillion/ ./
# Next rewrites are captured during build. Rebuild to change this destination.
ARG BACKEND_INTERNAL_URL=http://backend:8000
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
