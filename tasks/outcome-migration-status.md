# Outcome-Driven Contract Migration — Status

Tracks the rollout of `## Visual outcome` + `## Outcome assertions` sections across `doc/contracts/*.md`. Authoring rules live in [`.claude/agents/zk-spec-author.md`](../.claude/agents/zk-spec-author.md) Step 6 (template) and Step 6.5 (mockup decision); see also [`outcome-driven-verification-proposal.md`](outcome-driven-verification-proposal.md) for the rationale and pilot history. The orchestrator updates this file after every Evaluator dispatch on a migrated component. **Single-writer** (orchestrator) — same lock model as `work-status.md`.

> **Naming history (2026-06-03)**: section was originally called `## Macro assertions` and the columns `macro-rows` / `macro-pass`. Renamed to `Outcome` everywhere for vocabulary alignment with the proposal title. The row-ID prefix `M` (M1, M2, …) is retained as a stable identifier across existing eval reports.

## Column meanings
- **visual-goal** : `## Visual outcome` header exists in `doc/contracts/<comp>.md` (or pre-existing `## Design Contract` prose paragraph counted as equivalent — see migration note below)
- **outcome-rows** : `## Outcome assertions` table has ≥ 3 rows (T3 / layout-tier components require ≥ 5)
- **outcome-pass** : Latest evaluator run reports all outcome rows passing
- **sanity-pass** : Universal sanity tier (collapsed-root / text-collision / overflow / layout-not-engaged) passing
- **legacy-pass** : Latest evaluator run reports all D-tier (token-bound) rows passing
- **mockup** : Per §2 of the proposal — `Y` = mockup required (Marble diverges from ZKDoc, or no ZKDoc image), `N` = skip (ZKDoc image is the visual ground truth), `?` = not yet decided. When `N`, the contract's `## References` block must cite the ZKDoc image path.
- **migrated** : visual-goal AND outcome-rows AND outcome-pass AND sanity-pass AND legacy-pass AND (mockup ≠ ?)
- **─** : not applicable yet / not measured this iteration
- **?** : initial seed state — needs sync with `work-status.md`

## Migration note: `## Design Contract` ≡ `## Visual outcome`
Most existing contracts already have a `## Design Contract` prose paragraph that fulfills the role of `## Visual outcome`. Treat it as equivalent during migration; do not rename to avoid churn. New contracts authored after 2026-06-03 SHOULD use `## Visual outcome` as the heading.

## Rollup (auto-updated by orchestrator)
```
Components total:        80
visual-goal written:      2   (goldenlayout, splitlayout)
outcome-rows complete:    2   (goldenlayout, splitlayout)
sanity-pass (all):        2   (goldenlayout, splitlayout)
outcome-pass (all):       1   (splitlayout)
outcome-pass (with escalation):  2   (+goldenlayout — M11 non-blocking escalation)
mockup decided:           1   (goldenlayout=N)
migrated:                 1   (splitlayout)
migrated*:                2   (+goldenlayout with M11 escalation marker)
```
> ✓* marker on goldenlayout: VERIFIED with M11 escalated to ZK widget source — non-CSS-fixable. Tracked separately at `tasks/library-config-issues.md`. Counts as "migrated" for theme-CSS scope; will flip to plain ✓ once M11 is closed in ZK source.

## Wave schedule
| Wave | Scope | Components | Status |
|------|-------|------------|--------|
| 1 | T3 + EE structural | goldenlayout, portallayout, organigram, pdfviewer, signature, stepbar, tbeditor, searchbox | goldenlayout pilot in flight |
| 2 | Layout primitives | borderlayout, splitlayout, splitter, panel, window, groupbox, caption, tabbox, tab, tabpanel, drawer, navbar, anchornav, fisheyebar, scrollview | pending |
| 3 | Data-rich | grid, listbox, tree, paging, biglistbox, calendar, slider, rangeslider, multislider, rating | pending |
| 4 | Inputs & buttons | textbox, textarea, intbox, decimalbox, longbox, doublebox, passwordbox, combobox, combobutton, datebox, timebox, timepicker, spinner, doublespinner, bandbox, bandpopup, button, checkbox, radio, radiogroup, selectbox, chosenbox, cascader, dropupload, fileupload, cropper, camera, captcha | pending |
| 5 | Misc / stubs | a, barcode, barcodescanner, coachmark, colorbox, errorbox, imagemap, inputgroup, loadingbar, menubar, menuitem, menupopup, messagebox, notification, popup, progressmeter, toast, toolbar, toolbarbutton, tab (split), tabpanel (split) | pending |

## Per-component

### Wave 1 — T3 + EE structural
| component    | tier | visual-goal | outcome-rows | sanity-pass | outcome-pass | legacy-pass | mockup | migrated | notes |
|--------------|------|:-----------:|:----------:|:-----------:|:----------:|:-----------:|:------:|:--------:|-------|
| goldenlayout | T3   | ✓           | ✓ (M1..M13) | ✓           | ✓*         | ✓           | N      | ✓*       | iter-12 VERIFIED_WITH_ESCALATION; 12/13 outcome rows pass; M13 added via §3d AI visual review (icons-same-row-as-tabs); M11 (areas-grid 2:1) remains ESCALATED_LIBRARY_CONFIG |
| portallayout | T3   | ─           | ─          | ─           | ─          | ?           | ?      | ─        |       |
| organigram   | T2   | ─           | ─          | ─           | ─          | ?           | ?      | ─        |       |
| pdfviewer    | T3   | ─           | ─          | ─           | ─          | ?           | ?      | ─        |       |
| signature    | T3   | ─           | ─          | ─           | ─          | ?           | ?      | ─        |       |
| stepbar      | T2   | ─           | ─          | ─           | ─          | ?           | ?      | ─        |       |
| tbeditor     | T3   | ─           | ─          | ─           | ─          | ?           | ?      | ─        |       |
| searchbox    | T2   | ─           | ─          | ─           | ─          | ?           | ?      | ─        |       |

### Wave 2 — Layout primitives
| component    | tier | visual-goal | outcome-rows | sanity-pass | outcome-pass | legacy-pass | migrated | notes |
|--------------|------|:-----------:|:----------:|:-----------:|:----------:|:-----------:|:--------:|-------|
| borderlayout | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| splitlayout  | T1   | ✓           | ✓          | ✓           | ✓          | ✓           | ✓        | migrated; flex-anchor fix |
| splitter     | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| panel        | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| window       | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| groupbox     | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| caption      | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| tabbox       | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| tab          | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| tabpanel     | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| drawer       | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| navbar       | T2   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| anchornav    | T2   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| fisheyebar   | T2   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| scrollview   | T2   | ─           | ─          | ─           | ─          | ?           | ─        |       |

### Wave 3 — Data-rich
| component    | tier | visual-goal | outcome-rows | sanity-pass | outcome-pass | legacy-pass | migrated | notes |
|--------------|------|:-----------:|:----------:|:-----------:|:----------:|:-----------:|:--------:|-------|
| grid         | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| listbox      | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| tree         | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| paging       | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| biglistbox   | T2   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| calendar     | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| slider       | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| rangeslider  | T2   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| multislider  | T2   | ─           | ─          | ─           | ─          | ?           | ─        |       |
| rating       | T1   | ─           | ─          | ─           | ─          | ?           | ─        |       |

### Wave 4 — Inputs & buttons
(omitted from initial seed — populated as Wave 4 starts; all 28 components legacy-pass: ?)

### Wave 5 — Misc / stubs
(omitted from initial seed — populated as Wave 5 starts; all components legacy-pass: ?)

---

## Append-only log
Each Evaluator dispatch appends one line to `tasks/outcome-migration-log.jsonl`. Schema:
```jsonl
{"ts":"<ISO8601>","comp":"<name>","macro":{"M1":"PASS|FAIL|SKIP", ...},"sanity":{"collapsed-root":"PASS|FAIL", "text-collision":"PASS|FAIL", "child-overflow":"PASS|FAIL", "layout-not-engaged":"PASS|FAIL"},"legacy_pass":true|false,"iter":<int>}
```

The log is the source of truth for `outcome-pass` / `sanity-pass` / `legacy-pass` columns above — the orchestrator reads the most recent entry per component to refresh this file. Pre-2026-06-03 entries used a `macro` field instead of `outcome`; either is honored for backward compatibility.
