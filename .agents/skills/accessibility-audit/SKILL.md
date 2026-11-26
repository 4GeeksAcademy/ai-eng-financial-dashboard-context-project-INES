# Skill: Accessibility Audit (Frontend Dashboard)

## When to use
Run this whenever new UI is added to `frontend/src/components/**` or `App.tsx`,
or when asked to check/improve accessibility. It encodes the procedure used
in the audit performed on 2026-09-07 (see git history on branch
`feature/agent-skills` for the resulting diff).

## Constraint
Only report or fix issues that are traceable to an actual line in an actual
file. Do not invent UI, assume a component exists, or "improve" something
based on a general best-practice list alone — every finding below was
produced by grepping/reading the real files listed, and every fix is scoped
to the smallest change that closes the gap. If a check can't be verified
against real code (e.g., no interactive elements exist yet to test keyboard
flow), say so explicitly instead of guessing.

## Procedure

1. **Inventory interactive/visual elements** — don't assume from memory:
   ```bash
   grep -rn "tabIndex\|<button\|<a \|onClick\|onKeyDown" frontend/src --include="*.tsx"
   grep -rn "img\|alt=" frontend/src --include="*.tsx" --include="*.ts"
   grep -rn "aria-\|role=" frontend/src --include="*.tsx"
   ```
   If the interactive-element grep is empty, keyboard-navigation findings are
   limited to "no focusable elements exist today" — don't fabricate a
   keyboard trap or tab-order bug that can't exist.

2. **Heading structure** — read every component that renders a title-like
   string (e.g. `CardTitle` in `frontend/src/components/ui/card.tsx`) and
   confirm it's a real heading element (`h1`-`h6`), not a styled `div`/`span`.
   Screen-reader users navigate by heading; a visually-bold `div` is invisible
   to that navigation mode.

3. **Status messages** (WCAG 4.1.3) — for every `loading`/`error` state in
   `App.tsx` and the `*Skeleton` fallbacks under
   `frontend/src/components/dashboard/`, confirm the state change is
   exposed via `role="status"`/`role="alert"` + `aria-live`, not just a
   visual change. Silent DOM swaps are invisible to screen readers.

4. **Non-text content** (WCAG 1.1.1) — for any chart/graph (this project uses
   `recharts` under `frontend/src/components/dashboard/*-chart.tsx`), check
   whether the rendered SVG has a text alternative. Recharts ships none by
   default: tooltips are mouse/hover-only. Minimum fix is a wrapping
   `role="img"` + `aria-label` summarizing the series and date range from the
   actual data prop (not a static string) on the chart container.

5. **Color contrast** — read the actual CSS custom properties (this project
   defines them as OKLCH triples in `frontend/src/index.css`, under `:root`
   and `.dark`). Do not eyeball hex/oklch values. Convert OKLCH → linear
   sRGB → WCAG relative luminance and compute the real contrast ratio for
   every foreground/background pair actually used together in a component
   (check `className`s for `text-*` + the container's `bg-*`, including
   Tailwind opacity modifiers like `bg-destructive/10`, which must be
   alpha-blended over the ancestor background before computing luminance).
   Flag failures against WCAG AA (4.5:1 normal text, 3:1 large text ≥18px or
   ≥14px bold). Note explicitly which theme (`:root` vs `.dark`) is actually
   reachable at runtime — check for a hardcoded `className="dark"` (as in
   `App.tsx`) before auditing a theme that may never render.

6. **Page-level basics** — `frontend/index.html`: confirm `<html lang="...">`
   is set and `<title>` is a real, descriptive name (not a placeholder like
   `"frontend"` / `"Vite App"`).

7. **Verify, don't just patch**: after any fix, run from `frontend/`:
   ```bash
   npm install   # only if node_modules is empty — see [[environment-setup]]
   npm run lint
   npm run test
   npm run build
   ```
   All three must stay green. A change that "fixes" accessibility but breaks
   the build or an existing test is not an acceptable fix.

## Known findings from the 2026-09-07 run (fixed on this branch)
- `frontend/index.html` — `<title>` was the Vite placeholder `"frontend"`.
- `frontend/src/components/ui/card.tsx` — `CardTitle` rendered a `<div>`;
  its only two call sites (`income-outcome-chart.tsx`,
  `profit-percent-chart.tsx`) are real section headings, so it now renders
  `<h3>`.
- `frontend/src/App.tsx` — the fetch-error banner had no `role="alert"`, and
  the loading state had no `aria-live` announcement.
- `frontend/src/components/dashboard/income-outcome-chart.tsx` and
  `profit-percent-chart.tsx` — the recharts SVG had no text alternative;
  added a `role="img"` wrapper with a data-driven `aria-label`.

## Known non-issues from that run (checked, not fixed, because verified fine)
- Contrast: every foreground/background pair actually reachable at runtime
  (theme is hardcoded to `.dark` via `App.tsx`'s `className="dark"`) passes
  WCAG AA — lowest measured ratio was 5.17:1 (`muted-foreground` on `card`).
  The `:root` (light) palette in `index.css` is currently unreachable code;
  it was not audited for contrast since nothing renders it.
- Keyboard navigation: as of this run there are zero focusable elements
  (`grep` for `button`/`a href`/`tabIndex`/`onClick` in
  `frontend/src/components/**` returned nothing), so there is no tab order
  or focus-trap bug to find. `frontend/src/index.css:112-114` already applies
  a default focus ring (`outline-ring/50`) globally, so the first interactive
  element added later gets visible focus for free — re-check this line still
  exists before assuming it going forward.
- `alt` text: no `<img>` tags exist in any component (the only image asset,
  `frontend/src/assets/hero.png`, is unused — a dead-code note, not an
  accessibility bug).
