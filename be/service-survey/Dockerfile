# ==========================================
# 1. Base Image
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ==========================================
# 2. Dependencies
# ==========================================
FROM base AS dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# ==========================================
# 3. Development Stage (Hot-reload)
# ==========================================
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Kita mount src/ dan proto/ via docker-compose
CMD ["npm", "run", "start:dev"]

# ==========================================
# 4. Build Stage
# ==========================================
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ==========================================
# 5. Production Stage
# ==========================================
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3004
CMD ["npm", "run", "start:prod"]
