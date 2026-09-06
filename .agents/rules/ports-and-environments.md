# Ports & Environments

## Rule
- Backend (FastAPI/Uvicorn) listens on **8000**; debugpy listens on **5678**.
  Source: `backend/Dockerfile:10-12` (`EXPOSE 8000 5678`, `CMD [... "0.0.0.0:5678", ... "--port", "8000" ...]`), `docker-compose.yml:18-20`.
- Frontend (Vite dev server) listens on **5173**.
  Source: `frontend/Dockerfile:10-12`, `docker-compose.yml:6-7`.
- Docs (Swagger UI) are served by FastAPI's default `/docs` route (not a custom route — no route named `/docs` exists in `backend/app/routes.py`; it comes from FastAPI's default behavior when a `FastAPI()` app is instantiated, per `backend/app/main.py:6`).
- Never hardcode `http://localhost:8000` in frontend code. In Docker Compose, the frontend proxies `/api` to the **service name** `backend`, not `localhost`:
  Source: `frontend/vite.config.ts:11-16` — `target: "http://backend:8000"`.
- `VITE_API_BASE_URL` is optional and only needed when the frontend must call a backend origin other than the same-origin Vite proxy. Default is `""` (relative path), confirmed in `frontend/src/App.tsx:13`.

## Verified gap (not yet resolved by the repo — flag before assuming)
- Running `npm run dev` **outside** `docker compose` (i.e., without the `backend` hostname resolvable) will make the `/api` proxy fail, because `vite.config.ts` hardcodes `target: "http://backend:8000"` with no env-based override. There is no `VITE_API_BASE_URL` fallback wired into `vite.config.ts` (only into `App.tsx`'s fetch call). If you need local dev without Docker, you must either run the backend on `localhost:8000` and edit the proxy target, or rely on `VITE_API_BASE_URL` and skip the proxy entirely — this is not documented anywhere in `README.md`.

## Why this matters
Agents that "fix" a broken local dev setup by pointing the frontend fetch at `http://localhost:8000` will work when running outside Docker, but will silently break the Docker Compose flow (where `backend` is the correct hostname, not `localhost`), and vice versa. Always check whether the current run context is Docker Compose or bare `npm run dev` before changing API base URLs.
