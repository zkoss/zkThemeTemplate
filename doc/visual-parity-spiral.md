# Visual Parity Spiral — UseCase2 vs Mira

## Context

This document is the **operational SOP for Phase 5** of [`doc/mira-alignment-plan-v2.md`](mira-alignment-plan-v2.md). The master plan owns the progress tracker and page order; this document owns the session procedure, stop conditions, and framework gap rules.

All UseCase2 pages exist and routing works. The visual gap between the ZK implementation and the Mira reference (`mira.bootlab.io`) is significant on many pages. This document defines the repeatable **implement → screenshot → audit → fix** loop that systematically closes this gap one page at a time.

---

## Stop Conditions

### Per-diff stop (single row in diff table)
- After **2 fix attempts** on one row without visible improvement → mark `🚫 BLOCKED` and move on.
- Do not spend a 3rd attempt on the same diff row in the same session.

### Per-page stop
- After **3 full FIX→VERIFY loops** on a page with open P1/P2 rows remaining → stop, document remaining rows as `WONTFIX` or `BLOCKED`, and move to the next page.
- A page with only P3 rows open is considered **Done Enough** — mark ✅ and move on.

### Framework limitation stop
- If a diff is caused by a **fundamental ZK vs MUI structural difference** (see section below), mark the row `⚠️ FRAMEWORK` immediately, document it in `doc/mira-reports/framework-gaps.md`, and do not attempt to fix it.
- **IMPORTANT: Apply the 3-layer triage before marking FRAMEWORK** (see section below).

---

## 3-Layer Gap Triage (run this BEFORE marking ⚠️ FRAMEWORK)

When Mira shows something that local doesn't, ask these questions in order:

### Layer 1: Is this a ZUL content gap?
> "Can I add this to the ZUL page by adding more ZK components or attributes?"

Examples:
- Mira shows 3 rows of the same component in different states → add more `<paging activePage="3"/>` etc.
- Mira shows a disabled row → add `disabled="true"` variant in ZUL
- Mira shows a section with more items → add more ZUL content

**Action: Fix it in ZUL. NOT a framework gap.**

### Layer 2: Is this a CSS variant gap?
> "Can I achieve this look by adding a CSS class variant (sclass + new CSS rule)?"

Examples:
- Mira shows outlined buttons → can add `.z-paging-outlined` variant with border CSS
- Mira shows smaller size → can add `.z-paging-sm` variant with reduced sizing
- Mira shows a rounded style → can add `.z-paging-rounded` variant

**Action: Create CSS variant class + add to ZUL with sclass. Mark as content/CSS work, NOT framework gap.**

> **Naming rule**:
> - Variant classes in **component CSS files** (`src/main/resources/`) → `z-` prefix (e.g., `z-paging-outlined`)
> - Variant classes in **page-level CSS** (`usecase2.css`) and ZUL `sclass` → `m-` prefix (e.g., `m-grid-numeric-cols`)
>
> One-off visual styles that only appear on a single demo page belong in `usecase2.css`, NOT in component CSS files. Only promote CSS to component files if it would be useful across real-world applications.

### Layer 3: Is this a true framework architectural gap?
> "Does this require ZK to fundamentally render different DOM, handle different events, or implement React/MUI-specific behavior?"

Examples:
- MUI ripple animation on click → ZK has no ripple system
- Ellipsis (`...`) in pagination → ZK os mold doesn't generate ellipsis nodes
- Floating label input → ZK textbox DOM structure is fundamentally different
- Portal-rendered dropdown → ZK uses its own popup mechanism

**Action: Mark ⚠️ FRAMEWORK immediately. Document in framework-gaps.md.**

### Decision tree summary

```
Diff found
  └─ Can I add ZUL content (more components/attributes)?
       YES → Fix in ZUL (ZUL content gap)
       NO  → Can I add a CSS variant class?
              YES → Create CSS variant (CSS gap)
              NO  → True architectural difference → ⚠️ FRAMEWORK
```

**Lesson**: "Mira shows 5 sections, local shows 3" is NOT automatically a framework gap.
It is a ZUL content gap unless proven otherwise.

---

## Framework Gaps — Known ZK vs MUI Differences

Some visual differences cannot be fully resolved because ZK and MUI (React) have different DOM structures, event models, and component lifecycles. These are **expected** and should be tracked, not chased.

See: `doc/mira-reports/framework-gaps.md`

### Known categories of unresolvable gaps

| Category | Description | Workaround |
|---|---|---|
| Component DOM wrapper | ZK wraps every component in extra `<span>` or `<div>` with `z-*` class — extra nesting can shift layout | Style the wrapper; accept minor spacing delta |
| Form input internals | ZK `<textbox>`, `<combobox>` render with inner `<input>` + outer `<span>` — hard to match MUI's single `<input>` with floating label | Best-effort styling; document gap |
| Button hover/ripple | MUI uses a Material ripple effect on buttons; ZK has no equivalent in pure CSS | CSS hover overlay is close enough; no ripple |
| SVG icons vs font icons | Mira uses Lucide SVG icons; ZK uses Font Awesome icon font — glyph shapes differ | Accept glyph difference; focus on size/color |
| Image components | ZK `<image>` renders `<span class="z-image"><img/></span>` — span wrapper can break edge-to-edge layouts | Use `<html>` CDATA for images needing edge-to-edge |
| Transition/animation | MUI has React-controlled mount/unmount transitions; ZK has limited CSS-only transitions | Static CSS transitions are acceptable |
| Data-driven content | Mira uses real API data + photos; ZK demo uses placeholder text/images | Placeholder content is acceptable |
| Autocomplete dropdown | MUI combobox uses a Portal-rendered dropdown; ZK uses ZK popup mechanism | Accept structural difference |

---

## The Spiral Loop (one session = one page)

### Layer order within each page (Macro → Micro)

| Layer | What to check |
|---|---|
| L1 Layout | Column count, widths, heights, overflow, flex/grid structure |
| L2 Surface | Background colors, card colors, border colors, shadows |
| L3 Typography | font-family, font-weight, font-size, line-height, color |
| L4 Spacing | padding, margin, gap — match px values to Mira |
| L5 Shape & detail | border-radius, icon (correct glyph + size), hover/focus state, **border visibility on state change** |

Always fix L1 before L5 — layout diffs mask spacing diffs.

**L5 state-change checklist** (mandatory for interactive components — accordion, tabs, dropdown, button, checkbox):
- Does the border appear/disappear correctly between collapsed and expanded?
- Does background/shadow change on hover vs default?
- Does focus ring appear correctly?
- Does the disabled state look visually distinct?
- Does the selected/active state differ from unselected in the RIGHT WAY (e.g. only indicator underline, NOT full background fill)?

**L5 popup/overlay checklist** (mandatory — these ZK component types ALWAYS have a popup, no exception: `combobox`, `datebox`, `timebox`, `bandbox`, `spinner`):
- Popup container: correct background color, **exact border-radius px value** (not just "rounded"), elevation shadow, border (or borderless)?
- Popup contents: typography, cell sizes, spacing, colors match reference?
- Popup trigger state: does the input border/style change correctly when popup is open?
- **Calendar today indicator**: ring outline (border) vs filled background — these are different patterns; do NOT assume "highlighted" means filled.
- **Calendar selected indicator**: filled background vs ring outline — verify which is which (today ≠ selected).
- For every popup property value: run `getComputedStyle` on the live Mira element **and** look up the MUI CSS class — do not rely on visual estimation of any value (see **Exact value measurement** below).
- See **Popup state capture** section below for how to screenshot these states.

### Screenshot procedure (CAPTURE and COMPARE steps)

#### Pre-capture: resize window to 1440×900

Before any screenshot, resize the browser window to a consistent tall size so more content is visible per capture:

```
# Via mcp__claude-in-chrome__resize_window:
width: 1440, height: 900
```

#### Full-page capture: html2canvas at scale 2

Use `scale: 2` (double pixel density). At scale 1 individual buttons render at ~30px — at scale 2 they are ~60px, making missing rows and wrong counts visible.

```js
// In Chrome browser tab (via javascript_tool):
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
document.head.appendChild(script);
script.onload = () => {
  html2canvas(document.body, { useCORS: true, scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = '<page>-local.png';   // or <page>-mira-target.png
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
};

// Then in terminal — move from Downloads to project:
// cp ~/Downloads/<page>-local.png doc/mira/screenshot/<page>-local.png
// cp ~/Downloads/<page>-mira-target.png doc/mira/screenshot/<page>-mira-target.png
```

**Note**: `mcp__claude-in-chrome__computer screenshot save_to_disk:true` returns an internal session ID, not a file path — do not use it to save screenshots to disk. The html2canvas method is the correct approach for archiving. Use the `computer screenshot` or `zoom` action for in-session visual comparison only.

#### Section-level zoom (required for component-demo pages)

For pages with multiple cards (buttons, forms, chips, etc.), after the full-page compare do a **per-section zoom** using `mcp__claude-in-chrome__computer` zoom action:

```
action: zoom
region: [x0, y0, x1, y1]   # bounding box of one card
```

Zoom local and Mira for the same card side by side. A single card at zoom resolution makes mismatched counts or wrong variants immediately obvious.

#### Popup state capture (required when page has popup components)

html2canvas captures the page at rest — popup overlays are invisible in a standard capture. For any page with datebox, combobox, bandbox, or timebox components:

1. **Identify popup components** during REPLICATE (see step 1 below).
2. **Force-open the popup via JS** before running html2canvas:

```js
// Example: open a datebox calendar popup
document.querySelector('.z-datebox-button').click();

// Example: open a combobox dropdown
document.querySelector('.z-combobox-button').click();

// Then wait for ZK's popup animation, then capture:
setTimeout(() => {
  html2canvas(document.body, { useCORS: true, scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = '<page>-popup-datebox-local.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}, 400);
```

3. Do the same on the Mira side to get `<page>-popup-datebox-mira-target.png`.
4. Compare popup screenshots separately — include popup diff rows in the diff table with element prefix `popup:` (e.g. `popup:.z-calendar`).

**Note**: If JS click doesn't open the popup (ZK event system may require a real DOM event), use `mcp__claude-in-chrome__find` + `mcp__claude-in-chrome__computer` click on the trigger button, then immediately take a `computer screenshot` zoom of the popup region for visual comparison. Use the zoom action rather than html2canvas for popup-only comparisons.

### Per-session steps

```
0. RESIZE   — Resize both tabs to 1440×900 via mcp__claude-in-chrome__resize_window

1. REPLICATE — Before any screenshot, read the Mira reference page at
               https://mira.bootlab.io/components/<page> (or /dashboard/<page> etc.)
               Inventory every section and state it shows:
                 → How many cards/sections?
                 → What variants are shown per section? (e.g. default/outlined/rounded)
                 → What states per variant? (e.g. page 1 / mid / last)
                 → Any disabled or special states?
               Then open src/test/resources/web/usecase2/<page>.zul and replicate that
               structure using ZK components:
                 → Add missing sections (cards) to the ZUL
                 → For each variant: add the right sclass + CSS if it doesn't exist
                 → For each state: add the component with the right attributes
               Apply 3-Layer Gap Triage immediately for anything that can't be replicated:
                 ZUL content gap? → fix in ZUL
                 CSS variant gap? → create CSS class + add to ZUL
                 True FRAMEWORK gap? → mark ⚠️ and document; skip in ZUL

               ┌─ MANDATORY POPUP GATE ──────────────────────────────────────────────┐
               │ Before proceeding to CAPTURE, answer ALL of the following:           │
               │                                                                      │
               │ RULE: These ZK components ALWAYS have a popup — no need to check:   │
               │   combobox (dropdown list)   datebox (calendar)                      │
               │   timebox (spinner)          bandbox (panel)    spinner (up/down)    │
               │                                                                      │
               │ Checklist:                                                           │
               │   [ ] Does the ZUL contain any of the above components?             │
               │       YES → list each one: _______________________________           │
               │       NO  → write "no popup components" and proceed                  │
               │   [ ] For each popup component listed above:                        │
               │       - Planned local popup capture: <page>-popup-<comp>-local.png  │
               │       - Planned Mira popup capture:  <page>-popup-<comp>-mira.png   │
               │                                                                      │
               │ STOP: Do NOT proceed to CAPTURE until this gate is filled out.      │
               └──────────────────────────────────────────────────────────────────────┘

               STOP: Do NOT proceed to CAPTURE until the ZUL has the correct section/variant
               structure AND the popup gate above is complete.

2. CAPTURE  — Navigate to http://localhost:8080/usecase2/index.zul#<page>
              Run html2canvas at scale:2 → downloads <page>-local.png
              cp ~/Downloads/<page>-local.png doc/mira/screenshot/<page>-local.png
              POPUP CAPTURE (if flagged in step 1):
                For each flagged popup component, follow the "Popup state capture" procedure
                above to produce <page>-popup-<component>-local.png

3. COMPARE  — Navigate to https://mira.bootlab.io/dashboard/<page> (or /components/<page> etc.)
              Run html2canvas at scale:2 → downloads <page>-mira-target.png
              cp ~/Downloads/<page>-mira-target.png doc/mira/screenshot/<page>-mira-target.png
              POPUP CAPTURE (if flagged in step 1):
                Click to open the same popup on the Mira side, then capture
                <page>-popup-<component>-mira-target.png

4. AUDIT    — Read both screenshots side by side, L1 → L5.
              Always include badge color and text color as explicit audit items (known systemic issue).
              Run $critique and $layout (impeccable analysis commands) on the local page.
              Merge into diff table at doc/mira-reports/<page>-diffs.md.
              Each row: Priority | Layer | Element/Selector | Local value | Target value
              For EVERY diff row: run the 3-Layer Gap Triage (ZUL content? → CSS variant? → FRAMEWORK?).
              Only mark ⚠️ FRAMEWORK after ruling out both ZUL content fix and CSS variant fix.
              "Mira shows N sections / N variants / N states" is a ZUL content gap until proven otherwise.

              EXACT VALUE MEASUREMENT (mandatory before writing any "Target" value in a diff row):
                Do NOT guess property values from screenshots alone. For every diff row, measure
                the target value using BOTH methods:

                Method A — getComputedStyle on the live Mira page:
                  Open the Mira tab, open the popup/component if needed, then in JS console:
                    getComputedStyle(document.querySelector('<mira-selector>')).borderRadius
                    getComputedStyle(document.querySelector('<mira-selector>')).padding
                    // etc. for whichever property is in question
                  This gives the exact runtime computed value (e.g. "4px", "12px 16px").

                Method B — MUI static CSS class lookup:
                  1. Check INDEX.md for the ZK component → MUI class mapping:
                       /Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/INDEX.md
                  2. grep the static CSS files for the relevant MuiXxx class:
                       grep -r "MuiPaper-root\|MuiPickersPopper" \
                         /Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/
                  3. Read the matching file for exact property values.

                Rule: if both methods agree → use that value. If they disagree → trust
                getComputedStyle (runtime value reflects theme overrides; static CSS may be base).
                Only write the "Target" column after confirming the value with at least Method A.

              ELEMENT COUNT CHECK (mandatory for component-demo pages):
                For each card/section, explicitly enumerate:
                  → Mira: N rows, each row has [label1, label2, ...] items
                  → Local: N rows, each row has [label1, label2, ...] items
                  → Record count difference as a diff row even if layout looks "close"
                Add a zoom screenshot of each card for side-by-side at readable resolution.

              For interactive components (accordion, tabs, dropdown, listbox):
                → Explicitly check L5 state-change checklist above
                → If needed, capture a SECOND screenshot with different state
                  (e.g. different panel expanded, all collapsed) to verify border/bg transitions

              For popup components (datebox, combobox, bandbox, timebox):
                → Compare popup screenshots using L5 popup/overlay checklist above
                → Add popup diff rows to the diff table with element prefix "popup:"
                  e.g. | P2 | L2 | popup:.z-calendar | border: 1px solid | border: none |
                → Popup diffs are often CSS-fixable (background, shadow, border-radius,
                  cell styling) — apply 3-Layer Triage before marking FRAMEWORK

              For table/grid pages — mandatory extra checks:
                → Cell padding: getComputedStyle(miraEl).padding on .MuiTableCell-root
                  vs getComputedStyle(localEl).padding on .z-row-inner/.z-listcell-cnt — do NOT skip this.
                → Grid/Listbox header background: MUI Table header is transparent (rgba(0,0,0,0))
                  by default. If local .z-grid-header/.z-column/.z-listbox-header/.z-listheader shows
                  a tinted background, that is a real P2 diff — fix it, don't accept as P3.
                → Listbox sort icon: ZK renders <i id="...-sort-icon"> inside .z-listheader-sorticon.
                  When sorted, the icon gets class z-icon-caret-up or z-icon-caret-down. Add CSS
                  using SVG mask-image for these classes. The sorticon div is FIRST in the DOM —
                  do NOT use order:2 (that moves it after the text). Use margin-right (not margin-left).
                → Listbox cell alignment via :not(:first-child): NEVER apply :not(:first-child)
                  to .z-listcell-cnt — it is always first-child of its TD, so it never matches.
                  Instead target the TD: .z-listcell:not(:first-child) .z-listcell-cnt.

5. FIX      — Before writing any CSS value, confirm it with both exact measurement methods
              from step 4 (getComputedStyle on Mira + MUI static CSS lookup).
              Do not derive values from screenshots or MD3 knowledge alone — measure first.
              Implement CSS/ZUL changes for all P1 diffs, then P2, then P3.
              Before writing CSS workarounds, check ZK built-in mechanisms first:
                → Alternating row colors: ZK Grid/Listbox auto-applies z-grid-odd / z-listbox-odd
                  to every other row via stripe(). Target these classes in CSS — never use
                  :nth-child to simulate what ZK already does natively.
                → Cell padding density: expose padding as a CSS variable on the root component
                  (--zk-listbox-cell-padding, --zk-grid-cell-padding) so a dense variant can
                  override it with a page-level class: .m-listbox-dense { --zk-listbox-cell-padding: 6px 16px; }
              Touch only files relevant to the current page's issues.
              Shared CSS fixes (sidebar, card, topbar) benefit all pages — do these first.
              STOP CONDITION: max 2 attempts per diff row; max 3 FIX→VERIFY loops per page

6. VERIFY   — Re-screenshot local page (html2canvas at scale:2)
              Explicitly check: badge background color, badge text color, chip/label text color
              ELEMENT COUNT RE-CHECK: zoom each changed section and count items vs Mira
              Update diff table (mark fixed rows ✅, blocked rows 🚫, framework rows ⚠️)
              If diffs remain AND loop count < 3: loop back to FIX
              If loop count = 3 OR only P3 rows remain: proceed to DONE

7. DONE     — Mark page ✅ in progress tracker
              Any 🚫 BLOCKED or ⚠️ FRAMEWORK rows → copy to framework-gaps.md
```

### Diff document format (`doc/mira-reports/<page>-diffs.md`)

```markdown
# <page> — Visual Diff Report

## Status: IN PROGRESS | DONE | DONE ENOUGH

| Priority | Layer | Element | Local | Target | Fixed |
|---|---|---|---|---|---|
| P1 | L1 | .m-card grid layout | 1 column | 3 columns | ✅ |
| P2 | L2 | .m-card background | #f5f5f5 | #fff | 🚫 BLOCKED |
| P3 | L5 | .z-icon-users size | 14px | 20px | ⚠️ FRAMEWORK |
```

For component-demo pages, add a **Count Inventory** section above the diff table:

```markdown
## Count Inventory (component-demo pages only)

| Section | Mira rows | Mira items per row | Local rows | Local items per row | Match |
|---|---|---|---|---|---|
| Outlined Buttons | 1 | Default/Primary/Secondary/Disabled/Link | 2 | 7+Disabled | ❌ |
| FAB | 1 | +/✏️/Extended/🗑️disabled | 2 | 4 circles+2 extended | ❌ |
```

This count inventory is filled at AUDIT and re-checked at VERIFY before marking the page ✅ Done.

Priority:
- **P1** = layout-breaking (wrong structure, missing element, overflow)
- **P2** = obviously wrong to a casual observer (wrong color, wrong font weight)
- **P3** = subtle (1–2px spacing, minor shade difference)

Status:
- ✅ Fixed
- 🚫 BLOCKED — tried 2× with no progress; move on
- ⚠️ FRAMEWORK — ZK vs MUI structural difference; document in framework-gaps.md

---

## Page Order

Fix shared infrastructure first, then pages by visual complexity / user-reported issues:

1. **Shared** — sidebar, topbar, `.m-card`, `.m-avatar`, `.m-badge` (fixes propagate everywhere)
2. `projects.zul` — ✅ DONE (trial run complete)
3. `default.zul` — highest visibility (dashboard landing page)
4. `analytics.zul`, `saas.zul`, `orders.zul`, `products.zul` — data-heavy pages
5. `invoice-list.zul`, `invoice-detail.zul`, `tasks.zul` — table-centric pages
6. Auth pages: `sign-in.zul`, `sign-up.zul`, `reset-password.zul`
7. Component demos: `buttons.zul`, `cards.zul`, `forms-*.zul`, `tables-*.zul`, etc.

---

## Impeccable Integration

The `impeccable` skill's **analysis commands** accelerate the AUDIT step. Only use these — not the design-generation commands, which would fight against matching Mira's exact style.

| Command | When to use |
|---|---|
| `$critique <page>` | Full heuristic review — UX issues, visual hierarchy, cognitive load |
| `$audit <page>` | Technical checks — accessibility, spacing consistency, responsive |
| `$layout <page>` | Focused spacing / rhythm / alignment issues (maps to L4) |

**Do not use**: `$craft`, `$shape`, `$colorize`, `$bolder`, `$typeset` — these impose impeccable's own design laws (OKLCH palette, typography preferences) which conflict with pixel-matching Mira's MUI-based design.

---

## Key Files to Edit (by fix type)

| Fix type | File |
|---|---|
| Sidebar layout / nav colors | component CSS + `usecase2.css` |
| Card / surface | `.m-card` in `usecase2.css` |
| Topbar | `src/test/resources/web/usecase2/usecase2.css` |
| Per-page layout | `src/test/resources/web/usecase2/<page>.zul` |
| ZK component (button, listbox, tabbox) | `src/main/resources/web/js/zul/*/css/*.css` |

**MUI CSS reference before editing any ZK component**: `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` — see `INDEX.md` for ZK→MUI file mapping.

---

## Verification Checkpoint (end of each session)

- [ ] `doc/mira-reports/<page>-diffs.md` exists with all rows marked ✅ / 🚫 / ⚠️
- [ ] No row has been attempted more than 2 times without resolution
- [ ] Framework gaps documented in `doc/mira-reports/framework-gaps.md`
- [ ] Local screenshot is visually close to target at 1440×900 (P1/P2 cleared)
- [ ] **Badge/chip background color** matches Mira (known systemic issue — always check explicitly)
- [ ] **Badge/chip text color** matches Mira (white-on-color vs color-on-light)
- [ ] **Label/body text color** matches Mira (e.g. `#49454f` for secondary text, not black)
- [ ] No regressions on previously completed pages (spot-check sidebar + one earlier page)
- [ ] Progress tracker row updated in `doc/mira-alignment-plan-v2.md`

---

## Page Progress Tracker

Legend: ✅ Done | 🔲 Pending | ⏭️ Skipped (infra/shell only)

### Infrastructure (shared across all pages)
| File | Description | Status | Date |
|---|---|---|---|
| `_sidebar.zul` | Sidebar nav shell (included by all pages) | 🔲 Pending | — |

### Dashboard / Analytics
| File | Mira Reference | Status | Date |
|---|---|---|---|
| `default.zul` | `/` (dashboard) | ✅ Done | 2026-05-04 |
| `analytics.zul` | `/analytics` | 🔲 Pending | — |
| `saas.zul` | `/saas` | 🔲 Pending | — |

### Data / Operations
| File | Mira Reference | Status | Date |
|---|---|---|---|
| `orders.zul` | `/orders` | 🔲 Pending | — |
| `products.zul` | `/products` | 🔲 Pending | — |
| `invoice-list.zul` | `/invoices` | 🔲 Pending | — |
| `invoice-detail.zul` | `/invoices/detail` | 🔲 Pending | — |
| `tasks.zul` | `/tasks` | 🔲 Pending | — |
| `projects.zul` | `/projects` | ✅ Done | 2026-05-04 |

### Pages / Auth
| File | Mira Reference | Status | Date |
|---|---|---|---|
| `pages.zul` | `/pages` | 🔲 Pending | — |
| `pages-profile.zul` | `/pages/profile` | 🔲 Pending | — |
| `pages-settings.zul` | `/pages/settings` | 🔲 Pending | — |
| `pages-pricing.zul` | `/pages/pricing` | 🔲 Pending | — |
| `pages-chat.zul` | `/pages/chat` | 🔲 Pending | — |
| `pages-blank.zul` | `/pages/blank` | 🔲 Pending | — |
| `sign-in.zul` | `/auth/sign-in` | 🔲 Pending | — |
| `sign-up.zul` | `/auth/sign-up` | 🔲 Pending | — |
| `reset-password.zul` | `/auth/reset-password` | 🔲 Pending | — |

### UI Component Demos
| File | Mira Reference | Status | Date |
|---|---|---|---|
| `accordion.zul` | `/components/accordion` | ✅ Done | 2026-05-05 |
| `alerts.zul` | `/components/alerts` | 🔲 Pending | — |
| `avatars.zul` | `/components/avatars` | 🔲 Pending | — |
| `badges.zul` | `/components/badges` | 🔲 Pending | — |
| `buttons.zul` | `/components/buttons` | ✅ Done | 2026-05-05 |
| `cards.zul` | `/components/cards` | 🔲 Pending | — |
| `chips.zul` | `/components/chips` | 🔲 Pending | — |
| `dialogs.zul` | `/components/dialogs` | ✅ Done | 2026-05-05 |
| `lists.zul` | `/components/lists` | 🔲 Pending | — |
| `menus.zul` | `/components/menus` | ✅ Done | 2026-05-05 |
| `pagination.zul` | `/components/pagination` | ✅ Done | 2026-05-06 |
| `progress.zul` | `/components/progress` | ✅ Done | 2026-05-06 |
| `tabs.zul` | `/components/tabs` | 🔲 Pending | — |
| `tooltips.zul` | `/components/tooltips` | 🔲 Pending | — |
| `icons-lucide.zul` | `/components/icons` | 🔲 Pending | — |

### Forms
| File | Mira Reference | Status | Date |
|---|---|---|---|
| `forms-editors.zul` | `/forms/editors` | ✅ Done | 2026-05-06 |
| `forms-pickers.zul` | `/forms/pickers` | ✅ Done | 2026-05-06 |
| `forms-selection-controls.zul` | `/forms/selection-controls` | ✅ Done | 2026-05-06 |
| `forms-selects.zul` | `/forms/selects` | ✅ Done | 2026-05-08 |
| `forms-text-fields.zul` | `/forms/text-fields` | ✅ Done | 2026-05-06 |

### Charts / Tables
| File | Mira Reference | Status | Date |
|---|---|---|---|
| `charts-apex.zul` | `/charts/apex` | 🔲 Pending | — |
| `charts-chartjs.zul` | `/charts/chartjs` | 🔲 Pending | — |
| `tables-simple.zul` | `/tables/simple` | ✅ Done | 2026-05-08 |
| `tables-advanced.zul` | `/tables/advanced` | ✅ Done | 2026-05-08 |
| `tables-datagrid.zul` | `/tables/datagrid` | 🔲 Pending | — |
