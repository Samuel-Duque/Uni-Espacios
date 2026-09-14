# 🚀 Guía de Ejecución — Uni-Espacios

> Sistema Integral de Gestión y Reserva de Espacios Físicos  
> Politécnico Colombiano Jaime Isaza Cadavid

---

## Requisitos Previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 20.x | https://nodejs.org |
| npm | 10.x (incluido con Node) | — |
| Docker Desktop | Cualquier versión reciente | https://www.docker.com/products/docker-desktop |

---

## Estructura del Proyecto

```
Uni-Espacios/
├── backend/      → API REST (NestJS + Prisma)
├── frontend/     → Aplicación Web (Next.js 16)
└── EJECUTAR.md   → Este archivo
```

---

## Paso 1 — Iniciar Docker Desktop

Abre **Docker Desktop** desde el menú de inicio de Windows y espera a que el ícono de la ballena en la barra de tareas deje de animarse y muestre **"Docker Desktop is running"**.

---

## Paso 2 — Levantar la Base de Datos (MariaDB)

Abre una terminal PowerShell y ejecuta:

```powershell
docker run -d `
  --name uni-espacios-db `
  -e MYSQL_ROOT_PASSWORD=root `
  -e MYSQL_DATABASE=uniespacios_db `
  -e MYSQL_USER=uniespacios_user `
  -e "MYSQL_PASSWORD=UniEspacios2026Secure!" `
  -p 3306:3306 `
  mariadb:11
```

> **Nota:** Si el contenedor ya existe de una ejecución anterior, usa este comando en su lugar:
> ```powershell
> docker start uni-espacios-db
> ```

Espera ~15 segundos para que MariaDB termine de inicializar.

---

## Paso 3 — Configurar Permisos de Base de Datos (solo la primera vez)

```powershell
docker exec uni-espacios-db mariadb -u root -proot -e "GRANT ALL PRIVILEGES ON *.* TO 'uniespacios_user'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"
```

---

## Paso 4 — Migraciones y Datos de Prueba (solo la primera vez)

```powershell
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

Salida esperada del seed:
```
✅ 4 usuarios institucionales creados/actualizados.
✅ Sede cargada: Sede Medellín - Poblado
✅ 3 bloques institucionales configurados.
✅ 6 espacios y sus catálogos de inventario configurados.
✅ Periodo Académico Semilla: 2026-2 (ACTIVO)
✅ 3 clases fijas recurrentes configuradas.
🎉 Seed de persistencia completado exitosamente.
```

---

## Paso 5 — Iniciar el Backend

Abre una **terminal nueva** y ejecuta:

```powershell
cd backend
npm run start:dev
```

El servidor estará listo cuando aparezca:

```
🚀 Servidor ejecutándose en http://localhost:3001/api
📑 Documentación Swagger disponible en http://localhost:3001/api/docs
```

---

## Paso 6 — Iniciar el Frontend

Abre **otra terminal nueva** y ejecuta:

```powershell
cd frontend
npm run dev
```

El servidor estará listo cuando aparezca:

```
▲ Next.js 16.3.3
- Local: http://localhost:3000
✓ Ready in ...ms
```

---

## URLs del Sistema

| Servicio | URL |
|---|---|
| **Aplicación Web** | http://localhost:3000 |
| **API REST** | http://localhost:3001/api |
| **Documentación Swagger** | http://localhost:3001/api/docs |

---

## Usuarios de Prueba

Todos los usuarios usan la misma contraseña: **`Poli2026*!`**

| Email | Rol | Acceso |
|---|---|---|
| `admin@elpoli.edu.co` | SUPERADMIN | Panel de administración completo |
| `gestor.ingenieria@elpoli.edu.co` | GESTOR_ESPACIO | Gestión y aprobación de reservas |
| `docente.ciencias@elpoli.edu.co` | DOCENTE | Catálogo y reservas |
| `estudiante.demo@elpoli.edu.co` | ESTUDIANTE | Catálogo y reservas |

---

## Ejecuciones Posteriores

Desde la segunda vez en adelante, solo necesitas:

**Terminal 1 — Base de datos:**
```powershell
docker start uni-espacios-db
```

**Terminal 2 — Backend:**
```powershell
cd backend
npm run start:dev
```

**Terminal 3 — Frontend:**
```powershell
cd frontend
npm run dev
```

---

## Detener el Proyecto

```powershell
# Detener el contenedor de base de datos
docker stop uni-espacios-db
```

Los servidores de backend y frontend se detienen con `Ctrl + C` en cada terminal.

---

## Solución de Problemas Comunes

**Error: `Can't reach database server at localhost:3306`**  
→ Docker Desktop no está corriendo o el contenedor no fue iniciado. Ejecuta `docker start uni-espacios-db`.

**Error: `Failed to fetch` en el login**  
→ El backend no está corriendo. Verifica que `npm run start:dev` esté activo en la terminal del backend.

**Error al correr migraciones: `shadow database denied`**  
→ Ejecuta el paso 3 (permisos) antes de volver a intentar las migraciones.

**Puerto 3000 o 3001 ya en uso**  
→ Identifica y termina el proceso que lo ocupa:
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```
