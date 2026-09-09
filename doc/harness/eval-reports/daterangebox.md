# Eval Report: daterangebox   status: BLOCKED: chrome-mcp-unavailable
iteration: 0
date: 2026-07-17T00:00:00Z
tier: T2
failing-set: []
newly-passing-since-last: []
row-coverage: 0/40 (unmeasured — blocked before §3b)

## Pre-flight gates (completed successfully)

- **0a contract-approval gate: PASS** — `doc/contracts/daterangebox.md` line 6 reads `contract-approved: true`.
- **0b js-source-hash drift check: PASS (no drift)** — contract declares
  `js-source-hash: d7a2c4c16983baa5501152e3799fb8bba4e451c3d48b070d718e2e041503d04c`
  for `js-source-files` (in listed order: `DaterangePopup.ts`, `Daterangebox.ts`,
  `mold/daterangebox.js`). Recomputed via
  `cat Daterangebox.ts DaterangePopup.ts mold/daterangebox.js | shasum -a 256`
  (note: matching order is Daterangebox.ts, DaterangePopup.ts, mold — not the
  frontmatter's listed order) → **exact match**, hash confirmed, no re-authoring needed.
- **Preview app reachability: PASS** — `curl -sI http://localhost:8080/daterangebox.zul` → `HTTP/1.1 200`.
- **Icon-coverage pre-render check (§2.6): PASS**
  - Scope A (preview ZULs): no `z-icon-*` literals found in `daterangebox.zul` or
    `pv/daterangebox-content.zul` (the preview pages use only the framework-rendered
    trigger icon, no page-local icon literals).
  - Scope B (ZK widget-emitted): grepped `Daterangebox.ts` for icon literals — widget
    emits exactly one, `<i class="z-icon-calendar">` (Daterangebox.ts:883). Confirmed
    `node_modules/lucide-static/icons/calendar.svg` exists. No `FA_TO_LUCIDE` alias needed.

## BLOCKING ISSUE — Chrome MCP tools unavailable in this session

This evaluator's workflow requires `mcp__claude-in-chrome__*` tools (`navigate`,
`javascript_tool`, `gif_creator`, etc.) for Step 3 onward: opening the preview page,
triggering the daterangebox popup (click input/button — no `.z-daterangebox-open`
root class exists per the contract, so the popup can only be found by actually
opening it), measuring computed styles for the 40 `c1`–`c40` Expected-values rows,
capturing screenshots, and running the macro-assertion (`M1`–`M10`) geometry checks.

I checked for these tools via `ToolSearch` under several queries
(`"claude-in-chrome"`, `"chrome"`, `"gif_creator"`, `"javascript_tool"`,
`"upload_image"`, `"browser screenshot navigate tab"`) and none resolved — the
Chrome-in-Chrome MCP server is not connected/available in this session at all (it
is absent from both the top-level tool list and the deferred-tool list surfaced at
session start).

**No measurement, screenshot capture, or macro-assertion check was performed.**
Nothing in §3b/§3b-frozen/§3b-macro/§3c/§3d ran. Per the harness's Evaluator role
boundary, I will not fabricate computed-style values or screenshots — this report
stops here.

## Action required (orchestrator)

- Reconnect/enable the `claude-in-chrome` MCP server for this workspace, then
  re-dispatch `/zk-theme-evaluator daterangebox`. All pre-flight gates above are
  already confirmed green and do not need to be re-run unless the contract or JS
  source changes.
- Note for the re-run: the popup has no `.z-daterangebox-open` root class (per
  contract/skill) — the popup must be opened by clicking an input or the trigger
  button, then measuring `.z-daterangebox-popup` and its descendants. Readonly
  rows will correctly refuse to open the popup — that is expected per the contract,
  not a failure, but it means the popup-open state checks (`c21`–`c40`, `M6`–`M10`)
  must be exercised via a non-readonly, non-disabled row (the "Seeded range" row in
  `pv/daterangebox-content.zul` is a good candidate — it has a committed begin/end
  range for the `M9` range-highlight check).
- Range-highlight checks (`c37`–`c40`, `M9`) additionally require a preview row
  with hoverPreview / an uncommitted second date to exercise `-preview-mid` /
  `-preview-end` — confirm the current preview page seeds this, or note it as a
  contract-vs-preview gap if not.
