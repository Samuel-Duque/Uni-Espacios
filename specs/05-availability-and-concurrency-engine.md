# ⚡ Especificación 05: Motor de Disponibilidad, Algoritmos Anti-Solapamiento y Concurrencia
**Documento:** `specs/05-availability-and-concurrency-engine.md`  
**Épicas Relacionadas:** `EPIC-04`, `EPIC-06`  
**Tareas del Taskboard:** `TSK-401`, `TSK-402`, `TSK-403`, `TSK-404`, `TSK-601`, `TSK-604`  
**Fase de Implementación:** Fase 2 (Día 7)  

---

## 📌 1. Definición Formal del Problema de Disponibilidad

El motor de disponibilidad garantiza que **nunca existan dos ocupaciones simultáneas** para un mismo espacio físico en una franja temporal $[T_{ini}, T_{fin}]$. 

Toda solicitud de reserva o consulta de disponibilidad debe evaluar de forma atómica:
1. **Prioridad Académica (Clases Fijas):** Bloqueos semanales recurrentes registrados en el periodo académico `ACTIVO`.
2. **Reservas Confirmadas:** Reservas previas en estado `APROBADA` o `EN_USO`.
3. **Estado Operativo del Espacio:** El espacio debe encontrarse en estado `ACTIVO` (no en mantenimiento ni inactivo).
4. **Habilitación del Solicitante:** El usuario no debe estar `inhabilitadoParaReservar` por novedades de inventario previas.

---

## 📐 2. Algoritmos de Detección de Conflictos Temporales

### 2.1 Algoritmo de Colisión con Clases Fijas Semestrales (`TSK-401`)

Dado un intervalo objetivo $[T_{ini}, T_{fin}]$ y un `espacioId`:

1. **Obtener Fecha Calendario:** $D = \text{date}(T_{ini})$ (en zona horaria institucional `America/Bogota`).
2. **Verificar Periodo Académico:**
   Buscar `PeriodoAcademico` donde:
   $$\text{estado} = \text{'ACTIVO'} \quad \land \quad \text{fechaInicio} \le D \le \text{fechaFin}$$
   *Si no existe periodo activo para esa fecha, no aplican restricciones de clases fijas.*
3. **Calcular Día de la Semana:**
   $$dia = \text{dayOfWeek}(D) \quad (\text{Lunes}=1, \dots, \text{Domingo}=7)$$
4. **Extraer Franja Horaria (HH:mm):**
   $$H_{ini} = \text{format}(T_{ini}, \text{'HH:mm'}), \quad H_{fin} = \text{format}(T_{fin}, \text{'HH:mm'})$$
5. **Condición de Intersección en MariaDB:**
   Existe conflicto si existe al menos un registro en `CLASE_FIJA` que cumpla:
   $$\text{espacioId} = \text{targetId} \quad \land \quad \text{periodoId} = \text{activoId} \quad \land \quad \text{diaSemana} = dia \quad \land \quad (\text{horaInicio} < H_{fin} \land \text{horaFin} > H_{ini})$$

---

### 2.2 Algoritmo de Colisión con Reservas Existentes (`TSK-402`)

Dado el intervalo $[T_{ini}, T_{fin}]$ y un `espacioId`:

Existe conflicto de doble reserva (*Double-Booking*) si existe en la tabla `RESERVA`:
$$\text{espacioId} = \text{targetId} \quad \land \quad \text{estado} \in \{\text{'APROBADA'}, \text{'EN_USO'}\} \quad \land \quad (\text{fechaInicio} < T_{fin} \land \text{fechaFin} > T_{ini})$$

*Nota:* Si la validación se realiza durante la aprobación de una reserva existente con ID $R_{id}$, se añade la condición $\text{id} \neq R_{id}$.

---

## 🔒 3. Aislamiento Transaccional y Control de Concurrencia (`TSK-403`)

Para erradicar por completo las **condiciones de carrera** cuando múltiples usuarios intentan reservar o aprobar simultáneamente el mismo espacio en horarios superpuestos, la operación se ejecuta dentro de `prisma.$transaction` con nivel de aislamiento `Serializable`:

```typescript
// backend/src/modules/disponibilidad/disponibilidad.service.ts
import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DisponibilidadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida disponibilidad de forma atómica dentro del contexto transaccional
   */
  async validarDisponibilidadTx(
    tx: Prisma.TransactionClient,
    espacioId: number,
    fechaInicio: Date,
    fechaFin: Date,
    excluirReservaId?: number
  ): Promise<void> {
    // 1. Verificar estado del espacio físico
    const espacio = await tx.espacio.findUnique({
      where: { id: espacioId },
    });
    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${espacioId} no existe`);
    }
    if (espacio.estado !== 'ACTIVO') {
      throw new ConflictException(`El espacio no está disponible para reservas (Estado: ${espacio.estado})`);
    }

    // 2. Verificar cruce con Clases Fijas del Periodo Activo
    const fechaSolo = new Date(fechaInicio.toISOString().split('T')[0]);
    const periodoActivo = await tx.periodoAcademico.findFirst({
      where: {
        estado: 'ACTIVO',
        fechaInicio: { lte: fechaSolo },
        fechaFin: { gte: fechaSolo },
      },
    });

    if (periodoActivo) {
      // 1 = Lunes .. 7 = Domingo (ISO day of week)
      const diaSemana = fechaInicio.getUTCDay() === 0 ? 7 : fechaInicio.getUTCDay();
      const horaIniStr = fechaInicio.toISOString().substring(11, 16); // "HH:mm"
      const horaFinStr = fechaFin.toISOString().substring(11, 16);

      const claseConflicto = await tx.claseFija.findFirst({
        where: {
          espacioId,
          periodoId: periodoActivo.id,
          diaSemana,
          horaInicio: { lt: horaFinStr },
          horaFin: { gt: horaIniStr },
        },
      });

      if (claseConflicto) {
        throw new ConflictException(
          `Colisión con Clase Fija académica: "${claseConflicto.asignatura}" (${claseConflicto.horaInicio} - ${claseConflicto.horaFin})`
        );
      }
    }

    // 3. Verificar cruce con Reservas previas APROBADAS o EN_USO
    const reservaConflicto = await tx.reserva.findFirst({
      where: {
        espacioId,
        id: excluirReservaId ? { not: excluirReservaId } : undefined,
        estado: { in: ['APROBADA', 'EN_USO'] },
        fechaInicio: { lt: fechaFin },
        fechaFin: { gt: fechaInicio },
      },
    });

    if (reservaConflicto) {
      throw new ConflictException(
        `El espacio ya cuenta con una reserva aprobada en este horario (${reservaConflicto.fechaInicio.toISOString()} - ${reservaConflicto.fechaFin.toISOString()})`
      );
    }
  }
}
```

---

## 🔄 4. Implementación Transaccional de Creación y Aprobación de Reservas

### 4.1 Creación de Reserva (`ReservasService.crearReserva`)
```typescript
// backend/src/modules/reservas/reservas.service.ts
import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DisponibilidadService } from '../disponibilidad/disponibilidad.service';
import { CrearReservaInput } from '../../schemas/reserva.schema';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disponibilidadService: DisponibilidadService,
  ) {}

  async crearReserva(dto: CrearReservaInput, usuarioId: number) {
    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // A. Validar que el usuario no esté inhabilitado
          const usuario = await tx.usuario.findUniqueOrThrow({
            where: { id: usuarioId },
          });
          if (usuario.inhabilitadoParaReservar) {
            throw new ForbiddenException(
              `Usuario inhabilitado para reservar: ${usuario.motivoInhabilitacion || 'Novedad de inventario pendiente'}`
            );
          }

          // B. Validar motor de disponibilidad (Clases fijas + Reservas)
          await this.disponibilidadService.validarDisponibilidadTx(
            tx,
            dto.espacioId,
            fechaInicio,
            fechaFin
          );

          // C. Crear la Reserva
          const reserva = await tx.reserva.create({
            data: {
              espacioId: dto.espacioId,
              usuarioId,
              fechaInicio,
              fechaFin,
              motivo: dto.motivo,
              cantidadAsistentesEstimada: dto.cantidadAsistentesEstimada,
              estado: 'PENDIENTE',
            },
            include: {
              espacio: { include: { bloque: { include: { sede: true } } } },
            },
          });

          // D. Registrar Auditoría
          await tx.auditoria.create({
            data: {
              usuarioId,
              accion: 'CREACION_RESERVA',
              entidad: 'Reserva',
              entidadId: reserva.id,
              detalles: { motivo: dto.motivo, espacioId: dto.espacioId },
            },
          });

          return reserva;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000, // Espera máxima para adquirir bloqueo
          timeout: 10000, // Timeout de ejecución de la transacción
        }
      );
    } catch (error: any) {
      // Manejo de colisiones de serialización de MariaDB (código P2034 de Prisma)
      if (error.code === 'P2034') {
        throw new ConflictException(
          'Conflicto de concurrencia: el horario fue modificado por otra solicitud simultánea. Por favor reintente.'
        );
      }
      throw error;
    }
  }
}
```

---

## 📊 5. Endpoint de Cálculo de Disponibilidad Diaria (`TSK-404`)

El endpoint `GET /api/espacios/:id/disponibilidad?fecha=YYYY-MM-DD` construye una rejilla horaria continua entre las **06:00 y las 22:00** (jornada institucional del Politécnico) dividida en bloques de 1 hora o 30 minutos:

```typescript
// Algoritmo de construcción de rejilla
export function calcularRejillaHoraria(
  fechaStr: string,
  clasesFijas: Array<{ horaInicio: string; horaFin: string; asignatura: string }>,
  reservasAprobadas: Array<{ fechaInicio: Date; fechaFin: Date; motivo: string }>
) {
  const franjas = [];
  for (let hora = 6; hora < 22; hora++) {
    const hIniStr = `${hora.toString().padStart(2, '0')}:00`;
    const hFinStr = `${(hora + 1).toString().padStart(2, '0')}:00`;

    // 1. Evaluar si choca con clase fija
    const clase = clasesFijas.find((c) => c.horaInicio < hFinStr && c.horaFin > hIniStr);
    if (clase) {
      franjas.push({
        horaInicio: hIniStr,
        horaFin: hFinStr,
        disponible: false,
        tipoBloqueo: 'CLASE_FIJA',
        descripcionBloqueo: `Clase: ${clase.asignatura}`,
      });
      continue;
    }

    // 2. Evaluar si choca con reserva aprobada
    const slotStart = new Date(`${fechaStr}T${hIniStr}:00Z`);
    const slotEnd = new Date(`${fechaStr}T${hFinStr}:00Z`);
    const reserva = reservasAprobadas.find((r) => r.fechaInicio < slotEnd && r.fechaFin > slotStart);
    if (reserva) {
      franjas.push({
        horaInicio: hIniStr,
        horaFin: hFinStr,
        disponible: false,
        tipoBloqueo: 'RESERVA_APROBADA',
        descripcionBloqueo: `Reserva institucional`,
      });
      continue;
    }

    // 3. Franja libre
    franjas.push({
      horaInicio: hIniStr,
      horaFin: hFinStr,
      disponible: true,
      tipoBloqueo: 'NINGUNO',
    });
  }
  return franjas;
}
```
