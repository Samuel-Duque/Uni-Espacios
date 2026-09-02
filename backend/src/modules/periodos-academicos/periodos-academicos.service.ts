import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PeriodoAcademicoInput } from '../../schemas/calendario.schema';

@Injectable()
export class PeriodosAcademicosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.periodoAcademico.findMany({
      include: {
        _count: {
          select: { clasesFijas: true },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async findById(id: number) {
    const periodo = await this.prisma.periodoAcademico.findUnique({
      where: { id },
      include: {
        clasesFijas: true,
      },
    });

    if (!periodo) {
      throw new NotFoundException(`El periodo académico con ID ${id} no existe`);
    }

    return periodo;
  }

  async create(data: PeriodoAcademicoInput) {
    const existeCodigo = await this.prisma.periodoAcademico.findUnique({
      where: { codigo: data.codigo.trim() },
    });

    if (existeCodigo) {
      throw new ConflictException(
        `Ya existe un periodo académico registrado con el código "${data.codigo}"`,
      );
    }

    return this.prisma.periodoAcademico.create({
      data: {
        codigo: data.codigo.trim(),
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: data.estado || 'PLANIFICACION',
      },
    });
  }

  async activar(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const periodo = await tx.periodoAcademico.findUnique({
        where: { id },
      });

      if (!periodo) {
        throw new NotFoundException(`El periodo académico con ID ${id} no existe`);
      }

      // 1. Desactivar todos los demás periodos que estén en ACTIVO y pasarlos a FINALIZADO
      await tx.periodoAcademico.updateMany({
        where: {
          id: { not: id },
          estado: 'ACTIVO',
        },
        data: {
          estado: 'FINALIZADO',
        },
      });

      // 2. Marcar el periodo objetivo como ACTIVO
      return tx.periodoAcademico.update({
        where: { id },
        data: { estado: 'ACTIVO' },
      });
    });
  }
}
