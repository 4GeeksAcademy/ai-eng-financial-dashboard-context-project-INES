# Data Contract — Financial Metrics API

Contrato de datos consumido por el dashboard, organizado por funcionalidad.
Todo lo de abajo se verificó **en vivo** contra `GET /openapi.json` y
peticiones HTTP reales al backend corriendo (`uvicorn`, sin Docker, puerto
8000) el 2026-09-06 — no es una relectura del código Python. Ver
`../../verification.md` para el registro de sesiones de verificación
anteriores de esta misma auditoría.

Convención de estado: **✅ implementado** = el frontend ya lo consume hoy
(`frontend/src/App.tsx`). **📝 spec** = diseñado en `components.md`, sin
código todavía.

**Cómo validar los tipos de este directorio**: `npx tsc --noEmit` desde
`frontend/` **no revisa nada de `specs/`** — este directorio no está en el
`include` de `tsconfig.app.json` (confirmado inyectando un error de tipos
deliberado y viendo que el comando igual sale con éxito). Usar
`npx tsc -p specs --noEmit` desde `frontend/` (config en
`frontend/specs/tsconfig.json`), que sí falla si `api-types.ts` o
`param-types.ts` tienen un error real.

---

## Errores de validación (aplica a los 9 endpoints por igual)

FastAPI valida cada query param automáticamente. Verificado en vivo, no
asumido:

| Caso probado | Resultado real |
|---|---|
| `category=refunds` (fuera del enum) | **422**, `detail[0].msg`: `"Input should be 'suppliers', 'sales', 'operational', 'administrative' or 'others'"` |
| `threshold=-0.5` (viola `ge=0`) | **422**, `"Input should be greater than or equal to 0"` |
| `limit=21` (viola `le=20`) | **422**, `"Input should be less than or equal to 20"` |
| `limit=0` (viola `ge=1`) | **422**, `"Input should be greater than or equal to 1"` |
| `start_date=06-09-2026` (formato no ISO) | **422**, `"invalid character in year"` |
| `/api/metrics/comparison` sin `start_date`/`end_date` | **422**, dos entradas `"Field required"` |

Shape de **todo** error 422 (`HTTPValidationError`, ya en
`components.schemas` del OpenAPI real):
```ts
interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}
interface HTTPValidationError {
  detail: ValidationError[]
}
```

**Distinción crítica para la UI, verificada en vivo**: un rango de fechas
que no matchea ningún movimiento (ej. `start_date=2026-09-06&end_date=2026-01-01`,
invertidas) **no es un error** — devuelve `200` con `[]`. La UI nunca debe
tratar un array vacío como fallo; solo un status ≠ 2xx lo es.

---

## Funcionalidad 1: KPIs y gráficos mensuales — ✅ implementado

**Endpoint**: `GET /api/metrics` (verificado en `/docs`, confirmado
respondiendo 200 en vivo).

**Tipos** (ya en `frontend/src/lib/financial-types.ts:5-11`, en uso real):
```ts
interface FinancialMovement {
  create_date: string   // YYYY-MM-DD
  amount: number
  operation_type: 'income' | 'outcome'
  category: 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'
  business_type: 'B2B' | 'B2C'
}
```
Response: `FinancialMovement[]` (array plano, no paginado — confirmado:
360 movimientos en una sola respuesta).

**Parámetros** (ninguno enviado por el código actual, todos opcionales):
| Param | Tipo | Restricción |
|---|---|---|
| `start_date` | `string` (`YYYY-MM-DD`) | ninguna — fecha inválida → 422 |
| `end_date` | `string` (`YYYY-MM-DD`) | ninguna |
| `category` | enum de 5 valores | fuera del enum → 422 |
| `operation_type` | `'income' \| 'outcome'` | fuera del enum → 422 |

**Casos límite (verificados) y qué debe mostrar la UI**:
1. **Fetch falla (red o 5xx)** — ya manejado: `App.tsx:45-48` cachea con
   `.catch()` y muestra el banner rojo `"No se pudo cargar la informacion
   financiera..."`. Confirmado leyendo el código, no requiere cambio.
2. **Rango de fechas sin matches → `[]`** (ver arriba) — `computeKPIs([])`
   devuelve `{totalIncome:0, totalOutcome:0, profit:0, profitPercent:0}`
   (`financial-utils.ts:31`, la condición `totalIncome > 0 ? ... : 0` ya
   cubre división por cero) y `computeMonthlyData([])` devuelve `[]`, lo
   que ya dispara el estado `"No data available to display"` en ambos
   charts (`income-outcome-chart.tsx:73-77`,
   `profit-percent-chart.tsx:74-78`). **Verificado que ya funciona hoy**,
   no es un gap.

---

## Funcionalidad 2: Indicador de período — ✅ implementado

**Endpoint**: `GET /api/metrics/facets` (sin parámetros).

**Tipos**: el código real usa `MetricsFacets`
(`frontend/src/lib/financial-types.ts:27-33`):
```ts
interface MetricsFacets {
  operation_types: OperationType[]
  business_types: BusinessType[]
  categories: Category[]
  min_date: string // YYYY-MM-DD
  max_date: string // YYYY-MM-DD
}
```

⚠️ **Inconsistencia de nombres encontrada** (no corregida en este documento
a propósito — es un dato del contrato, no algo que deba silenciarse):
`frontend/specs/api-types.ts` define el **mismo shape** bajo el nombre
`FacetsResponse`, escrito antes de saber que `App.tsx` ya había adoptado
`MetricsFacets` como nombre. Son dos nombres para una sola respuesta real.
Antes de mover los tipos de `specs/` a `src/lib/` (pendiente, ver
`components.md`), hay que decidir cuál nombre gana y borrar el otro — no
dejar ambos.

**Casos límite**:
1. **`Promise.all` falla atómicamente** (`App.tsx:36-44`): si
   `/api/metrics/facets` falla pero `/api/metrics` responde bien (o
   viceversa), el `.catch()` de `Promise.all` descarta **ambos** — la UI
   muestra el banner de error genérico aunque una de las dos peticiones sí
   tenía datos usables. Verificado leyendo el código (`Promise.all`, no
   `Promise.allSettled`). **Gap real, no corregido todavía**: la UI podría
   mostrar los KPIs igual y solo perder el label de período, en vez de
   ocultar todo.
2. **`min_date === max_date`** (dataset de un solo día — no ocurre hoy con
   el generador mock, pero el tipo lo permite): `formatPeriodLabel` ya lo
   maneja (`financial-utils.ts:85`: `start === end ? start : ...`), muestra
   un solo mes sin guión. Verificado en el código, no es un gap.

---

## Funcionalidad 3: Filtros — 📝 spec (`FilterBar`, ver `components.md`)

**Endpoints**: `GET /api/metrics/facets` (para poblar opciones) + agrega
params a `GET /api/metrics` (y, si se implementan, a los de Alertas/Top
Categorías).

**Tipos** (`frontend/specs/param-types.ts:23-32`):
```ts
interface DateRangeFilter {
  start_date?: string // YYYY-MM-DD, límite inferior inclusive
  end_date?: string   // YYYY-MM-DD, límite superior inclusive
}
```
Más `Category`, `OperationType`, `BusinessType` de `api-types.ts:20-32`.

**Restricciones** (verificadas en vivo, tabla de errores arriba):
`category`/`operation_type`/`business_type` fuera de su enum → 422;
`start_date`/`end_date` con formato no `YYYY-MM-DD` → 422; **no hay
validación de que `start_date <= end_date`** — una selección invertida es
válida para la API y devuelve `[]`.

**Casos límite y qué debe mostrar la UI**:
1. **Usuario invierte el rango de fechas en el date picker** — la API
   responde `200` con `[]`, no un error. La UI debe mostrar el mismo
   estado "sin datos" que un rango sin matches, **no** un mensaje de error
   ni bloquear el filtro — verificado que la API no distingue "inválido" de
   "vacío por elección del usuario".
2. **Usuario intenta forzar un valor de categoría no listado** (ej.
   manipulando la URL o un bug de UI que envíe un typo) — 422 con
   `HTTPValidationError`. La UI debe capturarlo como error de red genérico
   (mismo camino que un 5xx), no crashear parseando `response.json()` como
   si fuera `FinancialMovement[]`.

---

## Funcionalidad 4: Alertas de gasto — 📝 spec (`AlertsPanel`, ver `components.md`)

**Endpoint**: `GET /api/metrics/alerts`.

**Tipos** (`frontend/specs/api-types.ts` / `param-types.ts`):
```ts
interface AlertsParams {
  threshold?: number   // >= 0, default 0.3 en el backend
  start_date?: string
  end_date?: string
}
interface AlertEntry {
  period: string           // formato depende de group_by: YYYY-MM-DD | YYYY-Www | YYYY-MM
  outcome_total: number
  baseline_average: number
  increase_ratio: number   // fracción, ej. 0.4735 = 47.35%
}
type AlertsResponse = AlertEntry[]
```

**Restricciones verificadas en vivo**: `threshold < 0` → 422
(`"Input should be greater than or equal to 0"`). Sin tope superior — un
`threshold` de `100` es válido (simplemente no generará alertas nunca,
comportamiento del algoritmo, no un error de la API).

**Casos límite y qué debe mostrar la UI**:
1. **`AlertsResponse` vacío** (`[]`) — es una respuesta `200` válida, no un
   error: significa que ningún período superó el umbral. La UI debe
   mostrar `"No se detectaron anomalías de gasto en este período."`
   (ya especificado en `components.md`), nunca un estado de error.
2. **`threshold=0`** — verificado por lectura de
   `detect_outcome_alerts` (`backend/app/routes.py:219-240`): con umbral
   0, casi cualquier período con outcome por encima del promedio histórico
   cuenta como alerta, así que la respuesta puede tener **casi tantas
   entradas como períodos** (ej. 11 de 12 meses). La UI no debe asumir que
   "alertas" implica "pocos resultados" — si se implementa scroll/paginación
   para la lista, este es el caso que la ejercita.

---

## Funcionalidad 5: Ranking de categorías — 📝 spec (`TopCategoriesList`, ver `components.md`)

**Endpoint**: `GET /api/metrics/categories/top`.

**Tipos**:
```ts
interface TopCategoriesParams {
  operation_type?: OperationType  // default 'outcome' en el backend
  limit?: number                  // 1-20, default 5
  start_date?: string
  end_date?: string
}
interface CategoryEntry {
  category: Category
  operation_type: OperationType
  total_amount: number
}
type TopCategoriesResponse = CategoryEntry[]
```

**Restricciones verificadas en vivo**: `limit=21` → 422
(`"Input should be less than or equal to 20"`); `limit=0` → 422
(`"Input should be greater than or equal to 1"`). Rango válido: `1-20`.

**Casos límite y qué debe mostrar la UI**:
1. **`limit` pedido es mayor a las categorías disponibles** — verificado
   en vivo: `limit=20&operation_type=income` devolvió **2** entradas
   (`sales`, `others`), no 20 ni rellenas con ceros. La UI **no debe
   asumir** que la respuesta siempre tiene exactamente `limit` elementos —
   renderizar `categories.length` filas, no un `Array(limit).fill(...)`.
2. **`operation_type=income` con `limit=1`** — devuelve una sola entrada
   (probablemente `sales`, la categoría dominante de income por
   construcción del generador: 90% de probabilidad,
   `backend/app/routes.py:79`). La UI debe seguir mostrando el layout de
   "ranking" con una sola fila sin romper el diseño (ej. la barra de
   progreso relativa al máximo, `total_amount / categories[0].total_amount`,
   da `100%` con un solo elemento — verificar que no divida por cero si
   `categories` llega vacío, caso ya cubierto por el estado vacío general).

---

## Endpoints sin funcionalidad asignada todavía

`GET /api/metrics/summary`, `GET /api/metrics/comparison`,
`GET /api/metrics/b2b`, `GET /api/metrics/b2c` existen, están testeados en
el backend, y no tienen ningún componente ni spec definido en este
directorio. No se documentan casos límite para ellos acá porque no hay una
funcionalidad concreta que los use todavía — ver
`.agents/rules/seven-of-nine-endpoints-have-no-frontend-caller.md` antes de
diseñar una nueva feature que los necesite, para no reimplementar lo que ya
existe del lado del servidor.
