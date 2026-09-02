import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BloquesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sedeId?: number) {
    return this.prisma.bloque.findMany({
      where: sedeId ? { sedeId } : undefined,
      include: {
        sede: true,
        _count: {
          select: { espacios: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  async findById(id: number) {
    const bloque = await this.prisma.bloque.findUnique({
      where: { id },
      include: {
        sede: true,
        espacios: true,
      },
    });

    if (!bloque) {
      throw new NotFoundException(`El bloque con ID ${id} no existe`);
    }

    return bloque;
  }

  async create(data: { sedeId: number; codigo: string; descripcion?: string }) {
    // Validar existencia de sede
    const sede = await this.prisma.sede.findUnique({
      where: { id: data.sedeId },
    });
    if (!sede) {
      throw new NotFoundException(`La sede con ID ${data.sedeId} no existe`);
    }

    return this.prisma.bloque.create({
      data: {
        sedeId: data.sedeId,
        codigo: data.codigo.trim(),
        descripcion: data.descripcion?.trim() || null,
      },
      include: {
        sede: true,
      },
    });
  }
}
