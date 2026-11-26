# Skill: TypeScript Best-Practices Audit

## Origin
Selected after running `npx skills find <topic>` against the public
skills.sh registry for several candidate topics on 2026-09-07:
`performance`, `typescript`, `testing`, `seo` (see
`memory-bank/activeContext.md` for the reasoning that picked `typescript`
over the others for this repo). No third-party skill package was installed
— this file distills the common, verifiable core of those registry results
(e.g. `cursor/plugins@typescript-best-practices`,
`alleneubank/claude-code@typescript-best-practices`,
`wshobson/agents@typescript-advanced-types`: strict compiler flags, no
silent `any`, exhaustive checks) into a procedure scoped to what's real in
`frontend/`, rather than pulling in an external, unreviewed skill file
wholesale.

## Constraint
Same as the other skills in this directory: only report or fix a gap that's
traceable to an actual line in an actual config/source file. Enabling a
stricter compiler flag is only a "fix" if it's verified not to break the
real build — never flip a flag and assume it's fine.

## Procedure

1. **Read every tsconfig in the project**, don't assume defaults:
   ```bash
   find frontend -maxdepth 1 -iname "tsconfig*.json" -exec cat {} \;
   ```
   Check specifically for `"strict": true` (or the individual flags it
   turns on: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`,
   etc.). TypeScript defaults every one of these to `false` when `strict`
   is absent — a project can look type-safe in the editor while the
   compiler is silently permitting `any`, unchecked `null`/`undefined`, and
   unsound function assignments.

2. **Never flip `strict` on speculatively.** Enable it, then immediately
   verify with the project's real build pipeline:
   ```bash
   cd frontend
   rm -rf node_modules/.tmp   # tsc's incremental build cache can hide errors on re-run
   npm run build              # runs `tsc -b && vite build`
   npm run lint
   npm run test
   ```
   If `tsc -b` reports errors, that means the codebase currently relies on
   non-strict behavior — fix each reported error for real (add the missing
   null check, the missing type, etc.), don't silence it with `// @ts-ignore`
   or revert the flag without saying so.

3. **Check for other common gaps** while in the config, only reporting ones
   actually present:
   - `noUncheckedIndexedAccess` (off by default even under `strict`) — worth
     testing whenever the code does dynamic-key lookups into an array/
     `Record` (`grep -rn "\[.*Key\]\|\[i\]\|\[index\]"` as a starting point,
     then read each hit — don't trust the grep alone, confirm the key is
     actually dynamic and not a fixed literal like `data[0]`). Enable it the
     same way as `strict`: flip it, run `tsc -b`, and treat every reported
     error as a real possibly-undefined path to fix, not noise to suppress.
   - `any` used explicitly in source (`grep -rn ": any\b\|as any" frontend/src`)
     — `strict` doesn't catch these, only implicit `any`.
   - Inconsistent `interface` vs `type` usage, missing return types on
     exported functions — lower priority, don't invent a fix if the existing
     codebase is already consistent.

4. **Justify the change** in `memory-bank/activeContext.md` (or the PR
   description, if one is open) with the actual verification output — "it
   builds" is a claim, `npm run build`'s real output is evidence.

## Findings from the 2026-09-07 run
- `frontend/tsconfig.app.json` and `frontend/tsconfig.node.json` had no
  `strict` flag (confirmed by reading both files in full — neither
  contained the string `"strict"` anywhere).
- Enabled `"strict": true` in both. Verified with `npm run build` (`tsc -b`
  reported zero errors — the existing code was already strict-clean, so
  this was a zero-risk config change on its own), `npm run lint`, and
  `npm run test` (5 passed).
- Also tried `"noUncheckedIndexedAccess": true` (not part of `strict`).
  First attempt at claiming "no dynamic-key indexing exists" was wrong —
  `tsc -b` immediately proved it by failing with 6 real errors:
  `frontend/src/lib/financial-utils.ts:57` destructured
  `monthlyMap[yearMonthKey]` (a `Record<string, ...>` keyed by a
  runtime-computed string) without the compiler being able to see the
  earlier existence guard, and this session's own new `chartLabel` code in
  `income-outcome-chart.tsx`/`profit-percent-chart.tsx` read `data[0].month`
  guarded only by a `data.length > 0` check the compiler doesn't correlate
  with index 0 being defined. Fixed all three for real (not suppressed):
  `financial-utils.ts` now iterates `Object.entries(monthlyMap)` instead of
  re-indexing by key, and both chart files use `data[0]?.month` /
  `data.at(-1)?.month` with a truthiness check instead of asserting the
  indices exist. Re-ran `npm run build`/`lint`/`test` clean after the fix,
  and kept `noUncheckedIndexedAccess: true` in both tsconfigs since it
  caught a real (if currently harmless) fragility, not just theoretical
  risk.
- No explicit `any` found (`grep -rn ": any\b\|as any" frontend/src`
  returned nothing), so nothing to fix there.
