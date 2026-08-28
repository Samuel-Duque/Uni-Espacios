import { createZodDto } from 'nestjs-zod';
import {
  CreateItemInventarioSchema,
  UpdateItemInventarioSchema,
  ItemInventarioResponseSchema,
} from '../../../schemas/inventario.schema';

export class CreateItemInventarioDto extends createZodDto(CreateItemInventarioSchema) {}
export class UpdateItemInventarioDto extends createZodDto(UpdateItemInventarioSchema) {}
export class ItemInventarioResponseDto extends createZodDto(ItemInventarioResponseSchema) {}
