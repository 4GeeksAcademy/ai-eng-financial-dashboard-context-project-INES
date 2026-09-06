# Backend Data Model & Mock Data Behavior

## Rule
- There is **no database and no persistence layer**. All financial data is generated in-memory per request by `generate_mock_movements(seed=42)`.
  Source: `backend/app/routes.py:94-104`, called fresh inside every route handler (e.g. `backend/app/routes.py:255,264,277,295,311,350,370,386`).
- The mock generator is **deterministic** because every call passes `seed=42` — two requests to the same endpoint with the same query params return identical data. Do not assume randomness across requests; do not "fix" apparent non-determinism without first checking the seed.
- The mock dataset always covers **12 months, 30 movements/month = 360 movements/year**, verified by `backend/tests/test_routes.py:12-16` (`assert len(movements) == 360`) and reproduced by running `pytest` in this session (15 passed).
- Categories are a **closed enum**, not free text: `suppliers | sales | operational | administrative | others` (`backend/app/routes.py:12-13`). ⚠️ **Corrección (2026-09-06)**: una versión anterior de esta regla decía que `sales`/`others` eran exclusivos de income y los otros cuatro exclusivos de outcome — eso es incorrecto. `others` está en **ambos lados**: aparece en `OUTCOME_CATEGORIES` (`backend/app/routes.py:17`, usado para outcome) y también se sortea para el 10% de los movimientos de income (`backend/app/routes.py:79`: `"sales" if random.random() < 0.9 else "others"`). Verificado en vivo: `GET /api/metrics/categories/top?operation_type=outcome&limit=3` devolvió `others` como la categoría de outcome con mayor total (`224428.44`), lo cual sería imposible si `others` fuera income-only. La distribución real es: `sales` → **solo income** (90% de los income); `suppliers`/`operational`/`administrative` → **solo outcome**; `others` → **compartida** entre income (10% de los income) y outcome (1 de 4 categorías vía `OUTCOME_CATEGORIES`). Enforced en `_build_movement` (`backend/app/routes.py:71-91`).
- `business_type` is `B2B | B2C` with a fixed 55/45 split baked into the generator (`backend/app/routes.py:76`: `"B2B" if random.random() < 0.55 else "B2C"`). This ratio is a mock-data artifact, not a business rule — do not treat it as a real KPI target.

## Adding a new field or metric
Any new financial dimension must be added in three places to stay consistent, or it will silently diverge:
1. `FinancialMovement` Pydantic model (`backend/app/routes.py:22-27`)
2. `_build_movement` mock generator (`backend/app/routes.py:71-91`)
3. Frontend's mirrored type `FinancialMovement` in `frontend/src/lib/financial-types.ts:5-11` — these two type definitions are **not shared/generated**, they are manually kept in sync across languages. Verify both when changing the schema.
