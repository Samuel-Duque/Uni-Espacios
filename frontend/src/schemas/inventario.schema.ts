import { z } from 'zod';

export const CategoriaItemEnum = z.enum([
  'TECNOLOGIA',
  'MOBILIARIO',
  'DEPORTIVO',
  'DIDACTICO',
]);
export type CategoriaItem = z.infer<typeof CategoriaItemEnum>;

export const EstadoItemEnum = z.enum([
  'OPTIMO',
  'REGULAR',
  'DANADO',
  'DE_BAJA',
]);
export type EstadoItem = z.infer<typeof EstadoItemEnum>;

export const CreateItemInventarioSchema = z.object({
  espacioId: z.number().int().positive({ message: 'ID de espacio requerido' }),
  codigo: z
    .string()
    .trim()
    .min(2, { message: 'El código o placa de inventario es requerido' })
    .max(50),
  nombre: z
    .string()
    .trim()
    .min(2, { message: 'Nombre del implemento requerido' })
    .max(100),
  categoria: CategoriaItemEnum,
  cantidad: z
    .number()
    .int()
    .min(1, { message: 'La cantidad debe ser al menos 1' })
    .default(1),
  estado: EstadoItemEnum.default('OPTIMO'),
  esCritico: z.boolean().default(false),
  descripcion: z.string().trim().max(255).optional(),
});
export type CreateItemInventarioInput = z.infer<typeof CreateItemInventarioSchema>;

export const UpdateItemInventarioSchema = CreateItemInventarioSchema.partial().omit({
  espacioId: true,
});
export type UpdateItemInventarioInput = z.infer<typeof UpdateItemInventarioSchema>;

export const ItemInventarioResponseSchema = z.object({
  id: z.number().int().positive(),
  espacioId: z.number().int().positive(),
  codigo: z.string(),
  nombre: z.string(),
  categoria: CategoriaItemEnum,
  cantidad: z.number().int(),
  estado: EstadoItemEnum,
  esCritico: z.boolean(),
  descripcion: z.string().nullable().optional(),
  creadoEn: z.string().datetime(),
  actualizadoEn: z.string().datetime(),
});
export type ItemInventarioResponse = z.infer<typeof ItemInventarioResponseSchema>;
