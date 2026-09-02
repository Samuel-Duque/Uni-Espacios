import { z } from 'zod';

export const EnvConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET debe tener al menos 16 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET debe tener al menos 16 caracteres'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = EnvConfigSchema.safeParse(config);
  if (!parsed.success) {
    console.error('❌ Error de validación en variables de entorno:', parsed.error.format());
    throw new Error('Configuración de entorno (.env) inválida');
  }
  return parsed.data;
}
