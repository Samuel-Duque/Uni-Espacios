# 📋 Tablero de Tareas y Épicas (Taskboard)
**Proyecto:** Sistema de Gestión, Reserva de Espacios Físicos y Control de Inventario  
**Institución:** Politécnico Colombiano Jaime Isaza Cadavid  
**Metodología:** Domain-First Spec-Driven Development (SDD)  
**Stack:** Next.js 14+ (App Router) | NestJS 10+ | TypeScript | Prisma ORM | MariaDB 11.x | Zod | TanStack Query v5  

---

## 🚦 Estados del Tablero
* 📋 **BACKLOG:** Tarea especificada y pendiente de inicio.
* ⏳ **IN_PROGRESS:** En desarrollo activo.
* 🔍 **REVIEW / TESTING:** En pruebas unitarias, de integración o revisión de contratos.
* ✅ **DONE:** Cumple al 100% con la Definición de Terminado (DoD).

---

## 📊 Resumen de Épicas

| Épica | Nombre | Total Tareas | Estado Global |
| :--- | :--- | :---: | :---: |
| **EPIC-01** | Infraestructura Base, Tooling y Contratos SDD (NestJS + Next.js) | 4 | ✅ DONE |
| **EPIC-02** | Modelado de Persistencia y Base de Datos (MariaDB + Prisma) | 4 | ✅ DONE |
| **EPIC-03** | Autenticación Institucional y Control de Acceso (RBAC) | 4 | ⏳ IN_PROGRESS |
| **EPIC-04** | Motor de Disponibilidad y Detección de Conflictos | 4 | ✅ DONE |
| **EPIC-05** | Catálogo Interactivo de Espacios y Consulta de Inventario | 5 | ⏳ IN_PROGRESS |
| **EPIC-06** | Ciclo de Vida de Reservas y Bandeja de Aprobaciones | 5 | ⏳ IN_PROGRESS |
| **EPIC-07** | Control de Inventario y Verificaciones (Check-In / Check-Out) | 5 | ⏳ IN_PROGRESS |
| **EPIC-08** | Gestión de Calendario Académico y Clases Fijas | 4 | ⏳ IN_PROGRESS |
| **EPIC-09** | Pruebas de Carga, Concurrencia y Despliegue | 4 | ⏳ IN_PROGRESS |

---

## 📝 Desglose Detallado de Tareas

### EPIC-01: Infraestructura Base, Tooling y Contratos SDD (NestJS + Next.js)
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-101** | Inicializar workspace backend con NestJS 10, TypeScript y ESLint | Alta | Ninguna | ✅ DONE | Backend inicializado con compilación estricta, Swagger configurado en `/api/docs`, Helmet, CORS y filtro global de excepciones. |
| **TSK-102** | Inicializar workspace frontend con Next.js 14+ (App Router), Tailwind CSS y shadcn/ui | Alta | Ninguna | ✅ DONE | Frontend Next.js con TypeScript estricto, estructura App Router, Tailwind CSS, TanStack Query y rutas base compilando en build. |
| **TSK-103** | Definir especificaciones agnósticas de DTOs y schemas con Zod | Crítica | Ninguna | ✅ DONE | Esquemas Zod creados para usuarios, sedes, bloques, espacios, items de inventario, verificaciones y reservas, con suite de 81 pruebas unitarias aprobadas. |
| **TSK-104** | Integrar `nestjs-zod` para validación automática de DTOs y Swagger en NestJS | Alta | TSK-101, TSK-103 | ✅ DONE | NestJS valida payloads con ZodValidationPipe, DTOs generados con createZodDto y parche OpenAPI activo en main.ts. |

---

### EPIC-02: Modelado de Persistencia y Base de Datos (MariaDB + Prisma)
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-201** | Configurar conexión a MariaDB y módulo `PrismaModule` en NestJS | Alta | TSK-101 | ✅ DONE | `PrismaService` implementado como provider global con control de ciclo de vida (`onModuleInit`, `onModuleDestroy`) y `PrismaModule` exportado globalmente. |
| **TSK-202** | Implementar `schema.prisma` con modelos de dominio (Espacios, Inventario, Reservas, Verificaciones) | Crítica | TSK-103, TSK-201 | ✅ DONE | Modelos `Sede`, `Bloque`, `Espacio`, `ItemInventario`, `PeriodoAcademico`, `ClaseFija`, `Usuario`, `Reserva`, `Aprobacion`, `VerificacionInventario`, `DetalleVerificacion`, `Auditoria` definidos con relaciones, índices compuestos y restricciones. |
| **TSK-203** | Generar cliente tipado Prisma (`prisma generate`) y validación de esquemas | Alta | TSK-202 | ✅ DONE | Cliente tipado generado en `@prisma/client`, validación de esquema aprobada y suite de pruebas unitarias cubriendo integridad de modelos y enums. |
| **TSK-204** | Crear script de Seed con sede Medellín (Poblado), bloques, espacios, inventarios y usuarios semilla | Media | TSK-203 | ✅ DONE | Seed enfocado exclusivamente en Sede Poblado (Bloques P40, P19, P31), catálogo de inventarios tecnológicos/deportivos, periodo activo 2026-2 con clases fijas y usuarios con contraseñas bcrypt. |

---

### EPIC-03: Autenticación Institucional y Control de Acceso (RBAC)
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-301** | Implementar `AuthModule` en NestJS con bcrypt y JWT | Alta | TSK-202 | ✅ DONE | Registro y login validando obligatoriamente el dominio institucional `@elpoli.edu.co`, emisión de tokens y rotación en cookie HttpOnly. |
| **TSK-302** | Implementar `JwtAuthGuard` y decorador `@CurrentUser` | Alta | TSK-301 | ✅ DONE | Guard extrae y valida token Bearer inyectando el payload del usuario en los controladores, con bypass para metadata `@Public()`. |
| **TSK-303** | Implementar `RolesGuard` y decorador `@Roles(...)` | Alta | TSK-302 | ✅ DONE | Endpoints protegidos devuelven 403 Forbidden si el rol no coincide, con acceso universal para `SUPERADMIN`. |
| **TSK-304** | Configurar autenticación y middleware de protección de rutas en Next.js | Media | TSK-102, TSK-302 | 📋 BACKLOG | Contexto de sesión en Next.js, persistencia de tokens seguros y redirecciones automáticas por rol. |

---

### EPIC-04: Motor de Disponibilidad y Detección de Conflictos
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-401** | Desarrollar `DisponibilidadService` para colisión con Clases Fijas | Crítica | TSK-202 | ✅ DONE | Detecta si un horario colisiona con clases recurrentes considerando únicamente periodos académicos en estado `ACTIVO`. |
| **TSK-402** | Desarrollar servicio de consulta de colisión con Reservas Existentes | Crítica | TSK-202 | ✅ DONE | Detecta cruces temporales con reservas existentes en estado `APROBADA` o `EN_USO`. |
| **TSK-403** | Crear motor unificado transaccional anti-solapamiento | Crítica | TSK-401, TSK-402 | ✅ DONE | Ejecución atómica en `prisma.$transaction` con nivel de aislamiento serializable para evitar condiciones de carrera. |
| **TSK-404** | Endpoint de consulta de disponibilidad de espacio por fecha | Alta | TSK-403 | ✅ DONE | `GET /api/espacios/:id/disponibilidad?fecha=YYYY-MM-DD` devuelve franjas libres y ocupadas entre 06:00 y 22:00. |

---

### EPIC-05: Catálogo Interactivo de Espacios y Consulta de Inventario
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-501** | Endpoints de consulta de Sedes, Bloques y Espacios con filtros | Alta | TSK-202 | ✅ DONE | `GET /api/espacios` permite filtrar por `sedeId`, `bloqueId`, `tipo`, `capacidadMin`, estado y categoría de implementos con paginación. |
| **TSK-502** | Configurar `QueryClientProvider` de TanStack Query v5 en Next.js | Alta | TSK-102 | 📋 BACKLOG | Provider configurado con soporte de hidratación y manejo de reintentos optimizado. |
| **TSK-503** | Construir componente de Catálogo y Tarjetas de Espacio | Alta | TSK-501, TSK-502 | 📋 BACKLOG | Renderizado de espacios con badges de aforo, implementos destacados y estado en Tailwind CSS. |
| **TSK-504** | Implementar barra de filtros dinámicos (Sede, Bloque, Tipo, Implementos) | Media | TSK-503 | 📋 BACKLOG | Filtros sincronizados con la URL y actualizados reactivamente con TanStack Query. |
| **TSK-505** | Modal / Vista de Ficha Detallada de Espacio con Ficha de Inventario | Media | TSK-503 | 📋 BACKLOG | Muestra especificaciones, lista de implementos incluidos (TV, marcadores, balones) y botón directo a reservar. |

---

### EPIC-06: Ciclo de Vida de Reservas y Bandeja de Aprobaciones
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-601** | Endpoint para creación de solicitud de reserva | Crítica | TSK-403, TSK-302 | ✅ DONE | `POST /api/reservas` valida disponibilidad en transacción serializable, crea reserva en `PENDIENTE` y registra auditoría. |
| **TSK-602** | Formulario frontend de solicitud con selector de fecha/hora | Alta | TSK-601, TSK-502 | 📋 BACKLOG | React Hook Form + Zod valida horario en cliente y envía mutación a TanStack Query. |
| **TSK-603** | Vista de "Mis Reservas" para el solicitante | Alta | TSK-601 | 📋 BACKLOG | Lista de reservas con estados (`PENDIENTE`, `APROBADA`, `EN_USO`, `FINALIZADA`) y opción de cancelación. |
| **TSK-604** | Endpoints de aprobación/rechazo para `GESTOR_ESPACIO` | Crítica | TSK-403, TSK-303 | ✅ DONE | `PATCH /api/reservas/:id/estado` exige motivo en rechazos, revalida disponibilidad atómica en aprobaciones y genera auditoría. |
| **TSK-605** | Bandeja de entrada y panel de decisión del Gestor de Espacios | Alta | TSK-604, TSK-502 | 📋 BACKLOG | Tabla interactiva con botones Aprobar / Rechazar (con modal de observaciones) e invalidación de caché reactiva. |

---

### EPIC-07: Control de Inventario y Verificaciones (Check-In / Check-Out)
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-701** | CRUD de Inventario de Implementos por Espacio en NestJS | Alta | TSK-202, TSK-303 | ✅ DONE | Endpoints `GET /api/espacios/:id/inventario`, `POST /api/inventario`, `PATCH /api/inventario/:id` y `DELETE` protegidos por rol. |
| **TSK-702** | Endpoint para registrar Verificación de Check-In | Crítica | TSK-701, TSK-601 | ✅ DONE | `POST /api/reservas/:id/check-in` valida ventana horaria (T-15m a T+20m), registra estado de cada implemento y cambia reserva a `EN_USO`. |
| **TSK-703** | Endpoint para registrar Verificación de Check-Out y Novedades | Crítica | TSK-702 | ✅ DONE | `POST /api/reservas/:id/check-out` evalúa faltantes/daños, cambia reserva a `FINALIZADA` e inhabilita preventivamente al usuario infractor. |
| **TSK-704** | Componente frontend de Lista de Chequeo de Implementos | Alta | TSK-702, TSK-502 | 📋 BACKLOG | Interfaz visual interactiva para marcar ítem por ítem el estado de los recursos pedagógicos/deportivos. |
| **TSK-705** | Panel de Reporte y Auditoría de Novedades de Inventario | Media | TSK-703, TSK-502 | 📋 BACKLOG | Vista para gestores con historial de implementos dañados/faltantes y responsable asociado. |

---

### EPIC-08: Gestión de Calendario Académico y Clases Fijas
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-801** | CRUD de Periodos Académicos (`SUPERADMIN`) | Media | TSK-202, TSK-303 | ✅ DONE | Endpoints para crear, activar (transacción exclusiva) y listar semestres académicos con validación de fechas. |
| **TSK-802** | CRUD y carga masiva de Clases Fijas por Espacio | Alta | TSK-801 | ✅ DONE | Registro de horarios semanales recurrentes asignados a un periodo académico específico y carga masiva atómica. |
| **TSK-803** | Vista de administración de Periodos y Horarios Académicos en Next.js | Media | TSK-801, TSK-802 | 📋 BACKLOG | Interfaz para que administradores gestionen el calendario y visualicen la carga fija semanal. |
| **TSK-804** | Validaciones cruzadas de integridad temporal en clases fijas | Media | TSK-802 | ✅ DONE | Impide registrar clases con horas invertidas, traslapes de horario en el mismo día/espacio o fuera de límites. |

---

### EPIC-09: Pruebas de Carga, Concurrencia y Despliegue
| ID | Tarea | Prioridad | Dependencias | Estado | Criterios de Aceptación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TSK-901** | Pruebas unitarias y de integración del motor de solapamientos e inventario | Crítica | TSK-403, TSK-703 | ✅ DONE | Suite de pruebas en NestJS con Jest (123 tests aprobados) cubriendo auth, guards, filtros, disponibilidad, reservas e inventario. |
| **TSK-902** | Pruebas de estrés y concurrencia (Prevención de Double-Booking) | Crítica | TSK-901 | 📋 BACKLOG | 50 solicitudes concurrentes para el mismo espacio/hora solo permiten 1 reserva exitosa. |
| **TSK-903** | Optimización de build y Server Components en Next.js | Media | TSK-503, TSK-704 | 📋 BACKLOG | Build de producción optimizado (`next build`), SSR fluido y bundle JS reducido. |
| **TSK-904** | Configuración de variables de entorno de producción y scripts de despliegue | Alta | Todas | 📋 BACKLOG | Dockerfile multi-stage para NestJS y Next.js, scripts de migración y documentación de despliegue. |
