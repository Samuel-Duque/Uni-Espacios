import { createZodDto } from 'nestjs-zod';
import {
  CrearReservaSchema,
  CambiarEstadoReservaSchema,
  ConsultaDisponibilidadQuerySchema,
} from '../../../schemas/reserva.schema';

export class CrearReservaDto extends createZodDto(CrearReservaSchema) {}
export class CambiarEstadoReservaDto extends createZodDto(CambiarEstadoReservaSchema) {}
export class ConsultaDisponibilidadQueryDto extends createZodDto(ConsultaDisponibilidadQuerySchema) {}
