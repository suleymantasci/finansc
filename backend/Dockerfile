# ── Stage 1: Build (dev + prod deps + dist) ───────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# bcrypt compiles native code — needs build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace config + package manifests for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY client/package.json ./client/
COPY backend/package.json ./backend/

# Include build tools and types; use exactly the reviewed lockfile.
RUN pnpm install --frozen-lockfile --filter @finanscozum/backend

# Copy backend source only
COPY backend/ ./backend/

WORKDIR /app/backend
RUN pnpm build

# ── Stage 1.5: deps (self-contained production node_modules) ─────────────
FROM builder AS deps

# pnpm --filter <pkg> deploy --prod: workspace-aware self-contained
# node_modules üretir. Sembolik link store yerine gerçek kopyalar —
# runtime'da @nestjs/core, typeorm, pg, bcrypt, express vb. hepsi
# /app/deployed/node_modules altında düz dizinde bulunur.
# --legacy supports this workspace without injected workspace packages.
WORKDIR /app
RUN pnpm --filter @finanscozum/backend deploy --prod --legacy /app/deployed

# ── Stage 2: Production (runtime) ────────────────────────────────────────
FROM node:22-alpine AS runner

# bcrypt needs libstdc++ at runtime on alpine
RUN apk add --no-cache libstdc++

WORKDIR /app

# Self-contained production node_modules (Stage 1.5)
COPY --from=deps --chown=node:node /app/deployed/node_modules ./node_modules
# Compiled dist (Stage 1)
COPY --from=builder --chown=node:node /app/backend/dist ./dist
# Package.json (Stage 1)
COPY --from=builder --chown=node:node /app/backend/package.json ./package.json

RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node

EXPOSE 3001

CMD ["node", "dist/main"]
