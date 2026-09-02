'use client';

import React, { use } from 'react';
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
  CheckCircle2,
} from 'lucide-react';
import { espaciosApi } from '../../../../lib/api';
import { EspacioInventarioTab } from '../../../../components/inventario/espacio-inventario-tab';

interface EspacioDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EspacioDetailPage({ params }: EspacioDetailPageProps) {
  const resolvedParams = use(params);
  const espacioId = parseInt(resolvedParams.id, 10);

  const {
    data: espacio,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['espacio-detalle', espacioId],
    queryFn: () => espaciosApi.getById(espacioId),
    enabled: !isNaN(espacioId),
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {espacio.tipo}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Código #{espacio.id}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
                  {espacio.nombre}
                </h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 mt-3">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    <span>
                      Bloque {espacio.bloque?.codigo} ({espacio.bloque?.nombre}) — Sede{' '}
                      {espacio.bloque?.sede?.nombre}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Aforo: <strong>{espacio.capacidad} personas</strong></span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span>Estado: <strong>{espacio.estado}</strong></span>
                  </div>
                </div>

                {espacio.descripcion && (
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed max-w-3xl">
                    {espacio.descripcion}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tab de Inventario Asignado (TSK-701) */}
          <EspacioInventarioTab espacioId={espacio.id} espacioNombre={espacio.nombre} />
        </>
      )}
    </div>
  );
}
