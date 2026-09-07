# Active Context

_Last updated: 2026-09-07, after adding three real skills to `.agents/skills/`
and applying each to `frontend/` on branch `feature/agent-skills`._

## 2026-09-07: skills added and why `typescript-best-practices` was picked

Three `.agents/skills/*/SKILL.md` files were added this session (the
directory was empty as of 2026-09-06 — see below). Each was applied for
real against `frontend/` and verified with `npm run lint`/`test`/`build`,
not just written speculatively:

1. `[[accessibility-audit]]` — keyboard nav, `aria-*`/`role`, `alt`,
   contrast. Fixed: placeholder `<title>`, `CardTitle` rendering `<div>`
   instead of `<h3>`, missing `role="alert"`/`aria-live` on error/loading
   states, and charts with no text alternative. Contrast and keyboard nav
   were checked and found compliant/not-applicable (see the skill file for
   the actual computed WCAG ratios).
2. `vercel-react-best-practices` — images, metadata, layout shift, fonts.
   **First check the skill itself insists on**: this is a Vite SPA, not
   Next.js (no `next` dependency, no `next.config.*`, no `app`/`pages` dir)
   — `next/image` and the Next.js `metadata` export don't apply and were
   not force-fit. What was real and fixed instead: missing
   `<meta name="description">`, an `Inter` font declared in `index.css` but
   never actually loaded anywhere, and skeleton-loader dimensions that
   didn't match their real content's Tailwind line-height (verified against
   `node_modules/tailwindcss/theme.css`, not eyeballed).
3. `typescript-best-practices` — see justification below.

### Why `typescript-best-practices` over the other `npx skills find` results
Ran `npx skills find <topic>` against the public skills.sh registry for
four topics to survey what exists, per the user's request:
- `performance` → strong candidates (`addyosmani/web-quality-skills@performance`,
  `addyosmani/agent-skills@performance-optimization`). Real, matching gap in
  this repo: `vite build` already warns "Some chunks are larger than 500 kB"
  — a legitimate finding, but fixing it means code-splitting a single-page
  dashboard (no routes to split on), which is a bigger, riskier change than
  the other options and wasn't picked for this pass; the warning is
  documented as still-open in `vercel-react-best-practices`'s findings.
- `seo` → registry mostly returned marketing/content-writer skills
  (`coreyhaines31/marketingskills@seo-audit`, etc.), not applicable: this is
  an internal, client-rendered executive dashboard with no server rendering
  and no reason to be indexed by search engines. Same category of mismatch
  as `next/image` above — skipped rather than force-applied.
- `testing` → top hit was `anthropics/skills@webapp-testing` (Playwright/
  browser-driven E2E). Real gap exists (only unit tests via `vitest` today,
  no E2E), but it's a bigger scope addition (new test infra, browser
  automation) than "apply one more skill" warranted in this pass — good
  next candidate, not done now.
- `typescript` → picked. Reason: reading `frontend/tsconfig.app.json` and
  `frontend/tsconfig.node.json` directly (not the registry) showed neither
  had `"strict"` set at all — a config gap that's cheap to verify (a single
  `tsc -b` run proves whether it's safe) and, unlike the other three, didn't
  require adding new tooling or scope to fix. Applied `"strict": true` to
  both — the existing code was already strict-clean (`tsc -b` reported zero
  errors). Went one step further and tried `"noUncheckedIndexedAccess": true`
  too; it was **not** speculative — `tsc -b` immediately failed with 6 real
  errors (a `Record`-keyed lookup in `financial-utils.ts` and this session's
  own new `data[0]`-style chart-label code), each fixed for real (see the
  skill file's findings section for the exact diffs), then re-verified
  green.

No third-party skill package was installed from the registry results above
— each `SKILL.md` in this repo is a from-scratch procedure grounded in this
project's actual files, not a copy of an external one.

## 2026-09-06: initial repo inheritance/audit

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
