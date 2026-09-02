import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEspacioInput,
  UpdateEspacioInput,
  EspacioFiltrosQuery,
} from '../../schemas/espacio.schema';
import { Prisma } from '@prisma/client';

@Injectable()
export class EspaciosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: EspacioFiltrosQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.EspacioWhereInput = {};

    if (query.bloqueId) {
      where.bloqueId = query.bloqueId;
    } else if (query.sedeId) {
      where.bloque = { sedeId: query.sedeId };
    }

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.capacidadMin) {
      where.capacidad = { gte: query.capacidadMin };
    }

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.categoriaImplemento) {
      where.inventario = {
        some: {
          categoria: query.categoriaImplemento,
          estado: { not: 'DE_BAJA' },
        },
      };
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { identificador: { contains: search } },
        { ubicacionDetalle: { contains: search } },
        { bloque: { codigo: { contains: search } } },
      ];
    }

    const [total, espacios] = await Promise.all([
      this.prisma.espacio.count({ where }),
      this.prisma.espacio.findMany({
        where,
        skip,
        take: limit,
        include: {
          bloque: {
            include: { sede: true },
          },
          _count: {
            select: {
              inventario: {
                where: { estado: { not: 'DE_BAJA' } },
              },
            },
          },
        },
        orderBy: [{ bloque: { codigo: 'asc' } }, { identificador: 'asc' }],
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: espacios,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: number) {
    const espacio = await this.prisma.espacio.findUnique({
      where: { id },
      include: {
        bloque: {
          include: { sede: true },
        },
        inventario: {
          where: { estado: { not: 'DE_BAJA' } },
          orderBy: { nombre: 'asc' },
        },
        clasesFijas: {
          include: { periodo: true },
        },
      },
    });

    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${id} no existe`);
    }

    return espacio;
  }

  async create(data: CreateEspacioInput) {
    const bloque = await this.prisma.bloque.findUnique({
      where: { id: data.bloqueId },
    });
    if (!bloque) {
      throw new NotFoundException(`El bloque con ID ${data.bloqueId} no existe`);
    }

    return this.prisma.espacio.create({
      data: {
        bloqueId: data.bloqueId,
        identificador: data.identificador.trim(),
        tipo: data.tipo,
        capacidad: data.capacidad,
        piso: data.piso,
        ubicacionDetalle: data.ubicacionDetalle?.trim() || null,
        permiteReservaDirecta: data.permiteReservaDirecta ?? false,
        estado: data.estado || 'ACTIVO',
      },
      include: {
        bloque: {
          include: { sede: true },
        },
      },
    });
  }

  async update(id: number, data: UpdateEspacioInput) {
    await this.findById(id);

    return this.prisma.espacio.update({
      where: { id },
      data: {
        ...(data.bloqueId ? { bloqueId: data.bloqueId } : {}),
        ...(data.identificador ? { identificador: data.identificador.trim() } : {}),
        ...(data.tipo ? { tipo: data.tipo } : {}),
        ...(data.capacidad !== undefined ? { capacidad: data.capacidad } : {}),
        ...(data.piso !== undefined ? { piso: data.piso } : {}),
        ...(data.ubicacionDetalle !== undefined
          ? { ubicacionDetalle: data.ubicacionDetalle?.trim() || null }
          : {}),
        ...(data.permiteReservaDirecta !== undefined
          ? { permiteReservaDirecta: data.permiteReservaDirecta }
          : {}),
        ...(data.estado ? { estado: data.estado } : {}),
      },
      include: {
        bloque: {
          include: { sede: true },
        },
      },
    });
  }
}
