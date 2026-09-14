import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ReservasService } from '../src/modules/reservas/reservas.service';
import { DisponibilidadService } from '../src/modules/disponibilidad/disponibilidad.service';
import { AuditoriaService } from '../src/modules/auditoria/auditoria.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('Pruebas de Concurrencia y Anti Double-Booking (TSK-902)', () => {
  let reservasService: ReservasService;
  let disponibilidadService: DisponibilidadService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Shared state simulating a database table
    const dbReservas: any[] = [];
    let transactionLock = Promise.resolve();

    const mockTx = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          inhabilitadoParaReservar: false,
        }),
      },
      reserva: {
        findFirst: jest.fn().mockImplementation((args) => {
          const { espacioId, id, fechaInicio, fechaFin, estado } = args.where;
          const targetFin = fechaInicio?.lt ? new Date(fechaInicio.lt) : null;
          const targetIni = fechaFin?.gt ? new Date(fechaFin.gt) : null;

          return (
            dbReservas.find((r) => {
              if (r.espacioId !== espacioId) return false;
              if (id?.not && r.id === id.not) return false;
              if (estado?.in && !estado.in.includes(r.estado)) return false;

              if (targetFin && targetIni) {
                const rIni = new Date(r.fechaInicio);
                const rFin = new Date(r.fechaFin);
                return rIni < targetFin && rFin > targetIni;
              }
              return true;
            }) || null
          );
        }),
        findUnique: jest.fn().mockImplementation((args) => {
          return dbReservas.find((r) => r.id === args.where.id) || null;
        }),
        create: jest.fn().mockImplementation((args) => {
          const nueva = {
            id: dbReservas.length + 1,
            ...args.data,
            espacio: { bloque: { sede: { nombre: 'Medellín' } } },
            usuario: { id: 1, nombreCompleto: 'Usuario Test' },
          };
          dbReservas.push(nueva);
          return nueva;
        }),
        update: jest.fn().mockImplementation((args) => {
          const idx = dbReservas.findIndex((r) => r.id === args.where.id);
          if (idx !== -1) {
            dbReservas[idx] = { ...dbReservas[idx], ...args.data };
            return dbReservas[idx];
          }
          return null;
        }),
      },
      aprobacion: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
      auditoria: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
      espacio: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, estado: 'ACTIVO' }),
      },
      periodoAcademico: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      claseFija: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    // Mock PrismaService simulating serializable atomic execution
    const mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (callback, options) => {
        expect(options?.isolationLevel).toBe(Prisma.TransactionIsolationLevel.Serializable);

        // Serialize execution of transactions like MariaDB Serializable isolation
        const currentLock = transactionLock;
        let releaseLock: () => void;
        transactionLock = new Promise<void>((resolve) => {
          releaseLock = resolve;
        });

        await currentLock;
        try {
          return await callback(mockTx);
        } finally {
          releaseLock!();
        }
      }),
      usuario: mockTx.usuario,
      reserva: mockTx.reserva,
      auditoria: mockTx.auditoria,
      espacio: mockTx.espacio,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        DisponibilidadService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    reservasService = module.get<ReservasService>(ReservasService);
    disponibilidadService = module.get<DisponibilidadService>(DisponibilidadService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('50 solicitudes simultáneas de aprobación sobre la misma franja: exactamente 1 tiene éxito (APROBADA) y 49 son rechazadas con ConflictException (409)', async () => {
    // 1. Crear 50 reservas en estado PENDIENTE para la misma franja horaria
    const fechaInicio = new Date('2026-10-15T10:00:00.000Z');
    const fechaFin = new Date('2026-10-15T12:00:00.000Z');

    const reservasCreadas = [];
    for (let i = 0; i < 50; i++) {
      const res = await reservasService.crearReserva(
        {
          espacioId: 1,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          motivo: `Solicitud concurrente #${i + 1}`,
          cantidadAsistentesEstimada: 20,
        },
        1,
      );
      reservasCreadas.push(res);
    }
    expect(reservasCreadas).toHaveLength(50);

    // 2. Ejecutar 50 solicitudes simultáneas de aprobación (Promise.all)
    const promises = reservasCreadas.map(async (r, index) => {
      try {
        const result = await reservasService.cambiarEstado(
          r.id,
          { estado: 'APROBADA', observaciones: `Aprobación #${index}` },
          99,
        );
        return { success: true, index, data: result };
      } catch (error: any) {
        return { success: false, index, error };
      }
    });

    const results = await Promise.all(promises);
    const exitosas = results.filter((r) => r.success);
    const fallidas = results.filter((r) => !r.success);

    // CRITERIO INNEGOCIABLE 1: Exactamente 1 solicitud exitosa
    expect(exitosas).toHaveLength(1);
    expect(exitosas[0]?.data?.estado).toBe('APROBADA');

    // CRITERIO INNEGOCIABLE 2: Las 49 restantes deben responder con ConflictException (HTTP 409)
    expect(fallidas).toHaveLength(49);
    for (const fallida of fallidas) {
      expect(fallida.error).toBeInstanceOf(ConflictException);
      expect(fallida.error.message).toContain('El espacio ya cuenta con una reserva aprobada');
    }
  });

  it('50 solicitudes simultáneas para un horario ya reservado: 50 son rechazadas con ConflictException (409)', async () => {
    const fechaInicio = '2026-10-15T10:00:00.000Z';
    const fechaFin = '2026-10-15T12:00:00.000Z';

    // Crear y aprobar una reserva inicial
    const inicial = await reservasService.crearReserva(
      {
        espacioId: 1,
        fechaInicio,
        fechaFin,
        motivo: 'Reserva previa ya aprobada',
      },
      1,
    );
    await reservasService.cambiarEstado(inicial.id, { estado: 'APROBADA' }, 99);

    // 50 intentos concurrentes de reservar en ese mismo horario
    const promises = Array.from({ length: 50 }).map(async (_, index) => {
      try {
        const res = await reservasService.crearReserva(
          {
            espacioId: 1,
            fechaInicio,
            fechaFin,
            motivo: `Intento #${index}`,
          },
          1,
        );
        return { success: true, res };
      } catch (error: any) {
        return { success: false, error };
      }
    });

    const results = await Promise.all(promises);
    const exitosas = results.filter((r) => r.success);
    const fallidas = results.filter((r) => !r.success);

    expect(exitosas).toHaveLength(0);
    expect(fallidas).toHaveLength(50);
    for (const f of fallidas) {
      expect(f.error).toBeInstanceOf(ConflictException);
    }
  });

  it('debe manejar error P2034 de Prisma y traducirlo a ConflictException (409)', async () => {
    const errorP2034: any = new Error('Serialization conflict');
    errorP2034.code = 'P2034';

    (prismaService.$transaction as jest.Mock).mockRejectedValueOnce(errorP2034);

    const payload = {
      espacioId: 1,
      fechaInicio: '2026-10-16T10:00:00.000Z',
      fechaFin: '2026-10-16T12:00:00.000Z',
      motivo: 'Prueba de carrera P2034',
    };

    await expect(reservasService.crearReserva(payload, 1)).rejects.toThrow(
      'Conflicto de concurrencia: el horario fue modificado por otra solicitud simultánea. Por favor reintente.',
    );
  });
});
