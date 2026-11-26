# Nombre de la regla
`seven-of-nine-endpoints-have-no-frontend-caller`

## Alcance
Aplica antes de escribir cualquier endpoint backend nuevo para una feature
del dashboard (filtros, comparaciones de período, alertas, top categorías),
y antes de agregar cualquier fetch nuevo en el frontend.

## Justificación
La mayoría de la superficie de API actual no tiene ningún consumidor. Un
agente que necesita una capacidad (ej. "comparar este mes contra el
anterior") puede terminar reimplementándola en el backend o en el cliente
sin saber que ya existe un endpoint listo y testeado para eso.

## ⚠️ Nombre desactualizado (verificado 2026-09-07 por `agents-rules-freshness`)
El título dice "seven" pero hoy son **seis** endpoints de negocio sin
consumidor — el frontend conectó `/api/metrics/facets` después de que esta
regla se escribiera (commit `eeece05`). No se renombró el archivo/regla
unilateralmente porque cambia su identidad y lo referencian otros documentos
por ese nombre; pendiente de confirmar con el usuario si renombrar a
`six-of-nine-...` o reformular sin el conteo en el nombre.

## Evidencia
- 9 rutas totales, confirmadas con
  `grep -n "@router\." backend/app/routes.py`: `/health`, `/api/metrics`,
  `/api/metrics/facets`, `/api/metrics/summary`,
  `/api/metrics/categories/top`, `/api/metrics/comparison`,
  `/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`.
- Dos `fetch()` de todo el frontend, ambos vía el helper compartido
  `fetchJson<T>` (`frontend/src/App.tsx:20-26`), invocado en
  `frontend/src/App.tsx:37-38` contra `/api/metrics` y
  `/api/metrics/facets` — confirmado con
  `grep -rn "fetch(\|fetchJson" frontend/src`.
- Las **6** rutas de negocio que siguen sin usarse hoy:
  `/api/metrics/summary`, `/api/metrics/categories/top`,
  `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b`,
  `/api/metrics/b2c`. Fueron agregadas en los mismos commits backend-only
  originales (`959bc84` → `87e1942`, ver `git log --oneline`); `facets` fue
  la única de las 7 originales que después ganó un consumidor en el
  frontend.

## Guía accionable específica para este proyecto
1. Antes de escribir lógica de agregación/filtrado nueva en
   `backend/app/routes.py`, leer el archivo completo primero — es corto
   (392 líneas) y es más barato leerlo entero que duplicar una función que
   ya existe (`filter_movements`, `summarize_movements`,
   `build_top_categories`, `calculate_net_value`, `detect_outcome_alerts`
   ya cubren filtro, agregación por período, ranking y comparación).
2. Si el endpoint que se necesita ya existe, conectarlo desde el frontend
   (agregar el `fetch()` correspondiente) en vez de reimplementar el
   cálculo en `frontend/src/lib/financial-utils.ts`.
3. No asumir que los 7 endpoints sin uso son "trabajo pendiente que hay que
   terminar" ni "código muerto que hay que borrar" — no hay evidencia que
   resuelva la intención. Preguntar al usuario antes de una u otra acción
   masiva sobre ellos.
