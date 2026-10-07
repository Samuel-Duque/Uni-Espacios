# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["node", "dist/src/main.js"]
