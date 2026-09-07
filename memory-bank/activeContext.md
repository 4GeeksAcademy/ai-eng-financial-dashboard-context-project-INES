# Active Context

_Last updated: 2026-09-07, after adding a 4th, internal skill
(`agents-rules-freshness`) and running it for real against `.agents/rules/`,
on top of the three `.agents/skills/` added earlier the same day — see below,
oldest section last. Branch `feature/agent-skills`. Full detail on every
line below is in `memory-bank/progress.md`'s "Skills applied" section and
each skill's own `SKILL.md`; this is the index, not the source of truth._

## Registro rápido (2026-09-07)

| # | Skill | Tipo | Cambios verificados |
|---|-------|------|----------------------|
| 1 | `[[accessibility-audit]]` | Externa, adaptada | `<title>` real, `CardTitle`→`h3`, `role="alert"`/`aria-live`, `role="img"`+`aria-label` en charts. `lint`/`test`/`build` verdes. |
| 2 | `[[vercel-react-best-practices]]` | Externa, adaptada (Next.js→Vite) | `<meta description>`, fuente `Inter` realmente cargada, skeletons alineados al `line-height` real. `lint`/`test`/`build` verdes, sin warnings nuevos. |
| 3 | `[[typescript-best-practices]]` | **Skill adicional elegida** (de 4 buscadas con `npx skills find`: performance/seo/testing/typescript) | `strict: true` (0 errores) + `noUncheckedIndexedAccess: true` (6 errores reales encontrados y corregidos, no suprimidos) en ambos `tsconfig.*.json`. |
| 4 | `[[agents-rules-freshness]]` | **Skill interna creada** (gap que ninguna externa cubre) | 20/20 reglas de `.agents/rules/` re-verificadas: 12 vigentes, 8 desactualizadas (6 corregidas, 2 marcadas resueltas y dejadas para decisión del dueño). |

Todas las skills quedaron guardadas y son releíbles: 1-3 en
`.agents/skills/<nombre>/SKILL.md`, la 4 en
`.claude/skills/agents-rules-freshness/SKILL.md` (ver esa sección más abajo
para por qué el path es distinto). Ningún cambio de código se hizo sin
correr `npm run lint`/`test`/`build` (frontend) o `pytest -q` (backend)
después — el detalle de cada corrida está en las secciones fechadas de más
abajo y en `progress.md`.

## 2026-09-07 (later): internal skill — `agents-rules-freshness`

### The gap, and why no external skill covers it
Everything found via `npx skills find` earlier today (see the section right
below) is a generic web/language practice. None of it — nor anything else
findable on the public skills.sh registry — can know that **this repo**
maintains its own hand-written `.agents/rules/*.md` memory bank, or verify
whether those files still match the code they cite. That upkeep is entirely
project-specific, so it became its own skill instead of a 4th
`.agents/skills/` entry: [[agents-rules-freshness]], stored at
`.claude/skills/agents-rules-freshness/SKILL.md` (the directory Claude Code
actually scans to make a skill loadable in-session — `.agents/skills/` is
this project's own read-this-first convention for agents, not a harness
discovery path; confirmed via the `claude-code-guide` subagent rather than
assumed). Objective/inputs/output/acceptance-criteria are in the skill file
itself.

### First real run: 20 rules audited, 8 stale, 0 unverifiable
Full procedure run against every file in `.agents/rules/` (not a sample):
re-read each rule's own "Evidencia" section, re-ran every cited grep/command,
and re-read every cited `archivo:línea` to confirm it still says what the
rule claims.

- **12 rules verified VIGENTE** (unchanged) — see the skill file's
  "Hallazgos" section for the full list.
- **6 rules had drifted line numbers or counts, corrected in place** (same
  meaning, updated evidence): `frontend-backend-integration-gap.md` and
  `seven-of-nine-endpoints-have-no-frontend-caller.md` (the frontend now
  calls 2 endpoints, not 1 — `/api/metrics/facets` got wired up in commit
  `eeece05` after both rules were written; 6 endpoints unused, not 7),
  `ports-and-environments.md` and `vite-proxy-docker-hostname-coupling.md`
  (`vite.config.ts` and `App.tsx` line references had shifted),
  `mock-data-file-has-no-confirmed-consumer.md` (same App.tsx drift),
  `shadcn-config-contradicts-actual-css-strategy.md` (`components.json:9`
  → `:10`).
- **2 rules were NOT edited**, per the skill's own acceptance criterion
  against unilateral rewrites when a correction would change a rule's
  meaning rather than just a number: `mock-data-date-range-is-a-rolling-window.md`
  and `ui-period-label-hardcoded-vs-generated-data.md` are both fully
  **resolved** — the bugs they warned about were already fixed (the
  comparison test now uses a relative date range and asserts a real value;
  `App.tsx` now derives the period label from `facets.min_date`/`max_date`
  instead of hardcoding "2024 - Full Year"). **Needs a decision from the
  project owner**: mark them resolved/archived, delete them, or leave as
  historical record — not something to infer from the code.
- **Bonus, out of this skill's declared scope** (it audits `.agents/rules/`,
  not `memory-bank/`): `memory-bank/productContext.md:114-128` repeats the
  same three now-false claims (7-of-9 count, the hardcoded-date test bug,
  the hardcoded period string). Left untouched — flagging for the same
  owner decision as above, and as a candidate to extend this skill's scope
  to `memory-bank/*.md` if asked again.

Nothing in `frontend/` or `backend/` was touched this round — every change
was to `.md` files in `.agents/rules/`, so no lint/test/build re-run was
needed (verified anyway: `pytest -q` from `backend/` → 15 passed, confirming
one of the re-checked facts along the way).

## 2026-09-07 (earlier): skills added and why `typescript-best-practices` was picked

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
