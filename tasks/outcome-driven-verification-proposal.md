# Outcome-Driven Contract Verification — Rationale & History

**Status:** Distributed. This document is a rationale / decision record. Operational rules live in `.claude/agents/zk-spec-author.md`, `.claude/agents/zk-theme-evaluator.md`, `.claude/skills/zk-component-rules/authoring/contract-tiers.md`, `doc/orchestrator-playbook.md`, and `scripts/eval-sanity-tier.js`.
**Authored:** 2026-06-02 (proposal); distributed into operational artifacts 2026-06-03.
**Supersedes:** `iceblue-selector-coverage-proposal.md` (deleted — bottom-up coverage was the wrong frame).

> This file exists to explain **why** the architecture is shaped the way it is. For the active rules, read the files listed above.

---

## 1. Triggering observation (2026-06-02)

The orchestrator marked `goldenlayout` as `VERIFIED` with **0 of 54 checks failing**. Visiting `http://localhost:8080/goldenlayout.zul` revealed the page was visibly broken:

- Outer `.z-goldenlayout` showed no border / radius / elevation — no "card" visual.
- Two GoldenLayout areas stacked vertically instead of docking; right half was empty.
- Tab handles rendered as bullet markers (`•`); tab labels overlapped each other.
- Nothing resembled the contract's stated visual goal: *"card-like bordered container wrapping a full dockable IDE layout."*

All 54 checks passed because each was a **leaf-level token assertion** (`.lm_header height = 28px`, `.lm_tab padding = 8px 12px`, …). No assertion ever asked **"does the page actually look like an IDE shell?"**

---

## 2. Diagnosis — the architectural gap

The original pipeline:

```
contract rows  = { (selector, property, expected-token-value) × N }
evaluator      = querySelector + getComputedStyle, compare per row
pass condition = all N rows match
```

…cannot detect:

| Failure mode | Why current checks missed it |
|---|---|
| Outer container has no visible framing | No single selector's property declares "the component as a whole reads as a card" — that's an emergent visual outcome |
| Sub-panels don't dock / layout collapsed | Per-selector padding checks are orthogonal to spatial composition |
| Sibling text overlaps | No row asks about bounding-box relations between siblings |
| Root box collapses to 0 height | Token rows describe properties, not geometric viability |
| Mockup (`<comp>.html`) and live render look unrelated | The mockup was an orphan — no agent compared it to the live page |

`contract-tiers.md` already names this: *"if a structural rules file only lists DOM/state/composition, evaluator can only verify A + D — this is the current gap."* Marble's contracts were ~95% D-tier (token-bound).

**The fix is not "raise selector coverage."** Selector coverage is bottom-up — it can only ever sharpen what's already on the checklist. The needed shift was **top-down: assert page-level outcomes first, derive selector rows downstream.**

---

## 3. Pilot results — goldenlayout (2026-06-02 to 2026-06-03)

Pilot ran iter-1 to iter-12 against this architecture. Final state: `VERIFIED_WITH_ESCALATION` (12/13 outcome rows pass + 0 advisory findings + all D-tier pass; M11 escalated to `tasks/library-config-issues.md` as a ZK widget JS issue, non-blocking).

Key validations of the architecture from this run:

1. **Outcome rows catch what D-tier missed.** Iter-9 baseline against the revised contract: 5 outcome rows FAIL while D-tier rows would have continued to PASS individually. The "0/54 failing" trap from §1 is real and the M-row gate prevents it.
2. **AI visual review catches what geometry missed.** Iter-11 §3d found that `.lm_controls` rendered on a second row below the tab strip. Geometry M9 had passed because it only checked X-axis right-anchoring. The finding was promoted to a new M-row (M13: same-Y-axis). After Generator fix, iter-12 M9+M13 both pass and §3d emits 0 findings.
3. **Mockup decision rule cuts workload.** Goldenlayout's Marble target ≈ ZKDoc default look → declared `mockup-needed: N`, using ZKDoc image as visual ground truth. For ≈ half the catalog (layout containers + data-rich + stubs), the same logic applies → ~50% mockup workload reduction.
4. **Escalation channel works.** M11 (areas-grid 2:1 ratio) is a ZK widget JS issue, not CSS. The new `ESCALATED_LIBRARY_CONFIG` triage path in the playbook + `tasks/library-config-issues.md` registry let the orchestrator stop the loop cleanly without false-VERIFIED.

---

## 4. Open decisions — resolution log

| # | Question (2026-06-02) | Resolution (2026-06-03) |
|---|---|---|
| 1 | Keep `iceblue mining` workflow as-is for skill files? | YES. Kept. Outcome-driven is contract-layer; skill mining still feeds B/C predicates per `contract-tiers.md`. |
| 2 | Minimum outcome-row count? | Wave-driven minimums set in `zk-spec-author.md` Step 6 (Wave 1 ≥ 6, Wave 2 ≥ 5, Wave 3 ≥ 4, Wave 4 ≥ 2, Wave 5 ≥ 0 with `visual-goal: trivial` declaration). |
| 3 | SSIM threshold for §2 render-diff? | OBSOLETED by AI visual review (`zk-theme-evaluator.md` §3d). SSIM never implemented. AI vision via multimodal `Read` proved cheaper and more flexible — no threshold tuning, finds emergent issues (icon-below-label, viewport clipping) that pixel-diff would have missed or false-positived on. |
| 4 | Who runs Wave 1 spec-author re-runs? | One orchestrator session per component. Goldenlayout was the live pilot. |
| 5 | Does the sanity tier run on all components every dispatch? | All. Cheap; catches sibling-generator collateral. |
| 6 | Where do outcome-pass results live? | Eval-report (existing) + single-line append to `tasks/outcome-migration-log.jsonl` (active). |
