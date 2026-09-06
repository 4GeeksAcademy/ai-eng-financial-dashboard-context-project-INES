# Nombre de la regla
`ui-period-label-hardcoded-vs-generated-data`

## Alcance
Aplica cuando un agente va a: (a) tocar `frontend/src/App.tsx` o
`dashboard-header.tsx`, o (b) razonar sobre "qué período de datos está
viendo el usuario" para cualquier feature nueva (filtros, comparaciones,
exportes).

## Justificación
La UI le informa al usuario un período fijo que no se deriva de los datos
reales que el backend genera. Verifiqué en vivo que ese período es falso
hoy, y por construcción del backend será falso la mayor parte del tiempo
(ver `[[mock-data-date-range-is-a-rolling-window-not-a-fixed-year]]`).

## Evidencia
- `frontend/src/App.tsx:49`: `<DashboardHeader period="2024 - Full Year" />`
  (hardcodeado).
- `frontend/src/components/dashboard/dashboard-header.tsx:7`: mismo default
  hardcodeado (`period = '2024 — Full Year'`).
- Ejecuté `generate_mock_movements(seed=42)` en esta sesión (fecha del
  sistema: 2026-09-06): rango real devuelto = **2025-09-02 a 2026-08-28**,
  por el cálculo de `_year_for_month` en
  `backend/app/routes.py:65-68` (`if month < today.month: return
  today.year; else: return today.year - 1`), que ata el año de cada mes a
  la fecha actual del sistema.

## Guía accionable específica para este proyecto
1. No "corregir" el string cambiándolo a otro año fijo (ej. "2025" o "2026")
   — eso solo reproduce el mismo bug con otra fecha de vencimiento.
2. Si se toca este componente, derivar el label de `min_date`/`max_date`
   reales del backend, disponibles hoy sin usar en
   `GET /api/metrics/facets` → `MetricsFacets.min_date` /
   `MetricsFacets.max_date` (`backend/app/routes.py:150-158,262-265`).
3. Si se agrega esta lógica, actualizar también
   `frontend/src/lib/financial-types.ts` con un tipo para `MetricsFacets` si
   no existe, siguiendo el patrón de duplicación manual descrito en
   `[[financial-movement-type-is-manually-duplicated-across-python-and-typescript]]`.
