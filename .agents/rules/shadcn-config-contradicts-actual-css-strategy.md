# Nombre de la regla
`shadcn-config-contradicts-actual-css-strategy`

## Alcance
Aplica cuando un agente va a: (a) correr `npx shadcn add <componente>` para
agregar un nuevo componente UI, o (b) tocar el theming/colores del proyecto
en `frontend/src/index.css` o `frontend/components.json`.

## Justificación
La configuración declarada de shadcn/ui no coincide con cómo el proyecto
realmente maneja el theming. Un componente generado con la CLI en su
configuración por defecto puede no calzar visualmente con el resto del
sistema, porque asume una estrategia de estilos distinta a la que el CSS
real usa.

## Evidencia
- `frontend/components.json:9` declara `"cssVariables": false`.
- `frontend/src/index.css:5-76` define, sin embargo, ~40 variables CSS OKLCH
  (`--background`, `--foreground`, `--chart-income`, `--chart-outcome`,
  `--chart-profit`, `--income-badge`, `--income-badge-fg`, etc.), incluyendo
  un bloque `.dark { ... }` completo con las mismas variables redefinidas.
- Esas variables se usan activamente en componentes ya existentes, ej.
  `frontend/src/components/dashboard/kpi-card.tsx:17-31`:
  `'bg-[var(--income-badge)] text-[var(--income-badge-fg)]'`.

## Guía accionable específica para este proyecto
1. Antes de correr `npx shadcn add <componente>`, leer el output generado y
   compararlo manualmente contra el patrón de `kpi-card.tsx` o
   `card.tsx` (que usan `data-slot` + `cn()` + clases con `var(--...)`).
2. Si el componente generado usa clases Tailwind planas (asumiendo
   `cssVariables:false`), ajustarlo a mano para que use las variables ya
   existentes en `index.css` en vez de introducir un segundo sistema de
   color en paralelo.
3. No "arreglar" el archivo `components.json` cambiando `cssVariables` a
   `true` sin antes revisar si eso rompe la generación de componentes
   futuros — no se probó ese cambio en esta sesión, es una hipótesis sin
   evidencia de qué efecto tendría.
