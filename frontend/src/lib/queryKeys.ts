// frontend/src/lib/queryKeys.ts

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  sedes: {
    all: ['sedes'] as const,
    detail: (id: number) => ['sedes', 'detail', id] as const,
  },
  bloques: {
    all: ['bloques'] as const,
    bySede: (sedeId?: number) => ['bloques', { sedeId }] as const,
    detail: (id: number) => ['bloques', 'detail', id] as const,
  },
  espacios: {
    all: ['espacios'] as const,
    list: (filters?: Record<string, unknown>) => ['espacios', 'list', filters || {}] as const,
    detail: (id: number) => ['espacios', 'detail', id] as const,
    disponibilidad: (id: number, fecha: string) => ['espacios', 'disponibilidad', id, fecha] as const,
    inventario: (id: number) => ['espacios', 'inventario', id] as const,
    clasesFijas: (id: number, periodoId?: number) => ['espacios', 'clasesFijas', id, { periodoId }] as const,
  },
  reservas: {
    all: ['reservas'] as const,
    misReservas: (filters?: { estado?: string; page?: number; limit?: number }) =>
      ['reservas', 'mis-reservas', filters || {}] as const,
    gestion: (filters?: { estado?: string; page?: number; limit?: number }) =>
      ['reservas', 'gestion', filters || {}] as const,
    detail: (id: number) => ['reservas', 'detail', id] as const,
    verificaciones: (id: number) => ['reservas', 'verificaciones', id] as const,
  },
  novedades: {
    all: (page = 1, limit = 10) => ['novedades', { page, limit }] as const,
  },
  periodos: {
    all: ['periodos'] as const,
    detail: (id: number) => ['periodos', 'detail', id] as const,
  },
  clasesFijas: {
    byEspacio: (espacioId: number, periodoId?: number) => ['clases-fijas', { espacioId, periodoId }] as const,
  },
};
