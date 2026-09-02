import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Usuarios Institucionales')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles('SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos los usuarios registrados (Solo SUPERADMIN)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos exitosamente' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usuariosService.findAll({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene el detalle de un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findById(id);
  }

  @Patch(':id/inhabilitar')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inhabilita a un usuario para solicitar reservas' })
  @ApiResponse({ status: 200, description: 'Usuario inhabilitado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async inhabilitar(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @CurrentUser('sub') gestorId: number,
  ) {
    return this.usuariosService.inhabilitar(
      id,
      motivo || 'Inhabilitación manual administrativa',
      gestorId,
    );
  }

  @Patch(':id/rehabilitar')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remueve la sanción y rehabilita a un usuario para reservar' })
  @ApiResponse({ status: 200, description: 'Usuario rehabilitado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async rehabilitar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') gestorId: number,
  ) {
    return this.usuariosService.rehabilitar(id, gestorId);
  }
}
