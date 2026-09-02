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
      // 1 = Lunes .. 7 = Domingo
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
          `Colisión con Clase Fija académica: "${claseConflicto.asignatura}" (${claseConflicto.horaInicio} - ${claseConflicto.horaFin})`,
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

    const startOfDay = new Date(`${fechaStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${fechaStr}T23:59:59.999Z`);
    const diaSemana = startOfDay.getUTCDay() === 0 ? 7 : startOfDay.getUTCDay();

    // 1. Obtener periodo activo y clases fijas del día
    const periodoActivo = await this.prisma.periodoAcademico.findFirst({
      where: {
        estado: 'ACTIVO',
        fechaInicio: { lte: startOfDay },
        fechaFin: { gte: startOfDay },
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

      // Evaluar si choca con reserva aprobada
      const slotStart = new Date(`${fechaStr}T${hIniStr}:00.000Z`);
      const slotEnd = new Date(`${fechaStr}T${hFinStr}:00.000Z`);
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
