import { z } from 'zod';

export const TipoVerificacionEnum = z.enum(['CHECK_IN', 'CHECK_OUT']);
export type TipoVerificacion = z.infer<typeof TipoVerificacionEnum>;

export const EstadoGeneralVerificacionEnum = z.enum([
  'CONFORME',
  'NO_CONFORME',
  'CON_NOVEDADES',
]);
export type EstadoGeneralVerificacion = z.infer<typeof EstadoGeneralVerificacionEnum>;

export const EstadoItemVerificacionEnum = z.enum([
  'PRESENTE_OPTIMO',
  'PRESENTE_DANADO',
  'FALTANTE',
]);
export type EstadoItemVerificacion = z.infer<typeof EstadoItemVerificacionEnum>;

export const DetalleVerificacionItemSchema = z.object({
  itemInventarioId: z.number().int().positive({ message: 'ID de implemento requerido' }),
  estadoItem: EstadoItemVerificacionEnum,
  cantidadEncontrada: z
    .number()
    .int()
    .min(0, { message: 'La cantidad encontrada no puede ser negativa' }),
  observacionNovedad: z.string().trim().max(300).optional(),
});
export type DetalleVerificacionItemInput = z.infer<typeof DetalleVerificacionItemSchema>;

export const CheckInSchema = z.object({
  observacionesGenerales: z.string().trim().max(500).optional(),
  items: z
    .array(DetalleVerificacionItemSchema)
    .min(1, { message: 'Debe verificar al menos un ítem del inventario del espacio' }),
});
export type CheckInInput = z.infer<typeof CheckInSchema>;

export const CheckOutSchema = z.object({
  observacionesGenerales: z.string().trim().max(500).optional(),
  items: z
    .array(DetalleVerificacionItemSchema)
    .min(1, { message: 'Debe verificar al menos un ítem del inventario para la entrega' }),
});
export type CheckOutInput = z.infer<typeof CheckOutSchema>;
