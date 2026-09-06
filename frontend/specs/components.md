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
import type { FacetsResponse, Category, OperationType, BusinessType } from './api-types' // ver nota de import abajo

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

**Renderizado condicional**:
```
facets === null            → <Skeleton> de 4 selects (sin opciones que mostrar todavía)
facets !== null && loading → selects habilitados con las opciones ya cargadas, pero deshabilitados mientras se re-fetchea
facets !== null && !loading → selects habilitados, opciones desde facets.*
```
No hay estado "vacío" propio de este componente — `facets` siempre trae los 5 valores de
`categories`/2 de `business_types`/2 de `operation_types` mientras el dataset mock tenga
al menos un movimiento (ver `Funcionalidad 1`), así que `facets.categories.length === 0`
no es un caso realista hoy.

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

**Nota de import**: el `import from './api-types'` de arriba es real y
compila hoy — verificado con `npx tsc -p specs --noEmit` (ver
`frontend/specs/tsconfig.json`) — pero solo porque este bloque vive
conceptualmente *dentro* de `frontend/specs/`. Copiado tal cual a un
`.tsx` real bajo `frontend/src/components/dashboard/`, **no** compilaría:
`tsconfig.app.json` solo incluye `"src"`, así que un archivo en `src/` no
puede resolver `./api-types` apuntando a `specs/` sin cruzar ese límite a
mano (`../../specs/api-types`, frágil y no es el patrón del proyecto). Ver
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
import type { AlertsResponse } from './api-types'

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

**Estado vacío de la tabla de anomalías** (obligatorio, no cosmético):
`alerts !== null && alerts.length === 0` → renderizar la tabla vacía con
`"No se detectaron anomalías de gasto en este período."` en vez del
`<tbody>`, **nunca** ocultar todo el `Card` ni mostrarlo como error — es
una respuesta `200` válida (ver `README.md`, sección Alertas, caso límite
1). Mantener el `<CardHeader>` con el título visible incluso vacío, para
que el usuario sepa que la sección existe y no está rota.

**Renderizado condicional completo**:
```
loading === true       → <Skeleton> de 3 filas dentro del Card
alerts === null        → mismo <Skeleton> (todavía no llegó respuesta)
alerts.length === 0    → tabla vacía + mensaje de estado vacío (arriba)
alerts.length > 0      → una <tr> por AlertEntry, orden tal cual llega (ya viene cronológico)
```

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
import type { TopCategoriesResponse, OperationType } from './api-types'

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

**Renderizado condicional**:
```
loading === true         → <Skeleton> de `limit` filas (o 5 si no se pidió limit)
categories === null      → mismo <Skeleton>
categories.length === 0  → mensaje de estado vacío (ver Funcionalidad 4, comparte el mismo texto/patrón)
categories.length > 0    → lista numerada 1..N, N = categories.length (nunca asumir N === limit)
```

---

## 4. Funcionalidad: Paneles B2B/B2C

**Por qué ahora**: mismo endpoint que la Funcionalidad 3
(`/api/metrics/categories/top`), pero llamado **dos veces** con
`business_type` distinto — es una funcionalidad separada porque compara
dos resultados lado a lado, no un ranking único. Reusa `TopCategoriesList`
tal cual (no se crea un componente nuevo): el padre (`App.tsx` o quien
orqueste el estado) instancia `TopCategoriesList` dos veces, una con
`business_type: 'B2B'` y otra con `business_type: 'B2C'` en el request.

### Props (extensión mínima sobre `TopCategoriesList`)
```ts
import type { TopCategoriesResponse, OperationType, BusinessType } from './api-types'

interface TopCategoriesListProps {
  categories: TopCategoriesResponse | null
  operationType: OperationType
  /**
   * Nuevo respecto a la Funcionalidad 3: identifica qué panel es, para el
   * título (`"Top 5 — B2B"` / `"Top 5 — B2C"`) y para que el estado vacío
   * pueda nombrar el lado correcto. No filtra nada por sí solo — el
   * filtrado ya pasó en el request via `TopCategoriesParams.business_type`.
   */
  businessType: BusinessType
  loading?: boolean
}
```

**Estado vacío de "top-5" por panel** (obligatorio, verificado en vivo):
`GET /api/metrics/categories/top?business_type=B2B&start_date=2020-01-01&end_date=2020-01-31`
→ `200` con `[]` (rango fuera del dataset real). Cada panel debe manejar
su propio vacío de forma independiente — si B2B da `[]` pero B2C tiene
datos, **no** ocultar los dos paneles, solo el que está vacío:
`"Sin categorías de gasto para B2B en este período."` (mismo patrón de
texto que Alertas, sustituyendo el sujeto).

**Renderizado condicional** (igual que Funcionalidad 3, repetido por
claridad porque son dos instancias independientes del mismo componente):
```
loading === true         → <Skeleton> del panel correspondiente
categories === null      → mismo <Skeleton>
categories.length === 0  → "Sin categorías de gasto para {businessType} en este período."
categories.length > 0    → lista numerada, título "Top 5 — {businessType}"
```

**Casos límite (verificados en vivo) y qué debe mostrar la UI**:
1. **Ninguno de los dos business_type tiene datos en el rango elegido** —
   verificado: el mismo rango `2020-01-01..2020-01-31` da `[]` para **ambos**
   `B2B` y `B2C`. La UI muestra los dos paneles con su mensaje de vacío
   simultáneamente — no es un estado de error de la página, cada panel es
   independiente.
2. **"Top 5" trae menos de 5 filas incluso con datos** — verificado en
   vivo con el dataset real y sin filtro de fecha: `business_type=B2B`
   (default `operation_type=outcome`, default `limit=5`) devolvió
   **4** entradas, no 5, porque solo existen 4 categorías de outcome
   (`suppliers`, `operational`, `administrative`, `others` —
   `OUTCOME_CATEGORIES`, `backend/app/routes.py:17`). El título del panel
   dice "Top 5" pero el layout debe acomodar 1-5 filas sin dejar espacio
   vacío ni asumir siempre 5 — mismo principio que la Funcionalidad 3.

---

## Antes de implementar (bloqueante, no cosmético)

Los cuatro bloques de código de arriba compilan **hoy**, de forma aislada,
verificado con `npx tsc -p specs --noEmit` (`frontend/specs/tsconfig.json`,
agregado para que este chequeo sea real y no un falso verde — correr
`npx tsc --noEmit` a secas desde `frontend/` **no** toca `specs/`, se
confirmó inyectando un error de tipos deliberado y viendo que igual salía
con exit 0). Pero eso solo prueba que las *interfaces* son válidas, no que
un componente real en `frontend/src/components/dashboard/*.tsx` pueda
importarlas sin fricción: `tsconfig.app.json` solo incluye `"src"`, así que
un archivo ahí no puede resolver `./api-types` (que apunta a `specs/`) sin
una ruta relativa cruzando el límite (`../../specs/api-types`) — funciona,
pero no es el patrón que usa el resto del proyecto (que usa el alias `@/`).

Antes de escribir estos componentes de verdad, alguien tiene que decidir
explícitamente uno de:
1. Mover `api-types.ts`/`param-types.ts` a `frontend/src/lib/` (fusionando
   con `financial-types.ts`, resolviendo también la duplicación de nombre
   `FacetsResponse`/`MetricsFacets` que señala `README.md`), o
2. Agregar `"specs"` al `include` de `tsconfig.app.json` y extender el
   alias `@/*` para que también resuelva `specs/*`.

No lo decidí en esta spec porque es un cambio de configuración del
proyecto, no un detalle de un componente — encaja con el mismo criterio ya
usado en `financial-movement-type-duplicated-python-typescript.md`: los
cambios de contrato de tipos se confirman con el usuario, no se asumen.
