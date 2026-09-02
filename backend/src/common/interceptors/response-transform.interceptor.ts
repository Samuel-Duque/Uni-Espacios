import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, PaginationMeta } from '../../schemas/api-response.schema';
import { Response } from 'express';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((resData) => {
        const statusCode = response.statusCode || 200;

        // Si ya viene formateado con estructura ApiResponse
        if (
          resData &&
          typeof resData === 'object' &&
          'success' in resData &&
          resData.success === true
        ) {
          return resData;
        }

        // Si el controlador devuelve { data, meta, message }
        if (
          resData &&
          typeof resData === 'object' &&
          'data' in resData &&
          ('meta' in resData || 'message' in resData)
        ) {
          const { data, meta, message } = resData as {
            data: T;
            meta?: PaginationMeta;
            message?: string;
          };
          return {
            success: true,
            statusCode,
            message: message || 'Operación realizada con éxito',
            data,
            ...(meta ? { meta } : {}),
          };
        }

        // Envoltura estándar por defecto
        return {
          success: true,
          statusCode,
          message: 'Operación realizada con éxito',
          data: resData ?? null,
        };
      }),
    );
  }
}
