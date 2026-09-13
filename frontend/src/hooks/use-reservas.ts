// frontend/src/hooks/use-reservas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservasApi, verificacionesApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useMisReservas(filters?: { estado?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.reservas.misReservas(filters),
    queryFn: () => reservasApi.getMisReservas(filters),
  });
}

export function useReservaDetalle(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reservas.detail(id),
    queryFn: () => reservasApi.getById(id),
    enabled: enabled && !isNaN(id) && id > 0,
  });
}

export function useReservaGestion(filters?: { estado?: string; page?: number; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reservas.gestion(filters),
    queryFn: () => reservasApi.getGestion(filters),
    enabled,
  });
}

export function useVerificacionesReserva(reservaId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reservas.verificaciones(reservaId),
    queryFn: () => verificacionesApi.getVerificacionesByReserva(reservaId),
    enabled: enabled && !isNaN(reservaId) && reservaId > 0,
  });
}

export function useCrearReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: any) => reservasApi.crear(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.all });
      if (data?.espacioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.espacios.detail(data.espacioId) });
      }
    },
  });
}

export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reservasApi.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.all });
    },
  });
}

export function useCambiarEstadoReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: { estado: string; observaciones?: string } }) =>
      reservasApi.cambiarEstado(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.all });
    },
  });
}
