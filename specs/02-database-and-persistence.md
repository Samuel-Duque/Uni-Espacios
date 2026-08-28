# 🗄️ Especificación 02: Persistencia, Modelado Prisma y Base de Datos MariaDB
**Documento:** `specs/02-database-and-persistence.md`  
**Épicas Relacionadas:** `EPIC-02`, `EPIC-04`, `EPIC-07`, `EPIC-08`  
**Tareas del Taskboard:** `TSK-201`, `TSK-202`, `TSK-203`, `TSK-204`  
**Fase de Implementación:** Fase 1 (Día 2)  

---

## 📌 1. Configuración de Base de Datos y Motor de Persistencia

* **Motor de Base de Datos:** MariaDB 11.x (compatible con transacciones ACID de nivel `Serializable` y motor de almacenamiento InnoDB).
* **ORM:** Prisma ORM 5.x.
* **Codificación y Collation:** `utf8mb4` / `utf8mb4_unicode_ci` para soporte completo de acentos, caracteres institucionales y emojis en observaciones.
* **Estrategia de Conexión:** Connection Pooling gestionado a través de la variable de entorno `DATABASE_URL`.

```env
DATABASE_URL="mysql://uniespacios_user:UniEspacios2026Secure!@localhost:3306/uniespacios_db?sslmode=prefer&connect_timeout=10&pool_timeout=15"
```

---

## 📜 2. Esquema Completo de Prisma (`backend/prisma/schema.prisma`)

```prisma
// datasource y generador de cliente
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}

// ----------------------------------------------------
// ENUMS DE DOMINIO
// ----------------------------------------------------

enum RolUsuario {
  ESTUDIANTE
  DOCENTE
  ADMINISTRATIVO
  GESTOR_ESPACIO
  SUPERADMIN
}

enum TipoEspacio {
  AULA
  LABORATORIO
  AUDITORIO
  DEPORTIVO
  SALA_COMPUTO
}

enum EstadoEspacio {
  ACTIVO
  EN_MANTENIMIENTO
  INACTIVO
}

enum CategoriaItem {
  TECNOLOGIA
  MOBILIARIO
  DEPORTIVO
  DIDACTICO
}

enum EstadoItem {
  OPTIMO
  REGULAR
  DANADO
  DE_BAJA
}

enum EstadoPeriodo {
  PLANIFICACION
  ACTIVO
  FINALIZADO
}

enum EstadoReserva {
  PENDIENTE
  APROBADA
  RECHAZADA
  CANCELADA
  EN_USO
  FINALIZADA
}

enum EstadoAprobacion {
  APROBADA
  RECHAZADA
}

enum TipoVerificacion {
  CHECK_IN
  CHECK_OUT
}

enum EstadoGeneralVerificacion {
  CONFORME
  NO_CONFORME
  CON_NOVEDADES
}

enum EstadoItemVerificacion {
  PRESENTE_OPTIMO
  PRESENTE_DANADO
  FALTANTE
}

// ----------------------------------------------------
// MODELOS DE INFRAESTRUCTURA FÍSICA
// ----------------------------------------------------

model Sede {
  id        Int      @id @default(autoincrement())
  nombre    String   @db.VarChar(100)
  ciudad    String   @db.VarChar(60)
  direccion String   @db.VarChar(150)
  creadoEn  DateTime @default(now()) @map("creado_en")

  bloques Bloque[]

  @@map("sedes")
}

model Bloque {
  id          Int      @id @default(autoincrement())
  sedeId      Int      @map("sede_id")
  codigo      String   @db.VarChar(20)
  descripcion String?  @db.VarChar(200)
  creadoEn    DateTime @default(now()) @map("creado_en")

  sede     Sede      @relation(fields: [sedeId], references: [id], onDelete: Restrict)
  espacios Espacio[]

  @@unique([sedeId, codigo])
  @@map("bloques")
}

model Espacio {
  id                    Int           @id @default(autoincrement())
  bloqueId              Int           @map("bloque_id")
  identificador         String        @db.VarChar(30)
  tipo                  TipoEspacio
  capacidad             Int
  piso                  Int?
  ubicacionDetalle      String?       @map("ubicacion_detalle") @db.VarChar(200)
  permiteReservaDirecta Boolean       @default(false) @map("permite_reserva_directa")
  estado                EstadoEspacio @default(ACTIVO)
  creadoEn              DateTime      @default(now()) @map("creado_en")
  actualizadoEn         DateTime      @updatedAt @map("actualizado_en")

  bloque      Bloque           @relation(fields: [bloqueId], references: [id], onDelete: Restrict)
  inventario  ItemInventario[]
  clasesFijas ClaseFija[]
  reservas    Reserva[]

  @@unique([bloqueId, identificador])
  @@index([tipo, estado, capacidad])
  @@map("espacios")
}

// ----------------------------------------------------
// MODELOS DE INVENTARIO Y CONTROL DE IMPLEMENTOS
// ----------------------------------------------------

model ItemInventario {
  id          Int           @id @default(autoincrement())
  espacioId   Int           @map("espacio_id")
  codigo      String        @db.VarChar(50) // Placa o SKU
  nombre      String        @db.VarChar(100)
  categoria   CategoriaItem
  cantidad    Int           @default(1)
  estado      EstadoItem    @default(OPTIMO)
  esCritico   Boolean       @default(false) @map("es_critico")
  descripcion String?       @db.VarChar(255)
  creadoEn    DateTime      @default(now()) @map("creado_en")
  actualizadoEn DateTime    @updatedAt @map("actualizado_en")

  espacio Espacio               @relation(fields: [espacioId], references: [id], onDelete: Cascade)
  detallesVerificacion DetalleVerificacion[]

  @@unique([espacioId, codigo])
  @@index([categoria, estado])
  @@map("items_inventario")
}

// ----------------------------------------------------
// CALENDARIO ACADÉMICO Y CLASES FIJAS
// ----------------------------------------------------

model PeriodoAcademico {
  id          Int           @id @default(autoincrement())
  codigo      String        @unique @db.VarChar(10) // Ej: "2026-2"
  fechaInicio DateTime      @map("fecha_inicio") @db.Date
  fechaFin    DateTime      @map("fecha_fin") @db.Date
  estado      EstadoPeriodo @default(PLANIFICACION)
  creadoEn    DateTime      @default(now()) @map("creado_en")

  clasesFijas ClaseFija[]

  @@index([estado, fechaInicio, fechaFin])
  @@map("periodos_academicos")
}

model ClaseFija {
  id          Int      @id @default(autoincrement())
  espacioId   Int      @map("espacio_id")
  periodoId   Int      @map("periodo_id")
  diaSemana   Int      @map("dia_semana") @db.TinyInt // 1=Lunes .. 7=Domingo
  horaInicio  String   @map("hora_inicio") @db.VarChar(5) // "08:00"
  horaFin     String   @map("hora_fin") @db.VarChar(5) // "10:00"
  asignatura  String   @db.VarChar(100)
  docente     String   @db.VarChar(100)
  grupo       String?  @db.VarChar(20)
  creadoEn    DateTime @default(now()) @map("creado_en")

  espacio Espacio          @relation(fields: [espacioId], references: [id], onDelete: Restrict)
  periodo PeriodoAcademico @relation(fields: [periodoId], references: [id], onDelete: Cascade)

  @@index([espacioId, periodoId, diaSemana, horaInicio, horaFin])
  @@map("clases_fijas")
}

// ----------------------------------------------------
// USUARIOS Y AUTENTICACIÓN
// ----------------------------------------------------

model Usuario {
  id                        Int        @id @default(autoincrement())
  email                     String     @unique @db.VarChar(120)
  passwordHash              String     @map("password_hash") @db.VarChar(255)
  nombreCompleto            String     @map("nombre_completo") @db.VarChar(100)
  documentoIdentidad        String     @map("documento_identidad") @db.VarChar(20)
  telefono                  String?    @db.VarChar(20)
  rol                       RolUsuario @default(ESTUDIANTE)
  activo                    Boolean    @default(true)
  inhabilitadoParaReservar  Boolean    @default(false) @map("inhabilitado_para_reservar")
  motivoInhabilitacion      String?    @map("motivo_inhabilitacion") @db.VarChar(255)
  refreshTokenHash          String?    @map("refresh_token_hash") @db.VarChar(255)
  creadoEn                  DateTime   @default(now()) @map("creado_en")
  actualizadoEn             DateTime   @updatedAt @map("actualizado_en")

  reservasSolicitadas    Reserva[]                 @relation("SolicitanteReservas")
  aprobacionesRealizadas Aprobacion[]              @relation("AprobadorReservas")
  verificaciones         VerificacionInventario[]  @relation("VerificadorInventario")
  auditorias             Auditoria[]

  @@index([email, rol, activo])
  @@map("usuarios")
}

// ----------------------------------------------------
// RESERVAS, APROBACIONES Y VERIFICACIONES
// ----------------------------------------------------

model Reserva {
  id                         Int           @id @default(autoincrement())
  espacioId                  Int           @map("espacio_id")
  usuarioId                  Int           @map("usuario_id")
  fechaInicio                DateTime      @map("fecha_inicio")
  fechaFin                   DateTime      @map("fecha_fin")
  motivo                     String        @db.VarChar(300)
  cantidadAsistentesEstimada Int?          @map("cantidad_asistentes_estimada")
  estado                     EstadoReserva @default(PENDIENTE)
  creadoEn                   DateTime      @default(now()) @map("creado_en")
  actualizadoEn              DateTime      @updatedAt @map("actualizado_en")

  espacio        Espacio                  @relation(fields: [espacioId], references: [id], onDelete: Restrict)
  usuario        Usuario                  @relation("SolicitanteReservas", fields: [usuarioId], references: [id], onDelete: Restrict)
  aprobaciones   Aprobacion[]
  verificaciones VerificacionInventario[]

  // Índice compuesto crítico para el motor anti-solapamiento y bloqueos serializables
  @@index([espacioId, estado, fechaInicio, fechaFin])
  @@index([usuarioId, estado])
  @@map("reservas")
}

model Aprobacion {
  id            Int              @id @default(autoincrement())
  reservaId     Int              @map("reserva_id")
  aprobadorId   Int              @map("aprobador_id")
  estado        EstadoAprobacion
  observaciones String?          @db.VarChar(300)
  fechaAccion   DateTime         @default(now()) @map("fecha_accion")

  reserva   Reserva @relation(fields: [reservaId], references: [id], onDelete: Cascade)
  aprobador Usuario @relation("AprobadorReservas", fields: [aprobadorId], references: [id], onDelete: Restrict)

  @@index([reservaId, aprobadorId])
  @@map("aprobaciones")
}

model VerificacionInventario {
  id                    Int                       @id @default(autoincrement())
  reservaId             Int                       @map("reserva_id")
  usuarioVerificadorId  Int                       @map("usuario_verificador_id")
  tipo                  TipoVerificacion
  estadoGeneral         EstadoGeneralVerificacion @default(CONFORME) @map("estado_general")
  observaciones         String?                   @db.Text
  fechaHora             DateTime                  @default(now()) @map("fecha_hora")

  reserva    Reserva               @relation(fields: [reservaId], references: [id], onDelete: Cascade)
  verificador Usuario              @relation("VerificadorInventario", fields: [usuarioVerificadorId], references: [id], onDelete: Restrict)
  detalles   DetalleVerificacion[]

  @@index([reservaId, tipo])
  @@map("verificaciones_inventario")
}

model DetalleVerificacion {
  id                 Int                    @id @default(autoincrement())
  verificacionId     Int                    @map("verificacion_id")
  itemInventarioId   Int                    @map("item_inventario_id")
  estadoItem         EstadoItemVerificacion @map("estado_item")
  cantidadEncontrada Int                    @map("cantidad_encontrada")
  observacionNovedad String?                @map("observacion_novedad") @db.VarChar(300)

  verificacion   VerificacionInventario @relation(fields: [verificacionId], references: [id], onDelete: Cascade)
  itemInventario ItemInventario         @relation(fields: [itemInventarioId], references: [id], onDelete: Restrict)

  @@index([verificacionId, itemInventarioId])
  @@map("detalles_verificacion")
}

model Auditoria {
  id         Int      @id @default(autoincrement())
  usuarioId  Int?     @map("usuario_id")
  accion     String   @db.VarChar(100) // "CREACION_RESERVA", "CHECK_IN_NOVEDAD", "APROBACION"
  entidad    String   @db.VarChar(50)  // "Reserva", "ItemInventario"
  entidadId  Int      @map("entidad_id")
  detalles   Json?
  ipAddress  String?  @map("ip_address") @db.VarChar(45)
  creadoEn   DateTime @default(now()) @map("creado_en")

  usuario Usuario? @relation(fields: [usuarioId], references: [id], onDelete: SetNull)

  @@index([entidad, entidadId])
  @@index([creadoEn])
  @@map("auditorias")
}
```

---

## ⚡ 3. Estrategia de Migraciones y Comandos

1. **Creación de Migración Inicial:**
   ```bash
   npx prisma migrate dev --name init_uniespacios_domain_and_inventory
   ```
2. **Generación del Cliente Tipado:**
   ```bash
   npx prisma generate
   ```
3. **Poblado de Datos Semilla:**
   ```bash
   npx prisma db seed
   ```

---

## 🏗️ 4. Proveedor Global `PrismaService` en NestJS

```typescript
// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado exitosamente a MariaDB 11.x mediante Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Desconectado de MariaDB');
  }
}
```

---

## 🌱 5. Especificación del Script de Seed (`backend/prisma/seed.ts`)

El script de Seed insertará los datos maestros de las sedes institucionales, bloques, espacios y el catálogo de inventario con datos reales del Politécnico Jaime Isaza Cadavid:

### Cuentas de Usuario Semilla (con bcrypt hash de `Poli2026*!`):
1. **SuperAdmin:** `admin@elpoli.edu.co` (Rol: `SUPERADMIN`)
2. **Gestor P40:** `gestor.ingenieria@elpoli.edu.co` (Rol: `GESTOR_ESPACIO`)
3. **Docente:** `docente.ciencias@elpoli.edu.co` (Rol: `DOCENTE`)
4. **Estudiante:** `estudiante.demo@elpoli.edu.co` (Rol: `ESTUDIANTE`)

### Infraestructura y Espacios Semilla:
* **Sede Poblado (Medellín):**
  * **Bloque P40 (Ingeniería):**
    * `P40-201` (`AULA`, capacidad: 40). Inventario: TV 55", Marcadores acrílicos x4, Borrador, Podio.
    * `P40-LAB01` (`LABORATORIO`, capacidad: 25). Inventario: Osciloscopios digitales x10, Multímetros x12, Fuentes DC x10 (Críticos).
    * `AUD-P40` (`AUDITORIO`, capacidad: 180). Inventario: Proyector Láser 4K, Sistema de Sonido Shure, Micrófonos inalámbricos x4.
  * **Bloque P19 (Deportes):**
    * `CANCHA-SINTETICA-1` (`DEPORTIVO`, capacidad: 22). Inventario: Balones de fútbol No.5 x6, Petos x20, Conos de entrenamiento x15.
    * `COLISEO-P19` (`DEPORTIVO`, capacidad: 300). Inventario: Malla de voleibol, Balones de basquetbol x8, Tablero electrónico.
  * **Bloque P31 (Informática):**
    * `LAB-COMP-301` (`SALA_COMPUTO`, capacidad: 35). Inventario: Computadores Todo-en-Uno Dell x35, Proyector Epson, Switch Cisco 48p.
* **Sede Rionegro (Oriente):**
  * **Bloque R01:**
    * `R01-101` (`AULA`, capacidad: 30). Inventario: TV 50", Pizarra blanca.

### Calendario Académico Semilla:
* **Periodo Activo:** `2026-2` (Fecha Inicio: `2026-08-01`, Fecha Fin: `2026-12-15`, Estado: `ACTIVO`).
* **Clases Fijas Semanales:**
  * Lunes 08:00 - 10:00 en `P40-201`: "Cálculo Integral" (Docente: Ing. Juan Pérez).
  * Miércoles 14:00 - 16:00 en `P40-LAB01`: "Circuitos Digitales" (Docente: Ing. Maria Gómez).
  * Jueves 10:00 - 12:00 en `LAB-COMP-301`: "Estructuras de Datos" (Docente: Carlos Maya).
