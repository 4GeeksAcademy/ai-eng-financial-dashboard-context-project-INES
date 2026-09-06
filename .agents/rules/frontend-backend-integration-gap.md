# Frontend/Backend Integration Gap

## ⚠️ Corrección (2026-09-06, verificada en vivo con la API corriendo)
Esta regla decía "el frontend solo llama un endpoint" y "7 de 9 sin usar".
Eso ya no es cierto: en algún punto de esta sesión (fuera de este agente —
el archivo cambió mientras se trabajaba en otra parte del repo) `App.tsx` se
reescribió para pedir **dos** endpoints en paralelo. Ver el detalle
actualizado abajo. Esto también resolvió por completo
`ui-period-label-hardcoded-vs-generated-data.md` — dejá esa regla marcada
como resuelta, no la sigas tratando como un problema abierto.

## Rule (verified by grep, not assumption)
The backend exposes 9 routes:
`/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`,
`/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`,
`/api/metrics/b2b`, `/api/metrics/b2c`
(Source: `backend/app/routes.py:243-391`, one `@router.get(...)` per route.)

The frontend now calls **two** of them, in parallel via `Promise.all`:
`fetchJson<FinancialMovement[]>("/api/metrics")` and
`fetchJson<MetricsFacets>("/api/metrics/facets")` — Source:
`frontend/src/App.tsx:36-39`. `/api/metrics/facets`'s `min_date`/`max_date`
now feed `formatPeriodLabel` (`frontend/src/lib/financial-utils.ts:82-86`)
to compute the header's period label — confirmed working: `npx tsc -b`,
`npx eslint .`, and `npx vitest run` (5 passed) all clean after this change.

All aggregation shown in the UI (KPI totals, monthly income/outcome, profit %) is
still computed **client-side** from the raw `/api/metrics` payload, in
`frontend/src/lib/financial-utils.ts:21-67` (`computeKPIs`, `computeMonthlyData`) —
it does NOT call `/api/metrics/summary` (which already does month-grouping
server-side, `backend/app/routes.py:268-284`) or `/api/metrics/comparison` or
`/api/metrics/alerts`.

## Why this matters
- Before implementing a new dashboard feature (e.g., top categories, alerts,
  period comparison), check whether the backend endpoint **already exists**
  (`backend/app/routes.py`) before writing new backend code — 6 of 9 endpoints
  (`/api/metrics/summary`, `/categories/top`, `/comparison`, `/alerts`,
  `/b2b`, `/b2c`) are currently unused by the UI and are the most likely
  candidates to wire up next.
- Do not duplicate server-side aggregation logic (e.g. `summarize_movements`,
  `backend/app/routes.py:161-187`) inside the frontend if the equivalent
  endpoint already exists — prefer calling `/api/metrics/summary` over
  extending `computeMonthlyData`.
- `business_type`, `category`, `operation_type`, and date-range filtering are
  all supported as query params server-side (see each route's `Query(...)`
  params in `backend/app/routes.py`) but the frontend currently sends **no
  query params at all** — there is no filter UI in `frontend/src/App.tsx` or
  any component under `frontend/src/components/dashboard/`.

## Unverified / to confirm with the user
`frontend/src/lib/mock-data.ts` defines a hardcoded `mockMovements` array
(`frontend/src/lib/mock-data.ts:3-73`) but is not imported by `App.tsx` or any
file found by grep in this session. Treat as likely dead code from the
original V0 scaffold (`git log`: commit `7661fa1 "Frontend from V0 with
components and types"`) — confirm before deleting.
