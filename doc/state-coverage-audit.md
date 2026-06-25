# Preview State-Coverage Audit

**Date:** 2026-06-18
**Question:** Do the preview "State Gallery" pages (`src/test/resources/web/*.zul`) demonstrate every *known state* each component's contract defines?
**Ground truth:** `doc/contracts/<comp>.md` (primary); `.claude/skills/zk-component-rules/components/<comp>.md` (fallback for pages with no contract).
**Scope:** 105 preview pages — 71 contract-backed, 9 sub-component contracts checked inside their parent page, 25 no-contract feature/aggregate pages.

## Method & Rule
A contract state counts as **covered** if any widget on the page (or a sibling page, e.g. `grid-grouping.zul`) exercises it.
**Pure pointer-interaction pseudo-states are out of scope** — `:hover`, `:focus`, `:active`, dropdown/popup-open, keyboard-active-row — these require live interaction and are not expected in a static gallery (e.g. `button.zul` legitimately shows only Default + Disabled). They are recorded below as *"interaction-only (by design)"* and are **not** counted as gaps.

---

## A. Actionable gaps — static, contract-required states currently missing

These are states the contract enumerates that *can* be shown statically but are absent from the gallery.

| # | Component | Missing static state(s) | Severity | Fix |
|---|-----------|-------------------------|----------|-----|
| 1 | notification | ~~success variant~~ — **NOT a real gap.** ZK `Clients`/`Notification` only support `info`/`warning`/`error` (no SUCCESS constant; runtime `"success"` renders icon-less). Resolved by **removing** the non-standard success cases (static col + runtime button). Contract should be corrected to drop `success`. | — | Done (removed) |
| 2 | stepbar | **error** step, **vertical** orient, **non-linear/clickable**, **wrapped-label**, single-child generation | High | Add rows/sections for each |
| 3 | organigram | **selected**, **disabled**, **non-selectable**, **closed/collapsed branch** nodes | High | Add a node-state gallery section |
| 4 | caption | **label-only**, **image-only** variants (only label+image shown) | High | Add two caption variants |
| 5 | panel | **collapsed** state (done). ~~3d mold~~ — **NOT achievable**: ZK `Panel` has no `3d` mold (only `default` registered in `lang.xml`; 3d belongs to Groupbox). Caused HTTP 500; removed. | High | collapsed added; 3d dropped |
| 6 | portallayout | **framed column** variant, panel **counter** badge | High | Add a framed/titled column with counter |
| 7 | goldenlayout | **closable tabs**, accordion-style headers | High | Add closable tab + accordion sample |
| 8 | checkbox | **indeterminate** state; switch/toggle molds shown but no indeterminate | Med | Add indeterminate checkbox (via sclass/JS) |
| 9 | paging | **input mold** (jump-to-page field) | Med | Add `mold="..."`/input-page paging sample |
| 10 | tree | explicit **disabled** node/tree; frozen-column visual unclear | Med | Add disabled-tree row |
| 11 | signature | **toolbar-hide** (done via `toolbarVisible="false"`). ~~disabled~~ — **NOT achievable**: `Signature` (zkmax) has no `setDisabled`. Caused HTTP 500; removed. | Med | toolbar-hide added; disabled dropped |
| 12 | tbeditor | ~~disabled~~ — **NOT achievable**: `Tbeditor` (zkmax) only has `setValue`/`setConfig`, no `setDisabled`. Caused HTTP 500; removed. | Med | dropped (not achievable) |
| 13 | inputgroup | **disabled**, **vertical-border** (orient=vertical) | Med | Add disabled + vertical-orient rows |
| 14 | hlayout / vlayout | **valign=middle / bottom**, `spacing="auto"` | Med | Add alignment + auto-spacing samples |
| 15 | groupbox | **readonly** state (open/closed already shown) | Low | Add readonly groupbox |
| 16 | slider | explicit **disabled** in `slider.zul` (currently only in multislider.zul) | Low | Add disabled slider |
| 17 | columnlayout | `hflex` proportion demo | Low | Add hflex sample |
| 18 | barcode | orientation variants / display-value label | Low | Add variant |
| 19 | colorbox | readonly, inplace (not core to color picking) | Low | Optional |
| 20 | calendar | whole-component disabled | Low | Optional |
| 21 | separator | `spacing="auto"` mode | Low | Optional |
| 22 | navbar | selected/active item (forceable via sclass) | Low | Optional |

## B. Interaction-only states — out of scope (by design, NOT gaps)

Recorded for completeness; a static gallery cannot show these and the convention does not require it.

| Component | Interaction-only states (not flagged) |
|-----------|----------------------------------------|
| combobutton | open dropdown, hover, focus |
| cascader | open popup, item-active (kbd), item-hover |
| chosenbox | popup-open, focus-visible, item-focus (kbd) |
| searchbox | open popup, label/placeholder visibility toggling per selection |
| menubar / menuitem / menupopup | hover, open, selected (runtime) |
| splitter / borderlayout / splitlayout | `:active` drag, splitter-bar hover, drag ghost |
| pdfviewer | toolbar opacity transitions, fullscreen |
| cropper | active selection, handle resize, toolbar hover/pressed |
| dropupload | none — no themed interaction state; drag feedback is the native browser cursor (`dropEffect='copy'`), and ZK emits no `-active`/`-disabled` class |
| fisheyebar | hover magnification |
| a | `:visited` |
| selectbox | hover, focus-visible (native `<select>`) |
| coachmark | pointer directions are *static variants* → moved to Actionable list candidate (see note) |

> **Note on coachmark:** the audit flagged pointer directions (up/down/left/right) + mask. These are runtime-positioned popups, hard to show statically in a gallery; treated as interaction-only unless you want forced-class demos. Left out of section A.

## C. Confirmed complete (representative)

button, textbox, intbox, longbox, decimalbox, doublebox, spinner, doublespinner, datebox, timebox, timepicker, combobox, bandbox, toast, messagebox, errorbox, toolbar, window, popup, drawer, rating, multislider, rangeslider, grid (+ sibling pages), listbox (+ sibling pages), biglistbox, captcha, fileupload, imagemap, loadingbar, progressmeter, barcodescanner, camera, scrollview — and all no-contract feature/aggregate pages (rowlayout, linelayout, tablelayout, cardlayout, space, scrollbar, area, audio, video, iframe, html, label, error, loading, inputs, inputs-rounded).

---

## Verification
A render smoke test guards these pages: `src/test/playwright/render-smoke.spec.ts` (Playwright `smoke` project). It loads each of the 14 changed pages and asserts HTTP 200 + a composed `.z-p-8` body — catching ZK semantic errors (unsupported mold/attribute) that `xmllint` cannot. Run with the preview app up:
```
npx playwright test --config=src/test/playwright/playwright.config.ts --project=smoke
```
Result 2026-06-18: **14/14 passed** (after dropping the 3 non-achievable states above, which were returning HTTP 500).

## Recommended fix batch
Sections **A#1–A#14** (High + Med, all cleanly static) are the recommended scope to "補上". A#15–A#22 (Low/optional) can be included or skipped.
