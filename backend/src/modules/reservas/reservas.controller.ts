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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservasService } from './reservas.service';
import { CrearReservaDto, CambiarEstadoReservaDto } from './dto';
import { Roles, CurrentUser, JwtPayload } from '../../common/decorators';

@ApiTags('Reservas y Aprobaciones')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crea una solicitud puntual de reserva en estado PENDIENTE con aislamiento serializable',
  })
  @ApiResponse({ status: 201, description: 'Reserva solicitada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de reserva o duración inválida' })
  @ApiResponse({ status: 403, description: 'Usuario inhabilitado para reservar' })
  @ApiResponse({ status: 409, description: 'Conflicto de horario con clase fija o reserva previa' })
  async crearReserva(
    @Body() dto: CrearReservaDto,
    @CurrentUser('sub') usuarioId: number,
  ) {
    return this.reservasService.crearReserva(dto, usuarioId);
  }

  @Get('mis-reservas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista las reservas solicitadas por el usuario autenticado' })
  @ApiQuery({ name: 'estado', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Reservas del usuario obtenidas exitosamente' })
  async findMisReservas(
    @CurrentUser('sub') usuarioId: number,
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reservasService.findMisReservas(usuarioId, {
      estado,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('gestion')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bandeja de solicitudes de reserva para revisión y decisión de gestores',
  })
  @ApiQuery({ name: 'estado', required: false, type: String, example: 'PENDIENTE' })
  @ApiQuery({ name: 'espacioId', required: false, type: Number })
  @ApiQuery({ name: 'sedeId', required: false, type: Number })
  @ApiQuery({ name: 'bloqueId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Bandeja de gestión obtenida exitosamente' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async findGestion(
    @Query('estado') estado?: string,
    @Query('espacioId') espacioId?: string,
    @Query('sedeId') sedeId?: string,
    @Query('bloqueId') bloqueId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reservasService.findGestion({
      estado,
      espacioId: espacioId ? parseInt(espacioId, 10) : undefined,
      sedeId: sedeId ? parseInt(sedeId, 10) : undefined,
      bloqueId: bloqueId ? parseInt(bloqueId, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene el detalle completo de una reserva por ID' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.findById(id);
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela una reserva antes de su inicio' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar en el estado actual' })
  @ApiResponse({ status: 403, description: 'No autorizado para cancelar esta reserva' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservasService.cancelar(id, user.sub, user.rol);
  }

  @Patch(':id/estado')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dictamina aprobación o rechazo (justificación obligatoria) con bloqueo atómico',
  })
  @ApiResponse({ status: 200, description: 'Estado de reserva actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Transición inválida o justificación faltante' })
  @ApiResponse({ status: 409, description: 'Conflicto de solapamiento al aprobar' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoReservaDto,
    @CurrentUser('sub') gestorId: number,
  ) {
    return this.reservasService.cambiarEstado(id, dto, gestorId);
  }
}
