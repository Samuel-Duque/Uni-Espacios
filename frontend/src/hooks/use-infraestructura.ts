// frontend/src/hooks/use-infraestructura.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sedesApi, bloquesApi, periodosApi, clasesFijasApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useSedes() {
  return useQuery({
    queryKey: queryKeys.sedes.all,
    queryFn: () => sedesApi.getAll(),
  });
}

export function useBloques(sedeId?: number) {
  return useQuery({
    queryKey: queryKeys.bloques.bySede(sedeId),
    queryFn: () => bloquesApi.getAll(sedeId),
  });
}

export function usePeriodosAcademicos() {
  return useQuery({
    queryKey: queryKeys.periodos.all,
    queryFn: () => periodosApi.getAll(),
  });
}

export function useClasesFijas(espacioId: number, periodoId?: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clasesFijas.byEspacio(espacioId, periodoId),
    queryFn: () => clasesFijasApi.getByEspacio(espacioId, periodoId),
    enabled: enabled && !isNaN(espacioId) && espacioId > 0,
  });
}

export function useCrearSede() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: { nombre: string; ciudad: string; direccion: string }) => sedesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sedes.all });
    },
  });
}

export function useCrearBloque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: { sedeId: number; codigo: string; descripcion?: string }) => bloquesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bloques.all });
    },
  });
}

export function useCrearPeriodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: { codigo: string; fechaInicio: string; fechaFin: string; estado?: string }) =>
      periodosApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periodos.all });
    },
  });
}

export function useActivarPeriodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => periodosApi.activar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.periodos.all });
    },
  });
}

export function useCrearClaseFija() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: any) => clasesFijasApi.create(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clasesFijas.byEspacio(vars.espacioId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.espacios.detail(vars.espacioId) });
    },
  });
}

export function useEliminarClaseFija(espacioId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clasesFijasApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clasesFijas.byEspacio(espacioId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.espacios.detail(espacioId) });
    },
  });
}
