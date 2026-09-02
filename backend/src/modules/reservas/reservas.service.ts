import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DisponibilidadService } from '../disponibilidad/disponibilidad.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  CrearReservaInput,
  CambiarEstadoReservaInput,
} from '../../schemas/reserva.schema';
import { Prisma, RolUsuario } from '@prisma/client';

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disponibilidadService: DisponibilidadService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async crearReserva(dto: CrearReservaInput, usuarioId: number) {
    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // A. Validar que el usuario no esté inhabilitado
          const usuario = await tx.usuario.findUnique({
            where: { id: usuarioId },
          });

          if (!usuario) {
            throw new NotFoundException('Usuario solicitante no encontrado');
          }

          if (usuario.inhabilitadoParaReservar) {
            throw new ForbiddenException(
              `Usuario inhabilitado para reservar: ${
                usuario.motivoInhabilitacion || 'Novedad de inventario pendiente'
              }`,
            );
          }

          // B. Validar motor de disponibilidad (Clases fijas + Reservas previas)
          await this.disponibilidadService.validarDisponibilidadTx(
            tx,
            dto.espacioId,
            fechaInicio,
            fechaFin,
          );

          // C. Crear la Reserva
          const reserva = await tx.reserva.create({
            data: {
              espacioId: dto.espacioId,
              usuarioId,
              fechaInicio,
              fechaFin,
              motivo: dto.motivo.trim(),
              cantidadAsistentesEstimada: dto.cantidadAsistentesEstimada || null,
              estado: 'PENDIENTE',
            },
            include: {
              espacio: {
                include: {
                  bloque: { include: { sede: true } },
                },
              },
              usuario: {
                select: {
                  id: true,
                  nombreCompleto: true,
                  email: true,
                  rol: true,
                },
              },
            },
          });

          // D. Registrar Auditoría
          await tx.auditoria.create({
            data: {
              usuarioId,
              accion: 'CREACION_RESERVA',
              entidad: 'Reserva',
              entidadId: reserva.id,
              detalles: {
                motivo: dto.motivo,
                espacioId: dto.espacioId,
                fechaInicio: dto.fechaInicio,
                fechaFin: dto.fechaFin,
              },
            },
          });

          return reserva;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      );
    } catch (error: any) {
      if (error.code === 'P2034') {
        throw new ConflictException(
          'Conflicto de concurrencia: el horario fue modificado por otra solicitud simultánea. Por favor reintente.',
        );
      }
      throw error;
    }
  }

  async findMisReservas(
    usuarioId: number,
    query?: { estado?: string; page?: number; limit?: number },
  ) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservaWhereInput = {
      usuarioId,
      ...(query?.estado ? { estado: query.estado as any } : {}),
    };

    const [total, reservas] = await Promise.all([
      this.prisma.reserva.count({ where }),
      this.prisma.reserva.findMany({
        where,
        skip,
        take: limit,
        include: {
          espacio: {
            include: {
              bloque: { include: { sede: true } },
            },
          },
          aprobaciones: {
            include: {
              aprobador: {
                select: { id: true, nombreCompleto: true, email: true },
              },
            },
            orderBy: { fechaAccion: 'desc' },
          },
          verificaciones: {
            include: {
              detalles: true,
            },
          },
        },
        orderBy: { creadoEn: 'desc' },
      }),
    ]);

    return {
      data: reservas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findGestion(query?: {
    estado?: string;
    espacioId?: number;
    sedeId?: number;
    bloqueId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservaWhereInput = {
      ...(query?.estado ? { estado: query.estado as any } : {}),
      ...(query?.espacioId ? { espacioId: query.espacioId } : {}),
      ...(query?.bloqueId
        ? { espacio: { bloqueId: query.bloqueId } }
        : query?.sedeId
        ? { espacio: { bloque: { sedeId: query.sedeId } } }
        : {}),
    };

    const [total, reservas] = await Promise.all([
      this.prisma.reserva.count({ where }),
      this.prisma.reserva.findMany({
        where,
        skip,
        take: limit,
        include: {
          espacio: {
            include: {
              bloque: { include: { sede: true } },
            },
          },
          usuario: {
            select: {
              id: true,
              nombreCompleto: true,
              email: true,
              rol: true,
              documentoIdentidad: true,
              telefono: true,
              inhabilitadoParaReservar: true,
            },
          },
          aprobaciones: {
            include: {
              aprobador: {
                select: { id: true, nombreCompleto: true },
              },
            },
            orderBy: { fechaAccion: 'desc' },
          },
        },
        orderBy: { creadoEn: 'desc' },
      }),
    ]);

    return {
      data: reservas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        espacio: {
          include: {
            bloque: { include: { sede: true } },
            inventario: { where: { estado: { not: 'DE_BAJA' } } },
          },
        },
        usuario: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            rol: true,
            documentoIdentidad: true,
            telefono: true,
          },
        },
        aprobaciones: {
          include: {
            aprobador: {
              select: { id: true, nombreCompleto: true, email: true },
            },
          },
          orderBy: { fechaAccion: 'desc' },
        },
        verificaciones: {
          include: {
            detalles: {
              include: { itemInventario: true },
            },
            verificador: {
              select: { id: true, nombreCompleto: true },
            },
          },
          orderBy: { fechaHora: 'asc' },
        },
      },
    });

    if (!reserva) {
      throw new NotFoundException(`La reserva con ID ${id} no existe`);
    }

    return reserva;
  }

  async cancelar(id: number, usuarioId: number, rol: RolUsuario) {
    const reserva = await this.findById(id);

    if (rol !== 'SUPERADMIN' && reserva.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tiene autorización para cancelar esta reserva');
    }

    if (['CANCELADA', 'FINALIZADA', 'RECHAZADA'].includes(reserva.estado)) {
      throw new BadRequestException(
        `No se puede cancelar una reserva que ya se encuentra en estado ${reserva.estado}`,
      );
    }

    const cancelada = await this.prisma.reserva.update({
      where: { id },
      data: { estado: 'CANCELADA' },
      include: {
        espacio: true,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'CANCELACION_RESERVA',
      entidad: 'Reserva',
      entidadId: id,
      detalles: { estadoPrevio: reserva.estado },
    });

    return cancelada;
  }

  async cambiarEstado(id: number, dto: CambiarEstadoReservaInput, gestorId: number) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const reserva = await tx.reserva.findUnique({
            where: { id },
            include: { espacio: true },
          });

          if (!reserva) {
            throw new NotFoundException(`La reserva con ID ${id} no existe`);
          }

          if (reserva.estado !== 'PENDIENTE') {
            throw new BadRequestException(
              `Solo se pueden dictaminar reservas en estado PENDIENTE (Estado actual: ${reserva.estado})`,
            );
          }

          // Si se va a aprobar, validar nuevamente disponibilidad bajo aislamiento serializable
          if (dto.estado === 'APROBADA') {
            await this.disponibilidadService.validarDisponibilidadTx(
              tx,
              reserva.espacioId,
              reserva.fechaInicio,
              reserva.fechaFin,
              reserva.id,
            );
          }

          // Registrar Aprobación
          await tx.aprobacion.create({
            data: {
              reservaId: id,
              aprobadorId: gestorId,
              estado: dto.estado === 'APROBADA' ? 'APROBADA' : 'RECHAZADA',
              observaciones: dto.observaciones?.trim() || null,
            },
          });

          // Actualizar estado de la reserva
          const reservaActualizada = await tx.reserva.update({
            where: { id },
            data: { estado: dto.estado },
            include: {
              espacio: { include: { bloque: { include: { sede: true } } } },
              usuario: {
                select: { id: true, nombreCompleto: true, email: true },
              },
            },
          });

          // Auditoría
          await tx.auditoria.create({
            data: {
              usuarioId: gestorId,
              accion: `DICTAMEN_RESERVA_${dto.estado}`,
              entidad: 'Reserva',
              entidadId: id,
              detalles: {
                estado: dto.estado,
                observaciones: dto.observaciones,
              },
            },
          });

          return reservaActualizada;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      );
    } catch (error: any) {
      if (error.code === 'P2034') {
        throw new ConflictException(
          'Conflicto de concurrencia: el estado del horario cambió durante la aprobación. Por favor reintente.',
        );
      }
      throw error;
    }
  }
}
