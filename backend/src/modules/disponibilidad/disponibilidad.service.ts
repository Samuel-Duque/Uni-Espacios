import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface FranjaHoraria {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  tipoBloqueo: 'NINGUNO' | 'CLASE_FIJA' | 'RESERVA_APROBADA' | 'ESPACIO_INACTIVO';
  descripcionBloqueo?: string;
}

/**
 * Extrae componentes de fecha y hora en la zona horaria institucional America/Bogota (UTC-5).
 */
export function getBogotaDateTime(date: Date): {
  fechaSolo: Date;
  diaSemana: number; // 1 = Lunes .. 7 = Domingo
  horaStr: string;   // "HH:mm"
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const diaSemana = weekdayMap[partMap.weekday] || 1;
  const horaStr = `${partMap.hour}:${partMap.minute}`;
  const fechaSolo = new Date(`${partMap.year}-${partMap.month}-${partMap.day}T00:00:00.000Z`);

  return { fechaSolo, diaSemana, horaStr };
}

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
    excluirReservaId?: number,
  ): Promise<void> {
    // 1. Verificar estado del espacio físico
    const espacio = await tx.espacio.findUnique({
      where: { id: espacioId },
    });
    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${espacioId} no existe`);
    }
    if (espacio.estado !== 'ACTIVO') {
      throw new ConflictException(
        `El espacio no está disponible para reservas (Estado: ${espacio.estado})`,
      );
    }

    // 2. Verificar cruce con Clases Fijas del Periodo Activo (Zona Horaria America/Bogota)
    const { fechaSolo, diaSemana, horaStr: horaIniStr } = getBogotaDateTime(fechaInicio);
    const { horaStr: horaFinStr } = getBogotaDateTime(fechaFin);

    const periodoActivo = await tx.periodoAcademico.findFirst({
      where: {
        estado: 'ACTIVO',
        fechaInicio: { lte: fechaSolo },
        fechaFin: { gte: fechaSolo },
      },
    });

    if (periodoActivo) {
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
          `Colisión con Clase Fija académica: "${claseConflicto.asignatura}" (${claseConflicto.horaInicio} - ${claseConflicto.horaFin})`,
        );
      }
    }

    // 3. Verificar cruce con Reservas previas APROBADAS o EN_USO
    const whereReserva: Prisma.ReservaWhereInput = {
      espacioId,
      estado: { in: ['APROBADA', 'EN_USO'] },
      fechaInicio: { lt: fechaFin },
      fechaFin: { gt: fechaInicio },
    };
    if (excluirReservaId) {
      whereReserva.id = { not: excluirReservaId };
    }

    const reservaConflicto = await tx.reserva.findFirst({
      where: whereReserva,
    });

    if (reservaConflicto) {
      throw new ConflictException(
        `El espacio ya cuenta con una reserva aprobada en este horario (${reservaConflicto.fechaInicio.toISOString()} - ${reservaConflicto.fechaFin.toISOString()})`,
      );
    }
  }

  /**
   * Calcula la rejilla horaria de disponibilidad (06:00 a 22:00) para un día específico
   */
  async calcularDisponibilidadDiaria(
    espacioId: number,
    fechaStr: string,
  ): Promise<{
    espacioId: number;
    fecha: string;
    espacio: { identificador: string; tipo: string; estado: string };
    franjas: FranjaHoraria[];
  }> {
    const espacio = await this.prisma.espacio.findUnique({
      where: { id: espacioId },
      include: { bloque: { include: { sede: true } } },
    });

    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${espacioId} no existe`);
    }

    // Límites del día en zona horaria America/Bogota (UTC-5)
    const startOfDay = new Date(`${fechaStr}T00:00:00-05:00`);
    const endOfDay = new Date(`${fechaStr}T23:59:59.999-05:00`);
    const midday = new Date(`${fechaStr}T12:00:00-05:00`);
    const { diaSemana, fechaSolo } = getBogotaDateTime(midday);

    // 1. Obtener periodo activo y clases fijas del día
    const periodoActivo = await this.prisma.periodoAcademico.findFirst({
      where: {
        estado: 'ACTIVO',
        fechaInicio: { lte: fechaSolo },
        fechaFin: { gte: fechaSolo },
      },
    });

    const clasesFijas = periodoActivo
      ? await this.prisma.claseFija.findMany({
          where: {
            espacioId,
            periodoId: periodoActivo.id,
            diaSemana,
          },
        })
      : [];

    // 2. Obtener reservas aprobadas o en uso del día
    const reservasAprobadas = await this.prisma.reserva.findMany({
      where: {
        espacioId,
        estado: { in: ['APROBADA', 'EN_USO'] },
        fechaInicio: { lte: endOfDay },
        fechaFin: { gte: startOfDay },
      },
    });

    // 3. Construir rejilla horaria de 06:00 a 22:00
    const franjas: FranjaHoraria[] = [];

    for (let hora = 6; hora < 22; hora++) {
      const hIniStr = `${hora.toString().padStart(2, '0')}:00`;
      const hFinStr = `${(hora + 1).toString().padStart(2, '0')}:00`;

      if (espacio.estado !== 'ACTIVO') {
        franjas.push({
          horaInicio: hIniStr,
          horaFin: hFinStr,
          disponible: false,
          tipoBloqueo: 'ESPACIO_INACTIVO',
          descripcionBloqueo: `Espacio en estado ${espacio.estado}`,
        });
        continue;
      }

      // Evaluar si choca con clase fija
      const clase = clasesFijas.find((c) => c.horaInicio < hFinStr && c.horaFin > hIniStr);
      if (clase) {
        franjas.push({
          horaInicio: hIniStr,
          horaFin: hFinStr,
          disponible: false,
          tipoBloqueo: 'CLASE_FIJA',
          descripcionBloqueo: `Clase: ${clase.asignatura} (${clase.docente})`,
        });
        continue;
      }

      // Evaluar si choca con reserva aprobada (comparando en timestamps absolutos UTC)
      const slotStart = new Date(`${fechaStr}T${hIniStr}:00-05:00`);
      const slotEnd = new Date(`${fechaStr}T${hFinStr}:00-05:00`);
      const reserva = reservasAprobadas.find(
        (r) => r.fechaInicio < slotEnd && r.fechaFin > slotStart,
      );

      if (reserva) {
        franjas.push({
          horaInicio: hIniStr,
          horaFin: hFinStr,
          disponible: false,
          tipoBloqueo: 'RESERVA_APROBADA',
          descripcionBloqueo: `Reserva institucional: ${reserva.motivo}`,
        });
        continue;
      }

      // Franja disponible
      franjas.push({
        horaInicio: hIniStr,
        horaFin: hFinStr,
        disponible: true,
        tipoBloqueo: 'NINGUNO',
      });
    }

    return {
      espacioId,
      fecha: fechaStr,
      espacio: {
        identificador: espacio.identificador,
        tipo: espacio.tipo,
        estado: espacio.estado,
      },
      franjas,
    };
  }
}
