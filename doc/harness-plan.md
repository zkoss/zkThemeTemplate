# Harness Engineering: ZK-Material Theme Verification

## Context

A single-agent loop that both implements and verifies CSS changes suffers from self-evaluation bias (the model praises its own output). Following Anthropic's harness engineering principles, we split the work into two specialized agent skills with strict role separation and pre-distributed context bundles so each invocation sees only what it needs.

Reference: https://www.anthropic.com/engineering/harness-design-long-running-apps  
Design spec: `doc/DESIGN.md`  
Plan tracker: `doc/apply-mira-plan.md`

---

## Resolved Design Decisions

These decisions resolve the questions raised in earlier drafts.

### D1. Unit of work = one component

Each component is its own work unit so every Evaluator and Generator invocation has a focused, single-target context. This keeps eval reports and CSS contracts small and easy to reason about.

CSS source files are often **shared across siblings** (`.z-textbox, .z-intbox, .z-decimalbox { ... }` is one rule across three components). The shared-file concern is handled by the bundle (D4) and the state machine, not by widening the work unit.

Shared-file map:

| Shared CSS file | Components sharing it |
|-----------------|----------------------|
| `inp/css/input.css` | textbox, intbox, decimalbox, doublebox, longbox, textarea, passwordbox |
| `inp/css/spinner.css` | spinner, doublespinner |
| `wgt/css/checkbox.css` | checkbox, radio |
| `menu/css/menu.css` | menubar, menupopup, menuitem |
| `tab/css/tabbox.css` | tabbox, tabs, tab, tabpanel |

**Sibling propagation rule.** After the Generator edits a shared file for component A, every sibling listed in A's bundle is flagged `RE_EVAL_NEEDED` in `work-status.md`. They must be re-evaluated before any of them can be marked VERIFIED — this catches regressions a single-component fix could otherwise introduce in siblings.

**Serialization rule.** Only one component per shared CSS file may be in `FIXING` at a time. The orchestrator enforces this when dispatching `/zk-theme-generator`.

Total: ~36 component-level work units.

### D2. Three-tier component classification

Not every ZK component has a Mira equivalent. Each work unit is tagged with one tier in its bundle, so the Generator and Evaluator share the same definition of done.

| Tier | Description | Examples | Evaluator references |
|------|-------------|----------|---------------------|
| **T1: Mira-mapped** | Direct or close MUI equivalent | textbox→TextField, button→Button, checkbox→Checkbox, grid→DataGrid, combobox→Autocomplete | DESIGN.md + Mira live values + `doc/mira/*.html` + MUI static CSS |
| **T2: ZK-only** | Standard ZK component with no direct Mira match | chosenbox, cascader, splitter, biglistbox, bandbox edge features | DESIGN.md tokens + decomposition into MD3 primitives + closest-sibling CSS as visual basis |
| **T3: Third-party wrapper** | ZK wraps an external JS library (DOM mostly owned by the library) | TBEditor, Cropper, CodeMirror, ApexCharts | DESIGN.md applied to the **wrapper/host element only** — do not style internal library DOM |

Bundles declare `tier: T1 | T2 | T3`. Evaluator applies a different check set per tier:
- T1: full check suite including measured-value comparison against Mira
- T2: token-compliance only (colors / spacing / radii / typography from DESIGN.md) + qualitative coherence with the closest T1 sibling
- T3: wrapper-only checks (border, focus ring, sizing of the host element); the library's inner DOM is out of scope

### T2 design strategy (how the Generator decides what a ZK-only component should look like)

A "ZK-only" component usually isn't visually novel — it's a **composition of MD3 primitives** that Mira already styles in T1 components. The Generator never invents a look from scratch and never references legacy ZK theme CSS (Iceblue, Sapphire, etc.) for visual style — those are exactly what we're replacing.

The order of references the Generator consults:

1. **Decomposition.** The bundle's `decomposition:` field lists which MD3 primitives the component breaks into. Style each primitive independently.

   | ZK-only | Decomposition |
   |---------|---------------|
   | chosenbox | combobox (input) + chip (selected items) |
   | cascader | combobox + tree (or nested menu) |
   | combobutton | button (main segment) + menu (dropdown) + divider |
   | toolbarbutton | flat button (icon-button variant inside toolbar context) |
   | groupbox | panel (card) + collapsible header |
   | bandbox | combobox + custom popup container |
   | bandpopup | popover surface (Card + elevation) |
   | inputgroup | textbox + prefix/suffix adornment |
   | splitter | (no MD3 primitive — use tokens directly) |
   | errorbox | tooltip + alert (error variant) |
   | loadingbar | LinearProgress (indeterminate animation) |

2. **Closest sibling.** The bundle's `closest-sibling:` field names a T1 component whose CSS file is the visual basis. The Generator MUST read that file before its contract step and reuse its tokens, state-layer pattern, transition, and shape values.

   Example: editing `groupbox.css` → first read `wnd/css/panel.css`; the panel's header padding, body padding, card shadow, and border-radius are the values to mirror. Then add only the groupbox-specific bits (collapse chevron animation, title-clickable affordance).

3. **MUI source CSS** at `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/`. When neither a sibling nor a clean decomposition gives the answer, look up the closest MUI component file (e.g. `Chip.css` for chip behaviour inside chosenbox).

4. **DESIGN.md tokens used directly.** For elements with no MD3 analog (splitter handle, error-callout pointer), construct the look from tokens — `--zk-color-outline-variant` for default, `--zk-color-primary` for active, `--zk-spacing-*` for layout, `--zk-motion-*` for transitions.

5. **material.io spec** (https://m3.material.io/components/) — only when items 1–4 don't answer a specific state question (e.g. "how should the indeterminate animation curve look").

#### Legacy ZK theme CSS — when is it allowed?

- **Visual style: NEVER.** Don't read iceblue/sapphire/breeze CSS for colours, borders, shadows, sizes. Those decisions are what this work is replacing.
- **Component-state discovery: SOMETIMES.** Legacy CSS can expose **state classes** the framework applies that aren't documented in `doc/component-dom-structures.md` (e.g. `.z-chosenbox-chip-pending-delete` for the backspace-soft-delete affordance). Use it only to learn that a state EXISTS — then style that state per DESIGN.md.

The bundle's `state-discovery:` field can cite a legacy theme file if the Evaluator needs to know about a non-obvious state. The Generator does NOT read this for styling.

### T3 design strategy (third-party / opaque-content wrappers)

T3 elements wrap content the theme does NOT own — either a JS library's DOM (signature_pad canvas, GoldenLayout panes, PDF.js viewer) or a server-rendered opaque artifact (captcha image). The inner content has its own rendering rules; touching it breaks on library upgrade or server-side change.

The Generator can do only one of three things, in this priority order:

1. **Wrapper-only styling (default).** Style only the host element listed in the bundle's `wrapper-selectors:`. Give it the border, radius, focus ring, padding, and sizing rhythm that match nearby form fields (textbox/combobox) so the wrapper visually belongs. The inner content keeps its native look.

   ```css
   .z-signature {                       /* wrapper only */
     border: 1px solid var(--zk-color-outline);
     border-radius: var(--zk-shape-input);
     transition: border-color var(--zk-motion-duration-short3) var(--zk-motion-easing-standard);
   }
   .z-signature:focus-within {
     border-color: var(--zk-color-primary);
     border-width: 2px;
   }
   /* Internal canvas / overlay / library DOM is NEVER selectored. */
   ```

2. **Theme bridge (when the library exposes CSS variables).** Map our `--zk-*` tokens to the library's tokens at the wrapper scope. The library reads its own variables and re-themes itself internally; we never touch its rule blocks.

   ```css
   .z-pdfviewer {
     --pdf-toolbar-bg: var(--zk-color-surface-container-high);
     --pdf-toolbar-fg: var(--zk-color-on-surface);
     --pdf-accent: var(--zk-color-primary);
   }
   ```

   The bundle's `theme-bridge:` section lists which variables the library exposes and how we map them. If the library has no variable system (TinyMCE skin-based, vanilla canvas widgets), this approach is unavailable — fall back to (1).

3. **JS-config escalation.** When the library is JS-configured (charts use `theme: { palette: [...] }` not CSS, GoldenLayout reads colours from JS init options), the integration is **not CSS**. The Generator's scope (one CSS file) cannot do this work. The Evaluator flags the component `ESCALATED_LIBRARY_CONFIG` — fixing it requires the ZK widget's `.ts` / `.java` glue layer, which is out of the harness scope.

#### Forbidden selectors

Each T3 bundle MUST list `forbidden-selectors:` — internal library classes the Generator is barred from styling. Examples:

| Component | Forbidden internal selectors |
|-----------|------------------------------|
| signature | the `<canvas>` element and any signature_pad internals |
| pdfviewer | `.pdfViewer`, `.toolbar`, `.page`, `#viewerContainer` (PDF.js own classes) |
| goldenlayout | `.lm_*` (GoldenLayout's own namespace) |
| captcha | nothing internal (image is opaque pixels) |

The Generator MUST refuse to write a rule whose selector matches an entry in `forbidden-selectors:`. If a failing check can only be addressed by styling a forbidden selector, the Generator does NOT make the edit — it emits a build receipt with `build: ESCALATED` and a note "fixing <check-id> would require modifying <forbidden-selector>; escalate to library-config track".

#### What the Evaluator measures for T3

A focused, tiny check set:

| Should measure | Should NOT measure |
|----------------|---------------------|
| Wrapper border + radius + focus ring match form siblings (textbox / combobox) | Internal toolbar buttons, font sizes, internal padding |
| Wrapper height / width / display rhythm fits page layout | Library's own SVG / canvas content |
| `disabled` propagates opacity 0.38 to wrapper | Library's light/dark theme variants |
| If `theme-bridge` declared: the bridge variables resolve correctly inside the wrapper scope (read via `getComputedStyle(wrapper).getPropertyValue('--lib-var')`) | Whether the library actually consumes those variables (library-internal concern) |

#### Where Mira sets the precedent

`doc/mira/charts-apex.html` and `doc/mira/charts-chartjs.html` show Mira's pattern: outer Card surface is MUI-themed, but the chart's colours, fonts, and tooltips are configured in JS (`theme: 'light' | 'dark'`, `colors: [...]`) — not in CSS. Mira's own approach is **wrapper-outside, library-inside** — exactly what this T3 strategy formalises for ZK.



### D3. Constraint detection — progress-based, not attempt-count

A hard "max 3 attempts" cap is too brittle. Some components need more iterations; others get stuck in oscillation between two failing checks. Replace it with two signals:

**Signal A — No-progress stall.** Each iteration the Evaluator records the set of failing check IDs. After each Generator pass, compute `newly_passing = failures[n-1] \ failures[n]`. If `len(newly_passing) == 0` for **two consecutive** iterations, mark the work unit `STALLED` and escalate.

**Signal B — Oscillation.** If `failures[n] != failures[n-1]` but `failures[n] == failures[n-2]`, the system is swapping between two failure sets without converging. Mark `OSCILLATING` immediately and escalate.

Both `STALLED` and `OSCILLATING` map to the existing `CONSTRAINT` terminal state in `doc/apply-mira-plan.md`, with the failure-set history retained in the eval report for triage.

There is no upper bound on iterations as long as `len(newly_passing) > 0`.

### D4. Bundle granularity

One bundle file per **component**, at `tasks/bundles/{component}.md`. The bundle includes two fields specifically for the shared-file concern:

- `shared-css-file:` — path to the CSS source file the Generator will edit
- `siblings:` — other components that share this file (so the Generator can split a shared selector instead of blindly changing it)

Both the Generator and Evaluator load the same bundle, so they share the same view of the component scope and sibling dependencies.

### D6. Token-rooted failures are escalated, not generated

A failing check is **token-rooted** when its expected value comes from a `--zk-*` design token and the token's resolved value diverges from DESIGN.md. Example surfaced in the textbox smoke test: `--zk-typescale-body-medium-size` resolves to 14px but DESIGN.md §7 says 13px — every input-type component will fail the font-size check.

The Generator's scope is one component CSS file. Token fixes belong in `zul/css/tokens/*.css` and affect the whole theme. Letting the Generator hardcode token values into component CSS would fragment the typography/motion/colour scales.

**Rule:** when the Evaluator finds a token-rooted failure, it tags the failing check `TOKEN_FIX_REQUIRED: <token-name>` in the report's Action-required section. The orchestrator routes the component to `tasks/token-issues.md` and marks the row `ESCALATED_TOKEN_FIX` — the Generator is **not** dispatched. Token issues are reviewed in a separate human-led pass; after fix, affected components are flipped to `RE_EVAL_NEEDED` and pass through Evaluator again.

How the Evaluator decides "this is token-rooted": the expected-value column in the bundle cites DESIGN.md and the property is one whose source token can be read at the same time (e.g. by reading `getComputedStyle(document.documentElement).getPropertyValue('--zk-typescale-body-medium-size')`). If the token's resolved value already diverges from DESIGN.md, it's token-rooted — fixing the component selector would not help. If the token resolves correctly but the component selector overrides it, that's component-rooted — Generator can fix.

---

### D5. Status ownership

`tasks/work-status.md` is the single source of truth for work-unit state.
- The **Evaluator** is the sole writer. Only the Evaluator transitions a unit to `VERIFIED`, `NEEDS_FIX`, `STALLED`, or `OSCILLATING`.
- The **Generator** never writes to the status file. After it edits CSS and rebuilds, it writes a build receipt to `tasks/build-receipts/{unit-id}.md` and stops; the next Evaluator pass owns the status update.
- The **Orchestrator** (the main interactive session) only reads the status file and dispatches the next skill.

This makes the gate from "fixed" → "done" unforgeable by the Generator — only the read-only checker can declare success.

---

## Architecture

```
Orchestrator (main session)
   │  reads  tasks/work-status.md
   │  picks  next PENDING / NEEDS_FIX unit
   │
   ├──►  /zk-theme-evaluator <unit-id>
   │       reads   tasks/bundles/<unit-id>.md
   │       runs    Chrome getComputedStyle on each affected component
   │       writes  tasks/eval-reports/<unit-id>.md
   │       updates tasks/work-status.md → VERIFIED | NEEDS_FIX | STALLED | OSCILLATING
   │
   └──►  /zk-theme-generator <unit-id>      (only if status == NEEDS_FIX)
           reads   tasks/eval-reports/<unit-id>.md  +  tasks/bundles/<unit-id>.md
           proposes change list (contract)
           edits   the one CSS file
           runs    npm run build:css
           writes  tasks/build-receipts/<unit-id>.md
           returns (does not touch status)
```

### Skill 1: `/zk-theme-evaluator`
- **Role:** measure ZK preview against expected values; declare pass/fail
- **Tools:** Chrome browser (navigate, JS for `getComputedStyle`), Read — **never** Edit/Write CSS
- **Write scope:** `tasks/eval-reports/*.md` and `tasks/work-status.md` only
- **Reference sources:** by tier (see D2)

### Skill 2: `/zk-theme-generator`
- **Role:** translate an eval report into a CSS edit
- **Tools:** Read, Edit (CSS files only), Bash for `npm run build:css` — **no** browser, **no** status writes
- **Write scope:** the one CSS file named in the bundle + `tasks/build-receipts/<unit-id>.md`
- **Contract pattern:** before editing, prints the proposed change list mapped 1:1 to failing checks from the eval report

---

## 6 Harness Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **1. Context management** | Each invocation loads only one bundle (~1–3KB), not the whole repo |
| **2. Tool system** | Evaluator: browser + read. Generator: file-edit + build. Zero overlap |
| **3. Execution orchestration** | Orchestrator reads status, picks next unit, dispatches the right skill |
| **4. State machine** | `tasks/work-status.md` persists state across sessions; only Evaluator writes it |
| **5. Evaluation & observation** | Objective `getComputedStyle()` measurements; numeric pass/fail, not impressions |
| **6. Constraints & debugging** | Progress-based stall + oscillation detectors (D3); evaluator is the read-only guard |

---

## State Machine

```
PENDING
  └─► EVALUATING ─► VERIFIED                    (all checks pass)
                 └─► NEEDS_FIX
                       └─► FIXING ─► VERIFYING ─► VERIFIED
                                              ├─► NEEDS_FIX  (newly_passing > 0)  loop
                                              ├─► STALLED    (newly_passing = 0 × 2 iters)
                                              └─► OSCILLATING (failures[n] == failures[n-2])

(VERIFIED) ─► RE_EVAL_NEEDED   (when a sibling's Generator pass touches the shared CSS file)
```

After the Generator edits a shared file, every sibling listed in the edited component's bundle transitions from its current status (PENDING/VERIFIED/NEEDS_FIX) to `RE_EVAL_NEEDED`. The orchestrator must clear all `RE_EVAL_NEEDED` siblings before any of them can return to VERIFIED.

`STALLED` and `OSCILLATING` are terminal until human review.

Status file row schema:
```
| component | tier | shared-css-file | siblings | status | iter | failing-set-history |
```

---

## Bundle Format

`tasks/bundles/{component}.md`:

```markdown
# Component: {component}
tier: T1 | T2 | T3
shared-css-file: src/main/resources/web/js/zul/{path}/css/{file}.css
siblings: [other components sharing the same file, or empty list]
preview: http://localhost:8080/{component}.zul

## References
- MUI CSS: /Users/hawk/.../static-css-output/{MUI}.css         (T1/T2)
- Mira HTML: doc/mira/{page}.html                              (T1)
- DESIGN.md sections: §1 §5 §7 §10                             (all tiers)

## DOM key selectors
.z-{component} { ... }
.z-{component}-icon { ... }

## Expected values
| Selector | Property | Expected | Source |
|----------|----------|----------|--------|
| .z-textbox | height | 39px | DESIGN.md §10 |
| .z-textbox | border-radius | 4px | DESIGN.md §5 |
| .z-textbox:hover | border-color | rgba(0,0,0,0.87) | DESIGN.md §11 |
| .z-textbox:focus | border | 2px solid #376fd0 | DESIGN.md §11 |

## States to evaluate
- [ ] default
- [ ] hover
- [ ] focus-visible
- [ ] disabled
- [ ] readonly         (if applicable)
- [ ] invalid          (if applicable)
- [ ] {component-specific states}
```

---

## Eval Report Format

`tasks/eval-reports/{unit-id}.md`:

```markdown
# Eval Report: {unit-id}   status: {VERIFIED|NEEDS_FIX|STALLED|OSCILLATING}
iteration: {n}
date: {ISO}
failing-set: [check-id-1, check-id-3, ...]
newly-passing-since-last: [check-id-7]

## Per-component results

### {component-1}
| State | Check (id) | Selector | Property | Expected | Actual | Result |
|-------|-----------|----------|----------|----------|--------|--------|
| default | c1 | .z-textbox | height | 39px | 36px | FAIL |
| default | c2 | .z-textbox | border-radius | 4px | 4px | PASS |
| hover | c3 | .z-textbox:hover | border-color | rgba(0,0,0,0.87) | rgba(0,0,0,0.23) | FAIL |

### {component-2}
...

## Action required (only when NEEDS_FIX)
- c1: increase .z-textbox padding to reach 39px inner height
- c3: add .z-textbox:hover { border-color: rgba(0,0,0,0.87); }
```

---

## Implementation Work

### Step 1 — Directory skeleton

```
tasks/
  work-status.md                ← state machine; written only by Evaluator
  bundles/         <unit-id>.md ← one per CSS source file
  eval-reports/    <unit-id>.md ← one per evaluation pass (overwritten)
  build-receipts/  <unit-id>.md ← Generator's confirmation it edited+built
```

### Step 2 — Enumerate work units and populate `tasks/work-status.md`

Source the list from `doc/css-dsp-file-structure.md` plus the modified files in `git status`. Group by priority (A→E→B→C→D→F→G per `apply-mira-plan.md`). Tag each with its tier per D2.

### Step 3 — Pre-write bundle files

One bundle per unit (Step 2 enumeration). Source data from:
- `doc/component-dom-structures.md` for DOM selectors
- `doc/DESIGN.md` for expected values
- `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/INDEX.md` for the MUI mapping (T1 only)

Bundles are templates — they are the **shared contract** between Generator and Evaluator. Both skills load the same bundle, which is how tier-specific rules stay consistent across both agents.

### Step 4 — Write the Evaluator skill

`.claude/commands/zk-theme-evaluator.md`. Behaviour:
1. Receive `<unit-id>`; read `tasks/bundles/<unit-id>.md`
2. If no preview app running, abort with a clear message (orchestrator's responsibility to start it)
3. For each component listed in the bundle:
   - Open Chrome tab at the preview URL
   - For each state in the bundle: trigger the state (focus, hover via JS) and call `getComputedStyle()` on the listed selectors
   - Compare against expected values
4. Compute `failing-set`, `newly-passing-since-last` from previous report
5. Apply D3 stall/oscillation detectors using stored failing-set history
6. Write `tasks/eval-reports/<unit-id>.md`
7. Update the row in `tasks/work-status.md` with new status + failing-set history

### Step 5 — Write the Generator skill

`.claude/commands/zk-theme-generator.md`. Behaviour:
1. Receive `<unit-id>`; read `tasks/eval-reports/<unit-id>.md` and `tasks/bundles/<unit-id>.md`
2. **Contract step:** print a numbered list mapping each failing check to a proposed CSS change. No editing yet.
3. Edit the CSS file named in the bundle
4. Run `npm run build:css`
5. Write `tasks/build-receipts/<unit-id>.md` with file diff summary + build status
6. Return — do NOT touch `work-status.md`

---

## Critical Files

| Path | Role |
|------|------|
| `doc/DESIGN.md` | Authoritative expected values for the Evaluator |
| `doc/component-dom-structures.md` | DOM selectors for bundle generation |
| `doc/css-dsp-file-structure.md` | Enumeration of CSS source files |
| `/Users/hawk/.../material-ui-7.3.1/static-css-output/INDEX.md` | MUI mapping for T1 units |
| `doc/mira/*.html` | Offline Mira reference (49 pages) |
| `tasks/work-status.md` | State machine — Evaluator-writes-only |
| `tasks/bundles/*.md` | Per-unit shared contract between skills |
| `.claude/commands/zk-theme-evaluator.md` | Evaluator skill definition |
| `.claude/commands/zk-theme-generator.md` | Generator skill definition |

---

## Verification of the Harness Itself

The harness is correctly built when:
1. `/zk-theme-evaluator input.css` reports per-component, per-state measurements for all 6 input variants
2. After a `NEEDS_FIX` report, `/zk-theme-generator input.css` prints a change contract, edits `input.css`, and produces a clean build receipt
3. Re-running `/zk-theme-evaluator input.css` shows `newly-passing-since-last > 0` (proving the loop closes)
4. A deliberately oscillating fix (toggling two values across iterations) triggers `OSCILLATING` status within 3 iterations
