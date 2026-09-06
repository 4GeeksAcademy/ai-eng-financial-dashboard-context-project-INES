# Testing Conventions

## Backend
- Framework: `pytest` + FastAPI's `TestClient` (from `httpx`).
  Source: `backend/tests/test_routes.py:1-9`.
- Test file imports app internals directly for unit-level tests
  (`filter_movements_by_date`, `generate_mock_movements`) alongside full
  HTTP-level tests via `TestClient(app)` — both styles coexist in the same
  file (`backend/tests/test_routes.py`). Follow this pattern: pure functions
  get direct unit tests, routes get `client.get(...)` integration tests.
- `backend/tests/conftest.py:1-7` manually inserts the repo root into
  `sys.path` so `from app...` imports resolve without installing the package.
  This means tests must be run with the working directory at `backend/`
  (not from repo root), matching how `backend/app/__init__.py:1` documents
  itself: "Marks app as a package for imports in tests and runtime."
- Command (verified working in this session): `pytest -q` from `backend/`
  → 15 passed.
- `pytest-cov` and `httpx` are declared as dependencies
  (`backend/requirements.txt:4-6`) — no `pytest.ini`/`pyproject.toml` coverage
  config was found in the repo, so coverage thresholds are not enforced
  automatically today.

## Frontend
- Framework: `vitest` (not Jest). Scripts: `npm run test` (single run),
  `npm run test:watch`, `npm run test:coverage`.
  Source: `frontend/package.json:11-13`.
- Only one test file exists today: `frontend/src/lib/financial-utils.test.ts`,
  covering `computeKPIs`, `computeMonthlyData`, `formatCurrency`,
  `formatPercent` — pure functions only. **No component tests exist** (no
  `@testing-library/react` or similar in `frontend/package.json`
  dependencies/devDependencies).
- Verified working in this session: `npx vitest run` → 5 passed, after running
  `npm install` (see `environment-setup.md` for why that step was necessary).
- New UI logic should go into `frontend/src/lib/*.ts` as pure, testable
  functions (as `computeKPIs`/`computeMonthlyData` already do) rather than
  inline in components, to keep it testable without a component-testing
  library.
