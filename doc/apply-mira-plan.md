# Plan — Extending Mira's Design Language to Uncovered ZK Component States

## Current Status (2026-05-10)

| Step | Status | Notes |
|------|--------|-------|
| Step 1 — Author `DESIGN.md` | ✅ Done | `doc/DESIGN.md` exists; 12 sections |
| CSS coverage audit | ✅ Done | ~40+ state gaps filled (readonly/invalid/open across all form inputs; panel/window/groupbox/toolbar/menu/grid/listbox/tree/calendar; toast/notification/scrollbar/loadingbar/errorbox new files) |
| Step 2 — Style by analogy + verify | 🔄 Active | Verify each component preview page at `usecase/index.zul#<component>` |
| Step 3 — Feed back into spec | 🔄 Ongoing | Add decisions to `doc/DESIGN.md` when a new analog is resolved |

**Scope**: Component preview pages (`src/test/resources/web/*.zul`) accessed via `usecase/index.zul`, plus 8 scenario pages (`usecase/`). **Not** usecase2 — that SPA is covered separately by `doc/usecase-driven-iteration.md`.

---

## Per-Session Execution Workflow

### Session start
```bash
withjdk.sh 17 mvn test exec:java@preview-app   # starts preview on :8080 + CSS watch
```

### Component preview page loop (max 3 fix iterations per page)

```
OBSERVE → AUDIT → FIX → REBUILD → VERIFY
```

**OBSERVE**
1. Navigate to `http://localhost:8080/usecase/index.zul#<component>`
2. Take full-page screenshot → save `doc/screenshots/<component>-before.png`
3. Check browser console for red errors
4. For components that have a matching Mira HTML reference (see table below), also read `doc/mira/<reference>.html`

**AUDIT**
For each state column visible on the preview page, check:
- Default: correct color, size, spacing per `doc/DESIGN.md`
- Hover: state-layer overlay visible
- Focus-visible: `2px solid primary` ring visible
- Disabled: `opacity: 0.38`, `pointer-events: none`
- Readonly: `surface-container-low` bg + `outline-variant` border
- Invalid: `error` border, 2px on focus
- Any component-specific states (open/selected/checked/indeterminate)

All colors must use `--zk-*` tokens (no hardcoded hex). Use `doc/DESIGN.md` as the spec.

**FIX** (via `zk-theme-creator` subagent)
- Theme fix → `src/main/resources/web/js/zul/*/css/*.css`
- Preview page fix (missing state column in ZUL) → `src/test/resources/web/<component>.zul`
- Before writing CSS: check `doc/component-dom-structures.md` (see Known ZK DOM Quirks below)

**REBUILD**
```bash
npm run build:css
```

**VERIFY**
1. Hard-refresh page, take after screenshot → `doc/screenshots/<component>-after.png`
2. Smoke-test: open `http://localhost:8080/usecase/index.zul#button` (baseline)
3. If 3 iterations done and Critical still open → mark `⚠️ ZK Constraint` and move on

### Session batch sizing
- **3–4 components per session** (components that share a CSS file can be batched together)
- After each component: `ls -lh doc/screenshots/<component>*.png` to confirm screenshots saved

### Prioritisation rule
Work Group A (Form Inputs) and Group E (Buttons) first — most frequently used, most visible on scenario pages. Then Group C (Data Display), then Group D (Navigation), then remaining groups.

---

## Progress Tracking — Component Preview Pages

Status: `⬜ Not Started` | `🔄 In Progress` | `✅ Verified` | `⚠️ ZK Constraint` | `⏭ ZKEX Skip`

### Group A — Form Inputs

| Component | Preview ZUL | usecase URL | CSS File | States to verify | Status |
|-----------|------------|-------------|----------|-----------------|--------|
| textbox / textarea | `textbox.zul` | `#textbox` | `inp/css/input.css` | default, hover, focus, disabled, readonly, invalid | ⬜ |
| intbox / decimalbox / doublebox / longbox | `intbox.zul` etc. | `#intbox` / `#decimalbox` / `#doublebox` / `#longbox` | `inp/css/input.css` | default, hover, focus, disabled, readonly, invalid | ⬜ |
| combobox | `combobox.zul` | `#combobox` | `inp/css/combobox.css` | default, open, disabled, readonly, invalid | ⬜ |
| datebox | `datebox.zul` | `#datebox` | `inp/css/datebox.css` | default, open, disabled, readonly, invalid | ⬜ |
| timebox | `timebox.zul` | `#timebox` | `inp/css/timebox.css` | default, focus, disabled, readonly, invalid | ⬜ |
| spinner / doublespinner | `spinner.zul` | `#spinner` | `inp/css/spinner.css` | default, focus, disabled, readonly, invalid | ⬜ |
| bandbox | `bandbox.zul` | `#bandbox` | `inp/css/bandbox.css` | default, open, disabled, readonly, invalid | ⬜ |
| selectbox | `selectbox.zul` | `#selectbox` | `sel/css/selectbox.css` | default, open, disabled | ⬜ |
| slider | `slider.zul` | `#slider` | `inp/css/slider.css` | default, hover, focus, disabled | ⬜ |
| rating | `rating.zul` | `#rating` | `wgt/css/rating.css` | default, hover, disabled, readonly, vertical | ⬜ |
| inputgroup | `inputgroup.zul` | `#inputgroup` | `wgt/css/inputgroup.css` | all addon variants | ⬜ |

### Group B — Selection Controls

| Component | Preview ZUL | usecase URL | CSS File | States to verify | Status |
|-----------|------------|-------------|----------|-----------------|--------|
| checkbox | `checkbox.zul` | `#checkbox` | `wgt/css/checkbox.css` | default, checked, indeterminate, disabled, hover, focus | ⬜ |
| radiogroup | `radiogroup.zul` | `#radiogroup` | `wgt/css/radiogroup.css` | default, selected, disabled, vertical layout | ⬜ |

### Group C — Data Display

| Component | Preview ZUL | usecase URL | CSS File | States to verify | Status |
|-----------|------------|-------------|----------|-----------------|--------|
| grid | `grid.zul`, `grid-header.zul`, `grid-grouping.zul`, `grid-detail.zul` | `#grid` | `grid/css/grid.css` | row hover, selected, disabled, grouping, odd-even, frozen, empty | ⬜ |
| listbox | `listbox.zul`, `listbox-header.zul`, `listbox-grouping.zul` | `#listbox` | `sel/css/listbox.css` | row hover, selected, disabled, grouping | ⬜ |
| tree | `tree.zul`, `tree-header.zul` | `#tree` | `sel/css/tree.css` | row hover, selected, open/closed, disabled | ⬜ |
| paging | `paging.zul` | `#paging` | `mesh/css/paging.css` | default, current page, disabled pages | ⬜ |
| calendar | `calendar.zul` | `#calendar` | `db/css/calendar.css` | default, today, selected, out-range, disabled | ⬜ |

### Group D — Navigation

| Component | Preview ZUL | usecase URL | CSS File | States to verify | Status |
|-----------|------------|-------------|----------|-----------------|--------|
| menubar | `menubar.zul` | `#menubar` | `menu/css/menu.css` | default, hover, open, submenu, disabled item, separator | ⬜ |
| toolbar | `toolbar.zul`, `toolbar-vertical.zul` | `#toolbar` | `wgt/css/toolbar.css` | default, app-bar variant, vertical, overflow | ⬜ |
| tabbox | `tabbox.zul`, `tabbox-accordion.zul` | `#tabbox` | `tab/css/tabbox.css` | default, selected, disabled tab, accordion mold, card mold | ⬜ |

### Group E — Buttons

| Component | Preview ZUL | usecase URL | CSS File | States to verify | Mira ref | Status |
|-----------|------------|-------------|----------|-----------------|----------|--------|
| button | `button.zul` | `#button` | `wgt/css/button.css` | contained/outlined/text, hover, focus, disabled | `components-buttons.html` | ⬜ |
| combobutton | `combobutton.zul` | `#combobutton` | `wgt/css/combobutton.css` | default, open, disabled | — | ⬜ |
| toolbarbutton | (in `toolbar.zul`) | `#toolbar` | `wgt/css/toolbarbutton.css` | default, hover, checked, disabled | — | ⬜ |

### Group F — Containers / Windows

| Component | Preview ZUL | usecase URL | CSS File | States to verify | Status |
|-----------|------------|-------------|----------|-----------------|--------|
| window | `window.zul`, `window-noborder.zul` | `#window` | `wnd/window.css` | default, modal, maximized, minimized, noborder, noheader | ⬜ |
| panel | `panel.zul`, `panel-noborder.zul`, `panel-misc.zul` | `#panel` | `wnd/panel.css` | default, collapsed, noborder, shadow | ⬜ |
| groupbox | `groupbox.zul`, `groupbox-3d.zul` | `#groupbox` | `wgt/css/groupbox.css` | default, open, closed, noborder | ⬜ |
| popup | `popup.zul` | `#popup` | `wnd/popup.css` | default visible | ⬜ |
| borderlayout | `borderlayout.zul` | `#borderlayout` | `layout/css/borderlayout.css` | all 5 regions visible | ⬜ |
| splitter | `splitter.zul` | `#splitter` | `layout/css/splitter.css` | horizontal, vertical, open/closed | ⬜ |
| caption | `caption.zul` | `#caption` | `wgt/css/caption.css` | default, with icon | ⬜ |

### Group G — Feedback / Overlay

| Component | Preview ZUL | usecase URL | CSS File | States to verify | Status |
|-----------|------------|-------------|----------|-----------------|--------|
| notification | `notification.zul` | `#notification` | `wgt/css/notification.css` | info/success/warning/error variants | ⬜ |
| toast | `toast.zul` | `#toast` | `wgt/css/toast.css` | all variants | ⬜ |
| progressmeter | `progressmeter.zul` | `#progressmeter` | `wgt/css/progressmeter.css` | default, complete, indeterminate | ⬜ |
| errorbox | `errorbox.zul` | `#errorbox` | `wgt/css/errorbox.css` | default | ⬜ |
| loadingbar | `loadingbar.zul` | `#loadingbar` | `wgt/css/loadingbar.css` | default | ⬜ |
| messagebox | `messagebox.zul` | `#messagebox` | `wnd/messagebox.css` | info/question/warning/error | ⬜ |

### Group H — 8 Use-Case Scenario Pages

These pages test components in real business context. Workflow: `doc/usecase-driven-iteration.md`.

| Page | URL | Mira Reference | Status |
|------|-----|---------------|--------|
| dashboard.zul | `#usecase/dashboard` | `dashboard-default.html` | ⬜ |
| app-shell.zul | `#usecase/app-shell` | `dashboard-default.html` (sidebar) | ⬜ |
| order-entry.zul | `#usecase/order-entry` | `forms-text-fields.html` | ⬜ |
| employee-grid.zul | `#usecase/employee-grid` | `tables-advanced-table.html` | ⬜ |
| user-profile.zul | `#usecase/user-profile` | `pages-profile.html` | ⬜ |
| product-browser.zul | `#usecase/product-browser` | `products.html` | ⬜ |
| report-viewer.zul | `#usecase/report-viewer` | `dashboard-analytics.html` | ⬜ |
| media-manager.zul | `#usecase/media-manager` | `pages-blank.html` | ⬜ |

### ZKEX — Skip (enterprise-tier, out of current scope)
`biglistbox`, `cascader`, `chosenbox`, `stepbar`, `organigram`, `pdfviewer`, `searchbox`, `scrollview`, `signature`, `timepicker`, `multislider`, `rangeslider`, `portallayout`, `goldenlayout`, `splitlayout`, `cardlayout`, `drawer`, `coachmark`, `tbeditor`, `colorbox`, `cropper`, `video`, `barcodescanner`, `camera`, `fisheyebar`

---

## Step 2 — Style by Analogy Checklist (per newly discovered gap)

1. **Pick the analog** from `doc/DESIGN.md`
2. **Measure exact values** before writing CSS:
   - `getComputedStyle(el).<prop>` on the analog at the running preview app, or
   - grep MUI static CSS at `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/`
   - Disagreement → trust runtime (Method A)
3. **Apply tokens only** — no hardcoded hex or px
4. **State coverage** for each component:
   - Hover: state-layer `rgba(currentColor, 0.08)` or surface tint `#f5f5f5`
   - Focus-visible: `2px solid var(--zk-color-primary)`, `outline-offset: 2px`
   - Disabled: content `opacity: 0.38`, container `opacity: 0.12`, `pointer-events: none`
   - Readonly: `background: surface-container-low` + `border: outline-variant` + button `pointer-events: none`
   - Invalid: `border-color: error` (1px default, 2px on focus)
5. **Verify**: `$polish <file>.css`, `$audit <url>`
6. **No generative commands**: skip `$craft`, `$shape`, `$colorize`
7. **Smoke-test**: open `#button` or `#menubar` to confirm no visual clash
8. **Stop at 2 failures**: update analog note in `doc/DESIGN.md`, mark `WONTFIX`

---

## Step 3 — Feed Back into the Spec

When a real ambiguity surfaces, write the decision once into `doc/DESIGN.md` under the relevant section. Do not leave it in a comment — only `DESIGN.md` persists.

---

## Known ZK DOM Quirks (check before writing CSS)

| Component | Wrong guess | Correct ZK class |
|-----------|-------------|-----------------|
| Panel content area | `.z-panel-content` | `.z-panelchildren` |
| Rating star | `.z-rating-star` | `.z-rating-icon` |
| Progressmeter fill | `.z-progressmeter-bar` | `.z-progressmeter-image` |
| Paging prev | `.z-paging-prev` | `.z-paging-previous` |
| Listcell content | `.z-listcell-cnt` | `.z-listcell-content` |
| Treecell content | `.z-treecell-cnt` | `.z-treecell-content` |
| Grid cell content | `.z-cell-content` | `.z-row-content` |
| Groupbox content | `.z-groupbox-body` | `.z-groupbox-content` |
| Caption text | `.z-caption-text` | `.z-caption-content` (text node) |
| Menubar submenu | `.z-menubar > .z-menu` | `.z-menubar > ul > li > .z-menu` |
| BorderLayout | `display: flex` | each region is `position: absolute` |

Full DOM reference: `doc/component-dom-structures.md`

---

## Known Remaining CSS Gaps

### Minor structural sub-elements (low priority)
`z-combobutton-button/content/icon`, `z-menu-clickable`, `z-sticky-header`, `z-treerow-radio`, `z-listbox-paging-top`, `z-tree-paging-bottom/top`, `z-splitter-button`, `z-splitter-button-disabled`

---

## Critical Files

| File | Status | Role |
|------|--------|------|
| `doc/DESIGN.md` | ✅ exists | Rulebook — 12-section Mira design spec |
| `doc/usecase-driven-iteration.md` | ✅ exists | Detailed per-iteration loop for the 8 scenario pages |
| `src/test/resources/web/*.zul` | ✅ ~100 files | Component preview pages |
| `src/test/resources/web/usecase/` | ✅ 8 pages | Business scenario pages |
| `src/main/resources/web/js/zul/*/css/*.css` | ✅ ~66 files | Component CSS |
| `doc/mira/*.html` | ✅ 49 files | Mira HTML reference (used for Group E + Group H) |
| `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` | ✅ external | MUI 9.0.0 static CSS |
| `doc/screenshots/` | ⬜ empty | Before/after screenshots (to be generated) |

---

## End-to-End Done Criteria

- [ ] All Group A–G component preview pages: screenshot taken, all states visually correct
- [ ] All 8 Group H scenario pages: OBSERVE→VERIFY loop completed per `usecase-driven-iteration.md`
- [ ] `doc/DESIGN.md` — all analog decisions written back in
- [ ] No regression after fixes (smoke-test `#button` and `#grid`)
- [ ] `withjdk.sh 17 mvn clean package` succeeds

---

## Out of Scope

- New tokens or palettes — use what `_colors.css` defines
- Dark theme — per CLAUDE.md
- ZKEX enterprise components — listed above, defer until PE/EE tier
- usecase2 SPA — separate workflow in `doc/usecase-driven-iteration.md`
