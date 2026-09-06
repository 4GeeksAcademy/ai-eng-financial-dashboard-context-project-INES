# Nombre de la regla
`client-side-aggregation-duplicates-server-side-endpoint-with-different-contract`

## Alcance
Aplica cuando un agente va a: (a) modificar `computeMonthlyData` o
`computeKPIs` en `frontend/src/lib/financial-utils.ts`, o (b) decidir si
conectar el frontend a `/api/metrics/summary`.

## Justificación
Ya existe un endpoint que agrega por período en el servidor, pero el
frontend reimplementa la misma agregación en el cliente con un contrato de
datos distinto — no son intercambiables sin adaptación explícita. Tratar
ambos como "lo mismo" (por ejemplo, al decidir cuál mantener) llevaría a un
cambio de comportamiento no intencionado.

## Evidencia
- `summarize_movements` (`backend/app/routes.py:161-187`), expuesto vía
  `GET /api/metrics/summary` (`backend/app/routes.py:268-284`), devuelve
  `MetricsSummaryItem`: `{period: str, income: float, outcome: float, net:
  float}` (`backend/app/routes.py:38-43`). `period` puede ser
  `YYYY-MM-DD`, `YYYY-Www`, o `YYYY-MM` según el parámetro `group_by`.
- `computeMonthlyData` (`frontend/src/lib/financial-utils.ts:36-67`),
  calculado en el navegador a partir de `/api/metrics` crudo, devuelve
  `MonthlyDataPoint`: `{month: string, income: number, outcome: number,
  profitPercent: number}` (`frontend/src/lib/financial-types.ts:20-25`).
  `month` siempre es una etiqueta legible tipo `"Jan 2024"`, y siempre
  agrupa por mes (no soporta `day`/`week`).
- Los campos `net` (backend) y `profitPercent` (frontend) no son el mismo
  dato ni se derivan uno del otro sin un cálculo adicional.

## Guía accionable específica para este proyecto
1. Si se decide migrar el frontend a usar `/api/metrics/summary` en vez de
   `computeMonthlyData`, no asumir que es un reemplazo directo — decidir
   explícitamente si `profitPercent` se sigue calculando en el cliente a
   partir de `net`/algún `income` adicional que habría que pedir al
   backend, o si se le pide a `MetricsSummaryItem` que incluya
   `profitPercent` (requeriría tocar `backend/app/routes.py:38-43` y
   `summarize_movements`).
2. No hacer este cambio de contrato como parte de otro fix — es un cambio
   de arquitectura (mover agregación de cliente a servidor) que merece su
   propio commit y su propia validación con `pytest -q` +
   `npx vitest run`.
3. Si se necesita agrupar por semana o día en la UI (algo que
   `computeMonthlyData` no soporta hoy pero `summarize_movements` sí, vía
   `group_by`), es más barato conectar el endpoint existente que extender
   la función del cliente.
