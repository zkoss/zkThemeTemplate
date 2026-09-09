# Where a document lives

One question decides it: **will anything outside this document need it after the work lands?**

| Home | What goes there | In git |
|---|---|---|
| `doc/spec/` | Normative rules the theme must satisfy. The thing you cite when arguing a component is wrong. | yes |
| `doc/` (top level) | Analyses, evaluations, audits, design reviews, backlogs, superseded plans. Finished reasoning that later work cites as evidence. | yes |
| `doc/harness/` | Machine-written verification state: `work-status.md`, `eval-reports/`, `design-reviews/`, and the append-only escalation logs. Not documentation — state with a single-writer protocol. Do not hand-edit. | yes |
| `doc/contracts/` | Per-component theme contracts (`.md` + `.html` mockup). | yes |
| `tasks/` | Scratch. Reasoning for one session, superseded the moment the work lands, referenced by nothing. | **no** (gitignored) |

`tasks/` staying out of git is deliberate: it keeps the working tree honest and lets you delete
freely. That only works if what lives there is genuinely disposable.

## The rule that keeps it honest

> **If a tracked file references a path, that path must be tracked.**

`npm run check:doc-links` enforces it, and the Maven build runs it in `process-resources`. It reports
two classes, because the fixes differ:

- **UNTRACKED** — the target exists but is not in git. It is not scratch: something depends on it.
  Move it to `doc/` (or `doc/harness/` if it is machine state) and update the references.
- **MISSING** — the target does not exist at all. The referencing document makes a claim that is
  already false. Fix or remove the reference; do not repoint it at a guess.

No per-file judgement, no annual audit, and it fires the day a bad reference is written rather than
months later.

## Why the rule exists

Measured 2026-09-09, before the rule was enforced: `tasks/` held **67 files spanning three months**.
**21** were referenced from tracked files, and **12 of those no longer existed** — deleted, with no
diff, no history and no way back, while the tracked documents still confidently linked to them.

Two were not scratch by any definition:

- `doc/orchestrator-playbook.md` instructed an agent to append escalations to a `tasks/` file that
  had been deleted. Following that step created an empty file, silently discarding every prior row.
- A `zk-component-rules` skill cited a verification procedure it said it *supersedes*. The procedure
  was gone.

The deeper cause was not the gitignore. It was that an audit written to `doc/` and the same audit written to
`tasks/` were indistinguishable by content, so the choice was made by mood — and `tasks/` won, because "I'll delete
it later" is the cheaper thought. Three months later nobody had deleted anything, and the directory
had become a permanent archive with none of an archive's guarantees.

## Deleting is now safe

That is the point of the split, not a side effect. A tracked document can be deleted the moment it
stops being useful: `git log --diff-filter=D` finds it and `git show <commit>^:<path>` brings it
back. Prefer deleting with a commit message that says what superseded it over leaving dead files
around — and where the decision itself is worth keeping, a **SUPERSEDED** banner on the document
beats a silent deletion (see `playwright.config.ts`'s flat-baseline note for a case where the
rejected alternative mattered).

An untracked `tasks/` file has no such recovery. Read it before deleting it.
