# Verification Log

Registro corto de sesiones de verificación contra el sistema real (no solo
lectura de código). Cada entrada dice qué se corrió, contra qué, y qué
resultado dio. No reemplaza `.agents/rules/` ni `memory-bank/` — es el
rastro de auditoría de *cómo* se verificó, para que la próxima persona no
tenga que repetir el trabajo desde cero.

---

## 2026-09-06 — Exploración de API contra backend real

**Cómo se levantó el backend**: no vía `docker compose` — directo con
`uvicorn app.main:app --host 0.0.0.0 --port 8000` desde un venv con
`pip install -r backend/requirements.txt`, cwd en `backend/`. (Cierra el ❓
que `.agents/rules/environment-setup.md` tenía sobre este comando exacto:
funciona, sin flags adicionales, sin `debugpy`.)

**Fuente de verdad usada**: `GET /openapi.json` del servidor corriendo
(no la lectura estática de `routes.py`) — más confiable porque refleja
exactamente lo que FastAPI expone, incluyendo tipos resueltos (`anyOf`,
enums) que no siempre son obvios leyendo los `Literal[...]` a mano.

### Mapa de endpoints (9 rutas, verificado en vivo)

| Método | Ruta | Parámetros | Respuesta 200 |
|---|---|---|---|
| GET | `/health` | — | `{status: string}` |
| GET | `/api/metrics` | `start_date`, `end_date`, `category` (enum), `operation_type` (enum) — todos opcionales | `FinancialMovement[]` |
| GET | `/api/metrics/facets` | — | `MetricsFacets` |
| GET | `/api/metrics/summary` | `group_by` (enum day/week/month, default month), + filtros de metrics + `business_type` | `MetricsSummaryItem[]` |
| GET | `/api/metrics/categories/top` | `operation_type` (default outcome), `limit` (default 5), + filtros de fecha/business_type | `TopCategoryItem[]` |
| GET | `/api/metrics/comparison` | `start_date`, `end_date` (**requeridos**), `business_type` opcional | `MetricsComparison` |
| GET | `/api/metrics/alerts` | `threshold` (default 0.3), `group_by` (default month), + filtros | `MetricsAlert[]` |
| GET | `/api/metrics/b2b` | igual que `/api/metrics` | `FinancialMovement[]` |
| GET | `/api/metrics/b2c` | igual que `/api/metrics` | `FinancialMovement[]` |

Modelos (`components.schemas` del OpenAPI real):
`FinancialMovement{create_date,amount,operation_type,category,business_type}`,
`MetricsFacets{operation_types,business_types,categories,min_date,max_date}`,
`MetricsSummaryItem{period,income,outcome,net}`,
`TopCategoryItem{category,operation_type,total_amount}`,
`MetricsComparison{current_period,previous_period,delta_abs,delta_pct}`,
`MetricsAlert{period,outcome_total,baseline_average,increase_ratio}`.

### Llamadas reales ejecutadas (no solo schema — valores reales)
Fecha del sistema al momento de correr: **2026-09-06**. Dataset real
devuelto por `/api/metrics`: 360 movimientos, rango `2025-09-02` a
`2026-08-28` (confirma `mock-data-date-range-is-a-rolling-window.md`: no es
un año fijo).

`/api/metrics/categories/top?operation_type=outcome&limit=3` devolvió
`others` como categoría #1 (`total_amount: 224428.44`). Esto contradice lo
que `backend-data-model.md` decía sobre `others` ser exclusiva de income —
**corregido en ese archivo** (ver commit/diff de esta sesión): `others` es
compartida entre income (10% de los income) y `OUTCOME_CATEGORIES`.

### Contraste con el frontend
`grep -rn "fetch(" frontend/src` → `frontend/src/App.tsx:21`
(`fetchJson<T>`). El frontend llama **2 de 9** endpoints:
`/api/metrics` y `/api/metrics/facets` (`App.tsx:36-39`, vía `Promise.all`).
Esto es un cambio real detectado a mitad de esta sesión de auditoría —
antes era 1 de 9 (ver corrección en
`.agents/rules/frontend-backend-integration-gap.md` y
`.agents/rules/seven-of-nine-endpoints-have-no-frontend-caller.md`).
Verificado que el cambio compila y pasa tests: `npx tsc -b` (sin salida),
`npx eslint .` (sin salida), `npx vitest run` → 5 passed.

### Búsqueda de "spec de PM" para contrastar wording
Se buscó explícitamente cualquier documento tipo PRD/spec/user-story en el
repo (`grep` por "product requirement", "user story", "acceptance
criteria", y `find` por nombres `*spec*`/`*PRD*`/`*requirements*.md`).
**Resultado: no existe tal documento.** Existe `frontend/specs/`, pero
contiene únicamente un `.gitkeep` (carpeta vacía, sin contenido que
contrastar). ❓ Si hay wording de PM en otro lugar (ticket externo, doc
fuera del repo), no está en este repo y no se puede verificar desde acá —
pedirlo explícitamente antes de asumir que no existe en absoluto.

Ante la ausencia de un spec de PM real, se usó `memory-bank/` como el
documento más cercano a una "spec" del proyecto, y se corrigieron ahí los
desajustes encontrados (no se tocó `backend/app/routes.py`, que es
correcto tal como está):
- `backend-data-model.md` — corregido el reparto de la categoría `others`.
- `frontend-backend-integration-gap.md`,
  `seven-of-nine-endpoints-have-no-frontend-caller.md`,
  `memory-bank/productContext.md` — actualizado el conteo de endpoints
  usados (1→2) tras el cambio detectado en `App.tsx`.
- `ui-period-label-hardcoded-vs-generated-data.md` — marcado como
  ✅ resuelto (el bug que describía ya no existe en el código).

### Qué no se hizo
- No se tocó ningún archivo de `backend/` ni `frontend/src` — todas las
  correcciones fueron en `.agents/rules/` y `memory-bank/` (la "spec"), tal
  como pidió la tarea.
- No se hizo `git commit` — el estándar de esta sesión es no commitear sin
  pedido explícito del usuario. Este archivo (`verification.md`) queda sin
  commitear, junto con los cambios de reglas/memory-bank.
- El proceso `uvicorn` usado para esta exploración es un proceso huérfano
  de una sesión anterior (PID preexistente, puerto 8000 ya ocupado al
  intentar levantar uno nuevo) — se reutilizó tal cual, no se reinició.
