# Skills

This directory follows the structure documented in the root `README.md`
(`./.agents/skills/<skill-name>/SKILL.md`). A skill should encode a
recurring, multi-step procedure — not a one-off fact, which belongs in
`.agents/rules/` or `memory-bank/` instead.

## Current skills
- [`accessibility-audit`](./accessibility-audit/SKILL.md) — checklist and
  verification procedure for auditing `frontend/src` for keyboard
  navigation, `aria-*`/`role` usage, `alt` text, and color contrast, added
  2026-09-07 after the first real audit pass on the dashboard.
- [`vercel-react-best-practices`](./vercel-react-best-practices/SKILL.md) —
  checklist for images, metadata, layout shift, and fonts, adapted to this
  project's actual stack (a Vite SPA, not Next.js — the skill documents
  which Next.js-specific APIs don't apply here and what to check instead).
  Added 2026-09-07.
- [`typescript-best-practices`](./typescript-best-practices/SKILL.md) —
  strict-compiler-flag audit (`strict`, `noUncheckedIndexedAccess`) verified
  against the real `tsc -b` build, not assumed. Selected over
  performance/testing/seo candidates found via `npx skills find` — see
  `memory-bank/activeContext.md` for why. Added 2026-09-07.

## Internal skill (lives outside this directory, on purpose)
[`agents-rules-freshness`](../../.skills/agents-rules-freshness/SKILL.md)
covers a gap none of the three skills above (or anything findable via
`npx skills find`) can: keeping **this project's own** `.agents/rules/*.md`
files honest as the code they cite keeps changing. Its canonical file lives
at `.skills/agents-rules-freshness/SKILL.md` (not here, since a skill under
`.agents/skills/` is documentation other agents are told to read per
`AGENTS.md`, not a skill in the harness sense). `.claude/skills/agents-rules-freshness/SKILL.md`
is a symlink to that same file, so it's also loadable/invokable via
`/agents-rules-freshness` in a Claude Code session (`.claude/skills/` is the
directory the harness actually scans) without keeping two copies that could
drift apart. First real run (2026-09-07) found 6 of the 20 rule files citing
line numbers or counts that had drifted, and 2 more whose entire premise had
already been resolved by later commits — see the skill file's own
"Hallazgos" section and `memory-bank/activeContext.md` for the corrections
applied and the 2 left for the user to decide on.

Revisit this directory as other tasks are performed more than once in the
same shape (e.g., "add a new metrics endpoint and wire it to the frontend"
would be a plausible next candidate — see commits `959bc84` through
`87e1942` in `git log`, which already follow one repeated pattern: new pure
function + new route + new test).
