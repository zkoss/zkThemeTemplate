# Use-Case Screens Design Review (MD3)

**Date:** 2026-07-02 · **Theme:** Marble · **ZK:** 10.3.0.1-jakarta
**Subject:** the 7 use-case screens under `src/test/resources/web/usecase/` (excluding `index.zul`)

Reviewed **as rendered in the browser** (not by reading source), followed by a Material Design 3 evaluation of whether and how to fix each issue. This document is a review record only. No CSS or ZUL was changed. The fix recommendations are here for a later, separate decision.

## Why this review

These pages are the ground-truth showcase of the Marble theme applied to realistic enterprise UI. Each is a ZK fragment loaded inside a shared SPA app-shell (left sidebar plus content pane) via `index.zul` deep-links. Because they compose many themed components into real layouts, they surface theme-level weaknesses that single-component preview pages hide, plus page-authoring issues in the demo ZUL itself.

## Method

- Preview app on `http://localhost:8080`. Captured all 7 pages via SPA deep-links `…/usecase/index.zul#usecase/<page>` at desktop width **1280px**, 2x DPR, waiting on `document.fonts.ready` plus a per-page content marker.
- Ambiguous findings were verified with **computed-style probes** (Playwright `getComputedStyle`) rather than eyeballing, so recommendations rest on measured values. One initial finding (X3) was retracted after measurement.

## Findings summary

| # | Finding | Scope | Severity | Fix? |
|---|---------|-------|----------|------|
| X1 | Flat button hierarchy: Cancel/Back render as filled primary (same as Save/Next). Theme *ships* low-emphasis variants; the pages just don't apply them | **Page** | **High** | **Done 2026-07-02** |
| X2 | Input inconsistency: active select comboboxes render grey/borderless with muted text (look disabled) beside white/bordered/black-text textboxes | **Theme** | **High** | **Done 2026-07-03** (combobox, datebox, bandbox; timebox/spinner excluded) |
| P1 | item-editor: full-bleed Basic-Info fields plus inconsistent label placement (left vs top) within one form | Page | Med | **Done 2026-07-03** |
| P2 | ops-dashboard: delta color driven by arrow direction, not meaning ("Low Stock ↓2" shown red) | Page | Med | **Done 2026-07-03** |
| P3 | account-settings: selected nav (Profile) does not match shown panel (Notifications) | Page | Low | **Done 2026-07-03** |
| P4 | onboarding-wizard: em-dash in "Step 2 — Profile"; future step dots blue-outlined (weak done/todo contrast) | Page + **Theme** | Low | **Done 2026-07-03** |
| P5 | ops-dashboard: KPI strip is 4 identical hero-metric cards (generic SaaS pattern) | Page | Low | Optional |
| P6 | item-editor: form card plus separate footer card creates a seam; sign-in card padding a touch tight | Page | Low | Optional |
| C1 | Sample copy uses em dashes (ticket thread) | Copy | Trivial | Optional |
| ~~X3~~ | ~~Progressmeter reads as a slider~~ **retracted**: measured a flat 4px rounded bar, no `::after`, no knob. The apparent "dot" is the rounded fill end-cap | Theme | n/a | No |

---

## Cross-cutting findings

### X1. Flat button hierarchy (High). Root cause: page authoring, not theme

Measured on the item-editor footer: **Cancel** (`class="z-ms-auto z-button"`) and **Save** (`class="z-button-primary z-button"`) both compute to `background-color: rgb(55,111,208)`, white text, same shadow. They are visually identical, so every neutral or secondary action (Cancel, Back) shouts as loudly as the one primary CTA on the same screen. This recurs on item-editor, account-settings, and onboarding-wizard.

The theme already ships the fix. `button.css` defines `.z-button-default` (transparent plus `1px solid outline`, i.e. MD outlined), `.z-button-outlined`, and `.z-button-text` (text only). The demo pages simply never apply them to secondary actions:

- [item-editor.zul:103](../src/test/resources/web/usecase/item-editor.zul#L103) Cancel: `sclass="z-ms-auto"` (margin utility only, no emphasis variant)
- [account-settings.zul:67](../src/test/resources/web/usecase/account-settings.zul#L67) Cancel: `sclass="z-ms-auto"`
- [onboarding-wizard.zul:60](../src/test/resources/web/usecase/onboarding-wizard.zul#L60) Back: no `sclass` at all

With no variant, they fall through to the filled base `.z-button`.

- **MD3 basis:** the button emphasis ladder is filled (highest), then tonal/elevated, then outlined, then text (lowest). A screen should carry one high-emphasis action; companions sit lower. MUI's default `Button` is even the low-emphasis text variant.
- **Fix (page, 3 lines):** add `sclass="z-button-default"` (or `z-button-text`) to those three buttons. Primary CTAs stay filled. No theme edit required.
- **Optional deeper question:** a bare `<button>` defaulting to filled primary is a footgun. Any author who forgets a variant gets a loud button, which is exactly what happened here. Whether the base `.z-button` should default to a lower emphasis is a theme-philosophy decision, broad and higher-risk, out of scope unless requested.

### X2. Comboboxes look disabled next to textboxes (High). Theme

Measured and visually confirmed with zoomed crops in the same form:

- `.z-textbox`: `background:#fff`, `border:1px solid rgba(0,0,0,.23)`, `border-radius:4px`, **black** text. Reads as an active, editable field.
- `.z-combobox.z-combobox-readonly` (wrapper): `background:rgb(247,249,252)` (grey), **`border:0`**, **muted grey** text. Reads as a **disabled** field.

The theme applies a grey "readonly" fill intended to signal "not free-text." But `readonly="true"` is the *normal* state for a select-style combobox (the common enterprise pattern), so active select dropdowns end up looking disabled and clash with the white, bordered textboxes beside them. Editable comboboxes (rare here) do match the textbox; only the readonly/select variant diverges.

- **MD3 basis:** a select menu is a member of the text-field family and should look like an active field (outlined or filled, consistently), not like a disabled control. Pick one field language and apply it to textbox, combobox, and select alike.
- **Fix (theme):** restyle `.z-combobox-readonly` in `inp/css/combobox.css` to match the outlined text-field language: visible `1px solid` outline, `--zk-shape-input` radius, surface (not surface-container-low) background, and full-opacity text. Reserve the greyed treatment for the genuinely `disabled` state. This affects every readonly combobox theme-wide, so it needs a visual-regression pass.

### X3. Progressmeter looks draggable. RETRACTED

Initial screenshots suggested a slider knob on the Stock Level and Fulfillment bars. Verified false: `.z-progressmeter` is `height:4px; border-radius:2px; background:primary-container` with a fill span `height:4px; border-radius:2px; background:primary`, and has **no `::after` and no handle element**. The apparent "dot" is just the fill bar's rounded right end-cap. Component and styling are correct, so no fix. Optional cosmetic only: square the fill cap so it never reads as a dot at small sizes.

---

## Per-page findings

### sign-in. Clean
Centered ~360px card: brand, subtitle, Email, Password, Remember-me plus Forgot-password, full-width Sign In, sign-up footer. Well composed and vertically centered. Nits only: the app sidebar showing behind a login screen is a demo-shell artifact (not a page bug); card interior padding is slightly tight (P6).

### inventory-table. Strong
`Inventory` title plus `+ Add Item` (filled, appropriate as the one CTA). Filter row (search plus Category plus Status) above a table card; status chips are well-differentiated (In Stock green / Low amber / Out red); Qty right-aligned; paging centered. Issue: the filter row floats on the body rather than reading as a grouped toolbar surface.

### ops-dashboard. Good, two content issues
KPI strip (Orders / Fulfilled / Low Stock / Open Tickets), an "Orders Needing Attention" table with status chips plus fulfillment bars, and a 3-panel row (Fulfillment by Channel / Pending Tasks / Recent Activity). Issues: **P2** (**Done 2026-07-03**) delta semantics, where colors followed the arrow direction, so "Low Stock SKUs ↓2" was red though fewer is better — now green by meaning; **P5** the 4 identical KPI cards are the generic hero-metric grid. Also verify the orders table shares the same card treatment as the bottom panels (it reads flatter).

### ticket-inbox. Strong
Master list (priority plus status chips, selected row tinted) plus detail pane (conversation bubbles: incoming grey-left, outgoing blue-right, reply pinned bottom). Solid master-detail. Only C1 (an em dash in the sample message copy).

### account-settings. Good, two issues
Left settings-nav card plus right panel (Email alerts / Push toggles, Digest frequency select, Alert volume slider, Cancel plus Save). Issues: **X1** (Cancel equals Save emphasis); **P3** (**Done 2026-07-03**) the selected nav item was **Profile** but the panel shows **Notifications** — now the Notifications navitem is selected, matching the panel.

### onboarding-wizard. Good, several nits
Stepbar (Account done / Profile current / Preferences and Done upcoming) plus a label-left form plus Back/Next. Issues: **X1** (Back equals Next); **X2** (text fields outlined-white, comboboxes filled-grey); **P4** (**Done 2026-07-03**) "Step 2 — Profile" used an em dash (now "Step 2 · Profile"), and upcoming step dots were blue-outlined — now muted grey so done vs todo reads at a glance (theme change to `stepbar.css`).

### item-editor. Most issues
`Edit Item` plus SKU chip; sections Basic Info / Stock / Pricing / Options; footer Cancel plus Save. Issues: **X1**, **X2**, plus **P1** (**Done 2026-07-03**): (a) Basic-Info fields were full card width (~640px), far too wide for Name/SKU/Supplier, while Stock/Pricing used sensible multi-column widths, so field rhythm was erratic; (b) label placement was inconsistent, since Basic Info used label-on-left while Stock/Pricing/Options used label-on-top in the same form; **P6**: the form card and the footer-action card are separate surfaces, leaving a seam.

---

## MD3 evaluation and recommended fixes

All fix locations are confirmed from source. Direction is settled. None of these were applied in this pass.

- **X1 (buttons), page, 3 lines. DONE 2026-07-02:** added `sclass="z-button-outlined"` to Cancel [item-editor.zul:103](../src/test/resources/web/usecase/item-editor.zul#L103), Cancel [account-settings.zul:67](../src/test/resources/web/usecase/account-settings.zul#L67), Back [onboarding-wizard.zul:60](../src/test/resources/web/usecase/onboarding-wizard.zul#L60), preserving `z-ms-auto`. Primary CTAs (Save/Next/Sign In/Send/Add Item) stay filled. No theme edit. Chose `.z-button-outlined` over `.z-button-default` because it resets the base resting `box-shadow` to `none` (no residual shadow) and uses the primary color for both border and text (canonical MD outlined). Verified live (computed styles): Cancel/Back compute `background: transparent`, `border: 1px solid rgb(55,111,208)`, text `rgb(55,111,208)`, `box-shadow: none`; Save/Next stay filled `rgb(55,111,208)` with white text.
- **X2 (comboboxes), theme. DONE 2026-07-03 (combobox):** made `.z-combobox-readonly` render identical to the active/editable combobox (removed the grey bg, faint border, muted text, and `pointer-events:none` dead button); the greyed look is now reserved for `disabled`. Verified live: readonly combobox matches the textbox (`bg #fff`, `border 1px rgba(0,0,0,.23)`, text `rgba(0,0,0,.87)`) and the arrow button opens the dropdown again (it was functionally dead before). Details + verified before/after in [x2-combobox-readonly-solution.md](x2-combobox-readonly-solution.md). The same fix was extended to **datebox** and **bandbox** (both open a popup when readonly, so they must read as active); **timebox / spinner excluded** (no dropdown when readonly, so a de-emphasized look is acceptable). Theme-wide, so a screenshot re-baseline is still owed.
- **P1 (item-editor), page. DONE 2026-07-03:** converted the Basic-Info `<grid>` (label-on-left, 180px label column, `hflex="1"` full-bleed fields) into two label-on-top flex rows matching the Stock/Pricing idiom — Product Name + SKU, then Category + Supplier, each `z-flex-1 z-min-w-0` in a `z-d-flex z-flex-row z-flex-wrap z-gap-4` container. No new page CSS (uses existing `z-*` utilities only); values, the `constraint="no empty"` on SKU, and the Category combobox items all preserved. Verified live (computed styles) at 1280px: all four Basic-Info fields now 471px (~half of the 990px card, 2-per-row) instead of full-bleed, and every field label is `display:block` at 11px (`z-text-xs`) — identical placement to Pricing (471px, 2-col) and Stock (309px, 3-col). This page is not in the Playwright screenshot baseline suite, so no re-baseline is owed. See [item-editor.zul](../src/test/resources/web/usecase/item-editor.zul).
- **P2 (dashboard deltas), page. DONE 2026-07-03:** flipped the "Low Stock SKUs ↓ 2" delta from `z-text-error` to `z-text-success` in [ops-dashboard.zul](../src/test/resources/web/usecase/ops-dashboard.zul) — fewer low-stock SKUs is an improvement, so it must read green. The other three were already correct by meaning (Orders ↑ / Fulfilled ↑ green; Open Tickets ↑ red). Verified live: Low Stock delta now `rgb(76,175,80)` (green), Open Tickets stays `rgb(211,47,47)` (red). One-line change.
- **P3 (settings state), page. DONE 2026-07-03:** moved `selected="true"` from the Profile navitem to the Notifications navitem in [account-settings.zul](../src/test/resources/web/usecase/account-settings.zul) — the panel content is entirely notification settings, so the nav must select Notifications. Verified live: sub-nav Notifications `selected`, panel heading "Notifications". Two-line change.
- **P4 (wizard), page + theme. DONE 2026-07-03:** (a) *page* — replaced the em dash with "Step 2 · Profile" (middle dot) in [onboarding-wizard.zul](../src/test/resources/web/usecase/onboarding-wizard.zul). (b) *theme* — muted the upcoming step-dot outline from `--zk-color-primary` to `--zk-color-outline` in [stepbar.css](../src/main/resources/web/js/zkmax/wgt/css/stepbar.css) (`.z-step-icon-empty`) so a "todo" step reads grey (matching the un-lit connector) and contrasts clearly with the solid-primary complete/active dots. Verified live: upcoming dots now `rgba(0,0,0,0.23)` grey; complete/active stay solid blue; error stays red. Shared component, so `npm run build:css` was run and the `stepbar/gallery.png` baseline was re-generated deliberately (the change is below the gallery's 1% `maxDiffPixelRatio`, so the suite stayed green, but the baseline is refreshed to stay honest).
- **P5 / P6 / C1, optional polish:** differentiate the KPI cards; unify the item-editor footer into the form card and loosen sign-in padding; remove em dashes from sample copy.

### Recommended fix batches (for a later pass)

1. **Page correctness (X1, P1, P2, P3, P4):** mostly demo ZUL under `src/test/resources/web/usecase/`; the one exception is P4's step-dot mute, a small shared-theme change to `stepbar.css`. **All done: X1 2026-07-02; P1, P2, P3, P4 2026-07-03.**
2. **Theme fix (X2):** one shared component; highest-leverage but touches every readonly combobox, so it needs `npm run build:css` plus a screenshot re-baseline. **Done 2026-07-03 for combobox + datebox + bandbox** (build run; re-baseline still owed). timebox/spinner excluded (no popup when readonly).
3. **Optional polish (P5, P6, C1).**

### Verification recipe (when fixes are applied)

- After each batch: `npm run build:css`, re-capture the 7 pages at 1280px, and diff against the pre-fix screenshots.
- Re-run the computed-style probe to confirm: Cancel background differs from Save; the combobox now reads as an active outlined field; deltas are colored by meaning.
- Keep `npm run screenshot:test` green; re-baseline affected components deliberately (X2 is theme-wide).
