# ============================================================
# Dockerfile — NestJS Service (Core, Scraper, API Gateway)
# Multi-stage: development (hot-reload) & production
# ============================================================

# ── Base: shared dependencies ────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install semua deps (termasuk devDependencies yang dibutuhkan NestJS CLI)
COPY package*.json ./
RUN npm ci

COPY . .


# ── Stage: development (hot-reload via nest start --watch) ───
FROM base AS development

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "start:dev"]


# ── Stage: builder (compile TypeScript) ─────────────────────
FROM base AS builder

RUN npm run build

# Hapus devDependencies agar image produksi lebih kecil
RUN npm prune --omit=dev


# ── Stage: production ────────────────────────────────────────
FROM node:20-alpine AS production

# Install Chromium untuk Playwright (jika dibutuhkan scraping headless)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Gunakan Chromium dari Alpine (bukan download sendiri)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

WORKDIR /app

# Salin hasil build dari stage builder
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
