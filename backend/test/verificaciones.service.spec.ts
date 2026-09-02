import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VerificacionesService } from '../src/modules/verificaciones/verificaciones.service';
import { AuditoriaService } from '../src/modules/auditoria/auditoria.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('VerificacionesService', () => {
  let service: VerificacionesService;
  let prisma: any;
  let auditoriaService: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
      reserva: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      itemInventario: {
        update: jest.fn(),
      },
      usuario: {
        update: jest.fn(),
      },
      verificacionInventario: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      auditoria: {
        create: jest.fn(),
      },
    };

    auditoriaService = {
      registrar: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificacionesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditoriaService, useValue: auditoriaService },
      ],
    }).compile();

    service = module.get<VerificacionesService>(VerificacionesService);
  });

  describe('registrarCheckIn', () => {
    const ahora = new Date();
    const mockReserva = {
      id: 1,
      usuarioId: 10,
      espacioId: 1,
      estado: 'APROBADA',
      fechaInicio: ahora,
      fechaFin: new Date(ahora.getTime() + 2 * 60 * 60 * 1000),
      espacio: { inventario: [] },
      usuario: { id: 10 },
    };

    it('debe rechazar el Check-In si el usuario no es el solicitante ni gestor', async () => {
      prisma.reserva.findUnique.mockResolvedValue(mockReserva);

      await expect(
        service.registrarCheckIn(1, 999, { items: [] }, 'ESTUDIANTE'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar el Check-In si la reserva no está APROBADA', async () => {
      prisma.reserva.findUnique.mockResolvedValue({ ...mockReserva, estado: 'PENDIENTE' });

      await expect(
        service.registrarCheckIn(1, 10, { items: [] }, 'ESTUDIANTE'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe registrar el Check-In y transicionar la reserva a EN_USO', async () => {
      prisma.reserva.findUnique.mockResolvedValue(mockReserva);
      prisma.verificacionInventario.create.mockResolvedValue({
        id: 1,
        tipo: 'CHECK_IN',
        estadoGeneral: 'CONFORME',
      });
      prisma.reserva.update.mockResolvedValue({ ...mockReserva, estado: 'EN_USO' });

      const dto = {
        observacionesGenerales: 'Todo en orden al ingresar',
        items: [
          {
            itemInventarioId: 1,
            estadoItem: 'PRESENTE_OPTIMO' as const,
            cantidadEncontrada: 1,
          },
        ],
      };

      const result = await service.registrarCheckIn(1, 10, dto, 'ESTUDIANTE');
      expect(result.tipo).toBe('CHECK_IN');
      expect(prisma.reserva.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'EN_USO' },
      });
    });
  });

  describe('registrarCheckOut', () => {
    const ahora = new Date();
    const mockReservaEnUso = {
      id: 1,
      usuarioId: 10,
      espacioId: 1,
      estado: 'EN_USO',
      fechaInicio: new Date(ahora.getTime() - 2 * 60 * 60 * 1000),
      fechaFin: ahora,
      espacio: { inventario: [] },
      usuario: { id: 10 },
    };

    it('debe detectar novedades y sancionar/inhabilitar al usuario automáticamente', async () => {
      prisma.reserva.findUnique.mockResolvedValue(mockReservaEnUso);
      prisma.verificacionInventario.create.mockResolvedValue({
        id: 2,
        tipo: 'CHECK_OUT',
        estadoGeneral: 'CON_NOVEDADES',
      });
      prisma.itemInventario.update.mockResolvedValue({});
      prisma.usuario.update.mockResolvedValue({});
      prisma.reserva.update.mockResolvedValue({ ...mockReservaEnUso, estado: 'FINALIZADA' });

      const dto = {
        observacionesGenerales: 'Se encontró control de TV con daño',
        items: [
          {
            itemInventarioId: 1,
            estadoItem: 'PRESENTE_DANADO' as const,
            cantidadEncontrada: 1,
            observacionNovedad: 'Botones rotos',
          },
        ],
      };

      const result = await service.registrarCheckOut(1, 10, dto, 'ESTUDIANTE');
      expect(result.tipo).toBe('CHECK_OUT');
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: expect.objectContaining({
            inhabilitadoParaReservar: true,
          }),
        }),
      );
      expect(prisma.reserva.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'FINALIZADA' },
      });
    });
  });
});
