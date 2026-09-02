'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Users,
  Layers,
  MapPin,
  Search,
  ArrowRight,
  Loader2,
  Package,
} from 'lucide-react';
import { espaciosApi } from '../../../lib/api';

export default function CatalogoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  const { data: espaciosData, isLoading, error } = useQuery({
    queryKey: ['espacios-catalogo'],
    queryFn: () => espaciosApi.getAll(),
  });

  const filteredEspacios = espaciosData?.data?.filter((espacio: any) => {
    const matchesSearch =
      espacio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      espacio.bloque?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      espacio.tipo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = !tipoFilter || espacio.tipo === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Catálogo de Espacios Físicos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aulas, laboratorios, auditorios y escenarios deportivos de la Sede Poblado (Medellín).
          </p>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
            <input
              type="text"
              placeholder="Buscar por nombre o bloque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">Todos los tipos</option>
            <option value="AULA_CLASE">Aulas de Clase</option>
            <option value="LABORATORIO">Laboratorios</option>
            <option value="AUDITORIO">Auditorios</option>
            <option value="SALA_COMPUTO">Salas de Cómputo</option>
            <option value="ESCENARIO_DEPORTIVO">Escenarios Deportivos</option>
          </select>
        </div>
      </div>

      {/* Grid de Espacios */}
      <div>
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
            <span className="text-xs font-semibold">Cargando catálogo de espacios...</span>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
            Error al consultar el catálogo de espacios.
          </div>
        ) : filteredEspacios?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No se encontraron espacios</h3>
            <p className="text-xs text-slate-500 mt-1">
              Intenta ajustando el término de búsqueda o el filtro de tipo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEspacios?.map((espacio: any) => (
              <div
                key={espacio.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase tracking-wider">
                      {espacio.tipo}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{espacio.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {espacio.nombre}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                      <span>
                        Bloque {espacio.bloque?.codigo} — Sede {espacio.bloque?.sede?.nombre}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>Capacidad: <strong>{espacio.capacidad} personas</strong></span>
                    </div>

                    {espacio._count?.inventario !== undefined && (
                      <div className="flex items-center space-x-1.5 text-emerald-800 font-medium">
                        <Package className="h-3.5 w-3.5" />
                        <span>{espacio._count.inventario} implemento(s) en inventario</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Estado: <strong className="text-emerald-700">{espacio.estado}</strong>
                  </span>

                  <Link
                    href={`/espacios/${espacio.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <span>Ver Ficha e Inventario</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
