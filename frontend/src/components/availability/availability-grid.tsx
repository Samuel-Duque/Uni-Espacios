// frontend/src/components/availability/availability-grid.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarCheck,
  Info,
  Clock,
} from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDisponibilidad } from '../../hooks/use-disponibilidad';
import { TimeSlotBadge } from './time-slot-badge';

interface AvailabilityGridProps {
  espacioId: number;
  espacioIdentificador: string;
}

export function AvailabilityGrid({
  espacioId,
  espacioIdentificador,
}: AvailabilityGridProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    format(new Date(), 'yyyy-MM-dd'),
  );

  // Selected slot state: start and end hour
  const [selectedRange, setSelectedRange] = useState<{
    horaInicio: string;
    horaFin: string;
  } | null>(null);

  const { data, isLoading, error } = useDisponibilidad(espacioId, selectedDate);
  const franjas = data?.franjas || [];

  const handlePrevDay = () => {
    setSelectedRange(null);
    const prev = subDays(parseISO(selectedDate), 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    setSelectedRange(null);
    const next = addDays(parseISO(selectedDate), 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setSelectedRange(null);
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSelectSlot = (horaInicio: string, horaFin: string) => {
    if (!selectedRange) {
      setSelectedRange({ horaInicio, horaFin });
      return;
    }

    // If same slot clicked again, unselect
    if (selectedRange.horaInicio === horaInicio && selectedRange.horaFin === horaFin) {
      setSelectedRange(null);
      return;
    }

    // Range extension
    const slotHIni = parseInt(horaInicio.split(':')[0], 10);
    const currHIni = parseInt(selectedRange.horaInicio.split(':')[0], 10);

    if (slotHIni < currHIni) {
      setSelectedRange({ horaInicio, horaFin: selectedRange.horaFin });
    } else {
      setSelectedRange({ horaInicio: selectedRange.horaInicio, horaFin });
    }
  };

  const isSlotSelected = (hIni: string, hFin: string) => {
    if (!selectedRange) return false;
    const h = parseInt(hIni.split(':')[0], 10);
    const start = parseInt(selectedRange.horaInicio.split(':')[0], 10);
    const end = parseInt(selectedRange.horaFin.split(':')[0], 10);
    return h >= start && h < end;
  };

  // Format date display
  const parsedDate = parseISO(selectedDate);
  const formattedDisplayDate = format(parsedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Date Header / Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900 capitalize">
              {formattedDisplayDate}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Disponibilidad horaria continua entre las 06:00 y las 22:00.
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
          >
            Hoy
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedRange(null);
              setSelectedDate(e.target.value);
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          />

          <button
            type="button"
            onClick={handleNextDay}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Semantic Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center space-x-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block" />
          <span className="text-slate-700 font-medium">Libre (Clic para seleccionar)</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500 border border-rose-600 inline-block" />
          <span className="text-slate-700 font-medium">Clase Fija Semestral</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500 border border-amber-600 inline-block" />
          <span className="text-slate-700 font-medium">Reserva Aprobada</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="h-3 w-3 rounded-full bg-slate-400 border border-slate-500 inline-block" />
          <span className="text-slate-700 font-medium">Inactivo / Fuera de servicio</span>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
          <span className="text-xs font-semibold">
            Calculando franjas horarias y colisiones académicas...
          </span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
          Error al consultar la disponibilidad de este espacio. Por favor intenta de nuevo.
        </div>
      ) : franjas.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500">
          No hay franjas registradas para la fecha seleccionada.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {franjas.map((franja: any) => (
            <TimeSlotBadge
              key={`${franja.horaInicio}-${franja.horaFin}`}
              horaInicio={franja.horaInicio}
              horaFin={franja.horaFin}
              disponible={franja.disponible}
              tipoBloqueo={franja.tipoBloqueo}
              descripcionBloqueo={franja.descripcionBloqueo}
              isSelected={isSlotSelected(franja.horaInicio, franja.horaFin)}
              onSelect={() => handleSelectSlot(franja.horaInicio, franja.horaFin)}
            />
          ))}
        </div>
      )}

      {/* Floating / Bottom Action Bar for Selected Range */}
      {selectedRange && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center space-x-3 text-emerald-950">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                Franja Seleccionada: {selectedRange.horaInicio} a {selectedRange.horaFin}
              </h4>
              <p className="text-xs text-emerald-800">
                {formattedDisplayDate} — Espacio {espacioIdentificador}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedRange(null)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancelar Selección
            </button>

            <Link
              href={`/reservas/nueva?espacioId=${espacioId}&fecha=${selectedDate}&horaInicio=${selectedRange.horaInicio}&horaFin=${selectedRange.horaFin}`}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Solicitar Reserva en este Horario</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
