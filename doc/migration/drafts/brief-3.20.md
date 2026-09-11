# Generator brief — item 3.20, the D69-B forced-colors fix in zk (selected tree row / organigram node focus ring)

Status: written 2026-09-11 (P3 session) after chat D205-A. Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.20,
`{COMMON_RULES}` shared. RED must be on record before this runs: the Planner hand-runs `bash doc/migration/tools/verify-3.20.sh probe red`
on the pre-fix tree (both probe tests fail with "Highlight on Highlight") and pastes the output into the gate. Planner dry-run of
`verify-3.20.sh static`: `environment` passes, stops at `the tokens file changed, and only it`.

---

You are the GENERATOR for item 3.20 of the Marble → zk migration (P3). One CSS edit in zk, nothing else. Under Windows High-Contrast
(`forced-colors: active`) Marble fills a SELECTED item with the system colour `Highlight` and its keyboard focus ring (`--zk-focus-ring`) is
`Highlight` too, so the ring disappears on selected items. The `(2a focus)` rule in `tokens/_forced-colors.css` already re-points the ring to
`HighlightText` — but only for the navbar item. The harness's focus-ring scan showed the same collision on the selected tree row and the
selected organigram node (finding F61); you extend the rule to those two families. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.20.sh static`, then `… probe green`, then `… scan`; run
`static` yourself as your self-check (the other two start the preview module — leave them to the verifier).

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly one file: /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/zul/css/tokens/_forced-colors.css.
  Nothing else in zk (no `.css.dsp` — it is generated, gitignored, and rebuilt by the verify), nothing in `../zkcml`, nothing in the template
  (D69-B: the template stays as it is; the end state is zk).
- Do not touch any other rule, comment or blank line in the file. Do not add a `paging` selector (out of scope: F61 measured tree row
  and organigram node only; the paging button passes the scan today).

READ: /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/zul/css/tokens/_forced-colors.css lines 155–205 only (the
`(2a)`, `(2a-cont)` and `(2a focus)` blocks — about 3 KB). Nothing else.

FACTS:
- The selected-fill rules already in the file are `(2a)`: `.z-treerow.z-treerow-selected, .z-treerow.z-selected { background-color: Highlight; … }`
  and `(2a-cont)`: `.z-orgitem-selected > .z-orgnode { background-color: Highlight; … }`. The focus ring you fix must use the SAME element
  the fill is on — the `<tr>` for the tree row, the `.z-orgnode` for the organigram — so the selectors mirror those exactly.
- The `(2a focus)` rule today:
      .z-navitem-selected > .z-navitem-content:focus-visible,
      .z-navitem.z-navitem-selected > .z-navitem-content:focus-visible {
          outline-color: HighlightText;
      }
  Its comment ends with "Only navbar is covered here; the other selected-tint families are queued in doc/skill-gaps.md 2026-09-04."
- The file has exactly one `@media (forced-colors: active) {` (line 17) and no rule outside it; that must stay true (it is why this change
  cannot move a pixel in the gallery / state / tablet screenshots).

WRITE (one file, two edits):
1. In the `(2a focus)` rule, add three selectors so the selector list reads, in this order:
      .z-navitem-selected > .z-navitem-content:focus-visible,
      .z-navitem.z-navitem-selected > .z-navitem-content:focus-visible,
      .z-treerow.z-treerow-selected:focus-visible,
      .z-treerow.z-selected:focus-visible,
      .z-orgitem-selected > .z-orgnode:focus-visible {
          outline-color: HighlightText;
      }
   Four-space indentation like its neighbours; the declaration block is unchanged.
2. In the same block's comment, replace the sentence "Only navbar is covered here; the other selected-tint families are queued in
   doc/skill-gaps.md 2026-09-04." with "Covers navbar, tree row and organigram node (tree row / org node added 2026-09-11 after the
   focus-ring scan caught the collision, F61 of the migration notes); listbox row and accordion tab have no outline to fix — see the
   scan's notes." Re-wrap the comment lines to the block's existing width; do not change its first sentences.
   Expected diff: about 5 added and 2 removed lines, this file only.

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/zkThemeTemplate && bash doc/migration/tools/verify-3.20.sh static` — it must
end with `3.20 static ok — …`. A `FAIL at:` line goes into blockers verbatim; stop there. Do not run `probe` or `scan`; do not edit the
verify script or the probe.
