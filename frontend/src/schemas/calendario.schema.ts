import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const EstadoPeriodoEnum = z.enum([
  'PLANIFICACION',
  'ACTIVO',
  'FINALIZADO',
]);
export type EstadoPeriodo = z.infer<typeof EstadoPeriodoEnum>;

export const PeriodoAcademicoSchema = z
  .object({
    id: z.number().int().positive().optional(),
    codigo: z
      .string()
      .trim()
      .regex(/^\d{4}-[1-2]$/, { message: 'Formato de periodo debe ser YYYY-1 o YYYY-2 (Ej: 2026-2)' }),
    fechaInicio: z.string().datetime({ message: 'Fecha de inicio en formato ISO 8601 requerida' }),
    fechaFin: z.string().datetime({ message: 'Fecha de fin en formato ISO 8601 requerida' }),
    estado: EstadoPeriodoEnum.default('PLANIFICACION'),
  })
  .refine(
    (data) => new Date(data.fechaFin) > new Date(data.fechaInicio),
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio del periodo',
      path: ['fechaFin'],
    }
  );
export type PeriodoAcademicoInput = z.infer<typeof PeriodoAcademicoSchema>;

export const CreateClaseFijaSchema = z
  .object({
    espacioId: z.number().int().positive({ message: 'ID de espacio requerido' }),
    periodoId: z.number().int().positive({ message: 'ID de periodo académico requerido' }),
    diaSemana: z
      .number()
      .int()
      .min(1, { message: 'Día de la semana: 1 (Lunes)' })
      .max(7, { message: 'Día de la semana: 7 (Domingo)' }),
    horaInicio: z
      .string()
      .regex(timeRegex, { message: 'horaInicio debe tener formato HH:mm (Ej: 08:00)' }),
    horaFin: z
      .string()
      .regex(timeRegex, { message: 'horaFin debe tener formato HH:mm (Ej: 10:00)' }),
    asignatura: z.string().trim().min(2).max(100),
    docente: z.string().trim().min(3).max(100),
    grupo: z.string().trim().max(20).optional(),
  })
  .refine(
    (data) => {
      const [hIni, mIni] = data.horaInicio.split(':').map(Number);
      const [hFin, mFin] = data.horaFin.split(':').map(Number);
      return hFin * 60 + mFin > hIni * 60 + mIni;
    },
    {
      message: 'horaFin debe ser estrictamente posterior a horaInicio',
      path: ['horaFin'],
    }
  );
export type CreateClaseFijaInput = z.infer<typeof CreateClaseFijaSchema>;

export const BulkCreateClaseFijaSchema = z.object({
  clases: z.array(CreateClaseFijaSchema).min(1, { message: 'Debe enviar al menos una clase fija' }),
});
export type BulkCreateClaseFijaInput = z.infer<typeof BulkCreateClaseFijaSchema>;
