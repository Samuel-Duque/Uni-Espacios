// frontend/src/hooks/use-espacios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { espaciosApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useEspacios(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.espacios.list(filters),
    queryFn: () => espaciosApi.getAll(filters),
  });
}

export function useEspacioDetalle(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.espacios.detail(id),
    queryFn: () => espaciosApi.getById(id),
    enabled: enabled && !isNaN(id) && id > 0,
  });
}

export function useCrearEspacio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: any) => espaciosApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.espacios.all });
    },
  });
}

export function useActualizarEspacio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => espaciosApi.update(id, dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.espacios.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.espacios.detail(vars.id) });
    },
  });
}
