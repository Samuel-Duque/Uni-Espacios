// frontend/src/hooks/use-disponibilidad.ts
import { useQuery } from '@tanstack/react-query';
import { disponibilidadApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useDisponibilidad(espacioId: number, fecha: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.espacios.disponibilidad(espacioId, fecha),
    queryFn: () => disponibilidadApi.getDisponibilidad(espacioId, fecha),
    enabled: enabled && !isNaN(espacioId) && espacioId > 0 && !!fecha,
  });
}
