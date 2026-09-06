# Environment Setup

## Documented path (README)
`docker compose up --build` from repo root is the only setup step documented
in `README.md:39-43`. It builds both services from `docker-compose.yml`:
- `frontend` from `frontend/Dockerfile` (Node 24 alpine, `npm install` then
  `npm run dev -- --host 0.0.0.0 --port 5173`)
- `backend` from `backend/Dockerfile` (Python 3.13 slim, `pip install -r
  requirements.txt` then `uvicorn` with `debugpy` attached)

## Verified gap — local (non-Docker) frontend setup
In this session, `frontend/node_modules` existed on disk but was **empty (0
files)**, which broke `vitest`/`vite` immediately with
`ERR_MODULE_NOT_FOUND` on `vite` itself. Running `npm install` from
`frontend/` fixed it (272 packages installed). This is consistent with the
`docker-compose.yml:8-10` volume mount pattern:
```
volumes:
  - ./frontend:/app
  - /app/node_modules
```
The second line is an anonymous volume that keeps container-installed
`node_modules` from being overwritten by the host bind-mount — but it also
means **the host's `frontend/node_modules` is never populated by `docker
compose up`**. If you need to run `npm`, `vite`, `vitest`, or `eslint`
directly on the host (outside the container), you must run `npm install`
inside `frontend/` yourself first. This is not mentioned in `README.md`.

## Verified: backend can run outside Docker too
`backend/tests/conftest.py:1-7` and `backend/app/__init__.py` are structured
so `pytest` and `uvicorn` work from a plain virtualenv with
`pip install -r backend/requirements.txt` — verified working in this session.

## Dependency pinning
`backend/requirements.txt` has **no version pins** (`fastapi`, `uvicorn[standard]`,
`debugpy`, `pytest`, `pytest-cov`, `httpx` — all unpinned, see
`backend/requirements.txt:1-6`). This is a reproducibility risk: a fresh
`pip install` today vs. in 6 months can pull different major versions.
Flag this if asked to "harden" or "productionize" the backend — don't
silently pin versions without asking, since the project may intentionally
want latest-always during coursework.
