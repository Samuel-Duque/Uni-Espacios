import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('Guards', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(() => {
      guard = new JwtAuthGuard(reflector);
    });

    it('debe permitir acceso si la ruta tiene metadata @Public()', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const ctx = createMockContext();

      const result = guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('debe lanzar UnauthorizedException si no hay usuario en handleRequest', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
    });

    it('debe retornar el usuario si está presente en handleRequest', () => {
      const mockUser = { sub: 1, email: 'test@elpoli.edu.co', rol: 'ESTUDIANTE' };
      expect(guard.handleRequest(null, mockUser)).toEqual(mockUser);
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;

    beforeEach(() => {
      guard = new RolesGuard(reflector);
    });

    it('debe permitir acceso si la ruta no requiere roles específicos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = createMockContext({ rol: 'ESTUDIANTE' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe otorgar acceso universal a SUPERADMIN independientemente de los roles requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GESTOR_ESPACIO']);
      const ctx = createMockContext({ rol: 'SUPERADMIN' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe permitir acceso si el rol del usuario está dentro de los permitidos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['DOCENTE', 'ADMINISTRATIVO']);
      const ctx = createMockContext({ rol: 'DOCENTE' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('debe lanzar ForbiddenException si el rol no coincide', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['GESTOR_ESPACIO', 'SUPERADMIN']);
      const ctx = createMockContext({ rol: 'ESTUDIANTE' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('debe lanzar ForbiddenException si no hay usuario en la petición', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ESTUDIANTE']);
      const ctx = createMockContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
