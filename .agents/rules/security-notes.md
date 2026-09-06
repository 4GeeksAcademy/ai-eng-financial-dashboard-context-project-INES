# Security Notes (observed, not exhaustive)

## CORS configuration is fully open
`backend/app/main.py:7-13`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
`allow_origins=["*"]` combined with `allow_credentials=True` is a
known-invalid/unsafe CORS combination per the Fetch/CORS spec (browsers
either reject it or drop credentials silently). Today it likely has no
practical impact because there is no auth/cookies/session mechanism anywhere
in the backend (no `Authorization` header handling, no cookie-setting code
found in `backend/app/`), but do not copy this CORS block into a project that
adds authentication without revisiting it first.

## No authentication/authorization anywhere
Verified by reading all of `backend/app/main.py` and `backend/app/routes.py`:
no auth dependency, no API key check, no user model. All 9 routes are fully
public. This is expected for a learning/mock-data project — flag it, don't
"fix" it unprompted.

## `npm audit` findings (this session)
Running `npm install` in `frontend/` in this session reported **8
vulnerabilities (1 low, 1 moderate, 6 high)** in transitive dependencies. I
did not enumerate which packages, since this needs `npm audit` output review
and a decision on whether fixes are within scope — do not run `npm audit fix
--force` without checking what it changes (it can bump major versions).
