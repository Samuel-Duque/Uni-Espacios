import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SedesModule } from './modules/sedes/sedes.module';
import { BloquesModule } from './modules/bloques/bloques.module';
import { EspaciosModule } from './modules/espacios/espacios.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { PeriodosAcademicosModule } from './modules/periodos-academicos/periodos-academicos.module';
import { ClasesFijasModule } from './modules/clases-fijas/clases-fijas.module';
import { DisponibilidadModule } from './modules/disponibilidad/disponibilidad.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { VerificacionesModule } from './modules/verificaciones/verificaciones.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import {
  ResponseTransformInterceptor,
  LoggingInterceptor,
} from './common/interceptors';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    SedesModule,
    BloquesModule,
    EspaciosModule,
    InventarioModule,
    PeriodosAcademicosModule,
    ClasesFijasModule,
    DisponibilidadModule,
    ReservasModule,
    VerificacionesModule,
    AuditoriaModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
