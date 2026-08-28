import { createZodDto } from 'nestjs-zod';
import {
  DetalleVerificacionItemSchema,
  CheckInSchema,
  CheckOutSchema,
} from '../../../schemas/verificacion.schema';

export class DetalleVerificacionItemDto extends createZodDto(DetalleVerificacionItemSchema) {}
export class CheckInDto extends createZodDto(CheckInSchema) {}
export class CheckOutDto extends createZodDto(CheckOutSchema) {}
