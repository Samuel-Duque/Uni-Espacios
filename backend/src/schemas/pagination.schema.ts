import { z } from 'zod';

/**
 * Schema reutilizable para query params de paginación.
 * Transforma strings a enteros y valida rangos.
 * Se aplica en todos los controllers que acepten ?page= y ?limit=
 */
export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined && v !== '' ? parseInt(v, 10) : 1))
    .pipe(
      z.number().int({ message: 'page debe ser un número entero' }).min(1, {
        message: 'page debe ser mayor o igual a 1',
      }),
    ),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined && v !== '' ? parseInt(v, 10) : 10))
    .pipe(
      z
        .number()
        .int({ message: 'limit debe ser un número entero' })
        .min(1, { message: 'limit debe ser mayor o igual a 1' })
        .max(100, { message: 'limit no puede exceder 100 resultados por página' }),
    ),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Parsea y valida los query params de paginación.
 * Lanza ZodError (capturado por ZodValidationPipe) si los valores son inválidos.
 */
export function parsePaginationQuery(page?: string, limit?: string): PaginationQuery {
  return PaginationQuerySchema.parse({ page, limit });
}

export const GestionReservasQuerySchema = PaginationQuerySchema.extend({
  estado: z.string().optional(),
  espacioId: z
    .string()
    .optional()
    .transform((v) => (v !== undefined && v !== '' ? parseInt(v, 10) : undefined))
    .pipe(
      z
        .number({ invalid_type_error: 'espacioId debe ser un número entero' })
        .int({ message: 'espacioId debe ser un número entero' })
        .positive({ message: 'espacioId debe ser positivo' })
        .optional(),
    ),
  sedeId: z
    .string()
    .optional()
    .transform((v) => (v !== undefined && v !== '' ? parseInt(v, 10) : undefined))
    .pipe(
      z
        .number({ invalid_type_error: 'sedeId debe ser un número entero' })
        .int({ message: 'sedeId debe ser un número entero' })
        .positive({ message: 'sedeId debe ser positivo' })
        .optional(),
    ),
  bloqueId: z
    .string()
    .optional()
    .transform((v) => (v !== undefined && v !== '' ? parseInt(v, 10) : undefined))
    .pipe(
      z
        .number({ invalid_type_error: 'bloqueId debe ser un número entero' })
        .int({ message: 'bloqueId debe ser un número entero' })
        .positive({ message: 'bloqueId debe ser positivo' })
        .optional(),
    ),
});

export type GestionReservasQuery = z.infer<typeof GestionReservasQuerySchema>;

export function parseGestionReservasQuery(query: {
  page?: string;
  limit?: string;
  estado?: string;
  espacioId?: string;
  sedeId?: string;
  bloqueId?: string;
}): GestionReservasQuery {
  return GestionReservasQuerySchema.parse(query);
}
