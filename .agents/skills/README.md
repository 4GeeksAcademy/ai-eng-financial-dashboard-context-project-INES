# Skills

Empty by design as of 2026-09-06.

This directory follows the structure documented in the root `README.md`
(`./.agents/skills/<skill-name>/SKILL.md`), but no `SKILL.md` has been
written yet because no concrete, repeated agent task has been identified in
this project that would justify one (a skill should encode a recurring,
multi-step procedure — not a one-off fact, which belongs in `.agents/rules/`
or `memory-bank/` instead).

Revisit this directory once a task is performed more than once in the same
shape (e.g., "add a new metrics endpoint and wire it to the frontend" would
be a plausible candidate, since it already has a repeated shape across the
git history — see commits `959bc84` through `87e1942` in `git log`, all
following the same pattern: new pure function + new route + new test).
