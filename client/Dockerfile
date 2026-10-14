# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

WORKDIR /app

# Copy workspace config + package manifests for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY client/package.json ./client/
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --filter @finanscozum/client

# Copy client source only
COPY client/ ./client/

WORKDIR /app/client

# Ensure public dir exists (even if empty) so COPY won't fail
RUN mkdir -p public

# NEXT_PUBLIC_* vars are baked at build time
ARG NEXT_PUBLIC_API_URL=https://api.finanscozum.net
ARG NEXT_PUBLIC_SITE_URL=https://finanscozum.net
ARG NEXT_PUBLIC_SITE_NAME=FinansCozum
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID=
ARG NEXT_PUBLIC_GA_ID=

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_ADSENSE_CLIENT_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

RUN pnpm build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# standalone output (outputFileTracingRoot = workspace root)
# Next.js mirrors the monorepo structure inside .next/standalone/
COPY --from=builder --chown=node:node /app/client/.next/standalone ./
COPY --from=builder --chown=node:node /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=node:node /app/client/public ./client/public

USER node

EXPOSE 3000

CMD ["node", "client/server.js"]
