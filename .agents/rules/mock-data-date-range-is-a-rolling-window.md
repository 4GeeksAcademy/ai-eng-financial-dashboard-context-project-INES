# Nombre de la regla
`mock-data-date-range-is-a-rolling-window-not-a-fixed-year`

## Alcance
Aplica cuando un agente va a: (a) escribir o modificar un test backend que
filtre por fecha, (b) razonar sobre "qué datos existen" en un rango
específico, o (c) tocar `_year_for_month` / `generate_mock_movements` en
`backend/app/routes.py`.

## Justificación
`seed=42` da la impresión de que todo el dataset es 100% determinista y
estable en el tiempo, pero solo fija la secuencia de `random` — las fechas
resultantes dependen del reloj del sistema en el momento de la llamada. Esto
ya rompió silenciosamente un test existente (ver evidencia).

## Evidencia
- `_year_for_month(month, today)` en `backend/app/routes.py:65-68`:
  ```python
  def _year_for_month(month: int, today: date) -> int:
      if month < today.month:
          return today.year
      return today.year - 1
  ```
- `backend/tests/test_routes.py:157-161` (`test_metrics_comparison_returns_delta_fields`)
  usa fechas hardcodeadas: `params={"start_date": "2025-03-01", "end_date":
  "2025-03-31"}`.
- Verificado ejecutando el generador en esta sesión (fecha del sistema:
  2026-09-06): el dataset real cubre **2025-09-02 a 2026-08-28**. Filtrar
  ese dataset por `2025-03-01..2025-03-31` devuelve **0 movimientos**
  (`calculate_net_value` sobre lista vacía = `0`). El test **pasa igual**
  porque solo verifica `set(payload.keys())`, nunca los valores calculados.

## Guía accionable específica para este proyecto
1. Nunca hardcodear fechas absolutas (`"2025-03-01"`, etc.) en tests,
   ejemplos de `curl`, o documentación contra este backend — se degradan
   silenciosamente con el paso de los meses.
2. Para tests de rango de fechas, calcular el rango en el momento de
   escribir el test usando `date.today()` con un offset relativo (ej.
   `date.today().replace(day=1) - timedelta(days=32)` para "el mes
   pasado"), no un literal string.
3. La próxima vez que se toque `backend/tests/test_routes.py`, corregir
   `test_metrics_comparison_returns_delta_fields` con este criterio y
   agregar una aserción sobre el valor de `delta_abs`/`current_period`, no
   solo sobre las llaves del payload — hoy el test no detectaría una
   regresión real en el cálculo de comparación.
