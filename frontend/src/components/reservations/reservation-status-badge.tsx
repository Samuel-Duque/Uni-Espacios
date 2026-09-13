// frontend/src/components/reservations/reservation-status-badge.tsx
import React from 'react';
import { cn } from '../../lib/utils';

export interface ReservationStatusBadgeProps {
  estado: string;
  className?: string;
}

export function ReservationStatusBadge({ estado, className }: ReservationStatusBadgeProps) {
  const getStyles = () => {
    switch (estado) {
      case 'APROBADA':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'EN_USO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse';
      case 'FINALIZADA':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'RECHAZADA':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'CANCELADA':
        return 'bg-zinc-100 text-zinc-600 border-zinc-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
        getStyles(),
        className,
      )}
    >
      {estado}
    </span>
  );
}
