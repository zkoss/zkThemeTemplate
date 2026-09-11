# P3 gate — the cold-start drill (D203-A): scrollview's Marble CSS, from zk alone

Status: written 2026-09-11 (P3 session). This file is the ONLY input the drill session receives; it is pasted as the first message of a
fresh Claude Code session whose working directory is `/Users/hawk/Documents/workspace/ZK10/zk`, with no `/add-dir` and no other
context. The external Evaluator (a different fresh session) judges the result with `tools/verify-p3-gate.sh static <transcript>` and
`… live`; the verdict goes to `gates/P3.md`. Nothing below the rule may mention the theme template, its path or its documents — the
drill must find everything it needs inside zk (the point of P3).

---

You are working in the ZK Framework repository (this directory) on the Marble theme, ZK 11's default look-and-feel. The task is one
component: **scrollview** (an EE layout component in the sibling checkout `../zkcml`, module `zkmax`) renders **unstyled** today — its
stylesheet is an empty placeholder that the CSS build emits so the framework's per-widget lookup does not 404. Give it its Marble CSS.

What "done" means:
1. `../zkcml/zkmax/src/main/resources/web/js/zkmax/layout/css/scrollview.css` exists and styles the component per its contract at
   `doc/contracts/scrollview.md` (start there: it names the DOM selectors, the expected values and the preview page). Follow the theme's
   own rules — read `.claude/skills/marble-theme/SKILL.md` first and go where it points; the specifications under `doc/spec/` and the
   component notes under `.claude/skills/zk-component-rules/` are yours to use. Marble uses `--zk-*` custom properties, no hardcoded
   colours and no `!important`.
2. The empty placeholder is retired: the CSS build (`scripts/build-css.js`) must stop listing `scrollview.css.dsp` as a stub, so the
   built `scrollview.css.dsp` under `../zkcml/zkmax/codegen/…` is the real stylesheet. The build and the coverage check must pass for
   the `zkmax` module (the skill tells you the commands).
3. Verify it visually and by computed styles against the running preview module (the skill's verification reference tells you how the
   preview host is started and where the Playwright harness lives). The gallery baseline for scrollview
   (`zkpreview/doc/screenshots/scrollview-gallery.png`) currently shows the unstyled component: re-cut that one baseline with the harness
   (`--update-snapshots`, gallery project, scrollview only) so it shows your styling. Do not touch any other baseline.
4. Leave the work uncommitted in both repositories (`zk`: `scripts/build-css.js` and the one baseline; `../zkcml`: the CSS file). Do not
   commit, stage, branch or reset anything.

Constraints:
- Everything you need is in this repository and `../zkcml`. Do not open, search or reference any other directory on this machine.
- Keep the change to scrollview: one CSS file in `../zkcml`, the stub-list edit in `scripts/build-css.js`, one re-cut baseline. If a
  contract row cannot be satisfied without touching something else, stop and write down why instead of widening the change.
- When you finish, write a short summary (what you read, what you changed, what you ran and what it printed) as your last message.
