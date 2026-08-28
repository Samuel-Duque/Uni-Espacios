# 🖥️ Especificación 07: Arquitectura Frontend Next.js 14+, TanStack Query y Componentes UI
**Documento:** `specs/07-frontend-architecture-and-ui.md`  
**Épicas Relacionadas:** `EPIC-01`, `EPIC-05`, `EPIC-06`, `EPIC-07`, `EPIC-08`, `EPIC-09`  
**Tareas del Taskboard:** `TSK-102`, `TSK-304`, `TSK-502`, `TSK-503`, `TSK-504`, `TSK-505`, `TSK-602`, `TSK-603`, `TSK-605`, `TSK-704`, `TSK-803`, `TSK-903`  
**Fase de Implementación:** Fases 1, 3 y 4 (Días 3, 9, 10, 11, 12, 13, 15, 16, 17)  

---

## 🏗️ 1. Estructura de Rutas de la Aplicación (Next.js App Router)

```
frontend/src/
├── app/
│   ├── (auth)/                           # Grupo de rutas públicas de autenticación
│   │   ├── layout.tsx                    # Layout centrado con branding institucional
│   │   ├── login/page.tsx                # Inicio de sesión con @elpoli.edu.co
│   │   └── register/page.tsx             # Registro institucional
│   ├── (dashboard)/                      # Grupo de rutas protegidas
│   │   ├── layout.tsx                    # Sidebar, Navbar institucional, Breadcrumbs y UserMenu
│   │   ├── catalogo/page.tsx             # Catálogo interactivo de espacios con filtros facetados
│   │   ├── espacios/[id]/page.tsx        # Ficha de espacio, rejilla de disponibilidad e inventario
│   │   ├── reservas/
│   │   │   ├── page.tsx                  # "Mis Reservas" con pestañas por estado y cancelación
│   │   │   ├── nueva/page.tsx            # Formulario de solicitud de reserva
│   │   │   ├── [id]/check-in/page.tsx    # Interfaz de Check-In con lista de chequeo
│   │   │   └── [id]/check-out/page.tsx   # Interfaz de Check-Out con reporte de novedades
│   │   ├── gestion/
│   │   │   ├── solicitudes/page.tsx      # Bandeja de aprobación para GESTOR_ESPACIO
│   │   │   └── novedades/page.tsx        # Panel de auditoría de implementos dañados/faltantes
│   │   └── admin/                        # Panel restringido a SUPERADMIN
│   │       ├── sedes/page.tsx
│   │       ├── periodos/page.tsx
│   │       └── clases-fijas/page.tsx
│   ├── layout.tsx                        # Root layout (QueryClientProvider, AuthProvider, Toaster)
│   └── page.tsx                          # Landing page institucional
├── components/
│   ├── ui/                               # Primitivas de shadcn/ui (Button, Dialog, Badge, Card, etc.)
│   ├── catalog/                          # FacetedFilters, EspacioCard, CategoryBadge
│   ├── availability/                     # AvailabilityGrid, TimeSlotBadge
│   ├── inventory/                        # InventoryChecklist, ItemStatusRadio, DamageReportDialog
│   └── reservations/                     # ReservationForm, ReservationStatusBadge
├── hooks/                                # Custom hooks (useEspacios, useDisponibilidad, useReservas)
├── lib/                                  # queryKeys factory, axiosClient, utils
└── middleware.ts                         # Protección de rutas y redirecciones por rol
```

---

## ⚡ 2. Estado Servidor con TanStack Query v5 (`TSK-502`)

### 2.1 Factory Centralizado de Query Keys (`queryKeys.ts`)
```typescript
// frontend/src/lib/queryKeys.ts
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  sedes: {
    all: ['sedes'] as const,
  },
  bloques: {
    bySede: (sedeId?: number) => ['bloques', { sedeId }] as const,
  },
  espacios: {
    all: ['espacios'] as const,
    list: (filters: Record<string, any>) => ['espacios', 'list', filters] as const,
    detail: (id: number) => ['espacios', 'detail', id] as const,
    disponibilidad: (id: number, fecha: string) => ['espacios', 'disponibilidad', id, fecha] as const,
    inventario: (id: number) => ['espacios', 'inventario', id] as const,
  },
  reservas: {
    misReservas: (estado?: string) => ['reservas', 'mis-reservas', { estado }] as const,
    gestion: (estado?: string) => ['reservas', 'gestion', { estado }] as const,
    detail: (id: number) => ['reservas', 'detail', id] as const,
    verificaciones: (id: number) => ['reservas', 'verificaciones', id] as const,
  },
  novedades: {
    all: ['novedades'] as const,
  },
  periodos: {
    all: ['periodos'] as const,
  },
};
```

### 2.2 Configuración Global del `QueryClient`
```typescript
// frontend/src/components/providers/query-provider.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutos de frescura para datos poco volátiles
            gcTime: 1000 * 60 * 10,    // 10 minutos de permanencia en caché
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

---

## 🎨 3. Paleta Visual Institucional y Componentes UI

El sistema adopta la identidad visual oficial del **Politécnico Colombiano Jaime Isaza Cadavid**:
* **Color Primario (Verde Institucional):** `#006837` / Tailwind `green-800` (`primary`).
* **Color Acento (Oro Institucional):** `#FFC72C` / Tailwind `amber-400` (`accent`).
* **Color Neutro / Fondo:** `#F8FAFC` / Tailwind `slate-50`.

### 3.1 Catálogo con Filtros Facetados (`TSK-503`, `TSK-504`)
* **Sincronización con URL:** Los filtros (sede, bloque, tipo, categoría de implementos) actualizan la query string de la URL (`?tipo=LABORATORIO&sedeId=1`) para permitir compartir búsquedas.
* **Tarjeta de Espacio (`EspacioCard`):**
  * Fotografía / Thumbnail ilustrativo del tipo de espacio.
  * Título destacado (`P40-201`) y Bloque/Sede.
  * Badges con iconos: Aforo (`👥 40 personas`), Categorías de Inventario (`📺 TV`, `🧪 Laboratorio`, `⚽ Balones`).
  * Botón directo a consultar disponibilidad y reservar.

### 3.2 Rejilla de Disponibilidad Horaria (`AvailabilityGrid`)
* Visualizador interactivo de 06:00 a 22:00:
  * **Verde (Libre):** Clickeable para seleccionar la hora deseada de inicio y fin.
  * **Rojo (Clase Fija):** Bloqueada con tooltip indicando nombre de asignatura y docente.
  * **Naranja (Reserva Aprobada):** Bloqueada por evento institucional previo.

---

## 📝 4. Formularios con React Hook Form + Zod (`TSK-602`)

```typescript
// frontend/src/components/reservations/reservation-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CrearReservaSchema, CrearReservaInput } from '@/schemas/reserva.schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function ReservationForm({ espacioId }: { espacioId: number }) {
  const queryClient = useQueryClient();
  const form = useForm<CrearReservaInput>({
    resolver: zodResolver(CrearReservaSchema),
    defaultValues: {
      espacioId,
      motivo: '',
      cantidadAsistentesEstimada: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CrearReservaInput) => {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al solicitar reserva');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('¡Solicitud de reserva radicada con éxito!');
      // Invalidar consultas relacionadas para sincronía inmediata
      queryClient.invalidateQueries({ queryKey: queryKeys.reservas.misReservas() });
      queryClient.invalidateQueries({ queryKey: queryKeys.espacios.disponibilidad(espacioId, '') });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
      {/* Campos de fecha, hora, motivo e implementos */}
    </form>
  );
}
```

---

## 🛡️ 5. Middleware de Protección de Rutas (`middleware.ts`)

```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  // 1. Proteger rutas del Dashboard
  const isDashboardRoute = pathname.startsWith('/catalogo') || 
                           pathname.startsWith('/espacios') || 
                           pathname.startsWith('/reservas') ||
                           pathname.startsWith('/gestion') ||
                           pathname.startsWith('/admin');

  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Redirigir a usuarios logueados fuera de /login o /register
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```
