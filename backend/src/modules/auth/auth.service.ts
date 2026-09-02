import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterInput, LoginInput } from '../../schemas/usuario.schema';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get accessSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'uni_espacios_jwt_super_access_secret_2026_default'
    );
  }

  private get refreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'uni_espacios_jwt_super_refresh_secret_2026_default'
    );
  }

  async register(dto: RegisterInput) {
    const emailNormalizado = dto.email.trim().toLowerCase();

    // 1. Validar dominio institucional obligatorio @elpoli.edu.co
    if (!emailNormalizado.endsWith('@elpoli.edu.co')) {
      throw new BadRequestException(
        'El registro solo está permitido para correos institucionales (@elpoli.edu.co)',
      );
    }

    // 2. Verificar existencia previa
    const existe = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });
    if (existe) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    // 3. Hashear contraseña
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. Crear usuario
    const usuario = await this.prisma.usuario.create({
      data: {
        email: emailNormalizado,
        passwordHash,
        nombreCompleto: dto.nombreCompleto.trim(),
        documentoIdentidad: dto.documentoIdentidad.trim(),
        telefono: dto.telefono?.trim() || null,
        rol: dto.rol || 'ESTUDIANTE',
      },
    });

    // 5. Generar tokens
    const tokens = await this.generateTokens(usuario);
    await this.updateRefreshTokenHash(usuario.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      usuario: this.formatUserResponse(usuario),
    };
  }

  async login(dto: LoginInput) {
    const emailNormalizado = dto.email.trim().toLowerCase();

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales de acceso inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Su cuenta institucional se encuentra inactiva');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales de acceso inválidas');
    }

    const tokens = await this.generateTokens(usuario);
    await this.updateRefreshTokenHash(usuario.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      usuario: this.formatUserResponse(usuario),
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Token de actualización no proporcionado');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Token de actualización inválido o expirado');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    if (!usuario || !usuario.activo || !usuario.refreshTokenHash) {
      throw new UnauthorizedException('Sesión no válida o revocada');
    }

    const hashValido = await bcrypt.compare(refreshToken, usuario.refreshTokenHash);
    if (!hashValido) {
      throw new UnauthorizedException('Token de actualización revocado');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombreCompleto: usuario.nombreCompleto,
      },
      {
        secret: this.accessSecret,
        expiresIn: '15m',
      },
    );

    return {
      accessToken,
      usuario: this.formatUserResponse(usuario),
    };
  }

  async logout(usuarioId: number) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refreshTokenHash: null },
    });
    return { message: 'Sesión cerrada exitosamente' };
  }

  async getMe(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.formatUserResponse(usuario);
  }

  private async generateTokens(usuario: {
    id: number;
    email: string;
    rol: any;
    nombreCompleto: string;
  }) {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombreCompleto: usuario.nombreCompleto,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(usuarioId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refreshTokenHash: hash },
    });
  }

  private formatUserResponse(usuario: any) {
    return {
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      documentoIdentidad: usuario.documentoIdentidad,
      telefono: usuario.telefono,
      activo: usuario.activo,
      inhabilitadoParaReservar: usuario.inhabilitadoParaReservar,
      motivoInhabilitacion: usuario.motivoInhabilitacion,
      creadoEn: usuario.creadoEn instanceof Date ? usuario.creadoEn.toISOString() : usuario.creadoEn,
      actualizadoEn:
        usuario.actualizadoEn instanceof Date
          ? usuario.actualizadoEn.toISOString()
          : usuario.actualizadoEn,
    };
  }
}
