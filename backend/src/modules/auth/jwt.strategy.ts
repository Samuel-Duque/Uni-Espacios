import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayload } from "../../common/decorators/current-user.decorator";

interface CachedUser {
  id: number;
  email: string;
  rol: any;
  nombreCompleto: string;
  activo: boolean;
  timestamp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  // M-09: Caché en memoria con TTL de 30s para evitar SELECT usuario en cada request
  private readonly userCache = new Map<number, CachedUser>();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>("JWT_ACCESS_SECRET");
    if (!secret) {
      throw new Error(
        "JWT_ACCESS_SECRET no está definido en las variables de entorno. Revisa el archivo .env",
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const cached = this.userCache.get(payload.sub);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      if (!cached.activo) {
        throw new UnauthorizedException(
          "Usuario no existe o se encuentra inactivo",
        );
      }
      return {
        sub: cached.id,
        email: cached.email,
        rol: cached.rol,
        nombreCompleto: cached.nombreCompleto,
      };
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        rol: true,
        nombreCompleto: true,
        activo: true,
        inhabilitadoParaReservar: true,
      },
    });

    if (!user || !user.activo) {
      this.userCache.delete(payload.sub);
      throw new UnauthorizedException(
        "Usuario no existe o se encuentra inactivo",
      );
    }

    this.userCache.set(user.id, {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombreCompleto: user.nombreCompleto,
      activo: user.activo,
      timestamp: now,
    });

    return {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      nombreCompleto: user.nombreCompleto,
    };
  }
}
