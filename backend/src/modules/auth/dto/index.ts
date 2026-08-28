import { createZodDto } from 'nestjs-zod';
import {
  LoginSchema,
  RegisterSchema,
  UsuarioResponseSchema,
  AuthResponseSchema,
} from '../../../schemas/usuario.schema';

export class LoginDto extends createZodDto(LoginSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class UsuarioResponseDto extends createZodDto(UsuarioResponseSchema) {}
export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}
