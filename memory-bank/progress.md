# Progress

## Verified working (evidence: ran it in this session)
- [x] Backend test suite: `pytest -q` from `backend/` → 15/15 passed.
- [x] Frontend test suite: `npx vitest run` from `frontend/` → 5/5 passed
      (after `npm install`, see below).
- [x] Frontend lint: `npx eslint .` from `frontend/` → clean.
- [x] Backend routes respond as expected under test (covered by
      `backend/tests/test_routes.py`, all 9 routes exercised by name).

## Verified broken / needs attention
- [ ] `frontend/node_modules` was present but empty at session start; fixed
      in-session via `npm install` (272 packages). Not persisted as a repo
      fix — this is an environment/machine-state issue, not a code bug. If
      this recurs, re-run `npm install` in `frontend/`.
- [ ] `npm audit` reports 8 vulnerabilities (1 low, 1 moderate, 6 high) in
      frontend transitive dependencies — not triaged yet.
- [ ] `backend/requirements.txt` has no version pins — reproducibility risk,
      not yet addressed.

## Not yet built (per README's aspirational structure, now started)
- [x] `.agents/rules/` — 6 rule files created this session, each cited to
      source.
- [ ] `.agents/skills/` — directory created but empty; no `SKILL.md` written
      yet because no concrete, repeated task has been identified that
      warrants one.
- [x] `memory-bank/` — this directory, created this session
      (`projectbrief.md`, `techContext.md`, `systemPatterns.md`,
      `activeContext.md`, `progress.md`).

## Known unused surface area (not "broken", just unconnected)
7 of 9 backend endpoints have no frontend caller yet:
`/api/metrics/facets`, `/api/metrics/summary`,
`/api/metrics/categories/top`, `/api/metrics/comparison`,
`/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`.
See `[[frontend-backend-integration-gap]]`.
