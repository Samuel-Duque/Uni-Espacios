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

    it('debe excluir la reserva indicada al validar disponibilidad (excluirReservaId)', async () => {
      txMock.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      txMock.periodoAcademico.findFirst.mockResolvedValue(null);
      txMock.reserva.findFirst.mockResolvedValue(null);

      await service.validarDisponibilidadTx(
        txMock,
        1,
        new Date('2026-09-15T08:00:00Z'),
        new Date('2026-09-15T10:00:00Z'),
        50,
      );

      expect(txMock.reserva.findFirst).toHaveBeenCalledWith({
        where: {
          espacioId: 1,
          id: { not: 50 },
          estado: { in: ['APROBADA', 'EN_USO'] },
          fechaInicio: { lt: new Date('2026-09-15T10:00:00Z') },
          fechaFin: { gt: new Date('2026-09-15T08:00:00Z') },
        },
      });
    });
  });

  describe('calcularDisponibilidadDiaria', () => {
    it('debe lanzar NotFoundException si el espacio no existe', async () => {
      prisma.espacio.findUnique.mockResolvedValue(null);

      await expect(
        service.calcularDisponibilidadDiaria(999, '2026-09-15'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe marcar todas las franjas como ESPACIO_INACTIVO si el espacio no está ACTIVO', async () => {
      prisma.espacio.findUnique.mockResolvedValue({
        id: 1,
        identificador: 'P40-301',
        tipo: 'AULA',
        estado: 'EN_MANTENIMIENTO',
        bloque: { sede: { nombre: 'Medellín - Poblado' } },
      });
      prisma.periodoAcademico.findFirst.mockResolvedValue(null);
      prisma.reserva.findMany.mockResolvedValue([]);

      const result = await service.calcularDisponibilidadDiaria(1, '2026-09-15');
      expect(result.franjas).toHaveLength(16);
      expect(result.franjas.every((f) => !f.disponible && f.tipoBloqueo === 'ESPACIO_INACTIVO')).toBe(true);
    });

    it('debe generar las 16 franjas horarias libres entre 06:00 y 22:00 si no hay bloqueos', async () => {
      prisma.espacio.findUnique.mockResolvedValue({
        id: 1,
        identificador: 'P40-301',
        tipo: 'AULA',
        estado: 'ACTIVO',
        bloque: { sede: { nombre: 'Medellín - Poblado' } },
      });
      prisma.periodoAcademico.findFirst.mockResolvedValue(null);
      prisma.reserva.findMany.mockResolvedValue([]);

      const result = await service.calcularDisponibilidadDiaria(1, '2026-09-15');
      expect(result.franjas).toHaveLength(16);
      expect(result.franjas[0].horaInicio).toBe('06:00');
      expect(result.franjas[15].horaFin).toBe('22:00');
      expect(result.franjas.every((f) => f.disponible === true)).toBe(true);
    });

    it('debe marcar franjas bloqueadas por CLASE_FIJA y RESERVA_APROBADA correctamente', async () => {
      prisma.espacio.findUnique.mockResolvedValue({
        id: 1,
        identificador: 'P40-301',
        tipo: 'AULA',
        estado: 'ACTIVO',
        bloque: { sede: { nombre: 'Medellín - Poblado' } },
      });
      prisma.periodoAcademico.findFirst.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
      prisma.claseFija.findMany.mockResolvedValue([
        {
          id: 10,
          espacioId: 1,
          diaSemana: 2, // Martes 2026-09-15
          horaInicio: '08:00',
          horaFin: '10:00',
          asignatura: 'Estructuras de Datos',
          docente: 'Profesor X',
        },
      ]);
      prisma.reserva.findMany.mockResolvedValue([
        {
          id: 20,
          espacioId: 1,
          fechaInicio: new Date('2026-09-15T14:00:00.000Z'),
          fechaFin: new Date('2026-09-15T16:00:00.000Z'),
          motivo: 'Taller Extraordinario',
          estado: 'APROBADA',
        },
      ]);

      const result = await service.calcularDisponibilidadDiaria(1, '2026-09-15');
      expect(result.franjas).toHaveLength(16);

      // 08:00 - 09:00 y 09:00 - 10:00 deben ser CLASE_FIJA
      const franja8 = result.franjas.find((f) => f.horaInicio === '08:00');
      const franja9 = result.franjas.find((f) => f.horaInicio === '09:00');
      expect(franja8?.disponible).toBe(false);
      expect(franja8?.tipoBloqueo).toBe('CLASE_FIJA');
      expect(franja8?.descripcionBloqueo).toContain('Estructuras de Datos');
      expect(franja9?.disponible).toBe(false);
      expect(franja9?.tipoBloqueo).toBe('CLASE_FIJA');

      // 14:00 - 15:00 y 15:00 - 16:00 deben ser RESERVA_APROBADA
      const franja14 = result.franjas.find((f) => f.horaInicio === '14:00');
      const franja15 = result.franjas.find((f) => f.horaInicio === '15:00');
      expect(franja14?.disponible).toBe(false);
      expect(franja14?.tipoBloqueo).toBe('RESERVA_APROBADA');
      expect(franja14?.descripcionBloqueo).toContain('Taller Extraordinario');
      expect(franja15?.disponible).toBe(false);
      expect(franja15?.tipoBloqueo).toBe('RESERVA_APROBADA');

      // 10:00 - 11:00 debe estar disponible
      const franja10 = result.franjas.find((f) => f.horaInicio === '10:00');
      expect(franja10?.disponible).toBe(true);
      expect(franja10?.tipoBloqueo).toBe('NINGUNO');
    });
  });
});
