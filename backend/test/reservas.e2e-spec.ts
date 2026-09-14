import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ConflictException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ReservasController } from '../src/modules/reservas/reservas.controller';
import { ReservasService } from '../src/modules/reservas/reservas.service';
import { JwtAuthGuard, RolesGuard } from '../src/common/guards';
import { HttpExceptionFilter } from '../src/common/filters';
import { ZodValidationPipe } from 'nestjs-zod';

describe('Reservas E2E / Integration Tests (Supertest)', () => {
  let app: INestApplication;
  let reservasService: Partial<Record<keyof ReservasService, jest.Mock>>;

  const mockUser = {
    sub: 1,
    email: 'docente.ciencias@elpoli.edu.co',
    rol: 'DOCENTE',
  };

  beforeAll(async () => {
    reservasService = {
      crearReserva: jest.fn(),
      findMisReservas: jest.fn(),
      findGestion: jest.fn(),
      findById: jest.fn(),
      cancelar: jest.fn(),
      cambiarEstado: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ReservasController],
      providers: [
        {
          provide: ReservasService,
          useValue: reservasService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.use((req: any, _res: any, next: any) => {
      req.user = mockUser;
      next();
    });
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /reservas', () => {
    const validDto = {
      espacioId: 1,
      fechaInicio: '2026-10-15T10:00:00.000Z',
      fechaFin: '2026-10-15T12:00:00.000Z',
      motivo: 'Clase magistral de robótica y sensores',
      cantidadAsistentesEstimada: 30,
    };

    it('debe responder 201 Created cuando la reserva es aceptada por el motor de disponibilidad', async () => {
      const mockCreated = {
        id: 101,
        ...validDto,
        usuarioId: mockUser.sub,
        estado: 'PENDIENTE',
      };
      reservasService.crearReserva!.mockResolvedValueOnce(mockCreated);

      const response = await request(app.getHttpServer())
        .post('/reservas')
        .send(validDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(101);
      expect(response.body.estado).toBe('PENDIENTE');
      expect(reservasService.crearReserva).toHaveBeenCalledWith(
        expect.objectContaining({ espacioId: 1 }),
        mockUser.sub,
      );
    });

    it('debe responder 409 Conflict cuando existe solapamiento temporal', async () => {
      reservasService.crearReserva!.mockRejectedValueOnce(
        new ConflictException('El espacio ya cuenta con una reserva aprobada en este horario'),
      );

      const response = await request(app.getHttpServer())
        .post('/reservas')
        .send(validDto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toContain('El espacio ya cuenta con una reserva aprobada');
    });

    it('debe responder 400 Bad Request cuando faltan campos obligatorios', async () => {
      const invalidDto = {
        motivo: 'Faltan fechas y espacioId',
      };

      const response = await request(app.getHttpServer())
        .post('/reservas')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('GET /reservas/mis-reservas', () => {
    it('debe responder 200 OK con la lista paginada de reservas', async () => {
      const mockResult = {
        data: [{ id: 101, motivo: 'Clase robótica' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      reservasService.findMisReservas!.mockResolvedValueOnce(mockResult);

      const response = await request(app.getHttpServer())
        .get('/reservas/mis-reservas?page=1&limit=10')
        .expect(HttpStatus.OK);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });
  });

  describe('PATCH /reservas/:id/estado', () => {
    it('debe responder 200 OK al dictaminar una reserva', async () => {
      const mockUpdated = {
        id: 101,
        estado: 'APROBADA',
      };
      reservasService.cambiarEstado!.mockResolvedValueOnce(mockUpdated);

      const response = await request(app.getHttpServer())
        .patch('/reservas/101/estado')
        .send({ estado: 'APROBADA', observaciones: 'Aprobado sin observaciones' })
        .expect(HttpStatus.OK);

      expect(response.body.estado).toBe('APROBADA');
    });

    it('debe responder 409 Conflict si al momento de dictaminar surge conflicto', async () => {
      reservasService.cambiarEstado!.mockRejectedValueOnce(
        new ConflictException('Conflicto de concurrencia: el estado del horario cambió'),
      );

      const response = await request(app.getHttpServer())
        .patch('/reservas/101/estado')
        .send({ estado: 'APROBADA' })
        .expect(HttpStatus.CONFLICT);

      expect(response.body.statusCode).toBe(409);
    });
  });
});
