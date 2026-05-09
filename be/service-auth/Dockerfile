# ============================================================
# Dockerfile — Service Auth
# ============================================================

# ── 1. Base Image ───────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# ── 2. Development Stage ─────────────────────────────────────
# Digunakan untuk local development dengan fitur hot-reload
FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
