# Component Specs — Alerts, Top Categories, Filters

## Nota de procedencia (leer antes de implementar)

No existe ningún brief de PM en este repo. Se buscó explícitamente
(`find` por `*brief*`/`*PRD*`/`*spec*.md`, `grep` por lenguaje de producto)
— el único `*brief*` que aparece es `memory-bank/projectbrief.md`, y es un
documento de auditoría propio, no un brief de producto. Ver
`verification.md` para el registro de esa búsqueda anterior.

En ausencia de un brief, esta spec usa como única fuente de intención de
producto lo que sí es evidencia real: los tipos ya verificados contra la
API en `frontend/specs/api-types.ts` y `param-types.ts` (Fase 2), y los
componentes/convenciones que ya existen en `frontend/src/components/dashboard/`.
Cada ambigüedad de diseño que un brief normalmente resolvería está listada
en su propia sección **"Ambigüedad resuelta"** con la decisión tomada y el
razonamiento — son decisiones de esta spec, no requisitos de un PM, y se
pueden revertir si alguien con contexto de producto real dice lo contrario.

Componentes existentes hoy (para no repetir lo que ya está resuelto):
`dashboard-header.tsx`, `kpi-row.tsx`, `kpi-card.tsx`,
`income-outcome-chart.tsx`, `profit-percent-chart.tsx`. Todos siguen el
mismo patrón: reciben `data`/`metrics` + `loading?: boolean` por props, no
hacen fetch propio (el fetch vive en `App.tsx`), y muestran un `<Skeleton>`
cuando `loading` es `true` (ver `memory-bank/systemPatterns.md`). Los tres
componentes nuevos de abajo siguen ese mismo patrón — no hay razón para
inventar uno distinto.

---

## 1. Funcionalidad: Filtros del dashboard

**Por qué ahora**: `/api/metrics/facets` ya se consume desde `App.tsx`
(commit `71c56f9`) pero solo para el label de período — sus otros tres
campos (`operation_types`, `business_types`, `categories`) no se usan.
`frontend-backend-integration-gap.md` ya señalaba que "el frontend
actualmente no envía ningún query param" — este componente es lo que
cierra esa brecha sin hardcodear las opciones válidas en el frontend.

### `FilterBar`
Archivo: `frontend/src/components/dashboard/filter-bar.tsx`

```ts
import type { FacetsResponse, Category, OperationType, BusinessType } from '@/specs-types' // ver nota de import abajo

interface FilterBarProps {
  /** Opciones válidas, tal como las devuelve el backend — nunca hardcodeadas. */
  facets: FacetsResponse | null
  /** Selección actual. `undefined` en cualquier campo = "todos" (sin ese filtro). */
  value: {
    category?: Category
    operationType?: OperationType
    businessType?: BusinessType
    startDate?: string // YYYY-MM-DD
    endDate?: string   // YYYY-MM-DD
  }
  onChange: (next: FilterBarProps['value']) => void
  loading?: boolean
}
```

**Ambigüedad resuelta — de dónde salen las opciones del `<select>`**:
un brief típicamente diría "el selector de categoría debe mostrar todas las
categorías disponibles". Sin ese brief, la decisión es: las opciones del
`<select>` de categoría/operación/tipo de negocio se pueblan **siempre**
desde `facets.categories` / `facets.operation_types` / `facets.business_types`,
nunca desde una lista fija en el componente. Razón: `MetricsFacets` ya
existe exactamente para esto (`backend/app/routes.py:150-158`), y
hardcodear la lista duplicaría lo que ya documenta
`financial-movement-type-duplicated-python-typescript.md` como riesgo.

**Ambigüedad resuelta — quién dispara el fetch al cambiar un filtro**:
`FilterBar` **no** hace fetch. Emite `onChange` con el nuevo valor;
`App.tsx` (o quien orqueste el estado) es responsable de re-pedir
`/api/metrics`, `/api/metrics/alerts`, etc. con esos parámetros. Razón:
mantiene el patrón ya existente donde ningún componente de
`components/dashboard/` hace su propio fetch — ver `App.tsx:20-26`
(`fetchJson` vive fuera de los componentes).

**Nota de import**: `@/specs-types` no existe todavía — es un alias
ilustrativo. Mientras los tipos vivan en `frontend/specs/` (fuera de
`tsconfig.app.json`), esta interfaz no compila importándolos directo. Ver
la sección "Antes de implementar" al final de este documento.

---

## 2. Funcionalidad: Alertas de gasto

**Por qué ahora**: `/api/metrics/alerts` está implementado y testeado en el
backend desde el commit `0c07552` pero nunca tuvo consumidor —
`seven-of-nine-endpoints-have-no-frontend-caller.md` lo listaba como uno de
los 6 endpoints sin conectar.

### `AlertsPanel`
Archivo: `frontend/src/components/dashboard/alerts-panel.tsx`

```ts
import type { AlertsResponse } from '@/specs-types'

interface AlertsPanelProps {
  /** `null` mientras no llegó la respuesta; array vacío es un estado válido (sin anomalías), no un error. */
  alerts: AlertsResponse | null
  loading?: boolean
}
```

**Contenido por fila** (uno por `AlertEntry`):
- `period` → tal cual lo devuelve el backend (string ya formateado:
  `YYYY-MM`, `YYYY-Www` o `YYYY-MM-DD` según `group_by` — no reformatear,
  mostrar tal cual, porque el componente no sabe qué `group_by` se pidió a
  menos que se le pase explícitamente; ver ambigüedad abajo).
- `outcome_total` → `formatCurrency(alert.outcome_total)` (reusar
  `frontend/src/lib/financial-utils.ts`, no reimplementar formateo).
- `increase_ratio` → `formatPercent(alert.increase_ratio * 100)` — **ojo**:
  `formatPercent` espera un número ya en base 100 (`formatPercent(15.5) →
  "15.5%"`, ver `financial-utils.test.ts:111-112`), pero `increase_ratio`
  del backend es una fracción (`0.4735`). Sin el `* 100` el componente
  mostraría `"0.5%"` en vez de `"47.4%"` — este es exactamente el tipo de
  desajuste de wording/unidades que un brief débil dejaría pasar.

**Ambigüedad resuelta — `threshold` no es configurable por el usuario en
v1**: el backend acepta `threshold` como query param (`AlertsParams` en
Fase 2), pero esta spec **no** agrega un control de UI para cambiarlo.
Razón: no hay brief que pida ese control, y agregar un slider/input sin que
nadie lo haya pedido es inventar alcance. Se usa el default del backend
(`0.3`) sin enviarlo explícitamente. Si se necesita configurable, es un
cambio de una línea (agregar el campo a `FilterBar`'s value) — dejarlo para
cuando alguien lo pida.

**Ambigüedad resuelta — período crudo vs. reformateado**: se muestra
`period` tal cual viene del backend (ej. `"2026-03"`), sin convertirlo a
`"Mar 2026"` como hace `formatMonthYearLabel` para los charts existentes.
Razón: `AlertEntry.period` puede venir en 3 formatos distintos según
`group_by` (día/semana/mes — ver JSDoc de `AlertEntry` en `api-types.ts`),
y `formatMonthYearLabel` solo sabe parsear el formato mensual
(`frontend/src/lib/financial-utils.ts:11-19`) — reusarlo a ciegas rompería
silenciosamente con `group_by=week`. Si el diseño final solo va a pedir
`group_by=month`, esto se puede simplificar; no asumirlo sin confirmarlo.

**Estado vacío**: `alerts.length === 0` → `"No se detectaron anomalías de
gasto en este período."` (mismo tono que el mensaje de error ya existente
en `App.tsx:47`, no un genérico "No data").

**Layout**: tabla simple dentro de `Card`/`CardHeader`/`CardContent`
(reusar `frontend/src/components/ui/card.tsx`, mismo patrón que los charts
existentes) — **no** un gráfico. Razón: son eventos discretos por período
con 3 valores cada uno; una tabla los hace comparables sin inventar un
tipo de visualización nuevo para 4 campos.

---

## 3. Funcionalidad: Ranking de categorías

**Por qué ahora**: mismo caso que Alertas — `/api/metrics/categories/top`
implementado y testeado, sin consumidor (`be510b5`).

### `TopCategoriesList`
Archivo: `frontend/src/components/dashboard/top-categories-list.tsx`

```ts
import type { TopCategoriesResponse, OperationType } from '@/specs-types'

interface TopCategoriesListProps {
  categories: TopCategoriesResponse | null
  /**
   * Explícito, no inferido de `categories[0]?.operation_type` — un array
   * vacío no debe dejar el título del componente sin texto.
   */
  operationType: OperationType
  loading?: boolean
}
```

**Ambigüedad resuelta — color por categoría**: no existe ningún token de
color por categoría en `frontend/src/index.css` (verificado: `grep -n
"suppliers\|administrative\|operational" index.css` → sin coincidencias).
Un brief de diseño típicamente asignaría un color a cada una de las 5
categorías. Sin ese brief, la decisión es: **no** introducir 5 tokens de
color nuevos todavía. Colorear cada barra/fila con el token semántico ya
existente según `operation_type` (`--chart-income` o `--chart-outcome`,
`frontend/src/index.css:25-27`), igual para las 5 categorías dentro de la
misma lista. Razón: introducir una paleta categórica nueva sin que nadie
la haya pedido es exactamente el tipo de decisión de diseño que debería
venir de un brief real, no de este agente. Si se pide luego, agregar
`--category-suppliers`, etc., siguiendo el mismo patrón OKLCH que ya usa
`index.css`.

**Ambigüedad resuelta — `others` puede aparecer en cualquier lado**: dado
que `others` no es exclusiva de income (corregido en
`backend-data-model.md`, verificado en vivo — ver `api-types.ts`, JSDoc de
`CategoryEntry.category`), el componente **no** debe asumir un orden ni
agrupación especial para `others` — se renderiza como cualquier otra
categoría, en el orden en que llega (el backend ya la devuelve ordenada
por `total_amount` descendente, `backend/app/routes.py:200`).

**Layout — lista numerada, no gráfico de torta**: los ítems se muestran
como una lista ordenada (1, 2, 3…) con barra de progreso horizontal
proporcional a `total_amount / categories[0].total_amount`. Los números
de orden **sí están justificados aquí** (a diferencia de un marcador
decorativo): el backend ya garantiza que es una secuencia rankeada por
monto (`build_top_categories`, `backend/app/routes.py:190-208`), así que
el número comunica información real, no decoración.

**⚠️ Trigger de la regla `chart-tooltip-logic-duplicated.md`**: si en vez
de la lista con barras de arriba se decide implementar esto como un
tercer gráfico de Recharts con tooltip propio, **esa es la señal exacta**
que esa regla marcó como el momento de extraer `CustomTooltip` a un
componente compartido (`chart-tooltip.tsx`) — no copiar el tooltip por
tercera vez. Esta spec recomienda la lista con barras precisamente para
evitar ese problema mientras no haya necesidad real de un gráfico.

---

## Antes de implementar (bloqueante, no cosmético)

Los tres bloques de código de arriba importan de `@/specs-types`, que
**no existe** — es un placeholder. `frontend/specs/` está fuera de
`tsconfig.app.json` (`include: ["src"]`), así que nada de `src/` puede
importarlo hoy sin cambiar esa config. Antes de escribir estos componentes
de verdad, alguien tiene que decidir explícitamente uno de:
1. Mover `api-types.ts`/`param-types.ts` a `frontend/src/lib/` (fusionando
   con `financial-types.ts`, seguramente), o
2. Agregar `"specs"` al `include` de `tsconfig.app.json`.

No lo decidí en esta spec porque es un cambio de configuración del
proyecto, no un detalle de un componente — encaja con el mismo criterio ya
usado en `financial-movement-type-duplicated-python-typescript.md`: los
cambios de contrato de tipos se confirman con el usuario, no se asumen.
