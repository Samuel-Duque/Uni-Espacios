// frontend/src/components/catalog/faceted-filters.tsx
'use client';

import React, { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Building,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { useSedes, useBloques } from '../../hooks/use-infraestructura';

export function FacetedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { data: sedes = [] } = useSedes();

  // Current values from URL
  const currentSedeId = searchParams.get('sedeId') || '';
  const currentBloqueId = searchParams.get('bloqueId') || '';
  const currentTipo = searchParams.get('tipo') || '';
  const currentCategoria = searchParams.get('categoriaImplemento') || '';
  const currentCapacidad = searchParams.get('capacidadMin') || '';
  const currentSearch = searchParams.get('search') || '';

  const { data: bloques = [] } = useBloques(
    currentSedeId ? parseInt(currentSedeId, 10) : undefined,
  );

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value && value.trim() !== '') {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }

      // Reset page when filtering
      params.delete('page');

      // If sede changed, clear bloque
      if (key === 'sedeId') {
        params.delete('bloqueId');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const resetFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    !!currentSedeId ||
    !!currentBloqueId ||
    !!currentTipo ||
    !!currentCategoria ||
    !!currentCapacidad ||
    !!currentSearch;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Top Header: Búsqueda rápida y limpiar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Barra de búsqueda por texto */}
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
          <input
            type="text"
            placeholder="Buscar por identificador (ej: P40-201), bloque o detalle..."
            defaultValue={currentSearch}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600 transition-all"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={() => updateParam('search', '')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        )}
      </div>

      {/* Grid de Selectores Facetados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
        {/* Sede */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Sede
          </label>
          <select
            value={currentSedeId}
            onChange={(e) => updateParam('sedeId', e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.ciudad})
              </option>
            ))}
          </select>
        </div>

        {/* Bloque */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Bloque Físico
          </label>
          <select
            value={currentBloqueId}
            onChange={(e) => updateParam('bloqueId', e.target.value)}
            disabled={!currentSedeId && bloques.length === 0}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Todos los bloques</option>
            {bloques.map((b: any) => (
              <option key={b.id} value={b.id}>
                Bloque {b.codigo} {b.descripcion ? `— ${b.descripcion}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Espacio */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Tipo de Espacio
          </label>
          <select
            value={currentTipo}
            onChange={(e) => updateParam('tipo', e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Todos los tipos</option>
            <option value="AULA">Aula de Clase</option>
            <option value="LABORATORIO">Laboratorio</option>
            <option value="AUDITORIO">Auditorio Institucional</option>
            <option value="SALA_COMPUTO">Sala de Cómputo</option>
            <option value="DEPORTIVO">Escenario Deportivo</option>
          </select>
        </div>

        {/* Categoría de Implementos */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Implementos Requeridos
          </label>
          <select
            value={currentCategoria}
            onChange={(e) => updateParam('categoriaImplemento', e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Cualquier dotación</option>
            <option value="TECNOLOGIA">Tecnología (TV, Proyector)</option>
            <option value="MOBILIARIO">Mobiliario Ergonómico</option>
            <option value="DEPORTIVO">Material Deportivo</option>
            <option value="DIDACTICO">Didáctico / Laboratorio</option>
          </select>
        </div>

        {/* Capacidad Mínima */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Aforo Mínimo
          </label>
          <div className="relative">
            <Users className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
            <input
              type="number"
              min="1"
              max="5000"
              placeholder="Ej: 30"
              value={currentCapacidad}
              onChange={(e) => updateParam('capacidadMin', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Badges de filtros activos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filtros:
          </span>
          {currentSearch && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span>Búsqueda: &quot;{currentSearch}&quot;</span>
              <button type="button" onClick={() => updateParam('search', '')}>
                <X className="h-3 w-3 hover:text-rose-700" />
              </button>
            </span>
          )}
          {currentTipo && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span>Tipo: {currentTipo}</span>
              <button type="button" onClick={() => updateParam('tipo', '')}>
                <X className="h-3 w-3 hover:text-rose-700" />
              </button>
            </span>
          )}
          {currentCategoria && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span>Dotación: {currentCategoria}</span>
              <button type="button" onClick={() => updateParam('categoriaImplemento', '')}>
                <X className="h-3 w-3 hover:text-rose-700" />
              </button>
            </span>
          )}
          {currentCapacidad && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span>Aforo &ge; {currentCapacidad}</span>
              <button type="button" onClick={() => updateParam('capacidadMin', '')}>
                <X className="h-3 w-3 hover:text-rose-700" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
