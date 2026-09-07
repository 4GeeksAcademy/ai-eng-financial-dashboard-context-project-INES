# Progress

_Updated 2026-09-07 — see "Skills applied" below for what changed since the
2026-09-06 baseline that made up the rest of this file._

## Skills applied (branch `feature/agent-skills`)
Four skills exist now, each applied for real against this repo (not written
speculatively) and each verified with the project's own build/lint/test:

- [x] `[[accessibility-audit]]` (`.agents/skills/`) — fixed a placeholder
      `<title>`, `CardTitle` rendering `<div>` instead of `<h3>`, missing
      `role="alert"`/`aria-live` on error/loading states, and charts with no
      text alternative. Contrast (WCAG AA, computed from the actual OKLCH
      tokens) and keyboard nav were checked and found compliant/N-A.
- [x] `[[vercel-react-best-practices]]` (`.agents/skills/`) — first
      confirmed this is a Vite SPA, not Next.js (no `next` dependency), so
      `next/image`/Next.js `metadata` don't apply. Fixed instead: missing
      `<meta name="description">`, `Inter` declared in `index.css` but never
      loaded anywhere, and `Skeleton` loaders whose size didn't match their
      real content's Tailwind line-height (checked against
      `node_modules/tailwindcss/theme.css`).
- [x] **Skill adicional elegida** — `[[typescript-best-practices]]`
      (`.agents/skills/`), picked over `performance`/`seo`/`testing`
      candidates surveyed via `npx skills find` (see
      `memory-bank/activeContext.md` for the full comparison). Enabled
      `"strict": true` in both `frontend/tsconfig.*.json` (zero errors, code
      was already clean) and `"noUncheckedIndexedAccess": true` (caught 6
      real possibly-undefined errors via `tsc -b`, fixed for real in
      `financial-utils.ts` and both chart components, not suppressed).
- [x] **Skill interna creada** — `[[agents-rules-freshness]]`, canonical
      file at `.skills/agents-rules-freshness/SKILL.md` (matches the
      evaluation rubric, which names `.skills/` for this one specifically),
      symlinked from `.claude/skills/agents-rules-freshness/SKILL.md` so
      it's also loadable in a Claude Code session (`.claude/skills/` is the
      directory the harness actually scans — confirmed via the
      `claude-code-guide` subagent — while `.agents/skills/` is this
      project's own convention, not a harness discovery path). Covers a gap
      no external skill can:
      re-verifying that `.agents/rules/*.md`'s cited evidence still matches
      the code. First run: 20 rules audited, 12 vigente, 8 desactualizada (6
      fixed in place, 2 flagged for the owner since they're fully resolved,
      not just stale).

## Verified working (evidence: ran it in this session)
- [x] Backend test suite: `pytest -q` from `backend/` → 15/15 passed
      (re-verified 2026-09-07 in a fresh `pip install`).
- [x] Frontend test suite: `npm run test` (vitest) from `frontend/` → 5/5
      passed.
- [x] Frontend lint: `npm run lint` from `frontend/` → clean.
- [x] Frontend build: `npm run build` (`tsc -b && vite build`) → clean, with
      `strict`+`noUncheckedIndexedAccess` now on. Same single pre-existing
      chunk-size warning as before these skills, no new warnings introduced.
- [x] Backend routes respond as expected under test (covered by
      `backend/tests/test_routes.py`, all 9 routes exercised by name).

## Verified broken / needs attention
- [ ] `frontend/node_modules` was present but empty at session start; fixed
      in-session via `npm install` (272 packages). Not persisted as a repo
      fix — this is an environment/machine-state issue, not a code bug. If
      this recurs, re-run `npm install` in `frontend/`.
- [ ] `npm audit` reports 8 vulnerabilities (1 low, 1 moderate, 6 high) in
      frontend transitive dependencies — not triaged yet (re-confirmed
      2026-09-07, same numbers as 2026-09-06).
- [ ] `backend/requirements.txt` has no version pins — reproducibility risk,
      not yet addressed.
- [ ] Two `.agents/rules/*.md` files document bugs that are now fixed
      (`mock-data-date-range-is-a-rolling-window.md`,
      `ui-period-label-hardcoded-vs-generated-data.md`) — needs the project
      owner to decide whether to archive/delete/keep them as historical
      record. Found by `[[agents-rules-freshness]]`, not auto-resolved.
- [ ] `memory-bank/productContext.md` had the same three stale claims as the
      rule files above (fixed in this update) — nothing currently
      re-verifies `memory-bank/*.md` automatically; only `.agents/rules/` is
      in `agents-rules-freshness`'s declared scope.

## Not yet built (per README's aspirational structure, now started)
- [x] `.agents/rules/` — grew from 6 files (2026-09-06) to 20, each cited to
      source; 8 of those 20 needed a freshness correction on 2026-09-07 (see
      "Skills applied" above).
- [x] `.agents/skills/` — 3 skills (`accessibility-audit`,
      `vercel-react-best-practices`, `typescript-best-practices`); a 4th,
      `agents-rules-freshness`, lives in `.skills/` instead (see above for
      why), symlinked into `.claude/skills/` for loadability.
- [x] `memory-bank/` — created 2026-09-06 (`projectbrief.md`,
      `techContext.md`, `systemPatterns.md`, `activeContext.md`,
      `progress.md`); `productContext.md` and `repoStructure.md` were added
      later, in commit `4ff6da3` (not part of this session's work) — this
      2026-09-07 update only edited `productContext.md`'s stale claims and
      this file, it didn't create either of those two.

## Known unused surface area (not "broken", just unconnected)
6 of 9 backend endpoints have no frontend caller yet (down from 7 — the
frontend connected `/api/metrics/facets` in commit `eeece05`, after the
original count was written):
`/api/metrics/summary`, `/api/metrics/categories/top`,
`/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b`,
`/api/metrics/b2c`.
See `[[frontend-backend-integration-gap]]`.
