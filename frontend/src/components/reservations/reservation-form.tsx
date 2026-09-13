// frontend/src/components/reservations/reservation-form.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Building2,
  Users,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservasApi, ApiError } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { useEspacios, useEspacioDetalle } from '../../hooks/use-espacios';

// Client schema with human friendly date and time inputs before converting to ISO 8601
const FormSchema = z
  .object({
    espacioId: z.coerce.number().int().positive({ message: 'Selecciona un espacio válido' }),
    fecha: z.string().min(10, { message: 'La fecha es obligatoria' }),
    horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora de inicio requerida (HH:mm)' }),
    horaFin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora de finalización requerida (HH:mm)' }),
    motivo: z
      .string()
      .trim()
      .min(5, { message: 'El motivo debe tener al menos 5 caracteres' })
      .max(300, { message: 'El motivo no puede exceder 300 caracteres' }),
    cantidadAsistentesEstimada: z.coerce
      .number()
      .int()
      .positive({ message: 'La cantidad debe ser mayor a 0' })
      .optional(),
  })
  .refine(
    (data) => {
      const [hIni, mIni] = data.horaInicio.split(':').map(Number);
      const [hFin, mFin] = data.horaFin.split(':').map(Number);
      return hFin * 60 + mFin > hIni * 60 + mIni;
    },
    {
      message: 'La hora de fin debe ser posterior a la hora de inicio',
      path: ['horaFin'],
    },
  )
  .refine(
    (data) => {
      const [hIni, mIni] = data.horaInicio.split(':').map(Number);
      const [hFin, mFin] = data.horaFin.split(':').map(Number);
      const diffMin = hFin * 60 + mFin - (hIni * 60 + mIni);
      return diffMin <= 360; // 6 horas
    },
    {
      message: 'La reserva no puede superar las 6 horas de duración continua',
      path: ['horaFin'],
    },
  );

type FormInput = z.infer<typeof FormSchema>;

interface ReservationFormProps {
  initialEspacioId?: number;
  initialFecha?: string;
  initialHoraInicio?: string;
  initialHoraFin?: string;
}

export function ReservationForm({
  initialEspacioId,
  initialFecha,
  initialHoraInicio,
  initialHoraFin,
}: ReservationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: espaciosData, isLoading: isLoadingEspacios } = useEspacios({ limit: 100 });
  const espacios = espaciosData?.data || [];

  const form = useForm<FormInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      espacioId: initialEspacioId || 0,
      fecha: initialFecha || new Date().toISOString().split('T')[0],
      horaInicio: initialHoraInicio || '08:00',
      horaFin: initialHoraFin || '10:00',
      motivo: '',
      cantidadAsistentesEstimada: 1,
    },
  });

  const selectedEspacioId = form.watch('espacioId');
  const selectedFecha = form.watch('fecha');
  const selectedHoraInicio = form.watch('horaInicio');
  const selectedHoraFin = form.watch('horaFin');

  const { data: espacioDetalle } = useEspacioDetalle(selectedEspacioId, !!selectedEspacioId);

  // Compute duration in hours
  const [durationHours, setDurationHours] = useState<number>(2);
  useEffect(() => {
    if (selectedHoraInicio && selectedHoraFin) {
      const [hIni, mIni] = selectedHoraInicio.split(':').map(Number);
      const [hFin, mFin] = selectedHoraFin.split(':').map(Number);
      const diffMinutes = hFin * 60 + mFin - (hIni * 60 + mIni);
      setDurationHours(diffMinutes > 0 ? Number((diffMinutes / 60).toFixed(1)) : 0);
    }
  }, [selectedHoraInicio, selectedHoraFin]);

  const mutation = useMutation({
    mutationFn: async (data: FormInput) => {
      // Build ISO 8601 strings
      const fechaInicioIso = new Date(`${data.fecha}T${data.horaInicio}:00.000Z`).toISOString();
      const fechaFinIso = new Date(`${data.fecha}T${data.horaFin}:00.000Z`).toISOString();

      return reservasApi.crear({
        espacioId: data.espacioId,
        fechaInicio: fechaInicioIso,
        fechaFin: fechaFinIso,
        motivo: data.motivo,
        cantidadAsistentesEstimada: data.cantidadAsistentesEstimada || undefined,
      });
    },
    onSuccess: () => {
      toast.success('¡Solicitud de reserva radicada con éxito!');
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.all });
      if (selectedEspacioId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.espacios.disponibilidad(selectedEspacioId, selectedFecha),
        });
      }
      router.push('/reservas');
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Error al radicar la solicitud de reserva';
      toast.error(msg);
    },
  });

  const onSubmit = (data: FormInput) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Selector de Espacio Físico */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Espacio Físico <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
          <select
            {...form.register('espacioId', { valueAsNumber: true })}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            disabled={isLoadingEspacios}
          >
            <option value={0}>Selecciona un aula, laboratorio o escenario deportivo...</option>
            {espacios.map((esp: any) => (
              <option key={esp.id} value={esp.id}>
                {esp.identificador} — {esp.tipo} (Bloque {esp.bloque?.codigo}, Aforo: {esp.capacidad} personas)
              </option>
            ))}
          </select>
        </div>
        {form.formState.errors.espacioId && (
          <p className="text-[11px] text-rose-600 font-semibold">
            {form.formState.errors.espacioId.message}
          </p>
        )}

        {/* Ficha rápida del espacio seleccionado */}
        {espacioDetalle && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <div>
              <span className="font-bold">{espacioDetalle.identificador}</span> ({espacioDetalle.tipo}) — Bloque {espacioDetalle.bloque?.codigo}, Sede {espacioDetalle.bloque?.sede?.nombre}
            </div>
            <span className="font-semibold text-emerald-800">
              Aforo máx: {espacioDetalle.capacidad} pers.
            </span>
          </div>
        )}
      </div>

      {/* Franja Temporal: Fecha, Hora Inicio y Hora Fin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Fecha */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Fecha del Evento <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
            <input
              type="date"
              {...form.register('fecha')}
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          {form.formState.errors.fecha && (
            <p className="text-[11px] text-rose-600 font-semibold">
              {form.formState.errors.fecha.message}
            </p>
          )}
        </div>

        {/* Hora Inicio */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Hora de Inicio <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
            <input
              type="time"
              step="300"
              {...form.register('horaInicio')}
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          {form.formState.errors.horaInicio && (
            <p className="text-[11px] text-rose-600 font-semibold">
              {form.formState.errors.horaInicio.message}
            </p>
          )}
        </div>

        {/* Hora Fin */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Hora de Finalización <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
            <input
              type="time"
              step="300"
              {...form.register('horaFin')}
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          {form.formState.errors.horaFin && (
            <p className="text-[11px] text-rose-600 font-semibold">
              {form.formState.errors.horaFin.message}
            </p>
          )}
        </div>
      </div>

      {/* Duración y Reglas */}
      <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span className="text-slate-600">
          Duración estimada:{' '}
          <strong className={durationHours > 6 ? 'text-rose-600' : 'text-emerald-700'}>
            {durationHours} hora(s)
          </strong>{' '}
          (Máximo permitido: 6.0 h continuas)
        </span>
        <span className="text-[11px] text-slate-400">Ventana institucional: 06:00 - 22:00</span>
      </div>

      {/* Asistentes Estimados */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Asistentes Estimados
        </label>
        <div className="relative">
          <Users className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none h-4 w-4 text-slate-400 my-auto" />
          <input
            type="number"
            min="1"
            max={espacioDetalle?.capacidad || 5000}
            {...form.register('cantidadAsistentesEstimada', { valueAsNumber: true })}
            placeholder="Ej: 25"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        {form.formState.errors.cantidadAsistentesEstimada && (
          <p className="text-[11px] text-rose-600 font-semibold">
            {form.formState.errors.cantidadAsistentesEstimada.message}
          </p>
        )}
      </div>

      {/* Motivo de la Reserva */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Motivo y Justificación de la Solicitud <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <textarea
            rows={4}
            {...form.register('motivo')}
            placeholder="Describe la actividad académica, deportiva o institucional a desarrollar (mínimo 5 caracteres)..."
            className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        {form.formState.errors.motivo && (
          <p className="text-[11px] text-rose-600 font-semibold">
            {form.formState.errors.motivo.message}
          </p>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center space-x-2 px-6 py-2.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50 active:scale-95"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          <span>Radicar Solicitud de Reserva</span>
        </button>
      </div>
    </form>
  );
}
