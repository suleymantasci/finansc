# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# bcrypt compiles native code — needs build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace config + package manifests for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY client/package.json ./client/
COPY backend/package.json ./backend/

# Dev dependencies dahil tüm paketleri kur (build + pruna için gerekli)
RUN pnpm install --frozen-lockfile --filter @finanscozum/backend

# Copy backend source only
COPY backend/ ./backend/

WORKDIR /app/backend
RUN pnpm build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# bcrypt needs libstdc++ at runtime on alpine
RUN apk add --no-cache libstdc++

WORKDIR /app

# pnpm deploy: workspace-aware self-contained node_modules üretir
# (symlink store yerine gerçek kopyalar — runtime'da resolve garantili).
# pnpm prune --prod yerine tercih edildi: prune sembolik link yapısını
# bozuyor, deploy ise tam bağımsız bir node_modules üretir.
# Build'in sonunda `pnpm deploy` ile /app/deployed/ altına kopyalanır;
# aşağıda Stage 2'de oradan alıyoruz.

# ── Stage 1.5: Deploy (self-contained node_modules üretimi) ──────────────
FROM builder AS deps
# Build sonrası devDependencies gereksiz; pnpm deploy --prod sadece
# production deps + paketin kendisini self-contained olarak kopyalar.
# Bu sayede runtime'da @nestjs/core, typeorm, pg, bcrypt vb. hepsi
# tek bir /app/node_modules altında symlink olmadan bulunur.
WORKDIR /app/backend
RUN pnpm deploy --prod --filter @finanscozum/backend --legacy /app/deployed

# ── Stage 2 devam ──────────────────────────────────────────────────────────
# (FROM runner yukarıda, aşağıda COPY'ler runner'a uygulanır)

# Copy self-contained node_modules from deploy stage
COPY --from=deps /app/deployed/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/main"]
