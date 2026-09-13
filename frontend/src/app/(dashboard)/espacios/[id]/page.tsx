// frontend/src/app/(dashboard)/espacios/[id]/page.tsx
'use client';

import React, { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Users,
  MapPin,
  Calendar,
  Layers,
  Info,
  Loader2,
  ArrowLeft,
  CalendarCheck,
  Package,
  BookOpen,
  Clock,
} from 'lucide-react';
import { espaciosApi, clasesFijasApi } from '../../../../lib/api';
import { EspacioInventarioTab } from '../../../../components/inventario/espacio-inventario-tab';
import { AvailabilityGrid } from '../../../../components/availability/availability-grid';

interface EspacioDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EspacioDetailPage({ params }: EspacioDetailPageProps) {
  const resolvedParams = use(params);
  const espacioId = parseInt(resolvedParams.id, 10);
  const [activeTab, setActiveTab] = useState<'DISPONIBILIDAD' | 'INVENTARIO' | 'CLASES_FIJAS'>('DISPONIBILIDAD');

  const {
    data: espacio,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['espacio-detalle', espacioId],
    queryFn: () => espaciosApi.getById(espacioId),
    enabled: !isNaN(espacioId),
  });

  const { data: clasesFijas = [] } = useQuery({
    queryKey: ['clases-fijas-espacio', espacioId],
    queryFn: () => clasesFijasApi.getByEspacio(espacioId),
    enabled: !isNaN(espacioId) && activeTab === 'CLASES_FIJAS',
  });

  if (isNaN(espacioId)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-sm font-semibold text-rose-600">ID de espacio inválido.</p>
        <Link href="/catalogo" className="mt-4 inline-block text-xs font-bold text-emerald-700 underline">
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const diasSemanaMap: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
  };

  const nombreEspacio = espacio?.identificador || espacio?.nombre || `Espacio #${espacioId}`;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Botón Volver */}
      <div>
        <Link
          href="/catalogo"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver al Catálogo de Espacios</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
          <span className="text-xs font-semibold">Cargando ficha del espacio #{espacioId}...</span>
        </div>
      ) : error || !espacio ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
          Error al cargar la información del espacio físico.
        </div>
      ) : (
        <>
          {/* Header del Espacio */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {espacio.tipo}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Código #{espacio.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      espacio.estado === 'ACTIVO'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {espacio.estado}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
                  {nombreEspacio}
                </h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 mt-3">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    <span>
                      Bloque {espacio.bloque?.codigo} ({espacio.bloque?.nombre || 'General'}) — Sede{' '}
                      {espacio.bloque?.sede?.nombre || 'Poblado'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Aforo: <strong>{espacio.capacidad} personas</strong></span>
                  </div>

                  {espacio.piso !== null && espacio.piso !== undefined && (
                    <div className="flex items-center space-x-1.5">
                      <Layers className="h-4 w-4 text-slate-400" />
                      <span>Piso: <strong>{espacio.piso}</strong></span>
                    </div>
                  )}
                </div>

                {espacio.ubicacionDetalle && (
                  <p className="text-xs text-slate-600 mt-2 italic">
                    {espacio.ubicacionDetalle}
                  </p>
                )}
              </div>

              {/* Botón de Reserva Directa */}
              <div className="shrink-0">
                <Link
                  href={`/reservas/nueva?espacioId=${espacio.id}`}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-700/20 transition-all active:scale-95"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Solicitar Reserva para este Espacio</span>
                </Link>
              </div>
            </div>

            {/* Pestañas de Navegación de la Ficha */}
            <div className="flex rounded-xl bg-slate-100 p-1 mt-6 border border-slate-200/80 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('DISPONIBILIDAD')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'DISPONIBILIDAD'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-4 w-4 text-emerald-700" />
                <span>Disponibilidad Horaria</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('INVENTARIO')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'INVENTARIO'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="h-4 w-4 text-emerald-700" />
                <span>Inventario y Equipamiento</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CLASES_FIJAS')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'CLASES_FIJAS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="h-4 w-4 text-emerald-700" />
                <span>Clases Fijas Semestrales</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Disponibilidad Horaria (TSK-505) */}
          {activeTab === 'DISPONIBILIDAD' && (
            <AvailabilityGrid
              espacioId={espacio.id}
              espacioIdentificador={nombreEspacio}
            />
          )}

          {/* TAB 2: Inventario Asignado (TSK-701) */}
          {activeTab === 'INVENTARIO' && (
            <EspacioInventarioTab
              espacioId={espacio.id}
              espacioNombre={nombreEspacio}
            />
          )}

          {/* TAB 3: Clases Fijas Semestrales */}
          {activeTab === 'CLASES_FIJAS' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Horario de Clases Fijas Recurrentes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asignaturas académicas fijadas semanalmente para el periodo activo.
                  </p>
                </div>
              </div>

              {clasesFijas.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Sin clases fijas programadas</p>
                  <p className="mt-0.5">Este espacio no tiene carga académica recurrente asignada.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {clasesFijas.map((clase: any) => (
                    <div
                      key={clase.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-rose-100 text-rose-800">
                            {diasSemanaMap[clase.diaSemana] || `Día ${clase.diaSemana}`}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {clase.asignatura}
                          </span>
                          {clase.grupo && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                              Grupo {clase.grupo}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600">
                          Docente: <strong>{clase.docente}</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {clase.horaInicio} - {clase.horaFin}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
