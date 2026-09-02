import { Module } from '@nestjs/common';
import { ClasesFijasService } from './clases-fijas.service';
import { ClasesFijasController } from './clases-fijas.controller';

@Module({
  controllers: [ClasesFijasController],
  providers: [ClasesFijasService],
  exports: [ClasesFijasService],
})
export class ClasesFijasModule {}
