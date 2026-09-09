# Working the P1 backlog — session strategy

Answers the question "one long session with repeated /compact, or a fresh session per
issue?" for the 51 in-scope Jess-review issues ([jess-review-triage.md](jess-review-triage.md)).

**Recommendation: one session per CLUSTER of issues, not per issue, and at most one
compaction per session.**

---

## Why not one long session with repeated /compact

Compaction is lossy re-summarisation. The first one is cheap; the second summarises a
summary, and precision about *what was already verified* degrades fastest — which is
exactly the information this workflow depends on ("is #43 fixed and commented, or fixed and
not commented?"). It also carries a growing pile of context that no longer pays rent: 40
issues from now, the notification/toast reasoning is dead weight.

## Why not a fresh session per issue

Roughly 15-25k tokens of setup per session (CLAUDE.md, memory, the triage board, the
component's CSS, the matching MUI file). For a cluster of six issues in one CSS file
(`grid.css` — #34-#39) that setup would be paid six times over, and the second issue in a
file is much cheaper than the first once the file, its DOM structure and its MUI reference
are already in context.

## The rule

1. **Group the work by CSS file / component before starting.** The triage board is already
   ordered that way. One cluster = one session.
2. **End the session when the cluster is done**, not when the context runs out.
3. **Allow one compaction.** If a second is about to trigger, that is the signal to commit,
   update the board, and open a new session — the cluster was too big.
4. **Commit and update the board before ending a session**, always. The board is the
   handoff; nothing important may live only in conversation.

## What survives a session boundary (so a new session costs less than it looks)

- The preview app on :8080 and the CSS watch on :50000 are machine-level, not session-level.
  Do not restart them.
- [jess-review-triage.md](jess-review-triage.md) carries the status board, the 7-step fix process and the
  verdict vocabulary.
- [jess-review-deferred.md](jess-review-deferred.md) carries the 26 out-of-scope issues.
- The `hawkchen/marble-issue` tracker is the source of truth for open/closed.

## The machine-local gap — closed 2026-09-09

This section used to warn that the board lived in a gitignored directory and was therefore
**local to this machine only**. That gap is closed: the board and the other Jess documents
moved into `doc/jess-review/` and are tracked, so the work can now be picked up from a clean
clone or by another person. The tracker remains the source of truth for issue state.

## Concurrency warning (observed 2026-09-04)

More than one Claude Code session can be editing this repository at the same time. On
2026-09-04 a second session added forced-colors + nav work (`_forced-colors.css`,
`nav.css`, `forced-colors.spec.ts`, `screenshot.spec.ts`) while this session was running
the Playwright suite. Consequences to plan around:

- **Check `git status` before staging, and stage explicit paths only.** Never `git add -A`.
- **A full `npm run screenshot:test` is not safe to interpret** when another session is
  editing CSS: the `forced-colors-gallery` project *writes* baselines rather than comparing
  them, so a full run dirties `doc/screenshots/` and you cannot tell your churn from theirs.
  Prefer the computed-style projects (`reset`, `framework`, `component-theming`, `print`,
  `forced-colors`, `responsive`, `smoke`, `zindex`) plus the one screenshot page you touched.
