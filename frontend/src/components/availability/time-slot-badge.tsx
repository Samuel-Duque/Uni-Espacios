// frontend/src/components/availability/time-slot-badge.tsx
'use client';

import React from 'react';
import { Check, Lock, BookOpen, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TimeSlotProps {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  tipoBloqueo: 'NINGUNO' | 'CLASE_FIJA' | 'RESERVA_APROBADA' | 'ESPACIO_INACTIVO';
  descripcionBloqueo?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function TimeSlotBadge({
  horaInicio,
  horaFin,
  disponible,
  tipoBloqueo,
  descripcionBloqueo,
  isSelected,
  onSelect,
}: TimeSlotProps) {
  const isClickable = disponible;

  const getSlotStyles = () => {
    if (isSelected) {
      return 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500 ring-offset-1 scale-[1.02]';
    }

    if (disponible) {
      return 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-xs cursor-pointer active:scale-95';
    }

    switch (tipoBloqueo) {
      case 'CLASE_FIJA':
        return 'bg-rose-50 text-rose-900 border-rose-200 cursor-not-allowed opacity-95';
      case 'RESERVA_APROBADA':
        return 'bg-amber-50 text-amber-900 border-amber-200 cursor-not-allowed opacity-95';
      case 'ESPACIO_INACTIVO':
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-75';
    }
  };

  const getSlotIcon = () => {
    if (isSelected) {
      return <Check className="h-3.5 w-3.5 text-white animate-in zoom-in-50" />;
    }
    if (disponible) {
      return <Clock className="h-3.5 w-3.5 text-emerald-700" />;
    }
    if (tipoBloqueo === 'CLASE_FIJA') {
      return <BookOpen className="h-3.5 w-3.5 text-rose-700 shrink-0" />;
    }
    if (tipoBloqueo === 'RESERVA_APROBADA') {
      return <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0" />;
    }
    return <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
  };

  return (
    <div
      onClick={isClickable ? onSelect : undefined}
      title={
        disponible
          ? `Franja disponible de ${horaInicio} a ${horaFin}. Clic para seleccionar.`
          : descripcionBloqueo || 'Horario ocupado'
      }
      className={cn(
        'group relative flex flex-col justify-between p-3 rounded-xl border transition-all text-left select-none min-h-[72px]',
        getSlotStyles(),
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold tracking-tight">
          {horaInicio} - {horaFin}
        </span>
        {getSlotIcon()}
      </div>

      <div className="mt-1">
        {isSelected ? (
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
            ✓ Seleccionado
          </span>
        ) : disponible ? (
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            Disponible
          </span>
        ) : (
          <p className="text-[10px] line-clamp-1 font-semibold leading-tight">
            {descripcionBloqueo || (tipoBloqueo === 'CLASE_FIJA' ? 'Clase Fija' : 'Ocupado')}
          </p>
        )}
      </div>
    </div>
  );
}
