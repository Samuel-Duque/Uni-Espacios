import { createZodDto } from 'nestjs-zod';
import { SedeSchema } from '../../../schemas/espacio.schema';

export class SedeDto extends createZodDto(SedeSchema) {}
export class CreateSedeDto extends createZodDto(SedeSchema.omit({ id: true })) {}
