import { z } from 'zod';

export const RolUsuarioEnum = z.enum([
  'ESTUDIANTE',
  'DOCENTE',
  'ADMINISTRATIVO',
  'GESTOR_ESPACIO',
  'SUPERADMIN',
]);
export type RolUsuario = z.infer<typeof RolUsuarioEnum>;

export const RegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Formato de correo electrónico inválido' }),
  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    .max(64, { message: 'La contraseña no puede exceder 64 caracteres' })
    .regex(/[A-Z]/, { message: 'Debe contener al menos una letra mayúscula' })
    .regex(/[a-z]/, { message: 'Debe contener al menos una letra minúscula' })
    .regex(/[0-9]/, { message: 'Debe contener al menos un número' })
    .regex(/[^A-Za-z0-9]/, {
      message: 'Debe contener al menos un carácter especial (@, $, !, %, *, ?, &)',
    }),
  nombreCompleto: z
    .string()
    .trim()
    .min(3, { message: 'El nombre completo debe tener al menos 3 caracteres' })
    .max(100, { message: 'El nombre completo no puede superar 100 caracteres' }),
  rol: RolUsuarioEnum.default('ESTUDIANTE'),
  documentoIdentidad: z
    .string()
    .trim()
    .min(6, { message: 'El documento de identidad debe tener al menos 6 caracteres' })
    .max(20, { message: 'El documento de identidad no puede superar 20 caracteres' }),
  telefono: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, { message: 'Formato de teléfono inválido' })
    .optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Formato de correo inválido' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria' }),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const UsuarioResponseSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  nombreCompleto: z.string(),
  rol: RolUsuarioEnum,
  documentoIdentidad: z.string(),
  telefono: z.string().nullable().optional(),
  activo: z.boolean(),
  inhabilitadoParaReservar: z.boolean(),
  motivoInhabilitacion: z.string().nullable().optional(),
  creadoEn: z.string().datetime(),
  actualizadoEn: z.string().datetime(),
});
export type UsuarioResponse = z.infer<typeof UsuarioResponseSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  usuario: UsuarioResponseSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
