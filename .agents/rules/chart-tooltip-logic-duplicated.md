# Nombre de la regla
`chart-tooltip-logic-is-duplicated-not-shared`

## Alcance
Aplica cuando un agente va a: (a) modificar el estilo/comportamiento del
tooltip de cualquiera de los dos charts existentes, o (b) agregar un tercer
componente de chart al dashboard.

## Justificación
La misma función `CustomTooltip` (misma forma, mismo propósito: renderizar
una tarjeta con el label y los valores del punto activo) está escrita dos
veces de forma casi idéntica. No hay tests de componentes que detecten
inconsistencias visuales entre ambas copias si una se actualiza y la otra
no.

## Evidencia
- `frontend/src/components/dashboard/income-outcome-chart.tsx:33-47`:
  `function CustomTooltip({ active, payload, label }: CustomTooltipProps)`.
- `frontend/src/components/dashboard/profit-percent-chart.tsx:32-48`:
  misma firma, misma estructura JSX (`rounded-lg border border-border
  bg-card px-4 py-3 shadow-lg text-sm`), difiriendo solo en cómo formatea el
  valor (`formatCurrency` vs `.toFixed(1)}%`).
- No existe ningún archivo `chart-tooltip.tsx` ni componente compartido bajo
  `frontend/src/components/`.
- Confirmado en `.agents/rules/testing-conventions.md`: no hay
  component-testing library instalada (`frontend/package.json` no incluye
  `@testing-library/react`), por lo que una divergencia entre ambos
  tooltips no la detectaría ningún test automatizado.

## Guía accionable específica para este proyecto
1. Si se agrega un tercer chart, extraer `CustomTooltip` a
   `frontend/src/components/dashboard/chart-tooltip.tsx` con un prop de
   formateo de valor inyectable (`formatValue: (v: number) => string`),
   antes de escribir una tercera copia casi idéntica.
2. Con solo 2 ocurrencias actuales, no extraer preventivamente sin que el
   usuario lo pida — la señal para actuar es la aparición de una 3ra
   copia, no la existencia de 2.
3. Si se corrige un bug de estilo en un tooltip, buscar explícitamente en
   el otro archivo (`grep -n "CustomTooltip"
   frontend/src/components/dashboard/*.tsx`) si aplica el mismo fix ahí.
