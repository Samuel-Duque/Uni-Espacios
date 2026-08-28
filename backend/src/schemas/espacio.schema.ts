import { z } from 'zod';

export const TipoEspacioEnum = z.enum([
  'AULA',
  'LABORATORIO',
  'AUDITORIO',
  'DEPORTIVO',
  'SALA_COMPUTO',
]);
export type TipoEspacio = z.infer<typeof TipoEspacioEnum>;

export const EstadoEspacioEnum = z.enum([
  'ACTIVO',
  'EN_MANTENIMIENTO',
  'INACTIVO',
]);
export type EstadoEspacio = z.infer<typeof EstadoEspacioEnum>;

export const SedeSchema = z.object({
  id: z.number().int().positive().optional(),
  nombre: z.string().trim().min(3).max(100),
  ciudad: z.string().trim().min(2).max(60),
  direccion: z.string().trim().min(5).max(150),
});
export type Sede = z.infer<typeof SedeSchema>;

export const BloqueSchema = z.object({
  id: z.number().int().positive().optional(),
  sedeId: z.number().int().positive({ message: 'Debe especificar una sede válida' }),
  codigo: z.string().trim().min(1).max(20),
  descripcion: z.string().trim().max(200).optional(),
});
export type Bloque = z.infer<typeof BloqueSchema>;

export const CreateEspacioSchema = z.object({
  bloqueId: z.number().int().positive({ message: 'ID de bloque requerido' }),
  identificador: z
    .string()
    .trim()
    .min(2, { message: 'El identificador debe tener al menos 2 caracteres' })
    .max(30),
  tipo: TipoEspacioEnum,
  capacidad: z
    .number()
    .int()
    .positive({ message: 'La capacidad debe ser un entero positivo' })
    .min(1)
    .max(5000),
  piso: z.number().int().optional(),
  ubicacionDetalle: z.string().trim().max(200).optional(),
  permiteReservaDirecta: z.boolean().default(false),
  estado: EstadoEspacioEnum.default('ACTIVO'),
});
export type CreateEspacioInput = z.infer<typeof CreateEspacioSchema>;

export const UpdateEspacioSchema = CreateEspacioSchema.partial();
export type UpdateEspacioInput = z.infer<typeof UpdateEspacioSchema>;

export const EspacioFiltrosQuerySchema = z.object({
  sedeId: z.coerce.number().int().positive().optional(),
  bloqueId: z.coerce.number().int().positive().optional(),
  tipo: TipoEspacioEnum.optional(),
  capacidadMin: z.coerce.number().int().min(1).optional(),
  estado: EstadoEspacioEnum.optional(),
  categoriaImplemento: z.enum(['TECNOLOGIA', 'MOBILIARIO', 'DEPORTIVO', 'DIDACTICO']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type EspacioFiltrosQuery = z.infer<typeof EspacioFiltrosQuerySchema>;
