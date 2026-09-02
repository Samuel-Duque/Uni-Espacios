import { Module } from '@nestjs/common';
import { VerificacionesService } from './verificaciones.service';
import { VerificacionesController } from './verificaciones.controller';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [VerificacionesController],
  providers: [VerificacionesService],
  exports: [VerificacionesService],
})
export class VerificacionesModule {}
