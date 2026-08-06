# syntax=docker/dockerfile:1

# ---- Mərhələ 1: asılılıqlar ----
# Alpine kiçikdir; Prisma engine üçün openssl və libc6-compat lazımdır.
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# package + lockfile + prisma sxemi (postinstall "prisma generate" işlədir).
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Mərhələ 2: build ----
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client-i açıq şəkildə yenidən yarat (engine build platformasına uyğun olsun),
# sonra Next.js standalone çıxışını qur.
RUN npx prisma generate
RUN npm run build

# ---- Mərhələ 3: işə salma (minimal) ----
FROM node:20-alpine AS runner
# Prisma query engine-in işləməsi üçün runtime asılılıqları.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run PORT dəyişənini avtomatik verir (adətən 8080); server.js onu oxuyur.
# HOSTNAME 0.0.0.0 olmalıdır ki, konteyner xaricdən əlçatan olsun.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Root olmayan istifadəçi ilə işlə (node:20-alpine-də hazır "node" istifadəçisi var).
USER node

# Standalone çıxışı: server.js + minimal traced node_modules.
COPY --from=builder --chown=node:node /app/.next/standalone ./
# Statik fayllar və public standalone-a daxil edilmir — ayrıca kopyalanır.
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Prisma generated client + engine-in mövcudluğuna zəmanət ver.
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8080

CMD ["node", "server.js"]
