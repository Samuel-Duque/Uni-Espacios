import { z } from 'zod';

export const EstadoReservaEnum = z.enum([
  'PENDIENTE',
  'APROBADA',
  'RECHAZADA',
  'CANCELADA',
  'EN_USO',
  'FINALIZADA',
]);
export type EstadoReserva = z.infer<typeof EstadoReservaEnum>;

export const CrearReservaSchema = z
  .object({
    espacioId: z.number().int().positive({ message: 'ID de espacio requerido' }),
    fechaInicio: z
      .string()
      .datetime({ message: 'fechaInicio debe ser formato ISO 8601 (Ej: 2026-09-01T08:00:00Z)' }),
    fechaFin: z
      .string()
      .datetime({ message: 'fechaFin debe ser formato ISO 8601 (Ej: 2026-09-01T10:00:00Z)' }),
    motivo: z
      .string()
      .trim()
      .min(5, { message: 'El motivo debe tener al menos 5 caracteres' })
      .max(300, { message: 'El motivo no puede superar 300 caracteres' }),
    cantidadAsistentesEstimada: z.number().int().positive().optional(),
  })
  .refine(
    (data) => new Date(data.fechaFin) > new Date(data.fechaInicio),
    {
      message: 'fechaFin debe ser posterior a fechaInicio',
      path: ['fechaFin'],
    }
  )
  .refine(
    (data) => {
      const duracionMs = new Date(data.fechaFin).getTime() - new Date(data.fechaInicio).getTime();
      const duracionHoras = duracionMs / (1000 * 60 * 60);
      return duracionHoras <= 6;
    },
    {
      message: 'La reserva no puede exceder las 6 horas de duración continua',
      path: ['fechaFin'],
    }
  );
export type CrearReservaInput = z.infer<typeof CrearReservaSchema>;

export const CambiarEstadoReservaSchema = z
  .object({
    estado: z.enum(['APROBADA', 'RECHAZADA', 'CANCELADA']),
    observaciones: z.string().trim().max(300).optional(),
  })
  .refine(
    (data) => {
      if (data.estado === 'RECHAZADA' && (!data.observaciones || data.observaciones.length < 5)) {
        return false;
      }
      return true;
    },
    {
      message: 'Es obligatorio proporcionar una justificación (mínimo 5 caracteres) al rechazar una reserva',
      path: ['observaciones'],
    }
  );
export type CambiarEstadoReservaInput = z.infer<typeof CambiarEstadoReservaSchema>;

export const ConsultaDisponibilidadQuerySchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' }),
});
export type ConsultaDisponibilidadQuery = z.infer<typeof ConsultaDisponibilidadQuerySchema>;
