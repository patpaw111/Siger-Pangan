# ============================================================
# Dockerfile — NestJS Service (SiPangan Scraper)
# ============================================================

# ── Base: shared dependencies ────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install semua deps
COPY be/service-web-scraper-sipangan/package*.json ./
RUN npm ci

COPY be/service-web-scraper-sipangan/ .

# ── Stage: development (hot-reload via nest start --watch) ───
FROM base AS development
ENV NODE_ENV=development
EXPOSE 3002
CMD ["npm", "run", "start:dev"]

# ── Stage: builder (compile TypeScript) ─────────────────────
FROM base AS builder
RUN npm run build
RUN npm prune --omit=dev

# ── Stage: production ────────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Salin hasil build dari stage builder
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3002

CMD ["node", "dist/main"]
