// frontend/src/app/(dashboard)/catalogo/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Loader2, SearchX } from 'lucide-react';
import { useEspacios } from '../../../hooks/use-espacios';
import { FacetedFilters } from '../../../components/catalog/faceted-filters';
import { EspacioCard } from '../../../components/catalog/espacio-card';

function CatalogoContent() {
  const searchParams = useSearchParams();

  const queryParams: Record<string, any> = {
    sedeId: searchParams.get('sedeId') || undefined,
    bloqueId: searchParams.get('bloqueId') || undefined,
    tipo: searchParams.get('tipo') || undefined,
    categoriaImplemento: searchParams.get('categoriaImplemento') || undefined,
    capacidadMin: searchParams.get('capacidadMin') || undefined,
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') || 1,
    limit: 12,
  };

  const { data, isLoading, error } = useEspacios(queryParams);
  const espacios = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Barra de Filtros Facetados */}
      <FacetedFilters />

      {/* Grid de Espacios Físicos */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-700 mb-3" />
          <span className="text-xs font-bold text-slate-600">
            Consultando espacios físicos disponibles...
          </span>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
          Error al consultar el catálogo de espacios. Por favor intenta recargar la página.
        </div>
      ) : espacios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
          <SearchX className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No se encontraron espacios</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No hay espacios que coincidan con los filtros aplicados. Intenta ajustando o
            restableciendo los criterios de búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Mostrando <strong>{espacios.length}</strong> de <strong>{meta?.total || espacios.length}</strong> espacios registrados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {espacios.map((espacio: any) => (
              <EspacioCard key={espacio.id} espacio={espacio} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Institucional */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Catálogo Institucional de Espacios Físicos
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Explora aulas, laboratorios especializados, auditorios y escenarios deportivos
          del Politécnico JIC. Consulta su disponibilidad horaria en tiempo real y reserva de forma segura.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-24 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
            <span className="text-xs font-semibold">Cargando catálogo institucional...</span>
          </div>
        }
      >
        <CatalogoContent />
      </Suspense>
    </div>
  );
}
