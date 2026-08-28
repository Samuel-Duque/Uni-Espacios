# 🏛️ Descripción General de la Arquitectura (Architecture Overview)
**Proyecto:** Sistema de Gestión, Reserva de Espacios Físicos y Control de Inventario  
**Institución:** Politécnico Colombiano Jaime Isaza Cadavid  
**Metodología:** Domain-First Spec-Driven Development (SDD)  
**Stack:** Next.js 14+ (App Router) | NestJS 10+ | TypeScript | Prisma ORM | MariaDB 11.x | Zod | TanStack Query v5  

---

## 1. Visión General y Contexto del Sistema

El sistema implementa una arquitectura moderna, modular y desacoplada basada en una API RESTful empresarial construida con **NestJS y TypeScript**, persistencia relacional transaccional en **MariaDB** mediante **Prisma ORM**, y un frontend full-stack/SPA optimizado en **Next.js (App Router)** potenciado con **TanStack Query**, **Tailwind CSS** y **shadcn/ui**.

```mermaid
flowchart TB
    subgraph ClientLayer["🖥️ Capa de Frontend (Next.js 14+ App Router)"]
        RSC["Server Components (SSR / SEO / Layouts)"]
        UI["Client Components (shadcn/ui + Tailwind CSS)"]
        Cache["Capa de Estado Servidor (TanStack Query v5)"]
        APIClient["Cliente HTTP Tipado (Fetch / Axios DTOs)"]
        
        RSC --> UI
        UI <--> Cache
        Cache <--> APIClient
    end

    subgraph APILayer["⚙️ Capa de Backend (NestJS Modular Architecture)"]
        NestApp["NestJS Core Application"]
        Pipes["Zod Validation Pipes (nestjs-zod)"]
        Guards["Guards (Auth JWT & RBAC)"]
        
        subgraph Modules["Módulos de Dominio (Nest Modules)"]
            AuthMod["AuthModule"]
            EspaciosMod["EspaciosModule"]
            InventarioMod["InventarioModule"]
            ReservasMod["ReservasModule"]
            VerificacionesMod["VerificacionesModule"]
            PeriodosMod["PeriodosAcademicosModule"]
            DisponibilidadMod["DisponibilidadModule"]
        end
        
        PrismaService["PrismaService (Data Access Layer)"]
        Swagger["OpenAPI / Swagger (/api/docs)"]
        
        NestApp --> Guards
        Guards --> Pipes
        Pipes --> Modules
        Modules --> PrismaService
    end

    subgraph DataLayer["🗄️ Capa de Persistencia"]
        DB[(MariaDB 11.x - Motor Transaccional ACID)]
    end

    APIClient <== "HTTPS / JSON (Contratos Tipados Zod)" ==> NestApp
    PrismaService <== "Conexión TCP / Pool Transaccional" ==> DB
```

---

## 2. Arquitectura de Backend (NestJS + TypeScript + Prisma)

El backend adopta una arquitectura modular orientada a dominios (DDD-lite) con Inyección de Dependencias (DI), separación de responsabilidades y tipado estricto:

```
backend/src/
├── app.module.ts              # Módulo raíz que orquesta los submódulos
├── main.ts                    # Punto de entrada, configuración de CORS, Swagger y Pipes globales
├── common/                    # Elementos transversales compartidos
│   ├── decorators/            # Decoradores personalizados (@CurrentUser, @Roles, @Public)
│   ├── filters/               # HttpExceptionFilter global y PrismaClientExceptionFilter
│   ├── guards/                # JwtAuthGuard, RolesGuard (RBAC)
│   └── pipes/                 # ZodValidationPipe
├── config/                    # ConfigModule, validación de variables de entorno con Zod
├── prisma/                    # PrismaModule y PrismaService (gestión de conexión y transacciones)
└── modules/                   # Módulos encapsulados por entidad/dominio
    ├── auth/                  # AuthModule: Login institucional, JWT, Refresh Tokens
    ├── sedes/                 # SedesModule: CRUD de Sedes institucionales
    ├── bloques/               # BloquesModule: CRUD de Bloques físicos
    ├── espacios/              # EspaciosModule: Catálogo, filtros facetados y tipos de espacio
    ├── inventario/            # InventarioModule: Gestión de implementos y recursos por espacio
    ├── disponibilidad/        # DisponibilidadModule: Motor anti-solapamiento y cálculo de franjas
    ├── reservas/              # ReservasModule: Creación, cancelación y ciclo de vida de reservas
    ├── verificaciones/        # VerificacionesModule: Check-In, Check-Out y actas de novedades
    └── periodos-academicos/   # PeriodosAcademicosModule: Semestres y Clases Fijas recurrentes
```

### Flujo de Ejecución de una Solicitud de Reserva con Inventario
```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario / Solicitante
    participant Next as Next.js Client
    participant Guard as JwtAuth & Roles Guard
    participant Pipe as ZodValidationPipe
    participant Ctrl as ReservasController
    participant Srv as ReservasService
    participant Disp as DisponibilidadService
    participant Prisma as PrismaService
    participant DB as MariaDB

    U->>Next: Envía formulario de reserva
    Next->>Guard: POST /api/reservas (JWT + Payload)
    Guard->>Pipe: Token Válido
    Pipe->>Ctrl: Payload validado con ReservaSchema
    Ctrl->>Srv: crearReserva(dto, userId)
    Srv->>Disp: validarDisponibilidad(espacioId, inicio, fin)
    Disp->>Prisma: Consultar Clases Fijas y Reservas Aprobadas
    Prisma->>DB: SELECT con bloqueo transaccional
    DB-->>Disp: Disponibilidad confirmada
    Srv->>Prisma: $transaction(async tx => {...})
    Prisma->>DB: INSERT into Reserva (estado: PENDIENTE)
    Prisma->>DB: INSERT into Auditoria
    Srv-->>Ctrl: Reserva creada
    Ctrl-->>Next: 201 Created (Reserva DTO)
```

---

## 3. Modelo Relacional de Dominio (ERD Completo)

El modelo de datos normalizado soporta la jerarquía física, el calendario académico, las reservas y el **inventario con verificaciones de Check-In y Check-Out**:

```mermaid
erDiagram
    SEDE ||--o{ BLOQUE : contiene
    BLOQUE ||--o{ ESPACIO : agrupa
    ESPACIO ||--o{ ITEM_INVENTARIO : posee
    PERIODO_ACADEMICO ||--o{ CLASE_FIJA : rige
    ESPACIO ||--o{ CLASE_FIJA : programa
    ESPACIO ||--o{ RESERVA : asigna
    USUARIO ||--o{ RESERVA : solicita
    USUARIO ||--o{ APROBACION : dictamina
    RESERVA ||--o{ APROBACION : registra
    RESERVA ||--o{ VERIFICACION_INVENTARIO : genera
    USUARIO ||--o{ VERIFICACION_INVENTARIO : realiza
    VERIFICACION_INVENTARIO ||--o{ DETALLE_VERIFICACION : contiene
    ITEM_INVENTARIO ||--o{ DETALLE_VERIFICACION : evaluado_en

    SEDE {
        int id PK
        string nombre
        string ciudad
        string direccion
    }

    BLOQUE {
        int id PK
        int sedeId FK
        string codigo
        string descripcion
    }

    ESPACIO {
        int id PK
        int bloqueId FK
        string identificador "Ej. P40-201"
        string tipo "AULA | LABORATORIO | AUDITORIO | DEPORTIVO | SALA_COMPUTO"
        int capacidad
        string estado "ACTIVO | EN_MANTENIMIENTO | INACTIVO"
    }

    ITEM_INVENTARIO {
        int id PK
        int espacioId FK
        string codigo UK "SKU o Placa de Inventario"
        string nombre "Ej. TV 55, Marcador Borrable, Balón"
        string categoria "TECNOLOGIA | MOBILIARIO | DEPORTIVO | DIDACTICO"
        int cantidad
        string estado "OPTIMO | REGULAR | DANADO | DE_BAJA"
        boolean esCritico
    }

    PERIODO_ACADEMICO {
        int id PK
        string codigo "Ej. 2026-2"
        date fechaInicio
        date fechaFin
        string estado "PLANIFICACION | ACTIVO | FINALIZADO"
    }

    CLASE_FIJA {
        int id PK
        int espacioId FK
        int periodoId FK
        int diaSemana "1=Lunes .. 7=Domingo"
        time horaInicio
        time horaFin
        string asignatura
        string docente
    }

    USUARIO {
        int id PK
        string email UK "@elpoli.edu.co"
        string nombreCompleto
        string rol "ESTUDIANTE | DOCENTE | ADMINISTRATIVO | GESTOR_ESPACIO | SUPERADMIN"
        boolean activo
    }

    RESERVA {
        int id PK
        int espacioId FK
        int usuarioId FK
        datetime fechaInicio
        datetime fechaFin
        string motivo
        string estado "PENDIENTE | APROBADA | RECHAZADA | CANCELADA | EN_USO | FINALIZADA"
        datetime creadoEn
    }

    APROBACION {
        int id PK
        int reservaId FK
        int aprobadorId FK
        string estado "APROBADA | RECHAZADA"
        string observaciones
        datetime fechaAccion
    }

    VERIFICACION_INVENTARIO {
        int id PK
        int reservaId FK
        int usuarioVerificadorId FK
        string tipo "CHECK_IN | CHECK_OUT"
        string estadoGeneral "CONFORME | NO_CONFORME | CON_NOVEDADES"
        text observaciones
        datetime fechaHora
    }

    DETALLE_VERIFICACION {
        int id PK
        int verificacionId FK
        int itemInventarioId FK
        string estadoItem "PRESENTE_OPTIMO | PRESENTE_DANADO | FALTANTE"
        int cantidadEncontrada
        text observacionNovedad
    }
```

---

## 4. Motor de Detección de Conflictos (Anti-Solapamiento)

El algoritmo de validación de disponibilidad evalúa de manera transaccional dos fuentes de bloqueo para un intervalo objetivo $[T_{ini}, T_{fin}]$ en un `espacioId`:

### 1. Validación de Clases Fijas Semestrales
Para la fecha objetivo $D = \text{date}(T_{ini})$:
1. Buscar el `PeriodoAcademico` donde $D \in [\text{fechaInicio}, \text{fechaFin}]$ y $\text{estado} = \text{'ACTIVO'}$.
2. Si existe periodo activo, calcular el día de la semana $dia = \text{dayOfWeek}(D)$ y los horarios $H_{ini} = \text{time}(T_{ini})$, $H_{fin} = \text{time}(T_{fin})$.
3. Consultar colisiones en `CLASE_FIJA` cumpliendo:
   $$\text{horaInicio} < H_{fin} \quad \land \quad \text{horaFin} > H_{ini} \quad \land \quad \text{diaSemana} = dia$$

### 2. Validación de Reservas Existentes
Consultar en `RESERVA` para el mismo `espacioId`:
$$\text{estado} \in \{\text{'APROBADA'}, \text{'EN_USO'}\} \quad \land \quad \text{fechaInicio} < T_{fin} \quad \land \quad \text{fechaFin} > T_{ini}$$

### 3. Estrategia de Concurrencia (Isolation & Locking)
* Las consultas y escrituras se ejecutan dentro de una transacción atómica `prisma.$transaction(..., { isolationLevel: 'Serializable' })` garantizando que no existan condiciones de carrera (anti double-booking) ante peticiones concurrentes.

---

## 5. Arquitectura de Frontend (Next.js 14+ App Router + TanStack Query)

```
frontend/src/
├── app/                       # Enrutamiento App Router de Next.js
│   ├── (auth)/                # Rutas de autenticación (login, registro)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/           # Rutas autenticadas con Layout institucional
│   │   ├── layout.tsx         # Sidebar, Header institucional, Perfil
│   │   ├── catalogo/          # Catálogo interactivo de espacios
│   │   ├── espacios/[id]/     # Detalle de espacio, ficha técnica e inventario
│   │   ├── reservas/          # Formularios de reserva y Mis Reservas
│   │   ├── checkin-checkout/  # Flujo de verificación de inventario por reserva
│   │   ├── gestion/           # Bandeja de aprobación para GESTOR_ESPACIO
│   │   └── admin/             # Panel SuperAdmin (Sedes, Bloques, Periodos, Clases Fijas)
│   ├── layout.tsx             # Root layout con Providers (QueryClient, Auth, Theme, Toaster)
│   └── page.tsx               # Landing page institucional
├── components/                # Componentes reutilizables
│   ├── ui/                    # Primitivas shadcn/ui (Button, Dialog, Badge, Input, Table, etc.)
│   ├── catalog/               # Filtros facetados, tarjetas de espacio, badges de implementos
│   ├── inventory/             # Lista de chequeo, tarjetas de ítem, modal de reporte de novedad
│   ├── calendar/              # Grid visual de disponibilidad horaria
│   └── reservations/          # Formulario reactivo de reserva con React Hook Form + Zod
├── hooks/                     # Custom hooks con TanStack Query (queries y mutaciones)
├── lib/                       # Configuración de Axios/Fetch, utilidades de fecha (date-fns/dayjs)
└── schemas/                   # Esquemas Zod para formularios y tipado estricto
```

### Estrategia de Estado Servidor / Cliente:
* **Server Components (RSC):** Renderizado inicial ultra rápido de catálogos y metadata institucional.
* **TanStack Query (Client Hooks):**
  * `useEspacios(filters)`
  * `useDisponibilidad(espacioId, fecha)`
  * `useInventarioEspacio(espacioId)`
  * `useVerificacionCheckIn(reservaId)`
  * `useVerificacionCheckOut(reservaId)`
  * `useAprobarReserva(reservaId)`
* **Invalidación Automática:** Mutaciones invalidan selectivamente las queries vinculadas (`['disponibilidad']`, `['reservas']`, `['verificaciones']`) garantizando sincronía inmediata en la interfaz sin recargas de página.

---

## 6. Seguridad y Control de Acceso (RBAC)

1. **Autenticación:** Tokens JWT (Access Token 15 min + Refresh Token 7 días en cookies HttpOnly), validando obligatoriamente el dominio institucional `@elpoli.edu.co`.
2. **Autorización:** `RolesGuard` en NestJS evaluando metadatos `@Roles(Role.GESTOR_ESPACIO, Role.SUPERADMIN)` y middleware de rutas en Next.js.
