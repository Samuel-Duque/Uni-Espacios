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
import { BloquesService } from './bloques.service';
import { CreateBloqueDto } from './dto';
import { Roles } from '../../common/decorators';

@ApiTags('Bloques Físicos')
@Controller('bloques')
export class BloquesController {
  constructor(private readonly bloquesService: BloquesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista bloques físicos, opcionalmente filtrados por sedeId' })
  @ApiQuery({ name: 'sedeId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado de bloques obtenido exitosamente' })
  async findAll(@Query('sedeId') sedeId?: string) {
    const parsedSedeId = sedeId ? parseInt(sedeId, 10) : undefined;
    return this.bloquesService.findAll(parsedSedeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene el detalle de un bloque físico por ID' })
  @ApiResponse({ status: 200, description: 'Bloque encontrado' })
  @ApiResponse({ status: 404, description: 'Bloque no encontrado' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.bloquesService.findById(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea un nuevo bloque en una sede (Solo SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Bloque creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o sede no existe' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() dto: CreateBloqueDto) {
    return this.bloquesService.create(dto);
  }
}
