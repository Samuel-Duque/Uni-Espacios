# 🚀 Especificación 09: Despliegue, Dockerización y DevOps
**Documento:** `specs/09-deployment-and-devops.md`  
**Épicas Relacionadas:** `EPIC-09`  
**Tareas del Taskboard:** `TSK-904`  
**Fase de Implementación:** Fase 5 (Día 20)  

---

## 🐳 1. Dockerización Multi-Stage de Microservicios

### 1.1 Dockerfile del Backend (`backend/Dockerfile`)
```dockerfile
# ----------------------------------------------------
# Etapa 1: Dependencias y Build
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar Prisma en Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generar cliente de Prisma y compilar NestJS
RUN npx prisma generate
RUN npm run build

# ----------------------------------------------------
# Etapa 2: Imagen Ligera de Producción
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

# Crear usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nestjs

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

---

### 1.2 Dockerfile del Frontend (`frontend/Dockerfile`)
```dockerfile
# ----------------------------------------------------
# Etapa 1: Dependencias
# ----------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# ----------------------------------------------------
# Etapa 2: Compilación (Next.js Standalone)
# ----------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ----------------------------------------------------
# Etapa 3: Runner de Producción
# ----------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 📦 2. Orquestación con Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  # --------------------------------------------------
  # 1. Base de Datos Relacional MariaDB 11.x
  # --------------------------------------------------
  mariadb:
    image: mariadb:11.2
    container_name: uniespacios_mariadb
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: RootPasswordSecure2026!
      MYSQL_DATABASE: uniespacios_db
      MYSQL_USER: uniespacios_user
      MYSQL_PASSWORD: UniEspacios2026Secure!
    ports:
      - "3306:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    networks:
      - uniespacios-net
    healthcheck:
      test: ["CMD", "mariadb-admin", "ping", "-h", "localhost", "-u", "uniespacios_user", "-pUniEspacios2026Secure!"]
      interval: 5s
      timeout: 5s
      retries: 10

  # --------------------------------------------------
  # 2. API Backend (NestJS)
  # --------------------------------------------------
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: uniespacios_backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: mysql://uniespacios_user:UniEspacios2026Secure!@mariadb:3306/uniespacios_db
      JWT_ACCESS_SECRET: Poli2026AccessSecretKeySuperSecureLongJwtKey!
      JWT_REFRESH_SECRET: Poli2026RefreshSecretKeySuperSecureLongJwtKey!
      CORS_ORIGIN: http://localhost:3000
    ports:
      - "4000:4000"
    depends_on:
      mariadb:
        condition: service_healthy
    networks:
      - uniespacios-net

  # --------------------------------------------------
  # 3. Aplicación Web Frontend (Next.js 14+)
  # --------------------------------------------------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: uniespacios_frontend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - uniespacios-net

networks:
  uniespacios-net:
    driver: bridge

volumes:
  mariadb_data:
    driver: local
```

---

## 🔑 3. Diccionario de Variables de Entorno

### 3.1 Backend (`backend/.env.example`)
```env
# Configuración del Servidor
NODE_ENV="development"
PORT=4000
CORS_ORIGIN="http://localhost:3000"

# Persistencia MariaDB (Prisma)
DATABASE_URL="mysql://uniespacios_user:UniEspacios2026Secure!@localhost:3306/uniespacios_db"

# Secretos JWT
JWT_ACCESS_SECRET="Poli2026AccessSecretKeySuperSecureLongJwtKey!"
JWT_REFRESH_SECRET="Poli2026RefreshSecretKeySuperSecureLongJwtKey!"
```

### 3.2 Frontend (`frontend/.env.example`)
```env
# URL de la API REST
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## ⚡ 4. Guía Rápida de Despliegue en 3 Pasos

1. **Clonar el repositorio y configurar variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. **Construir y levantar contenedores:**
   ```bash
   docker compose up --build -d
   ```
3. **Poblar datos semilla iniciales:**
   ```bash
   docker compose exec backend npx prisma db seed
   ```
4. **Acceder a los servicios:**
   * Frontend: `http://localhost:3000`
   * Backend API: `http://localhost:4000/api`
   * Swagger Docs: `http://localhost:4000/api/docs`
