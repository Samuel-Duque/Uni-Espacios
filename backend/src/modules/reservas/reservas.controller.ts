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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ReservasService } from "./reservas.service";
import { CrearReservaDto, CambiarEstadoReservaDto } from "./dto";
import { Roles, CurrentUser, JwtPayload } from "../../common/decorators";
import {
  parsePaginationQuery,
  parseGestionReservasQuery,
} from "../../schemas/pagination.schema";

@ApiTags("Reservas y Aprobaciones")
@Controller("reservas")
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Crea una solicitud puntual de reserva en estado PENDIENTE con aislamiento serializable",
  })
  @ApiResponse({ status: 201, description: "Reserva solicitada exitosamente" })
  @ApiResponse({
    status: 400,
    description: "Datos de reserva o duración inválida",
  })
  @ApiResponse({
    status: 403,
    description: "Usuario inhabilitado para reservar",
  })
  @ApiResponse({
    status: 409,
    description: "Conflicto de horario con clase fija o reserva previa",
  })
  async crearReserva(
    @Body() dto: CrearReservaDto,
    @CurrentUser("sub") usuarioId: number,
  ) {
    return this.reservasService.crearReserva(dto, usuarioId);
  }

  @Get("mis-reservas")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Lista las reservas solicitadas por el usuario autenticado",
  })
  @ApiQuery({ name: "estado", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: "Reservas del usuario obtenidas exitosamente",
  })
  async findMisReservas(
    @CurrentUser("sub") usuarioId: number,
    @Query("estado") estado?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    // TSK-1007: validación de paginación — NaN y valores fuera de rango devuelven 400
    const pagination = parsePaginationQuery(page, limit);
    return this.reservasService.findMisReservas(usuarioId, {
      estado,
      ...pagination,
    });
  }

  @Get("gestion")
  @Roles("GESTOR_ESPACIO", "SUPERADMIN")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Bandeja de solicitudes de reserva para revisión y decisión de gestores",
  })
  @ApiQuery({
    name: "estado",
    required: false,
    type: String,
    example: "PENDIENTE",
  })
  @ApiQuery({ name: "espacioId", required: false, type: Number })
  @ApiQuery({ name: "sedeId", required: false, type: Number })
  @ApiQuery({ name: "bloqueId", required: false, type: Number })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: "Bandeja de gestión obtenida exitosamente",
  })
  @ApiResponse({ status: 403, description: "Permisos insuficientes" })
  async findGestion(
    @Query("estado") estado?: string,
    @Query("espacioId") espacioId?: string,
    @Query("sedeId") sedeId?: string,
    @Query("bloqueId") bloqueId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    // M-06: validación estricta de todos los query params (incluyendo IDs numéricos)
    const query = parseGestionReservasQuery({
      estado,
      espacioId,
      sedeId,
      bloqueId,
      page,
      limit,
    });
    return this.reservasService.findGestion(query);
  }

  @Post("procesar-no-shows")
  @Roles("GESTOR_ESPACIO", "SUPERADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "A-04: Ejecuta la cancelación automática de reservas aprobadas con más de 20 minutos de atraso sin Check-In",
  })
  @ApiResponse({
    status: 200,
    description: "Procesamiento de No-Shows ejecutado exitosamente",
  })
  async procesarNoShows() {
    return this.reservasService.procesarNoShows();
  }

  @Get(":id")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Obtiene el detalle completo de una reserva por ID",
  })
  @ApiResponse({ status: 200, description: "Reserva encontrada" })
  @ApiResponse({ status: 404, description: "Reserva no encontrada" })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return this.reservasService.findById(id);
  }

  @Patch(":id/cancelar")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancela una reserva antes de su inicio" })
  @ApiResponse({ status: 200, description: "Reserva cancelada exitosamente" })
  @ApiResponse({
    status: 400,
    description: "No se puede cancelar en el estado actual",
  })
  @ApiResponse({
    status: 403,
    description: "No autorizado para cancelar esta reserva",
  })
  @ApiResponse({ status: 404, description: "Reserva no encontrada" })
  async cancelar(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservasService.cancelar(id, user.sub, user.rol);
  }

  @Patch(":id/estado")
  @Roles("GESTOR_ESPACIO", "SUPERADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Dictamina aprobación o rechazo (justificación obligatoria) con bloqueo atómico",
  })
  @ApiResponse({
    status: 200,
    description: "Estado de reserva actualizado exitosamente",
  })
  @ApiResponse({
    status: 400,
    description: "Transición inválida o justificación faltante",
  })
  @ApiResponse({
    status: 409,
    description: "Conflicto de solapamiento al aprobar",
  })
  @ApiResponse({ status: 403, description: "Permisos insuficientes" })
  async cambiarEstado(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoReservaDto,
    @CurrentUser("sub") gestorId: number,
  ) {
    return this.reservasService.cambiarEstado(id, dto, gestorId);
  }
}
