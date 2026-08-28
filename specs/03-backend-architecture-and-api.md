# ⚙️ Especificación 03: Arquitectura de Backend NestJS y Catálogo de Endpoints REST
**Documento:** `specs/03-backend-architecture-and-api.md`  
**Épicas Relacionadas:** `EPIC-01`, `EPIC-03`, `EPIC-05`, `EPIC-06`, `EPIC-07`, `EPIC-08`  
**Tareas del Taskboard:** `TSK-101`, `TSK-104`, `TSK-501`, `TSK-601`, `TSK-604`, `TSK-701`, `TSK-801`, `TSK-802`  
**Fase de Implementación:** Fases 1 y 2 (Días 1, 3, 5, 6)  

---

## 🏗️ 1. Arquitectura Modular y Separación de Capas (NestJS)

El backend se organiza en una arquitectura desacoplada por módulos de dominio. Cada módulo encapsula sus **Controladores (HTTP / REST)**, **Servicios (Lógica de Dominio y Transacciones)** y **DTOs tipados con Zod**.

```
backend/src/
├── app.module.ts                         # Módulo orquestador raíz
├── main.ts                               # Bootstrap de la aplicación y configuración global
├── common/
│   ├── decorators/                       # @CurrentUser, @Roles, @Public
│   ├── filters/                          # HttpExceptionFilter, PrismaClientExceptionFilter
│   ├── guards/                           # JwtAuthGuard, RolesGuard
│   ├── interceptors/                     # ResponseTransformInterceptor, LoggingInterceptor
│   └── pipes/                            # ZodValidationPipe global
├── config/                               # Validaciones de variables de entorno (.env) con Zod
├── prisma/                               # PrismaModule y PrismaService
└── modules/
    ├── auth/                             # Login institucional, Registro, Refresh Tokens
    ├── sedes/                            # Gestión de sedes institucionales
    ├── bloques/                          # Gestión de bloques físicos por sede
    ├── espacios/                         # Catálogo de espacios y filtros facetados
    ├── inventario/                       # CRUD de implementos por espacio
    ├── periodos-academicos/              # Semestres institucionales y estado ACTIVO
    ├── clases-fijas/                     # Horarios semanales recurrentes
    ├── disponibilidad/                   # Motor de detección de solapamientos
    ├── reservas/                         # Creación, cancelación y consulta de reservas
    ├── aprobaciones/                     # Bandeja de decisión del GESTOR_ESPACIO
    ├── verificaciones/                   # Check-In, Check-Out y actas de novedades
    └── auditoria/                        # Trazabilidad y logs de acciones sensibles
```

---

## ⚙️ 2. Configuración Global de la Aplicación (`main.ts`)

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Prefijo Global de API
  app.setGlobalPrefix('api');

  // 2. Seguridad HTTP y Cookies
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 3. Pipeline Global: Pipes, Filters e Interceptors
  patchNestJsSwagger(); // Habilita integración Zod -> Swagger
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaClientExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // 4. Configuración Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Uni-Espacios API - Politécnico Jaime Isaza Cadavid')
    .setDescription('API REST para la gestión de espacios físicos, reservas e inventario')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Servidor ejecutándose en http://localhost:${port}/api`);
  logger.log(`📑 Documentación Swagger disponible en http://localhost:${port}/api/docs`);
}
bootstrap();
```

---

## 📡 3. Catálogo Completo de Endpoints REST

### 3.1 Módulo de Autenticación (`/api/auth`)

| Método | Endpoint | Roles Permitidos | Request Body | Códigos HTTP | Descripción |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | `@Public()` | `RegisterDto` | 201, 400, 409 | Registra usuario con correo `@elpoli.edu.co`. |
| `POST` | `/api/auth/login` | `@Public()` | `LoginDto` | 200, 400, 401 | Autentica usuario, retorna `accessToken` y setea cookie HttpOnly `refreshToken`. |
| `POST` | `/api/auth/refresh` | `@Public()` | *Cookie `refreshToken`* | 200, 401 | Rota tokens emitiendo un nuevo `accessToken`. |
| `GET` | `/api/auth/me` | *Autenticado* | Ninguno | 200, 401 | Obtiene perfil del usuario actual desde el JWT. |
| `POST` | `/api/auth/logout` | *Autenticado* | Ninguno | 200, 401 | Invalida el refresh token y limpia la cookie de sesión. |

---

### 3.2 Módulo de Infraestructura Física (`/api/sedes`, `/api/bloques`, `/api/espacios`)

| Método | Endpoint | Roles Permitidos | Request Body / Query | Códigos HTTP | Descripción |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `GET` | `/api/sedes` | *Todos* | Ninguno | 200 | Lista todas las sedes institucionales. |
| `POST` | `/api/sedes` | `SUPERADMIN` | `CreateSedeDto` | 201, 400, 403 | Crea una nueva sede institucional. |
| `GET` | `/api/bloques` | *Todos* | `?sedeId=X` | 200 | Lista bloques, opcionalmente filtrados por sede. |
| `POST` | `/api/bloques` | `SUPERADMIN` | `CreateBloqueDto` | 201, 400, 403 | Crea un nuevo bloque en una sede. |
| `GET` | `/api/espacios` | *Todos* | `EspacioFiltrosQueryDto` | 200 | Catálogo de espacios con filtros (tipo, capacidad, bloque, sede, categoría de implementos). |
| `GET` | `/api/espacios/:id` | *Todos* | Ninguno | 200, 404 | Obtiene ficha técnica completa del espacio, incluyendo bloque, sede e inventario activo. |
| `POST` | `/api/espacios` | `SUPERADMIN` | `CreateEspacioDto` | 201, 400, 403 | Registra un nuevo espacio físico. |
| `PATCH` | `/api/espacios/:id` | `SUPERADMIN` | `UpdateEspacioDto` | 200, 400, 404 | Actualiza capacidad, estado o datos del espacio. |

---

### 3.3 Módulo de Inventario de Implementos (`/api/inventario`, `/api/espacios/:id/inventario`)

| Método | Endpoint | Roles Permitidos | Request Body | Códigos HTTP | Descripción |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `GET` | `/api/espacios/:id/inventario` | *Todos* | Ninguno | 200, 404 | Retorna lista de implementos asignados a un espacio con su estado (`OPTIMO`, `REGULAR`, etc.). |
| `POST` | `/api/inventario` | `GESTOR_ESPACIO`, `SUPERADMIN` | `CreateItemInventarioDto` | 201, 400, 403 | Registra un nuevo implemento o recurso bajo custodia en un espacio. |
| `PATCH` | `/api/inventario/:id` | `GESTOR_ESPACIO`, `SUPERADMIN` | `UpdateItemInventarioDto` | 200, 400, 404 | Actualiza datos, estado o cantidad de un implemento. |
| `DELETE` | `/api/inventario/:id` | `SUPERADMIN` | Ninguno | 200, 404 | Da de baja o elimina un implemento del inventario. |

---

### 3.4 Módulo de Calendario Académico y Clases Fijas

| Método | Endpoint | Roles Permitidos | Request Body | Códigos HTTP | Descripción |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `GET` | `/api/periodos-academicos` | *Todos* | Ninguno | 200 | Lista periodos académicos (semestres). |
| `POST` | `/api/periodos-academicos` | `SUPERADMIN` | `PeriodoAcademicoDto` | 201, 400, 403 | Registra un nuevo periodo académico. |
| `PATCH` | `/api/periodos-academicos/:id/activar` | `SUPERADMIN` | Ninguno | 200, 404 | Marca un periodo como `ACTIVO` y pasa los demás a `FINALIZADO` o `PLANIFICACION`. |
| `GET` | `/api/espacios/:id/clases-fijas` | *Todos* | `?periodoId=X` | 200 | Lista clases fijas semanales asignadas a un espacio. |
| `POST` | `/api/clases-fijas` | `SUPERADMIN` | `CreateClaseFijaDto` | 201, 400, 409 | Registra una clase semanal fija para un aula/espacio. |
| `POST` | `/api/clases-fijas/bulk` | `SUPERADMIN` | `BulkCreateClaseFijaDto` | 201, 400, 409 | Carga masiva de programación académica semestral. |
| `DELETE` | `/api/clases-fijas/:id` | `SUPERADMIN` | Ninguno | 200, 404 | Elimina una asignación de clase fija. |

---

### 3.5 Módulo de Disponibilidad y Reservas

| Método | Endpoint | Roles Permitidos | Request Body / Query | Códigos HTTP | Descripción |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `GET` | `/api/espacios/:id/disponibilidad` | *Todos* | `?fecha=YYYY-MM-DD` | 200, 400 | Retorna franjas horarias del día (06:00 a 22:00) indicando si están libres o bloqueadas. |
| `POST` | `/api/reservas` | *Autenticado (no inhabilitado)* | `CrearReservaDto` | 201, 400, 409, 403 | Crea solicitud puntual de reserva en estado `PENDIENTE` dentro de transacción serializable. |
| `GET` | `/api/reservas/mis-reservas` | *Autenticado* | `?estado=X&page=1` | 200 | Lista las reservas del usuario autenticado. |
| `GET` | `/api/reservas/gestion` | `GESTOR_ESPACIO`, `SUPERADMIN` | `?estado=PENDIENTE` | 200, 403 | Bandeja de solicitudes de reserva para revisión de gestores. |
| `PATCH` | `/api/reservas/:id/cancelar` | *Solicitante o Admin* | Ninguno | 200, 400, 403 | Cancela una reserva antes de su inicio. |
| `PATCH` | `/api/reservas/:id/estado` | `GESTOR_ESPACIO`, `SUPERADMIN` | `CambiarEstadoReservaDto` | 200, 400, 409, 403 | Dictamina aprobación o rechazo (motivo obligatorio en rechazo) con bloqueo atómico. |

---

### 3.6 Módulo de Verificaciones de Inventario (Check-In / Check-Out)

| Método | Endpoint | Roles Permitidos | Request Body | Códigos HTTP | Descripción |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `POST` | `/api/reservas/:id/check-in` | *Solicitante o Gestor* | `CheckInDto` | 200, 400, 409, 403 | Valida ventana horaria, registra estado inicial de implementos y pasa reserva a `EN_USO`. |
| `POST` | `/api/reservas/:id/check-out` | *Solicitante o Gestor* | `CheckOutDto` | 200, 400, 409, 403 | Registra estado final de implementos, detecta novedades/daños y finaliza la reserva. |
| `GET` | `/api/reservas/:id/verificaciones` | *Solicitante o Gestor* | Ninguno | 200, 404 | Retorna actas de Check-In y Check-Out con detalle ítem por ítem. |
| `GET` | `/api/verificaciones/novedades` | `GESTOR_ESPACIO`, `SUPERADMIN` | `?page=1` | 200, 403 | Reporte consolidado de novedades de inventario (ítems dañados o faltantes) y responsable. |

---

## 🛡️ 4. Filtro Global de Excepciones (`HttpExceptionFilter`)

```typescript
// backend/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let errorName = 'InternalServerError';
    let details: Array<{ field: string; message: string }> | undefined;

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      errorName = 'ValidationError';
      const zodError = exception.getZodError();
      message = 'Falló la validación del esquema de entrada';
      details = zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      errorName = exception.name;
      message = typeof res === 'object' && 'message' in res ? (res as any).message : exception.message;
    } else if (exception instanceof Error) {
      this.logger.error(`Excepción no controlada: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorName,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```
