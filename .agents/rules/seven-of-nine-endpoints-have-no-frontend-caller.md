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

## Evidencia
- 9 rutas totales, confirmadas con
  `grep -n "@router\." backend/app/routes.py`: `/health`, `/api/metrics`,
  `/api/metrics/facets`, `/api/metrics/summary`,
  `/api/metrics/categories/top`, `/api/metrics/comparison`,
  `/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`.
- Único `fetch()` de todo el frontend, confirmado con
  `grep -rn "fetch(" frontend/src` → 1 resultado:
  `frontend/src/App.tsx:16`, apuntando solo a `/api/metrics`.
- Las 6 rutas de negocio no usadas fueron agregadas en 6 commits
  backend-only consecutivos (`959bc84` "facets" → `2b5c237` "summary" →
  `be510b5` "top categories" → `5df15b4` "comparison" → `0c07552` "alerts"
  → `87e1942` "refactor filters"), sin ningún commit de frontend
  correspondiente en el mismo rango (`git log --oneline`).

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
