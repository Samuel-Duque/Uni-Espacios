import { createZodDto } from 'nestjs-zod';
import { PeriodoAcademicoSchema } from '../../../schemas/calendario.schema';

export class PeriodoAcademicoDto extends createZodDto(PeriodoAcademicoSchema) {}
export class CreatePeriodoAcademicoDto extends createZodDto(PeriodoAcademicoSchema) {}
