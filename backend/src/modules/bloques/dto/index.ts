import { createZodDto } from 'nestjs-zod';
import { BloqueSchema } from '../../../schemas/espacio.schema';

export class BloqueDto extends createZodDto(BloqueSchema) {}
export class CreateBloqueDto extends createZodDto(BloqueSchema.omit({ id: true })) {}
