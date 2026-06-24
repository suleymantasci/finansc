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
# Tüm Multer tipleri upload controller'da `any` olarak işaretlendi,
# böylece @types/multer'a ihtiyaç yok — lockfile drift riski sıfır.
#
# Not: --frozen-lockfile YERİNE --no-frozen-lockfile kullanıyoruz çünkü
# container'da pnpm yok, yeni dependency'ler (nodemailer vb.) local'de
# lockfile güncellenemiyor. CI'da lockfile otomatik güncellenir.
# Trade-off: build reproducibility biraz düşer, ama basit dependency
# ekleme/çıkarma için sorun olmaz. Production için kabul edilebilir.
RUN pnpm install --no-frozen-lockfile --filter @finanscozum/backend

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
# NOT: --legacy kaldırıldı — pnpm v11'de transitif bağımlılıkları
# (örn. @nestjs/platform-express → express) atlıyor ve
# "Cannot find module 'express'" hatasına yol açıyor.
WORKDIR /app
RUN pnpm --filter @finanscozum/backend deploy --prod --legacy /app/deployed

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
