'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { verificacionesApi, ApiError } from '../../lib/api';
import { InventoryChecklist, InventarioItemParaVerificar } from './inventory-checklist';
import { DetalleVerificacionItemInput } from '../../schemas/verificacion.schema';
import { Loader2, X } from 'lucide-react';

interface VerificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'CHECK_IN' | 'CHECK_OUT';
  reservaId: number;
  espacioId: number;
  espacioNombre: string;
}

export function VerificacionModal({
  isOpen,
  onClose,
  tipo,
  reservaId,
  espacioId,
  espacioNombre,
}: VerificacionModalProps) {
  const queryClient = useQueryClient();

  // 1. Obtener inventario del espacio asignado
  const {
    data: items,
    isLoading: isLoadingItems,
    error: itemsError,
  } = useQuery<InventarioItemParaVerificar[]>({
    queryKey: ['inventario-espacio', espacioId],
    queryFn: () => verificacionesApi.getInventarioByEspacio(espacioId),
    enabled: isOpen && !!espacioId,
  });

  // 2. Mutación para Check-In
  const checkInMutation = useMutation({
    mutationFn: (dto: { observacionesGenerales?: string; items: DetalleVerificacionItemInput[] }) =>
      verificacionesApi.checkIn(reservaId, dto),
    onSuccess: () => {
      toast.success('Check-In completado exitosamente. La reserva ahora está EN USO.');
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      queryClient.invalidateQueries({ queryKey: ['reservas-gestion'] });
      queryClient.invalidateQueries({ queryKey: ['reserva-detalle', reservaId] });
      queryClient.invalidateQueries({ queryKey: ['verificaciones-reserva', reservaId] });
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error al realizar Check-In';
      toast.error(message);
    },
  });

  // 3. Mutación para Check-Out
  const checkOutMutation = useMutation({
    mutationFn: (dto: { observacionesGenerales?: string; items: DetalleVerificacionItemInput[] }) =>
      verificacionesApi.checkOut(reservaId, dto),
    onSuccess: (res: any) => {
      if (res?.estadoGeneral === 'CON_NOVEDADES') {
        toast.warning(
          'Check-Out registrado con novedades. Se ha generado el informe para el Gestor de Espacios.',
        );
      } else {
        toast.success('Check-Out completado conforme. Reserva FINALIZADA.');
      }
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      queryClient.invalidateQueries({ queryKey: ['reservas-gestion'] });
      queryClient.invalidateQueries({ queryKey: ['reserva-detalle', reservaId] });
      queryClient.invalidateQueries({ queryKey: ['verificaciones-reserva', reservaId] });
      queryClient.invalidateQueries({ queryKey: ['verificaciones-novedades'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error al realizar Check-Out';
      toast.error(message);
    },
  });

  if (!isOpen) return null;

  const isSubmitting = checkInMutation.isPending || checkOutMutation.isPending;

  const handleSubmit = async (data: {
    observacionesGenerales?: string;
    items: DetalleVerificacionItemInput[];
  }) => {
    if (tipo === 'CHECK_IN') {
      await checkInMutation.mutateAsync(data);
    } else {
      await checkOutMutation.mutateAsync(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-white text-slate-500 hover:text-slate-800 shadow-md border border-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoadingItems ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl border border-slate-100 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Cargando catálogo de inventario del espacio...
            </p>
          </div>
        ) : itemsError ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl border border-rose-100">
            <p className="text-sm font-semibold text-rose-700">
              Error al cargar los implementos del espacio.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <InventoryChecklist
            items={items || []}
            tipo={tipo}
            reservaId={reservaId}
            espacioNombre={espacioNombre}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}
