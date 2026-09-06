# System Patterns

## Backend: stateless mock generation per request
Every route handler independently calls
`generate_mock_movements(seed=42)` (e.g. `backend/app/routes.py:255, 264,
277, 295, 311, 350, 370, 386`) rather than sharing one generated dataset. The
fixed seed makes results deterministic and reproducible across calls, but
means the "data source" is regenerated (not fetched/cached) on every single
HTTP request. There is no shared state module, no dependency-injected data
service — this is a deliberate simplicity choice, not an oversight to "fix"
by adding caching, unless asked.

## Backend: functional core, thin routes
Pure functions (`filter_movements`, `summarize_movements`,
`build_top_categories`, `calculate_net_value`, `detect_outcome_alerts` — all
in `backend/app/routes.py:107-240`) contain all business logic and are
directly unit-tested (`backend/tests/test_routes.py`). Route handlers
(`backend/app/routes.py:243-391`) are thin wrappers: generate data, call
pure functions, return. New backend logic should follow this same shape —
pure function first, then a thin route.

## Frontend: derive-on-client pattern
`App.tsx` fetches raw movements once (`frontend/src/App.tsx:15-21`) and
derives all view state client-side via pure functions in
`frontend/src/lib/financial-utils.ts` (`computeKPIs`, `computeMonthlyData`).
This mirrors the backend's "pure function + thin caller" shape and is the
place new client-side aggregations belong — see
`[[frontend-backend-integration-gap]]` for the tension between this pattern
and the fact that equivalent aggregation already exists server-side
(`summarize_movements`, `backend/app/routes.py:161-187`).

## Frontend: component structure
- `frontend/src/components/dashboard/*` — feature components specific to this
  dashboard (`dashboard-header.tsx`, `kpi-row.tsx`, `kpi-card.tsx`,
  `income-outcome-chart.tsx`, `profit-percent-chart.tsx`).
- `frontend/src/components/ui/*` — generic shadcn/ui primitives
  (`card.tsx`, `skeleton.tsx`), following the shadcn convention of
  `data-slot` attributes and a `cn()`-based `className` merge
  (`frontend/src/components/ui/card.tsx:6-14`).
- Every dashboard component accepts a `loading?: boolean` prop and renders a
  `<Skeleton>` fallback when true (verified in `kpi-card.tsx:37-50`,
  `income-outcome-chart.tsx:50-62`, `profit-percent-chart.tsx:51-63`) — this
  is a consistent, repeated convention: new dashboard components should
  follow the same loading-skeleton shape.
- Chart tooltips are custom-rendered (`CustomTooltip` function defined inline
  in both `income-outcome-chart.tsx:33-47` and
  `profit-percent-chart.tsx:32-48`) rather than using Recharts' default
  tooltip — this pattern is duplicated across the two files, not extracted
  into a shared component. Worth extracting if a third chart is added.

## Type duplication across the language boundary
`FinancialMovement` and its literal-union field types (`OperationType`,
`Category`, `BusinessType`) are defined independently in:
- `backend/app/routes.py:11-27` (Python/Pydantic)
- `frontend/src/lib/financial-types.ts:1-11` (TypeScript)
No code generation or shared schema connects them. Any backend schema change
requires a manual, matching edit on the frontend side (see
`[[backend-data-model]]`).
