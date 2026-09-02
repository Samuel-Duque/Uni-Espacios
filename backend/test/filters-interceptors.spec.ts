import { HttpException, HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from '../src/common/filters/prisma-client-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';

describe('Filtros e Interceptores Comunes', () => {
  describe('HttpExceptionFilter', () => {
    let filter: HttpExceptionFilter;

    beforeEach(() => {
      filter = new HttpExceptionFilter();
    });

    it('debe formatear correctamente una HttpException con ApiErrorResponse', () => {
      const mockStatus = jest.fn().mockReturnThis();
      const mockJson = jest.fn();
      const mockHost: any = {
        switchToHttp: () => ({
          getResponse: () => ({ status: mockStatus, json: mockJson }),
          getRequest: () => ({ url: '/api/test' }),
        }),
      };

      const exception = new HttpException('Recurso no encontrado', HttpStatus.NOT_FOUND);
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          message: 'Recurso no encontrado',
          path: '/api/test',
        }),
      );
    });
  });

  describe('PrismaClientExceptionFilter', () => {
    let filter: PrismaClientExceptionFilter;

    beforeEach(() => {
      filter = new PrismaClientExceptionFilter();
    });

    it('debe mapear el error P2002 a HTTP 409 Conflict', () => {
      const mockStatus = jest.fn().mockReturnThis();
      const mockJson = jest.fn();
      const mockHost: any = {
        switchToHttp: () => ({
          getResponse: () => ({ status: mockStatus, json: mockJson }),
          getRequest: () => ({ url: '/api/espacios' }),
        }),
      };

      const exception = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.14.0',
        meta: { target: ['codigo'] },
      });

      filter.catch(exception, mockHost);
      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 409,
          error: 'ConflictError',
        }),
      );
    });
  });

  describe('ResponseTransformInterceptor', () => {
    let interceptor: ResponseTransformInterceptor<any>;

    beforeEach(() => {
      interceptor = new ResponseTransformInterceptor();
    });

    it('debe envolver los datos retornados en la estructura ApiResponse', (done) => {
      const mockContext: any = {
        switchToHttp: () => ({
          getResponse: () => ({ statusCode: 200 }),
        }),
      };

      const mockCallHandler = {
        handle: () => of({ items: [1, 2, 3] }),
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          statusCode: 200,
          message: 'Operación realizada con éxito',
          data: { items: [1, 2, 3] },
        });
        done();
      });
    });
  });
});
