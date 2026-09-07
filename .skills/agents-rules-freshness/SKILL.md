---
name: agents-rules-freshness
description: Re-verifica que la evidencia citada en cada archivo de .agents/rules/*.md (rutas, números de línea, conteos, salidas de grep) siga coincidiendo con el estado actual del repo, y corrige las reglas que se desactualizaron. Usar antes de confiar en una regla para tomar una decisión, después de refactors que muevan líneas o renombren archivos, y como chequeo periódico del memory bank del proyecto.
---

# Skill interna: Auditoría de frescura de `.agents/rules/`

## Por qué existe (gap que las skills externas no cubren)

`AGENTS.md` obliga a todo agente que trabaja en este repo a leer
`.agents/rules/` y `memory-bank/` antes de actuar. Esas reglas son
**snapshots escritos a mano en un momento dado**: citan números de línea
(`frontend/src/App.tsx:13`), conteos (`9 rutas totales`, `1 solo fetch()`) y
salidas de comandos concretos. Nada las re-verifica cuando el código cambia,
así que envejecen en silencio — y un agente que las lee las trata como
hechos actuales.

Ninguna skill externa del registro público (skills.sh: `performance`, `seo`,
`typescript`, `testing`, etc.) puede cubrir esto: no es una práctica genérica
de web/lenguaje, es el mantenimiento del sistema de memoria propio y a medida
de **este** repo. Una skill externa no sabe que `.agents/rules/` existe, ni
qué afirma cada archivo, ni cómo se verificó originalmente.

Gap confirmado en la corrida del 2026-09-07 (ver "Hallazgos" al final): al
menos 2 reglas ya citaban líneas y conteos que el código actual contradice.

## Objetivo

Producir un veredicto por regla — **VIGENTE / DESACTUALIZADA / NO
VERIFICABLE** — re-ejecutando la misma evidencia que la regla dice haber
usado, y dejar `.agents/rules/` de vuelta en sincronía con el repo real,
sin inventar hechos nuevos ni borrar reglas cuya intención no esté resuelta
por evidencia.

## Inputs

1. Todos los archivos `.agents/rules/*.md` (o el subconjunto que pida el
   usuario; si no especifica, todos).
2. Para cada regla, su propia sección de **Evidencia**: los comandos
   (`grep -n ...`, `git log ...`), rutas `archivo:línea` y conteos que cita.
3. El estado actual del repo (working tree, no un commit histórico) y
   `git log` cuando la regla cite historia.

No se aceptan como input las afirmaciones de otras reglas ni de
`memory-bank/*.md`: cada regla se verifica contra el código, no contra otro
documento (si no, las desincronizaciones se propagan).

## Output

Un reporte con, por cada regla auditada:
- **Veredicto**: VIGENTE / DESACTUALIZADA / NO VERIFICABLE.
- **Evidencia re-ejecutada**: el comando corrido y su salida real de hoy.
- Si está DESACTUALIZADA: qué afirma la regla vs. qué dice el repo ahora, y
  la corrección exacta (`archivo:línea` nuevos, conteo nuevo).
- Si es NO VERIFICABLE: por qué (archivo citado ya no existe, el comando ya
  no aplica, la afirmación nunca fue falsable).

Y un resumen: `N reglas auditadas / M desactualizadas / K no verificables`.

Después del reporte, y solo para las reglas marcadas DESACTUALIZADA, se
editan los archivos de regla con la evidencia corregida.

## Procedimiento

1. `ls .agents/rules/*.md` y leer cada archivo completo. No auditar de
   memoria ni por el nombre del archivo — el nombre puede mentir (ej.
   `seven-of-nine-endpoints-...` cuando hoy son seis).
2. Extraer de cada regla sus afirmaciones **falsables**: comandos citados,
   `archivo:línea`, conteos, nombres de símbolos/rutas.
3. Re-ejecutar cada una. Para referencias `archivo:línea`, verificar que la
   línea citada siga conteniendo lo que la regla dice (leer esa línea, no
   solo comprobar que el archivo existe).
4. Asignar veredicto solo con la salida real a la vista.
5. Editar únicamente las reglas DESACTUALIZADAS, corrigiendo el dato — no
   reescribir la guía accionable ni la justificación de la regla salvo que
   la evidencia corregida las contradiga de plano.
6. Si la corrección cambia el sentido de la regla (no solo un número), o si
   la regla queda sin objeto, **preguntar al usuario antes de borrarla o
   reescribirla**: la intención del proyecto no se deduce del código.

## Criterios de aceptación

La corrida es válida solo si se cumplen todos:

1. **Cero veredictos sin re-ejecución**: cada regla auditada tiene al menos
   un comando corrido en esta sesión con su salida citada. "Parece vigente"
   no es un veredicto.
2. **DESACTUALIZADA solo por contradicción concreta**: un número, una línea
   o un string que hoy dice algo distinto. Una regla que envejeció en estilo
   pero cuyos hechos siguen siendo ciertos es VIGENTE.
3. **Trazabilidad**: toda corrección escrita en un archivo de regla apunta a
   `archivo:línea` verificados en esta corrida.
4. **Sin ediciones especulativas**: ningún archivo de `.agents/rules/` se
   edita antes de que el reporte haya marcado esa regla como
   DESACTUALIZADA.
5. **Sin borrados unilaterales**: ninguna regla se elimina sin confirmación
   explícita del usuario.
6. **Idempotencia**: re-correr la skill inmediatamente después debe dar
   `0 desactualizadas`. Si no, la corrección anterior fue incompleta.

## Hallazgos de la corrida del 2026-09-07 (primera prueba real, las 20 reglas)

Resumen: **20 reglas auditadas / 8 desactualizadas / 0 no verificables**.
Las 12 restantes (`anonymous-volume-empty-node-modules`,
`backend-boot-depends-on-debugpy-port`, `backend-data-model`,
`backend-requirements-unpinned`, `backend-tests-syspath-cwd-dependency`,
`chart-tooltip-logic-duplicated`, `client-side-aggregation-duplicates-
server-endpoint`, `cors-wildcard-with-credentials`, `environment-setup`,
`financial-movement-type-duplicated-python-typescript`, `security-notes`,
`testing-conventions`) se re-verificaron línea por línea y comando por
comando — **VIGENTES**, sin cambios.

Desactualizadas, corregidas en esta corrida (solo evidencia, mismo sentido):
- `frontend-backend-integration-gap.md` y
  `seven-of-nine-endpoints-have-no-frontend-caller.md` → ambas afirmaban
  "único `fetch()` […] apuntando solo a `/api/metrics`"
  (`frontend/src/App.tsx:16`). Hoy hay dos llamadas, ambas vía el helper
  compartido `fetchJson` (`frontend/src/App.tsx:20-26`, invocado en
  37-38), contra `/api/metrics` **y** `/api/metrics/facets` — conectado en
  el commit `eeece05`, posterior a ambas reglas. Endpoints de negocio sin
  consumidor: 6, no 7.
- `ports-and-environments.md` y `vite-proxy-docker-hostname-coupling.md` →
  citaban `frontend/vite.config.ts:11-16` para el bloque del proxy; hoy es
  `:9-17` (el archivo ganó 2 líneas). `ports-and-environments.md` también
  citaba `App.tsx:13` para `VITE_API_BASE_URL` (hoy `:18`), y
  `vite-proxy-docker-hostname-coupling.md` citaba `App.tsx:37` para el
  mensaje de error (hoy `:47`).
- `mock-data-file-has-no-confirmed-consumer.md` → citaba `App.tsx:15-21`
  para el `fetch()`; ese rango ya no lo contiene (ahora está en 37-38 vía
  el helper). El resto de la regla (mock-data.ts sin consumidor) sigue
  vigente, re-verificado con el mismo grep que usa la propia regla.
- `shadcn-config-contradicts-actual-css-strategy.md` → citaba
  `components.json:9` para `"cssVariables": false`; hoy es la línea `:10`
  (línea 9 es `"baseColor": "zinc"`).

Desactualizadas, **no editadas** — cambian el sentido de la regla, no solo
un número, así que quedan pendientes de decisión del usuario (regla #6 de
Criterios de aceptación):
- `mock-data-date-range-is-a-rolling-window.md` — toda su evidencia
  (fechas hardcodeadas en `test_metrics_comparison_returns_delta_fields`
  que matcheaban 0 movimientos) ya no existe: el test de
  `backend/tests/test_routes.py:155-182` fue reescrito para usar un rango
  relativo a `date.today()` y ahora sí assertea `delta_abs` contra un valor
  real — exactamente lo que la propia regla recomendaba en su punto 2 y 3.
  El hallazgo original está resuelto; la guía general ("no hardcodear
  fechas absolutas en tests contra este backend") sigue siendo válida como
  principio.
- `ui-period-label-hardcoded-vs-generated-data.md` — su evidencia
  (`App.tsx:49` con `period="2024 - Full Year"` hardcodeado) ya no existe:
  `App.tsx` hoy pasa `period={period}`, un estado derivado de
  `formatPeriodLabel(facets.min_date, facets.max_date)` — exactamente la
  corrección que la regla pedía en su punto 2. Resuelto.

Fuera del alcance formal de esta skill (que audita `.agents/rules/`, no
`memory-bank/`), pero encontrado de paso y vale la pena señalarlo:
`memory-bank/productContext.md:114-128` repite las mismas tres afirmaciones
ya desactualizadas (conteo "7 de 9", el test con fechas hardcodeadas, el
período "2024 — Full Year"). No se tocó — está fuera del contrato de
Inputs/Output declarado arriba — pero es evidencia de que el mismo tipo de
drift existe también en `memory-bank/`, candidato a extender esta skill si
se vuelve a pedir.
