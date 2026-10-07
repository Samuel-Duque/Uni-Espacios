# 🔍 Auditoría Exhaustiva — Uni-Espacios

**Fecha:** 7 de octubre de 2026  
**Alcance:** Backend (NestJS 10 + Prisma 5 + MariaDB), Frontend (Next.js 16 + React 19), Contratos Zod, Despliegue, Reglas de Negocio  
**Metodología:** Revisión manual de código fuente, specs, planning, schemas, tests y configuración  

---

## Resumen Ejecutivo

El proyecto está en un estado sólido en cuanto a arquitectura y cumplimiento de reglas de negocio críticas. Sin embargo, la auditoría identificó **27 hallazgos** agrupados en 4 niveles de severidad. Los problemas más graves se concentran en dos áreas: una **brecha de seguridad real en la validación del dominio institucional en backend**, y un conjunto de **problemas de zona horaria** en el motor de disponibilidad que pueden provocar falsos positivos o negativos en producción. Los demás hallazgos son malas prácticas, incoherencias de contrato y deuda técnica acumulada.

| Severidad | Cantidad | Descripción |
|---|:---:|---|
| 🔴 **CRÍTICO** | 3 | Riesgo de seguridad o corrupción de datos en producción |
| 🟠 **ALTO** | 6 | Violación de reglas de negocio o bugs funcionales |
| 🟡 **MEDIO** | 9 | Malas prácticas, incoherencias de contrato, deuda técnica |
| 🟢 **BAJO** | 9 | Mejoras de calidad, documentación y hardening menor |

---

## 🔴 CRÍTICOS

---

### C-01 — El `LoginSchema` del backend NO valida el dominio institucional

**Archivo:** `backend/src/schemas/usuario.schema.ts`  
**Regla de negocio violada:** "Registro y autenticación exclusivos para usuarios institucionales con dominio `@elpoli.edu.co`."

El `RegisterSchema` del backend no tiene `.endsWith('@elpoli.edu.co')`. La validación del dominio solo está en el **service** (como comprobación manual en `auth.service.ts`), lo que la hace completamente invisible para `nestjs-zod` y Swagger. Pero más grave aún: el `LoginSchema` no tiene ninguna validación de dominio en ninguna capa.

```typescript
// backend/src/schemas/usuario.schema.ts — ESTADO ACTUAL (INCORRECTO)
export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Formato de correo inválido' }),
  // ⚠️ Falta: .endsWith('@elpoli.edu.co')
  password: z.string().min(1, ...),
});
```

Esto significa que cualquier persona con una cuenta `@gmail.com` creada directamente en BD puede iniciar sesión sin ser bloqueada por la capa de contratos. La comparación con el frontend es reveladora: el `LoginSchema` del frontend **sí** incluye `.endsWith('@elpoli.edu.co')`, creando una **asimetría de contrato** entre las dos capas.

**Corrección requerida:** Agregar `.endsWith('@elpoli.edu.co')` al `LoginSchema` del backend, y también al `RegisterSchema` del backend como segunda línea de defensa (el service ya lo valida pero la validación debe vivir en el esquema).

---

### C-02 — Bug de zona horaria en el motor anti-solapamiento de Clases Fijas

**Archivo:** `backend/src/modules/disponibilidad/disponibilidad.service.ts` — líneas 55–67  
**Regla de negocio violada:** "Las Clases Fijas de periodos en estado ACTIVO tienen prioridad absoluta sobre cualquier reserva puntual."

El servicio extrae el `diaSemana` y las horas con UTC:

```typescript
const diaSemana = fechaInicio.getUTCDay() === 0 ? 7 : fechaInicio.getUTCDay();
const horaIniStr = fechaInicio.toISOString().substring(11, 16); // "HH:mm" en UTC
const horaFinStr = fechaFin.toISOString().substring(11, 16);   // "HH:mm" en UTC
```

Colombia opera en **UTC-5** (sin horario de verano). Un usuario que solicita una reserva el **lunes 7 de octubre de 2026 a las 08:00 hora local** envía `2026-10-07T13:00:00.000Z` en UTC. El código calculará:

- `getUTCDay()` → 3 (miércoles en UTC) en lugar de 1 (lunes local)
- `horaIniStr` → `"13:00"` en lugar de `"08:00"`

Resultado: **el motor no detecta la clase fija del lunes a las 08:00 y permite la reserva doble**. Es el bug más grave del motor de dominio.

Además, el endpoint `calcularDisponibilidadDiaria` construye los slots de la rejilla como:
```typescript
const slotStart = new Date(`${fechaStr}T${hIniStr}:00.000Z`); // asume UTC
```
Cuando el `fechaStr` viene del cliente como fecha local (`2026-10-07`), los slots se desplazan 5 horas respecto a lo que el usuario ve en pantalla.

**Corrección requerida:** Usar una librería de zonas horarias (p. ej. `date-fns-tz` o `luxon`) para convertir fechas a `America/Bogota` antes de extraer día de semana y horas. El spec `05-availability-and-concurrency-engine.md` lo especifica explícitamente: *"en zona horaria institucional `America/Bogota`"*.

---

### C-03 — El `check-out` no compara contra el `check-in`: inhabilita con información incompleta

**Archivo:** `backend/src/modules/verificaciones/verificaciones.service.ts` — líneas 126–168  
**Regla de negocio violada:** "Se compara el estado registrado en Check-Out **contra el estado de ingreso en Check-In**. Si en Check-In estaba `PRESENTE_OPTIMO` y en Check-Out se marca `PRESENTE_DANADO`, se sanciona."

La implementación actual detecta novedades en Check-Out mirando únicamente el DTO recibido, **sin comparar contra el acta de Check-In**:

```typescript
const novedades = dto.items.filter(
  (i) => i.estadoItem === 'PRESENTE_DANADO' || i.estadoItem === 'FALTANTE',
);
```

Esto tiene dos consecuencias graves:

1. **Sanciones injustas:** Si en Check-In el gestor documentó que un ítem ya estaba `PRESENTE_DANADO` (novedad preexistente), al hacer el Check-Out el sistema lo vuelve a leer como daño nuevo y **inhabilita al solicitante injustamente**, violando la regla de negocio que exime al usuario de daños preexistentes.

2. **Pérdida indetectable:** Un ítem que estaba `PRESENTE_OPTIMO` en Check-In y se reporta también como `PRESENTE_OPTIMO` en Check-Out no genera novedad, incluso si la cantidad es distinta (el sistema no valida cantidades entre actas).

**Corrección requerida:** Antes de evaluar novedades en Check-Out, recuperar el `DetalleVerificacion` del CHECK_IN asociado a esa reserva, y solo sancionar si el estado **empeoró** respecto al Check-In.

---

## 🟠 ALTOS

---

### A-01 — No existe endpoint ni mecanismo para cambio de rol (`PATCH /api/usuarios/:id`)

**Archivo:** `backend/src/modules/usuarios/usuarios.controller.ts`  
**Referencia:** `auth.service.ts` comentario: *"La elevación de roles es exclusiva de SUPERADMIN vía `PATCH /api/usuarios/:id`"*

El controlador de usuarios solo tiene `GET /`, `GET /:id`, `PATCH /:id/inhabilitar` y `PATCH /:id/rehabilitar`. No existe un endpoint para que SUPERADMIN cambie el rol de un usuario. Los usuarios del seed (gestor, docente) tienen sus roles asignados directamente en base de datos. En un ambiente real, un SUPERADMIN no puede promover a nadie sin manipular la BD manualmente.

---

### A-02 — La ventana de Check-Out no se valida en el backend

**Archivo:** `backend/src/modules/verificaciones/verificaciones.service.ts`  
**Regla de negocio:** "El Check-Out debe ejecutarse hasta máximo 30 minutos posteriores a `T_fin`."

El `registrarCheckOut` solo valida que la reserva esté en estado `EN_USO`. No verifica si `ahora <= T_fin + 30 minutos`. Esto significa que una reserva puede quedarse indefinidamente en estado `EN_USO` si el usuario nunca hace Check-Out, y cuando finalmente lo intente (horas o días después), el sistema lo acepta sin problema.

---

### A-03 — El esquema `CambiarEstadoReservaSchema` permite `CANCELADA` para gestores

**Archivo:** `backend/src/schemas/reserva.schema.ts`

```typescript
export const CambiarEstadoReservaSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA', 'CANCELADA']), // ⚠️ CANCELADA aquí
  ...
});
```

Este schema se usa en el endpoint `PATCH /:id/estado` que está protegido por `@Roles('GESTOR_ESPACIO', 'SUPERADMIN')`. Según la RBAC planificada, `CANCELADA` solo puede ser generada por el **solicitante** (vía `PATCH /:id/cancelar`) o por el sistema en caso de No-Show. Un gestor no debería poder cambiar el estado a `CANCELADA` via este endpoint, debería solo poder `APROBADA` o `RECHAZADA`. Actualmente el service en `cambiarEstado` no filtra este caso.

---

### A-04 — No hay lógica de "No-Show": reservas APROBADAS expiradas nunca se cancelan

**Regla de negocio:** "Si `T_actual > T_ini + 20m` y no se hizo Check-In, la reserva puede ser marcada como cancelada por inasistencia."

No existe ningún mecanismo (job programado, cron, o verificación lazy) que detecte reservas `APROBADA` cuya ventana de Check-In ya venció. Estas reservas quedan bloqueando el horario permanentemente con estado `APROBADA`, lo que impide que el espacio sea reutilizado para ese slot de tiempo. Además, `validarDisponibilidadTx` incluye `EN_USO` y `APROBADA` en el filtro de conflictos, así que un slot abandonado bloquea futuras aprobaciones hasta que manualmente se cambie el estado.

---

### A-05 — El interceptor de respuesta puede romper el desempaquetado en el frontend

**Archivo:** `backend/src/common/interceptors/response-transform.interceptor.ts`

El `ResponseTransformInterceptor` detecta respuestas paginadas con `'data' in resData && 'meta' in resData` y las envuelve en `{ success, statusCode, message, data, meta }`. El `apiClient` del frontend desempaqueta usando:

```typescript
if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
  if ('meta' in data) {
    return data as T; // Devuelve el objeto completo con { data, meta, success... }
  }
  return data.data as T; // Desempaqueta solo el data
}
```

El problema: cuando el tipo `T` esperado por el hook es `{ data: Espacio[], meta: PaginationMeta }`, el cliente devuelve el objeto completo con `success`, `statusCode` y `message` incluidos, pero el tipo declarado no los incluye. Hay un casteo silencioso `as T` que puede producir propiedades inesperadas. En `api.ts` hay múltiples endpoints declarados con `any[]` como tipo de retorno que enmascaran este problema.

---

### A-06 — `DOCENTE` y `ADMINISTRATIVO` son tratados igual en RBAC, pero son roles distintos

**Archivo:** `backend/src/schemas/usuario.schema.ts`, `frontend/src/lib/auth-context.tsx`

El enum `RolUsuario` incluye `DOCENTE` y `ADMINISTRATIVO` como roles separados. Sin embargo, en el frontend ambos comparten exactamente el mismo nivel de acceso (`isDocenteOrAdmin` los agrupa). En el backend, ningún endpoint tiene `@Roles('DOCENTE')` o `@Roles('ADMINISTRATIVO')` de forma independiente. La RBAC real del sistema solo distingue 3 niveles funcionales (ESTUDIANTE ≈ DOCENTE ≈ ADMINISTRATIVO, GESTOR_ESPACIO, SUPERADMIN). Tener 5 roles en el enum sin diferenciación real entre dos de ellos genera confusión y puede desincronizarse en el futuro.

---

## 🟡 MEDIOS

---

### M-01 — Contratos Zod duplicados entre backend y frontend sin fuente única de verdad

Los schemas de `usuario.schema.ts` existen en ambas carpetas con diferencias sutiles y significativas:

| Campo | Backend `LoginSchema` | Frontend `LoginSchema` |
|---|---|---|
| `.endsWith('@elpoli.edu.co')` | ❌ Ausente | ✅ Presente |

Cualquier cambio en un schema debe replicarse manualmente en el otro. El planning preveía un paquete `packages/shared-schemas` para esto, pero no fue implementado. Riesgo de divergencia progresiva.

---

### M-02 — Uso extensivo de `any` en `api.ts` del frontend

**Archivo:** `frontend/src/lib/api.ts`

Las funciones de `inventarioApi`, `reservasApi`, `espaciosApi`, etc. declaran tipos de retorno como `any`, `any[]`, `any` en prácticamente todos los métodos. Esto anula completamente el beneficio de TypeScript y los contratos Zod. Ejemplo:

```typescript
create: (dto: any) => api.post<any>('/inventario', dto),
checkIn: (reservaId: number, dto: { items: any[] }) => api.post<any>(...),
```

---

### M-03 — El `inhabilitar` en `usuarios.controller.ts` extrae `motivo` con `@Body("motivo")` sin validación

```typescript
async inhabilitar(
  @Param("id", ParseIntPipe) id: number,
  @Body("motivo") motivo: string,  // ⚠️ Sin ZodValidationPipe ni DTO
  ...
)
```

Este endpoint recibe el motivo como string extraído directamente de la propiedad, saltándose la validación de `ZodValidationPipe`. Si el body es `{}`, `motivo` es `undefined` y el service hace `motivo || "Inhabilitación manual administrativa"`, lo que significa que un gestor puede inhabilitar a un usuario sin dar ningún motivo real.

---

### M-04 — `previewFeatures: ["relationJoins"]` en `schema.prisma` es una feature experimental

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}
```

`relationJoins` es una preview feature de Prisma 5 que puede cambiar entre versiones de patch sin aviso. No está documentado en los specs ni en el README. En producción con una versión futura de Prisma puede generar comportamientos inesperados.

---

### M-05 — El seed sobreescribe la contraseña de usuarios existentes en cada ejecución

```typescript
await prisma.usuario.upsert({
  where: { email: u.email },
  update: {
    ...
    passwordHash: u.passwordHash, // ⚠️ Sobreescribe la contraseña en cada seed
  },
  create: u,
});
```

Si un administrador cambió su contraseña en producción y alguien ejecuta `npm run prisma:seed` accidentalmente, todas las contraseñas vuelven a `Poli2026*!`. El `update` del seed debería excluir `passwordHash`.

---

### M-06 — La paginación en `findGestion` (reservas) no valida query params numéricos como `espacioId`, `sedeId`, `bloqueId`

**Archivo:** `backend/src/modules/reservas/reservas.controller.ts`

```typescript
espacioId: espacioId ? parseInt(espacioId, 10) : undefined,
sedeId: sedeId ? parseInt(sedeId, 10) : undefined,
```

`parseInt("abc", 10)` retorna `NaN`, y `NaN` pasado a Prisma en un `where` numérico produce un error de base de datos no controlado en lugar de un `HTTP 400`. Solo `page` y `limit` fueron protegidos con `parsePaginationQuery` (TSK-1007), pero estos tres filtros ID quedaron sin validar.

---

### M-07 — `CalendarioModule` existe pero no está importado en el `AppModule`

**Archivo:** `backend/src/modules/calendario/` — solo contiene `dto/index.ts`. No tiene `calendario.module.ts`, ni controller, ni service. No está importado en `app.module.ts`. Es código muerto que debería eliminarse o completarse si tenía funcionalidad planificada.

---

### M-08 — `next.config.ts` está completamente vacío

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

Para producción faltan configuraciones mínimas críticas:
- `output: 'standalone'` (necesario para Docker)
- `poweredByHeader: false` (seguridad — oculta que usa Next.js)
- Variables de entorno públicas explícitas
- Política de imágenes si se agregan en el futuro

---

### M-09 — El `JwtStrategy.validate()` hace una query a BD en cada petición autenticada sin caché

**Archivo:** `backend/src/modules/auth/jwt.strategy.ts`

```typescript
async validate(payload: JwtPayload): Promise<JwtPayload> {
  const user = await this.prisma.usuario.findUnique({ ... }); // DB hit en cada request
```

Cada petición autenticada hace un `SELECT` a la tabla `usuarios`. Con múltiples usuarios concurrentes haciendo polling (TanStack Query tiene `refetchInterval`), esto puede convertirse en un cuello de botella. El payload del JWT ya contiene `sub`, `email`, `rol`, `nombreCompleto` — toda la información necesaria para autorización. El DB call solo agrega la verificación de `activo`, que es correcto pero debería considerar una caché de corta duración (Redis) o confiar en la revocación vía refresh token (que ya está implementada).

---

## 🟢 BAJOS

---

### B-01 — `.env.example` contiene secretos JWT con valores por defecto en texto claro

```
JWT_ACCESS_SECRET="UniEspacios_SuperSecret_JwtKey_2026_ChangeInProduction!"
```

Aunque es un archivo de ejemplo, tener un valor real (aunque sea de ejemplo) en el repositorio entrena a los desarrolladores a ignorar la advertencia. Convención mejor: usar `CHANGE_ME` o `your-secret-here` como placeholder sin valor funcional.

---

### B-02 — `DATABASE_URL` en `.env.example` incluye la contraseña de BD en texto plano en el repo

```
DATABASE_URL="mysql://uniespacios_user:UniEspacios2026Secure!@..."
```

Si `.env.example` se commitea (que sí está en el repo), la contraseña de la base de datos de desarrollo queda expuesta en git history. Usar `DATABASE_PASSWORD=CHANGE_ME` como placeholder.

---

### B-03 — `.gitignore` — descartado

Verificado y descartado: el `.gitignore` raíz correctamente ignora `.env` y `.env.*` con la excepción `!.env.example`. Las credenciales locales están protegidas.

---

### B-04 — `app.service.ts` y `app.controller.ts` no tienen ningún propósito real

Existen `AppController` con ruta `GET /` que retorna un mensaje de bienvenida y `AppService.getHello()`. Este código generado por el CLI no tiene utilidad en producción y debería ser eliminado o reemplazado por un endpoint de health check real que verifique la conexión a BD.

---

### B-05 — El spec `01-contracts-and-schemas.md` está desactualizado post-hardening (TSK-1002)

El documento aún muestra `rol` en el `RegisterSchema`, aunque fue eliminado en TSK-1002. Esto puede confundir a futuros desarrolladores que tomen la spec como referencia de implementación.

---

### B-06 — TSK-904 (Docker Compose) está en BACKLOG pero es requerido para despliegue real

No hay `Dockerfile` ni `docker-compose.yml`. El `EJECUTAR.md` requiere que el desarrollador ejecute un comando Docker manual de 8 líneas con credenciales embebidas. En un entorno CI/CD o de staging, esto no es reproducible de forma automatizada. Esta es la única épica incompleta (EPIC-09, parcialmente).

---

### B-07 — `lucide-react@1.34.0` es una versión inusualmente alta

El paquete `lucide-react` en npm no tiene versión `1.34.0` publicada a la fecha de esta auditoría (las versiones actuales son `0.x`). Verificar que sea un número de versión correcto y no una entrada incorrecta que falle silenciosamente al instalar.

---

### B-08 — Módulo `calendario` es un directorio muerto

`backend/src/modules/calendario/` solo contiene `dto/index.ts`. No tiene `calendario.module.ts`, ni controller, ni service. No está importado en `AppModule`. Es código muerto que debería eliminarse.

---

### B-09 — Falta `@ApiBearerAuth()` en endpoints GET de catálogo e inventario

Los `GET /espacios`, `GET /espacios/:id`, `GET /espacios/:id/inventario` y `GET /inventario/:id` no tienen el decorador `@ApiBearerAuth()`. La seguridad está garantizada por el `JwtAuthGuard` global, pero la documentación Swagger no muestra el ícono de candado en estos endpoints, lo que hace creer que son públicos.

---

## Matriz de Hallazgos vs Reglas de Negocio

| Regla de Negocio | Hallazgo Relacionado | Estado Inicial | Estado Post-Auditoría |
|---|---|---|---|
| Dominio `@elpoli.edu.co` obligatorio | C-01 | ❌ VIOLADA en login backend | ✅ RESUELTO (Validado en Login y Register schemas) |
| Prioridad absoluta de Clases Fijas | C-02 | ❌ BUG de zona horaria | ✅ RESUELTO (Alineación con hora Bogotá UTC-5) |
| Check-Out compara contra Check-In | C-03 | ❌ No implementado | ✅ RESUELTO (Solo sanciona si empeora estado) |
| Inhabilitación automática por novedades | C-03 | ⚠️ Lógica incorrecta | ✅ RESUELTO (Exime daños preexistentes de Check-In) |
| Ventana Check-In T-15m a T+20m | — | ✅ OK | ✅ OK |
| Ventana Check-Out máx T_fin + 30m | A-02 | ❌ No implementada | ✅ RESUELTO (Validada en backend) |
| Rechazo requiere justificación | — | ✅ OK (`.refine()`) | ✅ OK |
| Rol ESTUDIANTE forzado en registro | — | ✅ OK (TSK-1002) | ✅ OK |
| Transacciones Serializables | — | ✅ OK | ✅ OK |
| Refresh Token Rotation | — | ✅ OK (TSK-1004) | ✅ OK |
| Cookies HttpOnly para refresh | — | ✅ OK (TSK-1005) | ✅ OK |
| No-Show automático | A-04 | ❌ No implementado | ✅ RESUELTO (procesarNoShows implementado) |
| Cambio de rol por SUPERADMIN | A-01 | ❌ Endpoint no existe | ⏸️ EXCLUIDO por instrucción explícita |
| Solo RECHAZADA/APROBADA para gestores | A-03 | ❌ Gestor puede poner CANCELADA | ⏸️ EXCLUIDO por instrucción explícita |
| Duración máxima 6 horas | — | ✅ OK | ✅ OK |
| Rejilla 06:00-22:00 | — | ✅ OK | ✅ RESUELTO (Slots corregidos a UTC-5) |

---

## 📊 Resolución Integral de Hallazgos (EPIC-11)

Se implementaron todos los hallazgos de auditoría a excepción de las exclusiones solicitadas de forma explícita (`A-01`, `A-03`, `M-03`, `B-01`, `B-02`).

| Código | Severidad | Descripción del Hallazgo | Estado Final | Detalle de la Solución Implementada |
|:---:|:---:|---|:---:|---|
| **C-01** | 🔴 Crítico | Validación de dominio `@elpoli.edu.co` en backend | ✅ **RESUELTO** | Agregado `.endsWith('@elpoli.edu.co')` en `LoginSchema` y `RegisterSchema` (`backend/src/schemas/usuario.schema.ts`). |
| **C-02** | 🔴 Crítico | Bug de zona horaria en anti-solapamiento de clases fijas | ✅ **RESUELTO** | Conversión a `America/Bogota` (UTC-5) en `disponibilidad.service.ts` para día de semana y horas locales. Rejilla horaria con offset `-05:00`. |
| **C-03** | 🔴 Crítico | Check-Out sin comparación contra Check-In | ✅ **RESUELTO** | `registrarCheckOut` compara contra `CHECK_IN`. No sanciona ni inhabilita por daños preexistentes documentados en el ingreso. |
| **A-01** | 🟠 Alto | Endpoint cambio de rol para SUPERADMIN | ⏸️ **EXCLUIDO** | Excluido por requerimiento explícito del usuario. Preservado para fase futura. |
| **A-02** | 🟠 Alto | Falta validación de ventana Check-Out (T_fin + 30m) | ✅ **RESUELTO** | Valida `ahora <= T_fin + 30m` en `registrarCheckOut`. Rechaza Check-Out tardío con `BadRequestException`. |
| **A-03** | 🟠 Alto | Filtrar `CANCELADA` en schema gestor | ⏸️ **EXCLUIDO** | Excluido por requerimiento explícito del usuario. |
| **A-04** | 🟠 Alto | Mecanismo No-Show para reservas expiradas | ✅ **RESUELTO** | Endpoint `procesarNoShows` y evaluación lazy en `findMisReservas`/`findGestion` cancelando reservas `APROBADA` sin Check-In tras 20m. |
| **A-05** | 🟠 Alto | Desempaquetado e interceptor de respuesta en frontend | ✅ **RESUELTO** | `apiClient` desempaqueta limpiamente `{ data, meta }` sin mezclar metadatos de transporte en la entidad consumida. |
| **A-06** | 🟠 Alto | Diferenciación de roles DOCENTE y ADMINISTRATIVO | ✅ **RESUELTO** | Roles diferenciados en `auth-context.tsx` (`isDocente`, `isAdministrativo`) manteniendo compatibilidad con `isDocenteOrAdmin`. |
| **M-01** | 🟡 Medio | Armonización de contratos Zod backend-frontend | ✅ **RESUELTO** | Mensajes de error y validaciones unificadas en ambos contratos (`usuario.schema.ts`). |
| **M-02** | 🟡 Medio | Uso extensivo de `any` en `api.ts` frontend | ✅ **RESUELTO** | Reemplazo total de `any` con tipos de entidad e interfaces tipadas de dominio (`EspacioEntity`, `ReservaEntity`, etc.). |
| **M-03** | 🟡 Medio | Validar motivo en inhabilitar con DTO | ⏸️ **EXCLUIDO** | Excluido por requerimiento explícito del usuario. |
| **M-04** | 🟡 Medio | Feature experimental `relationJoins` en Prisma | ✅ **RESUELTO** | Removido `previewFeatures = ["relationJoins"]` de `schema.prisma` y regenerado el cliente de Prisma. |
| **M-05** | 🟡 Medio | Seed sobreescribe contraseñas de usuarios existentes | ✅ **RESUELTO** | Removido `passwordHash` del bloque `update` en `prisma.usuario.upsert` de `seed.ts`. |
| **M-06** | 🟡 Medio | Query params numéricos sin validar en `findGestion` | ✅ **RESUELTO** | Creado `GestionReservasQuerySchema` y `parseGestionReservasQuery` validando `espacioId`, `sedeId`, `bloqueId` contra `NaN`. |
| **M-07** | 🟡 Medio | Directorio `calendario` muerto en backend | ✅ **RESUELTO** | Directorio huérfano eliminado limpiamente. |
| **M-08** | 🟡 Medio | `next.config.ts` sin configuración de producción | ✅ **RESUELTO** | Configurado `output: 'standalone'`, `poweredByHeader: false`, y `reactStrictMode: true`. |
| **M-09** | 🟡 Medio | DB hit en cada request en `JwtStrategy.validate` | ✅ **RESUELTO** | Implementada caché en memoria con TTL de 30s en `jwt.strategy.ts` para aliviar carga sobre MariaDB. |
| **B-01** | 🟢 Bajo | Secretos JWT de ejemplo en `.env.example` | ⏸️ **EXCLUIDO** | Excluido por requerimiento explícito del usuario. |
| **B-02** | 🟢 Bajo | Contraseña de BD en `.env.example` | ⏸️ **EXCLUIDO** | Excluido por requerimiento explícito del usuario. |
| **B-03** | 🟢 Bajo | Verificación de `.gitignore` | ✅ **VERIFICADO** | Descartado en auditoría; variables locales correctamente protegidas. |
| **B-04** | 🟢 Bajo | Endpoint `/health` con verificación real de DB | ✅ **RESUELTO** | `getHealth()` en `app.service.ts` ejecuta `SELECT 1` en Prisma y `@Public()` en `app.controller.ts`. |
| **B-05** | 🟢 Bajo | Spec `01-contracts-and-schemas.md` desactualizada | ✅ **RESUELTO** | Sincronizada especificación eliminando campo `rol` del `RegisterSchema`. |
| **B-06** | 🟢 Bajo | Dockerfile y docker-compose.yml (TSK-904) | ✅ **RESUELTO** | Creados `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, y `frontend/.env.example`. |
| **B-07** | 🟢 Bajo | Verificación de versión `lucide-react` | ✅ **VERIFICADO** | Verificado empaquetado y build de frontend sin anomalías de resolución. |
| **B-08** | 🟢 Bajo | Módulo calendario huérfano | ✅ **RESUELTO** | Consolidado con M-07 (eliminado). |
| **B-09** | 🟢 Bajo | Falta `@ApiBearerAuth()` en Swagger para GETs | ✅ **RESUELTO** | Añadido decorador a endpoints de espacios e inventario. |

---

## Aspectos Positivos Destacados

La auditoría también identificó implementaciones correctas que vale la pena reconocer:

- ✅ **Transacciones Serializables** correctamente implementadas con captura del error `P2034` y traducción a `HTTP 409 Conflict`.
- ✅ **Refresh Token Rotation** completa (TSK-1004) — cada refresh invalida el token anterior.
- ✅ **Cookies HttpOnly** para refresh tokens (TSK-1005) — no exponibles a XSS.
- ✅ **Rate limiting** diferenciado: 100 req/min general, 5 req/min en auth.
- ✅ **Helmet** con `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS.
- ✅ **Bypass de SUPERADMIN** en `RolesGuard` correctamente implementado.
- ✅ **Validación de paginación** con Zod (TSK-1007) en los controllers principales.
- ✅ **Eliminación de `any`** en `formatUserResponse` (TSK-1008) con tipado Prisma explícito.
- ✅ **Perfil reducido en localStorage** (TSK-1006) — sin PII sensible.
- ✅ **Seed institucional realista** con sede Poblado, bloques P40/P19/P31, inventarios detallados.
- ✅ **Tests de concurrencia** con 50 peticiones simultáneas y verificación de exactly-1-success.
- ✅ **Soft delete en inventario** (`remove` marca como `DE_BAJA`, preserva integridad de verificaciones).
- ✅ **PrismaClientExceptionFilter** traduce códigos `P2002`, `P2025`, `P2003`, `P2034` a HTTP status correctos.

---

*Fin del documento de auditoría.*
