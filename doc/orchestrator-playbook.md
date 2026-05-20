# Orchestrator Playbook

How the main Claude session (any model — Opus, Sonnet, Haiku) drives the ZK-Material verification harness. This is the only file you need open to run the loop.

Companion docs: `doc/harness-plan.md` (architecture), `tasks/work-status.md` (state).

---

## Bundle selector convention

Preview pages render many instances of each component in different states. Bundles MUST use **structural anchor selectors** that point at exactly the canonical instance for each state (default, disabled, readonly, invalid, etc.), not bare class selectors.

See `tasks/bundles/textbox.md` Preview Anchors section as the reference example. When you write a new bundle or fix a flaky one, anchor on:
- `.pv-state-gallery.pv-variant-default .pv-state-col:nth-child(N)` for components that use the standard state gallery
- a text-match on `.pv-state-label` as fallback if positional indexing isn't reliable
- explicit attribute filters (e.g. `[readonly]`, `[disabled]`) when the variant isn't in a state gallery

The Evaluator must NEVER use bare `input.z-textbox` because the page has 20+ matches. The default-state row was originally measured against a sibling that interfered with focus measurement — anchoring fixes this.

---

## Pre-flight

Before the first dispatch in any session:

1. Verify preview app is reachable:
   ```bash
   curl -sI http://localhost:8080/textbox.zul | head -1
   ```
   Expect `HTTP/1.1 200`. If not, ask the user to start it:
   ```bash
   withjdk.sh 17 mvn test exec:java@preview-app
   ```

2. Verify the two agents are registered in the running session. The Task tool's available-agent list (shown at session start) must include `zk-theme-evaluator` and `zk-theme-generator`. If not, the user must restart Claude Code — agents in `.claude/agents/` are loaded only at session boot.

3. Read `tasks/work-status.md` to load current state.

---

## Main loop

Repeat until every row is `VERIFIED`, `STALLED`, `OSCILLATING`, `CONSTRAINT`, or `ESCALATED_TOKEN_FIX`:

### Step 1 — Pick the next work batch

Compute two batches from `tasks/work-status.md`:

**Evaluator batch (parallel, up to 4):**
- All rows in `RE_EVAL_NEEDED` status (highest priority — these block siblings)
- Then rows in `PENDING` or `NEEDS_FIX` that don't have an open eval report
- Order: Group A → E → B → C → D → F → G (per `apply-mira-plan.md`)
- Cap at 4 per batch (Chrome handles 4 tabs comfortably; more risks slowdown)

**Generator batch (serial, 1 at a time):**
- All rows in `NEEDS_FIX` status WITH an Action-required section that is not flagged `TOKEN_FIX_REQUIRED`
- Pick exactly 1 per outer loop iteration
- Build serialization: `npm run build:css` writes to `target/classes/web/marble/` non-atomically; concurrent builds race. Even though different Generators edit different CSS source files, their builds would clobber each other.

### Step 2 — Dispatch the Evaluator batch (parallel)

Issue **one message with multiple Task tool calls** (this is what makes them parallel):

```
Task(
  description="Evaluate textbox",
  subagent_type="zk-theme-evaluator",
  prompt="Component: textbox\n\nFollow your agent definition. Use a fresh Chrome tab."
)
Task(
  description="Evaluate button",
  subagent_type="zk-theme-evaluator",
  prompt="Component: button\n\nFollow your agent definition. Use a fresh Chrome tab."
)
Task(
  description="Evaluate grid",
  subagent_type="zk-theme-evaluator",
  prompt="Component: grid\n\nFollow your agent definition. Use a fresh Chrome tab."
)
Task(
  description="Evaluate checkbox",
  subagent_type="zk-theme-evaluator",
  prompt="Component: checkbox\n\nFollow your agent definition. Use a fresh Chrome tab."
)
```

Wait for all four to return.

### Step 3 — Merge Evaluator results

Each Evaluator emits a status-row update (its agent definition tells it to update `tasks/work-status.md` directly). With parallel Evaluators there's a file-write race. The orchestrator handles this:

- After all Evaluators return, **re-read `tasks/work-status.md` and check for missing rows / duplicate writes**.
- If a row looks stale or wrong, read the corresponding `tasks/eval-reports/<component>.md` (single-writer per file) — that is the authoritative source of truth.
- If two Evaluator writes interleaved, manually reconcile by reading each eval report and rewriting the affected rows.

**Cheaper alternative if races become frequent:** ask the user to switch to "Evaluator emits status delta in its return value, orchestrator merges" by editing the agent definition. For now, the file-rewrite-is-quick assumption holds because rows are short.

### Step 4 — Triage results

For each Evaluator return:

| Result | Action |
|--------|--------|
| `VERIFIED` | Mark done. Continue to next loop iteration. |
| `NEEDS_FIX` with no `TOKEN_FIX_REQUIRED` in Action-required | Queue for Generator (Step 5). |
| `NEEDS_FIX` with `TOKEN_FIX_REQUIRED` | Append the component + check ids to `tasks/token-issues.md`. Flip status to `ESCALATED_TOKEN_FIX` in work-status.md. Generator is NOT dispatched. |
| `NEEDS_FIX` with `LIBRARY_CONFIG_REQUIRED` (T3 only) | Append the component + check ids + reason to `tasks/library-config-issues.md`. Flip status to `ESCALATED_LIBRARY_CONFIG`. Generator is NOT dispatched (fix needs widget `.ts`/`.java` work, not CSS). |
| `STALLED` / `OSCILLATING` | Append the component to `tasks/escalation.md` with the failure history. Stop loop iteration for this component; ask user before retrying. |
| `EVALUATING_BLOCKED` | Preview app died mid-run. Stop the loop, alert user to restart. |

### Step 5 — Dispatch one Generator (serial)

Pick the highest-priority `NEEDS_FIX` component (per group order). Verify no other component with the same `shared-css-file` is currently in `FIXING` (read work-status.md). Then:

```
Task(
  description="Generate fix for textbox",
  subagent_type="zk-theme-generator",
  prompt="Component: textbox\n\nFollow your agent definition: read eval report, print contract, edit input.css, run npm run build:css, write build receipt."
)
```

Wait for it to return.

### Step 6 — Handle Generator result

Read `tasks/build-receipts/<component>.md`:

- **`build: PASS`** with `Sibling impact: RE_EVAL_NEEDED for: ...`:
  - For each sibling listed, edit `tasks/work-status.md` to flip that sibling's status to `RE_EVAL_NEEDED`.
  - Also flip the just-generated component to `RE_EVAL_NEEDED`.
- **`build: PASS` with no siblings**: flip just the component to `RE_EVAL_NEEDED`.
- **`build: FAIL`**: stop the loop, report the build error to user, do NOT flip status.

### Step 7 — Loop

Go to Step 1.

---

## Parallel execution rules — summary

| Phase | Concurrency | Reason |
|-------|-------------|--------|
| Evaluator | up to 4 parallel | Each uses its own Chrome tab; eval reports are one-file-per-component (no write conflict). Status-file race is small and recoverable. |
| Generator | strictly 1 at a time | `npm run build:css` writes `target/` non-atomically; concurrent builds race. |
| Mixed Eval+Gen | OK in same outer iteration | Evaluator reads CSS files (no edits); Generator edits and rebuilds. They don't conflict if they target different components — but for clarity, run Eval batch, then Gen, then re-Eval. |

**File-lock invariant.** The orchestrator enforces the lock by **not dispatching** a second Generator while the first is still running, and by **not dispatching** an Evaluator on a component whose `shared-css-file` matches a currently-running Generator's target (avoids reading mid-edit CSS).

In practice this is easy: the orchestrator runs synchronously between dispatches. Each Task tool call blocks until the agent returns. So serializing Generators is just "don't issue a second Task call until the first returns."

---

## Stop conditions

The orchestrator stops the loop and reports to the user when:

1. All rows are in a terminal state (`VERIFIED`, `STALLED`, `OSCILLATING`, `CONSTRAINT`, `ESCALATED_TOKEN_FIX`).
2. `tasks/escalation.md` has new entries since the last user check-in.
3. A Generator build fails.
4. Preview app dies (any `EVALUATING_BLOCKED` return).
5. The user types `/stop` or interrupts.

---

## Reading the status file at a glance

```bash
# Count rows by status
grep -E '^\| [a-z]' tasks/work-status.md | awk -F'|' '{print $6}' | sort | uniq -c
```

```bash
# List next eligible components for Evaluator batch
awk -F'|' '$6 ~ /(PENDING|NEEDS_FIX|RE_EVAL_NEEDED)/ {print $2 $6}' tasks/work-status.md
```

---

## Token escalation (D6)

When the Evaluator detects a check failing because a `--zk-*` token value diverges from DESIGN.md (e.g. `--zk-typescale-body-medium-size` is 14px but DESIGN.md §7 says 13px), the Evaluator marks the check `FAIL` and adds `TOKEN_FIX_REQUIRED: <token-name>` to the Action-required section.

The orchestrator:
1. Does NOT dispatch the Generator for that component.
2. Appends a row to `tasks/token-issues.md`:
   ```
   | token | expected | actual | first-detected-in | components-blocked |
   |-------|----------|--------|--------------------|---------------------|
   | --zk-typescale-body-medium-size | 13px | 14px | textbox c2 | textbox, intbox, … |
   ```
3. Sets the component status to `ESCALATED_TOKEN_FIX`.
4. Reports the token issue to the user; token fixes are a separate manual review (token changes affect the whole theme).

After the user fixes the token, they run `npm run build:css` and re-dispatch the Evaluator on all `ESCALATED_TOKEN_FIX` components (flip their status to `RE_EVAL_NEEDED` first).

---

## Example session walk-through

```
[orchestrator] reads work-status.md
[orchestrator] picks Evaluator batch: textbox, button, grid, checkbox  (Group A+E+C+B first row each)
[orchestrator] dispatches 4 Task() calls in one message
[evaluator-1]  measures textbox, writes report, status=NEEDS_FIX, action requires TOKEN_FIX for c2,c8
[evaluator-2]  measures button, writes report, status=NEEDS_FIX, action lists 3 component-level fixes
[evaluator-3]  measures grid, writes report, status=VERIFIED
[evaluator-4]  measures checkbox, writes report, status=NEEDS_FIX, 2 component-level fixes
[orchestrator] reads all 4 reports
[orchestrator] textbox → ESCALATED_TOKEN_FIX (append to token-issues.md)
[orchestrator] grid → done
[orchestrator] queues button + checkbox for Generator (different shared-css-files, but Generator is serial anyway)
[orchestrator] dispatches Generator for button
[generator-1]  reads eval-reports/button.md, prints contract, edits button.css, builds, writes receipt
[orchestrator] flips button status to RE_EVAL_NEEDED
[orchestrator] dispatches Generator for checkbox
[generator-2]  edits checkbox.css (siblings: [radio]), builds, writes receipt with "RE_EVAL_NEEDED for: radio"
[orchestrator] flips checkbox AND radio to RE_EVAL_NEEDED
[orchestrator] loop → picks next Evaluator batch including button, checkbox, radio + 1 more fresh component
[…]
```

---

## Spec-Author phase (pre-loop)

Before the ralph-loop can run on a component, that component must have a user-approved theme contract. The spec-author phase produces it.

### When to run `zk-spec-author <component>`

Trigger spec-author when either condition holds for the component's bundle:

- The bundle's frontmatter is missing a `rules:` line (no link to a skill component file).
- The bundle's frontmatter has `contract-approved: false` (or the line is missing entirely).

The orchestrator should NOT dispatch the evaluator on such a component — the evaluator's §0a gate will refuse with `BLOCKED: contract-approved=false`. Route to spec-author instead.

### Approval gate

After `zk-spec-author <component>` produces (or updates) the artifacts:

1. `.claude/skills/zk-component-rules/components/<component>.md` (structural facts only — DOM tree, state classes, composition invariants).
2. `tasks/bundles/<component>.md` (theme contract — tokens, references, expected values, State matrix).
3. `doc/contracts/<component>.html` (static mockup rendered with `--zk-*` tokens).
4. `doc/contracts/baselines/<component>-iceblue.png` (iceblue reference screenshot).

…the **user** reviews items 1 and 3 side-by-side against item 4. Only the user may flip `contract-approved: true` in the bundle's frontmatter. The orchestrator never flips this flag autonomously.

Once approved, the orchestrator re-enters the main loop normally; the evaluator's §0a gate now passes and measurement proceeds.

### js-source-hash drift recovery

If the evaluator returns status `BLOCKED: js-source drift — re-run zk-spec-author <component>` (and appends a `js-drift` entry to `tasks/skill-gaps.md`), the underlying ZK JS source has changed since the contract was authored. The recovery flow:

1. Re-run `zk-spec-author <component>`. The agent re-reads the JS source, re-derives the structural section, refreshes the bundle's `js-source-hash:` field, and (if structural facts changed) flips `contract-approved:` back to `false`.
2. If `contract-approved:` was flipped to `false`, repeat the approval gate above. If spec-author determined the structural facts were unchanged, it may keep `contract-approved: true` after refreshing only the hash — but the user should still spot-check.
3. The orchestrator resumes the main loop; the evaluator's §0a and §0b gates both pass and measurement proceeds.

---

## When the orchestrator should ask the user

- Token escalation accumulates ≥ 3 components blocked on the same token (probably a real spec issue).
- Stalled or oscillating component (D3 terminal states).
- Preview app stops responding.
- More than 5 consecutive components verified — good time to checkpoint progress with the user.
