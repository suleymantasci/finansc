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

# Dev dependencies dahil tüm paketleri kur (nest build için gerekli)
RUN pnpm install --frozen-lockfile --filter @finanscozum/backend

# Copy backend source only
COPY backend/ ./backend/

WORKDIR /app/backend
RUN pnpm build

# ── Stage 1.5: deps (self-contained production node_modules) ─────────────
FROM builder AS deps

# pnpm deploy --prod --legacy: workspace-aware self-contained
# node_modules üretir. Sembolik link store yerine gerçek kopyalar —
# runtime'da @nestjs/core, typeorm, pg, bcrypt vb. hepsi
# /app/node_modules altında düz dizinde bulunur.
# pnpm prune --prod yerine tercih edildi: prune sembolik link
# yapısını bozuyor, deploy ise tam bağımsız bir node_modules üretir.
WORKDIR /app/backend
RUN pnpm deploy --prod --filter @finanscozum/backend --legacy /app/deployed

# ── Stage 2: Production (runtime) ────────────────────────────────────────
FROM node:22-alpine AS runner

# bcrypt needs libstdc++ at runtime on alpine
RUN apk add --no-cache libstdc++

WORKDIR /app

# Self-contained production node_modules (Stage 1.5)
COPY --from=deps /app/deployed/node_modules ./node_modules
# Compiled dist (Stage 1)
COPY --from=builder /app/backend/dist ./dist
# Package.json (Stage 1)
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/main"]
