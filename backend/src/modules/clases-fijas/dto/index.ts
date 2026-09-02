import { createZodDto } from 'nestjs-zod';
import {
  CreateClaseFijaSchema,
  BulkCreateClaseFijaSchema,
} from '../../../schemas/calendario.schema';

export class CreateClaseFijaDto extends createZodDto(CreateClaseFijaSchema) {}
export class BulkCreateClaseFijaDto extends createZodDto(BulkCreateClaseFijaSchema) {}
