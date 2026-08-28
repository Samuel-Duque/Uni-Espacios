import { createZodDto } from 'nestjs-zod';
import {
  PeriodoAcademicoSchema,
  CreateClaseFijaSchema,
  BulkCreateClaseFijaSchema,
} from '../../../schemas/calendario.schema';

export class PeriodoAcademicoDto extends createZodDto(PeriodoAcademicoSchema) {}
export class CreateClaseFijaDto extends createZodDto(CreateClaseFijaSchema) {}
export class BulkCreateClaseFijaDto extends createZodDto(BulkCreateClaseFijaSchema) {}
