# Product Context

_Documento autocontenido para la siguiente persona o agente que abra este
repo. Todo lo escrito aquí está respaldado por archivo/línea real del
código, verificado en la sesión del 2026-09-06. Donde algo no está
confirmado por evidencia, se marca ❓ explícitamente — no se completa con
supuestos. Para más detalle técnico, ver `[[techContext]]`,
`[[systemPatterns]]`, `[[repoStructure]]`, `[[progress]]`._

---

## 1. Descripción del producto (basada en evidencia)

**Qué es**: un dashboard de métricas financieras con frontend React +
TypeScript y backend FastAPI.
Fuente: `README.md:18` — _"Financial metrics dashboard with a React +
TypeScript frontend and a FastAPI backend."_

**Qué hace hoy, en concreto** (verificado leyendo todo el código fuente):
- Muestra 4 tarjetas KPI: Total Income, Total Outcome, Profit, Profit
  Margin (`frontend/src/components/dashboard/kpi-row.tsx:14-46`).
- Muestra 2 gráficos de línea: ingreso/egreso mensual y margen de ganancia
  % mensual (`frontend/src/App.tsx:65-66`, componentes
  `income-outcome-chart.tsx` y `profit-percent-chart.tsx`).
- Los datos que alimentan la UI provienen de **dos** llamadas en paralelo:
  `GET /api/metrics` y `GET /api/metrics/facets` (`frontend/src/App.tsx:36-39`,
  vía `Promise.all`) — la segunda alimenta el label de período real del
  header (`formatPeriodLabel`, `frontend/src/lib/financial-utils.ts:82-86`).
  ⚠️ Esto cambió durante la auditoría (ver nota de actualización más abajo);
  no hay filtros ni selector de rango de fechas, no hay interacción del
  usuario más allá de ver la carga inicial.
- El backend **no tiene base de datos ni fuente de datos real**: genera un
  año de movimientos financieros sintéticos en memoria, en cada request,
  con una semilla fija (`generate_mock_movements(seed=42)`,
  `backend/app/routes.py:94-104`).

**Para quién es** (contexto, no producto): proyecto de práctica de
ingeniería de IA de 4Geeks Academy — el objetivo declarado del ejercicio es
que un agente de IA analice el repo y genere reglas + memoria de proyecto
(`README.md:20-26`), no necesariamente que el dashboard en sí sea un
producto terminado para usuarios finales.
❓ No hay ningún documento en el repo que declare un "usuario objetivo" del
dashboard más allá de este contexto educativo — no asumir un caso de uso de
negocio real sin que el usuario lo confirme.

**Lo que el producto explícitamente NO es** (por ausencia verificada, no
por interpretación):
- No tiene autenticación ni control de acceso (sin `Depends`, sin manejo de
  `Authorization`, confirmado leyendo `backend/app/main.py` y
  `backend/app/routes.py` completos).
- No persiste nada — reiniciar el backend no pierde datos porque nunca los
  hubo guardados; cada request regenera el año completo desde cero.
- No tiene ningún flujo de escritura (no hay `POST`/`PUT`/`DELETE` en todo
  el backend — confirmado con `grep -niE "\.(post|put|delete|patch)\("` →
  0 resultados).

---

## 2. Stack tecnológico

### Backend
| Aspecto | Valor | Evidencia |
|---|---|---|
| Lenguaje | Python 3.13 | `backend/Dockerfile:1` (`FROM python:3.13-slim`) |
| Framework web | FastAPI | `backend/app/main.py:1,6` |
| Servidor ASGI | Uvicorn (`[standard]`) | `backend/requirements.txt:2` |
| Debugger | debugpy, siempre activo (puerto 5678) | `backend/Dockerfile:12` |
| Testing | pytest + pytest-cov + httpx (vía `TestClient`) | `backend/requirements.txt:3-6` |
| Validación de datos | Pydantic (`BaseModel`, `Literal`) | `backend/app/routes.py:11-27` |
| Persistencia | **Ninguna** — sin ORM, sin driver de BD en `requirements.txt` | Confirmado por ausencia |
| Versionado de dependencias | **Sin pins** (`fastapi`, `uvicorn[standard]`, etc. sin `==`) | `backend/requirements.txt` completo |

### Frontend
| Aspecto | Valor | Evidencia |
|---|---|---|
| Lenguaje | TypeScript ~6.0.2 | `frontend/package.json:39` |
| Framework UI | React 19.2.4 + ReactDOM 19.2.4 | `frontend/package.json:19-20` |
| Build tool | Vite 8.0.4 + `@vitejs/plugin-react` 6.0.1 | `frontend/package.json:30,41` |
| Estilos | Tailwind CSS v4 vía `@tailwindcss/vite` (no PostCSS clásico) | `frontend/vite.config.ts:3,8` |
| Componentes UI base | shadcn/ui (estilo "new-york") | `frontend/components.json` |
| Gráficos | Recharts 3.8.1 | `frontend/package.json:21` |
| Iconos | lucide-react 1.8.0 | `frontend/package.json:18` |
| Utilidades de clases | clsx + tailwind-merge (`cn()`) | `frontend/src/lib/utils.ts` |
| Testing | Vitest 4.1.4 + `@vitest/coverage-v8` | `frontend/package.json:31,42` |
| Linting | ESLint 9.39.4 (flat config) + typescript-eslint | `frontend/eslint.config.js` |
| Versionado de dependencias | Fijado vía `package-lock.json` | Presente en `frontend/` |

### Tooling / infraestructura
| Aspecto | Valor | Evidencia |
|---|---|---|
| Orquestación local | Docker Compose (2 servicios: `frontend`, `backend`) | `docker-compose.yml` |
| Puertos | Frontend `5173`, Backend `8000`, Debug `5678` | `docker-compose.yml:6-7,18-20` |
| CI/CD | **No existe** — sin `.github/workflows/` | Confirmado por ausencia |
| Contenedores | Single-stage, sin usuario no-root, sin healthcheck | `backend/Dockerfile`, `frontend/Dockerfile` completos |
| Convención de agentes IA | `.agents/rules/` (20 archivos), `.agents/skills/` (vacío, documentado), `memory-bank/` (este directorio) | Creados en esta serie de sesiones |

---

## 3. Estado actual del proyecto

### Qué funciona (verificado por ejecución real, no solo lectura)
- ✅ Backend: 15/15 tests pasan (`pytest -q` desde `backend/`, ejecutado en
  esta sesión).
- ✅ Frontend: 5/5 tests pasan (`npx vitest run` desde `frontend/`,
  ejecutado en esta sesión).
- ✅ Lint del frontend limpio (`npx eslint .`, sin errores).
- ✅ El flujo de datos real (`/api/metrics` + `/api/metrics/facets` →
  `computeKPIs` / `computeMonthlyData` / `formatPeriodLabel` → UI) está
  completo y es consistente extremo a extremo — verificado con el backend
  corriendo de verdad (`uvicorn`, puerto 8000, sin Docker) más
  `npx tsc -b`, `npx eslint .` y `npx vitest run` (5 passed) sobre el
  frontend, todo limpio.
- ✅ Los 9 endpoints responden correctamente contra la API real (no solo
  contra el código leído): probado con `curl`/`urllib` en vivo, incluyendo
  `/api/metrics/comparison` con fechas calculadas dinámicamente y
  `/api/metrics/categories/top`.
- ❓ El flujo completo de `docker compose up --build` (arranque de ambos
  contenedores vía Docker Compose específicamente) **no se ejecutó en esta
  sesión** — el backend sí se verificó corriendo, pero directo con
  `uvicorn`, no a través de Docker Compose.

### Qué falta (verificado por ausencia, no interpretación)
- 6 de 9 endpoints del backend no tienen ningún consumidor en el frontend:
  `/api/metrics/summary`, `/categories/top`, `/comparison`, `/alerts`,
  `/b2b`, `/b2c` (ver `[[frontend-backend-integration-gap]]`). El propio
  `/api/metrics/facets` **dejó de estar en esta lista** durante esta
  auditoría — ver nota de actualización abajo.
- Sin autenticación, sin base de datos, sin CI, sin tests de componentes
  frontend, sin pins de versión en `backend/requirements.txt`, sin
  documentación de por qué se tomaron decisiones no obvias (CORS abierto,
  `seed=42`, umbral de alertas `0.3` por defecto).
- Un test existente (`test_metrics_comparison_returns_delta_fields`) usa
  fechas hardcodeadas que hoy matchean **0 movimientos** del dataset mock
  (verificado ejecutando el generador: rango real 2025-09-02 a
  2026-08-28) — pasa igual porque solo valida el schema de la respuesta,
  no los valores. Ver `mock-data-date-range-is-a-rolling-window.md`.
- `frontend/src/lib/mock-data.ts` existe sin ningún import que lo consuma
  — estado sin confirmar (código muerto vs. remanente intencional). Ver
  `mock-data-file-has-no-confirmed-consumer.md`.

### ✅ Resuelto durante esta auditoría (2026-09-06)
El header de la UI mostraba "2024 — Full Year" hardcodeado, sin relación
con los datos reales del backend. **Ya no**: el código se actualizó (no por
este agente — cambió en paralelo durante la sesión) para pedir
`/api/metrics/facets` y derivar el label real vía `formatPeriodLabel`.
Verificado con tests + build limpios. Ver
`ui-period-label-hardcoded-vs-generated-data.md` para el registro completo
de auditoría (queda documentado, no borrado).

### Prioridades reales (inferidas de la evidencia de riesgo — no son un
roadmap declarado por el proyecto; el repo no tiene issues ni backlog
documentado, así que esto es una lectura de qué corregir primero según
impacto observado, a validar con el dueño del repo)

1. **Corregir el test que pasa vacíamente**
   (`test_metrics_comparison_returns_delta_fields`) — es el único hallazgo
   de esta auditoría con evidencia de una suite "verde" que no está
   validando comportamiento real. Prioridad alta porque erosiona la
   confianza en `pytest -q` como señal de salud del backend.
2. ~~Resolver la discrepancia del label de período en la UI~~ — **resuelto**
   durante esta auditoría (ver arriba). Ya no es una prioridad pendiente.
3. **Decidir qué hacer con los 6 endpoints sin consumidor** — no es un bug,
   pero bloquea saber si el "estado actual" del frontend es intencional o
   está incompleto. Prioridad media: no se puede planear trabajo nuevo de
   dashboard sin resolver esta ambigüedad primero.
4. **Confirmar el estado de `mock-data.ts`** — bajo esfuerzo, resuelve una
   ambigüedad concreta.
5. **Pins de versión en `backend/requirements.txt`** — prioridad baja
   mientras el proyecto sea de coursework; se vuelve alta si se plantea
   cualquier despliegue fuera de un entorno de práctica.

### Nota de actualización (2026-09-06, misma sesión)
Los puntos de esta sección se escribieron temprano en la auditoría, leyendo
código estático. Más tarde, en la misma sesión, el código de
`frontend/src/App.tsx` cambió (fuera de este agente) para resolver
exactamente el problema del punto 2. Esto se detectó al re-verificar en
vivo contra la API corriendo, no por casualidad — la lección para cualquier
agente futuro: **no cites un hallazgo de auditoría como vigente sin
re-verificarlo si pasó tiempo o trabajo en paralelo**, incluso dentro de la
misma sesión.

---

## Cómo usar este documento
Si sos un agente o una persona nueva en este repo: leé esta página primero.
Para el árbol de carpetas completo, ver `[[repoStructure]]`. Para
convenciones de código repetidas, ver `[[systemPatterns]]`. Para el detalle
línea por línea de cada riesgo y su regla asociada, ver `.agents/rules/`
(20 archivos, cada uno con Alcance/Justificación/Evidencia/Guía
accionable).
