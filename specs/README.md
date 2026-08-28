# 📚 Especificaciones Técnicas del Sistema Uni-Espacios (`/specs`)
**Proyecto:** Sistema de Gestión, Reserva de Espacios Físicos y Control de Inventario  
**Institución:** Politécnico Colombiano Jaime Isaza Cadavid  
**Metodología:** Domain-First Spec-Driven Development (SDD)  
**Stack Principal:** Next.js 14+ (App Router) | NestJS 10+ | TypeScript | Prisma ORM | MariaDB 11.x | Zod | TanStack Query v5  

---

## 📌 1. Propósito y Filosofía de estas Especificaciones

Este directorio contiene las **especificaciones técnicas formales y ejecutables** del proyecto **Uni-Espacios**. En la metodología **Spec-Driven Development (SDD)**, ningún módulo, componente, endpoint o tabla de base de datos se construye sin un contrato y especificación previa.

Estas especificaciones son la **fuente única de verdad técnica** para:
1. **Garantizar tipado estricto y cero errores en tiempo de ejecución:** Todo dato que ingresa o sale del sistema está validado por esquemas Zod unificados.
2. **Prevenir colisiones y condiciones de carrera (Anti Double-Booking):** El motor de disponibilidad y las transacciones en MariaDB operan bajo aislamiento serializable formalmente especificado.
3. **Asegurar la custodia rigurosa de recursos pedagógicos y deportivos:** El flujo de Check-In y Check-Out define actas digitales y reportes de novedades auditables.
4. **Cumplir cada tarea del [taskboard.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/taskboard.md) y cada hito de [phase-by-phase.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/phase-by-phase.md)** de manera controlada y sin ambigüedades.

---

## 📑 2. Índice Maestro de Documentos de Especificación

| Documento | Título y Enfoque | Resumen de Contenido |
| :--- | :--- | :--- |
| **[01-contracts-and-schemas.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/01-contracts-and-schemas.md)** | **Contratos, Esquemas Zod y Tipos TypeScript** | Schemas agnósticos de entrada/salida, validaciones de dominio (`@elpoli.edu.co`, límites, horas `HH:mm`), DTOs y tipos derivados. |
| **[02-database-and-persistence.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/02-database-and-persistence.md)** | **Persistencia, Modelado Prisma y MariaDB** | Archivo `schema.prisma` completo, índices compuestos para disponibilidad, relaciones de inventario, estrategia de migraciones y script de Seed institucional. |
| **[03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md)** | **Arquitectura de Backend NestJS y API REST** | Árbol modular, inyección de dependencias, filtros globales de excepción, pipes de validación Zod, documentación Swagger y catálogo completo de endpoints. |
| **[04-security-and-rbac.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/04-security-and-rbac.md)** | **Seguridad, Autenticación JWT y Matriz RBAC** | Flujo de Access (15 min) + Refresh Tokens (7 días en HttpOnly cookies), hashing bcrypt, Guards, decoradores `@CurrentUser`/`@Roles` y matriz RBAC exhaustiva. |
| **[05-availability-and-concurrency-engine.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/05-availability-and-concurrency-engine.md)** | **Motor de Disponibilidad y Anti-Solapamiento** | Algoritmos de colisión temporal con clases fijas y reservas, transacciones serializables `prisma.$transaction`, manejo de bloqueos y cálculo de disponibilidad. |
| **[06-inventory-checkin-checkout-flow.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/06-inventory-checkin-checkout-flow.md)** | **Inventario y Flujo Check-In / Check-Out** | Máquina de estados de implementos y reservas, ventana horaria de check-in, acta de entrega/devolución, reporte de novedades y bloqueo preventivo de usuarios. |
| **[07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md)** | **Arquitectura Frontend Next.js 14+ y UI** | App Router, Server vs Client Components, TanStack Query v5 (query keys, mutaciones, invalidación), React Hook Form + Zod, catálogo con filtros facetados y componentes UI. |
| **[08-testing-qa-and-hardening.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/08-testing-qa-and-hardening.md)** | **Testing, Pruebas de Estrés y QA** | Pruebas unitarias en NestJS con Jest, pruebas de concurrencia extrema (50 solicitudes simultáneas anti double-booking), pruebas E2E y criterios de calidad. |
| **[09-deployment-and-devops.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/09-deployment-and-devops.md)** | **Despliegue, Docker y Variables de Entorno** | Dockerfiles multi-stage para NestJS y Next.js, `docker-compose.yml` completo con MariaDB 11.x, validación de `.env` y pipeline de despliegue. |

---

## 🗺️ 3. Matriz de Trazabilidad: Tareas del Taskboard vs. Especificaciones

A continuación se detalla cómo cada una de las **37 tareas** del [taskboard.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/taskboard.md) se encuentra especificada:

| Épica | ID Tarea | Nombre de la Tarea | Documento de Especificación | Sección Específica |
| :--- | :--- | :--- | :--- | :--- |
| **EPIC-01** | `TSK-101` | Inicializar backend NestJS 10, TypeScript y ESLint | [01-contracts-and-schemas.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/01-contracts-and-schemas.md) | Sec. 2 (Scaffolding NestJS y Tooling) |
| **EPIC-01** | `TSK-102` | Inicializar frontend Next.js 14+, Tailwind y shadcn/ui | [01-contracts-and-schemas.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/01-contracts-and-schemas.md) | Sec. 3 (Scaffolding Next.js y shadcn/ui) |
| **EPIC-01** | `TSK-103` | Definir DTOs y esquemas agnósticos con Zod | [01-contracts-and-schemas.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/01-contracts-and-schemas.md) | Sec. 4 (Schemas Completos de Dominio) |
| **EPIC-01** | `TSK-104` | Integrar `nestjs-zod` y Swagger en NestJS | [01-contracts-and-schemas.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/01-contracts-and-schemas.md) | Sec. 5 (Integración nestjs-zod y Swagger) |
| **EPIC-02** | `TSK-201` | Configurar MariaDB y `PrismaModule` en NestJS | [02-database-and-persistence.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/02-database-and-persistence.md) | Sec. 1, 4 (PrismaService y Conexión) |
| **EPIC-02** | `TSK-202` | Implementar `schema.prisma` con modelos de dominio | [02-database-and-persistence.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/02-database-and-persistence.md) | Sec. 2 (Schema Prisma Completo) |
| **EPIC-02** | `TSK-203` | Generar y aplicar migraciones de base de datos | [02-database-and-persistence.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/02-database-and-persistence.md) | Sec. 3 (Estrategia de Migraciones) |
| **EPIC-02** | `TSK-204` | Script de Seed institucional (Sedes, Bloques, Aulas, Inventario) | [02-database-and-persistence.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/02-database-and-persistence.md) | Sec. 5 (Script Seed con Datos Reales) |
| **EPIC-03** | `TSK-301` | `AuthModule` en NestJS con bcrypt y JWT | [04-security-and-rbac.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/04-security-and-rbac.md) | Sec. 2 (Servicio y Hashing de Auth) |
| **EPIC-03** | `TSK-302` | `JwtAuthGuard` y decorador `@CurrentUser` | [04-security-and-rbac.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/04-security-and-rbac.md) | Sec. 3 (Guards y Estrategias Passport) |
| **EPIC-03** | `TSK-303` | `RolesGuard` y decorador `@Roles(...)` | [04-security-and-rbac.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/04-security-and-rbac.md) | Sec. 4 (RBAC y Decoradores de Rol) |
| **EPIC-03** | `TSK-304` | Autenticación y middleware de rutas en Next.js | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 4 (Middleware y AuthContext) |
| **EPIC-04** | `TSK-401` | `DisponibilidadService` para colisión con Clases Fijas | [05-availability-and-concurrency-engine.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/05-availability-and-concurrency-engine.md) | Sec. 2 (Algoritmo Clases Fijas) |
| **EPIC-04** | `TSK-402` | Servicio de colisión con Reservas Existentes | [05-availability-and-concurrency-engine.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/05-availability-and-concurrency-engine.md) | Sec. 3 (Algoritmo Reservas Aprobadas) |
| **EPIC-04** | `TSK-403` | Motor transaccional anti-solapamiento serializable | [05-availability-and-concurrency-engine.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/05-availability-and-concurrency-engine.md) | Sec. 4 (Transacciones e Invariantes) |
| **EPIC-04** | `TSK-404` | Endpoint `GET /api/espacios/:id/disponibilidad` | [05-availability-and-concurrency-engine.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/05-availability-and-concurrency-engine.md) | Sec. 5 (Cálculo de Rejilla Horaria) |
| **EPIC-05** | `TSK-501` | Endpoints de Sedes, Bloques y Espacios con filtros | [03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md) | Sec. 5 (EspaciosController y Filtros) |
| **EPIC-05** | `TSK-502` | `QueryClientProvider` de TanStack Query v5 | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 3 (Configuración TanStack Query) |
| **EPIC-05** | `TSK-503` | Componente de Catálogo y Tarjetas de Espacio | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 5 (Catálogo y EspacioCard) |
| **EPIC-05** | `TSK-504` | Filtros facetados dinámicos con URL sync | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 5 (Componente FacetedFilters) |
| **EPIC-05** | `TSK-505` | Ficha técnica detallada e inventario del espacio | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 6 (Detalle de Espacio e Inventario) |
| **EPIC-06** | `TSK-601` | Endpoint para creación de solicitud de reserva | [03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md) | Sec. 5 (ReservasController) |
| **EPIC-06** | `TSK-602` | Formulario de solicitud con React Hook Form + Zod | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 7 (Formulario de Reserva) |
| **EPIC-06** | `TSK-603` | Vista de "Mis Reservas" con cancelación | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 7 (MisReservasView) |
| **EPIC-06** | `TSK-604` | Endpoints de aprobación/rechazo para `GESTOR_ESPACIO` | [03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md) | Sec. 5 (AprobacionesController) |
| **EPIC-06** | `TSK-605` | Bandeja de gestión y aprobación de solicitudes | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 8 (Bandeja de Gestores) |
| **EPIC-07** | `TSK-701` | CRUD de Inventario de Implementos en NestJS | [03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md) | Sec. 5 (InventarioController) |
| **EPIC-07** | `TSK-702` | Endpoint de Verificación Check-In en NestJS | [06-inventory-checkin-checkout-flow.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/06-inventory-checkin-checkout-flow.md) | Sec. 3 (Endpoint y Lógica Check-In) |
| **EPIC-07** | `TSK-703` | Endpoint de Verificación Check-Out y Novedades | [06-inventory-checkin-checkout-flow.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/06-inventory-checkin-checkout-flow.md) | Sec. 4 (Endpoint y Novedades Check-Out) |
| **EPIC-07** | `TSK-704` | Componente de Lista de Chequeo de Implementos | [06-inventory-checkin-checkout-flow.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/06-inventory-checkin-checkout-flow.md) | Sec. 5 (UI Checklist y Modales) |
| **EPIC-07** | `TSK-705` | Panel de Reporte y Auditoría de Novedades | [06-inventory-checkin-checkout-flow.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/06-inventory-checkin-checkout-flow.md) | Sec. 6 (Auditoría e Inhabilitación) |
| **EPIC-08** | `TSK-801` | CRUD de Periodos Académicos (`SUPERADMIN`) | [03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md) | Sec. 5 (PeriodosAcademicosController) |
| **EPIC-08** | `TSK-802` | CRUD y carga de Clases Fijas por Espacio | [03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md) | Sec. 5 (ClasesFijasController) |
| **EPIC-08** | `TSK-803` | Vista administrativa de Periodos y Horarios | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 9 (Panel de SuperAdmin) |
| **EPIC-08** | `TSK-804` | Validaciones cruzadas de integridad temporal en clases | [01-contracts-and-schemas.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/01-contracts-and-schemas.md) | Sec. 5 (Refinamientos en ClaseFijaSchema) |
| **EPIC-09** | `TSK-901` | Pruebas unitarias de solapamiento e inventario | [08-testing-qa-and-hardening.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/08-testing-qa-and-hardening.md) | Sec. 2 (Suites Unitarias con Jest) |
| **EPIC-09** | `TSK-902` | Pruebas de estrés concurrente (Anti Double-Booking) | [08-testing-qa-and-hardening.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/08-testing-qa-and-hardening.md) | Sec. 3 (Script de Carga Concurrente) |
| **EPIC-09** | `TSK-903` | Optimización de build y Server Components | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) | Sec. 10 (Optimizaciones y Performance) |
| **EPIC-09** | `TSK-904` | Dockerización y pipeline de despliegue | [09-deployment-and-devops.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/09-deployment-and-devops.md) | Sec. 1, 2, 3 (Docker y Compose) |

---

## 📅 4. Matriz de Trazabilidad: Cronograma Día a Día (Fase por Fase)

| Fase | Días | Objetivos Principales | Documentos de Referencia |
| :--- | :--- | :--- | :--- |
| **Fase 1: Fundamentos y Persistencia** | Días 1 - 4 | Scaffolding, Contratos Zod, Prisma Schema en MariaDB, Seed institucional, Auth JWT y RBAC. | [01-contracts-and-schemas.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/01-contracts-and-schemas.md), [02-database-and-persistence.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/02-database-and-persistence.md), [04-security-and-rbac.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/04-security-and-rbac.md) |
| **Fase 2: Motor de Dominio e Inventario** | Días 5 - 8 | Sedes, Bloques, Espacios, Inventario, Calendario Académico, Motor Anti-Solapamiento y Tests Unitarios. | [03-backend-architecture-and-api.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/03-backend-architecture-and-api.md), [05-availability-and-concurrency-engine.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/05-availability-and-concurrency-engine.md), [08-testing-qa-and-hardening.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/08-testing-qa-and-hardening.md) |
| **Fase 3: Frontend y Catálogo Interactivo** | Días 9 - 13 | TanStack Query v5, Catálogo facetado, Detalle de Espacio con Ficha de Inventario, Formulario de Reserva y Mis Reservas. | [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) |
| **Fase 4: Check-In/Out y Aprobaciones** | Días 14 - 17 | Endpoints y UI de Check-In / Check-Out, Reporte de Novedades, Bandeja de Gestores y Panel SuperAdmin. | [06-inventory-checkin-checkout-flow.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/06-inventory-checkin-checkout-flow.md), [07-frontend-architecture-and-ui.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/07-frontend-architecture-and-ui.md) |
| **Fase 5: Hardening, Pruebas y Cierre** | Días 18 - 20 | Test de concurrencia 50 peticiones simultáneas, optimizaciones de build, Docker Compose y documentación final. | [08-testing-qa-and-hardening.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/08-testing-qa-and-hardening.md), [09-deployment-and-devops.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/specs/09-deployment-and-devops.md) |

---

## 🛡️ 5. Reglas de Calidad y Criterios Innegociables (Definition of Done)

Para considerar una tarea completada, los desarrolladores y agentes deben validar:

1. **Tipado Estricto (Strict TypeScript):**
   * Configuración `"strict": true`, `"noImplicitAny": true`. Prohibido el uso de `any`; utilizar genéricos o `unknown` con type guards.
2. **Validación Exhaustiva (Zod):**
   * Todo payload HTTP entrante debe validarse mediante `ZodValidationPipe` con DTOs generados desde esquemas Zod con `createZodDto`.
3. **Atomicidad y Aislamiento Transaccional:**
   * Toda creación, modificación o aprobación de reserva debe ejecutarse dentro de `prisma.$transaction` con nivel de aislamiento `Serializable`.
4. **Seguridad Institucional:**
   * Validar que todo correo registrado pertenezca al dominio `@elpoli.edu.co`.
   * Contraseñas hasheadas con bcrypt (cost factor >= 10).
   * Tokens almacenados en cookies HttpOnly seguras con SameSite restrictivo.
5. **Cero Fugas de Estado en Frontend:**
   * Utilizar TanStack Query v5 para todo estado servidor. Cero duplicación en `useState` ni `useEffect` redundantes para sincronización de datos.
6. **Manejo de Errores Estandarizado:**
   * Todas las respuestas de error del backend deben emitir un JSON estructurado con `statusCode`, `message`, `error` y `timestamp`.
