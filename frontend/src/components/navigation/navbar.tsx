'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  ShieldAlert,
  Sliders,
  LogOut,
  UserCheck,
  AlertTriangle,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isGestor, isSuperAdmin, inhabilitadoParaReservar } = useAuth();

  const navLinks = [
    {
      name: 'Catálogo de Espacios',
      href: '/catalogo',
      icon: FolderKanban,
      show: true,
    },
    {
      name: 'Mis Reservas',
      href: '/reservas',
      icon: CalendarDays,
      show: !!user,
    },
    {
      name: 'Bandeja & Novedades',
      href: '/gestion',
      icon: ClipboardCheck,
      show: isGestor,
      badge: 'Gestor',
    },
    {
      name: 'Administración',
      href: '/admin',
      icon: Sliders,
      show: isSuperAdmin,
      badge: 'Admin',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur shadow-xs">
      {/* Banner de Usuario Inhabilitado si aplica */}
      {inhabilitadoParaReservar && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-inner">
          <div className="container mx-auto flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300 animate-pulse" />
            <span>
              <strong>Cuenta inhabilitada para reservar:</strong> {user?.motivoInhabilitacion || 'Novedad de inventario pendiente de resolución con el Gestor de Espacios.'}
            </span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo y Branding */}
          <div className="flex items-center space-x-3">
            <Link href="/catalogo" className="flex items-center space-x-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:bg-emerald-800 transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg leading-tight tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Uni-Espacios
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                  Politécnico JIC
                </span>
              </div>
            </Link>
          </div>

          {/* Enlaces de Navegación Principal */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks
              .filter((item) => item.show)
              .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>

          {/* Perfil de Usuario y Acciones */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                    {user.nombreCompleto}
                  </span>
                  <div className="flex items-center justify-end space-x-1 text-[10px]">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {user.rol}
                    </span>
                    {inhabilitadoParaReservar && (
                      <span className="font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                        Inhabilitado
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  title="Cerrar Sesión"
                  className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
