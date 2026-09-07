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

Revisit this directory as other tasks are performed more than once in the
same shape (e.g., "add a new metrics endpoint and wire it to the frontend"
would be a plausible next candidate — see commits `959bc84` through
`87e1942` in `git log`, which already follow one repeated pattern: new pure
function + new route + new test).
