import { z } from 'zod';

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  details?: ApiErrorDetail[];
}

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  totalPages: z.number().int().nonnegative().optional(),
});

export const ApiErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  statusCode: z.number().int(),
  error: z.string(),
  message: z.union([z.string(), z.array(z.string())]),
  timestamp: z.string(),
  path: z.string(),
  details: z.array(ApiErrorDetailSchema).optional(),
});
