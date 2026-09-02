'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import { LoginSchema, LoginInput } from '../../../schemas/usuario.schema';
import { useAuth } from '../../../lib/auth-context';
import { ApiError } from '../../../lib/api';

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMessage(null);
    try {
      await login(data);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error al iniciar sesión. Verifique sus credenciales.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Institucional */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-600/20">
            <Building2 className="h-9 w-9" />
          </div>
        </div>

        <h2 className="mt-5 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Uni-Espacios
        </h2>
        <p className="mt-1 text-center text-sm text-emerald-800 font-medium">
          Politécnico Jaime Isaza Cadavid
        </p>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sistema de Gestión, Reserva de Espacios Físicos y Control de Inventario
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Iniciar Sesión</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa con tu cuenta de correo institucional autorizada
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2">
              <span className="font-semibold">⚠️</span>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {callbackUrl && (
            <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
              <span>🔒</span>
              <span>Debes iniciar sesión para acceder a este recurso.</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Campo Email Institucional */}
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
                  placeholder="ejemplo@elpoli.edu.co"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-slate-200 text-slate-900 focus:ring-emerald-600 focus:border-emerald-600'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 py-2.5 sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-slate-200 text-slate-900 focus:ring-emerald-600 focus:border-emerald-600'
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
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Validando credenciales...
                  </>
                ) : (
                  <>
                    Acceder al Sistema
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Links y pie */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col space-y-3">
            <div className="text-center text-xs text-slate-600">
              ¿No tienes una cuenta institucional?{' '}
              <Link
                href="/register"
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
              >
                Regístrate aquí
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
              Acceso restringido a comunidad académica activa con correo <strong>@elpoli.edu.co</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
