# Verification Harness — Decision Records

Why the verification harness is shaped the way it is. **Operational rules do NOT live here** — read:
`doc/orchestrator-playbook.md`, `.claude/agents/zk-spec-author.md`, `.claude/agents/zk-theme-evaluator.md`,
`.claude/agents/md3-design-verifier.md`, `.claude/skills/zk-component-rules/authoring/contract-tiers.md`,
`scripts/eval-sanity-tier.js`.

---

## DR-1: Outcome-Driven Contract Verification (2026-06-02 → 2026-06-03)

### Trigger
The orchestrator marked `goldenlayout` as `VERIFIED` with **0 of 54 checks failing**, yet the live page
was visibly broken: no card framing on the outer container, panels stacked instead of docking, tab
handles rendered as bullet markers, labels overlapping. All 54 checks were **leaf-level token
assertions** (`.lm_header height = 28px`, …) — none asked *"does the page actually look like an IDE shell?"*

### Diagnosis
A pipeline of `(selector, property, token-value)` rows verified by `getComputedStyle` cannot detect
**emergent visual failures**: missing whole-component framing, collapsed spatial composition, sibling
overlap, zero-height roots, mockup↔render divergence. Contracts were ~95% D-tier (token-bound).
Raising selector coverage cannot fix this — it only sharpens an already-bottom-up checklist.

### Decision
Shift **top-down**: contracts assert page-level **outcome rows (M-rows)** first; selector rows are
derived downstream. Key mechanisms adopted:

- **M-row gate** — outcome assertions (geometry, composition, framing) must pass before D-tier rows count.
- **AI visual review (§3d)** — evaluator multimodally Reads screenshots; catches emergent issues
  (icon-below-label, viewport clipping) that geometry checks and pixel-diff both miss. This **obsoleted
  the planned SSIM render-diff** — no threshold tuning, cheaper, more flexible.
- **Mockup decision rule** — when the Marble target ≈ ZKDoc default look, declare `mockup-needed: N`
  and use the ZKDoc image as ground truth (~50% mockup workload reduction across the catalog).
- **Sanity tier** (`scripts/eval-sanity-tier.js`) — runs on all components every dispatch; catches
  sibling-generator collateral cheaply.
- **Escalation channel** — non-CSS root causes (widget JS, library config) go to
  `ESCALATED_LIBRARY_CONFIG` + `doc/harness/library-config-issues.md` instead of false-VERIFIED.
- **Wave-driven outcome-row minimums** — Wave 1 ≥ 6 … Wave 5 ≥ 0 with `visual-goal: trivial`
  (see `zk-spec-author.md` Step 6).

### Pilot validation (goldenlayout, iter-1 → iter-12)
- Iter-9: 5 outcome rows FAIL while every D-tier row would have passed individually — the
  "0/54 failing" trap is real and the M-row gate closes it.
- Iter-11: §3d found `.lm_controls` wrapping onto a second row; geometry M9 had passed (X-axis only).
  Finding promoted to new M-row (M13: same-Y-axis); iter-12 both pass, 0 findings.
- Final state: `VERIFIED_WITH_ESCALATION` (12/13 M-rows pass; M11 = ZK widget JS issue, escalated).

Supersedes: `iceblue-selector-coverage-proposal.md` (deleted — bottom-up coverage was the wrong frame).
Iceblue skill mining was kept: it feeds B/C predicates at the skill layer, orthogonal to the contract layer.

---

## DR-2: Dual-Gate VERIFIED — MD3 Design Quality Gate (2026-06-04)

### Trigger
After DR-1, `goldenlayout.zul` reached a state that was *structurally correct but very ugly and not
MD3-compliant*. The harness had verified **conformance** perfectly — but the contract itself carried
iceblue residue and internal prose↔table contradictions (header tonal step, card-tab rows surviving an
"underline-only" prose revision, asymmetric corner radii). No step in the loop ever asked
*"is this good Material Design?"*

### Root causes
1. The harness verifies *conformance*, never *design quality* — evaluator §3d explicitly excludes aesthetics.
2. The ZKDoc image as "visual ground truth" pulls toward the old iceblue theme, against the project
   goal *"visually aligned with MUI"*.
3. Contracts can self-contradict: the Generator implements the **Expected-values table**, so stale
   table rows silently win over revised prose.

### Decision (user, 2026-06-04)
`VERIFIED` = **Gate 1 AND Gate 2**, co-equal — no post-VERIFIED stage, no `DESIGN_REVIEW_NEEDED`.

| | Gate 1: zk-theme-evaluator | Gate 2: md3-design-verifier |
|---|---|---|
| Question | "Does the implementation match the contract?" | "Is the design itself good Material Design?" |
| Ground truth | `doc/contracts/<comp>.md` (internal) | MD3 spec + MUI v7 static CSS (external) |
| Method | Browser measurement (objective) | CSS + screenshot review (expert judgment) |
| Blind spot | Can never catch "contract is ugly" — the contract IS its answer key | Doesn't re-litigate measurements |

Key mechanisms adopted:

- **`GATE2_PENDING`** — transient status written by the Evaluator on all-pass (it never writes
  `VERIFIED` anymore); the orchestrator flips `GATE2_PENDING → VERIFIED` only after `GATE2: PASS`.
- **Gate 2 pass criterion** — zero **Critical** findings; *Suggested* findings never block.
- **Convergence guarantee** — each contract has an `## Accepted MD3 deviations` section (user-only
  additions, same spirit as `contract-approved`). Marble policy: MD3 token naming, MUI v7 visual
  values — MUI wins conflicts, so intentional MD3 deviations are expected and must not re-block.
- **Fix path** — Gate 2 findings route through **contract revision** (design substance needs user
  re-approval) → `NEEDS_FIX` → Generator → `RE_EVAL_NEEDED` → both gates re-run.
- **Prose↔table contradiction check** — automatic Critical in Gate 2 (the goldenlayout failure class).
- **ZKDoc baseline re-scoped** — evaluator §3d treats the ZKDoc image as **structural** ground truth
  only (element presence, position, counts, glyph identity); styling deltas are Gate 2's job.
- **Prevention** — spec-author phase runs Gate 2 in *contract-audit* mode on fresh contracts **before**
  the user approval gate; a contract audit would have caught all three goldenlayout contradictions
  before any CSS was written.
- **Skip rule** — Gate 1 FAIL → skip Gate 2 that round (CSS is about to change anyway). Gate 2 is
  read-only (CSS + pre-captured screenshots, no Chrome) → freely parallel except against a Generator
  on the same shared CSS file.

### Migration
Rows marked `VERIFIED` before 2026-06-04 passed Gate 1 only (76 rows). They are **grandfathered**;
Gate 2 backfill happens opportunistically. Pilot component: goldenlayout.
