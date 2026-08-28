# 🗺️ Guía y Directorio de Planificación (Planning)
**Proyecto:** Sistema de Gestión, Reserva de Espacios Físicos y Control de Inventario  
**Institución:** Politécnico Colombiano Jaime Isaza Cadavid  
**Metodología:** Domain-First Spec-Driven Development (SDD)  
**Stack Principal:** Next.js 14+ (App Router) | NestJS 10+ | TypeScript | Prisma ORM | MariaDB 11.x | Zod | TanStack Query v5  

---

## 📌 Propósito de este Directorio

Este directorio contiene toda la documentación técnica, arquitectónica, operativa y de requerimientos para el diseño, desarrollo y despliegue del sistema **Uni-Espacios**. Funciona como la fuente única de verdad para desarrolladores y agentes de IA.

---

## 📑 Índice de Documentos de Planificación

| Documento | Descripción | Enlace |
| :--- | :--- | :--- |
| **Contexto Global del Proyecto** | Misión institucional, jerarquía física, reglas de dominio, ciclo de inventario Check-In / Check-Out y matriz RBAC. | [PROJECT_CONTEXT.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/PROJECT_CONTEXT.md) |
| **Arquitectura del Sistema** | Vista integral de capas (NestJS + Next.js), modelo relacional ERD completo con inventario, motor anti-solapamiento y seguridad. | [architecture-overview.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/architecture-overview.md) |
| **Tablero de Tareas (Taskboard)** | Desglose de las 9 épicas del proyecto, historias de usuario y tareas técnicas con criterios de aceptación. | [taskboard.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/taskboard.md) |
| **Plan Fase por Fase (Día a Día)** | Cronograma de ejecución detallado día a día (20 días laborales) agrupado en 5 fases secuenciales de desarrollo. | [phase-by-phase.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/phase-by-phase.md) |

---

## 🔄 Flujo de Trabajo y Metodología (Domain-First SDD)

Todo incremento o desarrollo de nueva funcionalidad debe seguir estrictamente este ciclo:

```
[1. Regla de Dominio] ➔ [2. Contrato / DTO (Zod)] ➔ [3. Persistencia (Prisma)] ➔ [4. Módulo NestJS] ➔ [5. UI Next.js + Query]
```

1. **Definir la Invariante de Dominio:** Identificar las entidades, relaciones e invariantes que aplican a la gestión institucional y de inventario.
2. **Especificar Contratos:** Crear los esquemas Zod de entrada/salida y derivar los tipos estáticos de TypeScript (utilizando `nestjs-zod`).
3. **Mapear a Base de Datos:** Actualizar el esquema de Prisma y generar las migraciones en MariaDB.
4. **Implementar Módulos NestJS:** Desarrollar servicios con inyección de dependencias, lógica transaccional y exponer controladores REST documentados con OpenAPI/Swagger.
5. **Consumo en Frontend Next.js:** Crear los Server Components y Client Components (mutaciones y queries en TanStack Query v5) integrando shadcn/ui y Tailwind CSS.

---

## 🚦 Definición de Terminado (Definition of Done - DoD)

Una tarea del [taskboard.md](file:///c:/Users/1/Desktop/Samuel/Uni-Espacios/planning/taskboard.md) se considera completada únicamente si cumple con:

- [ ] Tipado TypeScript estricto al 100% (cero uso de `any`).
- [ ] Validaciones de entrada y salida cubiertas con esquemas Zod.
- [ ] Operaciones de reserva, estado e inventario encapsuladas en `prisma.$transaction`.
- [ ] Pruebas unitarias o de integración en NestJS pasando satisfactoriamente.
- [ ] Frontend sincronizado con TanStack Query sin estados residuales o `useEffect` innecesarios.
- [ ] Verificación de inventario (Check-In / Check-Out) soportada en el flujo de reservas correspondiente.
- [ ] Interfaz responsiva y adaptada a estándares visuales institucionales del Politécnico.
