# Work Status — ZK-Material Theme Verification Harness

**Owner of writes:** Orchestrator ONLY (single-writer; merges the status deltas that Evaluators return in their final output — see evaluator §7 and playbook Step 3).
**Read access:** Evaluator reads for iteration history. Generator may read for context. Design-Verifier (Gate 2) never writes here.
**Column rule:** `failing-set` holds check ids only (e.g. `c2, c8, M3`) — narrative history belongs in `doc/harness/eval-reports/<component>.md`, never in this table.

## Status legend (canonical status vocabulary — the playbook references this list)
- **PENDING** — never evaluated
- **EVALUATING** — Evaluator running (transient)
- **GATE2_PENDING** — Gate 1 (Evaluator) all checks pass; awaiting Gate 2 (md3-design-verifier) (transient)
- **VERIFIED_WITH_VISUAL_NOTES** — Gate-1 measurement passed but the Evaluator's §3d AI visual review surfaced ≥ 1 finding; awaits orchestrator triage (promote to contract row → `RE_EVAL_NEEDED`, or accept as false positive → `GATE2_PENDING`) (transient)
- **VERIFIED** — dual-gate: Gate 1 measurement pass AND Gate 2 `GATE2: PASS` (zero Critical design findings). Written by the Orchestrator only.
- **NEEDS_FIX** — at least one check failing, or Gate 2 Critical findings routed through a contract revision
- **FIXING** — Generator running (transient)
- **VERIFYING** — Evaluator running post-fix (transient)
- **RE_EVAL_NEEDED** — a sibling's Generator pass touched the shared CSS file
- **STALLED** — `newly_passing == 0` for 2 consecutive iterations while `failing-set` is non-empty (D3 signal A; a clean double-pass never stalls) (terminal — user review)
- **OSCILLATING** — `failures[n] == failures[n-2]` (D3 signal B) (terminal — user review)
- **CONSTRAINT** — manual override (intentionally won't fix; e.g., ZK platform limit) (terminal)
- **ESCALATED_TOKEN_FIX** — check fails because a `--zk-*` token diverges from DESIGN.md; logged in `doc/harness/token-issues.md`; Generator NOT dispatched (terminal until the user fixes the token, then flip to `RE_EVAL_NEEDED`)
- **ESCALATED_LIBRARY_CONFIG** — T3 only: fix requires widget `.ts`/`.java` or library JS config, not CSS; logged in `doc/harness/library-config-issues.md` (terminal for this harness)
- **BLOCKED: \<reason\>** — Evaluator pre-flight/artefact gate refused (`contract-approved=false`, `js-source drift`, `page-not-ready`, `missing-visual-artefact`); route per playbook Step 4 / Spec-Author phase (transient)
- **EVALUATING_BLOCKED** — preview app died mid-eval; orchestrator stops the loop and alerts the user to restart it (transient)

> **Dual-gate migration note (2026-06-04):** rows marked `VERIFIED` before this date passed Gate 1 only (the dual-gate `VERIFIED` definition did not exist yet). They are grandfathered — re-run Gate 2 on them opportunistically (flip to `GATE2_PENDING`) or when their component's design quality is questioned. Pilot component: goldenlayout.

## Tier legend
- **T1** — Mira-mapped; compare to Mira values
- **T2** — ZK-only; DESIGN.md tokens only + sibling coherence
- **T3** — Third-party wrapper; wrapper-only checks

## Serialization rule
Only one component per `shared-css-file` may be in `FIXING` at a time. The orchestrator enforces this when dispatching `/zk-theme-generator`.

---

## Group A — Form Inputs

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| textbox | T1 | inp/css/input.css | intbox, decimalbox, doublebox, longbox, textarea, passwordbox | VERIFIED | 3 | — |
| intbox | T1 | inp/css/input.css | textbox, decimalbox, doublebox, longbox, textarea, passwordbox | VERIFIED | 3 | — |
| decimalbox | T1 | inp/css/input.css | textbox, intbox, doublebox, longbox, textarea, passwordbox | VERIFIED | 2 | — |
| doublebox | T1 | inp/css/input.css | textbox, intbox, decimalbox, longbox, textarea, passwordbox | VERIFIED | 2 | — |
| longbox | T1 | inp/css/input.css | textbox, intbox, decimalbox, doublebox, textarea, passwordbox | VERIFIED | 2 | — |
| textarea | T1 | inp/css/input.css | textbox, intbox, decimalbox, doublebox, longbox, passwordbox | VERIFIED | 2 | — |
| passwordbox | T1 | inp/css/input.css | textbox, intbox, decimalbox, doublebox, longbox, textarea | VERIFIED | 2 | — |
| combobox | T1 | inp/css/combobox.css | — | VERIFIED | 2 | — |
| datebox | T1 | inp/css/datebox.css | — | VERIFIED | 2 | — |
| timebox | T1 | inp/css/timebox.css | — | VERIFIED | 2 | — |
| spinner | T1 | inp/css/spinner.css | doublespinner | VERIFIED | 1 | — |
| doublespinner | T1 | inp/css/spinner.css | spinner | VERIFIED | 1 | — |
| bandbox | T2 | inp/css/bandbox.css | — | VERIFIED | 3 | — |
| slider | T1 | inp/css/slider.css | — | VERIFIED | 4 | dual-gate pass 2026-06-04 (knob mold k1–k5 + outcome M1–M5 covered) |
| selectbox | T1 | wgt/css/selectbox.css | — | VERIFIED | 1 | — |
| rating | T1 | wgt/css/rating.css | — | VERIFIED | 2 | — |
| inputgroup | T2 | wgt/css/inputgroup.css | — | VERIFIED | 2 | — |
| cascader | T1 | zkmax/inp/css/cascader.css | — | VERIFIED | 6 | dual-gate pass 2026-06-05 (re-authored 26-row contract; GATE2 PASS critical=0 suggested=1: optional font-weight 500 on trigger label); iter 6 same day: user-reported expand-caret drift → c26/M7 added failing-first, fixed (margin-left:auto trailing anchor), probe-verified |
| chosenbox | T1 | zkmax/inp/css/chosenbox.css | — | VERIFIED | 1 | — |
| colorbox | T2 | zkex/inp/css/colorbox.css | — | VERIFIED | 2 | — |
| codeeditor | T3 | code/css/codeeditor.css | — | VERIFIED | 2 | — Dual gate complete 2026-09-08. **Gate 1 CLEAN** (47/47 rows, 0 AI visual findings); **GATE2: PASS** (critical=0, suggested=2). New in ZK 11.0.0 (CE, CodeMirror 6). Designer-reported focus-ring defects fixed: the ring moved off the root's inset box-shadow onto a `.z-codeeditor::after` overlay, because an inset shadow paints BELOW children and CodeMirror's DOM is flush to the border and opaque (measured 1/2/2/2px light, 1/1/1/1px dark); and the dark surface took its own MD3 tone-80 focus knob (3.45:1 -> 8.45:1). Guards measure PAINTED PIXELS — computed `box-shadow` reported the ring correctly in both broken states. Gate 2 independently confirmed the tone-80 claim against the MD3 spec, and noted that this codebase's OKLCH-lightness derivation approximates M3's HCT tone rather than matching it — the same approximation the whole palette already uses, not a new liberty. c19/c27 RETIRED: `.cm-cursor`/`.cm-dropCursor` never render under the CE build (no `drawSelection()`), so the native caret keeps the UA default black/white — knowingly accepted (D7-B), recorded in CSS + skill + contract. Commits 2be53128 / 1d73da36 / 4f69c001 / c096e65a. OPEN SUGGESTIONS (non-blocking, deliberately not actioned — changing the default would re-open the contract for a 4th approval): (1) `--zk-color-inverse-primary` fills a similar 'light primary on dark' role, but it is NOT the same value — chroma `c*0.58` vs full `c`, measured `#9ec2fe`/9.21:1 vs `#80bdff`/8.45:1 — so consuming it is a saturation choice, not deduplication; its only current consumer uses it as text colour. (2) No state-specific screenshots are persisted for a component that had two same-day focus-ring regressions. |
| rangeslider | T2 | zkex/slider/css/rangeslider.css | — | VERIFIED | 3 | — |
| multislider | T2 | zkmax/slider/css/multislider.css | — | VERIFIED | 2 | — |
| searchbox | T3 | zkmax/inp/css/cascader.css | cascader | VERIFIED | 2 | — |
| daterangebox | T2 | zkmax/db/css/daterangebox.css | — | GATE2_PENDING | 1 | New in ZK 10.4.0 (zkmax). Authored + contract-approved 2026-07-17. **Gate-1 verified manually via live Chrome computed-style measurement (127.0.0.1)**: root 1px outline/4px/40px, transparent centered inputs, disabled 0.38, readonly, focus ring (primary border+inset ring, measured with transitions disabled), invalid (error border+ring), popup absolute/z1700/elevation/flat inner calendar, panels 2-col grid, footer outlined Clear/Cancel + filled Today (showTodayLink), range band visually confirmed. No automated eval report; Gate-2 design review NOT run. Invalid state can't be shown declaratively — ZK drops user sclass on daterangebox (**confirmed bug ZK-6133**, filed 2026-07-17; datebox/textbox/combobox/bandbox all honor sclass, daterangebox alone drops it). Invalid CSS itself correct (verified by forcing class). Preview State Matrix split into two 2-col matrices (Default/Disabled + Readonly/Invalid) since the widget is wide; Invalid column left unstyled w/ comment → ZK-6133. No `.z-daterangebox-open` state. |
| timepicker | T1 | zkmax/inp/css/timepicker.css | timebox | GATE2_PENDING | 10 | Gate-1 PASS: c1–c15 + M1–M4 + lr-1/2/3 all pass (live-verified). buttonVisible-false REMOVED from contract — Timepicker extends DateTimeFormatInputElement (no setButtonVisible); state structurally unreachable, attribute 500s in ZUL; skill+contract+CSS corrected, dead rule removed. c14 live-confirmed rgb(211,47,47), 0 stuck anims. iter-11 popup-position fix (user-reported bottom-left bug): popup lacked `position` → static → ZK inline left/top inert; aligned to combobox dropdown (position:absolute/z-index:1600/margin/shape-menu/elevation-dropdown/no-border), removed lr-3 width hack; c16/c17 added; skill floating-popup-in-body.md extended. iter-12 (2 user-reported bugs): (a) left corners "missing" → root needed `overflow:hidden` to clip the always-readonly opaque input to the 4px radius (c18/M6); (b) focus grew the field 36→38px → focus ring changed from `border-width:2px` to `box-shadow: inset 0 0 0 1px primary` so border stays 1px (c5 retoken/c5b/c5c/M5, rest-H==focus-H verified). Focus-growth was family-wide — same inset-ring fix applied to datebox/timebox/bandbox/spinner (combobox safe, unchanged); NEW skill `reference/focus-affordance-no-layout-shift.md`. iter-13 (user-reported): focus ring looked thicker around the button than the input — iter-12's root inset box-shadow was occluded by the opaque always-readonly input on the input side; moved the ring to an always-present `::after` overlay (paints above children, pointer-events:none, clipped by overflow:hidden), root box-shadow:none (c5→::after, c5d); reference doc gained the opaque-child caveat. GATE2 BLOCKED on screenshot pipeline: Chrome MCP tab-group desync (gif_creator rejects fresh healthy tabs; the in-group tab hangs on document_idle) — needs browser-session reset, then Gate-2 design review |

## Group E — Buttons

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| button | T1 | wgt/css/button.css | — | VERIFIED | 4 | — |
| combobutton | T2 | wgt/css/combobutton.css | — | VERIFIED | 1 | — |
| toolbarbutton | T2 | wgt/css/toolbarbutton.css | — | VERIFIED | 3 | — |

## Group B — Selection

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| checkbox | T1 | wgt/css/checkbox.css | radio | VERIFIED | 2 | — |
| radio | T1 | wgt/css/checkbox.css | checkbox | VERIFIED | 2 | — |
| radiogroup | T1 | wgt/css/checkbox.css | checkbox, radio | VERIFIED | 2 | — |

## Group C — Data Display

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| grid | T1 | grid/css/grid.css | — | VERIFIED | 4 | — |
| listbox | T1 | sel/css/listbox.css | — | VERIFIED | 3 | — |
| tree | T1 | sel/css/tree.css | — | VERIFIED | 4 | — |
| paging | T1 | mesh/css/paging.css | — | VERIFIED | 2 | — |
| calendar | T1 | db/css/calendar.css | — | VERIFIED | 4 | — |
| biglistbox | T2 | zkmax/big/css/biglistbox.css | — | VERIFIED | 2 | — |
| organigram | T2 | zkmax/layout/css/organigram.css | — | VERIFIED | 5 | — |

## Group D — Navigation

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| menubar | T1 | menu/css/menu.css | menupopup, menuitem | VERIFIED | 4 | — |
| menupopup | T1 | menu/css/menu.css | menubar, menuitem | VERIFIED | 3 | — |
| menuitem | T1 | menu/css/menu.css | menubar, menupopup | VERIFIED | 3 | — |
| toolbar | T1 | wgt/css/toolbar.css | — | CONSTRAINT | 1 | c2 |
| tabbox | T1 | tab/css/tabbox.css | tab, tabpanel | VERIFIED | 9 | — |
| tab | T1 | tab/css/tabbox.css | tabbox, tabpanel | VERIFIED | 6 | — |
| tabpanel | T1 | tab/css/tabbox.css | tabbox, tab | VERIFIED | 6 | — |
| a | T1 | wgt/css/a.css | — | VERIFIED | 2 | — |
| navbar | T1 | zkmax/nav/css/nav.css | anchornav | VERIFIED | 2 | — |
| anchornav | T2 | zkmax/nav/css/anchornav.css | navbar | VERIFIED | 2 | — |
| fisheyebar | T2 | zkex/menu/css/fisheye.css | — | CONSTRAINT | 2 | — |
| stepbar | T3 | zkmax/wgt/css/stepbar.css | — | VERIFIED | 6 | — |
| breadcrumb | T1 | wgt/css/breadcrumb.css | breadcrumbitem (folded into breadcrumb contract) | VERIFIED | 1 | — |

## Group F — Containers

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| window | T1 | wnd/css/window.css | — | VERIFIED | 2 | — |
| panel | T1 | wnd/css/panel.css | — | VERIFIED | 2 | — |
| groupbox | T2 | wgt/css/groupbox.css | — | VERIFIED | 1 | — |
| splitter | T2 | box/css/splitter.css | — | VERIFIED | 4 | — |
| bandpopup | T2 | wnd/css/bandpopup.css | — | VERIFIED | 2 | — |
| messagebox | T1 | wnd/css/messagebox.css | — | VERIFIED | 2 | — |
| popup | T1 | wgt/css/popup.css | — | VERIFIED | 2 | — |
| caption | T1 | wgt/css/caption.css | — | VERIFIED | 2 | — |
| borderlayout | T1 | layout/css/borderlayout.css | — | VERIFIED | 5 | — |
| anchorlayout | T1 | layout/css/anchorlayout.css | — | VERIFIED | 2 | — |
| rowlayout | T1 | zkmax/layout/css/rowlayout.css | — | VERIFIED | 2 | — |
| tablelayout | T1 | zkmax/layout/css/tablelayout.css | — | VERIFIED | 3 | — |
| linelayout | T2 | zkmax/layout/css/linelayout.css | — | VERIFIED | 2 | — |
| imagemap | T1 | wgt/css/imagemap.css | — | VERIFIED | 1 | — |
| drawer | T2 | zkmax/wgt/css/drawer.css | — | VERIFIED | 2 | — |
| scrollview | T2 | zkmax/layout/css/scrollview.css | — | VERIFIED | 1 | — |
| portallayout | T1 | zkmax/layout/css/portallayout.css | — | VERIFIED | 3 | — |
| splitlayout | T1 | zkmax/layout/css/splitlayout.css | splitter | VERIFIED | 5 | — |

## Group T3 — Third-party / opaque-content wrappers

These components wrap external JS libraries or server-rendered opaque content. The Generator only edits the wrapper; internal library DOM is forbidden. May need `ESCALATED_LIBRARY_CONFIG` for JS-driven theming.

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| captcha | T3 | wgt/css/captcha.css | — | VERIFIED | 2 | — |
| goldenlayout | T3 | (zkmax) goldenlayout/css/goldenlayout.css | — | VERIFIED_WITH_ESCALATION | 15 | — |
| pdfviewer | T3 | (zkex) pdfviewer/css/pdfviewer.css | — | VERIFIED | 4 | — |
| signature | T3 | (zkmax) signature/css/signature.css | — | VERIFIED | 6 | — |
| tbeditor | T3 | zkmax/tbeditor/css/tbeditor.css | — | VERIFIED | 6 | — |
| cropper | T3 | zkmax/cropper/css/cropper.css | — | RE_EVAL | 6 | was dual-gate VERIFIED iter-6 (Gate1 12/12 + Gate2 PASS); reopened 2026-06-05 (prompt2 v2): toolbar MD3 floating-toolbar redesign (c4 revised, c5 border-top→elevation-2, c7–c12 new — both Gate2 suggested promoted), M5 revised (4–24px clearance), M7 new (no dead space; page width rightsized 600→300px + flex wrapper removed — cropper REQUIRES external size, resizeImage feedback loop), M1 selector precision; self-verified live (M1–M7 + c11 hover 0.08, underline leak fixed) — formal dual-gate re-run pending |

## Group G — Feedback / Overlay

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| notification | T1 | wgt/css/notification.css | — | VERIFIED | 2 | — |
| toast | T1 | wgt/css/toast.css | — | VERIFIED | 3 | — |
| progressmeter | T1 | wgt/css/progressmeter.css | — | VERIFIED | 1 | — |
| errorbox | T2 | wgt/css/errorbox.css | — | VERIFIED | 2 | — |
| loadingbar | T2 | wgt/css/loadingbar.css | — | VERIFIED | 2 | — |
| coachmark | T2 | zkmax/nav/css/coachmark.css | — | VERIFIED | 4 | dual-gate 2026-06-08: Gate 1 0/14 fail, Gate 2 PASS critical=0; 2 suggested (close-btn hover not promoted; 20px touch target = ZK mold DOM constraint) |
| confirmpopup | T2 | wgt/css/confirmpopup.css | — | GATE2_PENDING | 1 | New in ZK 10.4.0 (CE). Authored + contract-approved 2026-07-17. **Gate-1 verified manually via live Chrome computed-style measurement (127.0.0.1)**: surface #f7f9fc/6px/elevation/320px, header 14px/500 + divider, body flex gap 12px, message 13px, footer flex-end + divider, OK filled primary #376fd0/white/4px, Cancel outlined, arrow 8px triangle, all 5 severity icon colors correct (info/success/warning/danger/secondary). No automated eval report; Gate-2 design review NOT run. Severity reuses chip/badge mapping; icon-only recolor. Was empty-stubbed in build-css.js; stub removed. |

## Group H — Media & Upload

| component | tier | shared-css-file | siblings | status | iter | failing-set |
|-----------|------|-----------------|----------|--------|------|-------------|
| barcode | T3 | zkex/barcode/css/barcode.css | — | CONSTRAINT | 2 | c2 |
| barcodescanner | T2 | zkmax/barscanner/css/barcodescanner.css | — | VERIFIED | 2 | — |
| camera | T2 | zkmax/med/css/camera.css | — | VERIFIED | 2 | — |
| dropupload | T2 | zkmax/wgt/css/dropupload.css | — | VERIFIED | 2 | — |
| fileupload | T3 | wgt/css/button.css | button | VERIFIED | 1 | — |
| carousel | T2 | wgt/css/carousel.css | carouselitem (folded into carousel contract) | VERIFIED | 1 | — |

---

## Failing-set history

Evaluator appends iteration history per component below this line:

```
### <component>
iter 1: [c1, c3, c5]
iter 2: [c1, c5]          newly_passing=[c3]
iter 3: [c1, c5]          newly_passing=[]      → stall warning (1/2)
iter 4: [c1, c5]          newly_passing=[]      → STALLED
```

### textbox
iter 1: [c2, c8]          newly_passing=[]   (baseline; inconclusive c9-c12 noted in report)
iter 2: []                newly_passing=[c2, c8]   → VERIFIED
iter 3: []    newly_passing=[]   → VERIFIED   (RE_EVAL after errorbox merge into input.css; no regressions)

### button
iter 1: [c2, c10, c13, c14]          newly_passing=[]   (baseline)
iter 2: [c2, c13, c14]               newly_passing=[c10]
iter 3: [c14]                        newly_passing=[c2]   c13→CONSTRAINT (MD3 color/bg disabled pattern)
iter 4: []                           newly_passing=[c14]   → VERIFIED

### checkbox
iter 1: []          newly_passing=[]   (baseline; all 9 checks PASS)
iter 2: []          newly_passing=[]   → VERIFIED   (RE_EVAL cleared; shared checkbox.css touched by sibling Generator; 38 rules confirmed; all 15 checks PASS — no regressions)

### intbox
iter 1: [c2, c8]          newly_passing=[]   (baseline; both token-rooted — same tokens as textbox)
iter 2: []                newly_passing=[c2, c8]   → VERIFIED
iter 3: []    newly_passing=[]   → VERIFIED   (RE_EVAL after errorbox merge; no regressions)

### decimalbox
iter 1: []                newly_passing=[]   (baseline; all 15 checks PASS or SKIPPED — c15 skipped, no invalid element in preview)   → VERIFIED
iter 2: []    newly_passing=[]   → VERIFIED   (RE_EVAL after errorbox merge; no regressions)

### grid
iter 1: [c3, c7, c9, c10, c11, c12]          newly_passing=[]   (baseline)
iter 2: [c7, c9, c10, c11, c12]              newly_passing=[c3]
iter 3: []                                   newly_passing=[c7, c9, c10, c11, c12]   → VERIFIED
iter 4: []   newly_passing=[]   → VERIFIED   (RE_EVAL cleared; f1-f4 frozen checks all PASS — frozen col headers bg=rgb(255,255,255) via --zk-color-surface; frozen body cells opaque white + z-index:1 + translate3d; max scroll=166px(capped from 350); Col C text hidden behind frozen zone; frozen layout float/overflow/min-height all PASS; c1-c12 unchanged PASS; note: contract f2 selector .z-row .z-row-inner is stale for ZK10 — actual frozen body cells are .z-cell with inline transform; f3 .z-grid-odd frozen rows bg=white=PASS)

### listbox
iter 1: [c7, c11, c13, c14]          newly_passing=[]   (baseline)
iter 2: []                            newly_passing=[c7, c11, c13, c14]   → VERIFIED
iter 3: []                            newly_passing=[f1, f2]   → VERIFIED   (RE_EVAL cleared; frozen checks f1/f2 PASS — headers+cells have opaque rgb(255,255,255) bg; f3 SKIPPED — no selected row in frozen listbox; f4 PASS — bleed-through prevented by opaque white cells + overflow-x:hidden on body; c10 SKIPPED — no striped listbox in preview; all c1–c9/c11–c15 unchanged PASS; no layout regressions)

### radio
iter 1: []          newly_passing=[]   (baseline; all 7 checks PASS)   → VERIFIED
iter 2: []          newly_passing=[]   → VERIFIED   (RE_EVAL_NEEDED cleared; shared checkbox.css touched by sibling Generator; 18 .z-radio* rules confirmed present; all 7 checks still PASS — no regressions)

### doublebox
iter 1: []          newly_passing=[]   (baseline; 14 checks PASS, c15 SKIPPED — no invalid element in preview)   → VERIFIED
iter 2: []          newly_passing=[]   → VERIFIED   (RE_EVAL after errorbox merge into input.css; no regressions; c15 now directly measured via injected invalid element — still PASS)

### longbox
iter 1: []                newly_passing=[]   (baseline; all measurable checks PASS, c9-c12/c15 SKIPPED — harness limits)   → VERIFIED
iter 2: []    newly_passing=[]   → VERIFIED   (RE_EVAL after errorbox merge into input.css; no regressions)

### combobox
iter 1: [c1, c3, c4, c8, c9, c11, c12]          newly_passing=[]   (baseline)
iter 2: []                                       newly_passing=[c1, c3, c4, c8, c9, c11, c12]   → VERIFIED

### textarea
iter 1: []                newly_passing=[]   (baseline; all 6 measurable checks PASS, t7 SKIPPED — CDP focus pseudo-class limitation)   → VERIFIED
iter 2: []                newly_passing=[]   → VERIFIED   (RE_EVAL after errorbox merge into input.css; no regressions; 13 .z-errorbox* rules confirmed isolated, no textarea selector overlap)

### passwordbox
iter 1: []                newly_passing=[]   (baseline; all 15 checks PASS — elements injected dynamically, no passwordbox.zul exists)   → VERIFIED
iter 2: []    newly_passing=[]   → VERIFIED   (RE_EVAL after errorbox merge into input.css; no regressions; 15 .z-errorbox* rules confirmed isolated, no z-passwordbox selector overlap; all 10 z-passwordbox rules intact)

### menubar
iter 1: [c1, c2]          newly_passing=[]   (baseline; c5 SKIPPED — no .z-menu-selected in preview)
iter 2: []                newly_passing=[c1, c2]   → VERIFIED
iter 3: []                newly_passing=[]   (RE_EVAL_NEEDED cleared; menu.css sibling touch; all checks still PASS)   → VERIFIED
iter 4: []                newly_passing=[]   (RE_EVAL_NEEDED cleared; menupopup Generator fix touched menu.css; all checks still PASS)   → VERIFIED

### spinner
iter 1: []                newly_passing=[]   (baseline; all 10 measurable checks PASS, c6 SKIPPED — CDP :focus-within limitation)   → VERIFIED

### datebox
iter 1: [c9]              newly_passing=[]   (baseline; c11 SKIPPED — CDP :focus-within limitation; c9 token-rooted easing mismatch)
iter 2: []                newly_passing=[c9]   → VERIFIED   (RE_EVAL cleared; --zk-motion-easing-standard token fixed to cubic-bezier(0.4,0,0.2,1); c11 remains SKIPPED — CDP limitation; all 23 other checks PASS)

### doublespinner
iter 1: []                newly_passing=[]   (baseline; all 10 measurable checks PASS, c6 SKIPPED — CDP :focus-within limitation; shares spinner.css grouped selectors)   → VERIFIED

### timebox
iter 1: [c10]             newly_passing=[]   (baseline; c10 component-rooted — dead CSS selector .z-timebox-input.z-timebox-invalid; invalid class is on wrapper not input)
iter 2: []                newly_passing=[c10]   → VERIFIED

### menupopup
iter 1: [c5, c6]          newly_passing=[]   (baseline; c5 component-rooted — background-color+height used instead of border-top; c6 component-rooted — margin:4px 0 overridden to 0 by higher-specificity rule)
iter 2: [c6]              newly_passing=[c5]   (c5 now uses border-top approach; c6 still overridden by ul>li margin:0)
iter 3: []                newly_passing=[c6]   (RE_EVAL_NEEDED cleared; higher-specificity fix applied; popup separator margin now 4px 0)   → VERIFIED

### menuitem
iter 1: []                newly_passing=[]   (baseline; c4 SKIPPED — no .z-menuitem-selected in preview; c5 SKIPPED — no .z-menuitem-checked without JS interaction; all 4 measurable checks PASS)   → VERIFIED
iter 2: []                newly_passing=[]   (RE_EVAL_NEEDED cleared; menu.css updated by sibling fix; all 4 measurable checks still PASS)   → VERIFIED
iter 3: []                newly_passing=[]   (RE_EVAL_NEEDED cleared; menu.css updated by sibling Generator; all 4 measurable checks still PASS — c4/c5 remain SKIPPED, no selected/checked elements in preview)   → VERIFIED

### tree
iter 1: [c14, c17, c21]   newly_passing=[]   (baseline; c14 component-rooted — row height 36.5px vs ~52px expected; c17 component-rooted — icon container 20px vs 16-18px spec; c21 component-rooted — glyph-swap instead of rotation transition)
iter 2: [c13]              newly_passing=[c14, c17, c21]   (c13 component-rooted — padding changed to 16px all-sides by Generator fix for c14; should be 8px 16px + explicit min-height:52px)
iter 3: []                 newly_passing=[c13]   → VERIFIED
iter 4: []                 newly_passing=[f1,f2,f3]   → VERIFIED   (RE_EVAL_NEEDED cleared; f1–f3 frozen-column checks added and all PASS — .z-treecol.z-frozen-col bg=rgb(255,255,255), body cells bg=rgb(255,255,255) via inherit, bleed-through prevented by header overflow:hidden + .z-frozen-body opaque overlay; c4 treecols bg changed to transparent per DESIGN.md §10 "no fill" — PASS; c11 easing updated to --zk-motion-easing-standard=cubic-bezier(0.4,0,0.2,1) per DESIGN.md §9 — PASS; all 22 checks PASS, c20 SKIPPED)

### tabbox
iter 1: [c1]              newly_passing=[]   (baseline; c1 component-rooted — padding 12px 16px is on .z-tab not .z-tab-content)
iter 2: []                newly_passing=[c1]   → VERIFIED
iter 3: []                newly_passing=[]   → VERIFIED   (RE_EVAL after tabpanel Generator; no regressions)
iter 4: BLOCKED           contract-approved=false — bundle extended with c9–c21 but approval flag not set
iter 5: [c22]             newly_passing=[]   (c9–c21 all PASS; c22 component-rooted — .z-tabbox-scroll > .z-tabbox-icon{display:flex} overrides base .z-tabbox-icon{display:none}; bundle selector stale — actual DOM uses .z-tabbox-icon not .z-tabbox-left-scroll etc.)
iter 6: []                newly_passing=[c22]   → VERIFIED   (Generator fixed conflicting .z-tabbox-scroll > .z-tabbox-icon rule; all 30 .z-tabbox-icon instances now display:none including 20 inside .z-tabbox-scroll parents; all 22 checks PASS)
iter 7: [c10,c11a,c22,c23,c24,c25,c26,c27,c29,c30]   newly_passing=[]   (RE_EVAL cleared; spec re-authored with c11a + c22–c30; c10 component-rooted — border-radius 6px(--zk-shape-card) vs 12px(--zk-shape-corner-medium); c11a component-rooted — explicit .z-tabbox-accordion .z-tab-button{display:none} must be removed; c22–c30 component-rooted — old .z-tabbox-icon{display:none} approach must be replaced with directional-class rules + .z-tabbox-scroll parent gate; c29 also TOKEN_FIX_REQUIRED — --zk-typescale-body-medium-size=13px but contract expects 14px)
iter 8: []   newly_passing=[c10,c11a,c22,c23,c24,c25,c26,c27,c29,c30]   → VERIFIED   (all 10 previously-failing checks now PASS; c10 border-radius=12px; c11a display=flex; c22/c23 scroll buttons display=flex when .z-tabbox-scroll present; c24 width=40px; c25 min-height=48px; c26 height=40px; c27 color=rgba(0,0,0,0.6); c29 font-size=13px=token value; c30 hover color-mix rule present; hidden-state display=none confirmed on non-scroll tabboxes; no regressions on c1–c9,c11–c21,c28)
iter 9: []   newly_passing=[c22a,c22b,c22c,c22d]   → VERIFIED   (4 new checks added: c22a position=absolute ✓; c22b all anchor edges=0px ✓; c22c h-strip padding=0px 40px on 6 instances ✓; c22d v-strip padding=40px 0px on 4 instances ✓; layout-regression sweep: 19 tabbox instances, 0 failures — all lr-1/lr-2/lr-3 PASS; user's "Horizontal with Toolbar"/"Bottom with Toolbar" scroll-button layout regression confirmed fixed)

### paging
iter 1: [c4, c5, c7]     newly_passing=[]   (baseline; c4/c5 component-rooted — .z-paging-selected uses primary bg + on-primary text instead of primary-container bg + primary text; c7 component-rooted — info uses body-small 12px instead of body-medium 13px; c6 SKIPPED — no disabled button in preview)
iter 2: []                newly_passing=[c4, c5, c7]   → VERIFIED

### toolbar
iter 1: [c2]              newly_passing=[]   (baseline; toolbar.zul returns 404 — toolbarseparator is PE/EE-only, measured via panel.zul + tabbox-misc.zul; c2 component-rooted — padding 0 16px is on .z-toolbar-content not .z-toolbar root; likely CONSTRAINT)

### window
iter 1: [c2, c3, c4]     newly_passing=[]   (baseline; c2 component-rooted — embedded .z-window uses 6px card radius instead of 4px dialog corner; c3 component-rooted — embedded .z-window uses card shadow not level-3; c4 component-rooted — header left/right padding is 24px not 16px)
iter 2: []                newly_passing=[c2, c3, c4]   → VERIFIED

### calendar
iter 1: [c1, c6, c7, c8]   newly_passing=[]   (baseline; c1 component-rooted — .z-calendar width:100% no max-width, cells expand to 262px instead of ~36px; c6 component-rooted — no today day-cell indicator CSS rule; c7 component-rooted — outside cells opacity:0 instead of 0.38; c8 component-rooted — th font-size:0px with ::first-letter trick, property reads 0px not 12px)
iter 2: [c1]               newly_passing=[c7, c8]   c6→CONSTRAINT (ZK does not emit z-calendar-today on td day cells; CSS rule in place but unreachable)
iter 3: [c1]               newly_passing=[]   (height now 36px PASS; width still 45.4px due to 320px container / 7-column table layout; max-width reduction needed to achieve square 36px cells)
iter 4: []                 newly_passing=[c1]   (max-width reduced to 268px → cell width=38px, height=36px, within 36–40px target)   → VERIFIED

### panel
iter 1: [c3, c4, c7]     newly_passing=[]   (baseline; c3 component-rooted — .z-panel base shadow absent, noborder variant clears to none; c4 component-rooted — header padding 12px 16px instead of 16px; c7 component-rooted — panelchildren bottom padding 16px instead of 24px)
iter 2: []               newly_passing=[c3, c4, c7]   → VERIFIED

### slider
iter 1: [c2]              newly_passing=[]   (baseline; c2 component-rooted — .z-slider-center uses --zk-color-surface-container-high (#e8eef7, blue-tinted) instead of rgba(0,0,0,0.12) neutral track; should use --zk-color-outline-variant or equivalent)
iter 2: []                newly_passing=[c2]   → VERIFIED
iter 3: [c5,c6,c9,c10,k1,k2,k3,k4,k5,M5,lr-1,lr-2]   newly_passing=[]   (RE_EVAL after contract re-approval; c5/c6/c9 component-rooted — hover/focus/active still use ::before opacity ring, not box-shadow color-mix ring; c10 component-rooted — sphere button missing radial-gradient; k1–k5 component-rooted — zero CSS rules for knob mold selectors: arcs have stroke:none, input has browser-default styling; M5 — both arc strokes none so indistinct; lr-1/lr-2 — .z-slider-input position:static causes overflow from knob root)
iter 4: []   newly_passing=[c5,c6,c9,c10,k1,k2,k3,k4,k5,M5,lr-1,lr-2]   → GATE2_PENDING   (Generator iter-3 fixes confirmed: c5/c6/c9 exact color-mix box-shadow ring rules present; c9 14px spread active ring ✓; c10 sphere radial-gradient exact token match ✓; k1 inner stroke=rgba(0,0,0,0.12)=outline-variant ✓; k2 area stroke=rgb(55,111,208)=primary ✓; k3 input bg=rgb(240,244,250)=surface-container ✓; k4 border=1px solid rgba(0,0,0,0.23)=outline ✓; k5 color=primary+position:absolute+font-weight:600 ✓; M5 inner≠area stroke ✓; lr-1/lr-2 cleared — input position:absolute resolves overflow; 20/20 rows PASS or SKIPPED; c7 SKIPPED no disabled element; no layout regressions on 7 slider instances; ai-findings: 0)

### selectbox
iter 1: []                newly_passing=[]   (baseline; all 10 checks PASS — hover/focus verified via CSS rule inspection + token resolution)   → VERIFIED

### notification
iter 1: [c1, c2, c3, c4, c6, c8, c9]   newly_passing=[]   (baseline; PRIMARY BLOCKER: notification.css.dsp never injected — no CSS loads when widget renders; checks measured via manual link injection; c1/c2/c3/c4 component-rooted — CSS properties on .z-notification-content not .z-notification wrapper; c6 component-rooted — info uses surface-container-highest not info-blue tint; c8/c9 component-rooted — warning/error use opaque container colors not transparent tints; c5 PASS; c7/c10 SKIPPED — no success element or icon in preview)
iter 2: []                              newly_passing=[c1,c2,c3,c4,c6,c8,c9]   → VERIFIED

### rating
iter 1: [c2]              newly_passing=[]   (baseline; c2 component-rooted — empty star uses --zk-color-outline rgba(0,0,0,0.23) instead of rgba(0,0,0,0.38); wrong token choice; c1/c3/c4/c5 PASS)
iter 2: []                newly_passing=[c2]   → VERIFIED

### bandbox
iter 1: [c24]             newly_passing=[]   (baseline; c24 component-rooted — :focus-within border-color stays rgba(0,0,0,0.23) instead of #376fd0; border-width correctly becomes 2px; transition on border-color in base border shorthand fights :focus-within color; c26 SKIPPED — no .z-bandbox-invalid in preview)
iter 2: []                newly_passing=[c24]   → VERIFIED
iter 3: []                newly_passing=[]   → VERIFIED   (RE_EVAL after bandpopup Generator; no regressions)

### inputgroup
iter 1: [c9]              newly_passing=[]   (baseline; c9 component-rooted — border-left collapse fails for prefix layout; .z-inputgroup-text + .z-textbox {border-left:none} at rule idx 6119 overridden by .z-inputgroup .z-textbox {border: 1px solid} at idx 6120 — same specificity (0,2,0), later rule wins, reinstates border-left; all other 14 checks PASS; disabled/hover-group/vertical SKIPPED — no such elements in preview)
iter 2: []                newly_passing=[c9]   → VERIFIED

### toast
iter 1: [c1, c2, c3, c4, c5, c6]   newly_passing=[]   (baseline; PRIMARY BLOCKER: toast.css.dsp never injected into zk.wcs — CSS only loads when zkmax Toast widget JS renders; measured via manual inline injection; c1/c2/c3/c4/c5/c6 component-rooted — all visual CSS on .z-toast-content not .z-toast wrapper; c5 uses --zk-shape-card(6px) vs expected 4px; c6 uses elevation-2 not elevation-3; c3 is 46px not 48px; c7 PASS — 13px font-size correct)
iter 2: [c1, c2, c3, c4, c5, c6]   newly_passing=[]   (PRIMARY BLOCKER resolved — toast.css now in normFiles/norm.css.dsp; c3=48px/c5=4px/c6=elevation-3 FIXED on .z-toast-content; bundle checks still FAIL because spec targets .z-toast wrapper which is a transparent shell; c1/c2/c4 also differ in value on .z-toast-content; architectural mismatch needs bundle update or wrapper duplication)
iter 3: []                          newly_passing=[c1,c2,c3,c4,c5,c6]   → VERIFIED   (Generator iter-3 fixed bg=rgba(50,50,50,0.95), color=white, padding=8px 16px, border-radius=4px, box-shadow=elevation-3; all 7 checks PASS on .z-toast-content)

### progressmeter
iter 1: []                newly_passing=[]   (baseline; all 6 checks PASS; fill bar is .z-progressmeter-image not .z-progressmeter-bar; track uses --zk-color-primary-container which is correct MD3 linear progress token)   → VERIFIED

### groupbox
iter 1: []                newly_passing=[]   (baseline; all 7 checks PASS — border/radius/padding/bg/font all token-correct; DOM uses .z-caption-content for title text not .z-groupbox-title)   → VERIFIED

### combobutton
iter 1: []                newly_passing=[]   (baseline; all 8 checks PASS — display:inline-flex, height:36px, bg:rgb(55,111,208)=#376fd0, color:white, padding-left:16px, arrow:36px, border-left:1px solid rgba(255,255,255,0.3), border-radius:4px; DOM uses .z-combobutton-content not -btn)   → VERIFIED

### toolbarbutton
iter 1: [c1]              newly_passing=[]   (baseline; c1 component-rooted — color uses --zk-color-on-surface-variant rgba(0,0,0,0.6) instead of --zk-color-primary #376fd0; DOM is <a class="z-toolbarbutton">; measured via toolbar-vertical.zul; c2-c7 PASS)
iter 2: []                newly_passing=[c1]   → VERIFIED
iter 3: []                newly_passing=[]   → VERIFIED   (RE_EVAL after loadingbar.css added to footer.css.dsp; 11 .z-loadingbar* rules confirmed present and isolated; no .z-toolbarbutton selector overlap; no regressions)

### splitter
iter 1: [c1, c2, c3, c4, c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: splitter.css.dsp never served — ZK lang.xml has no css-uri for splitter component; CSS must be merged into box.css (box.css.dsp served via hbox/vbox css-uri); all 5 failures component-rooted — tokens resolve correctly and all checks pass when CSS injected manually)
iter 2: []    newly_passing=[c1,c2,c3,c4,c5]   → VERIFIED
contract revised (2026-06-04): splitter-family unification (user ruling) — T2 contract enriched to DESIGN.md §14 canonical spec (8px surface-container bar, primary hover/pressed tints, 8×28 outline-variant pill, 8px grips, caret fade-in, JS-centering rule); status → NEEDS_FIX awaiting contract re-approval; see doc/skill-gaps.md 2026-06-04
iter 3: []    newly_passing=[c1,c2,c2b,c3,c3b,c4,c5h,c5v,c6,c6v,c7,c8,c8b,c9h,c9c,c10,c10b,c10c,c11,c11t,c11h,c12,c13,cen-h,cen-v,cen-robust-h,cen-robust-v]   → GATE2_PENDING   (re-eval post contract re-approval 2026-06-04; full DESIGN.md §14 spec confirmed: bar 8px surface-container ✓, hover/active color-mix rules ✓, pill 8×28 outline-variant ✓, border-radius 9999px ✓, grip icons 8px on-surface-variant opacity:1 ✓, caret opacity:0 at rest / 1 on pill hover ✓, nosplitter cursor:default CSS rule ✓, ghost primary 0.3 ✓; centering both orientations 0px diff ✓; robustness: setBtnPos_ re-invocation stable — bar dims CSS-fixed, timing trap N/A; no layout regressions; hbox/vbox siblings unaffected)
iter 4: []    newly_passing=[c14-nosplitter-hover]   → VERIFIED   (micro delta re-eval 2026-06-04; Gate-2 finding S1 encoded as new contract row c14-nosplitter-hover; CSS rule .z-splitter-nosplitter:hover,.z-splitter-nosplitter:active{background-color:var(--zk-color-surface-container)} confirmed present + live computed=rgb(240,244,250) — no primary tint; normal hover color-mix rule still present (no regression); dual-gate complete: Gate1 25/25 PASS + Gate2 PASS 2026-06-04 critical=0)

### bandpopup
iter 1: [c1, c2, c3, c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: bandpopup.css.dsp never served — ZK lang.xml has no <css> declaration for bandpopup component; rules must move to inp/css/bandbox.css (combo.css.dsp); c5 SKIPPED — .z-bandpopup-content element absent from DOM, ZK renders content directly in .z-bandpopup with no -content wrapper; all 4 failures component-rooted — tokens resolve correctly when CSS injected manually)
iter 2: []                  newly_passing=[c1,c2,c3,c4]   → VERIFIED

### messagebox
iter 1: [c6]               newly_passing=[]   (baseline; c6 component-rooted — footer horizontal padding 16px vs viewport 24px; CSS uses --zk-spacing-4 not --zk-spacing-6 for horizontal; c1/c2/c3/c4/c5 PASS — c2 passes per DESIGN.md §5 4px dialog radius; c4 passes via header inheritance even though .z-caption-text selector unreachable)
iter 2: []                 newly_passing=[c6]   → VERIFIED

### loadingbar
iter 1: [c1, c2, c3, c4, c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: loadingbar.css.dsp never injected into zk.wcs — no <css> entry in lang.xml for Loadingbar widget; all 5 failures component-rooted — CSS rules are correct and all checks PASS when CSS injected manually; same pattern as splitter/bandpopup/toast/notification; fix: merge loadingbar.css into footer.css.dsp or register in lang-addon.xml)
iter 2: []                      newly_passing=[c1,c2,c3,c4,c5]   (CSS injection fix confirmed — loadingbar.css now bundled into footer.css.dsp; all 11 .z-loadingbar* rules load; height=3px, bg=rgb(214,228,255)=#d6e4ff=primary-container, colorbar-bg=rgb(55,111,208)=#376fd0=primary, position=fixed on .z-loadingbar-position wrapper, width=100%; all 5 checks PASS)   → VERIFIED

### errorbox
iter 1: [c1, c2, c3, c4, c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: errorbox.css.dsp never served — Errorbox is JS-only widget extending Notification with no lang.xml css-uri; rules must be merged into inp/css/input.css (input.css.dsp, served via all textbox/input css-uri declarations); when CSS injected manually all checks PASS — tokens resolve correctly; no CSS authoring errors)
iter 2: []    newly_passing=[c1,c2,c3,c4,c5]   → VERIFIED

### tab
iter 1: [c1]              newly_passing=[]   (baseline; c1 component-rooted — padding 12px 16px on .z-tab not .z-tab-content; same root cause as tabbox c1; will be fixed by tabbox Generator pass; c2-c7 all PASS)
iter 2: []                newly_passing=[c1]   → VERIFIED
iter 3: []                newly_passing=[]   → VERIFIED   (RE_EVAL after tabpanel Generator; no regressions)
iter 4: []                newly_passing=[]   → VERIFIED   (RE_EVAL after tabbox Generator iter 7; no regressions; all 7 contracted checks PASS)
### tabpanel
iter 1: [c1, c2, c3, c4]  newly_passing=[]   (baseline; all 4 checks fail — no tabpanel CSS authored yet; c1 component-rooted — padding 12px 16px instead of 16px; c2 component-rooted — bg transparent instead of surface white; c3 component-rooted — no min-height set (0px); c4 component-rooted — .z-tabpanels has no border; tokens all resolve correctly)
iter 2: [c1, c2, c3, c4]  newly_passing=[]   (tabpanel Generator not yet dispatched; not a stall)
iter 3: []                newly_passing=[c1,c2,c3,c4]   → VERIFIED
iter 5 (RE_EVAL — tabbox iter 7): []   newly_passing=[]   → VERIFIED   (sibling regression check; all 4 checks PASS; no regressions from tabbox Generator iter 7; ZK removes inactive panels from DOM — active panel display=block height=80px confirmed)

### captcha
iter 1: [c3]              newly_passing=[]   (baseline; c1/c2 PASS — display:block + border-radius:0px are browser defaults on the <img> element; c3 FAIL — captcha.css source file does not exist, 0 .z-captcha rules in zk.wcs; likely same CSS injection blocker as splitter/bandpopup/loadingbar/errorbox — need lang-addon.xml <css> entry + new captcha.css file)
iter 2: []                newly_passing=[c3]   (captcha.css created + added to normFiles; ruleCount=1; display=block, border-radius=4px, border=1px solid rgba(0,0,0,0.12); all 3 checks PASS)   → VERIFIED

### pdfviewer
iter 1: [c2, c3]          newly_passing=[]   (baseline; c1 PASS — display:block browser default; c2 FAIL component-rooted — no background/border/visual wrapper styling; c3 FAIL component-rooted — pdfviewer.css.dsp is a 0-byte empty stub, no source CSS file exists under src/; build-css.js stubPaths hardcodes this path; Generator must create CSS source AND move path from stubPaths to regular build scan)
iter 2: []                newly_passing=[c2, c3]   (Generator created pdfviewer.css + zkex auto-scan in build-css.js; 1 rule loaded in zk.wcs: bg=rgb(247,249,252)=surface-container-low, border=1px solid rgba(0,0,0,0.12)=outline-variant, borderRadius=8px=shape-corner-small, overflow=hidden; all 3 checks PASS)   → VERIFIED (old 3-check contract only)
iter 3: [c2,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,c21,c22,c23,lr-1,lr-2,lr-3,lr-4,lr-5,lr-6,lr-7]   newly_passing=[]   (RE-EVAL with expanded 23-check contract; pdfviewer.css still contains only the single iter-2 root rule; 21 spec checks fail + 7 layout regressions; c1/c3 still PASS; c2 wrong token (shape-corner-small vs corner-medium), c4 wrong token (surface-container-low vs surface); c5–c23 all missing rules; layout broken: root not flex-column/not positioned, toolbar in normal flow at offsetTop=1033 outside root, text-layer position=static, buttons not square 33×21px; all failures component-rooted — all tokens resolve correctly)
iter 4: []   newly_passing=[c2,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,c21,c22,c23,lr-1,lr-2,lr-3,lr-4,lr-5,lr-6,lr-7]   → VERIFIED   (Generator full rewrite of pdfviewer.css confirmed; 20 rules in zk.wcs; c2 border-radius=12px=corner-medium ✓; c4 bg=rgb(255,255,255)=surface ✓; c5 container bg=#f0f4fa=surface-variant ✓; c6 page box-shadow=elevation-2 ✓; c7 toolbar bg=#e8eef7=surface-container-high ✓; c8 toolbar radius=9999px=corner-full ✓; c9 toolbar opacity=0 ✓; c10/c11/c12 hover/focus-within opacity rules confirmed in CSSOM ✓; c13 padding=8px 12px ✓; c14 shadow=elevation-3 ✓; c15 btn radius=8px=corner-small ✓; c16 btn color=rgba(0,0,0,0.87) ✓; c17 btn bg=transparent ✓; c18 hover color-mix alpha=6.96% ✓; c19 press color-mix alpha=10.44% ✓; c20 disabled=rgba(0,0,0,0.38) ✓; c21 separator border-left=1px solid rgba(0,0,0,0.12) ✓; c22 fullscreen border-radius:0 in CSSOM ✓; c23 text-layer opacity=0.2 ✓; lr-1 no child overflow ✓; lr-2 container overflow:auto expected ✓; lr-3 toolbar position:absolute ✓; lr-4 root flex-column ✓; lr-5 root position:relative ✓; lr-6 text-layer position:absolute top:0 left:0 ✓; lr-7 all buttons 36×36px ✓)

### goldenlayout
iter 1: [c2, c3]          newly_passing=[]   (baseline; c1 PASS — transparent is acceptable per bundle; c4 PASS — height=500px set inline, min-height:0px not a defect; c2 FAIL component-rooted — border-radius 0px vs 6px, no CSS source file exists; c3 FAIL component-rooted — box-shadow none, no CSS source file; PRIMARY BLOCKER: src/main/resources/web/js/zkmax/layout/css/ directory does not exist; zero .z-goldenlayout rules loaded; Generator must create dir + goldenlayout.css + verify build-css.js scan covers zkmax path + lang-addon.xml css entry)
iter 2: [c2, c3]          newly_passing=[]   (Generator created goldenlayout.css at wrong path js/zkmax/layout/css/; ZK zkmax jar serves CSS from js/zkmax/goldenlayout/css/goldenlayout.css.dsp — confirmed from jar inspection; that path remains a 0-byte stub in build-css.js stubPaths; PATH FIX REQUIRED: move source to src/main/resources/web/js/zkmax/goldenlayout/css/goldenlayout.css and remove path from stubPaths)
iter 3: []                newly_passing=[c2, c3]   (Generator moved CSS to correct path js/zkmax/goldenlayout/css/goldenlayout.css and removed stubPaths entry; 1 rule loads; border-radius=6px via --zk-shape-card, box-shadow=rgba(0,0,0,0.08) 0px 1px 3px via --zk-elevation-card; all 4 checks PASS)   → VERIFIED

### signature
iter 1: [c1,c2,c3,c4,c5,c6]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS file exists at src/main/resources/web/js/zkmax/wgt/css/signature.css; only zk.wcs + pv.css load on page — zero .z-signature rules in any stylesheet; all 6 failures component-rooted — tokens resolve correctly (--zk-color-outline=rgba(0,0,0,0.23), --zk-color-surface=#ffffff, --zk-color-primary=#376fd0); c7 SKIPPED — no disabled element in preview; Generator must create signature.css AND register it in lang-addon.xml or merge into existing served .css.dsp)
iter 2: [c1,c2,c3,c4,c5,c6]   newly_passing=[]   → STALLED   (Generator placed CSS at js/zkmax/wgt/css/signature.css but ZK loads js/zkmax/signature/css/signature.css.dsp per zkmax lang-addon.xml; correct path is src/main/resources/web/js/zkmax/signature/css/signature.css; CSS content is correct — manual injection verifies all values pass; only wrong delivery path must be fixed)
iter 3: []                     newly_passing=[c1,c2,c3,c4,c5,c6]   → VERIFIED   (Generator moved CSS to correct path js/zkmax/signature/css/signature.css and removed stubPaths entry; 3 .z-signature rules now load; border=1px solid rgba(0,0,0,0.23), border-radius=4px, bg=rgb(255,255,255), transition=border-color 0.25s cubic-bezier(0.4,0,0.2,1), focus-within border-color=var(--zk-color-primary)/2px; all 6 checks PASS; c7 SKIPPED — no disabled element)
iter 4: [r1,r3,r5,tb1-tb7,tb-hide,btn1-btn15,btn-hover1,btn-hover2,btn-focus1,btn-focus2,btn-active1,icon1,icon2,lbl1,dis2,lr-1,lr-5]   newly_passing=[]   (RE_EVAL triggered by contract+skill expansion; previous 3-rule CSS only covered root wrapper; new contract adds toolbar/button/icon/label/state checks; all 37 new checks fail — component-rooted, missing CSS rules; existing r2/r4/r6/r7/dis1 still PASS; tokens all resolve correctly)
iter 5: [btn11,lr-1]   newly_passing=[r1,r3,r5,tb1-tb7,tb-hide,btn1,btn2,btn3,btn4,btn5,btn6,btn7,btn8,btn9,btn10,btn12,btn13,btn14,btn15,btn-hover1,btn-hover2,btn-focus1,btn-focus2,btn-active1,icon1,icon2,lbl1,dis2]   (Generator added full toolbar/button/state/icon/label rules; 35 checks now PASS; 2 remain: btn11=TOKEN_FIX_REQUIRED(--zk-font-weight-medium not defined in theme tokens → resolves to 400 not 500); lr-1=canvas elements position:static → second canvas overflows root; iceblue theme styles .z-signature-canvas with position:absolute — Generator must add canvas positioning rule)
iter 6: []   newly_passing=[btn11,lr-1]   → VERIFIED   (btn11: CSS rule changed to var(--zk-typescale-label-medium-weight) which resolves to 500 — font-weight now 500 ✓; lr-1: .z-signature-canvas{position:absolute;top:0;left:0;width:100%;height:100%} added — both canvases fill root exactly (598×198=clientW×clientH), offsetTop=0 for both, no stacking regression; all 44 spec checks PASS; layout regression sweep: children-fit ✓, toolbar containment ✓, z-order toolbar(1)>canvas(0) ✓, button gaps 8px ✓, no hidden-but-occupying elements ✓)

### radiogroup
iter 1: [c5]              newly_passing=[]   (baseline; c5 component-rooted — .z-radio-content font-size is 13px vs bundle expected 14px; c1/c2/c3/c4/c6 PASS; DOM has no .z-radio-mold/.z-radio-input — visual circle is input[type=radio] with appearance:none; disabled uses .z-radio-disabled class not [disabled] attribute)
iter 2: []                newly_passing=[c5]   (c5 fixed — .z-radio-content font-size now 14px; all 6 checks PASS)   → VERIFIED

### cascader
iter 1: [c3]              newly_passing=[]   (baseline; c3 component-rooted — bundle selector .z-cascader-input absent from DOM; actual text element is .z-cascader-label at 13px; expected 14px; c1/c2/c4/c5/c6/c7 PASS)
iter 2: []                newly_passing=[c3]   (Generator changed font-size token from --zk-typescale-body-medium-size(13px) to --zk-typescale-label-large-size(14px) on .z-cascader-label,.z-cascader-placeholder; label now reads 14px; all 7 checks PASS)   → VERIFIED (legacy 7-check contract)
iter 3: [c15, c16, lr-1]  newly_passing=[]   (fresh baseline against re-authored 26-check contract; c15/c16 component-rooted — popup CSS rules scoped as `.z-cascader .z-cascader-popup` — lost when ZK detaches popup to body; lr-1 component-rooted — `position: absolute` missing on `.z-cascader-popup`, popup renders in normal flow at full body width; c1-c14, c17-c25, c8b all PASS; M1-M6 PASS; fix: add unscoped `.z-cascader-popup { position: absolute; background-color: ...; border: ...; border-radius: ... }` + keep scoped display:none rule)
iter 4: []                newly_passing=[c15, c16, lr-1]   → GATE2_PENDING   (Generator split confirmed: unscoped `.z-cascader-popup { position:absolute; bg:surface; border:1px solid outline-variant; border-radius:4px; overflow:hidden; white-space:nowrap }` + scoped `.z-cascader .z-cascader-popup { display:none }`; detached popup now position:absolute, rect top=372px=trigger bottom, width=200px=trigger width; border=1px solid rgba(0,0,0,0.12), radius=4px both confirmed on live detached popup; all 26 rows PASS, M1-M6 PASS, 0 layout regressions; popup visually correct — anchored below trigger, two caves side-by-side, selected items in primary blue)
iter 5: []                newly_passing=[]   → GATE2_PENDING   (artefact re-capture only; fresh Chrome tab confirmed ZK page content before capture; page.gif=1-frame 1568×756 rest-state 4 variants; popup-open.gif=1-frame 1568×710 Japan/Kyoto popup open 2 caves + selected items in primary blue; no CSS changes, no regressions; AI visual review: 0 findings)
gate 2 (2026-06-05): GATE2: PASS critical=0 suggested=1 (M1–M6 all visually confirmed; suggested: .z-cascader-label/.z-cascader-placeholder omit font-weight var(--zk-typescale-label-large-weight)=500, renders at 400 — optional follow-up, does not block)   → VERIFIED (dual-gate)
iter 6: [c26, M7] → []    newly_passing=[c26, M7]   → VERIFIED   (user-reported gap, skill-feedback-loop run: expand caret floated after item text — drifted 53.7px with label length (icon rights 266/276.8/319.7 pre-fix). Root cause: dead `.z-cascader-item > label {flex:1}` rule (item text is a BARE TEXT NODE per Cascader.ts _renderItems0 — no wrapper element) + mockup-only `margin-left:auto` never had a contract row (same blind spot as slider knob-input). Encoded failing-first: c26 (margin-left:auto) + M7 (equal icon bbox.right ±1px per cave). Fix: dead rule removed, icon margin-left:auto + item gap spacing-2 per approved mockup. Post-fix probe: icon rights 355/355/355 (spread 0), = cave right 367 − 12px padding; visual zoom confirms aligned trailing caret column. Measurement note: computed margin-left resolves auto→used px on flex items — check declared value or M7. Gap logged in doc/skill-gaps.md; skill bare-text-node section added)

### chosenbox
iter 1: []                newly_passing=[]   (baseline; all 7 checks PASS — border/radius/min-height/chip-bg/chip-radius/input-font/disabled-opacity all correct; DOM uses .z-chosenbox-item not .z-chosenbox-tag; disabled via .z-chosenbox-disabled class; c6 bundle says 14px but DESIGN.md §7 says 13px — DESIGN.md wins; 27 rules loaded)   → VERIFIED

### colorbox
iter 1: [c1,c2,c3,c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS file exists at src/main/resources/web/js/zkex/inp/css/colorbox.css; zero .z-colorbox rules in any stylesheet; all 4 failures component-rooted — tokens resolve correctly; disabled state uses .z-colorbox-disabled class not [disabled] attribute; Generator must create colorbox.css AND ensure delivery via build scan or lang-addon.xml)
iter 2: []               newly_passing=[c1,c2,c3,c4]   (CSS blocker resolved — 5 .z-colorbox* rules now load in zk.wcs; border=1px solid rgba(0,0,0,0.23), border-radius=4px, height=36px, disabled opacity=0.38; all 4 checks PASS)   → VERIFIED

### rangeslider
iter 1: [c1,c2,c3,c4,c5,c6]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkex/slider/css/rangeslider.css — both rangeslider.css.dsp and sliderbuttons.css.dsp are empty stubs in build-css.js stubPaths; zero rules load; bundle selectors stale — actual DOM uses .z-rangeslider-track not .z-rangeslider-center, .z-sliderbuttons-area not .z-rangeslider-area, .z-sliderbuttons-button not .z-rangeslider-button; all 6 failures component-rooted; --zk-color-primary=#376fd0 resolves correctly; all --zk-rangeslider-* tokens NOT SET)
iter 2: [c1,c2]                newly_passing=[c3,c4,c5,c6]   (rangeslider.css created with :root token definitions; sliderbuttons rules from multislider.css (global unscoped) apply to rangeslider DOM fixing c3/c4/c5/c6; c1/c2 still FAIL — .z-rangeslider-track has no height/bg rule; rangeslider.css only delivers :root tokens, no structural track rules; Generator must add .z-rangeslider-inner + .z-rangeslider-track rules consuming --zk-rangeslider-inner-size/--zk-rangeslider-track-color)
iter 3: []                     newly_passing=[c1,c2]   → VERIFIED   (Generator added .z-rangeslider-inner,.z-rangeslider-center + .z-rangeslider-track structural rules; 2 rangeslider rules now load; track height=4px, track bg=rgba(0,0,0,0.12); all 6 checks PASS)

### multislider
iter 1: [c1,c2,c3,c4,c5,c6]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS file at src/main/resources/web/js/zkmax/slider/css/multislider.css — directory does not exist; zero .z-multislider* or .z-sliderbuttons* rules loaded; bundle selectors stale — actual DOM uses .z-multislider-track (not -center), .z-sliderbuttons-area (not .z-multislider-area), .z-sliderbuttons-button (not .z-multislider-button); all 6 failures component-rooted; tokens resolve correctly)
iter 2: []                     newly_passing=[c1,c2,c3,c4,c5,c6]   → VERIFIED   (Generator created multislider.css with correct selectors; 21 rules load; track height=4px, track bg=rgba(0,0,0,0.12), area bg=rgb(55,111,208), button 20x20px, button bg=rgb(55,111,208), button border-radius=50%; all 6 checks PASS)

### searchbox
iter 1: [c1,c2,c3,c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS file exists at src/main/resources/web/js/zkmax/inp/css/searchbox.css; zero .z-searchbox rules in any stylesheet; all 4 failures component-rooted — tokens resolve correctly (--zk-color-outline=rgba(0,0,0,0.23), --zk-shape-corner-extra-small=4px, --zk-typescale-body-medium-size=13px); bundle selector .z-searchbox-input absent from DOM — actual input is .z-searchbox-search; disabled uses .z-searchbox-disabled class not [disabled] attr)
iter 2: []               newly_passing=[c1,c2,c3,c4]   → VERIFIED   (Generator created searchbox.css; 6 rules load; border=1px solid rgba(0,0,0,0.23), border-radius=4px, font-size=13px on .z-searchbox-search, disabled opacity=0.38 on .z-searchbox-disabled; all 4 checks PASS)

### biglistbox
iter 1: [c1,c3,c4,c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS file at src/main/resources/web/js/zkmax/big/css/biglistbox.css; zero .z-biglistbox* rules loaded; all 4 failures component-rooted; c2 PASS — transparent header bg is acceptable; c4 stale selector — bundle says .z-biglistbox-cell but actual cells are bare <td> elements with no class; tokens blocked by security filter but same theme context as other PASS components)
iter 2: []               newly_passing=[c1,c3,c4,c5]   → VERIFIED   (CSS blocker resolved — 4 .z-biglistbox* rules now load; border=1px solid rgba(0,0,0,0.12), header bg=transparent, header border-bottom=1px solid rgba(0,0,0,0.12), row td padding=8px 16px, hover bg=rgba(0,0,0,0.04); Generator correctly targeted .z-biglistbox-row td instead of stale .z-biglistbox-cell; all 5 checks PASS)

### a
iter 1: [c4]              newly_passing=[]   (baseline; c4 component-rooted — disabled state uses color:rgba(0,0,0,0.38) text color change instead of opacity:0.38; .z-a[disabled] rule has no opacity declaration; c1/c2/c3/c5 PASS)
iter 2: []                newly_passing=[c4]   → VERIFIED   (Generator added opacity:var(--zk-state-disabled-opacity) to .z-a[disabled],.z-a.z-a-disabled rule; computed opacity=0.38; all 5 checks PASS)

### organigram
iter 1: [c1,c2,c3,c4,c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/layout/css/organigram.css — directory exists but is empty; js/zkmax/layout/css/organigram.css.dsp is a stub in build-css.js stubPaths; zero organigram CSS rules load; all 5 failures component-rooted — tokens resolve correctly; DOM note: .z-orgitem-header absent, actual inner node is .z-orgnode; Generator must create organigram.css + remove from stubPaths)
iter 2: []                  newly_passing=[c1,c2,c3,c4,c5]   → VERIFIED   (Generator created organigram.css + removed stubPaths entry; 3 rules now load; border=1px solid rgba(0,0,0,0.12), border-radius=6px, bg=rgb(255,255,255), .z-orgnode bg=rgb(55,111,208)=primary, box-shadow=elevation-1; all 5 checks PASS; .z-orgitem-header absent from DOM — .z-orgnode correctly targeted for header styling)
iter 3: BLOCKED             newly_passing=[]   (js-source drift — contract hash 6604d5a4… does not match recomputed hash be8916ee… for Organigram.ts/Orgchildren.ts/Orgitem.ts/Orgnode.ts; measurement refused per §0b; re-run zk-spec-author organigram to refresh contract)
iter 4: [root-2,root-4,gen-1,gen-2,gen-3,item-1,item-2,item-3,item-4,item-5,bus-1..10,drop-down-1..6,drop-out-1..6,node-1,node-2,node-3,node-4,node-5,node-6,node-8,node-9,node-10,node-11,node-12,node-15,node-17,hover-1,hover-2,focus-1,focus-2,selected-1,selected-2,selected-3,disabled-1,disabled-2,disabled-3,nonsel-1,close-1,close-2,icon-1,icon-2,icon-3,icon-6,icon-7,icon-8,icon-9,icon-10,icon-11,icon-12,icon-13,lr-1]   newly_passing=[]   (first real measurement — 69 of 75 checks fail; CSS is a 3-rule stub that misapplies card chrome to .z-orgitem instead of .z-orgnode, uses primary blue fill instead of surface white, lacks all flex/connector/state/icon rules; 6 PASS: root-1,root-3,node-7,node-13,node-14,node-16,icon-4,icon-5; all failures component-rooted — tokens resolve correctly; ground-up rewrite required)
iter 5: []   newly_passing=[root-2,root-4,gen-1..3,item-1..5,bus-1..10,drop-down-1..6,drop-out-1..6,node-1..6/8..17,hover-1/2,focus-1/2,selected-1..3,disabled-1..3,nonsel-1,close-1/2,icon-1..13,lr-1]   → VERIFIED   (Generator full rewrite of organigram.css correct; all 75 checks PASS; node-3/icon-9 display:flex vs inline-flex is correct CSS spec block-ification behavior; selected bg/borderColor transition delay resolved by disable+reflow protocol; close-1 verified via DOM injection; layout regressions PASS per overflow:auto contract exception)

### timepicker
iter 1: [c1,c2,c3,c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/inp/css/timepicker.css; js/zkmax/inp/css/timepicker.css.dsp is a stub in build-css.js stubPaths; zero .z-timepicker rules load in zk.wcs; all 4 failures component-rooted — tokens resolve correctly; disabled state uses .z-timepicker-disabled class not [disabled] attr; c3 DESIGN.md conflict: bundle expects 14px but DESIGN.md §7 says 13px for inputs — Generator should use 13px)
iter 2: []               newly_passing=[c1,c2,c3,c4]   → VERIFIED   (Generator created timepicker.css + removed stubPaths entry; 3 rules now load; border=1px solid rgba(0,0,0,0.23), border-radius=4px, font-size=13px on .z-timepicker-input, disabled opacity=0.38 on .z-timepicker-disabled; all 4 checks PASS; DESIGN.md §7 13px authoritative for c3)
iter 3: BLOCKED          newly_passing=[]   (contract modernized from 4-check to 19-check (c1–c15 + M1–M4); Chrome extension not connected — screenshot post-condition cannot be satisfied; gates 0a/0b PASS (contract-approved=true, js-source-hash matches); server PASS HTTP 200; CSS currently only implements c1/c2/c3/c4 — c5–c15 and M1–M4 likely all FAIL; re-run after Chrome reconnect)
iter 4: [c5,c6,c7,c8,c9,c11,c12,c13,c14,c15,M2,M3,lr-1,lr-2]   newly_passing=[]   (first full measurement with Chrome; c1/c2/c3/c4/c10/M1/M4 PASS; 14 checks FAIL — timepicker.css only has 3 rules (border, font-size, disabled-opacity); missing: flex layout on root (inline-flex+align-items:center), hover/focus-within border rules, popup box-shadow/radius/bg/border, inplace bg-transparent+button-hidden, invalid border-color, readonly input bg; M2 FAIL all instances 18–23px height (no min-height/padding); M3 FAIL button right=94 vs root right=192 (diff=−98px, no right-anchor); layout regressions lr-1/lr-2: children overflow root, display:block/inline not flex; NOTE: .z-timepicker-invalid class is on INPUT not root — use :has() selector for c14; implementation should mirror timebox.css flex pattern)
iter 5: [lr-3]              newly_passing=[c5,c6,c7,c8,c9,c11,c12,c13,c14,c15,M2,M3,lr-1,lr-2]   (Generator rewrote timepicker.css with 22 rules — flex layout, hover/focus-within, popup props, inplace, invalid :has(), readonly, disabled; ALL c1–c15 + M1–M4 + lr-1/lr-2 now PASS; new FAIL lr-3: popup detaches to body with width:auto inline (ZK Timepicker._fixsz does not set pixel width unlike combobox) → popup renders at 1898px instead of ~160px trigger width; fix: add min-width: 160px (fixed pixel, NOT percentage) to .z-timepicker-popup per floating-popup-in-body.md rule)
iter 6: [lr-3]              newly_passing=[]   (RE_EVAL after Generator added min-width:160px; STALL — lr-3 still FAILS; min-width:160px is computed correctly but insufficient: ZK inlines width:auto on popup; block element with width:auto at body level resolves to ~1898px; min-width only sets lower bound, does not prevent wider width; c1–c15 + M1–M4 + lr-1/lr-2 all unchanged PASS; correct fix: width:max-content !important + min-width:160px + optional max-width:400px on .z-timepicker-popup)
iter 7: [c14]              newly_passing=[lr-3]   (lr-3 NOW PASSES — width:max-content !important overrides ZK inline width:auto; popup=160px content-sized; NEW FAIL c14: invalid border-color never fires — CSS uses .z-timepicker:has(.z-timepicker-invalid) but ZK places class on ROOT span, not a descendant; :has() requires descendant match; laboratory test confirmed: adding invalid to root → border stays outline color; adding to child input → error color fires, BUT ZK never adds to child; fix: use .z-timepicker.z-timepicker-invalid {border-color:error} like timebox.css pattern; NOTE: iter-6 incorrectly reported c14 PASS by testing :has() with class on INPUT child, which worked but is not ZK's actual behavior)
iter 8: []                 newly_passing=[c14]   → GATE2_PENDING   (c14 NOW PASSES — Generator replaced .z-timepicker:has(.z-timepicker-invalid) with compound .z-timepicker.z-timepicker-invalid on root; confirmed: adding invalid class to root span → rgb(211,47,47)=--zk-color-error; all 3 invalid variants fire (base, :hover, :focus-within); no :has() rules remain in CSSOM; all other 14 checks unchanged PASS (c1–c13/c15); M1–M4 PASS; lr-1/lr-2/lr-3 PASS; row-coverage 22/22; ai-findings: total=0)
iter 9: [NO-ASSERTION:buttonVisible-false]   newly_passing=[]   → NEEDS_FIX   (contract defect: States-to-evaluate entry buttonVisible-false has no Expected-values row and no preview ZUL instance; all c1–c15+M1–M4+lr-1/2/3 PASS; c14 confirmed: CSS reverted to :has() + transition:none approach (iter-8 compound-root claim was wrong); :has() fires correctly when .z-timepicker-invalid added to INPUT child → rgb(211,47,47); resolution: add c16 row to contract + buttonVisible=false instance to ZUL, OR remove checklist entry)
iter 11: [popup-position]   newly_passing=[c16,c17]   (USER-REPORTED regression: popup rendered at viewport bottom-left. Root cause: .z-timepicker-popup never declared `position` → computed `static` → ZK's inline left/top inert → popup fell to body flow. The lr-3 `width:max-content !important` had masked it. Fix: aligned popup to combobox dropdown — position:absolute; z-index:1600; margin:4px 0 0 0; --zk-shape-menu; --zk-elevation-dropdown; border:none; removed the width hack (under position:absolute, ZK inline width:auto shrink-fits). Live-verified synthetic: position=absolute, z-index=1600, radius=4px, no border, shadow present. Causality verified: a synthetic open made ZK write inline left:33px/top:213px on the popup = trigger-anchored (trigger x=32, bottom=218) — honored only because the box is now positioned. Skill-feedback-loop applied: gap logged (doc/skill-gaps.md), failing assertions added (c16/c17), skill `reference/floating-popup-in-body.md` extended with the position:absolute corollary. Sibling sweep: timepicker was the only detached popup whose base rule lacked `position`.)
iter 12: [corner-bleed, focus-growth]   newly_passing=[c5(retoken),c5b,c5c,c18,M5,M6]   (TWO USER-REPORTED bugs. (1) Left top/bottom corner border "missing": Timepicker is always-readonly (constructor) → input always has opaque surface-container bg; root had `overflow:visible` + 4px radius so the square-cornered opaque input bled past the left rounded corner. Fix: `overflow:hidden` on root (c18/M6). (2) Focus border grew the field 36→38px: `border-width:1px→2px` shrank the border-box content area but the min-height-pinned input/button forced the root taller. Fix: keep border 1px, render the ring as `box-shadow: inset 0 0 0 1px primary` (c5 retoken from border-2px; c5b border-color primary; c5c border-width stays 1px; M5 rest-H==focus-H). Live-verified (transition disabled to read focus target): overflow=hidden, focus border-top-width=1px, border-color=rgb(55,111,208)=primary, box-shadow=inset 0 0 0 1px primary, rest-H 36 == focus-H 36 (was 38). FAMILY SWEEP (focus-growth is family-wide): datebox 40→40 (was 42), spinner 43→43, timebox+bandbox same edit; bandbox standardized from outset ring to inset; combobox confirmed safe & left unchanged (borderless root + children min-height==root → 40→40/160→160). Skill-feedback-loop: gaps logged; failing assertions encoded first (c5/c5b/c5c/c18 + M5/M6); NEW reference `reference/focus-affordance-no-layout-shift.md` + `components/timepicker.md` overflow/focus notes + SKILL.md index. NOTE: contract c5 mechanism changed (no longer a 2px border) — still contract-approved; the visual focus ring is unchanged, only the no-layout-shift mechanism differs.)
iter 13: [focus-ring-asymmetry]   newly_passing=[c5(re-point to ::after),c5d]   (USER-REPORTED: on focus the ring looked thicker around .z-timepicker-button than around .z-timepicker-input. Root cause: iter-12's `box-shadow: inset 0 0 0 1px primary` lived on the ROOT; an inset shadow paints BELOW children, and the always-readonly input has an opaque surface-container bg that occluded the ring on the input side while the transparent button let it show → asymmetric. (The 1px border is symmetric; only the inset 2nd pixel was covered.) Fix: moved the ring to an always-present `.z-timepicker::after` overlay (transparent at rest; primary/error on focus), `position:absolute; inset:0; pointer-events:none; border-radius:inherit`, clipped to the rounded shape by the root's overflow:hidden; root keeps border-color:primary but box-shadow:none (c5d). Live-verified (pseudo-element transition disabled via injected `.z-timepicker::after{transition:none}` — el.style.transition doesn't reach ::after): root focus box-shadow=none, ::after focus box-shadow=inset 0 0 0 1px rgb(55,111,208)=primary, invalid::after=rgb(211,47,47)=error, border stays 1px primary, focus-H==rest-H (overlay is position:absolute → no layout shift). Single overlay above both children ⇒ ring uniform by construction. Skill-feedback-loop: gap logged; reference `focus-affordance-no-layout-shift.md` extended with the "opaque child occludes inset ring → use ::after overlay" caveat; contract c5 re-pointed + c5d added; components/timepicker.md focus note updated. Sibling sweep: datebox/timebox/bandbox/spinner have transparent inputs → root inset ring shows symmetrically, NOT affected, left on the inset-ring mechanism. NOTE: visual capture skipped (screenshot pipeline still broken); measurement + single-overlay construction are decisive.)

### navbar
iter 1: [c2,c3,c5,c6]   newly_passing=[]   (baseline; c2 component-rooted — nav item text uses body-medium 13px instead of 14px; c3 component-rooted — selected bg uses --zk-color-secondary-container #b2dfdb teal instead of rgba(55,111,208,0.12); c5 component-rooted — hover uses ::before state-layer pattern not direct background-color; c6 component-rooted — no .z-nav-header CSS rule; c1/c4 PASS; 29 nav rules load; .z-navitem-content is <a> tag)
iter 2: []               newly_passing=[c2,c3,c5,c6]   → VERIFIED   (c2 fixed — .z-nav-text/.z-navitem-text now 14px; c3 fixed — selected bg now rgba(55,111,208,0.12) via display-p3 equiv; c5 fixed — direct .z-navitem-content:hover{background-color:rgba(0,0,0,0.08)} rule added; c6 fixed — .z-nav-header{font-size:12px;font-weight:500;text-transform:uppercase} rule authored; 31 rules load; no DOM element for selected/nav-header in preview — verified via CSS rule + injected element)

### anchornav
iter 1: [c1,c2,c3,c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/nav/css/anchornav.css — zero .z-anchornav* rules load; bundle selectors .z-anchornav-item/.z-anchornav-item-active absent from DOM; actual structure: .z-anchornav → .z-anchornav-cave → .z-listbox → .z-listitem → .z-listcell → .z-a; active item would be .z-listitem-selected; all 4 failures component-rooted — tokens resolve correctly)
iter 2: []               newly_passing=[c1,c2,c3,c4]   → VERIFIED   (Generator created anchornav.css with 3 rules targeting actual DOM selectors; c1 font-size=14px via --zk-typescale-label-large-size; c2 color=rgba(0,0,0,0.6) via --zk-color-on-surface-variant measured directly; c3 rule .z-anchornav .z-listitem-selected .z-a{color:var(--zk-color-primary)} at specificity (0,3,0) correctly overrides (0,2,0) base rule — sandbox blocks injected-element token read but rule analytically correct; c4 border-left=3px solid rgb(55,111,208) measured on injected selected listitem)

### fisheyebar
iter 1: [c2]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkex/menu/css/fisheye.css — js/zkex/menu/css/fisheye.css.dsp is a 0-byte stub in build-css.js stubPaths; zero .z-fisheye* rules load; c1 PASS — transparent bg acceptable per bundle; c3 PASS — 13px font-size from browser defaults is in 12-14px range; c2 FAIL — bundle checks CSS transform but ZK fisheyebar magnification is JS-driven inline width/height resize; item grows 80px→160px on mousemove but transform property always reads none; c2 is likely CONSTRAINT — ZK platform uses JS not CSS transform for fisheye effect; DOM note: actual image class is .z-fisheye-image not .z-fisheye-img; Generator must create fisheye.css + remove from stubPaths for visual polish)
iter 2: []     newly_passing=[]   → CONSTRAINT   (RE_EVAL cleared; Generator created fisheye.css — 4 rules now load: fisheyebar flex layout, fisheye item flex+cursor+width/height transition, fisheye-image sizing+border-radius, fisheye-text 13px Inter font; c2 confirmed CONSTRAINT — ZK JS widget drives magnification via inline width/height on mousemove, CSS transform always none; visual effect IS present and smooth via CSS transition on width/height; c1/c3 still PASS)

### popup
iter 1: [c2]   newly_passing=[]   (baseline; c2 component-rooted — border-radius 6px via --zk-shape-card instead of 4px; DESIGN.md §5 specifies popup/dropdown = 4px = --zk-shape-corner-extra-small; c1/c3/c4 PASS — bg=rgb(255,255,255) correct, box-shadow=elevation-2/elevation-dropdown correct, border=1px solid rgba(0,0,0,0.12) correct per DESIGN.md §6 outline-variant)
iter 2: []     newly_passing=[c2]   → VERIFIED   (RE_EVAL cleared; Generator fixed border-radius from --zk-shape-card(6px) to --zk-shape-corner-extra-small(4px); all 4 checks PASS — bg=rgb(255,255,255), border-radius=4px, box-shadow=elevation-2, border=1px solid rgba(0,0,0,0.12))

### stepbar
iter 1: [c1,c2,c3,c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/wgt/css/stepbar.css; js/zkmax/wgt/css/stepbar.css.dsp is a 0-byte stub in build-css.js stubPaths; zero .z-step* rules load; bundle selectors stale — actual DOM uses .z-step-icon/.z-step-icon-empty (not .z-step-number) and .z-step-title (not .z-step-label); no .z-step-completed in preview so c5 SKIPPED; c6 PASS — 13px browser default is within 12-14px range; tokens resolve correctly: --zk-color-primary=rgb(55,111,208), --zk-color-disabled=rgba(0,0,0,0.38); all 4 measured failures are component-rooted)
iter 2: [c5]             newly_passing=[c1,c2,c3,c4]   (CSS delivery blocker resolved — 9 .z-step* rules now load; c1/c2/c3/c4 all PASS; c5 FAIL — selector name mismatch: authored CSS uses .z-step-completed but ZK emits .z-step-complete; completed icon has class z-icon-check not z-step-icon-empty; bg resolves to rgba(0,0,0,0) because the rule never matches; c6 PASS — 12px within 12-14px range)
iter 3: []               newly_passing=[c5]   → VERIFIED   (Generator fixed selector .z-step-completed → .z-step-complete; completed icon bg=rgb(55,111,208); all 6 checks PASS)
iter 4: BLOCKED          newly_passing=[]   (js-source drift — stored hash b09571285d7b559ed2be0d3045df17fa0c8179b667bb59c37dab6e5f9ed2aea9 does not match recomputed hash 6549c549e6302649c9f1305f836f45283fa3c640fdf4118d909f1f3b718df3d7 for Step.ts+Stepbar.ts; Stepbar.ts updated by commit 009fb2b6c "ZK-5597: vertical stepbar" after contract was authored; measurement refused per §0b; re-run zk-spec-author stepbar to refresh contract)

### caption
iter 1: [c1]   newly_passing=[]   (baseline; c1 component-rooted — .z-caption-content uses --zk-typescale-title-medium-size(16px) as base font-size; bundle expects 14px; DOM uses .z-caption-label not .z-caption-text; c2 PASS — rgba(0,0,0,0.87) matches --zk-color-on-surface; c3 PASS — .z-caption-image 16px within 16–20px range; 13 caption rules load; context overrides for groupbox/panel/window already present)
iter 2: []     newly_passing=[c1]   → VERIFIED   (Generator fixed base .z-caption-content rule to use --zk-typescale-label-large-size(14px); standalone injection confirms 14px; all 4 preview instances are in header context so computed=16px there — correct; c2/c3 unchanged PASS; all 3 checks PASS)

### borderlayout
iter 1: [c1]   newly_passing=[]   (baseline; c1 component-rooted — .z-borderlayout uses background-color:var(--zk-color-background)=rgb(247,249,252) instead of transparent or --zk-color-surface=#ffffff; bundle selector .z-borderlayout-splitter is stale — actual DOM uses .z-west-splitter/.z-east-splitter/.z-north-splitter/.z-south-splitter; c2 PASS — splitter bg=rgba(0,0,0,0.12) within acceptable outline range; c3 PASS — splitter width/height=8px within 4–8px range)
iter 2: []     newly_passing=[c1]   → VERIFIED   (Generator fixed background-color to transparent; computed=rgba(0,0,0,0); c2/c3 unchanged PASS; all 3 checks PASS)
iter 3: []     newly_passing=[]   → VERIFIED   (full 42-check + noborder contract evaluation; all c1–c42 PASS; js-source hash confirmed; icon coverage PASS (10 FA→Lucide aliases); layout regression sweep lr-1/lr-2/lr-3/lr-4/lr-8 all PASS; no regressions)
contract revised (2026-06-04): stale-contract reconciliation (user ruling: CSS wins) — c12/c13/c19–c22/c23/c26/c30b had drifted from the shipped pill CSS (contract said 6px bars + 20×64 elevated pills; CSS implemented 12px strips + 8×28 outline-variant pills); rows revised to the implemented pill design adjusted to the splitter-family 8px bar + family colors (DESIGN.md §14); c29b retired (no hover elevation); c30c added (caret fade-in, implemented but never contracted); status → NEEDS_FIX awaiting contract re-approval; see doc/skill-gaps.md 2026-06-04
iter 4: [c4,c6,c8,c10]   newly_passing=[c12,c13,c14,c17,c18,c19,c20,c21,c22,c23,c24,c25,c26,c27,c28,c29,c30,c30b,c30c,c31]   → NEEDS_FIX   (all revised rows PASS: bar 8px ✓, surface-container bg ✓, hover color-mix ✓, pill 8×28/28×8 ✓, outline-variant fill ✓, border:none/radius:9999px/shadow:none ✓, hover primary+on-primary ✓, grip opacity:1 at 8px ✓, caret opacity:0 idle / 1 hover ✓, disabled caret display:none all 4 dirs ✓; pill centering PASS both scenarios (cross-axis diff=0px west and north, Scenario 1 post-load + Scenario 2 post-resize); c4/c6/c8/c10 FAIL: CSS intentionally omits region edge borders (comment says tonal strip replaces them); no ::before hairline implemented; contract still asserts 1px solid outline-variant; action: Generator adds borders OR user approves contract retirement)
iter 5: []   newly_passing=[c4,c6,c8,c10]   → GATE2_PENDING   (Generator added four border rules: .z-north{border-bottom:1px solid var(--zk-color-outline-variant)}, .z-south{border-top}, .z-west{border-right}, .z-east{border-left}; plus per-region -noborder override classes; all four measured PASS: 1px solid rgba(0,0,0,0.12) on each edge; noborder overrides confirmed — ZK emits z-{region}-noborder class, CSS selectors match exactly, computed border=0px none on all five noborder elements; tiling check: regions tile perfectly (box-sizing:border-box absorbs 1px into region box, JS-positioned coords unchanged — north 60+8=68, west 366+8=374, center 1460+8=1468, south 340+60=400); pill centering unchanged: west diff=0px, north diff=0px; 0 ai-findings)
gate2 (2026-06-04): GATE2: PASS (critical=0, suggested=3) — doc/harness/design-reviews/borderlayout.md; color roles match MD3 surface hierarchy + MUI Drawer analog; §14 splitter family fully compliant; nosplitter family finding N/A (ZK display:none hides the strip when splittable=false); double-divider concern assessed non-issue (hairline on region box edge, strip a separate adjacent element); suggested: ghost !important fragility (advisory) → VERIFIED (dual-gate complete)

### imagemap
iter 1: []   newly_passing=[]   (baseline; all 2 checks PASS — display=block satisfies "inline-block or block"; border=none satisfies "no extra border"; 0 authored CSS rules — browser defaults are sufficient)

### scrollview
iter 1: []   newly_passing=[]   (baseline; all 2 checks PASS — overflow=auto satisfies "auto or hidden"; bg=rgba(0,0,0,0) is transparent; 0 authored .z-scrollview CSS rules — ZK JS sets overflow:auto, bg transparent by default)   → VERIFIED

### drawer
iter 1: [c1,c2,c3,c4,c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/wgt/css/drawer.css — js/zkmax/wgt/css/drawer.css.dsp is a 0-byte stub in build-css.js stubPaths; zero z-drawer CSS rules load; DOM note: .z-drawer root is a full-viewport-width positioning wrapper, .z-drawer-real is the actual visible panel; all 5 failures component-rooted — tokens resolve correctly; Generator must create drawer.css + remove from stubPaths)
iter 2: []                newly_passing=[c1,c2,c3,c4,c5]   → VERIFIED   (Generator created drawer.css + removed stubPaths entry; 11 rules now load; .z-drawer-real bg=rgb(255,255,255), box-shadow=elevation-3 dual-layer, .z-drawer-mask bg=rgba(0,0,0,0.32), .z-drawer-header padding=16px 24px + font-size=16px; all 5 checks PASS)
gap-fix (2026-06-08, skill-feedback-loop; user-reported on /drawer.zul): two gaps fixed → contract gained c6/c7/c8/c9 + outcome M1, skill drawer.md strengthened (mask-enabled gating + close-button anatomy), skill-gaps row logged. (1) MASK: scrim showed for mask="false" — rule keyed on `.z-drawer-open .z-drawer-mask` (modifier-blind); fixed to `.z-drawer-open .z-drawer-mask.z-drawer-mask-enabled`. Live re-verify: File-information mask opacity=1 (scrim shows), No-Mask mask opacity=0 (no scrim, no mask-enabled class) → c3/c6 PASS. (2) CLOSE BUTTON: `.z-drawer-close` had ZERO CSS (unstyled flow div); added window-icon-pattern rule (absolute top:12 right:16, 32×32, corner-full, on-surface-variant, hover surface-container). Live re-verify on closable=true drawer: 32×32 / position:absolute / radius 9999px / color rgba(0,0,0,.6) / 16px / glyph × renders at top-trailing corner (distFromRight=16, top=12, within header band) → c7/c8/c9/M1 PASS. Still VERIFIED.

### tbeditor
iter 1: [c1,c2,c3,c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/tbeditor/css/tbeditor.css; both js/zkmax/inp/css/tbeditor.css.dsp and js/zkmax/tbeditor/css/tbeditor.css.dsp are 0-byte stubs in build-css.js stubPaths; zero .z-tbeditor* rules load in zk.wcs; DOM note: .z-tbeditor-toolbar is stale — actual toolbar is .z-tbeditor-button-pane; .z-tbeditor-content absent — content area inside .z-tbeditor-box; all 4 failures component-rooted; tokens resolve correctly; Generator must create tbeditor.css at correct path js/zkmax/tbeditor/css/ + remove js/zkmax/tbeditor/css/tbeditor.css.dsp from stubPaths + remove redundant js/zkmax/inp/css/tbeditor.css.dsp stub)
iter 2: []               newly_passing=[c1,c2,c3,c4]   → VERIFIED   (Generator created tbeditor.css + removed stubPaths entries; 2 .z-tbeditor* rules now load; border=1px solid rgba(0,0,0,0.23), border-radius=4px on .z-tbeditor; .z-tbeditor-button-pane bg=rgb(240,244,250)=--zk-color-surface-variant, border-bottom=1px solid rgba(0,0,0,0.12); all 4 checks PASS)

### coachmark
iter 1: [c1,c2,c3,c4,c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/nav/css/coachmark.css — js/zkmax/nav/css/coachmark.css.dsp is a 0-byte stub in build-css.js stubPaths at line 86; bundle shared-css-file is wrong (lists wgt/css, actual path is nav/css); zero .z-coachmark* theme rules load; bundle selectors stale — .z-coachmark-title/.z-coachmark-body/.z-coachmark-button absent from DOM; real visual element is .z-coachmark-content; all 5 failures component-rooted — tokens resolve correctly: --zk-color-primary=#376fd0, --zk-color-surface=#ffffff, --zk-elevation-2 correct; Generator must create coachmark.css at nav/css path + remove from stubPaths + target .z-coachmark-content for bg/radius/shadow/padding/color)

iter 2: []                  newly_passing=[c1,c2,c3,c4,c5]   → VERIFIED   (Generator created coachmark.css at js/zkmax/nav/css/ + removed stubPaths entry; 1 rule loads: .z-coachmark-content{bg=rgb(55,111,208)=primary, color=rgb(255,255,255)=on-primary, border-radius=6px=--zk-shape-card, box-shadow=elevation-2, padding=16px=--zk-spacing-4}; c2 bundle expected 8-12px overridden by DESIGN.md §5: card=6px; all 5 checks PASS)

### cropper
iter 1: [c1,c2,c3,c4]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/cropper/css/cropper.css — directory does not exist; build-css.js has two stubs: js/zkmax/med/css/cropper.css.dsp (wrong path) + js/zkmax/cropper/css/cropper.css.dsp (correct path per zkmax jar); zero .z-cropper* rules in zk.wcs; DOM note: .z-cropper-canvas absent — actual canvas area is .z-cropper-holder; Jcrop library internals (.jcrop-dragbar, .jcrop-keymgr) confirmed present; all 4 failures component-rooted — tokens resolve correctly: --zk-color-surface=#ffffff, --zk-color-outline-variant=rgba(0,0,0,0.12); Generator must create cropper.css at correct path + remove js/zkmax/cropper/css/cropper.css.dsp from stubPaths + remove stale js/zkmax/med/css/cropper.css.dsp stub)
iter 2: []               newly_passing=[c1,c2,c3,c4]   → VERIFIED   (Generator created cropper.css + resolved stubPaths; 2 .z-cropper* rules now load; border=1px solid rgba(0,0,0,0.12), border-radius=4px, toolbar bg=rgb(255,255,255)=surface, toolbar border-top=1px solid rgba(0,0,0,0.12); all 4 checks PASS)
iter 3: [lr-1a,lr-1b,lr-3,lr-cropper-pos]   newly_passing=[c1,c2,c3,c4,c5]   (RE_EVAL post contract re-approval; c1–c5 all PASS — tokens correct; 4 layout regressions: missing position:relative on .z-cropper + missing position:absolute on .z-cropper-toolbar; toolbar renders in-flow below image; JS-set left/top silently ignored; lr-1a/lr-1b are downstream of position bugs; fix: add position:relative to .z-cropper + position:absolute to .z-cropper-toolbar in cropper.css)
iter 4: []   newly_passing=[lr-1a,lr-1b,lr-3,lr-cropper-pos]   → GATE2_PENDING   (all 4 layout regressions cleared by Generator iter-3 position fixes; .z-cropper position=relative ✓; .z-cropper-toolbar position=absolute ✓; toolbar JS-positioning now effective — inline left=51px/top=201px resolving correctly within positioned root; toolbar within root vertical bounds; all 5 D-tier rows still PASS; ai-findings: 0)
iter 5: [M3]   newly_passing=[]   → NEEDS_FIX   (first run of outcome rows M1–M6 added 2026-06-05; c1–c5 all PASS unchanged; M1 PASS: Jcrop holder img 300×400px inside root; M2 PASS: holder bg-img opacity=0.6 dimmed, interior img opacity=1 full-brightness; M3 FAIL: all 8 .z-cropper-handle elements have width=0/height=0 — theme CSS provides no size/position rules for handles (forbidden-selectors annotation was over-broad; iceblue confirms size/position is theme responsibility); M4 PASS: toolbar display:block, 2 li items visible; M5 PASS: toolbar 1px below selection rect; M6 PASS: rest-state toolbar display:none, 0 handles visible; ai-findings: 1 HIGH — no visible handles (matches M3), 1 LOW — right half of wrapper blank structural)
iter 6: []   newly_passing=[M3, c6]   → GATE2_PENDING   (Generator added full Jcrop structural block to cropper.css: handles 6×6px + 8 per-ordinal position/transform rules + dragbars + area outline + guide lines + tracker + holder; display:inline-block added for c6; all 12 contract rows PASS; M3 PASS: all 8 handles render at 6×6px, all inside holder bbox; c6 PASS: CSS specifies inline-block (computed=block is correct CSS flex-item blockification per §9.4, same pattern as stepbar iter-6); M1–M6 all PASS; c1–c5 unchanged PASS; ai-findings: 1 LOW (ZK JS writes width:600px inline overriding shrink-wrap — not theme-actionable); row-coverage: 12/12)

### camera
iter 1: [c1,c2]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/med/css/camera.css — directory does not exist; js/zkmax/med/css/camera.css.dsp is a 0-byte stub in build-css.js stubPaths; zero .z-camera* CSS rules load in zk.wcs; DOM note: .z-camera-video (bundle) is stale — actual video class is .z-camera-real; .z-camera-toolbar absent from preview DOM (only renders during capture state); c3 SKIPPED; all failures component-rooted — tokens resolve correctly: --zk-color-surface=#ffffff, --zk-color-outline-variant=rgba(0,0,0,0.12), --zk-shape-corner-extra-small=4px)
iter 2: []         newly_passing=[c1,c2]   → VERIFIED   (Generator created camera.css + removed stubPaths entry; 1 rule loads: border=1px solid rgba(0,0,0,0.12), border-radius=4px; c3 SKIPPED — .z-camera-toolbar absent in preview/stopped state; all measurable checks PASS)

### barcodescanner
iter 1: [c1,c2]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file — directory src/main/resources/web/js/zkmax/barscanner/ does not exist; js/zkmax/barscanner/css/barcodescanner.css.dsp is a 0-byte stub in build-css.js stubPaths line 89; zero .z-barcodescanner* rules load; both failures component-rooted — tokens resolve correctly: --zk-color-outline-variant=rgba(0,0,0,0.12), --zk-shape-corner-extra-small=4px; Generator must create barscanner/ dir + barcodescanner.css + remove stub)
iter 2: []         newly_passing=[c1,c2]   → VERIFIED   (Generator created barcodescanner.css + removed stubPaths entry; 1 rule loads: border=1px solid rgba(0,0,0,0.12), border-radius=4px; all 2 checks PASS)

### barcode
iter 1: [c2]   newly_passing=[]   (baseline; c2 component-rooted — .z-barcode canvas bg=rgba(0,0,0,0) transparent instead of rgb(255,255,255); PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkex/barcode/css/barcode.css — directory does not exist; zero .z-barcode wrapper rules load in zk.wcs; DOM note: .z-barcode is the <canvas> element itself, not a wrapper div; c1 PASS — canvas default display:block satisfies "inline-block or block"; --zk-color-surface=rgb(255,255,255) resolves correctly — token correct, just not applied; Generator must create barcode.css + ensure delivery via build-css.js scan or lang-addon.xml)
iter 2: [c2]   newly_passing=[]   → STALLED   (Generator created barcode.css at src/main/resources/web/js/zkex/barcode/css/barcode.css; content correct — .z-barcode{background-color:var(--zk-color-surface)}; built to target/classes/web/marble/js/zkex/barcode/css/barcode.css.dsp; BUT still not delivered — only zk.wcs+pv.css load on barcode.zul; zero .z-barcode rules in zk.wcs; lang-addon.xml has no <css> entry for Barcode widget; Generator must merge barcode rule into normFiles/zk.wcs OR register lang-addon.xml <css> entry — same pattern as captcha/loadingbar/errorbox/splitter fixes)

### dropupload
iter 1: [c1,c2,c3,c4,c5]   newly_passing=[]   (baseline; PRIMARY BLOCKER: no CSS source file at src/main/resources/web/js/zkmax/wgt/css/dropupload.css — js/zkmax/wgt/css/dropupload.css.dsp is a 0-byte stub in build-css.js stubPaths line 87; zero .z-dropupload* rules load in zk.wcs; all 5 failures component-rooted — tokens resolve correctly: --zk-color-outline=rgba(0,0,0,0.23), --zk-color-primary=rgb(55,111,208), --zk-shape-corner-extra-small=4px; manual injection confirms all values PASS when CSS authored; NOTE: use separate border-width/style/color properties not border shorthand; dropupload.zul returns 500 — evaluated via usecase SPA)
iter 2: []                  newly_passing=[c1,c2,c3,c4,c5]   → VERIFIED   (Generator created dropupload.css + removed stubPaths entry; 3 .z-dropupload* rules now load at zk.wcs idx 6665-6667; c1 border=2px dashed rgba(0,0,0,0.23), c2 border-radius=4px, c3 bg=transparent; c4/c5 active state verified via fresh injected element — border-color=rgb(55,111,208), bg=rgba(55,111,208,0.08); all 5 checks PASS)

### fileupload
iter 1: []   newly_passing=[]   (baseline; VERIFIED; Fileupload extends Button — renders as .z-button, not .z-fileupload; bundle selectors are stale; no .z-fileupload CSS rules exist or are needed; all 4 checks PASS via button.css inheritance: border-radius=4px, padding=6px 16px, font-size=14px, bg=rgb(55,111,208); fileupload.zul returns 500 but component verified on button.zul)

### tbeditor
iter 1: []                newly_passing=[]   (baseline; 4 checks PASS — old contract targeted .z-tbeditor root and .z-tbeditor-button-pane with 2 rules)   → VERIFIED
iter 2: []                newly_passing=[]   → VERIFIED   (RE_EVAL noted in iter-2 report; same 4 checks PASS)
iter 3: [box-1,box-2,box-3,box-4,box-5,box-6,pane-3,pane-4,pane-5,btn-1,btn-2,btn-3,btn-4,btn-5,btn-6,btn-7,btn-8,btn-9,btn-10,btn-11,sep-1,editor-1,editor-4,drop-1,drop-2,drop-3,drop-4,drop-5,lr-1,lr-2,lr-3]   newly_passing=[]   (RE_EVAL triggered by contract+skill expansion to 37 checks; only 2 CSS rules exist in tbeditor.css.dsp; box-* all FAIL — old CSS targeted .z-tbeditor root, not .z-tbeditor-box (Trumbowyg-injected DOM); btn-* all FAIL — no button reset/sizing/hover/active rules; sep-1 FAIL — no group separator pseudo-element rule; editor-1/editor-4 FAIL — no bg/padding on .z-tbeditor-editor; drop-* all FAIL — no dropdown styling; dis-*/full-* SKIPPED — no disabled/fullscreen element in preview; pane-1/pane-2/pane-6/editor-2/editor-3/drop-6 PASS via inheritance or existing rule; lr-1: box not flex column → pane fills full height; lr-2: pane position:static; lr-3: buttons 316×159px browser defaults)
iter 4: [lr-1]              newly_passing=[box-1,box-2,box-3,box-4,box-5,box-6,pane-3,pane-4,pane-5,btn-1,btn-2,btn-3,btn-4,btn-5,btn-6,btn-7,btn-8,btn-9,btn-10,btn-11,sep-1,editor-1,editor-4,drop-1,drop-2,drop-3,drop-4,drop-5,drop-6]   (Generator added all 16 CSS rules for box/pane/btn/sep/editor/dropdown/disabled/fullscreen; all spec checks PASS or SKIPPED; SINGLE remaining failure: .z-tbeditor-button-group has no display rule → browser default display:block → 12 groups stack vertically → pane 1271px tall instead of ~36px; fix: add display:inline-flex; align-items:center to .z-tbeditor-button-group)
iter 5: [lr-1]              newly_passing=[]   → stall warning (1/2)   (Generator added display:inline-flex; align-items:center to .z-tbeditor-button-group — CORRECT but INCOMPLETE; pane itself still display:block; groups now 35px inline-flex children in block container; group[0] alone on row-1, groups[1-11] wrap to row-2 due to separator ::before line-height interaction; pane height = 99px (down from 1271px); fix: add display:flex; flex-wrap:wrap; align-items:center to .z-tbeditor-button-pane; verified via JS: pane collapses to 36px when these properties applied)
iter 6: []                  newly_passing=[lr-1]   → VERIFIED   (Generator added display:flex; flex-wrap:wrap; align-items:center to .z-tbeditor-button-pane; pane offsetHeight=36px confirmed; all 12 button groups at offsetTop=0 single flex row; all children fit within 300px box BCR-corrected; stall counter cleared; all 32 spec checks PASS; 5 SKIPPED no disabled/fullscreen/placeholder in preview; 17 CSS rules confirmed in CSSOM)

### stepbar
iter 1: []   newly_passing=[]   (baseline; iter 1 skipped — contract hash drift blocked)
iter 2: []   newly_passing=[]   (BLOCKED — js-source drift: Stepbar.ts updated for vertical orient; zk-spec-author dispatched)
iter 3: []   newly_passing=[]   (BLOCKED — contract hash drift; spec-author dispatched)
iter 4: []   newly_passing=[]   (BLOCKED — js-source hash mismatch; new hash 6549c549... confirmed; contract refreshed with vert-1..vert-9)
iter 5: [s2,s3,s4,step-root-2,step-root-5,step-root-6,conn-1,conn-2,conn-3,conn-4,conn-5,conn-6,conn-7,conn-8,conn-9,icon-1,icon-2,icon-4,icon-7,icon-9,upcoming-1,upcoming-2,upcoming-3,active-2,complete-2,title-1,title-5,click-1]   newly_passing=[]   (first live measurement; 28 failures — root cause: CSS authored for flat DOM but ZK always emits .z-step-content wrapper; connector pseudo-elements have no rules; icon size 28px not 24px; upcoming icon uses disabled-token bg instead of transparent ring; active/complete title/icon colors wrong; no non-linear cursor rule; vert-1..vert-9 SKIPPED — no vertical stepbar in preview; error-1..3/title-8 SKIPPED — no error step in preview)
iter 6: []   newly_passing=[s2,s3,s4,step-root-2,step-root-5,conn-1..9,icon-1,icon-2,icon-4,icon-7,icon-9,upcoming-1..3,active-2,complete-2,title-1,title-5,click-1]   → VERIFIED   (Generator rewrote stepbar.css with correct .z-step-content selectors; all 28 previously-failing checks now PASS; vert-1..9 verified via injected test element — all PASS; error-1..3/title-8 remain SKIPPED — no error step in preview; icon-4 computed=flex due to browser blockification of inline-flex inside flex container per CSS §9.4 — CSS rule authoritatively declares inline-flex, PASS; layout regression sweep: 3 stepbars 600×40px, no child overflow, no display:none violations)

### goldenlayout
iter 1: [c2, c3, c4]       newly_passing=[]   (baseline; css delivery blocker — file at wrong path)
iter 2: [c2, c3]           newly_passing=[c4]   (CSS path fixed but tokens wrong)
iter 3: []                 newly_passing=[c2, c3]   → VERIFIED   (stub with 3 declarations; old 5-check contract only)
iter 4: [wrap-1,wrap-2,wrap-3,wrap-4,hdr-1,hdr-2,hdr-3,hdr-4,hdr-5,hdr-6,tab-1,tab-2,tab-3,tab-4,tab-5,tab-h1,tab-h2,tab-h3,tab-h4,tab-a1,tab-a2,tab-a3,tab-a4,tab-a5,tab-a6,tab-a7,tab-a8,close-1,close-2,ctrl-1,ctrl-2,ctrl-3,spl-2,spl-3,panel-1,panel-2,panel-3,panel-4,panel-5,panel-6,proxy-1,proxy-2,proxy-3,proxy-4,proxy-5,drop-1,drop-2,dd-1,dd-2,dd-3,dd-4,dd-5,dd-6]   newly_passing=[]   (RE_EVAL: contract expanded from 5→53 checks; CSS still only 1 rule using stale tokens; full implementation needed)   → NEEDS_FIX
iter 5: [dd-6]   newly_passing=[wrap-1,wrap-2,wrap-3,wrap-4,hdr-1,hdr-2,hdr-3,hdr-4,hdr-5,hdr-6,tab-1,tab-2,tab-3,tab-4,tab-5,tab-h1,tab-h2,tab-h3,tab-h4,tab-a1,tab-a2,tab-a3,tab-a4,tab-a5,tab-a6,tab-a7,tab-a8,close-1,close-2,ctrl-1,ctrl-2,ctrl-3,spl-2,spl-3,panel-1,panel-2,panel-3,panel-4,panel-5,panel-6,proxy-1,proxy-2,proxy-3,proxy-4,proxy-5,drop-1,drop-2,dd-1,dd-2,dd-3,dd-4,dd-5]   (Generator full implementation landed; 52 of 53 checks now PASS; dd-6 FAIL: .z-goldenlayout-dropdown > li padding 8px overridden by .z-goldenlayout .lm_tab specificity(0,2,0) > (0,1,1) — GoldenLayout renders dropdown items as <li class="lm_tab">)
iter 6: []   newly_passing=[dd-6]   → VERIFIED   (Generator added li.lm_tab to grouped selector: ".z-goldenlayout-dropdown > li, .z-goldenlayout-dropdown > li.lm_tab" at specificity (0,2,1) — beats .z-goldenlayout .lm_tab (0,2,0); computed padding on dropdown li=8px; all 53 measurable checks PASS; max-1 SKIPPED — no maximised panel in preview; no layout regressions)
iter 7: (VERIFIED state invalidated by contract revision 2026-06-03 — M1 inverted, M9–M12 added; RE_EVAL_NEEDED set; no CSS changes in this iter)
iter 8: (iter-8 report was filed as VERIFIED under old contract — now superseded)
iter 9: [M1, M9, M10, M11, M12]   newly_passing=[]   (contract-revised re-eval; M1: outer wrapper card still present — border/radius/shadow on .z-goldenlayout must be removed, per-panel box-shadow missing on .z-goldenpanel; M9: .lm_maximise/.lm_close have 0×0 bbox, no ::after icon content; M10: active tab ::after width:0px position:static — needs position:absolute + width:100% + bottom:0 + left:0 + position:relative on parent; M11: ESCALATED_LIBRARY_CONFIG — 3 stacks equal-width 606/605/605px, areas ratio 1:1 not 2:1; vertical ratio 2.01 PASS; M12: .lm_splitter has bbox but ::before content:none — no dot-handle marker; all D-tier rows PASS as values; wrap-1/2/3 contradict M1 and should be removed from contract)
iter 10: [M11]   newly_passing=[M1,M9,M10,M12]   → VERIFIED_WITH_ESCALATION   (M1 PASS: wrapper transparent, panels have border+elevation-1 shadow; M9 PASS: lm_maximise::after="↗" + lm_close::after="×" rendered at 20×20 on headers 1–3, header-0 lm_close hidden by GL JS for non-closeable panel — CSS correct; M10 PASS: ::after position:absolute bottom:0 left:0 height:2px bg=primary, width=tab width; M12 PASS: splitters 8×328px/1834×8px + ::before ⋮/⋯ dot-handle markers; M11 ESCALATED_LIBRARY_CONFIG non-blocking; all D-tier PASS; lr-3 OUT_OF_SCOPE — GL flex-item splitters not absolute overlays; tab-2 correct — non-active "Files" tab is in overflow dropdown with correct 8px dd padding)
iter 11: [M11]   newly_passing=[]   → VERIFIED_WITH_VISUAL_NOTES   (M11 still ESCALATED_LIBRARY_CONFIG non-blocking; all D-tier checks PASS unchanged from iter-10; §3a mandatory page.gif captured; §3d AI visual review: Finding 1 — lm_header display:block causes lm_controls to stack BELOW lm_tabs (ctrlTop=200=tabBottom=200, header height=67px vs 44px min-height) — controls appear on a second row instead of right-anchored beside tabs; fix: add display:flex;flex-direction:row;align-items:center to .z-goldenlayout .lm_header, flex:1 on .lm_tabs, flex:0 0 auto on .lm_controls; Finding 2 — panel bottom border is NOT missing in CSS (all four sides=1px solid rgba(0,0,0,0.12)); visual perception caused by Console panel bottom being below viewport fold; §3d findings advisory, do not add to failing-set; M7 PASS: active tab 4.83:1, inactive 5.74:1; panel-2 all four borders confirmed; 0 lr violations)
iter 12: [M11]   newly_passing=[M13, Finding-2]   → VERIFIED_WITH_ESCALATION   (M13 PASS: hdr display=flex flex-direction=row align-items=center; lm_tabs flex=1 1 auto; lm_controls flex=0 0 auto; header height=47px ≤ 48px; lm_controls UL vertical center = lm_tab vertical center (centerDiff=0px on all 4 headers, within ±4px); adjusted predicate: compare vertical centers since UL=20px vs tab=46px but share center; Finding-2 RESOLVED: goldenlayout.bottom=531px vs viewport=601px, headroom=70px ≥ 30px; preview ZUL height="420px" applied; Console panel bottom border fully visible; all D-tier PASS unchanged; new flex checks hdr-flex-1/2/3/hdr-tabs-flex/hdr-controls-flex all PASS; M1–M10/M12/M13 PASS; M11 ESCALATED_LIBRARY_CONFIG non-blocking; 0 lr violations; 0 §3d AI visual findings)
iter 13: [M11, M16]   newly_passing=[M14, M15]   → VERIFIED_WITH_ESCALATION   (regression-triple fixes: .lm_close_tab::before content "\00d7" → tab × visible 16×16; .lm_maximise::after glyph \2197→\2922 matches ZKDoc; M16 newly added — 3px bottom-panel clip, GL JS sizes panel 423px in 420px wrapper, library-rooted, evaluator recommends ESCALATED_LIBRARY_CONFIG like M11; §3a settled page.gif captured; status was reconciled into work-status late — row had stale "iter 12 / M11 only")
gate2 pilot (2026-06-04): GATE2: FAIL (critical=2, suggested=3) — md3-design-verifier loop-gate on iter-13 page.gif; both Criticals are prose↔table contradictions (DR-2 failure class): #1 hdr-1 prose said surface/"no tonal step" vs table surface-container — user ruled table wins, prose corrected; #2 panel-3/panel-4 corner-large bottom vs prose "uniformly corner-small" — user ruled uniform corner-small, table+CSS to change (corner-large was wrapper-era residue, fabricated DESIGN.md citation); contract revised, contract-approved flipped false, awaiting user re-approval before Generator; suggested findings: wrap-5 overflow CSS=hidden vs contract=visible (Gate 1 miss?), lm_controls right padding-right spacing-2, lm_tab explicit font-size robustness
iter 14: []   newly_passing=[wrap-5, panel-3, panel-4]   → GATE2_PENDING   (gen iter-4 changes all verified: wrap-5 overflow=visible ✓; panel-3 border-bottom-left-radius=8px corner-small ✓; panel-4 border-bottom-right-radius=8px corner-small ✓; robustness: controls padding-right=8px ✓, tab font-size=13px explicit ✓; all D-tier PASS (63 checks); M1–M10/M12–M15 PASS; M9-partial/M11/M16 ESCALATED_LIBRARY_CONFIG non-blocking; 0 lr violations; §3d: 1 LOW finding (drop-target-indicator dashed line at rest — DOM artefact, not a theme bug); fresh page.gif captured)
gate2 re-run (2026-06-04): GATE2: PASS (critical=0, suggested=0) — all 5 prior findings resolved; prose↔table↔CSS in agreement; screenshot confirms uniform 8px radii, surface-container tonal step, tab × glyphs, right-anchored ⤢/× controls, 2px primary underline → VERIFIED_WITH_ESCALATION (first dual-gate VERIFIED component; M9-partial/M11/M16 remain library-escalated)
M9-partial ruling (2026-06-04): user ruled closable="false" → no close icon is CORRECT GL behavior, not a library bug; M9 predicate refined in contract to exempt non-closable stacks; library-config-issues.md entry closed; remaining escalations: M11, M16 only
contract revised (2026-06-04, post-dual-gate): design-consistency decomposition rulings (user design review, 2026-06-04) — tabs adopt Tabbox family (hdr-7 label-large + hdr-7b weight; tab-4/h3/h4 retired, state-layer rows tab-sl-1..3 + tab-h2 revised; close-2 → on-surface; tab-5 → short3), panel aligns to Panel card standard (all radius rows → --zk-shape-card 6px incl. hdr-3/4 + tab-a7/a8; panel-5 → 16/16/24), splitter adopts family colors (spl-1/2/3 → DESIGN.md §14); status VERIFIED_WITH_ESCALATION → NEEDS_FIX awaiting contract re-approval; see doc/skill-gaps.md 2026-06-04
iter 15: []   newly_passing=[hdr-3,hdr-4,hdr-7,hdr-7b,tab-5,tab-sl-1,tab-sl-2,tab-sl-3,tab-h2,tab-a7,tab-a8,close-2,spl-1,spl-2,spl-3,panel-top-radius-1,panel-top-radius-2,panel-3,panel-4,panel-5]   → GATE2_PENDING   (all 63 contract rows measured (max-1 SKIPPED no maximised panel); all 20 revised rows from 2026-06-04 second-pass contract PASS: hdr-7 label-large 14px ✓; hdr-7b weight=500 ✓; hdr-3/4 border-top-*-radius=6px shape-card ✓; tab-4 RETIRED confirmed no border on :hover ✓; tab-5 transition=color short3 ✓; tab-sl-1/2/3 ::before content=''/bg=primary/opacity=0 ✓; tab-h2 ::before opacity=var(--zk-state-hover-opacity) ✓; tab-a7/a8=6px ✓; close-2=on-surface ✓; spl-1 computed rgb(240,244,250)=surface-container ✓; spl-2/3 color-mix rules correct ✓; panel-top-radius-1/2=6px ✓; panel-3/4=6px ✓; panel-5=16px 16px 24px ✓; M1–M10/M12–M15 PASS; M16 at 1px tolerance boundary (PASS per predicate); M9-partial/M11 ESCALATED_LIBRARY_CONFIG; 0 lr violations; ai-findings: 1 LOW (drop-target dashed line at rest — carried DOM artefact))
gate2 (2026-06-04, second pass): GATE2: PASS (critical=0, suggested=2) — doc/harness/design-reviews/goldenlayout.md; decomposition verified coherent: tab typography/state-layer identical to tabbox sibling, panel radius/padding identical to panel sibling c7, splitter colors consistent with family; zero prose↔table contradictions; suggested (advisory, deferred): lm_tab explicit line-height, lm_tab focus-visible state layer (pending keyboard-nav confirmation) → VERIFIED_WITH_ESCALATION (M11/M16 remain library-escalated)

### portallayout
iter 1: [root-1,col-1,col-2,col-3,col-4,col-6,title-1,title-5,title-6,frame-1,frame-2,frame-3,frame-4,counter-1,counter-3,counter-4,counter-5,counter-6,ghost-1,ghost-2,ghost-3,ghost-4,block-1,block-2,lr-1]   newly_passing=[]   (baseline; NO portallayout.css exists — all structural and visual CSS absent; col-2 float:none causes lr-1 layout regression — second column stacks below first; title-1 shows block not none; all frame/counter/ghost/block rules missing; ghost-2 opacity hardcoded 0.5 in panel.css not token 0.16; block position:fixed in panel.css is architecturally wrong; title-4/counter-7 TOKEN_FIX_REQUIRED — --zk-font-weight-medium/semibold tokens not defined; root-2/col-5/frame-5/counter-2/title-2/title-3/drag-1 PASS)
iter 2: []   newly_passing=[root-1,col-1,col-2,col-3,col-4,col-6,title-1,title-5,title-6,frame-1,frame-2,frame-3,frame-4,counter-1,counter-3,counter-4,counter-5,counter-6,ghost-1,ghost-2,ghost-3,ghost-4,block-1,block-2,lr-1]   → VERIFIED   (Generator created portallayout.css — all 34 checks now PASS; lr-1 fixed: col2.top=309 col2.left=948 side-by-side confirmed; ghost-2 opacity=0.16 via --zk-state-dragged-opacity; ghost-3 border=1px solid rgba(0,0,0,0.23) outline=none; block position=static h=10px; title-4=500 counter-7=600 as literal values; all token bindings correct; no layout regressions)
iter 3: []   newly_passing=[col-7]   → VERIFIED   (skill-feedback-loop: user-reported MD3 gap — adjacent columns flush, 0px horizontal gutter vs 12px vertical panel rhythm. Added col-7 contract check + "no built-in gutter" skill invariant first, then `.z-portallayout-vertical > .z-portalchildren + .z-portalchildren { padding-left: var(--zk-spacing-3) }`. Live-verified: 12px gutter, col0 padding-left=0, columns side-by-side 916px each, outer edges flush, no overflow. doc/skill-gaps.md 2026-06-02)

### splitlayout
iter 1: [c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,lr-1a,lr-1b]   newly_passing=[]   (baseline; NO splitlayout.css exists — all checks FAIL component-rooted; only 1 CSS rule touches .z-splitlayout (global margin-block-end utility); c13 SKIPPED — no resizable=false instance in preview; c14/c15 PASS as browser defaults match; lr-1a/lr-1b: overflow:hidden missing on root causing cave children to overflow)
iter 2: []   newly_passing=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,lr-1a,lr-1b]   → VERIFIED   (Generator created splitlayout.css with all required rules; c1 bg=rgb(240,244,250)=surface-container; c2 border=1px solid rgba(0,0,0,0.12); c3 cursor=default on bare bar (injected test); c4 height=8px; c5 width=8px; c6 hover color-mix resolves correctly; c7 col-resize; c8 row-resize; c9 color=rgba(0,0,0,0.6); c10 hover btn=rgb(55,111,208)=primary; c11 transition=color 0.25s; c12 transition=background-color 0.25s; lr-1a/lr-1b: overflow:hidden applied, residual 9-28px JS overshoot clipped by overflow:hidden — CSS-addressable regression resolved; c13 SKIPPED no nosplitter in DOM but rule-level PASS via injected test)
contract revised (2026-06-04): user-reported bug + family unification — splitter button rendered at the bottom of the bar (double centering: Marble CSS top/left:50%+transform stacked on ZK setBtnPos_ inline margin; root cause Splitlayout.ts:425-432); new outcome rows M8/M9 assert button-midpoint ≈ bar-midpoint ±2px both orients (failing-assertion-first per skill-feedback-loop); skill file gains family-wide "JS centers via inline margin — never add CSS centering on that axis" rule; rows revised/added for the DESIGN.md §14 actuator pill (c6b drag tint, c10 → on-primary, c16–c26 pill spec); status → NEEDS_FIX awaiting contract re-approval; see doc/skill-gaps.md 2026-06-04
iter 3: [M9]   newly_passing=[c1,c6,c6b,c10,c16,c17,c18,c19,c20,c21,c22,c23,c24,c25,c26,M8]   (all 26 D-tier rows PASS; M1-M8 PASS; M9 FAIL: ZK setBtnPos_ writes margin-left=0px for vertical splitters because bar offsetWidth=0 at call time — flex layout not yet resolved; CSS correctly does NOT add competing centering; fix: CSS must provide fallback left:50%/transform for vertical splitter button since JS writes wrong inline margin)
iter 4: []   newly_passing=[M9]   → GATE2_PENDING   (Generator fix applied: V-splitter button now uses left:50% + transform:translateX(-50%) with margin-left:0 !important; all 3 V-splitter instances show diff=0px (was 902px/902px/436px); H-splitter M8 unchanged PASS diff=0px; c16-c23 spot-checks all PASS — pill bg/radius/shadow/size unchanged; 0 AI visual findings; fresh page.gif captured)
iter 5: []   newly_passing=[c27]   → VERIFIED   (micro delta re-eval; Gate 2 PASS 2026-06-04 critical=0; c27 new row from Gate-2 finding: .z-splitlayout-splitter-nosplitter:hover bg=rgb(240,244,250)=#f0f4fa=--zk-color-surface-container ✓ measured live forced-class test; rule confirmed in served bundle via curl; normal splitter :hover color-mix(primary) rule intact — no regression; dual-gate complete)

### anchorlayout
iter 1: [c1]   newly_passing=[]   (baseline; CSS rule correctly declares display:flex but preview ZUL has inline style="display:block" which overrides it at runtime; c2-c9 PASS; M1/M3/M4/M5 PASS; M2 SKIPPED — no horizontally adjacent children due to display:block blocking flex layout; AI finding HIGH: children stack vertically instead of side-by-side vs ZKDoc; fix: remove display:block from inline style in anchorlayout.zul)
iter 2: []   newly_passing=[c1]   → GATE2_PENDING   (inline display:block removed from anchorlayout.zul; display now resolves to flex; c1-c9 all PASS; M1-M5 all PASS — M2 non-vacuous: 4 horizontal pairs found, minimum gap=16px; prior HIGH AI finding (children stacked) resolved — win2+win3 now side-by-side in screenshot; 0 AI visual findings vs ZKDoc baseline; 0 layout regressions)

### coachmark
iter 3: [c6, c10, c11, c13, c14, M4]   newly_passing=[]   (first eval of re-authored T2 contract; CSS file contains only .z-coachmark-content rule — 5 props; all other selectors absent; root position/visibility/opacity, pointer triangle, close color/cursor all missing; c7/c8/c9 SKIPPED — only .z-coachmark-up in preview; c12 PASS via .z-modal-mask base rule not coachmark.css; token resolution verified — all component-rooted failures)
iter 4: []   newly_passing=[c6, c10, c11, c13, c14, M4, lr-1]   → GATE2_PENDING   (Generator added 8 new rules; all 9 z-coachmark* rules loaded; c6 border-bottom=rgb(55,111,208) ✓; c10 close color=white ✓; c11 cursor=pointer ✓; c13 position=absolute ✓; c14 closed opacity=0 visibility=hidden ✓; M4 pointer bbox=20×20 ✓; lr-1 position regression resolved; c7/c8/c9 SKIPPED — no down/left/right pointer in preview; all 6 macro assertions PASS; 0 spec failures; WCAG contrast=4.83:1 ✓)

### rowlayout
iter 1: [c4,c5,c6,c8,M3]   newly_passing=[]   (baseline; rowlayout.css does not exist — net-new component; float+clearfix rules entirely absent; c1/c2/c3/c7/c9/c11/c12 PASS as browser defaults; M1 PASS (block children provide height without clearfix); M2 PASS (JS inline widths correct); M4/M5 PASS; M3 FAIL (cells stack vertically — consequence of float:none); c10/c13 SKIPPED (demo ZUL inline styles); responsive SKIPPED (float prerequisite fails); all failures component-rooted; 2 HIGH AI visual findings vs ZKDoc baseline (cells stacked in both demo sections))
iter 2: []   newly_passing=[c4,c5,c6,c8,M3]   → GATE2_PENDING   (Generator created rowlayout.css with clearfix + float:left + border-box + responsive stacking; c4 before/after display=table ✓; c5 before/after content="" ✓; c6 after clear=both ✓; c8 float=left ✓; M3 rl1 (3-col) tops all 154px maxDiff=0 ✓; M1 both rls height>0 (36px,108px) ✓; M2 cells=[388.1,388.1,388.1] expected=388.1 ✓; M4 maxOverlap=0px ✓; M5 both 100% ✓; responsive float=none at 767px ✓; all 13 D-tier rows PASS/SKIPPED; lr-1 false-positive resolved (absolute offsetTop corrected to root-relative); rl2 row2 6+6 stacking = ZK JS arithmetic constraint (non-first children always get gutter marginLeft even on row-wrap, so 595+26+595+26>1216px) — not CSS-fixable, noted as platform constraint; 1 MEDIUM AI visual finding (rl2 secondary row stacking))

### tablelayout
iter 1: BLOCKED   newly_passing=[]   (EVALUATING_BLOCKED — preview server not running (curl exit 7) AND Chrome MCP tools unavailable in session; gates 0a/0b PASS (contract-approved=true, js-source-hash matches concatenated-file hash ebaf7326…); CSS file src/main/resources/web/js/zkmax/layout/css/tablelayout.css does not exist — net-new component; all 6 D-tier rows + 5 macro rows unmeasured; restart preview app + reconnect Chrome before re-run)
iter 2: [c2,c5,c6,M2,M5]   newly_passing=[]   (baseline — measured via Playwright headless Chrome (Chrome MCP not registered); c1 PASS (browser default border-collapse:separate); c3/c4 PASS (transparent shell, no border); c2 FAIL browser default border-spacing=2px vs 8px; c5 FAIL vertical-align=middle vs top; c6 FAIL padding=1px vs 0px; M1/M3/M4 PASS; M2/M5 FAIL gap=2px < 4px minimum — cascade from c2; all 5 failures component-rooted — CSS file does not exist; --zk-spacing-2=8px token resolves correctly; fix: create tablelayout.css with border-collapse:separate + border-spacing:var(--zk-spacing-2) + .z-tablechildren{vertical-align:top;padding:0})
iter 3: []   newly_passing=[c2,c5,c6,M2,M5]   → GATE2_PENDING   (Generator created tablelayout.css with border-collapse:separate + border-spacing:var(--zk-spacing-2) + .z-tablechildren{vertical-align:top;padding:0}; all 6 D-tier + 5 M-rows PASS: c2 border-spacing=8px ✓; c5 vertical-align=top ✓; c6 padding=0px ✓; M2 h-gap=8px ≥ 4px ✓; M5 v-gap=8px ≥ 4px ✓; table bbox=424×424px; 0 layout regressions; 0 AI visual findings vs ZKDoc baseline; 11/11 rows covered)

### linelayout
iter 1: [ll17,ll21,ll22,ll24,pt1,pt2,pt3,pt4,pt5,pt6a,pt8,pt13a,pt13b]   newly_passing=[]   (baseline; linelayout.css does not exist — net-new component; stock ZK iceblue CSS from zk.wcs serves instead; no --zk-* tokens loaded; all 13 failures component-rooted — CSS file must be created; key failures: line color iceblue not outline-variant (ll21); line width 6px not 2px (ll22); cave padding 24px not 12px (ll17); point size 32px not 24px (pt1/pt2); no border on point (pt5); position:static not relative (pt6a); font-size 24px not 12px (pt13b); line-height 32px not 20px (pt13a); no token refs anywhere; horizontal orient SKIPPED — no instance in preview; M1-M6 all PASS on structural geometry; 0 layout regressions; 2 HIGH AI visual findings)
iter 2: []   newly_passing=[ll17,ll21,ll22,ll24,pt1,pt2,pt3,pt4,pt5,pt6a,pt8,pt13a,pt13b]   → VERIFIED_WITH_VISUAL_NOTES   (Generator created linelayout.css; all 56 rows PASS: ll17 cave padding=0px 12px ✓; ll21 line bg=rgba(0,0,0,0.12)=outline-variant ✓; ll22 line width=2px ✓; ll24 line left=23px=calc(50%-1px) ✓; pt1/pt2 24×24px ✓; pt3 border-radius=9999px=shape-corner-full ✓; pt4 bg=rgb(55,111,208)=primary ✓; pt5 2px solid primary ✓; pt6a position:relative ✓; pt8 color=rgb(255,255,255)=on-primary ✓; pt13a line-height=20px ✓; pt13b font-size=12px ✓; horizontal rows measured via injected DOM (preview ZUL is vertical-only) — all PASS; M1-M6 macro all PASS; B-tier relational: line centered in cave (diff=0px both axes); 0 layout regressions; 1 MEDIUM AI visual finding — button content bunching in narrow last-column (ZUL preview issue, not theme CSS))

### breadcrumb
iter 1: []   newly_passing=[]   → VERIFIED (dual-gate: Gate 1 34/34 + Gate 2 PASS, critical=0)   (baseline; new ZK 10.4 CE component; all 34 checks PASS — 20 c-rows + 8 macro M-rows + 6 cross-cutting x-rows; 0 AI visual findings; measured via Playwright substitute (Chrome MCP unavailable); c1 inline-block isolate-verified against flex-blockification; ZK-uuid preview-anchor mismatch noted — instances classified by content signature)

### carousel
iter 1: []   newly_passing=[]   → VERIFIED (dual-gate: Gate 1 48/48 + Gate 2 PASS, critical=0; 2 AI visual findings accepted)   (baseline; new ZK 10.4 CE component; all 48 checks PASS — c1–c33 + 9 M-rows + 6 x-rows; measured via Playwright substitute (Chrome MCP unavailable); 2 AI visual findings ACCEPTED as not-defects: MEDIUM vertical-orientation arrows stay left/right-docked = ZK stock behavior (carousel.less has no .z-carousel-vertical arrow override; contract M4 scoped to horizontal); LOW active-indicator low-contrast only against flat pastel demo backgrounds, outside the "arbitrary photographic content" design assumption; ZK-uuid preview-anchor mismatch noted — see eval-reports/carousel.md)
