import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  const mockUser = {
    id: 1,
    email: 'test@elpoli.edu.co',
    passwordHash: '$2b$10$hashedpassword',
    nombreCompleto: 'Usuario Prueba',
    rol: 'ESTUDIANTE',
    documentoIdentidad: '12345678',
    telefono: '3001234567',
    activo: true,
    inhabilitadoParaReservar: false,
    motivoInhabilitacion: null,
    refreshTokenHash: '$2b$10$hashedrefresh',
    creadoEn: new Date('2026-09-01T00:00:00.000Z'),
    actualizadoEn: new Date('2026-09-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockImplementation((payload) => Promise.resolve(`token_${payload.sub}`)),
      sign: jest.fn().mockReturnValue('new_access_token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret_12345';
              if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret_12345';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('debe rechazar correos que no pertenezcan al dominio @elpoli.edu.co', async () => {
      const dto = {
        email: 'usuario@gmail.com',
        password: 'Password123!',
        nombreCompleto: 'Usuario Externo',
        documentoIdentidad: '12345678',
        rol: 'ESTUDIANTE' as const,
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar registro si el correo ya existe (409 Conflict)', async () => {
      prisma.usuario.findUnique.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@elpoli.edu.co',
        password: 'Password123!',
        nombreCompleto: 'Usuario Repetido',
        documentoIdentidad: '12345678',
        rol: 'ESTUDIANTE' as const,
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('debe registrar exitosamente con correo @elpoli.edu.co y retornar tokens', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue(mockUser);
      prisma.usuario.update.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@elpoli.edu.co',
        password: 'Password123!',
        nombreCompleto: 'Usuario Prueba',
        documentoIdentidad: '12345678',
        rol: 'ESTUDIANTE' as const,
      };

      const result = await service.register(dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.usuario.email).toBe('test@elpoli.edu.co');
      expect(prisma.usuario.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('debe fallar con 401 si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'inexistente@elpoli.edu.co', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe fallar con 401 si el usuario está inactivo', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ ...mockUser, activo: false });

      await expect(
        service.login({ email: 'test@elpoli.edu.co', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe autenticar exitosamente si las credenciales son correctas', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));
      prisma.usuario.findUnique.mockResolvedValue(mockUser);
      prisma.usuario.update.mockResolvedValue(mockUser);

      const result = await service.login({ email: 'test@elpoli.edu.co', password: 'Password123!' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.usuario.id).toBe(1);
    });
  });

  describe('refresh', () => {
    it('debe renovar el token si el refresh token es válido', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, email: 'test@elpoli.edu.co' });
      prisma.usuario.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));

      const result = await service.refresh('valid_refresh_token');
      expect(result).toHaveProperty('accessToken', 'new_access_token');
      expect(result.usuario.id).toBe(1);
    });
  });

  describe('logout', () => {
    it('debe limpiar el hash de refresh token del usuario', async () => {
      prisma.usuario.update.mockResolvedValue({ ...mockUser, refreshTokenHash: null });

      const result = await service.logout(1);
      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshTokenHash: null },
      });
    });
  });
});
