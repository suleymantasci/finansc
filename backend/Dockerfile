# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# bcrypt compiles native code — needs build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# pnpm-workspace.yaml contains allowBuilds config (required by pnpm v11)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Prune devDependencies in-place
RUN pnpm prune --prod --ignore-scripts

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# bcrypt needs libstdc++ at runtime on alpine
RUN apk add --no-cache libstdc++

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/main"]
