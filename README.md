# 🏛️ Uni-Espacios

> **Sistema Integral de Gestión, Reserva de Espacios Físicos y Control de Inventario**  
> _Politécnico Colombiano Jaime Isaza Cadavid_

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MariaDB](https://img.shields.io/badge/MariaDB-11.x-003545?style=flat-square&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Domain--First_SDD-8A2BE2?style=flat-square)](#-arquitectura-del-sistema)

---

## 📖 Descripción General

**Uni-Espacios** es una plataforma orientada a centralizar y automatizar la administración, préstamo y custodia de la infraestructura física del **Politécnico Colombiano Jaime Isaza Cadavid** (aulas de clase, laboratorios especializados, auditorios, salas de cómputo y escenarios deportivos).

El sistema resuelve dos desafíos críticos en la gestión de campus:

1. **Evitar colisiones de horario** mediante un motor de disponibilidad transaccional que contrasta en tiempo real las solicitudes de reserva contra la carga académica institucional (clases fijas semestrales).
2. **Garantizar la trazabilidad y custodia de implementos** pedagógicos, tecnológicos y deportivos mediante un flujo digital de **Check-In y Check-Out** con levantamiento de actas y gestión de novedades.

---

## ✨ Características Principales

### 🏢 Gestión Jerárquica de Infraestructura

- Organización por **Sedes** (Medellín - Poblado, Rionegro), **Bloques** (P40, P31, P19, etc.) y **Espacios Físicos**.
- Tipificación de espacios: `AULA`, `LABORATORIO`, `AUDITORIO`, `DEPORTIVO` y `SALA_COMPUTO`.
- Fichas técnicas detalladas con aforo, equipamiento fijo y estado operativo.

### 📅 Motor de Disponibilidad & Anti-Solapamiento

- **Prioridad Académica:** Las asignaturas regulares activas tienen prelación sobre reservas eventuales.
- **Prevención de Double-Booking:** Validación matemática de intersección de franjas horarias:
  $$\text{Inicio}_A < \text{Fin}_B \quad \land \quad \text{Fin}_A > \text{Inicio}_B$$
- **Consistencia Transaccional:** Aislamiento serializable (`Serializable Transaction`) para garantizar integridad en escenarios de alta concurrencia.

### 📦 Control de Inventario y Actas de Check-In / Check-Out

- Inventario granular por espacio clasificado en: `TECNOLOGIA`, `MOBILIARIO`, `DEPORTIVO` y `DIDACTICO`.
- **Check-In Digital:** Validación de la lista de chequeo de implementos al ingresar al espacio (con registro de fotos/observaciones si existen anomalías previas).
- **Check-Out Digital:** Verificación al finalizar la reserva. El reporte de implementos faltantes o dañados genera una novedad automática y notifica a los gestores encargados.

### 🛡️ Seguridad, RBAC y Validación Institucional

- Autenticación segura mediante **JWT** (Access Tokens y Refresh Tokens en cookies `HttpOnly`).
- Restricción estricta de registro para correos institucionales `@elpoli.edu.co`.
- Control de acceso basado en roles: `ESTUDIANTE`, `DOCENTE`, `GESTOR_ESPACIO` y `SUPERADMIN`.

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura desacoplada, modular y orientada al dominio (**Spec-Driven Development**):

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend (Next.js 14 App Router)"]
        UI["UI Components (shadcn/ui + Tailwind)"]
        RSC["React Server Components"]
        State["Server State (TanStack Query v5)"]
        Forms["Form Engine (React Hook Form + Zod)"]
    end

    subgraph API["⚙️ Backend API (NestJS 10 Modular)"]
        AuthMod["Auth & RBAC Guards"]
        EspaciosMod["Espacios & Catálogo"]
        ReservasMod["Reservas & Concurrencia"]
        InventarioMod["Inventario & Check-In/Out"]
        PeriodosMod["Periodos & Clases Fijas"]
        ZodPipes["Validación de DTOs (nestjs-zod)"]
    end

    subgraph DB["🗄️ Persistencia"]
        Prisma["Prisma ORM (Data Layer)"]
        MariaDB[("MariaDB 11.x (ACID)")]
    end

    Client <== "REST API / JSON Tipado" ==> API
    API --> Prisma --> MariaDB
```

---

## 🛠️ Stack Tecnológico

| Capa                      | Tecnologías                                                                                                                                                                                                                                                         |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**              | [Next.js 14+](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [TanStack Query v5](https://tanstack.com/query), [Lucide Icons](https://lucide.dev/) |
| **Backend**               | [NestJS 10+](https://nestjs.org/), [TypeScript](https://www.typescriptlang.org/), [Prisma ORM](https://www.prisma.io/), [Zod](https://zod.dev/) / `nestjs-zod`, [Passport JWT](http://www.passportjs.org/), [Swagger / OpenAPI](https://swagger.io/)                |
| **Base de Datos**         | [MariaDB 11.x](https://mariadb.org/) con soporte transaccional ACID                                                                                                                                                                                                 |
| **Validación & Tipado**   | [Zod](https://zod.dev/) (contratos y esquemas compartidos extremo a extremo)                                                                                                                                                                                        |
| **Herramientas & DevOps** | [Docker](https://www.docker.com/), [pnpm](https://pnpm.io/), ESLint, Prettier, Vitest / Jest                                                                                                                                                                        |

---

## 📁 Estructura del Repositorio

```text
Uni-Espacios/
├── apps/
│   ├── backend/               # API NestJS (módulos de dominio, guards, servicios)
│   │   ├── src/
│   │   │   ├── modules/       # auth, espacios, reservas, inventario, verificaciones...
│   │   │   ├── prisma/        # PrismaService y configuraciones de acceso
│   │   │   └── common/        # Decoradores, filtros globales, interceptores
│   │   └── prisma/
│   │       └── schema.prisma  # Modelo relacional y migraciones de BD
│   └── frontend/              # Aplicación Web Next.js (App Router)
│       └── src/
│           ├── app/           # Rutas públicas, catálogo, dashboard y flujos
│           ├── components/    # Componentes UI (shadcn/ui, calendarios, filtros)
│           ├── hooks/         # Custom hooks para queries y mutaciones
│           └── lib/           # Clientes HTTP, formateadores y utilidades
├── packages/                  # Paquetes compartidos (DTOs, contratos Zod, tipos TS)
├── planning/                  # Contexto, arquitectura y plan de fases del proyecto
└── specs/                     # Especificaciones técnicas detalladas (SDD)
```

---

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js**: `v20.x` o superior
- **Gestor de paquetes**: `pnpm` (recomendado) o `npm`
- **Base de datos**: MariaDB `11.x` o contenedor Docker compatible

### 1. Clonar el repositorio

```bash
git clone https://github.com/Samuel-Duque/Uni-Espacios.git
cd Uni-Espacios
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Crea los archivos `.env` en los proyectos correspondientes tomando como base los ejemplos:

```bash
# Backend (.env)
DATABASE_URL="mysql://usuario:password@localhost:3306/uni_espacios_db"
JWT_SECRET="tu_clave_secreta_jwt"
JWT_REFRESH_SECRET="tu_clave_secreta_refresh"
PORT=4000
FRONTEND_URL="http://localhost:3000"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

### 4. Inicializar la Base de Datos con Prisma

```bash
cd apps/backend
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### 5. Iniciar en modo desarrollo

```bash
# Desde la raíz del proyecto (modo concurrente / workspace)
pnpm dev
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000/api`
- **Documentación Swagger:** `http://localhost:4000/api/docs`

---

## 📚 Especificaciones Técnicas (SDD)

El diseño y desarrollo de Uni-Espacios está documentado bajo la metodología **Spec-Driven Development**. Puedes consultar las especificaciones detalladas en el directorio [`/specs`](./specs):

- [`01-contracts-and-schemas.md`](./specs/01-contracts-and-schemas.md) — Contratos de datos y esquemas Zod
- [`02-database-and-persistence.md`](./specs/02-database-and-persistence.md) — Modelo de datos relacional y Prisma ORM
- [`03-backend-architecture-and-api.md`](./specs/03-backend-architecture-and-api.md) — Módulos NestJS y endpoints REST
- [`04-security-and-rbac.md`](./specs/04-security-and-rbac.md) — Autenticación, JWT y control de acceso
- [`05-availability-and-concurrency-engine.md`](./specs/05-availability-and-concurrency-engine.md) — Motor anti double-booking
- [`06-inventory-checkin-checkout-flow.md`](./specs/06-inventory-checkin-checkout-flow.md) — Flujo de actas de verificación
- [`07-frontend-architecture-and-ui.md`](./specs/07-frontend-architecture-and-ui.md) — Vistas, componentes y estado cliente
- [`08-testing-qa-and-hardening.md`](./specs/08-testing-qa-and-hardening.md) — Pruebas unitarias, e2e y seguridad
- [`09-deployment-and-devops.md`](./specs/09-deployment-and-devops.md) — Pipeline CI/CD y despliegue

---

## 📄 Licencia

Este proyecto fue desarrollado con fines institucionales y académicos para el **Politécnico Colombiano Jaime Isaza Cadavid**. Distribuido bajo la Licencia [MIT](LICENSE).
