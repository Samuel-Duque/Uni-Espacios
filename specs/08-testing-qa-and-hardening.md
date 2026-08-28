# 🧪 Especificación 08: Estrategia de Testing, Pruebas de Estrés Concurrente y QA
**Documento:** `specs/08-testing-qa-and-hardening.md`  
**Épicas Relacionadas:** `EPIC-09`, `EPIC-04`, `EPIC-07`  
**Tareas del Taskboard:** `TSK-901`, `TSK-902`, `TSK-903`  
**Fase de Implementación:** Fases 2 y 5 (Días 8, 18, 19)  

---

## 📌 1. Pirámide de Pruebas y Aseguramiento de Calidad (QA)

El sistema **Uni-Espacios** implementa una suite de pruebas multinivel para garantizar cero fallos en producción, integridad referencial en el inventario y ausencia absoluta de doble reservas (*anti double-booking*):

```
       / \
      / E2E \       --> Playwright (Flujos completos de usuario)
     /-------\
    / Concurr \     --> Scripts de estrés (50 req simultáneas anti double-booking)
   /-----------\
  / Integración \   --> Supertest + NestJS TestModule
 /---------------\
/   Unitarias     \ --> Jest (Motor de colisiones, cálculo de horarios, Zod)
-------------------
```

---

## ⚙️ 2. Pruebas Unitarias del Motor de Disponibilidad (`TSK-901`)

Las pruebas unitarias del `DisponibilidadService` cubren todos los casos límite de intersección temporal:

```typescript
// backend/test/unit/disponibilidad.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DisponibilidadService } from '../../src/modules/disponibilidad/disponibilidad.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('DisponibilidadService - Pruebas Unitarias de Colisión', () => {
  let service: DisponibilidadService;
  let prisma: PrismaService;

  const mockTx: any = {
    espacio: { findUnique: jest.fn() },
    periodoAcademico: { findFirst: jest.fn() },
    claseFija: { findFirst: jest.fn() },
    reserva: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisponibilidadService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<DisponibilidadService>(DisponibilidadService);
  });

  it('debe lanzar ConflictException si existe solapamiento con una Clase Fija activa', async () => {
    mockTx.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
    mockTx.periodoAcademico.findFirst.mockResolvedValue({ id: 10, estado: 'ACTIVO' });
    mockTx.claseFija.findFirst.mockResolvedValue({
      id: 5,
      asignatura: 'Física I',
      horaInicio: '08:00',
      horaFin: '10:00',
    });

    const tIni = new Date('2026-09-07T08:30:00Z');
    const tFin = new Date('2026-09-07T09:30:00Z');

    await expect(
      service.validarDisponibilidadTx(mockTx, 1, tIni, tFin)
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar ConflictException si existe una reserva previa APROBADA en el intervalo', async () => {
    mockTx.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
    mockTx.periodoAcademico.findFirst.mockResolvedValue(null);
    mockTx.reserva.findFirst.mockResolvedValue({
      id: 20,
      fechaInicio: new Date('2026-09-07T14:00:00Z'),
      fechaFin: new Date('2026-09-07T16:00:00Z'),
      estado: 'APROBADA',
    });

    const tIni = new Date('2026-09-07T15:00:00Z');
    const tFin = new Date('2026-09-07T17:00:00Z');

    await expect(
      service.validarDisponibilidadTx(mockTx, 1, tIni, tFin)
    ).rejects.toThrow(ConflictException);
  });

  it('debe permitir la reserva si el horario no colisiona con clases ni reservas', async () => {
    mockTx.espacio.findUnique.mockResolvedValue({ id: 1, estado: 'ACTIVO' });
    mockTx.periodoAcademico.findFirst.mockResolvedValue(null);
    mockTx.reserva.findFirst.mockResolvedValue(null);

    const tIni = new Date('2026-09-07T18:00:00Z');
    const tFin = new Date('2026-09-07T20:00:00Z');

    await expect(
      service.validarDisponibilidadTx(mockTx, 1, tIni, tFin)
    ).resolves.not.toThrow();
  });
});
```

---

## 🔥 3. Pruebas de Concurrencia Extrema y Anti Double-Booking (`TSK-902`)

Para garantizar que el aislamiento transaccional `Serializable` en MariaDB previene colisiones bajo concurrencia masiva, se ejecuta una prueba de estrés simulada:

### 3.1 Script de Concurrencia (`scripts/test-concurrency.ts`)
* **Escenario:** 50 solicitudes asíncronas simultáneas (`Promise.all`) intentando reservar o aprobar la misma aula (`espacioId: 1`) exactamente para la misma franja horaria (`2026-10-15T10:00:00Z` a `2026-10-15T12:00:00Z`).
* **Criterio de Aceptación Innegociable:**
  * Exactamente **1 solicitud** debe responder con código `HTTP 201 Created` o `HTTP 200 OK`.
  * Las **49 solicitudes restantes** deben responder con código `HTTP 409 Conflict`.
  * La base de datos debe contener **exactamente 1 registro** en estado `APROBADA` para esa franja.

```typescript
// scripts/test-concurrency.ts
import axios from 'axios';

async function runConcurrencyTest() {
  const URL = 'http://localhost:4000/api/reservas';
  const TOKEN = 'Bearer <JWT_USUARIO_VALIDO>';
  const payload = {
    espacioId: 1,
    fechaInicio: '2026-10-15T10:00:00.000Z',
    fechaFin: '2026-10-15T12:00:00.000Z',
    motivo: 'Prueba de concurrencia anti-solapamiento',
  };

  console.log('🚀 Lanzando 50 solicitudes concurrentes simultáneas...');
  const promises = Array.from({ length: 50 }).map(() =>
    axios
      .post(URL, payload, { headers: { Authorization: TOKEN } })
      .then((res) => ({ status: res.status, data: res.data }))
      .catch((err) => ({
        status: err.response?.status || 500,
        error: err.response?.data?.message,
      }))
  );

  const results = await Promise.all(promises);
  const exitosas = results.filter((r) => r.status === 201);
  const conflictos = results.filter((r) => r.status === 409);

  console.log(`✅ Reservas Aprobadas / Creadas: ${exitosas.length}`);
  console.log(`🛡️ Conflictos Detectados y Rechazados (409): ${conflictos.length}`);

  if (exitosas.length === 1 && conflictos.length === 49) {
    console.log('🎉 ¡TEST EXITOSO! Motor transaccional 100% resistente a double-booking.');
  } else {
    console.error('❌ FALLÓ LA PRUEBA: Ocurrió una condición de carrera.');
    process.exit(1);
  }
}

runConcurrencyTest();
```

---

## 🚦 4. Criterios de Puertas de Calidad (Quality Gates)

| Métrica / Herramienta | Umbral Requerido | Acción ante Incumplimiento |
| :--- | :---: | :--- |
| **TypeScript Compiler (`tsc`)** | 0 Errores | Rechazo inmediato del commit o build. |
| **ESLint (`npm run lint`)** | 0 Advertencias | Bloqueo de integración continua (CI). |
| **Cobertura de Código (Jest)** | >= 85% en `disponibilidad`, `verificaciones`, `reservas` | Bloqueo de paso a producción. |
| **Prueba de Carga Concurrente** | 100% de aislamiento (cero colisiones) | Revisión de nivel de aislamiento de transacciones en Prisma. |
