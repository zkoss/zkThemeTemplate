# Spec-Author Pipeline + Two-Category Documentation Refactor

> **Status (2026-05-19): Phases 0-5 complete; Phase 6 user-gated.**
> Retained as the **architectural reference** for the two-category rule, the spec-author output mapping, and the verification criteria — these still govern `zk-spec-author`, `zk-theme-evaluator`, and `zk-theme-generator` behavior. Do not treat the phase table as an active TODO; see [`spec-author-pipeline-completion.md`](spec-author-pipeline-completion.md) for the as-built report and [`orchestrator-playbook.md`](orchestrator-playbook.md) for the operational loop.

## Context

The current ralph-loop (`doc/orchestrator-playbook.md` → `zk-theme-evaluator` + `zk-theme-generator`) verifies CSS by measuring DOM and comparing against a target. For ~30 components, the target is a Mira HTML mockup or MUI CSS file. For ~50 ZK-unique components without any Material analog — `stepbar`, `organigram`, `pdfviewer`, `signature`, `tbeditor`, `cascader`, `cropper`, `barcode`, `biglistbox`, `anchorlayout`, `dropupload`, `captcha`, `fisheyebar`, `coachmark`, `goldenlayout`, etc. — the loop styles "blind". The evaluator has nothing authoritative to assert against; the generator hallucinates a target; bugs surface only on manual visual review and are logged retroactively in `tasks/skill-gaps.md` (86+ entries today).

Auditing the existing artifacts also surfaced a structural problem: the 76 files under `doc/contracts/` are **mixed-content** — they conflate ZK structural facts (DOM, selectors, state enumeration, sibling decomposition) with theme-specific assertions (`rgb(55,111,208)`, MUI/Mira references, `var(--zk-color-*)` tokens). This violates the explicit scope boundary documented in `.claude/skills/zk-component-rules/SKILL.md` §82-93 and creates drift risk: when zk-component-rules and a contract disagree about DOM structure, the loop can't tell which is canonical.

## Architectural Principle: Two-and-Only-Two Document Categories

Going forward, **every component-knowledge document falls into exactly one of two categories**:

### Category 1: ZK Component Rules (theme-portable)

**Location:** `.claude/skills/zk-component-rules/`
**Scope:** What ZK Framework renders, independent of any theme.
**Contents:** DOM trees, state-class enumeration, attribute support, CSS file bundling, structural composition invariants ("popup width must equal trigger width"), framework quirks.
**Audience:** Every theme builder (Material, Sapphire, custom corporate themes) reads this once.
**Lifecycle:** Updated only when ZK version changes the framework's rendering.
**Excludes (per SKILL.md §82-93):** hex values, token names, spacing values, border/radius/shadow specs, transition durations, font sizes, MD3/MUI/Mira/iceBlue/Sapphire references, hover/focus opacity values.

### Category 2: Theme Design (theme-specific)

**Locations:** `doc/contracts/<comp>.md`, `doc/contracts/<comp>.html`, `doc/contracts/baselines/<comp>-iceblue.png`, `doc/DESIGN.md`, `doc/mira/*.html`.
**Scope:** How a specific theme (marble in this repo) styles each ZK component.
**Contents:** Token assignments, color/spacing values, MUI/Mira references, visual mockups, baseline screenshots, theme-wide design rules.
**Audience:** This theme's evaluator and generator. Sibling themes do not read these.
**Lifecycle:** Re-authored per theme.

**Rule:** Any future doc must declare its category in the first line. Operational artifacts (`tasks/eval-reports/`, `tasks/gen-reports/`, `tasks/work-status.md`, `tasks/skill-gaps.md`) are orthogonal — they are not knowledge documents and don't pick a category.

## Approach

Two intertwined workstreams:

**Workstream A — Contract migration** (Phase 0): Refactor the 76 existing `doc/contracts/*.md` files into the two-category split. Structural sections move into `.claude/skills/zk-component-rules/components/<comp>.md`; theme-bearing sections stay in `doc/contracts/`. The contract file shrinks to ~10–15 lines.

**Workstream B — Spec-Author pipeline** (Phases 1–6): Add a new agent `zk-spec-author` that runs once per blind-spot component to synthesize both categories of artifact. Its outputs are pre-split: structural facts land in zk-component-rules; theme assertions land in the contract + a sibling HTML mockup. The user reviews the mockup once, approves, and the existing ralph-loop runs to convergence.

The two workstreams converge: Phase 0 establishes the destination directories for spec-author's structural output; spec-author is the tool that backfills both buckets for the ~50 components whose contract exists but skill entry does not.

## Two-Layer Output Mapping

Every spec-author run produces outputs split across the two categories:

| Output | Category | File |
|--------|----------|------|
| DOM tree (ASCII, from JS source) | ZK Component Rules | `.claude/skills/zk-component-rules/components/<comp>.md` |
| State-class enumeration | ZK Component Rules | `.claude/skills/zk-component-rules/components/<comp>.md` |
| Composition invariants (popup-width-equals-trigger, etc.) | ZK Component Rules | `.claude/skills/zk-component-rules/components/<comp>.md` (or new `reference/<topic>.md` if cross-cutting) |
| Closest-sibling / decomposition notes | ZK Component Rules | `.claude/skills/zk-component-rules/components/<comp>.md` |
| Token-bearing State matrix (rows = states, cols = `var(--zk-*)` assertions) | Theme Design | `doc/contracts/<comp>.md` |
| MUI / Mira / DESIGN.md cross-references | Theme Design | `doc/contracts/<comp>.md` |
| Rendered HTML mockup styled with MD3 tokens | Theme Design | `doc/contracts/<comp>.html` |
| Iceblue baseline screenshot | Theme Design | `doc/contracts/baselines/<comp>-iceblue.png` |

The contract file becomes a thin theme overlay that **cross-references** the skill entry rather than duplicating it. Header of a refactored contract:

```yaml
# Component: stepbar (theme design)
tier: T3
category: feedback
preview: http://localhost:8080/stepbar.zul
rules: see .claude/skills/zk-component-rules/components/stepbar.md
contract-approved: false
zk-version: 10.2.1-jakarta
js-source-hash: <sha256>
```

Followed by **only theme content**: References block, Expected values (with token references), State matrix.

## Phase 0: Contract Migration

Triage the 76 existing contract files into three groups:

**Group A — contract exists, skill entry exists (24 components)**
`bandbox, borderlayout, button, calendar, checkbox, chosenbox, colorbox, combobox, combobutton, datebox+timebox+spinner (combo-trio), grid+listbox+tree (data-components), groupbox, menubar, panel, progressmeter, rating, searchbox, selectbox, separator, slider, splitter, tabbox, toolbar, window` (plus the toast/notification merge).

Action: diff contract's structural sections against skill entry; if they agree, delete from contract and reference the skill. If they disagree, the skill wins (per SKILL.md §28); update contract to match. ~2h.

**Group B — contract exists, no skill entry (~52 components)**
`stepbar, organigram, pdfviewer, signature, tbeditor, barcode, barcodescanner, biglistbox, cascader, cropper, dropupload, goldenlayout, coachmark, camera, captcha, fisheyebar, imagemap, scrollview, anchornav, drawer, doublebox, doublespinner, radio, radiogroup, decimalbox, longbox, intbox, passwordbox, textbox, textarea, errorbox, inputgroup, paging, menuitem, menupopup, navbar, popup, caption, tab, tabpanel, toolbarbutton, loadingbar, messagebox, multislider, rangeslider, toast, notification, fileupload, bandpopup, timepicker, a` (links).

Action: this is where spec-author has the most value. Migrate the contract's DOM/state sections to a new `components/<comp>.md` (or annex into a related component's file), retain only theme-bearing sections. Done as part of spec-author runs (Phases 3–4).

**Group C — skill entry exists, no contract (or no contract yet) (0 today)**
None currently; placeholder for future ZK additions.

Cross-cutting cleanup: migrate `doc/component-dom-structures.md` content into `zk-component-rules` and delete the standalone file (it's pure structural ZK knowledge per the principle). ~1h.

## Spec-Author Agent

**Definition:** `.claude/agents/zk-spec-author.md` — new agent, modeled on existing 165–265-line agents.

**Inputs (priority order):**
1. ZK JS source: `/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/{wgt,inp,layout,…}/<Comp>.ts` (or `/zkex/`, `/zkmax/` for PE/EE components).
2. Iceblue baseline screenshot at `doc/contracts/baselines/<comp>-iceblue.png`.
3. Preview state matrix at `src/test/resources/web/<comp>.zul` (+ `~./pv/<comp>-content.zul`).
4. Closest sibling already implemented — read sibling's skill entry + theme contract + CSS.
5. Partial Mira/MUI analog (if any) at `doc/mira/*.html` and `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/<comp>.css`.
6. MD3 tokens at `src/main/resources/web/zul/css/tokens/_{colors,elevation,motion,shape,spacing,typography}.css`.
7. Existing skill: `.claude/skills/zk-component-rules/SKILL.md` (index) + any sibling component files.
8. Theme rules: `doc/DESIGN.md`.

**Outputs (strict category split, enforced by agent prompt):**

To `.claude/skills/zk-component-rules/components/<comp>.md` (NEW file or extension):
- DOM tree section
- State-class table
- Composition invariants
- Sibling decomposition
- File bundling note (which `.css.dsp` ships this component's styles)
- Edition note (CE / PE / EE)
- NO tokens, NO colors, NO theme refs

To `doc/contracts/<comp>.md` (rewritten):
- Frontmatter (tier, category, preview, `rules:` cross-ref, approval flags)
- References block (MUI CSS path, Mira HTML path, DESIGN.md sections)
- Expected values table, with values written as token references (`var(--zk-color-primary)`) wherever a token exists; raw values only as a last resort
- State matrix table (rows = states from skill, cols = computed-style assertions)
- States to evaluate checklist

To `doc/contracts/<comp>.html` (NEW):
- Static self-contained mockup styled with `--zk-*` tokens
- Models the doc/mira/components-*.html convention
- Renders all variants × states from the State matrix

To `doc/contracts/baselines/<comp>-iceblue.png` (NEW):
- Captured by `scripts/render-iceblue-baseline.sh` before spec-author runs

## Critical Files

### To create
- `.claude/agents/zk-spec-author.md` — agent definition.
- `scripts/render-iceblue-baseline.sh` — Playwright iceblue capture.
- `pom.xml` entry: `preview-app-iceblue` Maven exec target, points at a new `zk-iceblue.xml` config that omits the theme override.
- `doc/contracts/_template.html` — mockup template.
- `doc/contracts/<comp>.html` — one per blind-spot component.
- `doc/contracts/baselines/<comp>-iceblue.png` — one per blind-spot component.
- `.claude/skills/zk-component-rules/components/<comp>.md` — one per Group B component (~52).

### To modify
- `.claude/agents/zk-theme-evaluator.md` — refuse-if-no-`contract-approved` gate; treat skill entry as authoritative for structural assertions and contract State matrix as authoritative for token assertions.
- `.claude/agents/zk-theme-generator.md` — read skill entry + contract; honor `## Design Contract` rules when present; contract supersedes any inference.
- `.claude/skills/zk-component-rules/SKILL.md` — append new `components/<comp>.md` entries to the index table.
- `doc/orchestrator-playbook.md` — document Phase 0 and the new spec-author phase + approval gate.
- `doc/skill-feedback-loop.md` — capture that gaps now route to "rules wrong" vs "theme assertion wrong" vs "implementation wrong".
- `doc/contracts/<comp>.md` — trim Group A files to theme-only content; rewrite Group B files after spec-author runs.

### To delete (after migration)
- `doc/component-dom-structures.md` — pure structural ZK knowledge; migrates into skill.

## Seed Component List

Phase 4 runs spec-author on these five, in order:

1. **stepbar** — closest to MUI Stepper; lowest risk; validates format end-to-end.
2. **signature** — pure canvas + toolbar; well-bounded DOM.
3. **tbeditor** — toolbar + iframe; exercises iframe + chrome pattern.
4. **organigram** — bespoke tree layout; stress-tests on a truly novel component.
5. **pdfviewer** — wraps third-party viewer; "thin chrome around opaque widget" pattern.

After convergence, extend to: `cascader, cropper, barcode, biglistbox, anchorlayout, dropupload, captcha, fisheyebar, coachmark, drawer`.

## Implementation Phases

**Phase 0 — Contract migration (~6h)**
- Group A: diff and trim 24 contracts to theme-only content (~2h).
- Cross-cutting: migrate `doc/component-dom-structures.md` into skill (~1h).
- Establish naming/structure conventions in 2–3 Group A examples to lock the template (~3h).

**Phase 1 — Iceblue baseline pipeline (~3h)**
- Add `zk-iceblue.xml` config and `preview-app-iceblue` Maven target.
- Write `scripts/render-iceblue-baseline.sh` Playwright script.
- Verify by capturing all 5 seed components' baselines.

**Phase 2 — Spec-author agent (~8h)**
- Author `.claude/agents/zk-spec-author.md`.
- Encode the strict two-output split in the prompt (refuse to emit tokens into skill files; refuse to emit DOM trees into contracts).
- Define `doc/contracts/_template.html`.
- Define sibling-selection heuristic per component.

**Phase 3 — Bootstrap first contract (~3h, mostly user-attention)**
- Run on `stepbar`. Iterate until user approves both the skill entry and the HTML mockup. This locks the format.
- Snapshot the final stepbar output into the agent prompt as the canonical example.

**Phase 4 — Generate remaining 4 seed contracts (~6h wall, ~1h user-attention)**
- Run on `signature, tbeditor, organigram, pdfviewer` in sequence.
- User reviews each `doc/contracts/<comp>.html` + corresponding `.claude/skills/zk-component-rules/components/<comp>.md`.
- Approval flips `contract-approved: true` in contract.

**Phase 5 — Wire evaluator + generator (~3h)**
- Evaluator gate: refuse if `contract-approved: false`.
- Evaluator reads skill for structure, contract for tokens.
- Generator: contract supersedes inference.
- Document new phase in `doc/orchestrator-playbook.md`.

**Phase 6 — Run loop against 5 seed components (variable)**
- Existing ralph-loop runs autonomously.
- Calibrate: compare next 30 days of skill-gap entries against current baseline.

**Total MVP: ~29h wall-time, ~5h user-attention.**

## Model Assignment per Phase

Use Opus only where authoring quality compounds across future runs; use Sonnet for mechanical execution.

| Phase | Model | Reason |
|-------|-------|--------|
| Phase 0 — Contract migration | Sonnet 4.6 | Mechanical diff/trim against existing skill source-of-truth. Pattern matching, low ambiguity. |
| Phase 1 — Iceblue baseline pipeline | Sonnet 4.6 | Well-trodden Maven + Playwright infrastructure. |
| Phase 2 — Spec-author agent prompt | Opus 4.7 | High-leverage authoring. Errors propagate to every future spec-author run. Hard "refuse to emit" rules and multi-source priority ordering reward deeper reasoning. |
| Phase 3 — Bootstrap on `stepbar` | Opus 4.7 | First-time format-locking. Output gets snapshotted into the agent prompt as canonical — mistakes compound. |
| Phase 4 — `signature` / `tbeditor` / `pdfviewer` | Sonnet 4.6 | Format locked; agent applies established pattern. |
| Phase 4 — `organigram` | Opus 4.7 | Novel component with no precedent in codebase, MUI, or Mira. |
| Phase 5 — Wire evaluator + generator | Opus 4.7 | Modifies two cross-cutting agents the whole loop depends on. Regression awareness matters. |
| Phase 6 — Run ralph-loop | per-agent default | Existing zk-theme-evaluator + zk-theme-generator have their own model assignments; orchestrator coordinating them can be Sonnet. |

**Standing setting for the spec-author agent after MVP:** default to Sonnet 4.6. Override to Opus 4.7 only when (a) the component has no Mira/MUI analog, (b) JS-source DOM disagrees with live render, or (c) `closest-sibling` is genuinely ambiguous (cascader, drawer, doublebox).

Net pattern: ~30% Opus / ~70% Sonnet by wall-time — the inverse of the cost ratio, with the high-stakes reasoning on the artifacts that compound.

## Verification

End-to-end success when **all** hold:

1. `scripts/render-iceblue-baseline.sh stepbar` produces `doc/contracts/baselines/stepbar-iceblue.png`.
2. `zk-spec-author stepbar` produces:
   - `.claude/skills/zk-component-rules/components/stepbar.md` containing only DOM/state/composition content with **zero** hex values, **zero** `--zk-*` tokens, **zero** MUI/Mira/MD3 references.
   - `doc/contracts/stepbar.md` containing token-bearing assertions, References block, and a `rules:` cross-ref — with **no** DOM tree or selector enumeration (those live in the skill).
   - `doc/contracts/stepbar.html` rendering all variants × states.
3. A boundary-lint script (`scripts/check-doc-categories.sh`) passes: no token in `components/*.md`; no DOM tree in `doc/contracts/*.md`; no orphan contract that lacks a `rules:` cross-ref.
4. After user flips `contract-approved: true`, evaluator runs and reads from both layers; generator brings stepbar to `VERIFIED` without human intervention.
5. Bumping `zk-version` in `doc/contracts/stepbar.md` (simulating ZK upgrade) causes the next loop pass to detect a `js-source-hash` mismatch and re-route through spec-author — and re-run hits BOTH the skill entry and the contract.
6. 30 days after rollout: skill-gap entries tagged to the 5 seed components drop measurably vs. pre-rollout baseline.

## Open Risks

- **Spec-author cross-contaminating the two buckets** — mitigation: agent prompt has hard "refuse to emit" rules; boundary-lint script in CI catches drift.
- **Contract-to-skill duplicate drift during Group A trim** — mitigation: trim is mechanical; reviewer diffs before/after.
- **Sibling-driven inference picking wrong sibling** (cascader → combobox vs. tree) — mitigation: agent prompt enumerates candidates per component, doesn't pick one blindly.
- **ZK source DOM not matching live render** (client-side JS mutates server HTML) — mitigation: spec-author loads live preview via Chrome MCP and reconciles against JS source.
- **HTML mockup drifts from implementation** — mitigation: CI lint diffs key class names between `doc/contracts/<comp>.html` and rendered preview.
- **Iceblue baseline is theme-specific yet sits in theme directory while informing structural extraction** — accepted: baseline lives in `doc/contracts/baselines/` (Theme Design bucket), spec-author reads it but emits only structural facts to skill. Boundary remains clean.
