import { createZodDto } from 'nestjs-zod';
import {
  CreateEspacioSchema,
  UpdateEspacioSchema,
  EspacioFiltrosQuerySchema,
  SedeSchema,
  BloqueSchema,
} from '../../../schemas/espacio.schema';

export class CreateEspacioDto extends createZodDto(CreateEspacioSchema) {}
export class UpdateEspacioDto extends createZodDto(UpdateEspacioSchema) {}
export class EspacioFiltrosQueryDto extends createZodDto(EspacioFiltrosQuerySchema) {}
export class SedeDto extends createZodDto(SedeSchema) {}
export class BloqueDto extends createZodDto(BloqueSchema) {}
