import { Module } from '@nestjs/common';
import { PeriodosAcademicosService } from './periodos-academicos.service';
import { PeriodosAcademicosController } from './periodos-academicos.controller';

@Module({
  controllers: [PeriodosAcademicosController],
  providers: [PeriodosAcademicosService],
  exports: [PeriodosAcademicosService],
})
export class PeriodosAcademicosModule {}
