import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DisponibilidadService } from '../src/modules/disponibilidad/disponibilidad.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('DisponibilidadService', () => {
  let service: DisponibilidadService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      espacio: {
        findUnique: jest.fn(),
      },
      periodoAcademico: {
        findFirst: jest.fn(),
      },
      claseFija: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      reserva: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisponibilidadService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DisponibilidadService>(DisponibilidadService);
  });

  describe('validarDisponibilidadTx', () => {
    const txMock: any = {
      espacio: { findUnique: jest.fn() },
      periodoAcademico: { findFirst: jest.fn() },
      claseFija: { findFirst: jest.fn() },
      reserva: { findFirst: jest.fn() },
    };

    it('debe lanzar NotFoundException si el espacio no existe', async () => {
      txMock.espacio.findUnique.mockResolvedValue(null);

      await expect(
        service.validarDisponibilidadTx(
          txMock,
          999,
          new Date('2026-09-15T08:00:00Z'),
          new Date('2026-09-15T10:00:00Z'),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el espacio no está ACTIVO', async () => {
      txMock.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'EN_MANTENIMIENTO' });

      await expect(
        service.validarDisponibilidadTx(
          txMock,
          1,
          new Date('2026-09-15T08:00:00Z'),
          new Date('2026-09-15T10:00:00Z'),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si colisiona con una clase fija académica', async () => {
      txMock.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      txMock.periodoAcademico.findFirst.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      txMock.claseFija.findFirst.mockResolvedValue({
        id: 1,
        asignatura: 'Cálculo Diferencial',
        horaInicio: '08:00',
        horaFin: '10:00',
      });

      await expect(
        service.validarDisponibilidadTx(
          txMock,
          1,
          new Date('2026-09-15T08:00:00Z'),
          new Date('2026-09-15T10:00:00Z'),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si colisiona con una reserva aprobada', async () => {
      txMock.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      txMock.periodoAcademico.findFirst.mockResolvedValue(null);
      txMock.reserva.findFirst.mockResolvedValue({
        id: 10,
        fechaInicio: new Date('2026-09-15T08:00:00Z'),
        fechaFin: new Date('2026-09-15T10:00:00Z'),
      });

      await expect(
        service.validarDisponibilidadTx(
          txMock,
          1,
          new Date('2026-09-15T08:00:00Z'),
          new Date('2026-09-15T10:00:00Z'),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe pasar exitosamente si el espacio está libre y activo', async () => {
      txMock.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      txMock.periodoAcademico.findFirst.mockResolvedValue(null);
      txMock.reserva.findFirst.mockResolvedValue(null);

      await expect(
        service.validarDisponibilidadTx(
          txMock,
          1,
          new Date('2026-09-15T08:00:00Z'),
          new Date('2026-09-15T10:00:00Z'),
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('calcularDisponibilidadDiaria', () => {
    it('debe generar las 16 franjas horarias entre 06:00 y 22:00', async () => {
      prisma.espacio.findUnique.mockResolvedValue({
        id: 1,
        identificador: 'P40-301',
        tipo: 'AULA',
        estado: 'ACTIVO',
      });
      prisma.periodoAcademico.findFirst.mockResolvedValue(null);
      prisma.reserva.findMany.mockResolvedValue([]);

      const result = await service.calcularDisponibilidadDiaria(1, '2026-09-15');
      expect(result.franjas).toHaveLength(16);
      expect(result.franjas[0].horaInicio).toBe('06:00');
      expect(result.franjas[15].horaFin).toBe('22:00');
      expect(result.franjas.every((f) => f.disponible === true)).toBe(true);
    });
  });
});
