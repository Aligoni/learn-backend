# syntax=docker/dockerfile:1
#
# Build: docker build -t learn-backend .
# Run:  docker run --rm -p 3000:3000 \
#          -e JWT_SECRET="your-long-secret" \
#          -v learn-backend-data:/app/data \
#          learn-backend
#
# In production, NODE_ENV=production disables TypeORM synchronize — use migrations or
# seed via a one-off container before serving traffic.

FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Clean production install so sqlite3 / bcrypt native bindings match this image (libc, arch).
# TypeORM reports "install sqlite3" if require('sqlite3') fails for any reason.
ENV NODE_ENV=production
RUN rm -rf node_modules \
  && yarn install --frozen-lockfile --production \
  && npm rebuild sqlite3 bcrypt --build-from-source \
  && node -e "require('sqlite3'); console.log('sqlite3: ok')"

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
  PORT=3000 \
  DATABASE_PATH=/app/data/app.sqlite

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /app/data \
  && chown -R node:node /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
