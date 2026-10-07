import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CheckInInput, CheckOutInput } from '../../schemas/verificacion.schema';
import { RolUsuario } from '@prisma/client';

@Injectable()
export class VerificacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async registrarCheckIn(reservaId: number, usuarioId: number, dto: CheckInInput, rol?: RolUsuario) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        include: {
          espacio: {
            include: {
              inventario: { where: { estado: { not: 'DE_BAJA' } } },
            },
          },
          usuario: true,
        },
      });

      if (!reserva) {
        throw new NotFoundException(`La reserva con ID ${reservaId} no existe`);
      }

      // Validar permisos: solicitante, gestor o superadmin
      const esSolicitante = reserva.usuarioId === usuarioId;
      const esGestorOAdmin = rol === 'GESTOR_ESPACIO' || rol === 'SUPERADMIN';
      if (!esSolicitante && !esGestorOAdmin) {
        throw new ForbiddenException('No tiene permisos para realizar el Check-In de esta reserva');
      }

      if (reserva.estado !== 'APROBADA') {
        throw new BadRequestException(
          `No se puede realizar Check-In en una reserva en estado ${reserva.estado} (debe estar APROBADA)`,
        );
      }

      // Validar ventana de tiempo (15 min antes hasta 20 min después del inicio)
      const ahora = Date.now();
      const tIni = new Date(reserva.fechaInicio).getTime();
      const ventanaIni = tIni - 15 * 60 * 1000;
      const ventanaFin = tIni + 20 * 60 * 1000;

      // Permitir bypass de ventana si es GESTOR o SUPERADMIN en caso de contingencia
      if (!esGestorOAdmin && (ahora < ventanaIni || ahora > ventanaFin)) {
        throw new BadRequestException(
          'El Check-In se encuentra fuera de la ventana horaria permitida (disponible desde 15 min antes hasta 20 min después del inicio)',
        );
      }

      // Evaluar si reporta novedades preexistentes
      const hayNovedadesPreexistentes = dto.items.some(
        (i) => i.estadoItem === 'PRESENTE_DANADO' || i.estadoItem === 'FALTANTE',
      );

      // Crear VerificacionInventario
      const verificacion = await tx.verificacionInventario.create({
        data: {
          reservaId,
          usuarioVerificadorId: usuarioId,
          tipo: 'CHECK_IN',
          estadoGeneral: hayNovedadesPreexistentes ? 'CON_NOVEDADES' : 'CONFORME',
          observaciones: dto.observacionesGenerales?.trim() || null,
          detalles: {
            create: dto.items.map((it) => ({
              itemInventarioId: it.itemInventarioId,
              estadoItem: it.estadoItem,
              cantidadEncontrada: it.cantidadEncontrada,
              observacionNovedad: it.observacionNovedad?.trim() || null,
            })),
          },
        },
        include: {
          detalles: {
            include: { itemInventario: true },
          },
        },
      });

      // Transicionar reserva a EN_USO
      await tx.reserva.update({
        where: { id: reservaId },
        data: { estado: 'EN_USO' },
      });

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          accion: 'CHECK_IN_REALIZADO',
          entidad: 'VerificacionInventario',
          entidadId: verificacion.id,
          detalles: {
            reservaId,
            estadoGeneral: verificacion.estadoGeneral,
            itemsVerificados: dto.items.length,
          },
        },
      });

      return verificacion;
    });
  }

  async registrarCheckOut(reservaId: number, usuarioId: number, dto: CheckOutInput, rol?: RolUsuario) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        include: {
          espacio: {
            include: {
              inventario: { where: { estado: { not: 'DE_BAJA' } } },
            },
          },
          usuario: true,
        },
      });

      if (!reserva) {
        throw new NotFoundException(`La reserva con ID ${reservaId} no existe`);
      }

      const esSolicitante = reserva.usuarioId === usuarioId;
      const esGestorOAdmin = rol === 'GESTOR_ESPACIO' || rol === 'SUPERADMIN';
      if (!esSolicitante && !esGestorOAdmin) {
        throw new ForbiddenException('No tiene permisos para realizar el Check-Out de esta reserva');
      }

      if (reserva.estado !== 'EN_USO') {
        throw new BadRequestException(
          `No se puede realizar Check-Out si la reserva no está en estado EN_USO (Estado actual: ${reserva.estado})`,
        );
      }

      // A-02: Validar ventana máxima de Check-Out (hasta T_fin + 30m)
      const ahora = new Date();
      const limiteCheckOut = new Date(reserva.fechaFin.getTime() + 30 * 60 * 1000);
      if (ahora.getTime() > limiteCheckOut.getTime()) {
        throw new BadRequestException(
          'La ventana para registrar el Check-Out ha expirado (máximo 30 minutos posteriores a la hora de finalización)',
        );
      }

      // C-03: Recuperar verificación de Check-In para comparar daños preexistentes
      const checkInVerificacion = await tx.verificacionInventario.findFirst({
        where: {
          reservaId,
          tipo: 'CHECK_IN',
        },
        include: {
          detalles: true,
        },
      });

      const checkInDetallesMap = new Map<
        number,
        NonNullable<typeof checkInVerificacion>['detalles'][number]
      >();
      if (checkInVerificacion) {
        for (const det of checkInVerificacion.detalles) {
          checkInDetallesMap.set(det.itemInventarioId, det);
        }
      }

      // Evaluar novedades atribuibles (ítems cuyo estado empeoró respecto al Check-In)
      const novedadesAtribuibles = dto.items.filter((itemOut) => {
        if (itemOut.estadoItem === 'PRESENTE_OPTIMO') {
          return false;
        }

        const detIn = checkInDetallesMap.get(itemOut.itemInventarioId);
        if (!detIn) {
          return itemOut.estadoItem === 'PRESENTE_DANADO' || itemOut.estadoItem === 'FALTANTE';
        }

        // Si ya estaba en el mismo estado defectuoso en Check-In, no es novedad nueva imputable
        if (detIn.estadoItem === itemOut.estadoItem) {
          return false;
        }

        return true;
      });

      const hayNovedades = novedadesAtribuibles.length > 0;
      const estadoGeneral = hayNovedades ? 'CON_NOVEDADES' : 'CONFORME';

      // Crear VerificacionInventario de Check-Out
      const verificacion = await tx.verificacionInventario.create({
        data: {
          reservaId,
          usuarioVerificadorId: usuarioId,
          tipo: 'CHECK_OUT',
          estadoGeneral,
          observaciones: dto.observacionesGenerales?.trim() || null,
          detalles: {
            create: dto.items.map((it) => ({
              itemInventarioId: it.itemInventarioId,
              estadoItem: it.estadoItem,
              cantidadEncontrada: it.cantidadEncontrada,
              observacionNovedad: it.observacionNovedad?.trim() || null,
            })),
          },
        },
        include: {
          detalles: {
            include: { itemInventario: true },
          },
        },
      });

      // Si se detectaron novedades atribuibles nuevas, actualizar estado de los implementos e inhabilitar al usuario
      if (hayNovedades) {
        for (const nov of novedadesAtribuibles) {
          if (nov.estadoItem === 'PRESENTE_DANADO') {
            await tx.itemInventario.update({
              where: { id: nov.itemInventarioId },
              data: { estado: 'DANADO' },
            });
          }
        }

        await tx.usuario.update({
          where: { id: reserva.usuarioId },
          data: {
            inhabilitadoParaReservar: true,
            motivoInhabilitacion: `Novedad de inventario en Reserva #${reservaId} (${novedadesAtribuibles.length} implemento(s) con daño o faltante no documentado en Check-In)`,
          },
        });
      }

      // Transicionar reserva a FINALIZADA
      await tx.reserva.update({
        where: { id: reservaId },
        data: { estado: 'FINALIZADA' },
      });

      // Registrar auditoría
      await tx.auditoria.create({
        data: {
          usuarioId,
          accion: hayNovedades ? 'CHECK_OUT_CON_NOVEDADES' : 'CHECK_OUT_CONFORME',
          entidad: 'VerificacionInventario',
          entidadId: verificacion.id,
          detalles: {
            reservaId,
            estadoGeneral,
            novedadesCount: novedadesAtribuibles.length,
            usuarioInhabilitado: hayNovedades ? reserva.usuarioId : null,
          },
        },
      });

      return verificacion;
    });
  }

  async findVerificacionesByReserva(reservaId: number, usuarioId: number, rol: RolUsuario) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      throw new NotFoundException(`La reserva con ID ${reservaId} no existe`);
    }

    const esSolicitante = reserva.usuarioId === usuarioId;
    const esGestorOAdmin = rol === 'GESTOR_ESPACIO' || rol === 'SUPERADMIN';
    if (!esSolicitante && !esGestorOAdmin) {
      throw new ForbiddenException('No tiene permisos para ver las actas de esta reserva');
    }

    return this.prisma.verificacionInventario.findMany({
      where: { reservaId },
      include: {
        detalles: {
          include: { itemInventario: true },
        },
        verificador: {
          select: { id: true, nombreCompleto: true, email: true },
        },
      },
      orderBy: { fechaHora: 'asc' },
    });
  }

  async findNovedades(query?: { page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      tipo: 'CHECK_OUT' as const,
      estadoGeneral: 'CON_NOVEDADES' as const,
    };

    const [total, reportes] = await Promise.all([
      this.prisma.verificacionInventario.count({ where }),
      this.prisma.verificacionInventario.findMany({
        where,
        skip,
        take: limit,
        include: {
          reserva: {
            include: {
              espacio: {
                include: { bloque: { include: { sede: true } } },
              },
              usuario: {
                select: {
                  id: true,
                  nombreCompleto: true,
                  email: true,
                  documentoIdentidad: true,
                  telefono: true,
                  inhabilitadoParaReservar: true,
                  motivoInhabilitacion: true,
                },
              },
            },
          },
          detalles: {
            where: {
              estadoItem: { in: ['PRESENTE_DANADO', 'FALTANTE'] },
            },
            include: {
              itemInventario: true,
            },
          },
          verificador: {
            select: { id: true, nombreCompleto: true, email: true },
          },
        },
        orderBy: { fechaHora: 'desc' },
      }),
    ]);

    return {
      data: reportes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
