# GAP 5 tail coverage — Planner / Generator / Evaluator run

## Goal
Extend the central forced-colors guard (`src/main/resources/web/zul/css/tokens/_forced-colors.css`)
to cover **all** components flagged by `npm run check:forced-colors` (currently 27 uncovered),
so `npm run check:forced-colors -- --strict` exits 0 — with **correct** selectors and the
**right remedy per pattern**, not just audit-silencing.

## Roles & models
- **Planner** — main loop (Opus). Defines task + data bundle + success criteria; runs the loop; applies final doc updates.
- **Generator** — sub-agent on **Sonnet**. Implements; edits ONLY `_forced-colors.css`.
- **Evaluator** — sub-agent on **Opus**. Read-only checker; never edits CSS; reports PASS/FAIL + findings.

## Remedy taxonomy (pattern → fix → list in _forced-colors.css)
| Fragile pattern | Remedy | Target list |
|---|---|---|
| `box-shadow` elevation on a surface/popup | `border: 1px solid CanvasText` | (1a) border |
| `box-shadow` focus ring on an input/control | `outline: 2px solid Highlight; outline-offset:-1px` on `:focus-within`/`:focus` | (1b) outline |
| selected-row/item/day/tab tint | `background-color: Highlight; color: HighlightText` | (2a) selection |
| baked-color SVG check/glyph indicator | `forced-color-adjust: none` | (2b) glyph |

## Constraints
- System-color keywords only (Canvas/CanvasText/Highlight/HighlightText/ButtonText/GrayText).
- Block stays **unlayered** (wins over @layer zk-components without `!important`).
- Generator edits ONLY `_forced-colors.css`; must NOT weaken the audit or tests to pass.
- Selectors must match the REAL ZK DOM — cross-check against each component's own CSS file
  (`src/main/resources/web/js/**/css/*.css`) and, when unsure, the zk-component-rules skill.

## Success criteria (Evaluator gate)
1. `npm run build:css` clean.
2. `npm run check:forced-colors -- --strict` → exit 0.
3. `npm run test:forced-colors` → all pass.
4. Rules survive minify: `grep -c forced-color-adjust|Highlight|CanvasText` in
   `target/classes/web/marble/zul/css/norm.css.dsp` matches source intent.
5. Empirical: Playwright `forcedColors:'active'` probe on ≥5 newly-covered components
   (e.g. calendar selected day, tabbox selected tab, paging current, drawer/toast surface,
   slider/selectbox focus) shows the intended computed-style effect.
6. No incorrect selectors (audit "covered" via a class that isn't the one carrying the
   fragile pattern = false pass → FAIL).

## Loop
Planner → Generator (Sonnet) → Evaluator (Opus) → if FAIL, findings back to Generator → repeat.
Then Planner finalizes docs (drop "known remaining" caveat; note full coverage) + maybe add
regression cases.
