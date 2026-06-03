# Outcome-Driven Contract Verification — Rationale & History

**Status:** Distributed. This document is now a historical / rationale record.
**Authored:** 2026-06-02 (proposal); distributed into operational artifacts 2026-06-03.
**Supersedes:** `iceblue-selector-coverage-proposal.md` (deleted — bottom-up coverage was the wrong frame).

> The active spec for each behavior described here lives in the agents and skill files listed under "Where the content lives now". If you are an agent or human reader looking for the **rules**, read those files. This file exists to explain **why** the architecture is shaped the way it is.

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

**The fix is not "raise selector coverage."** Selector coverage is bottom-up — it can only ever sharpen what's already on the checklist. The needed shift is **top-down: assert page-level outcomes first, derive selector rows downstream.**

---

## 3. The five approaches (and where each lives now)

| # | Approach | Where it lives now |
|---|---|---|
| §1 | Outcome-first contract sections (`## Outcome assertions` M-row table) | `.claude/agents/zk-spec-author.md` Step 6 (template) and `.claude/skills/zk-component-rules/authoring/contract-tiers.md` Section M (predicate class) |
| §2 | Side-by-side render diff (mockup gets a job) — **replaced by** AI visual review per §3d below; mockup decision rule narrows mockup workload | `.claude/agents/zk-spec-author.md` Step 6.5 (mockup decision: Y / N / declare) |
| §3 | Universal sanity tier | `scripts/eval-sanity-tier.js` + `.claude/agents/zk-theme-evaluator.md` §3c |
| §3d | AI visual review (added 2026-06-03 in place of SSIM render-diff — same purpose, simpler implementation) | `.claude/agents/zk-theme-evaluator.md` §3d; `doc/orchestrator-playbook.md` Step 4 (`VERIFIED_WITH_VISUAL_NOTES` triage) |
| §4 | Backfill B/C predicates to skill layer | Ongoing; per-component as Wave migrations land |
| §5 | LLM-derived assertions from prose | **Not implemented** — deferred until manual M-row authoring cost becomes a bottleneck |

---

## 4. Per-component rollout — where progress is tracked

- **Registry:** `tasks/outcome-migration-status.md` — one row per component with `visual-goal / outcome-rows / sanity-pass / outcome-pass / legacy-pass / mockup / migrated` columns. Source of truth for "which components have been migrated to outcome-driven verification."
- **Append-only log:** `tasks/outcome-migration-log.jsonl` — one line per Evaluator dispatch. Records the M-row pass/fail vector and AI visual finding count. Use this for trend analysis.
- **Wave plan:** see `tasks/outcome-migration-status.md` "Wave schedule" table. Five waves grouped by tier (T3 + EE → layout primitives → data-rich → inputs → misc/stubs).

---

## 5. Pilot results — goldenlayout (2026-06-02 to 2026-06-03)

Pilot ran through iter-1 to iter-12 against this architecture. Final state: `VERIFIED_WITH_ESCALATION` (12/13 outcome rows pass + 0 advisory findings + all D-tier pass; M11 escalated to `tasks/library-config-issues.md` as a ZK widget JS issue, non-blocking).

Key validations of the architecture from this run:

1. **Outcome rows catch what D-tier missed.** Iter-9 baseline against the revised contract: 5 outcome rows FAIL while D-tier rows would have continued to PASS individually. The "0/54 failing" trap from §1 is real and the M-row gate prevents it.
2. **AI visual review catches what geometry missed.** Iter-11 §3d found that `.lm_controls` rendered on a second row below the tab strip. Geometry M9 had passed because it only checked X-axis right-anchoring. The finding was promoted to a new M-row (M13: same-Y-axis). After Generator fix, iter-12 M9+M13 both pass and §3d emits 0 findings.
3. **Mockup decision rule cuts workload.** Goldenlayout's Marble target ≈ ZKDoc default look → declared `mockup-needed: N`, using ZKDoc image as visual ground truth. For ≈ half the catalog (layout containers + data-rich + stubs), the same logic applies → ~50% mockup workload reduction.
4. **Escalation channel works.** M11 (areas-grid 2:1 ratio) is a ZK widget JS issue, not CSS. The new `ESCALATED_LIBRARY_CONFIG` triage path in the playbook + `tasks/library-config-issues.md` registry let the orchestrator stop the loop cleanly without false-VERIFIED.

---

## 6. Open decisions — resolution log

| # | Question (2026-06-02) | Resolution (2026-06-03) |
|---|---|---|
| 1 | Keep `iceblue mining` workflow as-is for skill files? | YES. Kept. Outcome-driven is contract-layer; skill mining still feeds B/C predicates per `contract-tiers.md`. |
| 2 | Minimum outcome-row count? | Wave-driven minimums set in `zk-spec-author.md` Step 6 (Wave 1 ≥ 6, Wave 2 ≥ 5, Wave 3 ≥ 4, Wave 4 ≥ 2, Wave 5 ≥ 0 with `visual-goal: trivial` declaration). |
| 3 | SSIM threshold for §2 render-diff? | OBSOLETED by §3d AI visual review. SSIM never implemented. AI vision via multimodal `Read` proved cheaper and more flexible. |
| 4 | Who runs Wave 1 spec-author re-runs? | One orchestrator session per component. Goldenlayout was the live pilot. |
| 5 | Does §3 sanity tier run on all components every dispatch? | All. Cheap; catches sibling-generator collateral. |
| 6 | Where do outcome-pass results live? | Eval-report (existing) + single-line append to `tasks/outcome-migration-log.jsonl` (active). |

---

## 7. Migration playbook — for the next person doing a Wave 1 component (portallayout next)

1. Run `zk-spec-author <comp>`. The agent's Step 6 now includes the `## Outcome assertions` template + Wave minimum row count.
2. Step 6.5 decides `mockup-needed: Y | N` per the ZKDoc-image rule.
3. The user approves the contract (flips `contract-approved: true`).
4. Orchestrator dispatches `zk-theme-evaluator` — §3a captures `page.gif`, §3b measures M-rows + D-rows, §3d runs AI visual review against the screenshot.
5. Triage per `doc/orchestrator-playbook.md` Step 4. AI findings either get promoted to new M-rows (next iter catches geometrically) or accepted as false positives.
6. Generator iterates until VERIFIED or terminal (STALLED / OSCILLATING / ESCALATED_*).
7. Append result to `tasks/outcome-migration-log.jsonl`; update `tasks/outcome-migration-status.md` row.

Estimated pilot effort: 1–2 hours end-to-end per Wave 1 / Wave 2 component once the spec-author is run with the new template.
