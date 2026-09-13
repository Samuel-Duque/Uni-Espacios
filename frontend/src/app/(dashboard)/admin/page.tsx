// frontend/src/app/(dashboard)/admin/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Layers,
  MapPin,
  Clock,
} from 'lucide-react';
import { useSedes, usePeriodosAcademicos } from '../../../hooks/use-infraestructura';
import { useEspacios } from '../../../hooks/use-espacios';

export default function AdminHubPage() {
  const { data: sedes = [] } = useSedes();
  const { data: periodos = [] } = usePeriodosAcademicos();
  const { data: espaciosData } = useEspacios({ limit: 1 });

  const periodoActivo = periodos.find((p: any) => p.estado === 'ACTIVO');

  const adminModules = [
    {
      title: 'Sedes y Bloques Físicos',
      description:
        'Administra las sedes institucionales (Poblado, Rionegro, etc.) y la estructura de bloques físicos.',
      href: '/admin/sedes',
      icon: Building2,
      badge: `${sedes.length} sede(s) registrada(s)`,
      gradient: 'from-emerald-700 to-emerald-950',
    },
    {
      title: 'Calendario y Periodos Académicos',
      description:
        'Gestiona semestres académicos (2026-1, 2026-2), estados de vigencia y activación atómica.',
      href: '/admin/periodos',
      icon: CalendarDays,
      badge: periodoActivo ? `Activo: ${periodoActivo.codigo}` : 'Sin periodo activo',
      gradient: 'from-blue-700 to-slate-900',
    },
    {
      title: 'Clases Fijas Semestrales',
      description:
        'Programa clases recurrentes semanales por aula y periodo para alimentar el motor anti-colisiones.',
      href: '/admin/clases-fijas',
      icon: BookOpen,
      badge: 'Carga Semanal Recurrente',
      gradient: 'from-purple-700 to-indigo-950',
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Institucional SuperAdmin */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Panel de Administración Global
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Gestión de infraestructura física, calendario semestral y programación de clases fijas.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Módulos de Administración */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-lg hover:border-emerald-400 transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${mod.gradient} text-white shadow-xs`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {mod.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Acceder al Módulo</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Resumen del Sistema */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Estado del Entorno Institucional
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-base text-slate-900">{sedes.length} Sedes</span>
              <p className="text-[11px] text-slate-500">Sede Principal Poblado activa</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <CalendarDays className="h-8 w-8 text-blue-700 shrink-0" />
            <div>
              <span className="font-bold text-base text-slate-900">
                Periodo {periodoActivo ? periodoActivo.codigo : 'No Asignado'}
              </span>
              <p className="text-[11px] text-slate-500">
                {periodoActivo ? 'Vigente para reservas' : 'Configura un periodo activo'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <Layers className="h-8 w-8 text-purple-700 shrink-0" />
            <div>
              <span className="font-bold text-base text-slate-900">
                {espaciosData?.meta?.total || 0} Espacios
              </span>
              <p className="text-[11px] text-slate-500">Aulas, laboratorios y auditorios</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
