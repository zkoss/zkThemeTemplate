# Proposal: Outcome-Driven Contract Verification

**Status:** Draft / discussion
**Author:** orchestrator session 2026-06-02
**Supersedes:** `iceblue-selector-coverage-proposal.md` (deleted — bottom-up coverage was the wrong frame)
**Related:** `.claude/skills/zk-component-rules/authoring/contract-tiers.md`, `doc/orchestrator-playbook.md`, `.claude/agents/zk-theme-evaluator.md`

---

## 1. Triggering observation

On 2026-06-02, the orchestrator marked `goldenlayout` as `VERIFIED` with **0 of 54 checks failing**. Visiting `http://localhost:8080/goldenlayout.zul` revealed the page is visibly broken:

- Outer `.z-goldenlayout` shows no border / radius / elevation — no "card" visual.
- Two GoldenLayout areas stack vertically instead of docking; right half is empty.
- Tab handles render as bullet markers (`•`), tab labels overlap each other.
- Nothing resembles the contract's stated visual goal: *"card-like bordered container wrapping a full dockable IDE layout."*

All 54 checks passed because each was a leaf-level token assertion (`.lm_header height = 28px`, `.lm_tab padding = 8px 12px`, …). No assertion ever asked **"does the page actually look like an IDE shell?"**

---

## 2. Diagnosis — the architectural gap

Current verification:

```
contract rows  = { (selector, property, expected-token-value) × N }
evaluator      = querySelector + getComputedStyle, compare per row
pass condition = all N rows match
```

This pipeline **cannot detect**:

| Failure mode | Why current checks miss it |
|---|---|
| Outer container has no visible framing | No single selector's property declares "the component as a whole reads as a card" — that's an emergent visual outcome |
| Sub-panels don't dock / layout collapsed | Per-selector padding checks are orthogonal to spatial composition |
| Sibling text overlaps | No row asks about bounding-box relations between siblings |
| Root box collapses to 0 height | Token rows describe properties, not geometric viability |
| Mockup (`<comp>.html`) and live render look unrelated | The mockup is currently an orphan — no agent compares it to the live page |

`contract-tiers.md` L150 already names this: *"if a structural rules file only lists DOM/state/composition, evaluator can only verify A + D — this is the current gap."* Marble's contracts are ~95% D-tier (token-bound); B-tier (relational/geometric) and C-tier (state-differs) assertions are sparse to absent.

**The fix is not "raise selector coverage."** Selector coverage is bottom-up — it can only ever sharpen what's already on the checklist. The needed shift is **top-down: assert page-level outcomes first, derive selector rows downstream.**

---

## 3. Five proposed approaches

### §1 — Outcome-first contract sections (minimal change, high signal)
Every `doc/contracts/<comp>.md` gains two mandatory sections at the top:

```markdown
## Visual outcome
<one-paragraph prose describing what the component must look like as a whole>

## Outcome assertions
| id | predicate | rationale |
|----|-----------|-----------|
| M1 | .z-goldenlayout has border-width ≥ 1px OR box-shadow ≠ none | "card-like" visual closure |
| M2 | .z-goldenlayout > .lm_goldenlayout fills ≥ 95% of parent box | "wrapping the layout" |
| M3 | .lm_header children: bounding-box Y range ≤ 2px | tabs on one row |
| M4 | no two .lm_tab siblings overlap horizontally > 1px | no text collision |
| M5 | root bbox height ≥ 400px in default preview | layout engaged |
```

Evaluator runs Outcome before D-tier. **Failing any M-row blocks VERIFIED** even if all D-rows pass. Row IDs keep the `M` prefix (= "macro-scale outcome", retained for stable identifiers across all existing contracts and eval reports). Outcome predicates are deliberately disjunctive / tolerance-based — they assert *outcome* (border-or-shadow-or-bg), not *recipe* (`border: 1px solid #ccc`).

### §2 — Side-by-side render diff (mockup gets a job)
Evaluator opens live preview and `doc/contracts/<comp>.html` in parallel viewports, computes SSIM (or comparable structural similarity) at the outermost-bbox level. Below threshold (e.g. 0.6) → `MISMATCH_OUTCOME`, requires human review. Mockup is no longer an orphan.

**Per-component mockup decision rule (added 2026-06-03 after goldenlayout iteration):**

A hand-authored `doc/contracts/<comp>.html` mockup is **required** only when ONE of the following holds:

1. ZKDoc Component Reference has **no canonical image** for the component (search `/Users/hawk/Documents/workspace/DOC/zkdoc/zk_component_ref/images/ZKCompRef_<Component>*.png`), OR
2. Marble's Design Contract **diverges significantly** from the ZKDoc default look — e.g. tab shape change pill→underline, novel elevation pattern, density step change, ripple / state-layer reshape, novel composition, OR
3. Component has no ZK analog at all (pure-Marble novel UI).

Otherwise: **use the ZKDoc reference image as the visual ground truth, skip the mockup.** The Design Contract prose + Outcome assertions table become the single binding document. The render-diff target switches from `<comp>.html` → `ZKCompRef_<Component>.png` (optionally + Marble token overlay for divergence).

**Rationale.** A mockup is hand-authored CSS+HTML that must be maintained in sync with both the contract and the live page. For components whose Marble target ≈ ZKDoc default (≈ half the catalog: layout containers, data-rich, stubs), the mockup is intermediate drift surface with no ground-truth value beyond what the ZKDoc image already provides. Reserving mockups for the divergent ≈ 35–45 components (mostly form controls + novel/T3 wrappers) cuts mockup workload by ~50%.

**Status-tracking impact.** `tasks/outcome-migration-status.md` gains a `mockup-needed` column: `Y` (must produce mockup) / `N` (skip — ZKDoc image is target) / `?` (not yet decided). The `migrated` predicate gains: *if mockup-needed = Y, the file must exist; if N, the corresponding `## References` block in the contract must cite `ZKCompRef_<Component>.png` as visual ground truth.*

### §3 — Universal sanity tier (cheapest, do first)
A ~80-line script run on every component, no per-contract changes needed:

- Root bbox height < 50px on a layout component → component collapsed
- Any text element bbox overlaps another text element > 1px → text collision
- Any child bbox extends > 2px outside root bbox → overflow
- Flex/grid parent with child-Y variance > 8px → layout not engaged

This alone would have flagged goldenlayout today (text collision + collapse).

### §4 — Backfill B/C predicates to skill layer (long-term hygiene)
`contract-tiers.md` already specifies the format. Add `## Relational invariants` and `## State-differs invariants` sections to `.claude/skills/zk-component-rules/components/<comp>.md`. Benefits every future theme, not just Marble. Slow, batchable.

### §5 — LLM-derived assertions from prose (experimental)
Feed the `## Visual outcome` paragraph to an LLM that emits draft Outcome rows. Spec-author edits/approves before commit. Reduces §1 manual cost. Needs review gate to prevent useless or too-loose predicates.

---

## 4. Recommended priority

| Order | Action | Effort | Why now |
|---|---|---|---|
| 🟥 P0 | **§3** Universal sanity tier | ½ day | Catches catastrophic breaks across all components with zero contract rewrites. Validates the thesis before bigger investments. |
| 🟧 P1 | **§1** Outcome-first sections, starting with goldenlayout as the pilot | 1–2 weeks (rolling) | The structural shift. Goldenlayout is the proof-of-concept. |
| 🟨 P2 | **§2** Side-by-side render diff | ~1 week | Becomes useful only after §1 gives mockups a contract counterpart to validate against. |
| ⬜ P3 | **§4** Backfill B/C in skill | rolling | Long-term, broadly beneficial, not blocking. |
| 🧪 P4 | **§5** LLM-derived assertions | experimental | Only if §1 manual cost becomes the bottleneck. |

🚫 Not doing: enforcing iceblue selector coverage (the previous proposal). Bottom-up. Won't fix what's broken.

---

## 5. Per-component rollout — progress tracking

Rolling §1 across 76 contracts demands its own status registry separate from `work-status.md` (which is the orchestrator loop's runtime state).

### 5.1 New file: `tasks/outcome-migration-status.md`

```markdown
# Outcome-Driven Contract Migration — Status

## Column meanings
- visual-goal    : `## Visual outcome` paragraph written
- outcome-rows   : `## Outcome assertions` table has ≥ 3 rows
- outcome-pass   : Latest evaluator run reports all outcome rows passing
- legacy-pass    : Latest evaluator run reports all D-tier rows passing (previous criterion)
- migrated       : visual-goal AND outcome-rows AND outcome-pass AND legacy-pass

## Rollup
- Components total:        76
- visual-goal written:      1   (goldenlayout — pilot)
- outcome-rows complete:    0
- migrated (all 4 cols):    0

## Per-component
| component       | tier | visual-goal | outcome-rows | outcome-pass | legacy-pass | migrated | notes |
|-----------------|------|-------------|--------------|--------------|-------------|----------|-------|
| goldenlayout    | T3   |     ✓       |     —        |     —        |     ✓       |    —     | pilot, O-rows pending |
| portallayout    | T3   |     —       |     —        |     —        |     ✓       |    —     |       |
| organigram      | T2   |     —       |     —        |     —        |     ✓       |    —     |       |
| pdfviewer       | T3   |     —       |     —        |     —        |     ✓       |    —     |       |
| signature       | T3   |     —       |     —        |     —        |     ✓       |    —     |       |
| stepbar         | T2   |     —       |     —        |     —        |     ✓       |    —     |       |
| tbeditor        | T3   |     —       |     —        |     —        |     ✓       |    —     |       |
| searchbox       | T2   |     —       |     —        |     —        |     ✓       |    —     |       |
| ... (68 more)   |      |             |              |              |             |          |       |
```

### 5.2 How status flips happen

| Column | Who updates | When |
|---|---|---|
| visual-goal  | spec-author (or human) | When prose paragraph is committed to `<comp>.md` |
| outcome-rows | spec-author | When table reaches ≥ 3 rows |
| outcome-pass | evaluator (auto) | Each eval run; orchestrator copies into status file when it transitions a row |
| legacy-pass  | evaluator (auto) | Each eval run |
| migrated     | derived | All four prior columns true |

### 5.3 Suggested batching order

Migration is naturally tier-driven:

1. **Wave 1 — T3 + EE layout (8 components)**: goldenlayout, portallayout, pdfviewer, signature, stepbar, tbeditor, organigram, searchbox. Highest defect density (visual-broken-but-passing); smallest set; proves the approach.
2. **Wave 2 — Layout primitives (12)**: borderlayout, hlayout/vlayout, anchorlayout, absolutelayout, splitter, panel, window, groupbox, caption, tabbox, accordion. Spatial composition matters most here.
3. **Wave 3 — Data-rich components (10)**: grid, listbox, tree, paging, biglistbox, calendar, slider, rangeslider, multislider, rating. State-rich, benefit from B/C predicates.
4. **Wave 4 — Inputs & buttons (~30)**: textbox, combobox, datebox, … . Mostly low outcome complexity; some can stay D-tier-heavy with only 1–2 outcome rows.
5. **Wave 5 — Misc / stubs (~16)**: a, popup, separator, etc. Many already stubs; may need only a 1-line visual goal.

Each wave is independently shippable. After Wave 1, re-evaluate whether §2 (render diff) is worth building.

### 5.4 Orchestrator integration

`doc/orchestrator-playbook.md` gains:

- Pre-flight: if a component's row in `outcome-migration-status.md` has `outcome-rows: ✓` but the contract file has no `## Outcome assertions` section → `BLOCKED: status-drift`.
- Status transition rules: `VERIFIED` requires `outcome-pass: ✓` AND `legacy-pass: ✓` (when `outcome-rows: ✓`). For not-yet-migrated components, `VERIFIED` retains legacy meaning (D-tier only) until Wave reaches them.
- After every evaluator dispatch, the outcome-pass / legacy-pass cells are updated by the orchestrator (single-writer on the status file, same lock model as `work-status.md`).

### 5.5 Avoiding migration regression

Once a component reaches `migrated: ✓`, the playbook treats it as **a one-way gate** — any future eval run that drops `outcome-pass` to ✗ blocks the loop with `REGRESSED_OUTCOME` until fixed. This prevents Generator passes that satisfy D-tier rows by breaking outcome assertions (the very failure mode that produced today's goldenlayout state).

---

## 6. Open decisions to settle before implementing

| # | Question | Default proposal |
|---|----------|------------------|
| 1 | Do we keep `iceblue mining` workflow as-is for skill files, or also retire? | Keep for skill files; mining feeds B/C predicates into §4. Outcome-driven approach replaces it only at the *contract* layer. |
| 2 | Minimum outcome-row count to count as `outcome-rows: ✓`? | ≥ 3 default; layout / T3 components ≥ 5; stubs may opt out with a `visual-goal: trivial — no outcome rows` declaration. |
| 3 | SSIM threshold for §2? | Start permissive (0.5), tighten after collecting baseline per component. |
| 4 | Who runs Wave 1 spec-author re-runs? | One orchestrator session per Wave-1 component; goldenlayout first as live pilot to calibrate outcome-row patterns. |
| 5 | Does §3 sanity tier run on **all** components every Evaluator dispatch, or only on the component being verified? | All. Cheap; catches collateral damage from sibling generator passes. |
| 6 | Where do outcome-pass results live — eval-report only, or also a per-component history file? | Eval-report (existing) plus a single-line append to `tasks/outcome-migration-log.jsonl` so trends are visible. |


---

## 7. Pilot plan — goldenlayout (concrete next step if approved)

1. Author `## Visual outcome` + 6–8 `## Outcome assertions` rows in `doc/contracts/goldenlayout.md`.
2. Implement §3 universal sanity tier as `scripts/eval-sanity-tier.js` (runs against the live page, no Java touch).
3. Run Evaluator with the new sections. Expected outcome: M1, M4, M5 fail (matching the screenshot today).
4. Bounce to Generator with the outcome failures as the priority list (fix outer card framing, fix layout collapse, fix tab horizontal layout).
5. Re-eval. Iterate until outcomes pass.
6. Compare final screenshot with `goldenlayout.html` (manual visual review).
7. Write up findings; calibrate outcome-row patterns for Wave 1 siblings.

Estimated pilot effort: 1 day end-to-end.

---

**Awaiting decision on:** start with §3-only as a 2-hour proof, or commit to §1 + §3 together via the goldenlayout pilot above?
