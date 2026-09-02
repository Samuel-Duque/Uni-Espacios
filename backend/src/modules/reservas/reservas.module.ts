import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { DisponibilidadModule } from '../disponibilidad/disponibilidad.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [DisponibilidadModule, AuditoriaModule],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
