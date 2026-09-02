import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VerificacionesService } from './verificaciones.service';
import { CheckInDto, CheckOutDto } from './dto';
import { Roles, CurrentUser, JwtPayload } from '../../common/decorators';

@ApiTags('Verificaciones de Inventario (Check-In / Check-Out)')
@Controller()
export class VerificacionesController {
  constructor(private readonly verificacionesService: VerificacionesService) {}

  @Post('reservas/:id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Registra el acta de Check-In dentro de la ventana horaria (T-15m a T+20m) y transiciona la reserva a EN_USO',
  })
  @ApiResponse({ status: 200, description: 'Check-In realizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Fuera de ventana horaria o estado de reserva inválido' })
  @ApiResponse({ status: 403, description: 'No autorizado para verificar esta reserva' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async registrarCheckIn(
    @Param('id', ParseIntPipe) reservaId: number,
    @Body() dto: CheckInDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificacionesService.registrarCheckIn(reservaId, user.sub, dto, user.rol);
  }

  @Post('reservas/:id/check-out')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Registra el acta de Check-Out, detecta novedades de daño/faltante, aplica sanciones y finaliza la reserva',
  })
  @ApiResponse({ status: 200, description: 'Check-Out completado exitosamente' })
  @ApiResponse({ status: 400, description: 'La reserva no está en estado EN_USO' })
  @ApiResponse({ status: 403, description: 'No autorizado para verificar esta reserva' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async registrarCheckOut(
    @Param('id', ParseIntPipe) reservaId: number,
    @Body() dto: CheckOutDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificacionesService.registrarCheckOut(reservaId, user.sub, dto, user.rol);
  }

  @Get('reservas/:id/verificaciones')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna las actas de Check-In y Check-Out con detalle ítem por ítem de una reserva',
  })
  @ApiResponse({ status: 200, description: 'Actas de verificación obtenidas exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado para consultar estas actas' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async findVerificacionesByReserva(
    @Param('id', ParseIntPipe) reservaId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificacionesService.findVerificacionesByReserva(reservaId, user.sub, user.rol);
  }

  @Get('verificaciones/novedades')
  @Roles('GESTOR_ESPACIO', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Reporte consolidado de novedades de inventario (ítems dañados o faltantes) y responsable asociado',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Reporte de novedades obtenido exitosamente' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async findNovedades(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.verificacionesService.findNovedades({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
