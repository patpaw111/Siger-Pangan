# ============================================================
# Dockerfile — NestJS Service (Core, Scraper, API Gateway)
# ============================================================

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files dulu (caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build


# --- Stage 2: Production ---
FROM node:20-alpine AS production

# Install Chromium untuk Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set env agar Playwright pakai Chromium yang diinstall (bukan download sendiri)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy build hasil dari stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy file .proto
COPY ../../proto ./proto

# Expose port
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "dist/main"]
