'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  UsuarioResponse,
  LoginInput,
  RegisterInput,
  RolUsuario,
} from '../schemas/usuario.schema';
import { authApi, setAccessToken, getAccessToken, ApiError } from './api';

interface AuthContextType {
  user: UsuarioResponse | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // RBAC Helpers
  isSuperAdmin: boolean;
  isGestor: boolean;
  isDocenteOrAdmin: boolean;
  isEstudiante: boolean;
  hasRole: (...roles: RolUsuario[]) => boolean;
  inhabilitadoParaReservar: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'uni_espacios_user_profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Inicializar estado desde caché / verificación de sesión
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getAccessToken();
        const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          }
        }

        if (storedToken) {
          setTokenState(storedToken);
          // Verificar validez con el backend
          const me = await authApi.getMe();
          setUser(me);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(me));
          setAccessToken(storedToken, me);
        } else {
          // Intentar refresh silencioso vía cookie HttpOnly
          try {
            const refreshRes = await authApi.refresh();
            setTokenState(refreshRes.accessToken);
            setUser(refreshRes.usuario);
            localStorage.setItem(
              LOCAL_STORAGE_USER_KEY,
              JSON.stringify(refreshRes.usuario),
            );
            setAccessToken(refreshRes.accessToken, refreshRes.usuario);
          } catch {
            // No hay sesión activa previa
            setUser(null);
            setTokenState(null);
            setAccessToken(null);
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          }
        }
      } catch (err) {
        console.warn('Error inicializando sesión:', err);
        setUser(null);
        setTokenState(null);
        setAccessToken(null);
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginInput) => {
      setIsLoading(true);
      try {
        const response = await authApi.login(credentials);
        setTokenState(response.accessToken);
        setUser(response.usuario);
        setAccessToken(response.accessToken, response.usuario);
        localStorage.setItem(
          LOCAL_STORAGE_USER_KEY,
          JSON.stringify(response.usuario),
        );

        toast.success(`¡Bienvenido(a), ${response.usuario.nombreCompleto}!`);

        // Redirección inteligente por rol
        if (response.usuario.rol === 'SUPERADMIN') {
          router.push('/admin');
        } else if (response.usuario.rol === 'GESTOR_ESPACIO') {
          router.push('/gestion');
        } else {
          router.push('/catalogo');
        }
      } catch (error: unknown) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Error al iniciar sesión';
        toast.error(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      setIsLoading(true);
      try {
        const response = await authApi.register(data);
        setTokenState(response.accessToken);
        setUser(response.usuario);
        setAccessToken(response.accessToken, response.usuario);
        localStorage.setItem(
          LOCAL_STORAGE_USER_KEY,
          JSON.stringify(response.usuario),
        );

        toast.success('Cuenta institucional creada con éxito');
        router.push('/catalogo');
      } catch (error: unknown) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Error al registrar usuario';
        toast.error(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout().catch(() => {});
    } finally {
      setUser(null);
      setTokenState(null);
      setAccessToken(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      toast.info('Sesión cerrada correctamente');
      router.push('/login');
      setIsLoading(false);
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.refresh();
      setTokenState(response.accessToken);
      setUser(response.usuario);
      setAccessToken(response.accessToken, response.usuario);
      localStorage.setItem(
        LOCAL_STORAGE_USER_KEY,
        JSON.stringify(response.usuario),
      );
    } catch {
      setUser(null);
      setTokenState(null);
      setAccessToken(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      router.push('/login');
    }
  }, [router]);

  // Helpers RBAC computados
  const isSuperAdmin = useMemo(() => user?.rol === 'SUPERADMIN', [user]);
  const isGestor = useMemo(
    () => user?.rol === 'GESTOR_ESPACIO' || user?.rol === 'SUPERADMIN',
    [user],
  );
  const isDocenteOrAdmin = useMemo(
    () =>
      user?.rol === 'DOCENTE' ||
      user?.rol === 'ADMINISTRATIVO' ||
      user?.rol === 'SUPERADMIN',
    [user],
  );
  const isEstudiante = useMemo(() => user?.rol === 'ESTUDIANTE', [user]);

  const hasRole = useCallback(
    (...roles: RolUsuario[]): boolean => {
      if (!user) return false;
      if (user.rol === 'SUPERADMIN') return true;
      return roles.includes(user.rol);
    },
    [user],
  );

  const inhabilitadoParaReservar = useMemo(
    () => user?.inhabilitadoParaReservar === true,
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshSession,
      isSuperAdmin,
      isGestor,
      isDocenteOrAdmin,
      isEstudiante,
      hasRole,
      inhabilitadoParaReservar,
    }),
    [
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      isSuperAdmin,
      isGestor,
      isDocenteOrAdmin,
      isEstudiante,
      hasRole,
      inhabilitadoParaReservar,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
