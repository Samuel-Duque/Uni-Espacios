// backend/test/unit/disponibilidad.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DisponibilidadService } from '../../src/modules/disponibilidad/disponibilidad.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('DisponibilidadService - Pruebas Unitarias de Colisión', () => {
  let service: DisponibilidadService;
  let prisma: PrismaService;

  const mockTx: any = {
    espacio: { findUnique: jest.fn() },
    periodoAcademico: { findFirst: jest.fn() },
    claseFija: { findFirst: jest.fn() },
    reserva: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisponibilidadService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<DisponibilidadService>(DisponibilidadService);
  });

  it('debe lanzar ConflictException si existe solapamiento con una Clase Fija activa', async () => {
    mockTx.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
    mockTx.periodoAcademico.findFirst.mockResolvedValue({ id: 10, estado: 'ACTIVO' });
    mockTx.claseFija.findFirst.mockResolvedValue({
      id: 5,
      asignatura: 'Física I',
      horaInicio: '08:00',
      horaFin: '10:00',
    });

    const tIni = new Date('2026-09-07T08:30:00Z');
    const tFin = new Date('2026-09-07T09:30:00Z');

    await expect(
      service.validarDisponibilidadTx(mockTx, 1, tIni, tFin),
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar ConflictException si existe una reserva previa APROBADA en el intervalo', async () => {
    mockTx.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
    mockTx.periodoAcademico.findFirst.mockResolvedValue(null);
    mockTx.reserva.findFirst.mockResolvedValue({
      id: 20,
      fechaInicio: new Date('2026-09-07T14:00:00Z'),
      fechaFin: new Date('2026-09-07T16:00:00Z'),
      estado: 'APROBADA',
    });

    const tIni = new Date('2026-09-07T15:00:00Z');
    const tFin = new Date('2026-09-07T17:00:00Z');

    await expect(
      service.validarDisponibilidadTx(mockTx, 1, tIni, tFin),
    ).rejects.toThrow(ConflictException);
  });

  it('debe permitir la reserva si el horario no colisiona con clases ni reservas', async () => {
    mockTx.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
    mockTx.periodoAcademico.findFirst.mockResolvedValue(null);
    mockTx.reserva.findFirst.mockResolvedValue(null);

    const tIni = new Date('2026-09-07T18:00:00Z');
    const tFin = new Date('2026-09-07T20:00:00Z');

    await expect(
      service.validarDisponibilidadTx(mockTx, 1, tIni, tFin),
    ).resolves.not.toThrow();
  });
});
