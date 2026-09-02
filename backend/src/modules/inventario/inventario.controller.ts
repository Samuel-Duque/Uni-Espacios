import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { CreateItemInventarioDto, UpdateItemInventarioDto } from './dto';
import { Roles } from '../../common/decorators';

@ApiTags('Inventario de Implementos')
@Controller()
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('espacios/:id/inventario')
  @ApiOperation({ summary: 'Retorna la lista de implementos asignados a un espacio físico' })
  @ApiResponse({ status: 200, description: 'Lista de inventario del espacio obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  async findByEspacio(@Param('id', ParseIntPipe) espacioId: number) {
    return this.inventarioService.findByEspacio(espacioId);
  }

  @Get('inventario/:id')
  @ApiOperation({ summary: 'Obtiene el detalle de un implemento por ID' })
  @ApiResponse({ status: 200, description: 'Implemento encontrado' })
  @ApiResponse({ status: 404, description: 'Implemento no encontrado' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.findById(id);
  }

  @Post('inventario')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra un nuevo implemento en un espacio (GESTOR_ESPACIO, SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Implemento registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o espacio inexistente' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() dto: CreateItemInventarioDto) {
    return this.inventarioService.create(dto);
  }

  @Patch('inventario/:id')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza datos, estado o cantidad de un implemento (GESTOR_ESPACIO, SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Implemento actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Implemento no encontrado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemInventarioDto,
  ) {
    return this.inventarioService.update(id, dto);
  }

  @Delete('inventario/:id')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Da de baja un implemento del inventario (Solo SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Implemento dado de baja exitosamente' })
  @ApiResponse({ status: 404, description: 'Implemento no encontrado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.remove(id);
  }
}
