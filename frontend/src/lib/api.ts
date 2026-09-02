import {
  LoginInput,
  RegisterInput,
  AuthResponse,
  UsuarioResponse,
} from '../schemas/usuario.schema';
import { ApiResponse } from '../schemas/api-response.schema';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Gestión de token en memoria y cookies de cliente
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

export const setAccessToken = (token: string | null, user?: UsuarioResponse | null) => {
  currentAccessToken = token;
  if (typeof document !== 'undefined') {
    if (token) {
      // Guardar cookie segura para Next.js Middleware
      document.cookie = `auth_token=${token}; path=/; max-age=900; SameSite=Lax`;
      if (user) {
        document.cookie = `user_role=${user.rol}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `user_id=${user.id}; path=/; max-age=604800; SameSite=Lax`;
      }
    } else {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'user_id=; path=/; max-age=0; SameSite=Lax';
    }
  }
};

export const getAccessToken = (): string | null => {
  if (currentAccessToken) return currentAccessToken;
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^|;)\s*auth_token=([^;]+)/);
    if (match) {
      currentAccessToken = match[2];
      return currentAccessToken;
    }
  }
  return null;
};

export class ApiError extends Error {
  statusCode: number;
  data: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Envía cookies HttpOnly (refreshToken)
  };

  try {
    const response = await fetch(url, config);

    // Caso 401: Intentar refrescar Access Token automáticamente
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/register')
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          return apiClient<T>(endpoint, { ...options, headers });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          throw new Error('No se pudo renovar la sesión');
        }

        const refreshData: ApiResponse<{ accessToken: string; usuario: UsuarioResponse }> =
          await refreshRes.json();
        const newToken = refreshData.data?.accessToken;
        const usuario = refreshData.data?.usuario;

        if (!newToken) {
          throw new Error('Formato de respuesta de refresh inválido');
        }

        setAccessToken(newToken, usuario);
        processQueue(null, newToken);

        headers.set('Authorization', `Bearer ${newToken}`);
        return apiClient<T>(endpoint, { ...options, headers });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        throw new ApiError('Sesión expirada. Por favor inicie sesión nuevamente.', 401);
      } finally {
        isRefreshing = false;
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMsg = 'Error en la petición';
      if (data && typeof data === 'object') {
        if ('message' in data && data.message) {
          errorMsg = Array.isArray(data.message)
            ? data.message.join(', ')
            : String(data.message);
        } else if ('details' in data && Array.isArray(data.details)) {
          errorMsg = data.details
            .map((d: { message?: string }) => d.message || '')
            .filter(Boolean)
            .join(', ');
        }
      }
      throw new ApiError(errorMsg, response.status, data);
    }

    // Si viene envuelto en ApiResponse de NestJS Interceptor, extraer data si existe
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      return data.data as T;
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : 'Error de conexión con el servidor';
    throw new ApiError(message, 500);
  }
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

export const authApi = {
  login: async (dto: LoginInput): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', dto);
  },

  register: async (dto: RegisterInput): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', dto);
  },

  refresh: async (): Promise<{ accessToken: string; usuario: UsuarioResponse }> => {
    return api.post<{ accessToken: string; usuario: UsuarioResponse }>('/auth/refresh');
  },

  logout: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/logout');
  },

  getMe: async (): Promise<UsuarioResponse> => {
    return api.get<UsuarioResponse>('/auth/me');
  },
};

export const verificacionesApi = {
  getInventarioByEspacio: async (espacioId: number) => {
    return api.get<any[]>(`/espacios/${espacioId}/inventario`);
  },

  getVerificacionesByReserva: async (reservaId: number) => {
    return api.get<any[]>(`/reservas/${reservaId}/verificaciones`);
  },

  checkIn: async (reservaId: number, dto: { observacionesGenerales?: string; items: any[] }) => {
    return api.post<any>(`/reservas/${reservaId}/check-in`, dto);
  },

  checkOut: async (reservaId: number, dto: { observacionesGenerales?: string; items: any[] }) => {
    return api.post<any>(`/reservas/${reservaId}/check-out`, dto);
  },

  getNovedades: async (page = 1, limit = 10) => {
    return api.get<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/verificaciones/novedades?page=${page}&limit=${limit}`,
    );
  },
};

export const inventarioApi = {
  getByEspacio: async (espacioId: number) => {
    return api.get<any[]>(`/espacios/${espacioId}/inventario`);
  },

  getById: async (id: number) => {
    return api.get<any>(`/inventario/${id}`);
  },

  create: async (dto: any) => {
    return api.post<any>('/inventario', dto);
  },

  update: async (id: number, dto: any) => {
    return api.patch<any>(`/inventario/${id}`, dto);
  },

  remove: async (id: number) => {
    return api.delete<any>(`/inventario/${id}`);
  },
};

export const reservasApi = {
  getMisReservas: async (query?: { estado?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.estado) params.append('estado', query.estado);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    const qs = params.toString();
    return api.get<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/reservas/mis-reservas${qs ? `?${qs}` : ''}`,
    );
  },

  getById: async (id: number) => {
    return api.get<any>(`/reservas/${id}`);
  },

  crear: async (dto: any) => {
    return api.post<any>('/reservas', dto);
  },

  cancelar: async (id: number) => {
    return api.patch<any>(`/reservas/${id}/cancelar`);
  },

  getGestion: async (query?: { estado?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.estado) params.append('estado', query.estado);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    const qs = params.toString();
    return api.get<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/reservas/gestion${qs ? `?${qs}` : ''}`,
    );
  },

  cambiarEstado: async (id: number, dto: { estado: string; observaciones?: string }) => {
    return api.patch<any>(`/reservas/${id}/estado`, dto);
  },
};

export const usuariosApi = {
  inhabilitar: async (id: number, motivo: string) => {
    return api.patch<any>(`/usuarios/${id}/inhabilitar`, { motivo });
  },

  rehabilitar: async (id: number) => {
    return api.patch<any>(`/usuarios/${id}/rehabilitar`);
  },
};

export const espaciosApi = {
  getAll: async (query?: any) => {
    const params = new URLSearchParams(query || {});
    const qs = params.toString();
    return api.get<{ data: any[]; meta: any }>(`/espacios${qs ? `?${qs}` : ''}`);
  },

  getById: async (id: number) => {
    return api.get<any>(`/espacios/${id}`);
  },
};
