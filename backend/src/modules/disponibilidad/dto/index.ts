import { createZodDto } from 'nestjs-zod';
import { ConsultaDisponibilidadQuerySchema } from '../../../schemas/reserva.schema';

export class ConsultaDisponibilidadQueryDto extends createZodDto(
  ConsultaDisponibilidadQuerySchema,
) {}
