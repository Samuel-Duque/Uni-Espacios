import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Obtener cookies de sesión
  const authToken = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isAuthenticated = !!(authToken || refreshToken);

  // 2. Rutas de autenticación pública (login / register)
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register');

  // Si el usuario ya está autenticado e intenta entrar a login/register, redirigir
  if (isAuthRoute && isAuthenticated) {
    if (userRole === 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (userRole === 'GESTOR_ESPACIO') {
      return NextResponse.redirect(new URL('/gestion', request.url));
    }
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }

  // 3. Verificación de Rutas Protegidas y Matriz RBAC

  // A. Módulo de Administración (Solo SUPERADMIN)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole && userRole !== 'SUPERADMIN') {
      // Acceso denegado: rol insuficiente -> Redirigir al catálogo
      return NextResponse.redirect(new URL('/catalogo', request.url));
    }
  }

  // B. Módulo de Gestión y Aprobaciones (GESTOR_ESPACIO o SUPERADMIN)
  if (pathname.startsWith('/gestion')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (
      userRole &&
      userRole !== 'GESTOR_ESPACIO' &&
      userRole !== 'SUPERADMIN'
    ) {
      return NextResponse.redirect(new URL('/catalogo', request.url));
    }
  }

  // C. Módulo de Reservas Personales (Cualquier usuario autenticado)
  if (pathname.startsWith('/reservas')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (.svg, .png, .jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
