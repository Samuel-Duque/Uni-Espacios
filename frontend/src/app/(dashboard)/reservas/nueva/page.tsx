// frontend/src/app/(dashboard)/reservas/nueva/page.tsx
'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarPlus, Loader2 } from 'lucide-react';
import { ReservationForm } from '../../../../components/reservations/reservation-form';

function NuevaReservaContent() {
  const searchParams = useSearchParams();

  const espacioIdParam = searchParams.get('espacioId');
  const initialEspacioId = espacioIdParam ? parseInt(espacioIdParam, 10) : undefined;
  const initialFecha = searchParams.get('fecha') || undefined;
  const initialHoraInicio = searchParams.get('horaInicio') || undefined;
  const initialHoraFin = searchParams.get('horaFin') || undefined;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
      <ReservationForm
        initialEspacioId={initialEspacioId}
        initialFecha={initialFecha}
        initialHoraInicio={initialHoraInicio}
        initialHoraFin={initialHoraFin}
      />
    </div>
  );
}

export default function NuevaReservaPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 max-w-3xl">
      {/* Botón Volver */}
      <div>
        <Link
          href="/reservas"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a Mis Reservas</span>
        </Link>
      </div>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <CalendarPlus className="h-6 w-6 text-emerald-700" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Nueva Solicitud de Reserva
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Radica una solicitud institucional para el uso temporal de un espacio físico en el Politécnico JIC.
          Las solicitudes son evaluadas por la coordinación de espacios.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-2" />
            <span className="text-xs font-semibold">Cargando formulario de reserva...</span>
          </div>
        }
      >
        <NuevaReservaContent />
      </Suspense>
    </div>
  );
}
