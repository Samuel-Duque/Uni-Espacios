'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Resolver, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CreditCard,
  Phone,
  GraduationCap,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { RegisterSchema, RegisterInput } from '../../../schemas/usuario.schema';
import { useAuth } from '../../../lib/auth-context';
import { ApiError } from '../../../lib/api';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema) as unknown as Resolver<RegisterInput>,
    defaultValues: {
      nombreCompleto: '',
      documentoIdentidad: '',
      email: '',
      telefono: '',
      rol: 'ESTUDIANTE',
      password: '',
    },
  });

  const currentPassword = useWatch({ control, name: 'password' }) || '';

  const hasUpper = /[A-Z]/.test(currentPassword);
  const hasLower = /[a-z]/.test(currentPassword);
  const hasNumber = /[0-9]/.test(currentPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(currentPassword);
  const hasMinLength = currentPassword.length >= 8;

  const onSubmit = async (data: RegisterInput) => {
    setErrorMessage(null);
    try {
      await registerUser(data);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error al registrar usuario. Verifique los datos ingresados.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Logo Institucional */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-600/20">
            <Building2 className="h-8 w-8" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Registro Institucional
        </h2>
        <p className="mt-1 text-center text-sm text-emerald-800 font-medium">
          Politécnico Jaime Isaza Cadavid
        </p>
        <p className="mt-1 text-center text-xs text-slate-500">
          Crea tu cuenta institucional para solicitar y gestionar reservas de espacios
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2">
              <span className="font-semibold">⚠️</span>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Nombre Completo */}
            <div>
              <label
                htmlFor="nombreCompleto"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Nombre Completo
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="nombreCompleto"
                  type="text"
                  placeholder="Ej: Laura Gómez Cardona"
                  {...register('nombreCompleto')}
                  className={`block w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors outline-none focus:ring-2 ${
                    errors.nombreCompleto
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500'
                      : 'border-slate-200 text-slate-900 focus:ring-emerald-600'
                  }`}
                />
              </div>
              {errors.nombreCompleto && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.nombreCompleto.message}
                </p>
              )}
            </div>

            {/* Fila: Documento y Rol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="documentoIdentidad"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Documento de Identidad
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <input
                    id="documentoIdentidad"
                    type="text"
                    placeholder="Ej: 1020304050"
                    {...register('documentoIdentidad')}
                    className={`block w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors outline-none focus:ring-2 ${
                      errors.documentoIdentidad
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500'
                        : 'border-slate-200 text-slate-900 focus:ring-emerald-600'
                    }`}
                  />
                </div>
                {errors.documentoIdentidad && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.documentoIdentidad.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="rol"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Rol Institucional
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <select
                    id="rol"
                    {...register('rol')}
                    className="block w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 transition-colors outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="ESTUDIANTE">Estudiante</option>
                    <option value="DOCENTE">Docente</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                  </select>
                </div>
                {errors.rol && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.rol.message}
                  </p>
                )}
              </div>
            </div>

            {/* Fila: Correo y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Correo Institucional
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="usuario@elpoli.edu.co"
                    autoComplete="email"
                    {...register('email')}
                    className={`block w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500'
                        : 'border-slate-200 text-slate-900 focus:ring-emerald-600'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Teléfono / Celular
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="telefono"
                    type="tel"
                    placeholder="+573001234567"
                    {...register('telefono')}
                    className={`block w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors outline-none focus:ring-2 ${
                      errors.telefono
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500'
                        : 'border-slate-200 text-slate-900 focus:ring-emerald-600'
                    }`}
                  />
                </div>
                {errors.telefono && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.telefono.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 py-2 text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500'
                      : 'border-slate-200 text-slate-900 focus:ring-emerald-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.password.message}
                </p>
              )}

              {/* Indicadores visuales de requisitos de contraseña */}
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] grid grid-cols-2 gap-1 text-slate-600">
                <div className={hasMinLength ? 'text-emerald-700 font-medium' : ''}>
                  {hasMinLength ? '✓' : '○'} Mínimo 8 caracteres
                </div>
                <div className={hasUpper ? 'text-emerald-700 font-medium' : ''}>
                  {hasUpper ? '✓' : '○'} Una mayúscula (A-Z)
                </div>
                <div className={hasLower ? 'text-emerald-700 font-medium' : ''}>
                  {hasLower ? '✓' : '○'} Una minúscula (a-z)
                </div>
                <div className={hasNumber ? 'text-emerald-700 font-medium' : ''}>
                  {hasNumber ? '✓' : '○'} Un número (0-9)
                </div>
                <div className={`col-span-2 ${hasSpecial ? 'text-emerald-700 font-medium' : ''}`}>
                  {hasSpecial ? '✓' : '○'} Un carácter especial (@, $, !, %, *, ?, &)
                </div>
              </div>
            </div>

            {/* Botón Registrarse */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Registrando cuenta...
                  </>
                ) : (
                  <>
                    Crear Cuenta Institucional
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Links y pie */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col space-y-3">
            <div className="text-center text-xs text-slate-600">
              ¿Ya tienes una cuenta institucional?{' '}
              <Link
                href="/login"
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
              >
                Inicia sesión aquí
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/catalogo"
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Explorar Catálogo de Espacios
              </Link>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>
              Registro exclusivo con correo institucional <strong>@elpoli.edu.co</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
