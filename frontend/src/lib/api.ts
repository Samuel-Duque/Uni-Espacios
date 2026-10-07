import {
  LoginInput,
  RegisterInput,
  AuthResponse,
  UsuarioResponse,
} from "../schemas/usuario.schema";
import { ApiResponse, PaginationMeta } from "../schemas/api-response.schema";
import {
  CreateEspacioInput,
  UpdateEspacioInput,
  Sede,
  Bloque,
  TipoEspacio,
  EstadoEspacio,
} from "../schemas/espacio.schema";
import {
  CreateItemInventarioInput,
  UpdateItemInventarioInput,
  ItemInventarioResponse,
} from "../schemas/inventario.schema";
import {
  CrearReservaInput,
  CambiarEstadoReservaInput,
  EstadoReserva,
} from "../schemas/reserva.schema";
import {
  CheckInInput,
  CheckOutInput,
  TipoVerificacion,
  EstadoGeneralVerificacion,
  EstadoItemVerificacion,
} from "../schemas/verificacion.schema";
import {
  PeriodoAcademicoInput,
  CreateClaseFijaInput,
  BulkCreateClaseFijaInput,
  EstadoPeriodo,
} from "../schemas/calendario.schema";

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface EspacioEntity {
  id: number;
  bloqueId: number;
  identificador: string;
  nombre?: string;
  tipo: TipoEspacio;
  capacidad: number;
  piso?: number | null;
  ubicacionDetalle?: string | null;
  permiteReservaDirecta: boolean;
  estado: EstadoEspacio;
  bloque?: Bloque & { nombre?: string; sede?: Sede };
  inventario?: ItemInventarioResponse[];
}

export interface ItemInventarioEntity extends ItemInventarioResponse {}

export interface ReservaEntity {
  id: number;
  espacioId: number;
  usuarioId: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  cantidadAsistentesEstimada?: number | null;
  estado: EstadoReserva;
  espacio?: EspacioEntity;
  usuario?: Pick<
    UsuarioResponse,
    "id" | "nombreCompleto" | "email" | "rol" | "documentoIdentidad" | "telefono"
  >;
  aprobaciones?: Array<{
    id: number;
    reservaId: number;
    aprobadorId: number;
    estado: string;
    observaciones?: string | null;
    fechaAccion: string;
    aprobador?: { id: number; nombreCompleto: string; email?: string };
  }>;
  verificaciones?: Array<VerificacionEntity>;
  creadoEn: string;
  actualizadoEn: string;
}

export interface VerificacionEntity {
  id: number;
  reservaId: number;
  usuarioVerificadorId: number;
  tipo: TipoVerificacion;
  estadoGeneral: EstadoGeneralVerificacion;
  observaciones?: string | null;
  fechaHora: string;
  detalles?: Array<{
    id: number;
    itemInventarioId: number;
    estadoItem: EstadoItemVerificacion;
    cantidadEncontrada: number;
    observacionNovedad?: string | null;
    itemInventario?: ItemInventarioEntity;
  }>;
  verificador?: { id: number; nombreCompleto: string };
}

export interface PeriodoAcademicoEntity {
  id: number;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPeriodo;
}

export interface ClaseFijaEntity {
  id: number;
  espacioId: number;
  periodoId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  asignatura: string;
  docente: string;
  grupo?: string | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ─────────────────────────────────────────────────────────────────────────────
// Gestión del Access Token en memoria (no en cookies JS)
// TSK-1005: las cookies auth_token / user_role / user_id son emitidas por el
// Route Handler /api/session (server-side, httpOnly) — NO desde document.cookie.
// ─────────────────────────────────────────────────────────────────────────────
let currentAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Sincroniza las cookies de sesión httpOnly a través del Route Handler server-side.
 * Se llama después de login, register, refresh y logout.
 */
const syncSessionCookies = async (
  token: string | null,
  user: Pick<UsuarioResponse, "id" | "rol"> | null,
): Promise<void> => {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, user }),
    });
  } catch {
    // Silenciar fallos de red al sincronizar cookies — no bloquear el flujo principal
  }
};

/**
 * Actualiza el token en memoria e inicia la sincronización de cookies httpOnly.
 * No escribe en document.cookie directamente.
 */
export const setAccessToken = (
  token: string | null,
  user?: UsuarioResponse | null,
): void => {
  currentAccessToken = token;
  // Sincronizar cookies httpOnly via Route Handler (no bloquea el flujo)
  syncSessionCookies(token, user ? { id: user.id, rol: user.rol } : null);
};

export const getAccessToken = (): string | null => {
  return currentAccessToken;
};

// ─────────────────────────────────────────────────────────────────────────────
// Error tipado para respuestas fallidas de la API
// ─────────────────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  statusCode: number;
  data: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cliente HTTP central con interceptor automático de refresh en 401
// ─────────────────────────────────────────────────────────────────────────────
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Envía la cookie HttpOnly refreshToken al backend
  };

  try {
    const response = await fetch(url, config);

    // ── 401: intentar renovar el Access Token automáticamente ───────────────
    if (
      response.status === 401 &&
      !endpoint.includes("/auth/login") &&
      !endpoint.includes("/auth/refresh") &&
      !endpoint.includes("/auth/register")
    ) {
      if (isRefreshing) {
        // Encolar la petición fallida hasta que el refresh termine
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          return apiClient<T>(endpoint, { ...options, headers });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!refreshRes.ok) {
          throw new Error("No se pudo renovar la sesión");
        }

        const refreshData: ApiResponse<{
          accessToken: string;
          usuario: UsuarioResponse;
        }> = await refreshRes.json();

        const newToken = refreshData.data?.accessToken;
        const usuario = refreshData.data?.usuario;

        if (!newToken) {
          throw new Error("Formato de respuesta de refresh inválido");
        }

        // Actualizar token en memoria y sincronizar cookies httpOnly (TSK-1005)
        setAccessToken(newToken, usuario ?? null);
        processQueue(null, newToken);

        headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient<T>(endpoint, { ...options, headers });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        throw new ApiError(
          "Sesión expirada. Por favor inicie sesión nuevamente.",
          401,
        );
      } finally {
        isRefreshing = false;
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMsg = "Error en la petición";
      if (data && typeof data === "object") {
        if ("message" in data && data.message) {
          errorMsg = Array.isArray(data.message)
            ? data.message.join(", ")
            : String(data.message);
        } else if ("details" in data && Array.isArray(data.details)) {
          errorMsg = data.details
            .map((d: { message?: string }) => d.message || "")
            .filter(Boolean)
            .join(", ");
        }
      }
      throw new ApiError(errorMsg, response.status, data);
    }

    // Desempaquetar el envelope ApiResponse del interceptor de NestJS
    // Excepción: respuestas paginadas con 'meta' se devuelven completas
    if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      "success" in data
    ) {
      if ("meta" in data) {
        return { data: (data as any).data, meta: (data as any).meta } as T;
      }
      return data.data as T;
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message =
      error instanceof Error
        ? error.message
        : "Error de conexión con el servidor";
    throw new ApiError(message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de verbo HTTP
// ─────────────────────────────────────────────────────────────────────────────
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (dto: LoginInput): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/login", dto),

  register: (dto: RegisterInput): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/register", dto),

  refresh: (): Promise<{ accessToken: string; usuario: UsuarioResponse }> =>
    api.post<{ accessToken: string; usuario: UsuarioResponse }>(
      "/auth/refresh",
    ),

  logout: (): Promise<{ message: string }> =>
    api.post<{ message: string }>("/auth/logout"),

  getMe: (): Promise<UsuarioResponse> => api.get<UsuarioResponse>("/auth/me"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Verificaciones API
// ─────────────────────────────────────────────────────────────────────────────
export const verificacionesApi = {
  getInventarioByEspacio: (
    espacioId: number,
  ): Promise<ItemInventarioEntity[]> =>
    api.get<ItemInventarioEntity[]>(`/espacios/${espacioId}/inventario`),

  getVerificacionesByReserva: (
    reservaId: number,
  ): Promise<VerificacionEntity[]> =>
    api.get<VerificacionEntity[]>(`/reservas/${reservaId}/verificaciones`),

  checkIn: (
    reservaId: number,
    dto: CheckInInput,
  ): Promise<VerificacionEntity> =>
    api.post<VerificacionEntity>(`/reservas/${reservaId}/check-in`, dto),

  checkOut: (
    reservaId: number,
    dto: CheckOutInput,
  ): Promise<VerificacionEntity> =>
    api.post<VerificacionEntity>(`/reservas/${reservaId}/check-out`, dto),

  getNovedades: (
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<VerificacionEntity>> =>
    api.get<PaginatedResult<VerificacionEntity>>(
      `/verificaciones/novedades?page=${page}&limit=${limit}`,
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Inventario API
// ─────────────────────────────────────────────────────────────────────────────
export const inventarioApi = {
  getByEspacio: (
    espacioId: number,
  ): Promise<ItemInventarioEntity[]> =>
    api.get<ItemInventarioEntity[]>(`/espacios/${espacioId}/inventario`),

  getById: (id: number): Promise<ItemInventarioEntity> =>
    api.get<ItemInventarioEntity>(`/inventario/${id}`),

  create: (dto: CreateItemInventarioInput): Promise<ItemInventarioEntity> =>
    api.post<ItemInventarioEntity>("/inventario", dto),

  update: (
    id: number,
    dto: UpdateItemInventarioInput,
  ): Promise<ItemInventarioEntity> =>
    api.patch<ItemInventarioEntity>(`/inventario/${id}`, dto),

  remove: (id: number): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/inventario/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Reservas API
// ─────────────────────────────────────────────────────────────────────────────
export const reservasApi = {
  getMisReservas: (query?: {
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ReservaEntity>> => {
    const params = new URLSearchParams();
    if (query?.estado) params.append("estado", query.estado);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    const qs = params.toString();
    return api.get<PaginatedResult<ReservaEntity>>(
      `/reservas/mis-reservas${qs ? `?${qs}` : ""}`,
    );
  },

  getById: (id: number): Promise<ReservaEntity> =>
    api.get<ReservaEntity>(`/reservas/${id}`),

  crear: (dto: CrearReservaInput): Promise<ReservaEntity> =>
    api.post<ReservaEntity>("/reservas", dto),

  cancelar: (id: number): Promise<ReservaEntity> =>
    api.patch<ReservaEntity>(`/reservas/${id}/cancelar`),

  getGestion: (query?: {
    estado?: string;
    espacioId?: number;
    sedeId?: number;
    bloqueId?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ReservaEntity>> => {
    const params = new URLSearchParams();
    if (query?.estado) params.append("estado", query.estado);
    if (query?.espacioId) params.append("espacioId", query.espacioId.toString());
    if (query?.sedeId) params.append("sedeId", query.sedeId.toString());
    if (query?.bloqueId) params.append("bloqueId", query.bloqueId.toString());
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    const qs = params.toString();
    return api.get<PaginatedResult<ReservaEntity>>(
      `/reservas/gestion${qs ? `?${qs}` : ""}`,
    );
  },

  cambiarEstado: (
    id: number,
    dto: { estado: string; observaciones?: string },
  ): Promise<ReservaEntity> =>
    api.patch<ReservaEntity>(`/reservas/${id}/estado`, dto),

  procesarNoShows: (): Promise<{ canceladas: number; ids: number[] }> =>
    api.post<{ canceladas: number; ids: number[] }>("/reservas/procesar-no-shows"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Usuarios API
// ─────────────────────────────────────────────────────────────────────────────
export const usuariosApi = {
  inhabilitar: (id: number, motivo: string): Promise<UsuarioResponse> =>
    api.patch<UsuarioResponse>(`/usuarios/${id}/inhabilitar`, { motivo }),

  rehabilitar: (id: number): Promise<UsuarioResponse> =>
    api.patch<UsuarioResponse>(`/usuarios/${id}/rehabilitar`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Espacios API
// ─────────────────────────────────────────────────────────────────────────────
export const espaciosApi = {
  getAll: (
    query?: Record<string, unknown>,
  ): Promise<PaginatedResult<EspacioEntity>> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "")
          params.append(k, String(v));
      });
    }
    const qs = params.toString();
    return api.get<PaginatedResult<EspacioEntity>>(
      `/espacios${qs ? `?${qs}` : ""}`,
    );
  },

  getById: (id: number): Promise<EspacioEntity> =>
    api.get<EspacioEntity>(`/espacios/${id}`),

  create: (dto: CreateEspacioInput): Promise<EspacioEntity> =>
    api.post<EspacioEntity>("/espacios", dto),

  update: (id: number, dto: UpdateEspacioInput): Promise<EspacioEntity> =>
    api.patch<EspacioEntity>(`/espacios/${id}`, dto),
};

// ─────────────────────────────────────────────────────────────────────────────
// Disponibilidad API
// ─────────────────────────────────────────────────────────────────────────────
export const disponibilidadApi = {
  getDisponibilidad: (espacioId: number, fecha: string) =>
    api.get<{
      espacioId: number;
      fecha: string;
      espacio: { identificador: string; tipo: string; estado: string };
      franjas: Array<{
        horaInicio: string;
        horaFin: string;
        disponible: boolean;
        tipoBloqueo:
          | "NINGUNO"
          | "CLASE_FIJA"
          | "RESERVA_APROBADA"
          | "ESPACIO_INACTIVO";
        descripcionBloqueo?: string;
      }>;
    }>(`/espacios/${espacioId}/disponibilidad?fecha=${fecha}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Infraestructura: Sedes, Bloques, Periodos, Clases Fijas
// ─────────────────────────────────────────────────────────────────────────────
export const sedesApi = {
  getAll: (): Promise<Sede[]> => api.get<Sede[]>("/sedes"),
  getById: (id: number): Promise<Sede> => api.get<Sede>(`/sedes/${id}`),
  create: (dto: { nombre: string; ciudad: string; direccion: string }): Promise<Sede> =>
    api.post<Sede>("/sedes", dto),
};

export const bloquesApi = {
  getAll: (sedeId?: number): Promise<Bloque[]> =>
    api.get<Bloque[]>(`/bloques${sedeId ? `?sedeId=${sedeId}` : ""}`),
  getById: (id: number): Promise<Bloque> => api.get<Bloque>(`/bloques/${id}`),
  create: (dto: {
    sedeId: number;
    codigo: string;
    descripcion?: string;
  }): Promise<Bloque> => api.post<Bloque>("/bloques", dto),
};

export const periodosApi = {
  getAll: (): Promise<PeriodoAcademicoEntity[]> =>
    api.get<PeriodoAcademicoEntity[]>("/periodos-academicos"),
  getById: (id: number): Promise<PeriodoAcademicoEntity> =>
    api.get<PeriodoAcademicoEntity>(`/periodos-academicos/${id}`),
  create: (dto: {
    codigo: string;
    fechaInicio: string;
    fechaFin: string;
    estado?: string;
  }): Promise<PeriodoAcademicoEntity> =>
    api.post<PeriodoAcademicoEntity>("/periodos-academicos", dto),
  activar: (id: number): Promise<PeriodoAcademicoEntity> =>
    api.patch<PeriodoAcademicoEntity>(`/periodos-academicos/${id}/activar`),
};

export const clasesFijasApi = {
  getByEspacio: (
    espacioId: number,
    periodoId?: number,
  ): Promise<ClaseFijaEntity[]> =>
    api.get<ClaseFijaEntity[]>(
      `/espacios/${espacioId}/clases-fijas${periodoId ? `?periodoId=${periodoId}` : ""}`,
    ),
  create: (dto: CreateClaseFijaInput): Promise<ClaseFijaEntity> =>
    api.post<ClaseFijaEntity>("/clases-fijas", dto),
  bulkCreate: (dto: BulkCreateClaseFijaInput): Promise<{ count: number }> =>
    api.post<{ count: number }>("/clases-fijas/bulk", dto),
  remove: (id: number): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/clases-fijas/${id}`),
};
