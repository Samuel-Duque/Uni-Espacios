// frontend/src/app/(dashboard)/reservas/[id]/check-out/page.tsx
'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { reservasApi, verificacionesApi, ApiError } from '../../../../../lib/api';
import { queryKeys } from '../../../../../lib/queryKeys';
import { InventoryChecklist } from '../../../../../components/inventario/inventory-checklist';
import { DetalleVerificacionItemInput } from '../../../../../schemas/verificacion.schema';

interface CheckOutPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckOutPage({ params }: CheckOutPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const reservaId = parseInt(resolvedParams.id, 10);

  // 1. Cargar datos de la reserva
  const {
    data: reserva,
    isLoading: isLoadingReserva,
    error: reservaError,
  } = useQuery({
    queryKey: queryKeys.reservas.detail(reservaId),
    queryFn: () => reservasApi.getById(reservaId),
    enabled: !isNaN(reservaId),
  });

  const espacioId = reserva?.espacioId;

  // 2. Cargar inventario del espacio
  const {
    data: items = [],
    isLoading: isLoadingItems,
    error: itemsError,
  } = useQuery({
    queryKey: queryKeys.espacios.inventario(espacioId!),
    queryFn: () => verificacionesApi.getInventarioByEspacio(espacioId!),
    enabled: !!espacioId,
  });

  // 3. Mutación Check-Out
  const checkOutMutation = useMutation({
    mutationFn: (dto: { observacionesGenerales?: string; items: DetalleVerificacionItemInput[] }) =>
      verificacionesApi.checkOut(reservaId, dto),
    onSuccess: (res: any) => {
      if (res?.estadoGeneral === 'CON_NOVEDADES') {
        toast.warning(
          'Check-Out registrado con novedades. Se ha generado un reporte de auditoría.',
        );
      } else {
        toast.success('¡Check-Out completado conforme! Reserva FINALIZADA.');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.detail(reservaId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.novedades.all() });
      router.push('/reservas');
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Error al registrar el Check-Out';
      toast.error(msg);
    },
  });

  if (isNaN(reservaId)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-sm font-semibold text-rose-600">ID de reserva inválido.</p>
        <Link href="/reservas" className="mt-4 inline-block text-xs font-bold text-emerald-700 underline">
          Volver a Mis Reservas
        </Link>
      </div>
    );
  }

  const isLoading = isLoadingReserva || isLoadingItems;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 max-w-4xl">
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

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
          <span className="text-xs font-semibold">Cargando acta de entrega y Check-Out...</span>
        </div>
      ) : reservaError || itemsError || !reserva ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
          Error al cargar los datos de la reserva o su inventario asociado.
        </div>
      ) : (
        <InventoryChecklist
          items={items}
          tipo="CHECK_OUT"
          reservaId={reservaId}
          espacioNombre={reserva.espacio?.identificador || reserva.espacio?.nombre || `Espacio #${espacioId}`}
          isSubmitting={checkOutMutation.isPending}
          onSubmit={async (data) => {
            await checkOutMutation.mutateAsync(data);
          }}
          onCancel={() => router.push('/reservas')}
        />
      )}
    </div>
  );
}
