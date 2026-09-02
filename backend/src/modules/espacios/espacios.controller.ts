import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EspaciosService } from './espacios.service';
import { CreateEspacioDto, UpdateEspacioDto, EspacioFiltrosQueryDto } from './dto';
import { Roles } from '../../common/decorators';

@ApiTags('Espacios Físicos')
@Controller('espacios')
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Get()
  @ApiOperation({ summary: 'Catálogo de espacios con filtros facetados y paginación' })
  @ApiResponse({ status: 200, description: 'Catálogo de espacios obtenido exitosamente' })
  async findAll(@Query() query: EspacioFiltrosQueryDto) {
    return this.espaciosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene la ficha técnica completa del espacio con inventario' })
  @ApiResponse({ status: 200, description: 'Ficha técnica del espacio encontrada' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.espaciosService.findById(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra un nuevo espacio físico (Solo SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Espacio creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o bloque inexistente' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() dto: CreateEspacioDto) {
    return this.espaciosService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza datos, aforo o estado de un espacio físico (Solo SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Espacio actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspacioDto,
  ) {
    return this.espaciosService.update(id, dto);
  }
}
