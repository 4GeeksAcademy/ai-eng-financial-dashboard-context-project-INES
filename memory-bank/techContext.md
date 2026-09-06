# Tech Context

## Backend
- Python **3.13** (`backend/Dockerfile:1`, `FROM python:3.13-slim`)
- FastAPI, Uvicorn (`[standard]` extra), debugpy, pytest, pytest-cov, httpx —
  all **unpinned** versions (`backend/requirements.txt:1-6`)
- Single router file, no sub-apps or blueprints: `backend/app/routes.py`
  registered in `backend/app/main.py:14` (`app.include_router(router)`)
- No ORM, no database driver, no migration tool anywhere in
  `backend/requirements.txt` — confirms no persistence layer exists.

## Frontend
- React **19.2.4**, ReactDOM **19.2.4** (`frontend/package.json:19-20`)
- Vite **8.0.4**, `@vitejs/plugin-react` **6.0.1** (`frontend/package.json:30,41`)
- TypeScript **~6.0.2**, project-references split into
  `tsconfig.app.json`/`tsconfig.node.json` via root `tsconfig.json`
  (`frontend/tsconfig.json:1-6`)
- Tailwind CSS **v4** via `@tailwindcss/vite` plugin (not the classic
  PostCSS/`tailwind.config.js` pipeline) — `frontend/vite.config.ts:3,8`,
  `frontend/src/index.css:1` (`@import "tailwindcss"`)
- shadcn/ui scaffolding present (`frontend/components.json`), style
  `new-york`, `cssVariables: false` in that config — yet `index.css` manually
  defines an extensive OKLCH custom-property theme
  (`frontend/src/index.css:5-76`). This is a verified discrepancy, not
  resolved — see `.agents/rules/` note in
  `frontend-backend-integration-gap.md`'s sibling considerations (flag before
  running `shadcn add` commands, behavior may not match `cssVariables:false`
  expectations).
- Charting: `recharts` **3.8.1** (`frontend/package.json:21`), used in
  `frontend/src/components/dashboard/income-outcome-chart.tsx` and
  `profit-percent-chart.tsx`.
- Icons: `lucide-react` **1.8.0** (`frontend/package.json:18`)
- Class utilities: `clsx` + `tailwind-merge` combined in
  `frontend/src/lib/utils.ts:1-6` (`cn()` helper) — the conventional
  shadcn/ui pattern.
- Testing: `vitest` **4.1.4** + `@vitest/coverage-v8` **4.1.4**
  (`frontend/package.json:31,42`). No component-testing library installed
  (no React Testing Library found in `package.json`).
- Linting: ESLint **9.39.4** flat config
  (`frontend/eslint.config.js`), `typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`. Verified clean run in this session
  (`npx eslint .` → no output).

## Containerization
- `docker-compose.yml` defines two services, `frontend` and `backend`, with
  bind-mounts for live-reload and an anonymous volume for
  `frontend/node_modules` (see `[[environment-setup]]` for the host
  `node_modules` gotcha this causes).
- Backend Dockerfile always launches under `debugpy` (`backend/Dockerfile:12`),
  even in what looks like a "run" command, not just a "debug" command — there
  is no separate prod/dev Dockerfile or CMD variant. Confirmed: this is the
  **only** CMD in the file.

## Ports (see `.agents/rules/ports-and-environments.md` for full detail)
- Frontend: 5173 · Backend: 8000 · Debug (debugpy): 5678
