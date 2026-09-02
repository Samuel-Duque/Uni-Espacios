import {
  PrismaClient,
  RolUsuario,
  TipoEspacio,
  EstadoEspacio,
  CategoriaItem,
  EstadoItem,
  EstadoPeriodo,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando script de Seed de Uni-Espacios (Sede Medellín - El Poblado)...');

  // ----------------------------------------------------
  // 1. USUARIOS SEMILLA
  // ----------------------------------------------------
  const defaultPassword = await bcrypt.hash('Poli2026*!', 10);

  const usuariosData = [
    {
      email: 'admin@elpoli.edu.co',
      nombreCompleto: 'Administrador General del Sistema',
      documentoIdentidad: '1000000001',
      telefono: '+573001000001',
      rol: RolUsuario.SUPERADMIN,
      passwordHash: defaultPassword,
    },
    {
      email: 'gestor.ingenieria@elpoli.edu.co',
      nombreCompleto: 'Ing. Carlos Restrepo (Gestor de Espacios)',
      documentoIdentidad: '1000000002',
      telefono: '+573001000002',
      rol: RolUsuario.GESTOR_ESPACIO,
      passwordHash: defaultPassword,
    },
    {
      email: 'docente.ciencias@elpoli.edu.co',
      nombreCompleto: 'Prof. María Victoria Gómez',
      documentoIdentidad: '1000000003',
      telefono: '+573001000003',
      rol: RolUsuario.DOCENTE,
      passwordHash: defaultPassword,
    },
    {
      email: 'estudiante.demo@elpoli.edu.co',
      nombreCompleto: 'Samuel Duque (Estudiante Demo)',
      documentoIdentidad: '1000000004',
      telefono: '+573001000004',
      rol: RolUsuario.ESTUDIANTE,
      passwordHash: defaultPassword,
    },
  ];

  for (const u of usuariosData) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        nombreCompleto: u.nombreCompleto,
        documentoIdentidad: u.documentoIdentidad,
        telefono: u.telefono,
        rol: u.rol,
        passwordHash: u.passwordHash,
        activo: true,
      },
      create: u,
    });
  }
  console.log(`✅ ${usuariosData.length} usuarios institucionales creados/actualizados.`);

  // ----------------------------------------------------
  // 2. INFRAESTRUCTURA FÍSICA: Sede Medellín (El Poblado)
  // ----------------------------------------------------
  let sedePoblado = await prisma.sede.findFirst({
    where: { nombre: 'Sede Medellín - Poblado' },
  });

  if (!sedePoblado) {
    sedePoblado = await prisma.sede.create({
      data: {
        nombre: 'Sede Medellín - Poblado',
        ciudad: 'Medellín',
        direccion: 'Carrera 48 No. 7-151, El Poblado',
      },
    });
  }
  console.log(`✅ Sede cargada: ${sedePoblado.nombre} (ID: ${sedePoblado.id})`);

  // Bloques en Sede Poblado
  const bloquesData = [
    {
      codigo: 'P40',
      descripcion: 'Bloque 40 - Facultad de Ingeniería y Ciencias Básicas',
    },
    {
      codigo: 'P19',
      descripcion: 'Bloque 19 - Centro Deportivo, Canchas y Coliseo Mayor',
    },
    {
      codigo: 'P31',
      descripcion: 'Bloque 31 - Edificio de Informática, Telemática y Posgrados',
    },
  ];

  const bloquesMap = new Map<string, number>();

  for (const b of bloquesData) {
    const bloque = await prisma.bloque.upsert({
      where: {
        sedeId_codigo: {
          sedeId: sedePoblado.id,
          codigo: b.codigo,
        },
      },
      update: { descripcion: b.descripcion },
      create: {
        sedeId: sedePoblado.id,
        codigo: b.codigo,
        descripcion: b.descripcion,
      },
    });
    bloquesMap.set(b.codigo, bloque.id);
  }
  console.log(`✅ ${bloquesData.length} bloques institucionales configurados.`);

  // ----------------------------------------------------
  // 3. ESPACIOS FÍSICOS E INVENTARIO ASOCIADO
  // ----------------------------------------------------
  interface EspacioSeed {
    bloqueCodigo: string;
    identificador: string;
    tipo: TipoEspacio;
    capacidad: number;
    piso: number;
    ubicacionDetalle: string;
    permiteReservaDirecta: boolean;
    estado: EstadoEspacio;
    items: Array<{
      codigo: string;
      nombre: string;
      categoria: CategoriaItem;
      cantidad: number;
      estado: EstadoItem;
      esCritico: boolean;
      descripcion?: string;
    }>;
  }

  const espaciosSeedData: EspacioSeed[] = [
    // Bloque P40 - AULA
    {
      bloqueCodigo: 'P40',
      identificador: 'P40-201',
      tipo: TipoEspacio.AULA,
      capacidad: 40,
      piso: 2,
      ubicacionDetalle: 'Segundo piso, ala norte, frente a escaleras principales',
      permiteReservaDirecta: false,
      estado: EstadoEspacio.ACTIVO,
      items: [
        {
          codigo: 'INV-P40-TV01',
          nombre: 'Smart TV Samsung 55" 4K UHD con soporte de pared',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
        {
          codigo: 'INV-P40-MAR01',
          nombre: 'Kit Marcadores Acrílicos Recargables (Negro, Azul, Rojo, Verde)',
          categoria: CategoriaItem.DIDACTICO,
          cantidad: 4,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
        {
          codigo: 'INV-P40-BOR01',
          nombre: 'Borrador magnético para pizarra acrílica',
          categoria: CategoriaItem.DIDACTICO,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
        {
          codigo: 'INV-P40-POD01',
          nombre: 'Podio de madera institucional para docente',
          categoria: CategoriaItem.MOBILIARIO,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
      ],
    },
    // Bloque P40 - LABORATORIO
    {
      bloqueCodigo: 'P40',
      identificador: 'P40-LAB01',
      tipo: TipoEspacio.LABORATORIO,
      capacidad: 25,
      piso: 1,
      ubicacionDetalle: 'Primer piso Bloque 40, Laboratorio de Circuitos y Electrónica',
      permiteReservaDirecta: false,
      estado: EstadoEspacio.ACTIVO,
      items: [
        {
          codigo: 'INV-P40-OSC01',
          nombre: 'Osciloscopio Digital Rigol DS1054Z 50MHz / 4 Canales',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 10,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
          descripcion: 'Equipos críticos de alta precisión para prácticas de ingeniería',
        },
        {
          codigo: 'INV-P40-MUL01',
          nombre: 'Multímetro Digital True-RMS Fluke 115',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 12,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
        },
        {
          codigo: 'INV-P40-FDC01',
          nombre: 'Fuente de Alimentación DC Regulable Triple Canal 30V/5A',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 10,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
        },
      ],
    },
    // Bloque P40 - AUDITORIO
    {
      bloqueCodigo: 'P40',
      identificador: 'AUD-P40',
      tipo: TipoEspacio.AUDITORIO,
      capacidad: 180,
      piso: 1,
      ubicacionDetalle: 'Auditorio Principal Bloque 40 (Capacidad 180 personas)',
      permiteReservaDirecta: false,
      estado: EstadoEspacio.ACTIVO,
      items: [
        {
          codigo: 'INV-P40-PROY01',
          nombre: 'Proyector Láser Epson 4K 6000 Lúmenes',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
        },
        {
          codigo: 'INV-P40-SON01',
          nombre: 'Sistema de Audio y Consola Digital Shure 16 canales',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
        },
        {
          codigo: 'INV-P40-MIC01',
          nombre: 'Kit Micrófonos Inalámbricos de Solapa y Mano Shure BLX288',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 4,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
      ],
    },
    // Bloque P19 - CANCHA SINTÉTICA (DEPORTIVO)
    {
      bloqueCodigo: 'P19',
      identificador: 'CANCHA-SINTETICA-1',
      tipo: TipoEspacio.DEPORTIVO,
      capacidad: 22,
      piso: 1,
      ubicacionDetalle: 'Zona Deportiva Exterior Bloque 19',
      permiteReservaDirecta: true,
      estado: EstadoEspacio.ACTIVO,
      items: [
        {
          codigo: 'INV-P19-BAL01',
          nombre: 'Balones de Fútbol No. 5 Golty Profesional',
          categoria: CategoriaItem.DEPORTIVO,
          cantidad: 6,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
        {
          codigo: 'INV-P19-PET01',
          nombre: 'Juego de Petos de Entrenamiento Numerados (2 Colores)',
          categoria: CategoriaItem.DEPORTIVO,
          cantidad: 20,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
        {
          codigo: 'INV-P19-CON01',
          nombre: 'Kit de Conos y Platillos de Entrenamiento',
          categoria: CategoriaItem.DEPORTIVO,
          cantidad: 15,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
      ],
    },
    // Bloque P19 - COLISEO (DEPORTIVO)
    {
      bloqueCodigo: 'P19',
      identificador: 'COLISEO-P19',
      tipo: TipoEspacio.DEPORTIVO,
      capacidad: 300,
      piso: 1,
      ubicacionDetalle: 'Coliseo Cubierto Polideportivo P19',
      permiteReservaDirecta: false,
      estado: EstadoEspacio.ACTIVO,
      items: [
        {
          codigo: 'INV-P19-MAL01',
          nombre: 'Malla Profesional de Voleibol con Postes Reglamentarios',
          categoria: CategoriaItem.DEPORTIVO,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
        },
        {
          codigo: 'INV-P19-BAS01',
          nombre: 'Balones de Baloncesto Molten GG7X No. 7',
          categoria: CategoriaItem.DEPORTIVO,
          cantidad: 8,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
        {
          codigo: 'INV-P19-TAB01',
          nombre: 'Tablero Electrónico Digital de Puntuación y Cronómetro',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
        },
      ],
    },
    // Bloque P31 - SALA DE CÓMPUTO
    {
      bloqueCodigo: 'P31',
      identificador: 'LAB-COMP-301',
      tipo: TipoEspacio.SALA_COMPUTO,
      capacidad: 35,
      piso: 3,
      ubicacionDetalle: 'Tercer piso Bloque 31, Laboratorio Avanzado de Software',
      permiteReservaDirecta: false,
      estado: EstadoEspacio.ACTIVO,
      items: [
        {
          codigo: 'INV-P31-PC01',
          nombre: 'Computadores All-in-One Dell OptiPlex Core i7 / 32GB RAM / SSD 1TB',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 35,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
          descripcion: 'Estaciones de trabajo de alto rendimiento para desarrollo y bases de datos',
        },
        {
          codigo: 'INV-P31-PROY01',
          nombre: 'Proyector Interactivo Epson WXGA de Tiro Corto',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: false,
        },
        {
          codigo: 'INV-P31-SW01',
          nombre: 'Switch Administrable Cisco Catalyst 48 Puertos Gigabit PoE',
          categoria: CategoriaItem.TECNOLOGIA,
          cantidad: 1,
          estado: EstadoItem.OPTIMO,
          esCritico: true,
        },
      ],
    },
  ];

  const espaciosMap = new Map<string, number>();

  for (const esp of espaciosSeedData) {
    const bloqueId = bloquesMap.get(esp.bloqueCodigo);
    if (!bloqueId) continue;

    const espacio = await prisma.espacio.upsert({
      where: {
        bloqueId_identificador: {
          bloqueId,
          identificador: esp.identificador,
        },
      },
      update: {
        tipo: esp.tipo,
        capacidad: esp.capacidad,
        piso: esp.piso,
        ubicacionDetalle: esp.ubicacionDetalle,
        permiteReservaDirecta: esp.permiteReservaDirecta,
        estado: esp.estado,
      },
      create: {
        bloqueId,
        identificador: esp.identificador,
        tipo: esp.tipo,
        capacidad: esp.capacidad,
        piso: esp.piso,
        ubicacionDetalle: esp.ubicacionDetalle,
        permiteReservaDirecta: esp.permiteReservaDirecta,
        estado: esp.estado,
      },
    });

    espaciosMap.set(esp.identificador, espacio.id);

    // Items de inventario para este espacio
    for (const item of esp.items) {
      await prisma.itemInventario.upsert({
        where: {
          espacioId_codigo: {
            espacioId: espacio.id,
            codigo: item.codigo,
          },
        },
        update: {
          nombre: item.nombre,
          categoria: item.categoria,
          cantidad: item.cantidad,
          estado: item.estado,
          esCritico: item.esCritico,
          descripcion: item.descripcion,
        },
        create: {
          espacioId: espacio.id,
          codigo: item.codigo,
          nombre: item.nombre,
          categoria: item.categoria,
          cantidad: item.cantidad,
          estado: item.estado,
          esCritico: item.esCritico,
          descripcion: item.descripcion,
        },
      });
    }
  }
  console.log(`✅ ${espaciosSeedData.length} espacios y sus catálogos de inventario configurados.`);

  // ----------------------------------------------------
  // 4. CALENDARIO ACADÉMICO Y CLASES FIJAS
  // ----------------------------------------------------
  const periodoActivo = await prisma.periodoAcademico.upsert({
    where: { codigo: '2026-2' },
    update: {
      fechaInicio: new Date('2026-08-01T00:00:00.000Z'),
      fechaFin: new Date('2026-12-15T23:59:59.000Z'),
      estado: EstadoPeriodo.ACTIVO,
    },
    create: {
      codigo: '2026-2',
      fechaInicio: new Date('2026-08-01T00:00:00.000Z'),
      fechaFin: new Date('2026-12-15T23:59:59.000Z'),
      estado: EstadoPeriodo.ACTIVO,
    },
  });
  console.log(`✅ Periodo Académico Semilla: ${periodoActivo.codigo} (${periodoActivo.estado})`);

  const clasesFijasData = [
    {
      espacioIdentificador: 'P40-201',
      diaSemana: 1, // Lunes
      horaInicio: '08:00',
      horaFin: '10:00',
      asignatura: 'Cálculo Integral',
      docente: 'Ing. Juan Pérez',
      grupo: '01',
    },
    {
      espacioIdentificador: 'P40-LAB01',
      diaSemana: 3, // Miércoles
      horaInicio: '14:00',
      horaFin: '16:00',
      asignatura: 'Circuitos Digitales',
      docente: 'Ing. Maria Gómez',
      grupo: '02',
    },
    {
      espacioIdentificador: 'LAB-COMP-301',
      diaSemana: 4, // Jueves
      horaInicio: '10:00',
      horaFin: '12:00',
      asignatura: 'Estructuras de Datos',
      docente: 'Carlos Maya',
      grupo: '01',
    },
  ];

  for (const cf of clasesFijasData) {
    const espacioId = espaciosMap.get(cf.espacioIdentificador);
    if (!espacioId) continue;

    // Verificar si ya existe para evitar duplicados
    const existente = await prisma.claseFija.findFirst({
      where: {
        espacioId,
        periodoId: periodoActivo.id,
        diaSemana: cf.diaSemana,
        horaInicio: cf.horaInicio,
        horaFin: cf.horaFin,
      },
    });

    if (!existente) {
      await prisma.claseFija.create({
        data: {
          espacioId,
          periodoId: periodoActivo.id,
          diaSemana: cf.diaSemana,
          horaInicio: cf.horaInicio,
          horaFin: cf.horaFin,
          asignatura: cf.asignatura,
          docente: cf.docente,
          grupo: cf.grupo,
        },
      });
    }
  }
  console.log(`✅ ${clasesFijasData.length} clases fijas recurrentes configuradas.`);

  console.log('🎉 Seed de persistencia completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
