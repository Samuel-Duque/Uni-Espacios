import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SedesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sede.findMany({
      include: {
        _count: {
          select: { bloques: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: number) {
    const sede = await this.prisma.sede.findUnique({
      where: { id },
      include: {
        bloques: true,
      },
    });

    if (!sede) {
      throw new NotFoundException(`La sede con ID ${id} no existe`);
    }

    return sede;
  }

  async create(data: { nombre: string; ciudad: string; direccion: string }) {
    return this.prisma.sede.create({
      data: {
        nombre: data.nombre.trim(),
        ciudad: data.ciudad.trim(),
        direccion: data.direccion.trim(),
      },
    });
  }
}
