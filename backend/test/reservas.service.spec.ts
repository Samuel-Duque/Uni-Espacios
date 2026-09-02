import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservasService } from '../src/modules/reservas/reservas.service';
import { DisponibilidadService } from '../src/modules/disponibilidad/disponibilidad.service';
import { AuditoriaService } from '../src/modules/auditoria/auditoria.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ReservasService', () => {
  let service: ReservasService;
  let prisma: any;
  let disponibilidadService: any;
  let auditoriaService: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
      usuario: {
        findUnique: jest.fn(),
      },
      reserva: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      aprobacion: {
        create: jest.fn(),
      },
      auditoria: {
        create: jest.fn(),
      },
    };

    disponibilidadService = {
      validarDisponibilidadTx: jest.fn().mockResolvedValue(undefined),
    };

    auditoriaService = {
      registrar: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: prisma },
        { provide: DisponibilidadService, useValue: disponibilidadService },
        { provide: AuditoriaService, useValue: auditoriaService },
      ],
    }).compile();

    service = module.get<ReservasService>(ReservasService);
  });

  describe('crearReserva', () => {
    const dto = {
      espacioId: 1,
      fechaInicio: '2026-09-15T08:00:00.000Z',
      fechaFin: '2026-09-15T10:00:00.000Z',
      motivo: 'Taller de programación grupal',
      cantidadAsistentesEstimada: 25,
    };

    it('debe rechazar la reserva con 403 Forbidden si el usuario está inhabilitado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        inhabilitadoParaReservar: true,
        motivoInhabilitacion: 'Novedad pendiente por balón faltante',
      });

      await expect(service.crearReserva(dto, 1)).rejects.toThrow(ForbiddenException);
    });

    it('debe crear la reserva en estado PENDIENTE si el usuario y horario son válidos', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        inhabilitadoParaReservar: false,
      });

      const mockReservaCreada = {
        id: 100,
        ...dto,
        usuarioId: 1,
        estado: 'PENDIENTE',
      };
      prisma.reserva.create.mockResolvedValue(mockReservaCreada);

      const result = await service.crearReserva(dto, 1);
      expect(result.estado).toBe('PENDIENTE');
      expect(disponibilidadService.validarDisponibilidadTx).toHaveBeenCalled();
    });
  });

  describe('cambiarEstado', () => {
    it('debe lanzar BadRequestException si la reserva no está en estado PENDIENTE', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: 100,
        estado: 'FINALIZADA',
        espacioId: 1,
      });

      await expect(
        service.cambiarEstado(100, { estado: 'APROBADA' }, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe aprobar y validar disponibilidad si la reserva está PENDIENTE', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: 100,
        estado: 'PENDIENTE',
        espacioId: 1,
        fechaInicio: new Date('2026-09-15T08:00:00Z'),
        fechaFin: new Date('2026-09-15T10:00:00Z'),
      });
      prisma.aprobacion.create.mockResolvedValue({ id: 1 });
      prisma.reserva.update.mockResolvedValue({
        id: 100,
        estado: 'APROBADA',
      });

      const result = await service.cambiarEstado(100, { estado: 'APROBADA' }, 5);
      expect(result.estado).toBe('APROBADA');
      expect(disponibilidadService.validarDisponibilidadTx).toHaveBeenCalled();
    });

    it('debe rechazar una reserva PENDIENTE sin validar disponibilidad', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: 100,
        estado: 'PENDIENTE',
        espacioId: 1,
      });
      prisma.aprobacion.create.mockResolvedValue({ id: 1 });
      prisma.reserva.update.mockResolvedValue({
        id: 100,
        estado: 'RECHAZADA',
      });

      const result = await service.cambiarEstado(
        100,
        { estado: 'RECHAZADA', observaciones: 'Espacio requerido para evento institucional' },
        5,
      );
      expect(result.estado).toBe('RECHAZADA');
      expect(disponibilidadService.validarDisponibilidadTx).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si ocurre un error de concurrencia P2034', async () => {
      prisma.$transaction.mockRejectedValue({ code: 'P2034' });

      await expect(
        service.cambiarEstado(100, { estado: 'APROBADA' }, 5),
      ).rejects.toThrow('Conflicto de concurrencia');
    });
  });

  describe('cancelar', () => {
    it('debe permitir cancelar la reserva al usuario propietario', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: 100,
        usuarioId: 1,
        estado: 'PENDIENTE',
      });
      prisma.reserva.update.mockResolvedValue({
        id: 100,
        estado: 'CANCELADA',
      });

      const result = await service.cancelar(100, 1, 'ESTUDIANTE');
      expect(result.estado).toBe('CANCELADA');
    });

    it('debe permitir a un SUPERADMIN cancelar la reserva de cualquier usuario', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: 100,
        usuarioId: 99,
        estado: 'APROBADA',
      });
      prisma.reserva.update.mockResolvedValue({
        id: 100,
        estado: 'CANCELADA',
      });

      const result = await service.cancelar(100, 1, 'SUPERADMIN');
      expect(result.estado).toBe('CANCELADA');
    });

    it('debe lanzar ForbiddenException si otro usuario no admin intenta cancelar', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: 100,
        usuarioId: 99,
        estado: 'PENDIENTE',
      });

      await expect(service.cancelar(100, 1, 'DOCENTE')).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si la reserva ya está CANCELADA o FINALIZADA', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: 100,
        usuarioId: 1,
        estado: 'FINALIZADA',
      });

      await expect(service.cancelar(100, 1, 'ESTUDIANTE')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById & queries', () => {
    it('debe lanzar NotFoundException si la reserva no existe', async () => {
      prisma.reserva.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar la reserva con sus relaciones si existe', async () => {
      const mockReserva = {
        id: 100,
        espacioId: 1,
        usuarioId: 1,
        estado: 'APROBADA',
      };
      prisma.reserva.findUnique.mockResolvedValue(mockReserva);

      const result = await service.findById(100);
      expect(result.id).toBe(100);
    });

    it('debe paginar y retornar reservas en findMisReservas', async () => {
      prisma.reserva.count.mockResolvedValue(1);
      prisma.reserva.findMany.mockResolvedValue([{ id: 100 }]);

      const result = await service.findMisReservas(1, { page: 1, limit: 10 });
      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('debe paginar y filtrar reservas en findGestion', async () => {
      prisma.reserva.count.mockResolvedValue(2);
      prisma.reserva.findMany.mockResolvedValue([{ id: 100 }, { id: 101 }]);

      const result = await service.findGestion({ sedeId: 1, page: 1, limit: 10 });
      expect(result.meta.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });
  });
});
