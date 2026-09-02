import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../../schemas/api-response.schema';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'DatabaseError';
    let message = 'Error en la capa de persistencia de datos';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        error = 'ConflictError';
        const target = (exception.meta?.target as string[]) || [];
        const fieldName = Array.isArray(target) ? target.join(', ') : 'campo único';
        message = `Ya existe un registro con el mismo valor para: ${fieldName}`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        error = 'NotFoundError';
        message = (exception.meta?.cause as string) || 'El recurso solicitado no fue encontrado en la base de datos';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        error = 'ForeignKeyConstraintError';
        const field = (exception.meta?.field_name as string) || 'relación';
        message = `Violación de restricción de clave foránea en ${field}`;
        break;
      }
      case 'P2034': {
        status = HttpStatus.CONFLICT;
        error = 'SerializationConflictError';
        message = 'Conflicto de concurrencia: el recurso fue modificado simultáneamente por otra transacción. Por favor reintente.';
        break;
      }
      default: {
        this.logger.error(`Prisma error ${exception.code}: ${exception.message}`, exception.stack);
        message = `Error en base de datos (código: ${exception.code})`;
        break;
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
