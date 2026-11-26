# Skill: Vercel/React Best-Practices Audit (adapted for this Vite SPA)

## Framework check — do this FIRST, every run
This checklist is commonly framed around Next.js APIs (`next/image`,
`next/font`, the App Router `metadata` export). **This repo is not a
Next.js app.** Verified evidence, re-check on every run since this could
change:
```bash
grep -in "next" frontend/package.json      # no "next" dependency
find frontend -maxdepth 1 -iname "next.config*"   # none
find frontend -maxdepth 1 -type d -iname "app" -o -type d -iname "pages"  # none (Next.js router dirs)
```
It's a Vite + React SPA (`frontend/vite.config.ts`, `"dev": "vite"` in
`frontend/package.json`) with a single `frontend/index.html` entry point and
no server-rendering framework. `next/image` and the Next.js `metadata`
export **cannot be used here** — `next` isn't installed, so importing them
would fail the build. Do not "apply" them literally. Translate each
practice's underlying goal to its plain-Vite/HTML equivalent instead, and
say explicitly which Next.js-specific APIs were skipped and why.

## Checklist (translated to this stack)

1. **Images (`next/image` equivalent)** — grep first, don't assume:
   ```bash
   grep -rn "<img" frontend/src --include="*.tsx"
   ```
   `next/image`'s real goals are: explicit `width`/`height` (or `aspect-ratio`)
   to reserve layout space, lazy-loading below the fold, and modern format
   serving. If `<img>` tags exist, check each has explicit dimensions and
   `loading="lazy"` for offscreen images. If the grep is empty (as of
   2026-09-07 it is — the only image asset, `frontend/src/assets/hero.png`,
   is unused), say "no images rendered, nothing to fix" — don't invent one.

2. **Metadata (`metadata` export equivalent)** — this app has no
   server-rendered `<head>` API, so metadata lives directly in
   `frontend/index.html`. Confirm it has: a real (non-placeholder) `<title>`,
   a `<meta name="description">` grounded in the app's actual purpose (pull
   wording from `README.md` or the visible header copy in
   `frontend/src/components/dashboard/dashboard-header.tsx`, don't invent
   marketing copy), `<meta charset>`, a viewport tag, and `<html lang="...">`.

3. **Avoid layout shift (CLS)**:
   - Every loading `Skeleton` must reserve the same box size as the real
     content it stands in for. Don't eyeball this — read the actual
     Tailwind classes on both the skeleton and the real element, and check
     their computed sizes against `node_modules/tailwindcss/theme.css`
     (`--text-*` / `--text-*--line-height` for text, `--spacing` for `h-*`/
     `w-*` utilities: 1 unit = 0.25rem). A skeleton line at `h-3` (12px)
     standing in for `text-sm` copy (20px line-height) *will* shift the
     page by 8px when real content mounts.
   - Charts/media with an intrinsic size must reserve that exact size in
     both states (e.g. this project's chart skeletons already use
     `h-[280px]` matching the real `<ResponsiveContainer height={280}>` —
     confirm this kind of match still holds, don't just assume it from a
     past run).

4. **Fonts**: read `frontend/src/index.css` for `--font-sans`/`--font-*`
   declarations, then confirm the named font is actually loaded somewhere
   (a `<link>` to a font host in `frontend/index.html`, a self-hosted
   `@font-face`, or a bundler font plugin). A font named in CSS with no
   loading mechanism anywhere silently falls back to the rest of the stack
   forever — that's a real, grep-able bug, not a style preference. When
   adding a web-font `<link>`, always include `rel="preconnect"` to the font
   host(s) and `&display=swap` in the stylesheet URL, so text stays visible
   during the font swap instead of causing FOIT.

5. **Verify, don't just patch** — from `frontend/`:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
   Compare the `build` output's warnings against the pre-change baseline —
   "no new warnings" means the existing chunk-size warning (if present) is
   allowed to persist unchanged, but nothing new may appear.

## Findings from the 2026-09-07 run
- **`next/image`**: N/A — not a Next.js app, and no `<img>` tags exist in
  `frontend/src` today (confirmed by grep). Nothing to migrate.
- **Metadata**: `frontend/index.html` had no `<meta name="description">`.
  Added one grounded in `README.md`'s own description and
  `dashboard-header.tsx`'s visible subtitle copy.
- **Fonts**: `frontend/src/index.css:79` declares
  `--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;` but no
  `<link>`, `@font-face`, or font plugin loaded Inter anywhere — confirmed
  by grep across `index.html` and `src/index.css`. The app was silently
  rendering entirely in the fallback stack. Added a preconnect + Google
  Fonts stylesheet link with `display=swap` in `frontend/index.html`.
- **Layout shift**: chart skeleton/real-content heights already matched
  exactly (`h-[280px]` vs `height={280}`) — no fix needed there. KPI card
  and chart-header skeletons in
  `frontend/src/components/dashboard/kpi-card.tsx`,
  `income-outcome-chart.tsx`, and `profit-percent-chart.tsx` did **not**
  match: each skeleton line was 4-8px shorter than the real text's
  Tailwind line-height (verified against
  `node_modules/tailwindcss/theme.css`), which would visibly shift the
  layout when the loading state resolves. Resized every mismatched
  skeleton to the real element's line-height/box size.
- Build/lint/test after the change: all clean, and the build's one
  pre-existing warning (chunk size > 500kB — unrelated to this audit, see
  `vite.config.ts`'s single-entry bundling) is unchanged, no new warnings.
