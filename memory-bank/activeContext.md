# Active Context

_Last updated: 2026-09-06, during initial repo inheritance/audit._

## What was just done
Full read-through of every source file in the repo (`backend/app/*.py`,
`backend/tests/*.py`, all of `frontend/src/**/*.tsx|ts`, all config files),
plus live verification:
- `pytest -q` from `backend/` → **15 passed** (confirms
  `[[testing-conventions]]` claims about backend tests are accurate today).
- `npx vitest run` from `frontend/` → **5 passed**, but only after running
  `npm install` because `frontend/node_modules` was present on disk yet
  **empty** (see `[[environment-setup]]`). This was a real, reproduced
  blocker, not a hypothesis.
- `npx eslint .` from `frontend/` → clean, no errors.
- `npm install` reported 8 audit vulnerabilities (1 low, 1 moderate, 6 high)
  — not yet investigated further (see `.agents/rules/security-notes.md`).

Created from scratch (did not exist before this session, confirmed by failed
`ls` on both paths):
- `.agents/rules/*.md` (6 files: ports-and-environments, backend-data-model,
  frontend-backend-integration-gap, testing-conventions, environment-setup,
  security-notes)
- `.agents/skills/` (directory created, currently empty — no concrete
  repeatable skill was identified yet worth encoding as a `SKILL.md`;
  revisit once a real repeated task emerges)
- `memory-bank/` (this directory)

## Open items to verify with the project owner (not resolved by evidence alone)
1. Is `frontend/src/lib/mock-data.ts` dead code, or used somewhere a grep in
   this session missed (e.g. a Storybook config, a design tool)?
2. Was the frontend ever run successfully outside `docker compose` (bare
   `npm run dev`)? If so, how was the `/api` proxy's hardcoded
   `http://backend:8000` target resolved?
3. Is the `cssVariables: false` vs. actual heavy CSS-variable usage in
   `frontend/src/index.css` an intentional shadcn config choice, or drift?
4. Should the 7 unused backend endpoints (`facets`, `summary`,
   `categories/top`, `comparison`, `alerts`, `b2b`, `b2c`) be wired into the
   UI, or are they intentionally ahead of the frontend (e.g., built for a
   future iteration)? `git log` shows they were added incrementally in
   commits `959bc84` through `87e1942`, all backend-only commits with no
   matching frontend commits — suggests backend-first development, not
   abandonment, but this is inference, not confirmed fact.

## Next likely task
Given the README's step 5 ("Refine and validate the rules until they fit the
project's real workflow"), the next step is for the user to review
`.agents/rules/*.md` and `memory-bank/*.md` against their own understanding
of the project and correct/annotate anything that's wrong or incomplete.
