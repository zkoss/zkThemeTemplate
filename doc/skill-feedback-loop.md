# Skill Feedback Loop

How manual gap-fixes turn into structural improvements instead of one-off patches.

## The problem this solves

The harness drives off theme references (MD3, MUI). When ZK has a feature **without** a theme analog, the Evaluator never measures it, the Generator never implements it, and the bug ships silently. We saw this with `inplace` state — 6 input components shipped without inplace styling before someone noticed.

There will be more: `borderlayout` JS engine, `splitter` cursor mode, `bandbox` custom popup, `checkbox` toggle mold, `calendar` today-class oddity, `colorbox`, `slider` molds, `combobutton` pointer-events, etc.

Fixing each one in CSS isn't the failure — the failure is fixing it without changing **what the harness sees next time**.

## The principle

Every manual gap-fix lands at exactly one of three layers. Always pick the highest layer the fix can live in.

| Layer | What lives here | Half-life |
|-------|-----------------|-----------|
| **1. Skill** (`.claude/skills/zk-component-rules/`) | ZK characteristics that any future theme also needs | Forever (survives a theme rewrite) |
| **2. Contract template** (`doc/contracts/<component>.md` schema) | What to verify and where to look for the canonical value | Until the contract format is overhauled |
| **3. Agent workflow** (`zk-theme-{generator,evaluator}.md` §1.3 / §1.5) | Process gates that force the agent to look at the right thing | Until the harness is replaced |

## Test-first is non-negotiable

Every fix follows TDD — this applies to **any** defect that will result in a code change, whether the harness surfaced it as a gap or someone filed it as an ordinary bug report. Before writing a single line of CSS:

1. **Encode the defect as a failing test first.** A contract assertion (evaluator-run) *and* a Playwright regression test (`src/test/playwright/`, CI-run). Run them and confirm they are **RED** against the current buggy build — this proves the harness can actually see the defect.
2. **Only then write the fix.** The defect is done when that same test turns **GREEN**.

A test that was never observed to fail guards nothing. The detailed procedure lives in [Step 1](#step-1--log-it-before-fixing-it) (write the failing test) and [Step 4](#step-4--re-verify-the-gap-is-caught) (prove the RED→GREEN transition); this rule is why those steps are mandatory, not optional.

## Decision rule

Ask three questions in order. Stop at the first **yes**.

1. **"Would any future ZK theme (Sapphire, corporate dark mode, Bootstrap-style) also need to know this?"**
   → **Skill**. Add a file under `reference/` or `components/`.

2. **"Is this about *what to check* for a specific component or family?"**
   → **Contract template extension**. Adjust the schema so every contract of this kind declares it.

3. **"Would the agent have caught it if it had been forced to look at one more thing?"**
   → **Agent workflow step**. Add to §1.3 (Generator) or §1.5 (Evaluator).

A single gap may need fixes at multiple layers. `inplace` needed all three:
- Skill: `reference/inplace-state.md` (the canonical patterns)
- Contract: `Inplace` must appear in the states-to-evaluate checklist of every input contract
- Agent: Generator §1.3 now mandates reading `reference/inplace-state.md` when the failing-set touches inplace

## Workflow when you find a gap

### Step 1 — Log it before fixing it

Append a row to `doc/skill-gaps.md`:

```markdown
| date | component(s) | gap | why-harness-missed-it | layer | fix-location |
|------|--------------|-----|------------------------|-------|--------------|
| 2026-05-13 | datebox, timebox, spinner, bandbox, combobox, textbox-family | inplace state was never styled | MD3 has no inplace concept; contracts had no `inplace` check | skill + contract + agent | `reference/inplace-state.md`, contract states-checklist, generator §1.3 |
```

The log is append-only. Never edit past rows.

**Encode the gap as a failing assertion before writing any CSS.** This applies to *any* defect that will result in a code change — a harness-surfaced gap or an ordinary bug report both start here. Add the missed check as a new row in `doc/contracts/<comp>.md` (or a corrected check in the skill's component file) *first* — the evaluator should now fail on the next run. This proves the harness can *see* the gap; only then fix the CSS. If the gap is that an existing row asserts the wrong value, correct that row instead of adding a new one. Fixing CSS before the assertion exists means the next sibling sweep silently re-introduces the same bug.

**Also add a Playwright regression test — failing-first.** The contract row is verified by the (agent-run) evaluator; a Playwright test is the *automated, CI-able* guard that catches the regression on every run with no agent in the loop. For **every gap that results in a code fix**, add a test to the Playwright suite (`src/test/playwright/`) *before* fixing the CSS and confirm it **FAILS** against the current (buggy) build. Pick the cheapest shape that captures the gap:

- **Computed-style / geometry assertion** (most gaps): read `getComputedStyle` / `getBoundingClientRect` / `document.styleSheets` via `page.evaluate` and assert the token, colour, size, `display`, or overflow the contract row names. Add to `screenshot.spec.ts` (chromium project).
- **Behavioural**: drive a real interaction (`click`, `type`, `setViewportSize`) then measure — popup drop direction, outside-click close, focus layout-shift, scrollbar interactions. A real click often reproduces what programmatic `wgt.open()` cannot.
- **Visual baseline**: `toHaveScreenshot` when the gap is purely visual and impractical to assert numerically.

Tablet/touch gaps go in `tablet.spec.ts` (tablet project, mobile UA). A gap that resolves to **not-a-bug** (no code change) needs no test — note that in the row. Record the test's `describe`/title in the `fix-location` column alongside the CSS/skill paths.

### Step 2 — Apply the decision rule

For each row in the log, ask the three questions. Write the chosen layer(s) in the `layer` column **before** writing CSS.

### Step 3 — Backfill at the chosen layer

- **Skill**: write a new `reference/<topic>.md` or `components/<name>.md`, or extend an existing one. Cross-reference: the existing `inplace-state.md` is the template — pattern + checklist + measurement notes.
- **Contract**: if the schema needs a new field, **update every existing contract** at the same time (not just the one in front of you). Otherwise future runs read inconsistent contracts.
- **Agent**: add a numbered sub-step under §1.3 (Generator) / §1.5 (Evaluator). State the trigger ("if failing-set contains a check on X, read Y") explicitly.

### Step 4 — Re-verify the gap is caught

Run the harness on the original component **without** giving the agent the manual fix. The agent should now produce the right CSS on its own. If it doesn't, the fix is at the wrong layer — go back to Step 2.

Then run the Playwright regression test you wrote in Step 1: it must now **pass** (it failed before the fix). That failing-then-passing transition is the proof the test actually guards the gap — a test that is green both before and after the fix guards nothing. Keep it green in CI so the regression cannot return silently.

### Step 5 — Sweep for siblings

A gap in one component usually means the same gap exists in others. After fixing the layer, run the harness on every component that could be affected. Don't wait for them to be reported individually.

## What goes in the Skill vs. DESIGN.md

This is the most common confusion. Use the test:

> **"If we switched from MD3 to a different theme, would this rule still hold?"**
> - Yes → Skill (it's a ZK property)
> - No → `doc/spec/DESIGN.md` (it's a theme choice)

Examples:
- "Bandbox's popup frame is `.z-bandbox-popup`, content is `.z-bandpopup` — never border the content" → Skill (true for every theme)
- "Bandbox popup uses 4px corner radius and elevation-1 shadow" → DESIGN.md (this theme's choice)
- "Slider has no `.z-slider-disabled` class — style via `[disabled]`" → Skill (ZK fact)
- "Slider thumb is 20×20px with primary colour" → DESIGN.md (theme choice)

## Anti-patterns

### "Fix the CSS, move on"
The single worst outcome: the failing component now looks right, but the next Generator pass on a sibling component repeats the same mistake. The harness has not learnt anything. Mandatory log entry first.

### "Fix first, test later"
Writing the CSS and then back-filling a test that was never seen to fail guards nothing — a test green both before and after the fix proves only that it doesn't test the defect. The failing test comes *first* (see [Test-first is non-negotiable](#test-first-is-non-negotiable)); a fix without a RED→GREEN transition is not done.

### "Add a one-off comment in the CSS file explaining the gap"
Comments rot. The next person editing the file removes them. Put it in the skill where it survives.

### "Patch DESIGN.md with a ZK-specific note"
DESIGN.md is theme-specific. ZK characteristics in DESIGN.md get lost when a new theme is built. Use the skill.

### "Update only the contract, skip the skill"
Contracts are per-component. Without a skill rule, a new component contract is written from scratch and re-introduces the gap.

## Triage: which artifact owns the gap?

After the two-category split (spec-author pipeline), every `doc/skill-gaps.md` row routes to exactly one of three artifacts. Pick the artifact before writing any fix.

| Symptom | Root cause | Fix location |
|---------|------------|--------------|
| Selector / state-class / DOM-tree claim in the skill is wrong or missing | **Rules wrong** | `.claude/skills/zk-component-rules/components/<comp>.md` (or `reference/<topic>.md` for cross-cutting rules) |
| Selector + structure are correct but the contract asserts the wrong token / color / spacing / shape | **Theme assertion wrong** | `doc/contracts/<comp>.md` (Expected-values table or State matrix); if the visual contract itself was wrong, also fix `doc/contracts/<comp>.html` and re-run the approval gate |
| Skill + contract are correct but the CSS implementation does not realize them | **Implementation wrong** | Re-run the ralph-loop generator iteration; no documentation change needed |

A single gap can route to more than one artifact (e.g. an unknown state class that was never enumerated AND was never asserted in the contract); record each affected layer in the `layer` column.

The `js-drift` tag is special: it indicates the evaluator detected a `js-source-hash` mismatch. Route those to `zk-spec-author <comp>` per the orchestrator playbook's drift-recovery flow, not directly to one of the three artifacts.

## Periodic review

After every N components verified (say, 10), scan `doc/skill-gaps.md` for clusters:

- **Same root cause appears 3+ times?** That's a missing top-level rule. Promote it to a `reference/` file even if no individual gap requires it.
- **All gaps in one quarter target the agent layer?** The agents are under-specified. Audit the §1.3 / §1.5 checklists.
- **All gaps in one quarter target the skill layer?** The skill has known unknowns. Spend a session reading ZK source (`/Users/hawk/Documents/workspace/ZK10/zk/zul/`) to find the next batch proactively.

## Indicators that a gap deserves a Skill entry

Strong signals (almost certainly Skill-worthy):
- The fix would apply to 2+ components
- The fix could not be derived from MD3/MUI reference alone
- The fix changes which DOM element gets the rule, not just the value
- The fix uses a CSS feature ZK relies on (e.g. `:has(br)` for vertical button)

Weak signals (probably DESIGN.md):
- The fix only changes a colour, padding, or radius
- The fix is "use the same value as <sibling-component>"
- The fix is a token-rooted issue

## When to stop

This loop has diminishing returns. After ~15 components have been swept with no new structural gaps appearing, the harness is probably converged. Remaining failures are per-component theme choices, which DESIGN.md owns.
