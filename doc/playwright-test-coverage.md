# Playwright Test Suite — Purpose & Coverage

`src/test/playwright/` holds **three spec files, each wired to its own Playwright project** in `playwright.config.ts`. They serve **three different purposes** — none of them is meant to be a per-component exhaustive suite.

## 1. `screenshot.spec.ts` — desktop project `chromium`
**Purpose:** desktop visual-regression + targeted bug-regression guards.

Two kinds of test:
- **Visual baselines** (`toHaveScreenshot`): a `gallery` snapshot per component + `hover`/`focus`/`active` dynamic-state snapshots. Components: button, textbox, checkbox, combobox, listbox, grid, datebox, timebox, spinner, bandbox, selectbox, tabbox, tree, window, panel.
- **Computed-style regression guards** (assert exact CSS behaviour, each tied to a past bug):
  - button color-variant disabled alpha (c15–c28)
  - combobox comboitem icon↔label gap
  - tablet-isolation (tablet.css must be absent on desktop UA)
  - viewport-fill (`100vh` footgun; colorbox popup dismiss below content)
  - pv-cols-fill (state-matrix columns fill width)
  - container-header-height (window/panel/groupbox box-sizing)
  - errorbox position-invariance (beak/icon/close in all 4 directions)
  - notification (bare shell, opaque variant bg, single-line vertical centering)

## 2. `tablet.spec.ts` — mobile project `tablet` (iPad viewport + mobile UA)
**Purpose:** guard the **tablet/mobile bundle** (`zkmax/css/tablet.css`) — deliberately narrow, only components whose *tablet behaviour differs*.
- tablet stylesheet is actually enabled on a mobile UA
- MD3 touch target ≥ 44px (button, textbox, combobox, datebox)
- no horizontal overflow (combobox, datebox, timebox, spinner, textbox)
- state-matrix horizontal scroll + label readability on a phone
- mobile wheel pickers (datebox, timebox) open on-screen + readonly trigger interactive
- tablet visual baselines (button, combobox, listbox, checkbox)
- colorbox touch-dismiss

## 3. `render-smoke.spec.ts` — project `smoke`  *(added 2026-06-18; expanded 2026-06-22)*
**Purpose:** cheap compile/render smoke — each page must return **HTTP 200 + a composed `.z-p-8` body** (or `body` for `preview.zul`), catching ZK semantic errors (unsupported mold / attribute-without-setter) that `xmllint` cannot. **Covers all 103 standard preview pages + `preview.zul`** (104 total).

---

## Coverage assessment — do they cover all components?

**No.** Of **105** preview pages, only **30** are referenced by any spec; **75 have no automated test at all.**

| Spec | Project | Pages touched |
|------|---------|---------------|
| screenshot | chromium | 19 |
| tablet | tablet | 9 |
| render-smoke | smoke | **104** (all preview pages) |
| **union (distinct)** | — | **104 / 104** |

**render-smoke now covers all 104 preview pages** — every page must return HTTP 200 and compose a visible body. `preview.zul` (SPA listing, no `.z-p-8`) falls back to a `body` visible check.

### Interpretation
- `screenshot` (19 pages): deep visual-regression + computed-style bug guards for common and historically buggy components.
- `tablet` (9 pages): guards tablet-divergent behaviour only.
- `render-smoke` (104 pages): **site-wide compile guard** — catches HTTP 500 from unsupported molds and attributes-without-setters that xmllint cannot detect. Zero baselines to maintain.
