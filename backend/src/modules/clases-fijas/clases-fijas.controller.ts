import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClasesFijasService } from './clases-fijas.service';
import { CreateClaseFijaDto, BulkCreateClaseFijaDto } from './dto';
import { Roles } from '../../common/decorators';

@ApiTags('Clases Fijas Semestrales')
@Controller()
export class ClasesFijasController {
  constructor(private readonly clasesFijasService: ClasesFijasService) {}

  @Get('espacios/:id/clases-fijas')
  @ApiOperation({ summary: 'Lista las clases fijas semanales asignadas a un espacio' })
  @ApiQuery({ name: 'periodoId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado de clases fijas obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  async findByEspacio(
    @Param('id', ParseIntPipe) espacioId: number,
    @Query('periodoId') periodoId?: string,
  ) {
    const parsedPeriodoId = periodoId ? parseInt(periodoId, 10) : undefined;
    return this.clasesFijasService.findByEspacio(espacioId, parsedPeriodoId);
  }

  @Post('clases-fijas')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra una clase semanal fija para un aula/espacio (Solo SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Clase fija registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o espacio/periodo inexistente' })
  @ApiResponse({ status: 409, description: 'Conflicto de horario con otra clase fija' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() dto: CreateClaseFijaDto) {
    return this.clasesFijasService.create(dto);
  }

  @Post('clases-fijas/bulk')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Carga masiva de programación académica semestral (Solo SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Programación cargada exitosamente' })
  @ApiResponse({ status: 409, description: 'Conflicto de horario en alguna clase del lote' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async bulkCreate(@Body() dto: BulkCreateClaseFijaDto) {
    return this.clasesFijasService.bulkCreate(dto);
  }

  @Delete('clases-fijas/:id')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina una asignación de clase fija (Solo SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Clase fija eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Clase fija no encontrada' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.clasesFijasService.remove(id);
  }
}
