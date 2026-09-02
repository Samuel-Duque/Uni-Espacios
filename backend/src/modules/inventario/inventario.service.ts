import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateItemInventarioInput,
  UpdateItemInventarioInput,
} from '../../schemas/inventario.schema';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEspacio(espacioId: number) {
    const espacio = await this.prisma.espacio.findUnique({
      where: { id: espacioId },
    });
    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${espacioId} no existe`);
    }

    return this.prisma.itemInventario.findMany({
      where: {
        espacioId,
        estado: { not: 'DE_BAJA' },
      },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findById(id: number) {
    const item = await this.prisma.itemInventario.findUnique({
      where: { id },
      include: {
        espacio: {
          include: {
            bloque: {
              include: { sede: true },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`El implemento de inventario con ID ${id} no existe`);
    }

    return item;
  }

  async create(data: CreateItemInventarioInput) {
    const espacio = await this.prisma.espacio.findUnique({
      where: { id: data.espacioId },
    });
    if (!espacio) {
      throw new NotFoundException(`El espacio físico con ID ${data.espacioId} no existe`);
    }

    const itemExistente = await this.prisma.itemInventario.findUnique({
      where: {
        espacioId_codigo: {
          espacioId: data.espacioId,
          codigo: data.codigo.trim(),
        },
      },
    });

    if (itemExistente) {
      throw new ConflictException(
        `Ya existe un implemento con el código o placa "${data.codigo}" en este espacio`,
      );
    }

    return this.prisma.itemInventario.create({
      data: {
        espacioId: data.espacioId,
        codigo: data.codigo.trim(),
        nombre: data.nombre.trim(),
        categoria: data.categoria,
        cantidad: data.cantidad || 1,
        estado: data.estado || 'OPTIMO',
        esCritico: data.esCritico ?? false,
        descripcion: data.descripcion?.trim() || null,
      },
    });
  }

  async update(id: number, data: UpdateItemInventarioInput) {
    await this.findById(id);

    return this.prisma.itemInventario.update({
      where: { id },
      data: {
        ...(data.codigo ? { codigo: data.codigo.trim() } : {}),
        ...(data.nombre ? { nombre: data.nombre.trim() } : {}),
        ...(data.categoria ? { categoria: data.categoria } : {}),
        ...(data.cantidad !== undefined ? { cantidad: data.cantidad } : {}),
        ...(data.estado ? { estado: data.estado } : {}),
        ...(data.esCritico !== undefined ? { esCritico: data.esCritico } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion?.trim() || null } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);

    // Marcar como DE_BAJA para preservar integridad histórica con verificaciones
    return this.prisma.itemInventario.update({
      where: { id },
      data: { estado: 'DE_BAJA' },
    });
  }
}
