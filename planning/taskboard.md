# 📋 Tablero de Tareas y Épicas (Taskboard)

**Proyecto:** Sistema de Gestión, Reserva de Espacios Físicos y Control de Inventario  
**Institución:** Politécnico Colombiano Jaime Isaza Cadavid  
**Metodología:** Domain-First Spec-Driven Development (SDD)  
**Stack:** Next.js 14+ (App Router) | NestJS 10+ | TypeScript | Prisma ORM | MariaDB 11.x | Zod | TanStack Query v5

---

## 🚦 Estados del Tablero

- 📋 **BACKLOG:** Tarea especificada y pendiente de inicio.
- ⏳ **IN_PROGRESS:** En desarrollo activo.
- 🔍 **REVIEW / TESTING:** En pruebas unitarias, de integración o revisión de contratos.
- ✅ **DONE:** Cumple al 100% con la Definición de Terminado (DoD).

---

## 📊 Resumen de Épicas

| Épica       | Nombre                                                           | Total Tareas | Estado Global  |
| :---------- | :--------------------------------------------------------------- | :----------: | :------------: |
| **EPIC-01** | Infraestructura Base, Tooling y Contratos SDD (NestJS + Next.js) |      4       |    ✅ DONE     |
| **EPIC-02** | Modelado de Persistencia y Base de Datos (MariaDB + Prisma)      |      4       |    ✅ DONE     |
| **EPIC-03** | Autenticación Institucional y Control de Acceso (RBAC)           |      4       |    ✅ DONE     |
| **EPIC-04** | Motor de Disponibilidad y Detección de Conflictos                |      4       |    ✅ DONE     |
| **EPIC-05** | Catálogo Interactivo de Espacios y Consulta de Inventario        |      5       |    ✅ DONE     |
| **EPIC-06** | Ciclo de Vida de Reservas y Bandeja de Aprobaciones              |      5       |    ✅ DONE     |
| **EPIC-07** | Control de Inventario y Verificaciones (Check-In / Check-Out)    |      5       |    ✅ DONE     |
| **EPIC-08** | Gestión de Calendario Académico y Clases Fijas                   |      4       |    ✅ DONE     |
| **EPIC-09** | Pruebas de Carga, Concurrencia y Despliegue                      |      4       |    ✅ DONE     |
| **EPIC-10** | Hardening Post-Auditoría de Seguridad                            |      8       |    ✅ DONE     |
| **EPIC-11** | Correcciones de la Auditoría Exhaustiva (Oct 2026)               |     12       |    ✅ DONE     |

---

## 📝 Desglose Detallado de Tareas

### EPIC-01: Infraestructura Base, Tooling y Contratos SDD (NestJS + Next.js)

| ID          | Tarea                                                                                 | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                                                    |
| :---------- | :------------------------------------------------------------------------------------ | :-------: | :--------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-101** | Inicializar workspace backend con NestJS 10, TypeScript y ESLint                      |   Alta    |     Ninguna      | ✅ DONE | Backend inicializado con compilación estricta, Swagger configurado en `/api/docs`, Helmet, CORS y filtro global de excepciones.                            |
| **TSK-102** | Inicializar workspace frontend con Next.js 14+ (App Router), Tailwind CSS y shadcn/ui |   Alta    |     Ninguna      | ✅ DONE | Frontend Next.js con TypeScript estricto, estructura App Router, Tailwind CSS, TanStack Query y rutas base compilando en build.                            |
| **TSK-103** | Definir especificaciones agnósticas de DTOs y schemas con Zod                         |  Crítica  |     Ninguna      | ✅ DONE | Esquemas Zod creados para usuarios, sedes, bloques, espacios, items de inventario, verificaciones y reservas, con suite de 81 pruebas unitarias aprobadas. |
| **TSK-104** | Integrar `nestjs-zod` para validación automática de DTOs y Swagger en NestJS          |   Alta    | TSK-101, TSK-103 | ✅ DONE | NestJS valida payloads con ZodValidationPipe, DTOs generados con createZodDto y parche OpenAPI activo en main.ts.                                          |

---

### EPIC-02: Modelado de Persistencia y Base de Datos (MariaDB + Prisma)

| ID          | Tarea                                                                                               | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                                                                                                                                                |
| :---------- | :-------------------------------------------------------------------------------------------------- | :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-201** | Configurar conexión a MariaDB y módulo `PrismaModule` en NestJS                                     |   Alta    |     TSK-101      | ✅ DONE | `PrismaService` implementado como provider global con control de ciclo de vida (`onModuleInit`, `onModuleDestroy`) y `PrismaModule` exportado globalmente.                                                                                             |
| **TSK-202** | Implementar `schema.prisma` con modelos de dominio (Espacios, Inventario, Reservas, Verificaciones) |  Crítica  | TSK-103, TSK-201 | ✅ DONE | Modelos `Sede`, `Bloque`, `Espacio`, `ItemInventario`, `PeriodoAcademico`, `ClaseFija`, `Usuario`, `Reserva`, `Aprobacion`, `VerificacionInventario`, `DetalleVerificacion`, `Auditoria` definidos con relaciones, índices compuestos y restricciones. |
| **TSK-203** | Generar cliente tipado Prisma (`prisma generate`) y validación de esquemas                          |   Alta    |     TSK-202      | ✅ DONE | Cliente tipado generado en `@prisma/client`, validación de esquema aprobada y suite de pruebas unitarias cubriendo integridad de modelos y enums.                                                                                                      |
| **TSK-204** | Crear script de Seed con sede Medellín (Poblado), bloques, espacios, inventarios y usuarios semilla |   Media   |     TSK-203      | ✅ DONE | Seed enfocado exclusivamente en Sede Poblado (Bloques P40, P19, P31), catálogo de inventarios tecnológicos/deportivos, periodo activo 2026-2 con clases fijas y usuarios con contraseñas bcrypt.                                                       |

---

### EPIC-03: Autenticación Institucional y Control de Acceso (RBAC)

| ID          | Tarea                                                                   | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                                                        |
| :---------- | :---------------------------------------------------------------------- | :-------: | :--------------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-301** | Implementar `AuthModule` en NestJS con bcrypt y JWT                     |   Alta    |     TSK-202      | ✅ DONE | Registro y login validando obligatoriamente el dominio institucional `@elpoli.edu.co`, emisión de tokens y rotación en cookie HttpOnly.                        |
| **TSK-302** | Implementar `JwtAuthGuard` y decorador `@CurrentUser`                   |   Alta    |     TSK-301      | ✅ DONE | Guard extrae y valida token Bearer inyectando el payload del usuario en los controladores, con bypass para metadata `@Public()`.                               |
| **TSK-303** | Implementar `RolesGuard` y decorador `@Roles(...)`                      |   Alta    |     TSK-302      | ✅ DONE | Endpoints protegidos devuelven 403 Forbidden si el rol no coincide, con acceso universal para `SUPERADMIN`.                                                    |
| **TSK-304** | Configurar autenticación y middleware de protección de rutas en Next.js |   Media   | TSK-102, TSK-302 | ✅ DONE | Contexto de sesión AuthProvider en Next.js, API client con auto-refresh, middleware RBAC de protección de rutas y formularios de Login/Registro institucional. |

---

### EPIC-04: Motor de Disponibilidad y Detección de Conflictos

| ID          | Tarea                                                                | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                |
| :---------- | :------------------------------------------------------------------- | :-------: | :--------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------- |
| **TSK-401** | Desarrollar `DisponibilidadService` para colisión con Clases Fijas   |  Crítica  |     TSK-202      | ✅ DONE | Detecta si un horario colisiona con clases recurrentes considerando únicamente periodos académicos en estado `ACTIVO`. |
| **TSK-402** | Desarrollar servicio de consulta de colisión con Reservas Existentes |  Crítica  |     TSK-202      | ✅ DONE | Detecta cruces temporales con reservas existentes en estado `APROBADA` o `EN_USO`.                                     |
| **TSK-403** | Crear motor unificado transaccional anti-solapamiento                |  Crítica  | TSK-401, TSK-402 | ✅ DONE | Ejecución atómica en `prisma.$transaction` con nivel de aislamiento serializable para evitar condiciones de carrera.   |
| **TSK-404** | Endpoint de consulta de disponibilidad de espacio por fecha          |   Alta    |     TSK-403      | ✅ DONE | `GET /api/espacios/:id/disponibilidad?fecha=YYYY-MM-DD` devuelve franjas libres y ocupadas entre 06:00 y 22:00.        |

---

### EPIC-05: Catálogo Interactivo de Espacios y Consulta de Inventario

| ID          | Tarea                                                                    | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                                                |
| :---------- | :----------------------------------------------------------------------- | :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-501** | Endpoints de consulta de Sedes, Bloques y Espacios con filtros           |   Alta    |     TSK-202      | ✅ DONE | `GET /api/espacios` permite filtrar por `sedeId`, `bloqueId`, `tipo`, `capacidadMin`, estado y categoría de implementos con paginación.                |
| **TSK-502** | Configurar `QueryClientProvider` de TanStack Query v5 en Next.js         |   Alta    |     TSK-102      | ✅ DONE | Provider configurado con `QueryProvider` y factory centralizado `queryKeys.ts` con opciones de frescura y caché optimizadas.                           |
| **TSK-503** | Construir componente de Catálogo y Tarjetas de Espacio                   |   Alta    | TSK-501, TSK-502 | ✅ DONE | Renderizado de espacios mediante `EspacioCard` con badges de aforo, implementos destacados, estados y branding institucional Politécnico JIC.          |
| **TSK-504** | Implementar barra de filtros dinámicos (Sede, Bloque, Tipo, Implementos) |   Media   |     TSK-503      | ✅ DONE | Componente `FacetedFilters` con sincronización bidireccional de parámetros en URL (`useSearchParams`) y reactividad TanStack Query.                    |
| **TSK-505** | Modal / Vista de Ficha Detallada de Espacio con Ficha de Inventario      |   Media   |     TSK-503      | ✅ DONE | Vista `/espacios/[id]` con especificaciones, Rejilla interactiva de Disponibilidad Horaria (`AvailabilityGrid`), pestaña de inventario y clases fijas. |

---

### EPIC-06: Ciclo de Vida de Reservas y Bandeja de Aprobaciones

| ID          | Tarea                                                         | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                                             |
| :---------- | :------------------------------------------------------------ | :-------: | :--------------: | :-----: | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-601** | Endpoint para creación de solicitud de reserva                |  Crítica  | TSK-403, TSK-302 | ✅ DONE | `POST /api/reservas` valida disponibilidad en transacción serializable, crea reserva en `PENDIENTE` y registra auditoría.                           |
| **TSK-602** | Formulario frontend de solicitud con selector de fecha/hora   |   Alta    | TSK-601, TSK-502 | ✅ DONE | Formulario `ReservationForm` en `/reservas/nueva` con React Hook Form + Zod, validación de franjas temporales (máx 6h) y mutaciones TanStack Query. |
| **TSK-603** | Vista de "Mis Reservas" para el solicitante                   |   Alta    |     TSK-601      | ✅ DONE | Vista `/reservas` con filtrado por estado, cancelación, consulta de actas y enlaces a páginas dedicadas de Check-In y Check-Out.                    |
| **TSK-604** | Endpoints de aprobación/rechazo para `GESTOR_ESPACIO`         |  Crítica  | TSK-403, TSK-303 | ✅ DONE | `PATCH /api/reservas/:id/estado` exige motivo en rechazos, revalida disponibilidad atómica en aprobaciones y genera auditoría.                      |
| **TSK-605** | Bandeja de entrada y panel de decisión del Gestor de Espacios |   Alta    | TSK-604, TSK-502 | ✅ DONE | Bandeja en `/gestion/solicitudes` y `/gestion/novedades` con dictamen Aprobar / Rechazar (justificación obligatoria) y rehabilitación de usuarios.  |

---

### EPIC-07: Control de Inventario y Verificaciones (Check-In / Check-Out)

| ID          | Tarea                                                         | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                                                                      |
| :---------- | :------------------------------------------------------------ | :-------: | :--------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-701** | CRUD de Inventario de Implementos por Espacio en NestJS       |   Alta    | TSK-202, TSK-303 | ✅ DONE | Endpoints `GET /api/espacios/:id/inventario`, `POST /api/inventario`, `PATCH /api/inventario/:id` y `DELETE` protegidos por rol.                                             |
| **TSK-702** | Endpoint para registrar Verificación de Check-In              |  Crítica  | TSK-701, TSK-601 | ✅ DONE | `POST /api/reservas/:id/check-in` valida ventana horaria (T-15m a T+20m), registra estado de cada implemento y cambia reserva a `EN_USO`.                                    |
| **TSK-703** | Endpoint para registrar Verificación de Check-Out y Novedades |  Crítica  |     TSK-702      | ✅ DONE | `POST /api/reservas/:id/check-out` evalúa faltantes/daños, cambia reserva a `FINALIZADA` e inhabilita preventivamente al usuario infractor.                                  |
| **TSK-704** | Componente frontend de Lista de Chequeo de Implementos        |   Alta    | TSK-702, TSK-502 | ✅ DONE | Componente `InventoryChecklist` interactivo con botones radiales (`Óptimo`, `Dañado`, `Faltante`), páginas dedicadas `/reservas/[id]/check-in` y `/reservas/[id]/check-out`. |
| **TSK-705** | Panel de Reporte y Auditoría de Novedades de Inventario       |   Media   | TSK-703, TSK-502 | ✅ DONE | Vista `/gestion/novedades` y `/gestion` con listado de actas `CON_NOVEDADES`, datos del responsable, implementos afectados y rehabilitación de usuario.                      |

---

### EPIC-08: Gestión de Calendario Académico y Clases Fijas

| ID          | Tarea                                                                | Prioridad |   Dependencias   | Estado  | Criterios de Aceptación                                                                                                              |
| :---------- | :------------------------------------------------------------------- | :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-801** | CRUD de Periodos Académicos (`SUPERADMIN`)                           |   Media   | TSK-202, TSK-303 | ✅ DONE | Endpoints para crear, activar (transacción exclusiva) y listar semestres académicos con validación de fechas.                        |
| **TSK-802** | CRUD y carga masiva de Clases Fijas por Espacio                      |   Alta    |     TSK-801      | ✅ DONE | Registro de horarios semanales recurrentes asignados a un periodo académico específico y carga masiva atómica.                       |
| **TSK-803** | Vista de administración de Periodos y Horarios Académicos en Next.js |   Media   | TSK-801, TSK-802 | ✅ DONE | Vistas `/admin/sedes`, `/admin/periodos` y `/admin/clases-fijas` para gestión de infraestructura, calendario y carga académica fija. |
| **TSK-804** | Validaciones cruzadas de integridad temporal en clases fijas         |   Media   |     TSK-802      | ✅ DONE | Impide registrar clases con horas invertidas, traslapes de horario en el mismo día/espacio o fuera de límites.                       |

---

### EPIC-09: Pruebas de Carga, Concurrencia y Despliegue

| ID          | Tarea                                                                       | Prioridad |   Dependencias   |   Estado   | Criterios de Aceptación                                                                                                                                                                              |
| :---------- | :-------------------------------------------------------------------------- | :-------: | :--------------: | :--------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-901** | Pruebas unitarias y de integración del motor de solapamientos e inventario  |  Crítica  | TSK-403, TSK-703 |  ✅ DONE   | Suite de pruebas en NestJS con Jest (157 unitarias + 6 de integración Supertest en 'reservas.e2e-spec.ts') con cobertura >85% en disponibilidad, reservas y verificaciones.                          |
| **TSK-902** | Pruebas de estrés y concurrencia (Prevención de Double-Booking)             |  Crítica  |     TSK-901      |  ✅ DONE   | Script de estrés de 50 peticiones concurrentes ('scripts/test-concurrency.ts') y suite Jest ('concurrency.spec.ts') certificando 1 éxito y 49 rechazos (409 Conflict) bajo aislamiento serializable. |
| **TSK-903** | Optimización de build y Server Components en Next.js                        |   Media   | TSK-503, TSK-704 |  ✅ DONE   | Build de producción optimizado (`next build`) con 16 rutas estáticas y dinámicas compiladas limpiamente en Turbopack.                                                                                |
| **TSK-904** | Configuración de variables de entorno de producción y scripts de despliegue |   Alta    |      Todas       |  ✅ DONE   | Dockerfile multi-stage para NestJS y Next.js (standalone), docker-compose.yml con MariaDB, healthchecks automatizados y guía en EJECUTAR.md. |

---

### EPIC-10: Hardening Post-Auditoría de Seguridad

| ID           | Tarea                                                            |   Prioridad   | Dependencias | Estado  | Criterios de Aceptación                                                                                                                                                                                  |
| :----------- | :--------------------------------------------------------------- | :-----------: | :----------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-1001** | Alinear variables de entorno JWT y eliminar fallback hardcodeado |  🔴 Crítica   |      —       | ✅ DONE | `.env.example` usa `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`. `auth.service.ts`, `jwt.strategy.ts` y `auth.module.ts` lanzan error en startup si la variable no está definida. Sin fallback en código.  |
| **TSK-1002** | Bloquear elevación de rol en el registro                         |  🔴 Crítica   |      —       | ✅ DONE | `RegisterSchema` (backend y frontend) elimina el campo `rol`. `auth.service.ts` asigna `ESTUDIANTE` forzosamente. Formulario de registro muestra el rol como informativo, no editable. Test actualizado. |
| **TSK-1003** | Unificar configuración de puerto entre componentes               |  🔴 Crítica   |   TSK-1001   | ✅ DONE | `backend/.env.example` usa `PORT=4000`. `frontend/.env.local` apunta a `http://localhost:4000/api`. `EJECUTAR.md` actualizado.                                                                           |
| **TSK-1004** | Implementar Refresh Token Rotation                               | 🟡 Importante |   TSK-1001   | ✅ DONE | `auth.service.ts` genera un nuevo par completo en cada `refresh()`. `auth.controller.ts` emite la nueva cookie HttpOnly con el token rotado. El token anterior queda inválido de inmediato.              |
| **TSK-1005** | Asegurar cookies de sesión del frontend contra XSS               | 🟡 Importante |      —       | ✅ DONE | Route Handler `/api/session` emite `auth_token`, `user_role` y `user_id` como cookies `httpOnly`. `api.ts` ya no escribe en `document.cookie`. Middleware Edge lee correctamente.                        |
| **TSK-1006** | Depurar PII del localStorage                                     | 🟡 Importante |   TSK-1005   | ✅ DONE | `auth-context.tsx` solo persiste en localStorage `{ id, email, rol, nombreCompleto, inhabilitadoParaReservar, activo }`. `documentoIdentidad`, `telefono` y `motivoInhabilitacion` nunca se almacenan.   |
| **TSK-1007** | Validar query params numéricos con Zod                           | 🟡 Importante |      —       | ✅ DONE | `pagination.schema.ts` creado con `parsePaginationQuery()`. Aplicado en controllers de reservas, verificaciones, auditoría y usuarios. `?page=abc` devuelve HTTP 400.                                    |
| **TSK-1008** | Tipar `formatUserResponse` con interfaz explícita                | 🟡 Importante |      —       | ✅ DONE | `formatUserResponse` recibe `Usuario` de Prisma y devuelve `UsuarioResponse`. `generateTokens` recibe `Pick<Usuario, ...>`. Eliminado el uso de `any` en auth service.                                   |

---

### EPIC-11: Correcciones de la Auditoría Exhaustiva (Octubre 2026)

| ID           | Tarea / Hallazgo                                                      |   Prioridad   | Alcance  | Estado  | Criterios de Aceptación / Resolución                                                                                                                                                   |
| :----------- | :-------------------------------------------------------------------- | :-----------: | :------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TSK-1101** | C-01: Validación de dominio institucional en `LoginSchema` y Register |  🔴 Crítica   | Backend  | ✅ DONE | `.endsWith('@elpoli.edu.co')` agregado en backend `LoginSchema` y `RegisterSchema`. Contratos unificados con frontend y tests actualizados.                                           |
| **TSK-1102** | C-02: Normalización de zona horaria institucional (`America/Bogota`)   |  🔴 Crítica   | Backend  | ✅ DONE | `getBogotaDateTime()` implementado en `disponibilidad.service.ts`. Detección de colisión con clases fijas y rejilla diaria calculadas con UTC-5 institucional y tests de zona horaria. |
| **TSK-1103** | C-03: Comparación de Check-Out contra acta de Check-In                |  🔴 Crítica   | Backend  | ✅ DONE | `registrarCheckOut()` recupera `CHECK_IN` y solo sanciona/inhabilita si los implementos empeoraron (daños nuevos o faltantes). Daños preexistentes documentados en ingreso no sancionan.    |
| **TSK-1104** | A-02: Validación de ventana máxima de Check-Out                       |  🟠 Alta      | Backend  | ✅ DONE | Check-Out valida que `ahora <= T_fin + 30m`. Expiración lanza `BadRequestException`.                                                                                                   |
| **TSK-1105** | A-04: Cancelación automática por inasistencia (No-Show)               |  🟠 Alta      | Backend  | ✅ DONE | Método `procesarNoShows()` cancela reservas `APROBADA` con más de 20 min de atraso sin Check-In. Endpoint `POST /reservas/procesar-no-shows` e invocación lazy en consultas.          |
| **TSK-1106** | A-05: Desempaquetado limpio de paginación en frontend                 |  🟠 Alta      | Frontend | ✅ DONE | `apiClient` desempaqueta `{ data, meta }` excluyendo metadata redundante de envelope HTTP.                                                                                             |
| **TSK-1107** | A-06: Diferenciación funcional de roles `DOCENTE` y `ADMINISTRATIVO`  |  🟠 Alta      | Frontend | ✅ DONE | `isDocente` e `isAdministrativo` expuestos de forma independiente en `AuthContext` manteniendo `isDocenteOrAdmin`.                                                                     |
| **TSK-1108** | M-01 & M-02: Eliminación de `any` y unificación de contratos en API   |  🟡 Media     | Frontend | ✅ DONE | Métodos de `api.ts` fuertemente tipados con entidades de dominio (`EspacioEntity`, `ReservaEntity`, etc.). Cero errores en `tsc --noEmit`.                                            |
| **TSK-1109** | M-04 & M-05: Hardening de Prisma y protección de contraseñas en Seed  |  🟡 Media     | Backend  | ✅ DONE | Eliminada feature experimental `relationJoins`. Script `seed.ts` omite `passwordHash` en `update` de upsert de usuarios existentes.                                                    |
| **TSK-1110** | M-06: Validación de IDs numéricos en bandeja de gestión               |  🟡 Media     | Backend  | ✅ DONE | `GestionReservasQuerySchema` valida `espacioId`, `sedeId`, `bloqueId`, `page`, `limit` devolviendo HTTP 400 si son inválidos o no numéricos.                                          |
| **TSK-1111** | M-07, B-08 & M-08: Limpieza de módulos muertos y config de producción |  🟡 Media     | Ambos    | ✅ DONE | Directorio muerto `modules/calendario` eliminado. `next.config.ts` configurado con `output: 'standalone'` y `poweredByHeader: false`.                                                  |
| **TSK-1112** | M-09, B-04 & B-09: Caché JWT, Health Check y Swagger Bearer Auth      |  🟢 Baja      | Backend  | ✅ DONE | TTL cache de 30s en `JwtStrategy.validate()`. `AppService.getHealth()` verifica BD con `SELECT 1`. Decorador `@ApiBearerAuth()` añadido a endpoints GET de catálogo e inventario.     |
| *EXCLUIDAS*  | A-01, A-03, M-03, B-01, B-02                                          |       —       |    —     | ⏭️ SKIP  | Excluidas explícitamente de la implementación por instrucción del usuario.                                                                                                             |
