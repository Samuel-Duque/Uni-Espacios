import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateClaseFijaInput,
  BulkCreateClaseFijaInput,
} from '../../schemas/calendario.schema';

@Injectable()
export class ClasesFijasService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEspacio(espacioId: number, periodoId?: number) {
    const espacio = await this.prisma.espacio.findUnique({
      where: { id: espacioId },
    });
    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${espacioId} no existe`);
    }

    return this.prisma.claseFija.findMany({
      where: {
        espacioId,
        ...(periodoId ? { periodoId } : {}),
      },
      include: {
        periodo: true,
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async findById(id: number) {
    const clase = await this.prisma.claseFija.findUnique({
      where: { id },
      include: {
        espacio: true,
        periodo: true,
      },
    });

    if (!clase) {
      throw new NotFoundException(`La clase fija con ID ${id} no existe`);
    }

    return clase;
  }

  async create(data: CreateClaseFijaInput) {
    // 1. Validar espacio y periodo
    const [espacio, periodo] = await Promise.all([
      this.prisma.espacio.findUnique({ where: { id: data.espacioId } }),
      this.prisma.periodoAcademico.findUnique({ where: { id: data.periodoId } }),
    ]);

    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${data.espacioId} no existe`);
    }
    if (!periodo) {
      throw new NotFoundException(`El periodo académico con ID ${data.periodoId} no existe`);
    }

    // 2. Validar que no solape con otra clase fija existente en el mismo espacio, periodo y día
    const solapamiento = await this.prisma.claseFija.findFirst({
      where: {
        espacioId: data.espacioId,
        periodoId: data.periodoId,
        diaSemana: data.diaSemana,
        horaInicio: { lt: data.horaFin },
        horaFin: { gt: data.horaInicio },
      },
    });

    if (solapamiento) {
      throw new ConflictException(
        `Existe un conflicto de horario con la clase "${solapamiento.asignatura}" (${solapamiento.horaInicio} - ${solapamiento.horaFin}) en este mismo espacio y día`,
      );
    }

    return this.prisma.claseFija.create({
      data: {
        espacioId: data.espacioId,
        periodoId: data.periodoId,
        diaSemana: data.diaSemana,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        asignatura: data.asignatura.trim(),
        docente: data.docente.trim(),
        grupo: data.grupo?.trim() || null,
      },
      include: {
        espacio: true,
        periodo: true,
      },
    });
  }

  async bulkCreate(data: BulkCreateClaseFijaInput) {
    return this.prisma.$transaction(async (tx) => {
      const creadas = [];

      for (const clase of data.clases) {
        // Validar solapamiento
        const solapamiento = await tx.claseFija.findFirst({
          where: {
            espacioId: clase.espacioId,
            periodoId: clase.periodoId,
            diaSemana: clase.diaSemana,
            horaInicio: { lt: clase.horaFin },
            horaFin: { gt: clase.horaInicio },
          },
        });

        if (solapamiento) {
          throw new ConflictException(
            `Conflicto en carga masiva: la clase "${clase.asignatura}" colisiona con "${solapamiento.asignatura}" (${solapamiento.horaInicio} - ${solapamiento.horaFin})`,
          );
        }

        const nuevaClase = await tx.claseFija.create({
          data: {
            espacioId: clase.espacioId,
            periodoId: clase.periodoId,
            diaSemana: clase.diaSemana,
            horaInicio: clase.horaInicio,
            horaFin: clase.horaFin,
            asignatura: clase.asignatura.trim(),
            docente: clase.docente.trim(),
            grupo: clase.grupo?.trim() || null,
          },
        });

        creadas.push(nuevaClase);
      }

      return {
        totalInsertadas: creadas.length,
        clases: creadas,
      };
    });
  }

  async remove(id: number) {
    await this.findById(id);

    return this.prisma.claseFija.delete({
      where: { id },
    });
  }
}
