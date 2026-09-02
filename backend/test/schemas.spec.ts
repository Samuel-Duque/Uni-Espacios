import {
  RegisterSchema,
  LoginSchema,
  RolUsuarioEnum,
} from '../src/schemas/usuario.schema';
import {
  CreateEspacioSchema,
  TipoEspacioEnum,
  EstadoEspacioEnum,
  SedeSchema,
  BloqueSchema,
  EspacioFiltrosQuerySchema,
} from '../src/schemas/espacio.schema';
import {
  CreateItemInventarioSchema,
  CategoriaItemEnum,
  EstadoItemEnum,
} from '../src/schemas/inventario.schema';
import {
  PeriodoAcademicoSchema,
  CreateClaseFijaSchema,
  BulkCreateClaseFijaSchema,
} from '../src/schemas/calendario.schema';
import {
  CrearReservaSchema,
  CambiarEstadoReservaSchema,
  ConsultaDisponibilidadQuerySchema,
  EstadoReservaEnum,
} from '../src/schemas/reserva.schema';
import {
  CheckInSchema,
  CheckOutSchema,
  DetalleVerificacionItemSchema,
  TipoVerificacionEnum,
  EstadoItemVerificacionEnum,
} from '../src/schemas/verificacion.schema';

// ─── Helpers ───────────────────────────────────────────────────────────
function expectSuccess(schema: { safeParse: (d: unknown) => { success: boolean } }, data: unknown) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
}

function expectFail(schema: { safeParse: (d: unknown) => { success: boolean } }, data: unknown) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. USUARIO SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
describe('RegisterSchema', () => {
  const validRegister = {
    email: 'juan.perez@elpoli.edu.co',
    password: 'Abc$1234',
    nombreCompleto: 'Juan Pérez García',
    documentoIdentidad: '1234567890',
  };

  it('acepta un registro válido con todos los campos', () => {
    expectSuccess(RegisterSchema, validRegister);
  });

  it('acepta registro con teléfono opcional', () => {
    expectSuccess(RegisterSchema, { ...validRegister, telefono: '+573001234567' });
  });

  it('acepta correos de diversos dominios válidos para facilitar pruebas', () => {
    expectSuccess(RegisterSchema, { ...validRegister, email: 'test@gmail.com' });
    expectSuccess(RegisterSchema, { ...validRegister, email: 'admin@elpoli.edu.co' });
  });

  it('rechaza correos con formato inválido', () => {
    expectFail(RegisterSchema, { ...validRegister, email: 'no-es-un-correo' });
    expectFail(RegisterSchema, { ...validRegister, email: 'usuario@' });
  });

  it('rechaza correos vacíos', () => {
    expectFail(RegisterSchema, { ...validRegister, email: '' });
  });

  it('rechaza contraseña sin mayúscula', () => {
    expectFail(RegisterSchema, { ...validRegister, password: 'abc$1234' });
  });

  it('rechaza contraseña sin minúscula', () => {
    expectFail(RegisterSchema, { ...validRegister, password: 'ABC$1234' });
  });

  it('rechaza contraseña sin número', () => {
    expectFail(RegisterSchema, { ...validRegister, password: 'Abcdefgh$' });
  });

  it('rechaza contraseña sin carácter especial', () => {
    expectFail(RegisterSchema, { ...validRegister, password: 'Abcdefg1' });
  });

  it('rechaza contraseña menor a 8 caracteres', () => {
    expectFail(RegisterSchema, { ...validRegister, password: 'Ab$1' });
  });

  it('rechaza nombre completo menor a 3 caracteres', () => {
    expectFail(RegisterSchema, { ...validRegister, nombreCompleto: 'AB' });
  });

  it('rechaza documento de identidad menor a 6 caracteres', () => {
    expectFail(RegisterSchema, { ...validRegister, documentoIdentidad: '123' });
  });

  it('asigna rol ESTUDIANTE por defecto', () => {
    const result = RegisterSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rol).toBe('ESTUDIANTE');
    }
  });

  it('acepta roles válidos del enum', () => {
    expectSuccess(RegisterSchema, { ...validRegister, rol: 'DOCENTE' });
    expectSuccess(RegisterSchema, { ...validRegister, rol: 'SUPERADMIN' });
  });

  it('rechaza roles inválidos', () => {
    expectFail(RegisterSchema, { ...validRegister, rol: 'INVITADO' });
  });
});

describe('LoginSchema', () => {
  it('acepta login válido con cualquier formato de correo válido', () => {
    expectSuccess(LoginSchema, {
      email: 'maria.lopez@elpoli.edu.co',
      password: 'cualquier_password',
    });
    expectSuccess(LoginSchema, {
      email: 'maria.lopez@hotmail.com',
      password: 'cualquier_password',
    });
  });

  it('rechaza login con formato de correo inválido', () => {
    expectFail(LoginSchema, {
      email: 'formato-invalido',
      password: 'abc123',
    });
  });

  it('rechaza login sin contraseña', () => {
    expectFail(LoginSchema, {
      email: 'maria.lopez@elpoli.edu.co',
      password: '',
    });
  });
});

describe('RolUsuarioEnum', () => {
  it('acepta todos los roles válidos', () => {
    for (const rol of ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'GESTOR_ESPACIO', 'SUPERADMIN']) {
      expectSuccess(RolUsuarioEnum, rol);
    }
  });

  it('rechaza roles inválidos', () => {
    expectFail(RolUsuarioEnum, 'ADMIN');
    expectFail(RolUsuarioEnum, 'INVITADO');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. ESPACIO SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
describe('SedeSchema', () => {
  it('acepta una sede válida', () => {
    expectSuccess(SedeSchema, {
      nombre: 'Sede Medellín - Poblado',
      ciudad: 'Medellín',
      direccion: 'Carrera 48 No. 7-151',
    });
  });

  it('rechaza nombre menor a 3 caracteres', () => {
    expectFail(SedeSchema, { nombre: 'AB', ciudad: 'Medellín', direccion: 'Cra 48 No 7-151' });
  });
});

describe('BloqueSchema', () => {
  it('acepta un bloque válido', () => {
    expectSuccess(BloqueSchema, { sedeId: 1, codigo: 'P40' });
  });

  it('rechaza sedeId negativo', () => {
    expectFail(BloqueSchema, { sedeId: -1, codigo: 'P40' });
  });
});

describe('CreateEspacioSchema', () => {
  const validEspacio = {
    bloqueId: 1,
    identificador: 'P40-201',
    tipo: 'AULA',
    capacidad: 40,
  };

  it('acepta un espacio válido con defaults', () => {
    const result = CreateEspacioSchema.safeParse(validEspacio);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estado).toBe('ACTIVO');
      expect(result.data.permiteReservaDirecta).toBe(false);
    }
  });

  it('acepta todos los tipos de espacio del enum', () => {
    for (const tipo of ['AULA', 'LABORATORIO', 'AUDITORIO', 'DEPORTIVO', 'SALA_COMPUTO']) {
      expectSuccess(CreateEspacioSchema, { ...validEspacio, tipo });
    }
  });

  it('rechaza tipo de espacio inválido', () => {
    expectFail(CreateEspacioSchema, { ...validEspacio, tipo: 'PISCINA' });
  });

  it('rechaza capacidad negativa', () => {
    expectFail(CreateEspacioSchema, { ...validEspacio, capacidad: -5 });
  });

  it('rechaza capacidad superior a 5000', () => {
    expectFail(CreateEspacioSchema, { ...validEspacio, capacidad: 6000 });
  });

  it('rechaza identificador menor a 2 caracteres', () => {
    expectFail(CreateEspacioSchema, { ...validEspacio, identificador: 'A' });
  });
});

describe('EspacioFiltrosQuerySchema', () => {
  it('acepta filtros vacíos con defaults de paginación', () => {
    const result = EspacioFiltrosQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it('acepta filtros parciales', () => {
    expectSuccess(EspacioFiltrosQuerySchema, { tipo: 'AULA', capacidadMin: 20 });
  });

  it('coerce strings numéricos de query params', () => {
    const result = EspacioFiltrosQuerySchema.safeParse({ sedeId: '1', page: '2' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sedeId).toBe(1);
      expect(result.data.page).toBe(2);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. INVENTARIO SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
describe('CreateItemInventarioSchema', () => {
  const validItem = {
    espacioId: 1,
    codigo: 'INV-P40-TV01',
    nombre: 'Televisor Samsung 55"',
    categoria: 'TECNOLOGIA',
  };

  it('acepta un ítem válido con defaults', () => {
    const result = CreateItemInventarioSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cantidad).toBe(1);
      expect(result.data.estado).toBe('OPTIMO');
      expect(result.data.esCritico).toBe(false);
    }
  });

  it('acepta todas las categorías del enum', () => {
    for (const cat of ['TECNOLOGIA', 'MOBILIARIO', 'DEPORTIVO', 'DIDACTICO']) {
      expectSuccess(CreateItemInventarioSchema, { ...validItem, categoria: cat });
    }
  });

  it('rechaza cantidad 0', () => {
    expectFail(CreateItemInventarioSchema, { ...validItem, cantidad: 0 });
  });

  it('rechaza cantidad negativa', () => {
    expectFail(CreateItemInventarioSchema, { ...validItem, cantidad: -5 });
  });

  it('rechaza categoría inválida', () => {
    expectFail(CreateItemInventarioSchema, { ...validItem, categoria: 'ELECTRONICO' });
  });

  it('rechaza código menor a 2 caracteres', () => {
    expectFail(CreateItemInventarioSchema, { ...validItem, codigo: 'A' });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. CALENDARIO SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
describe('PeriodoAcademicoSchema', () => {
  const validPeriodo = {
    codigo: '2026-2',
    fechaInicio: '2026-07-15T00:00:00Z',
    fechaFin: '2026-11-30T23:59:59Z',
  };

  it('acepta un periodo académico válido', () => {
    expectSuccess(PeriodoAcademicoSchema, validPeriodo);
  });

  it('asigna estado PLANIFICACION por defecto', () => {
    const result = PeriodoAcademicoSchema.safeParse(validPeriodo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estado).toBe('PLANIFICACION');
    }
  });

  it('rechaza formato de código inválido (falta guion)', () => {
    expectFail(PeriodoAcademicoSchema, { ...validPeriodo, codigo: '20262' });
  });

  it('rechaza formato de código con semestre 3', () => {
    expectFail(PeriodoAcademicoSchema, { ...validPeriodo, codigo: '2026-3' });
  });

  it('rechaza fechaFin anterior a fechaInicio', () => {
    expectFail(PeriodoAcademicoSchema, {
      ...validPeriodo,
      fechaInicio: '2026-11-30T23:59:59Z',
      fechaFin: '2026-07-15T00:00:00Z',
    });
  });

  it('rechaza fechas iguales', () => {
    expectFail(PeriodoAcademicoSchema, {
      ...validPeriodo,
      fechaInicio: '2026-07-15T00:00:00Z',
      fechaFin: '2026-07-15T00:00:00Z',
    });
  });
});

describe('CreateClaseFijaSchema', () => {
  const validClase = {
    espacioId: 1,
    periodoId: 1,
    diaSemana: 1,
    horaInicio: '08:00',
    horaFin: '10:00',
    asignatura: 'Cálculo Integral',
    docente: 'Carlos Montoya',
  };

  it('acepta una clase fija válida', () => {
    expectSuccess(CreateClaseFijaSchema, validClase);
  });

  it('rechaza horaFin anterior a horaInicio', () => {
    expectFail(CreateClaseFijaSchema, {
      ...validClase,
      horaInicio: '10:00',
      horaFin: '08:00',
    });
  });

  it('rechaza horas iguales', () => {
    expectFail(CreateClaseFijaSchema, {
      ...validClase,
      horaInicio: '10:00',
      horaFin: '10:00',
    });
  });

  it('rechaza formato de hora inválido', () => {
    expectFail(CreateClaseFijaSchema, { ...validClase, horaInicio: '8:00' });
    expectFail(CreateClaseFijaSchema, { ...validClase, horaFin: '25:00' });
  });

  it('rechaza día de semana 0', () => {
    expectFail(CreateClaseFijaSchema, { ...validClase, diaSemana: 0 });
  });

  it('rechaza día de semana 8', () => {
    expectFail(CreateClaseFijaSchema, { ...validClase, diaSemana: 8 });
  });

  it('acepta todos los días de la semana (1-7)', () => {
    for (let dia = 1; dia <= 7; dia++) {
      expectSuccess(CreateClaseFijaSchema, { ...validClase, diaSemana: dia });
    }
  });
});

describe('BulkCreateClaseFijaSchema', () => {
  it('rechaza array vacío', () => {
    expectFail(BulkCreateClaseFijaSchema, { clases: [] });
  });

  it('acepta array con al menos una clase', () => {
    expectSuccess(BulkCreateClaseFijaSchema, {
      clases: [{
        espacioId: 1,
        periodoId: 1,
        diaSemana: 1,
        horaInicio: '08:00',
        horaFin: '10:00',
        asignatura: 'Física',
        docente: 'María López',
      }],
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. RESERVA SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
describe('CrearReservaSchema', () => {
  const validReserva = {
    espacioId: 1,
    fechaInicio: '2026-09-01T08:00:00Z',
    fechaFin: '2026-09-01T10:00:00Z',
    motivo: 'Reunión de proyecto final de ingeniería',
  };

  it('acepta una reserva válida (2 horas)', () => {
    expectSuccess(CrearReservaSchema, validReserva);
  });

  it('rechaza fechaFin anterior a fechaInicio', () => {
    expectFail(CrearReservaSchema, {
      ...validReserva,
      fechaInicio: '2026-09-01T10:00:00Z',
      fechaFin: '2026-09-01T08:00:00Z',
    });
  });

  it('rechaza reserva de más de 6 horas', () => {
    expectFail(CrearReservaSchema, {
      ...validReserva,
      fechaInicio: '2026-09-01T06:00:00Z',
      fechaFin: '2026-09-01T13:00:00Z',
    });
  });

  it('acepta reserva de exactamente 6 horas', () => {
    expectSuccess(CrearReservaSchema, {
      ...validReserva,
      fechaInicio: '2026-09-01T08:00:00Z',
      fechaFin: '2026-09-01T14:00:00Z',
    });
  });

  it('rechaza motivo menor a 5 caracteres', () => {
    expectFail(CrearReservaSchema, { ...validReserva, motivo: 'Test' });
  });

  it('rechaza motivo mayor a 300 caracteres', () => {
    expectFail(CrearReservaSchema, { ...validReserva, motivo: 'A'.repeat(301) });
  });

  it('rechaza fechas en formato no ISO 8601', () => {
    expectFail(CrearReservaSchema, {
      ...validReserva,
      fechaInicio: '01/09/2026 08:00',
    });
  });
});

describe('CambiarEstadoReservaSchema', () => {
  it('acepta aprobación sin observaciones', () => {
    expectSuccess(CambiarEstadoReservaSchema, { estado: 'APROBADA' });
  });

  it('acepta cancelación sin observaciones', () => {
    expectSuccess(CambiarEstadoReservaSchema, { estado: 'CANCELADA' });
  });

  it('acepta rechazo con observaciones de al menos 5 caracteres', () => {
    expectSuccess(CambiarEstadoReservaSchema, {
      estado: 'RECHAZADA',
      observaciones: 'No hay disponibilidad del espacio',
    });
  });

  it('rechaza rechazo sin observaciones', () => {
    expectFail(CambiarEstadoReservaSchema, { estado: 'RECHAZADA' });
  });

  it('rechaza rechazo con observaciones menores a 5 caracteres', () => {
    expectFail(CambiarEstadoReservaSchema, {
      estado: 'RECHAZADA',
      observaciones: 'No',
    });
  });

  it('rechaza estados no permitidos (PENDIENTE, EN_USO, FINALIZADA)', () => {
    expectFail(CambiarEstadoReservaSchema, { estado: 'PENDIENTE' });
    expectFail(CambiarEstadoReservaSchema, { estado: 'EN_USO' });
    expectFail(CambiarEstadoReservaSchema, { estado: 'FINALIZADA' });
  });
});

describe('ConsultaDisponibilidadQuerySchema', () => {
  it('acepta formato YYYY-MM-DD', () => {
    expectSuccess(ConsultaDisponibilidadQuerySchema, { fecha: '2026-09-01' });
  });

  it('rechaza formato inválido', () => {
    expectFail(ConsultaDisponibilidadQuerySchema, { fecha: '01-09-2026' });
    expectFail(ConsultaDisponibilidadQuerySchema, { fecha: '2026/09/01' });
  });
});

describe('EstadoReservaEnum', () => {
  it('acepta todos los estados válidos', () => {
    for (const e of ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA', 'EN_USO', 'FINALIZADA']) {
      expectSuccess(EstadoReservaEnum, e);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. VERIFICACIÓN SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
describe('DetalleVerificacionItemSchema', () => {
  it('acepta un detalle válido', () => {
    expectSuccess(DetalleVerificacionItemSchema, {
      itemInventarioId: 1,
      estadoItem: 'PRESENTE_OPTIMO',
      cantidadEncontrada: 1,
    });
  });

  it('rechaza cantidad negativa', () => {
    expectFail(DetalleVerificacionItemSchema, {
      itemInventarioId: 1,
      estadoItem: 'PRESENTE_OPTIMO',
      cantidadEncontrada: -1,
    });
  });

  it('acepta cantidad 0 (faltante)', () => {
    expectSuccess(DetalleVerificacionItemSchema, {
      itemInventarioId: 1,
      estadoItem: 'FALTANTE',
      cantidadEncontrada: 0,
    });
  });

  it('acepta todos los estados de verificación de ítem', () => {
    for (const e of ['PRESENTE_OPTIMO', 'PRESENTE_DANADO', 'FALTANTE']) {
      expectSuccess(EstadoItemVerificacionEnum, e);
    }
  });
});

describe('CheckInSchema', () => {
  const validCheckIn = {
    items: [
      { itemInventarioId: 1, estadoItem: 'PRESENTE_OPTIMO', cantidadEncontrada: 1 },
      { itemInventarioId: 2, estadoItem: 'PRESENTE_DANADO', cantidadEncontrada: 1, observacionNovedad: 'Pantalla rayada' },
    ],
  };

  it('acepta check-in válido con múltiples ítems', () => {
    expectSuccess(CheckInSchema, validCheckIn);
  });

  it('acepta check-in con observaciones generales', () => {
    expectSuccess(CheckInSchema, {
      ...validCheckIn,
      observacionesGenerales: 'Espacio en buen estado general',
    });
  });

  it('rechaza check-in sin ítems', () => {
    expectFail(CheckInSchema, { items: [] });
  });
});

describe('CheckOutSchema', () => {
  it('acepta check-out válido', () => {
    expectSuccess(CheckOutSchema, {
      items: [
        { itemInventarioId: 1, estadoItem: 'PRESENTE_OPTIMO', cantidadEncontrada: 1 },
      ],
    });
  });

  it('rechaza check-out sin ítems', () => {
    expectFail(CheckOutSchema, { items: [] });
  });
});

describe('TipoVerificacionEnum', () => {
  it('acepta CHECK_IN y CHECK_OUT', () => {
    expectSuccess(TipoVerificacionEnum, 'CHECK_IN');
    expectSuccess(TipoVerificacionEnum, 'CHECK_OUT');
  });

  it('rechaza valores inválidos', () => {
    expectFail(TipoVerificacionEnum, 'INGRESO');
  });
});
