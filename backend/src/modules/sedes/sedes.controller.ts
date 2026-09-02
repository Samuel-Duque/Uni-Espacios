import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SedesService } from './sedes.service';
import { CreateSedeDto } from './dto';
import { Roles } from '../../common/decorators';

@ApiTags('Sedes Institucionales')
@Controller('sedes')
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas las sedes institucionales' })
  @ApiResponse({ status: 200, description: 'Listado de sedes obtenido exitosamente' })
  async findAll() {
    return this.sedesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene el detalle de una sede por ID' })
  @ApiResponse({ status: 200, description: 'Sede encontrada' })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.sedesService.findById(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea una nueva sede institucional (Solo SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Sede creada exitosamente' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() dto: CreateSedeDto) {
    return this.sedesService.create(dto);
  }
}
