/**
 * TSK-1005: Route Handler server-side para emitir cookies de sesión con httpOnly.
 *
 * El cliente llama a POST /api/session después de cada login, register y refresh
 * para que el servidor establezca las cookies de forma segura (httpOnly + secure).
 * El middleware Edge de Next.js las lee en cada request para proteger las rutas.
 *
 * Las cookies de sesión NO se escriben desde JS del cliente (document.cookie)
 * con el fin de evitar su exposición ante ataques XSS.
 */
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface SessionPayload {
  token: string | null;
  user?: {
    id: number;
    rol: string;
  } | null;
}

export async function POST(req: NextRequest) {
  const body: SessionPayload = await req.json().catch(() => ({ token: null, user: null }));
  const { token, user } = body;

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  // Opciones base compartidas por las tres cookies
  const baseOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/',
  } as const;

  if (token && user) {
    // Establecer cookies de sesión — mismo TTL que el accessToken (15 min)
    cookieStore.set('auth_token', token, { ...baseOptions, maxAge: 900 });
    cookieStore.set('user_role', user.rol, { ...baseOptions, maxAge: 900 });
    cookieStore.set('user_id', String(user.id), { ...baseOptions, maxAge: 900 });
  } else {
    // Limpiar cookies al hacer logout o cuando la sesión expire
    cookieStore.delete('auth_token');
    cookieStore.delete('user_role');
    cookieStore.delete('user_id');
  }

  return NextResponse.json({ ok: true });
}
