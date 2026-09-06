# Repository Structure Map

_Verified via `find . -not -path '*/node_modules*' -not -path '*/.git*' -not
-path '*/__pycache__*' -not -path '*/.pytest_cache*'` on 2026-09-06. This is
the full, real tree — nothing added, nothing assumed._

```
.
├── AGENTS.md                          # Convención de agentes (rules/skills/memory-bank)
├── README.md / README.es.md           # Docs del proyecto (en/es)
├── docker-compose.yml                 # Orquesta frontend + backend
│
├── .agents/
│   ├── rules/*.md                     # 6 reglas accionables
│   └── skills/README.md               # vacío a propósito, documentado
│
├── memory-bank/
│   └── *.md                           # este directorio
│
├── backend/                           # SERVICIO: FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py                # marca `app` como paquete
│   │   ├── main.py                    # ENTRY POINT → instancia FastAPI + CORS
│   │   └── routes.py                  # toda la lógica de negocio + 9 rutas
│   └── tests/
│       ├── conftest.py                # inserta ROOT_DIR en sys.path
│       └── test_routes.py             # 15 tests (pytest + TestClient)
│
└── frontend/                          # SERVICIO: Vite + React 19 + TS
    ├── Dockerfile
    ├── package.json / package-lock.json
    ├── vite.config.ts                 # plugins, proxy /api, alias @
    ├── eslint.config.js
    ├── components.json                # config shadcn/ui
    ├── tsconfig.json (+ .app / .node) # project references
    ├── .env.example                   # VITE_API_BASE_URL (opcional)
    ├── index.html                     # ENTRY POINT HTML → carga /src/main.tsx
    ├── public/favicon.svg
    └── src/
        ├── main.tsx                   # ENTRY POINT JS → createRoot + <App/>
        ├── App.tsx                    # única llamada fetch real (`/api/metrics`)
        ├── index.css                  # tema Tailwind v4 + variables OKLCH
        ├── assets/hero.png
        ├── components/
        │   ├── dashboard/*.tsx        # 5 componentes específicos del dashboard
        │   └── ui/{card,skeleton}.tsx # primitivos shadcn/ui
        └── lib/
            ├── financial-types.ts     # tipos espejo del modelo Pydantic
            ├── financial-utils.ts     # agregaciones client-side (computeKPIs, etc.)
            ├── financial-utils.test.ts# 5 tests (vitest)
            ├── mock-data.ts           # no importado por nadie (código muerto, sin confirmar)
            └── utils.ts               # helper cn()
```

Not present in the repo (verified absence, not an oversight to "fix"
unprompted): `Makefile`, `justfile`, `.github/workflows/` (no CI), any
database/migration tooling, a production Dockerfile/nginx config for the
frontend, or a real `.env` file (only `frontend/.env.example`).

## Services (`docker-compose.yml`)

| Servicio | Build context | Dockerfile | Puertos host:contenedor | Volúmenes | Depende de |
|---|---|---|---|---|---|
| `frontend` | `./frontend` | `frontend/Dockerfile` | `5173:5173` | `./frontend:/app` + volumen anónimo `/app/node_modules` | `backend` |
| `backend` | `./backend` | `backend/Dockerfile` | `8000:8000`, `5678:5678` | `./backend:/app` | — |

Full source: `docker-compose.yml` (root). See `[[ports-and-environments]]`
for the local-dev implications of the anonymous `node_modules` volume.

## Entry points

| Punto de entrada | Archivo | Qué hace |
|---|---|---|
| Backend (proceso) | `backend/app/main.py` | `app = FastAPI(...)`, agrega `CORSMiddleware`, monta `router` de `routes.py` |
| Backend (rutas/lógica) | `backend/app/routes.py` | Único módulo con las 9 rutas + toda la lógica pura |
| Frontend (HTML) | `frontend/index.html` | `<div id="root">` + `<script src="/src/main.tsx">` |
| Frontend (JS) | `frontend/src/main.tsx` | `createRoot(...).render(<App/>)` |
| Frontend (app raíz) | `frontend/src/App.tsx` | único componente con `fetch()`; orquesta KPIs + charts |

## Execution scripts

**Backend** — no Makefile/script propio; único comando de arranque, en el Dockerfile:
```dockerfile
# backend/Dockerfile:12
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```
Siempre arranca bajo `debugpy` — no hay variante "producción" sin debugger.

**Frontend** — scripts en `frontend/package.json:7-14`:
```json
"dev": "vite",
"build": "tsc -b && vite build",
"lint": "eslint .",
"preview": "vite preview",
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```
El Dockerfile invoca `npm run dev -- --host 0.0.0.0 --port 5173`
(`frontend/Dockerfile:12`), no `npm run dev` a secas.

**Repo raíz** — único comando documentado y verificado real:
`docker compose up --build` (`README.md:39-43`). No hay agregador propio en
la raíz.

## Dockerfiles (contenido íntegro)

`backend/Dockerfile`:
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000 5678
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

`frontend/Dockerfile`:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
```

Both are single-stage: no multi-stage build, no non-root user, no
healthcheck. Neutral observation, not a judgment — flag as a candidate for
`.agents/rules/` if the project ever targets production hardening.

See also: `[[projectbrief]]`, `[[techContext]]`,
`[[frontend-backend-integration-gap]]`.
