// frontend/src/components/catalog/espacio-card.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  FlaskConical,
  Users,
  Trophy,
  Monitor,
  MapPin,
  CalendarCheck,
  ArrowRight,
  Package,
  Layers,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { CategoryBadge } from './category-badge';

export interface EspacioCardProps {
  espacio: {
    id: number;
    identificador: string;
    tipo: string;
    capacidad: number;
    piso?: number | null;
    ubicacionDetalle?: string | null;
    estado: string;
    permiteReservaDirecta: boolean;
    bloque?: {
      codigo: string;
      nombre?: string;
      sede?: {
        nombre: string;
      };
    };
    _count?: {
      inventario?: number;
    };
  };
}

export function EspacioCard({ espacio }: EspacioCardProps) {
  const getTypeMetadata = (tipo: string) => {
    switch (tipo) {
      case 'LABORATORIO':
        return {
          label: 'Laboratorio',
          icon: FlaskConical,
          bgGradient: 'from-purple-900 to-indigo-950 text-white',
          badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300',
        };
      case 'AUDITORIO':
        return {
          label: 'Auditorio Institucional',
          icon: Users,
          bgGradient: 'from-blue-900 to-slate-900 text-white',
          badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300',
        };
      case 'DEPORTIVO':
        return {
          label: 'Escenario Deportivo',
          icon: Trophy,
          bgGradient: 'from-amber-700 to-amber-950 text-white',
          badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'SALA_COMPUTO':
        return {
          label: 'Sala de Cómputo',
          icon: Monitor,
          bgGradient: 'from-teal-800 to-slate-950 text-white',
          badgeStyle: 'bg-teal-100 text-teal-900 border-teal-300',
        };
      case 'AULA':
      default:
        return {
          label: 'Aula de Clase',
          icon: GraduationCap,
          bgGradient: 'from-emerald-800 to-emerald-950 text-white',
          badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        };
    }
  };

  const typeMeta = getTypeMetadata(espacio.tipo);
  const TypeIcon = typeMeta.icon;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-500/40">
      {/* Header Visual con Identidad Politécnico */}
      <div className={`relative h-28 bg-gradient-to-br ${typeMeta.bgGradient} p-4 flex flex-col justify-between`}>
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md bg-white/20 text-white border border-white/30">
            <TypeIcon className="h-3 w-3" />
            <span>{typeMeta.label}</span>
          </span>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              espacio.estado === 'ACTIVO'
                ? 'bg-emerald-400/30 text-emerald-200 border border-emerald-400/40'
                : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
            }`}
          >
            {espacio.estado}
          </span>
        </div>

        {/* Space ID / Identifier */}
        <div className="flex items-baseline justify-between text-white">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight drop-shadow-xs">
              {espacio.identificador}
            </h3>
            <p className="text-[11px] text-white/80 font-medium">
              Bloque {espacio.bloque?.codigo} — {espacio.bloque?.sede?.nombre || 'Sede Poblado'}
            </p>
          </div>
          <span className="font-mono text-xs text-white/60">#{espacio.id}</span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5 text-xs text-slate-600">
          {/* Aforo y Piso */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Users className="h-4 w-4 text-emerald-700" />
              <span>Aforo: {espacio.capacidad} personas</span>
            </div>

            {espacio.piso !== null && espacio.piso !== undefined && (
              <span className="text-[11px] text-slate-500 font-medium">
                Piso {espacio.piso}
              </span>
            )}
          </div>

          {/* Ubicación Detalle si existe */}
          {espacio.ubicacionDetalle && (
            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
              {espacio.ubicacionDetalle}
            </p>
          )}

          {/* Inventario Asignado */}
          <div className="flex items-center space-x-2 pt-1">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-600 font-medium">
              {espacio._count?.inventario !== undefined
                ? `${espacio._count.inventario} implemento(s) en inventario`
                : 'Inventario tecnológico y pedagógico'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100">
          <Link
            href={`/espacios/${espacio.id}`}
            className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-700 hover:text-white transition-colors duration-150 border border-emerald-200 shadow-2xs group-hover:bg-emerald-700 group-hover:text-white"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>Consultar Disponibilidad y Reservar</span>
            <ArrowRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
