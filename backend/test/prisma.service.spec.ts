import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import {
  RolUsuario,
  TipoEspacio,
  EstadoEspacio,
  CategoriaItem,
  EstadoItem,
  EstadoPeriodo,
  EstadoReserva,
  EstadoAprobacion,
  TipoVerificacion,
  EstadoGeneralVerificacion,
  EstadoItemVerificacion,
} from '@prisma/client';

describe('PrismaService & PrismaModule', () => {
  let prismaService: PrismaService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('debe estar definido e inyectado correctamente', () => {
    expect(prismaService).toBeDefined();
    expect(prismaService).toBeInstanceOf(PrismaService);
  });

  it('debe ejecutar $connect en onModuleInit', async () => {
    const connectSpy = jest.spyOn(prismaService, '$connect').mockImplementation(async () => {});
    await prismaService.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });

  it('debe ejecutar $disconnect en onModuleDestroy', async () => {
    const disconnectSpy = jest.spyOn(prismaService, '$disconnect').mockImplementation(async () => {});
    await prismaService.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });

  describe('Prisma Enums Domain Integrity', () => {
    it('debe contener los roles de usuario esperados', () => {
      expect(RolUsuario.ESTUDIANTE).toBe('ESTUDIANTE');
      expect(RolUsuario.DOCENTE).toBe('DOCENTE');
      expect(RolUsuario.ADMINISTRATIVO).toBe('ADMINISTRATIVO');
      expect(RolUsuario.GESTOR_ESPACIO).toBe('GESTOR_ESPACIO');
      expect(RolUsuario.SUPERADMIN).toBe('SUPERADMIN');
    });

    it('debe contener los tipos de espacio esperados', () => {
      expect(TipoEspacio.AULA).toBe('AULA');
      expect(TipoEspacio.LABORATORIO).toBe('LABORATORIO');
      expect(TipoEspacio.AUDITORIO).toBe('AUDITORIO');
      expect(TipoEspacio.DEPORTIVO).toBe('DEPORTIVO');
      expect(TipoEspacio.SALA_COMPUTO).toBe('SALA_COMPUTO');
    });

    it('debe contener los estados de espacio esperados', () => {
      expect(EstadoEspacio.ACTIVO).toBe('ACTIVO');
      expect(EstadoEspacio.EN_MANTENIMIENTO).toBe('EN_MANTENIMIENTO');
      expect(EstadoEspacio.INACTIVO).toBe('INACTIVO');
    });

    it('debe contener las categorías y estados de ítems de inventario', () => {
      expect(CategoriaItem.TECNOLOGIA).toBe('TECNOLOGIA');
      expect(CategoriaItem.MOBILIARIO).toBe('MOBILIARIO');
      expect(CategoriaItem.DEPORTIVO).toBe('DEPORTIVO');
      expect(CategoriaItem.DIDACTICO).toBe('DIDACTICO');

      expect(EstadoItem.OPTIMO).toBe('OPTIMO');
      expect(EstadoItem.REGULAR).toBe('REGULAR');
      expect(EstadoItem.DANADO).toBe('DANADO');
      expect(EstadoItem.DE_BAJA).toBe('DE_BAJA');
    });

    it('debe contener los estados de periodo académico y reservas', () => {
      expect(EstadoPeriodo.PLANIFICACION).toBe('PLANIFICACION');
      expect(EstadoPeriodo.ACTIVO).toBe('ACTIVO');
      expect(EstadoPeriodo.FINALIZADO).toBe('FINALIZADO');

      expect(EstadoReserva.PENDIENTE).toBe('PENDIENTE');
      expect(EstadoReserva.APROBADA).toBe('APROBADA');
      expect(EstadoReserva.RECHAZADA).toBe('RECHAZADA');
      expect(EstadoReserva.CANCELADA).toBe('CANCELADA');
      expect(EstadoReserva.EN_USO).toBe('EN_USO');
      expect(EstadoReserva.FINALIZADA).toBe('FINALIZADA');

      expect(EstadoAprobacion.APROBADA).toBe('APROBADA');
      expect(EstadoAprobacion.RECHAZADA).toBe('RECHAZADA');
    });

    it('debe contener los tipos y estados de verificación', () => {
      expect(TipoVerificacion.CHECK_IN).toBe('CHECK_IN');
      expect(TipoVerificacion.CHECK_OUT).toBe('CHECK_OUT');

      expect(EstadoGeneralVerificacion.CONFORME).toBe('CONFORME');
      expect(EstadoGeneralVerificacion.NO_CONFORME).toBe('NO_CONFORME');
      expect(EstadoGeneralVerificacion.CON_NOVEDADES).toBe('CON_NOVEDADES');

      expect(EstadoItemVerificacion.PRESENTE_OPTIMO).toBe('PRESENTE_OPTIMO');
      expect(EstadoItemVerificacion.PRESENTE_DANADO).toBe('PRESENTE_DANADO');
      expect(EstadoItemVerificacion.FALTANTE).toBe('FALTANTE');
    });
  });
});
