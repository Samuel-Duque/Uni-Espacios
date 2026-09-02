import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PeriodosAcademicosService } from './periodos-academicos.service';
import { PeriodoAcademicoDto } from './dto';
import { PeriodoAcademicoInput } from '../../schemas/calendario.schema';
import { Roles } from '../../common/decorators';

@ApiTags('Calendario Académico')
@Controller('periodos-academicos')
export class PeriodosAcademicosController {
  constructor(
    private readonly periodosAcademicosService: PeriodosAcademicosService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos los periodos académicos institucionales' })
  @ApiResponse({ status: 200, description: 'Listado de periodos obtenido exitosamente' })
  async findAll() {
    return this.periodosAcademicosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene el detalle de un periodo académico por ID' })
  @ApiResponse({ status: 200, description: 'Periodo académico encontrado' })
  @ApiResponse({ status: 404, description: 'Periodo académico no encontrado' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.periodosAcademicosService.findById(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra un nuevo periodo académico (Solo SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Periodo académico registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o fechas incoherentes' })
  @ApiResponse({ status: 409, description: 'Código de periodo duplicado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() dto: PeriodoAcademicoDto) {
    return this.periodosAcademicosService.create(dto as unknown as PeriodoAcademicoInput);
  }

  @Patch(':id/activar')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marca un periodo como ACTIVO y finaliza los demás periodos vigentes (Solo SUPERADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Periodo activado exitosamente' })
  @ApiResponse({ status: 404, description: 'Periodo no encontrado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async activar(@Param('id', ParseIntPipe) id: number) {
    return this.periodosAcademicosService.activar(id);
  }
}
