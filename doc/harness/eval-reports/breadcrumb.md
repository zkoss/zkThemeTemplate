# Eval Report: breadcrumb   status: GATE2_PENDING
iteration: 1
date: 2026-07-22T18:00:00-00:00
tier: T1
failing-set: []
newly-passing-since-last: []
row-coverage: 34/34

## Methodology note (read before the tables)

**Chrome MCP tools (`mcp__claude-in-chrome__*`) were not available in this environment.**
All measurement, hover/focus triggering, and screenshot capture below were performed with
a Playwright script driving the project's own `node_modules/playwright` (the same engine
the repo's `src/test/playwright/*.spec.ts` suites use), navigating to
`http://127.0.0.1:8080/breadcrumb.zul`. `page.hover()`/`.focus()` are genuine CDP-driven
interactions (real mouse move / native `.focus()`), not synthetic `dispatchEvent` shims, so
`:hover`/`:focus-visible` measurements are trustworthy. This substitution is noted per-role
below; no contract row was skipped because of it.

**ZK scrambles DOM ids — the ZUL's declared `id="pv-breadcrumb-*"` attributes do NOT survive
to the rendered DOM** (ZK's widget-uuid mechanism uses the ZUL `id` for server-side/Java
wiring, not as the literal browser `id`). Confirmed empirically: `document.getElementById
('pv-breadcrumb-default')` returns null on the live page; the four `.z-breadcrumb` roots
instead carry short opaque uuids (`qW6F9`, `qW6Fk`, …) that change per page load. This is
standard ZK behavior (consistent with `reference_pv_css_dissolved` — other preview pages in
this project already avoid relying on literal ids for the same reason), not a defect. The
four instances were classified positionally by content signature instead (item count /
presence of `.z-breadcrumbitem-disabled` / `.z-breadcrumb-separator > i` / `.z-breadcrumb-
ellipsis`) and tagged with a throw-away `data-eval-instance` attribute for stable querying
within the measurement session. **Recommendation (non-blocking):** either drop the
"stable ids" claim from future task framing for this component, or have the preview ZUL
wrap each instance in a container with an `id`/distinguishing class instead of putting the
id on the `<breadcrumb>` tag itself (a container id/class DOES survive since it's the ZUL
author's own `<div sclass=…>` wrapper being read via `z-mb-6` position, not the widget's
scrambled uuid) — not required for GATE2_PENDING, just a process note.

## Pre-flight gates
- `contract-approved: true` confirmed (doc/contracts/breadcrumb.md:6).
- `js-source-hash` drift check: recomputed `shasum -a 256` over the concatenation of
  `Breadcrumb.ts` + `Breadcrumbitem.ts` + `mold/breadcrumb.js` + `mold/breadcrumbitem.js`
  from `/Users/hawk/Documents/workspace/ZK10/zk/zul/...` → 
  `2a7e8560487b49f5e8d612acb24ddfada4d4489d2fd2399f79de1e9946e30f71`, exact match to the
  contract's declared hash. No drift — proceeded.
- Preview app reachable: `curl -sI http://127.0.0.1:8080/breadcrumb.zul` → `HTTP/1.1 200`.

## Icon-coverage pre-render check (§2.6)
- **Scope A (preview ZUL)**: `breadcrumb.zul` uses one icon literal, `z-icon-chevron-right`
  (the icon-separator demo). `node_modules/lucide-static/icons/chevron-right.svg` exists →
  PASS.
- **Scope B (ZK widget-emitted)**: grepped `Breadcrumb.ts`/`Breadcrumbitem.ts`/mold files for
  `z-icon-` literals — the widget itself emits none (the icon separator is entirely
  author-supplied via the `separator="icon:…"` attribute value, not hardcoded by the
  widget). The one hit inside `Breadcrumb.ts` is a JSDoc example string, already covered by
  Scope A's Lucide check. PASS, nothing for `scripts/build-css.js` `FA_TO_LUCIDE`.

## Visual artefacts
- page:      doc/screenshots/breadcrumb/page.png (full-page still, Branch B — no `.z-d-grid.z-grid-cols-auto` state-matrix block on this page, so a full-page capture stands in per §3a Branch B)
- collapsed: doc/screenshots/breadcrumb/collapsed.png (maxItems instance, pre-expand)
- expanded:  doc/screenshots/breadcrumb/expanded.png (same instance, post ellipsis-click)
- hover:     doc/screenshots/breadcrumb/hover.png (default instance, first link hovered)
- focus:     doc/screenshots/breadcrumb/focus.png (default instance, first link `:focus-visible`)
- forced-colors: doc/screenshots/breadcrumb-forced-colors.png (x-fc-capture, `forced-colors-gallery` project)

Capture method: Playwright `page.screenshot()` (PNG), noted as the documented fallback for
when `gif_creator`/Chrome MCP is unavailable — `capture: playwright-fallback`.

## AI visual findings

Reviewed all 6 images above (dual read: page.png shows all 4 static states; collapsed/
expanded/hover/focus show the dynamic states; forced-colors shows the WHCM pass). No ZKDoc
baseline exists for breadcrumb (`mockup-needed: Y`, confirmed in contract frontmatter — new
component, no `ZKCompRef_Breadcrumb*.png`), so this is single-image review against the
contract's Design Contract prose, per §3d single-image mode.

- Default trail: three muted-gray links ("Home / Products / Category") separated by "/",
  terminal "Current Item" in full-emphasis black, un-underlined at rest — matches prose.
- Disabled: "Archived" visibly dimmed relative to "Home", still positioned between its
  neighbors — matches prose.
- Icon separator: chevron-right glyphs render at the same visual weight/position as the
  text "/" they replace — matches prose, confirms M-icon-separator-visible geometry.
- Collapsed: "Home / … / Level 4 / Current Item" — matches the contract's keep-first-
  keep-last-(maxItems−1) invariant exactly (kept: Home + Level 4 + Current Item = 3 = maxItems).
- Expanded: all 6 crumbs visible in one row, ellipsis gone.
- Hover: "Home" gains an underline (matches c13); focus: "Home" gets a rounded, outward
  2px blue ring with visible offset (matches c9/c14/c19/c20 prose — "drawn outward…small
  border-radius…keeps corners soft").
- Forced-colors: links render in the UA's `LinkText` blue, terminal span stays
  `CanvasText`-black (still distinguishable — satisfies the C-tier link-vs-current
  distinction even under WHCM), disabled item stays visibly dimmed (opacity survives
  forced-colors as expected), chevron separators remain visible. No fc-risk violation
  observed for the one named risk (`mask-glyph`).

| # | location | violation | severity | suspected-row | screenshot |
|---|----------|-----------|----------|---------------|------------|
| — | — | none observed | — | — | — |

ai_findings_total=0, HIGH=0, MEDIUM=0, LOW=0.

## Macro assertions

| id | predicate | observed | result |
|----|-----------|----------|--------|
| M1 | max(vCenter)−min(vCenter) ≤ 4px per visible line | default=0px, disabled=0px, icon-separator=0px, collapsed(pre-expand)=0px, expanded(post-click)=0px | PASS |
| M2 | separator strictly between visible neighbors (±2px) | 0 violations across default/disabled/icon-separator/collapsed | PASS |
| M3 | no two visible text-bearing nodes overlap >1px | 0 violations across default/disabled/icon-separator/collapsed(pre)/expanded(post) | PASS |
| M4 | `[data-zk-bc-hidden="true"]` elements have zero bbox | all 6 hidden nodes (3 `.z-breadcrumbitem` + 3 `.z-breadcrumb-separator`) measured `{width:0, height:0}` | PASS |
| M-ellipsis-visible | ellipsis `> button` bbox ≥6×6 AND vCenter within M1 tolerance | button bbox 11.25×20px; vCenter within tolerance (verified `withinTolerance:true`) | PASS |
| M-icon-separator-visible | separator `> i` bbox ≥6×6 AND vCenter within M1 tolerance | icon bbox 13×20px; vCenter aligned (icon-separator group M1=0) | PASS |
| M-current-visible | terminal content non-zero bbox, within root bounds+2px | span bbox 76.9×20px; bottom/right both within root's bounds | PASS |
| M7 | `a` color ≠ terminal `span` color | a=`rgba(0,0,0,0.6)`, span=`rgba(0,0,0,0.87)` — differ | PASS |

## Cross-cutting checks (§3e)

Contract carries a `## Cross-cutting features` section — probes run per
`doc/spec/new-component-checklist.md`.

| id | observed | result |
|----|----------|--------|
| x-ctv-root | `--zk-breadcrumb-fg` set to `rgb(255,0,0)` at `:root` → default instance's root `color` becomes `rgb(255, 0, 0)`; `removeProperty` → restores to `rgba(0, 0, 0, 0.6)` (the pre-override value) | PASS |
| x-ctv-region | Same knob set inline on the default instance's flex wrapper only → default instance root color → `rgb(0, 255, 0)`; the disabled instance's separator color stayed `rgba(0, 0, 0, 0.6)` (untouched); removing the inline property restored the default instance | PASS |
| x-ctv-suite | `npx playwright test --config src/test/playwright/playwright.config.ts --project=component-theming -g "breadcrumb"` → 2 passed (`regional fg/current-fg override, sibling untouched`; `whole-app :root override wins`) | PASS |
| x-density | contract declares `density: N/A` (no intrinsic control height — inline text row) | SKIPPED (contract N/A) |
| x-fc-capture | `npx playwright test --config src/test/playwright/playwright.config.ts --project=forced-colors-gallery -g "breadcrumb"` → 1 passed; `doc/screenshots/breadcrumb-forced-colors.png` written, 45001 bytes | PASS |
| x-brand-decl | `grep -nE "#[0-9a-fA-F]{3,8}\|rgba?\(\|hsla?\(\|oklch\("` over `js/zul/wgt/css/breadcrumb.css` → 0 hits (every color declaration is `var(--zk-breadcrumb-*)`/`var(--zk-focus-ring)`/`var(--zk-state-disabled-opacity)`); every `token-rooted? yes` row (c2,c3,c4,c5,c7,c8,c9,c10,c12,c14,c15,c16,c18) independently confirmed to *cite* its token in the declaration (not just computed-value equality) — see source line refs below | PASS |

`x-brand-decl` token-citation spot-check (declaration lines in `src/main/resources/web/js/zul/wgt/css/breadcrumb.css`):
c2→27-28, c3→25/54, c4→55-56, c5→63-64, c7→74, c8→81, c9→120, c10→86, c12→93, c14→120, c15→102, c16→110, c18→76/88/103.

## Per-component results

### breadcrumb

| state | id | selector | property | expected | actual | result |
|-------|----|----------|----------|----------|--------|--------|
| default | c1 | `.z-breadcrumb` | display | `inline-block` | in-page (flex-item context, all 4 preview instances are flex children of `z-d-flex z-flex-col` wrappers): `block` (spec-correct **blockification** of an `inline-block` box that is also a flex item — outer display always blockifies to `block` for a flex/grid item or abspos box, per CSS Display L3). Isolated re-verification (freshly created `<nav class="z-breadcrumb">` appended directly to `<body>`, a non-flex, non-positioned parent): `inline-block`, matching the source declaration exactly (`breadcrumb.css:24`). No behavioral difference exists either way — flex items ignore their own outer display type for layout purposes. | **PASS*** (see note) |
| default | c2 | `.z-breadcrumb` | font-size / line-height | `13px` / `20px` (`--zk-typescale-body-medium-size` / `-line-height`) | `13px` / `20px` | PASS |
| default | c3 | `.z-breadcrumb`, `.z-breadcrumb-separator` | color | `rgba(0,0,0,0.6)` (`--zk-breadcrumb-fg` → on-surface-variant) | root: `rgba(0, 0, 0, 0.6)`; separator: `rgba(0, 0, 0, 0.6)` | PASS |
| default | c4 | `.z-breadcrumb-separator` | margin-left / margin-right | `8px` (`--zk-spacing-2`) | `8px` / `8px` | PASS |
| collapsed | c5 | `.z-breadcrumb-ellipsis` | margin-left / margin-right | `4px` (`--zk-spacing-1`) | `4px` / `4px` | PASS |
| collapsed | c6 | `.z-breadcrumb-ellipsis > button` | background, border, padding | `none`, `0`, `0` | `rgba(0,0,0,0) / none`, `0px none`, `0px` | PASS |
| collapsed | c7 | `.z-breadcrumb-ellipsis > button` | color (resting) | `rgba(0,0,0,0.6)` (`--zk-breadcrumb-fg`) | `rgba(0, 0, 0, 0.6)` | PASS |
| ellipsis-hover/focus | c8 | `.z-breadcrumb-ellipsis > button:hover`, `:focus-visible` | color | `rgba(0,0,0,0.87)` (`--zk-breadcrumb-fg-hover`) | hover: `rgba(0, 0, 0, 0.87)`; focus-visible: `rgba(0, 0, 0, 0.87)` | PASS |
| ellipsis-focus | c9 | `.z-breadcrumb-ellipsis > button:focus-visible` | outline | `2px solid #376fd0` (`--zk-focus-ring`) | `rgb(55, 111, 208) solid 2px` | PASS |
| default | c10 | `.z-breadcrumbitem > a` | color (resting) | `rgba(0,0,0,0.6)` (`--zk-breadcrumb-fg`) | `rgba(0, 0, 0, 0.6)` | PASS |
| default | c11 | `.z-breadcrumbitem > a` | text-decoration (resting) | `none` | `none` | PASS |
| link-hover/focus | c12 | `.z-breadcrumbitem > a:hover`, `:focus-visible` | color | `rgba(0,0,0,0.87)` (`--zk-breadcrumb-fg-hover`) | hover: `rgba(0, 0, 0, 0.87)`; focus-visible: `rgba(0, 0, 0, 0.87)` | PASS |
| link-hover | c13 | `.z-breadcrumbitem > a:hover` | text-decoration | `underline` | `underline` | PASS |
| link-focus / current-focus | c14 | `a:focus-visible`, `span[tabindex]:focus-visible` | outline | `2px solid #376fd0` | link: `rgb(55, 111, 208) solid 2px`; span: `rgb(55, 111, 208) solid 2px` | PASS |
| current-item | c15 | `.z-breadcrumbitem > span` | color | `rgba(0,0,0,0.87)` (`--zk-breadcrumb-current-fg`) | `rgba(0, 0, 0, 0.87)` | PASS |
| disabled-item | c16 | `.z-breadcrumbitem-disabled` | opacity | `0.38` | `0.38` | PASS |
| disabled-item | c17 | `.z-breadcrumbitem-disabled` | pointer-events | `none` | `none` | PASS |
| default/collapsed | c18 | `a`, `span`, `.z-breadcrumb-ellipsis > button` | transition | `color 250ms cubic-bezier(0.4,0,0.2,1)` | a: `color 0.25s cubic-bezier(0.4, 0, 0.2, 1)`; span: same; button: same | PASS |
| link-focus/current-focus/ellipsis-focus | c19 | same selectors as c14 + ellipsis | outline-offset | `2px` | link `2px`; span `2px`; ellipsis-button `2px` | PASS |
| link-focus/current-focus/ellipsis-focus | c20 | same selectors as c19 | border-radius | `2px` | link `2px`; span `2px`; ellipsis-button `2px` | PASS |
| disabled-item | (structural, A-tier, via skill) | `.z-breadcrumbitem-disabled` content element | tag | `<span>` (never `<a>`, even with `href` set) | `span` confirmed (the "Archived" disabled item has `href="#"` in the ZUL yet rendered as `<span>`) | PASS |

\* c1: measured **PASS** based on the isolated (non-blockified) re-verification described in
the cell above; the in-context "block" reading is a correct browser computation for an
`inline-block` element used as a flex item, not a CSS authoring defect. No Generator action
needed. Flagged so this isn't silently miscounted as a regression on a future re-eval that
only reads in-context values.

## Layout-regression sweep (§3c)

Ran the 10-point sweep; only checks 1 (children-fit) and 4 (hidden-but-occupying) apply
(breadcrumb has no scroll buttons, toolbar-in-container, accordion cave, or radius-without-
clip container — checks 3/5/6/7/8/9/10 are N/A by construction).

- **Children-fit**: an initial pass using `child.offsetTop + child.offsetHeight ≤
  root.offsetHeight` produced 4 false-positive "overflow" hits — root cause: `.z-breadcrumb`
  (nav) is `position: static` and establishes no offsetParent context, so `offsetTop` on its
  child `<ol>` was measured relative to a distant ancestor (not `root`), not to `root`
  itself; the two `offsetTop` values were simply not comparable. Re-measured with
  `getBoundingClientRect()` (viewport-relative, therefore always comparable regardless of
  offsetParent): child top/bottom == root top/bottom exactly, for all 4 instances. **No
  actual overflow — corrected result: 0 violations.**
- **Hidden-but-occupying**: all 6 `[data-zk-bc-hidden="true"]` nodes report
  `offsetWidth === 0 && offsetHeight === 0`. 0 violations.
- **No-content-overflow**: `.z-breadcrumb-list` `scrollHeight === offsetHeight` and
  `scrollWidth === offsetWidth` on all 4 instances (no forced overflow). 0 violations.

No `lr-*` rows added to failing-set.

## State-coverage cross-check against contract's "States to evaluate"

| checklist entry | covered by |
|---|---|
| default (link items + plain-text separator) | c1–c4, c10, c11, M1–M3 |
| link-hover | c12, c13, M7 |
| link-focus-visible | c14, c19, c20 |
| current-item (terminal) | c15, M-current-visible, M7 |
| current-focus-visible | c14, c19, c20 (span) |
| disabled-item | c16, c17, + structural span-not-a check |
| icon-separator variant | c3 (inherited), M2, M-icon-separator-visible |
| collapsed (maxItems exceeded) | c5, c6, c7, M4, M-ellipsis-visible |
| ellipsis-hover / focus-visible | c8, c9, c19, c20 |
| expanded (post ellipsis-click) | M1 (=0px), M3 (0 violations) re-measured after a real `.click()` on the ellipsis button — ellipsis removed, 0 hidden nodes remain |

No NO-ASSERTION gaps found — every checklist entry has ≥1 measured row.

## Action required

None — all measured rows PASS, all macro assertions PASS, all cross-cutting checks PASS/
SKIPPED-by-contract-decision, 0 AI visual findings, 0 layout regressions (after correcting
the offsetTop false-positive described above). Status is `GATE2_PENDING`: awaiting Gate 2
(`md3-design-verifier`) design-quality review before the orchestrator can flip `VERIFIED`.
