import { Module } from '@nestjs/common';
import { BloquesService } from './bloques.service';
import { BloquesController } from './bloques.controller';

@Module({
  controllers: [BloquesController],
  providers: [BloquesService],
  exports: [BloquesService],
})
export class BloquesModule {}
