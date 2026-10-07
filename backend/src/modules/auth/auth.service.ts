import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { Usuario } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  RegisterInput,
  LoginInput,
  UsuarioResponse,
} from "../../schemas/usuario.schema";
import { JwtPayload } from "../../common/decorators/current-user.decorator";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // TSK-1001: getters que fallan en startup si la variable no está definida
  private get accessSecret(): string {
    const secret = this.configService.get<string>("JWT_ACCESS_SECRET");
    if (!secret) {
      throw new Error(
        "JWT_ACCESS_SECRET no está definido en las variables de entorno. Revisa el archivo .env",
      );
    }
    return secret;
  }

  private get refreshSecret(): string {
    const secret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!secret) {
      throw new Error(
        "JWT_REFRESH_SECRET no está definido en las variables de entorno. Revisa el archivo .env",
      );
    }
    return secret;
  }

  async register(dto: RegisterInput) {
    const emailNormalizado = dto.email.trim().toLowerCase();

    // 1. Validar dominio institucional obligatorio @elpoli.edu.co
    if (!emailNormalizado.endsWith("@elpoli.edu.co")) {
      throw new BadRequestException(
        "El registro solo está permitido para correos institucionales (@elpoli.edu.co)",
      );
    }

    // 2. Verificar existencia previa
    const existe = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });
    if (existe) {
      throw new ConflictException(
        "Ya existe un usuario registrado con este correo electrónico",
      );
    }

    // 3. Hashear contraseña
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. Crear usuario
    // TSK-1002: el rol se fija siempre en ESTUDIANTE.
    // La elevación de roles es exclusiva de SUPERADMIN vía PATCH /api/usuarios/:id.
    const usuario = await this.prisma.usuario.create({
      data: {
        email: emailNormalizado,
        passwordHash,
        nombreCompleto: dto.nombreCompleto.trim(),
        documentoIdentidad: dto.documentoIdentidad.trim(),
        telefono: dto.telefono?.trim() || null,
        rol: "ESTUDIANTE",
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
      throw new UnauthorizedException("Credenciales de acceso inválidas");
    }

    if (!usuario.activo) {
      throw new UnauthorizedException(
        "Su cuenta institucional se encuentra inactiva",
      );
    }

    const passwordValido = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );
    if (!passwordValido) {
      throw new UnauthorizedException("Credenciales de acceso inválidas");
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
      throw new UnauthorizedException(
        "Token de actualización no proporcionado",
      );
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        "Token de actualización inválido o expirado",
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    if (!usuario || !usuario.activo || !usuario.refreshTokenHash) {
      throw new UnauthorizedException("Sesión no válida o revocada");
    }

    const hashValido = await bcrypt.compare(
      refreshToken,
      usuario.refreshTokenHash,
    );
    if (!hashValido) {
      throw new UnauthorizedException("Token de actualización revocado");
    }

    // TSK-1004: Refresh Token Rotation — se genera un nuevo par completo.
    // El refresh token anterior queda inválido de inmediato al actualizar el hash en BD.
    const tokens = await this.generateTokens(usuario);
    await this.updateRefreshTokenHash(usuario.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      usuario: this.formatUserResponse(usuario),
    };
  }

  async logout(usuarioId: number) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refreshTokenHash: null },
    });
    return { message: "Sesión cerrada exitosamente" };
  }

  async getMe(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException("Usuario no encontrado");
    }

    return this.formatUserResponse(usuario);
  }

  // TSK-1008: tipo explícito — recibe Usuario de Prisma, devuelve UsuarioResponse tipado
  private generateTokens(
    usuario: Pick<Usuario, "id" | "email" | "rol" | "nombreCompleto">,
  ) {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombreCompleto: usuario.nombreCompleto,
    };

    return Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: "15m",
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: "7d",
      }),
    ]).then(([accessToken, refreshToken]) => ({ accessToken, refreshToken }));
  }

  private async updateRefreshTokenHash(
    usuarioId: number,
    refreshToken: string,
  ) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refreshTokenHash: hash },
    });
  }

  // TSK-1008: tipado explícito con el modelo Prisma — elimina el `any`
  private formatUserResponse(usuario: Usuario): UsuarioResponse {
    return {
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      documentoIdentidad: usuario.documentoIdentidad,
      telefono: usuario.telefono ?? null,
      activo: usuario.activo,
      inhabilitadoParaReservar: usuario.inhabilitadoParaReservar,
      motivoInhabilitacion: usuario.motivoInhabilitacion ?? null,
      creadoEn: usuario.creadoEn.toISOString(),
      actualizadoEn: usuario.actualizadoEn.toISOString(),
    };
  }
}
