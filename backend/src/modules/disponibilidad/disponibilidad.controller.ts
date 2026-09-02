import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DisponibilidadService } from './disponibilidad.service';
import { ConsultaDisponibilidadQueryDto } from './dto';

@ApiTags('Disponibilidad y Franjas Horarias')
@Controller()
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) {}

  @Get('espacios/:id/disponibilidad')
  @ApiOperation({
    summary: 'Calcula las franjas horarias del día (06:00 a 22:00) indicando disponibilidad',
  })
  @ApiQuery({ name: 'fecha', required: true, type: String, example: '2026-09-15' })
  @ApiResponse({ status: 200, description: 'Rejilla horaria calculada exitosamente' })
  @ApiResponse({ status: 400, description: 'Formato de fecha inválido (debe ser YYYY-MM-DD)' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  async getDisponibilidad(
    @Param('id', ParseIntPipe) espacioId: number,
    @Query() query: ConsultaDisponibilidadQueryDto,
  ) {
    return this.disponibilidadService.calcularDisponibilidadDiaria(espacioId, query.fecha);
  }
}
