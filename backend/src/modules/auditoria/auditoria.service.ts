import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RegistrarAuditoriaParams {
  usuarioId?: number | null;
  accion: string;
  entidad: string;
  entidadId: number;
  detalles?: any;
  ipAddress?: string | null;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(params: RegistrarAuditoriaParams) {
    return this.prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId || null,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        detalles: params.detalles || undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  }

  async findAll(query?: {
    entidad?: string;
    usuarioId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query?.entidad ? { entidad: query.entidad } : {}),
      ...(query?.usuarioId ? { usuarioId: query.usuarioId } : {}),
    };

    const [total, logs] = await Promise.all([
      this.prisma.auditoria.count({ where }),
      this.prisma.auditoria.findMany({
        where,
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              nombreCompleto: true,
              email: true,
              rol: true,
            },
          },
        },
        orderBy: { creadoEn: 'desc' },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
