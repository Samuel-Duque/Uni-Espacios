import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async findAll(query?: { rol?: any; activo?: boolean; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(query?.rol ? { rol: query.rol } : {}),
      ...(query?.activo !== undefined ? { activo: query.activo } : {}),
    };

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { nombreCompleto: { contains: s } },
        { email: { contains: s } },
        { documentoIdentidad: { contains: s } },
      ];
    }

    const [total, usuarios] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          nombreCompleto: true,
          rol: true,
          documentoIdentidad: true,
          telefono: true,
          activo: true,
          inhabilitadoParaReservar: true,
          motivoInhabilitacion: true,
          creadoEn: true,
          actualizadoEn: true,
        },
        orderBy: { nombreCompleto: 'asc' },
      }),
    ]);

    return {
      data: usuarios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        rol: true,
        documentoIdentidad: true,
        telefono: true,
        activo: true,
        inhabilitadoParaReservar: true,
        motivoInhabilitacion: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`El usuario con ID ${id} no existe`);
    }

    return usuario;
  }

  async inhabilitar(id: number, motivo: string, gestorId: number) {
    await this.findById(id);

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: {
        inhabilitadoParaReservar: true,
        motivoInhabilitacion: motivo.trim(),
      },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        inhabilitadoParaReservar: true,
        motivoInhabilitacion: true,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: gestorId,
      accion: 'INHABILITACION_USUARIO',
      entidad: 'Usuario',
      entidadId: id,
      detalles: { motivo },
    });

    return usuario;
  }

  async rehabilitar(id: number, gestorId: number) {
    await this.findById(id);

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: {
        inhabilitadoParaReservar: false,
        motivoInhabilitacion: null,
      },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        inhabilitadoParaReservar: true,
        motivoInhabilitacion: true,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId: gestorId,
      accion: 'REHABILITACION_USUARIO',
      entidad: 'Usuario',
      entidadId: id,
      detalles: { accion: 'Rehabilitado para reservar' },
    });

    return usuario;
  }
}
