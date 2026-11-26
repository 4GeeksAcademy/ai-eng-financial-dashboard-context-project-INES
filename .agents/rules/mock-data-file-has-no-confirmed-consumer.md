# Nombre de la regla
`mock-data-file-has-no-confirmed-consumer`

## Alcance
Aplica cuando un agente va a: (a) modificar, mover o borrar
`frontend/src/lib/mock-data.ts`, o (b) buscar "la fuente de datos" del
frontend y necesita saber si ese archivo es relevante.

## Justificación
Existe un archivo de 73 líneas con datos financieros hardcodeados que ningún
otro archivo del repo importa hoy. Actuar sobre él sin verificar esto primero
puede ser trabajo perdido en cualquiera de las dos direcciones: editarlo
asumiendo que alimenta la UI (no lo hace), o borrarlo asumiendo que es basura
sin confirmar que de verdad no se usa en ningún flujo (build, Storybook,
diseño) que un grep puntual no cubra.

## Evidencia
- `frontend/src/lib/mock-data.ts` exporta `mockMovements` (73 líneas de
  objetos `FinancialMovement` hardcodeados, meses enero–diciembre 2024).
- `grep -rn "mock-data" frontend/src` — ejecutado en esta sesión — no
  devuelve ningún `import` que lo consuma, solo el propio archivo.
- `frontend/src/App.tsx:37-38` obtiene sus datos exclusivamente vía el
  helper `fetchJson` (`frontend/src/App.tsx:20-26`) contra `/api/metrics` y
  `/api/metrics/facets`, no desde `mock-data.ts`. _(Línea corregida
  2026-09-07 por `agents-rules-freshness`: la cita original, `:15-21`, ya no
  contiene el `fetch()`; el resto de la regla sigue vigente — `grep -rn
  "mockMovements\|mock-data" frontend/src` sigue devolviendo solo el propio
  archivo.)_

## Guía accionable específica para este proyecto
1. Antes de tocar `mock-data.ts`, correr de nuevo
   `grep -rn "mockMovements\|mock-data" frontend/` (no confiar en este
   hallazgo indefinidamente — el árbol puede cambiar entre sesiones).
2. Si sigue sin consumidores, no borrarlo unilateralmente. Preguntar
   explícitamente al dueño del repo si es intencional (candidato: seed para
   una futura demo sin backend, o remanente del scaffold de V0 — commit
   `7661fa1 "Frontend from V0 with components and types"`).
3. Si se decide borrar, hacerlo en un commit separado y explícito
   ("remove unused mock-data.ts"), nunca como parte de un commit de otra
   feature — para que sea reversible sin arrastrar cambios no relacionados.
