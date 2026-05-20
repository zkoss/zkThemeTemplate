# Spec-Author Pipeline — Completion Report (2026-05-19)

Tracks status of every phase in `doc/spec-author-architecture.md` after this session.

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0 — Contract migration | DONE | All 28 trimable Group A contracts have `rules:` + `contract-approved:` + clean frontmatter. `separator.md` has no contract (plan-acknowledged gap). `doc/component-dom-structures.md` already deleted. |
| Phase 1 — Iceblue baseline pipeline | DONE | Spring Boot iceblue preview on port 8081, Playwright capture script, 5 PNG baselines in `doc/contracts/baselines/`. |
| Phase 2 — Spec-author agent | DONE | `.claude/agents/zk-spec-author.md` (345 lines), `doc/contracts/_template.html` (214 lines). |
| Phase 3 — Bootstrap stepbar | SUBSTANTIALLY DONE | 3 artifacts written and boundary-lint clean. 4 user-decision items deferred to `tasks/spec-author-deferred.md`. Canonical-example snapshot postponed until those resolve. |
| Phase 4 — 4 seed contracts | DONE | signature / tbeditor / pdfviewer (Sonnet) + organigram (Opus). 12 artifacts written; all skill files boundary-lint clean; all 4 SKILL.md index rows added. |
| Phase 5 — Wire evaluator + generator | DONE | `zk-theme-evaluator.md` got contract-approval gate + js-source-hash drift detection + two-category source-of-truth (+24 lines). `zk-theme-generator.md` got skill-first lookups + contract supersedes inference (+9 lines). `doc/orchestrator-playbook.md` (+34) and `doc/skill-feedback-loop.md` (+14) updated. |
| Phase 6 — Run loop on 5 seeds | DEFERRED | Requires `contract-approved: true` flips, which require user review of each `doc/contracts/<comp>.html` + matching skill file. See "Approval gates remaining" below. |

## Boundary-lint script

Per the plan's Verification §3, `scripts/check-doc-categories.sh` enforces:

1. No theme content (hex / `var(--zk-*)` / `var(--md-*)` / MUI / Mira / MD3 / iceblue / Sapphire / DESIGN.md) in `.claude/skills/zk-component-rules/components/*.md`.
2. No DOM-tree or state-class headings in `doc/contracts/*.md`.
3. Every contract has a valid `rules:` cross-reference to an existing skill file.

Current sweep over the 5 Phase 3+4 components: **clean**.

Full-repo sweep surfaces pre-existing drift in `colorbox.md`, `data-components.md`, `slider.md` (theme refs inherited from earlier Group A trim) plus the Group B contracts whose spec-author runs haven't happened yet. These are not Phase 3-5 deliverables; address during the post-MVP component-by-component cleanup.

## Files written / modified this session

### Created
- `.claude/skills/zk-component-rules/components/stepbar.md`
- `.claude/skills/zk-component-rules/components/signature.md`
- `.claude/skills/zk-component-rules/components/tbeditor.md`
- `.claude/skills/zk-component-rules/components/pdfviewer.md`
- `.claude/skills/zk-component-rules/components/organigram.md`
- `doc/contracts/stepbar.html`
- `doc/contracts/signature.html`
- `doc/contracts/tbeditor.html`
- `doc/contracts/pdfviewer.html`
- `doc/contracts/organigram.html`
- `scripts/check-doc-categories.sh` (executable)
- `tasks/spec-author-deferred.md`
- `doc/spec-author-pipeline-completion.md` (this file)

### Rewritten
- `doc/contracts/stepbar.md`, `doc/contracts/signature.md`, `doc/contracts/tbeditor.md`, `doc/contracts/pdfviewer.md`, `doc/contracts/organigram.md` — all five are now thin theme overlays with `rules:`, `contract-approved: false`, `js-source-hash:`, `zk-version: 10.2.1-jakarta` frontmatter.

### Modified
- `.claude/skills/zk-component-rules/SKILL.md` — 4 new index rows (organigram, pdfviewer, signature, tbeditor).
- `.claude/agents/zk-theme-evaluator.md` — three new constraints.
- `.claude/agents/zk-theme-generator.md` — two new constraints.
- `doc/orchestrator-playbook.md` — new spec-author phase section.
- `doc/skill-feedback-loop.md` — new triage section.

## Approval gates remaining (user action required)

For each of the 5 seed components, the user must:

1. Open `doc/contracts/<comp>.html` in a browser, compare to `doc/contracts/baselines/<comp>-iceblue.png`.
2. Review `.claude/skills/zk-component-rules/components/<comp>.md` for structural correctness.
3. Resolve any spec-author open-questions captured in the per-component contract.
4. Flip `contract-approved: false → true` in `doc/contracts/<comp>.md`.

Once flipped, the wired evaluator + generator from Phase 5 will accept these components into the ralph-loop (Phase 6).

### Stepbar-specific deferred items (`tasks/spec-author-deferred.md`)
- Title color → `--zk-color-on-surface` (currently `-variant`).
- Connector "lit" rule → also light after complete steps in linear mode.
- Vertical-variant mockup → add to `doc/contracts/stepbar.html`.

### Format canonical-example snapshot
Postponed until stepbar review items resolve. Then snapshot the final stepbar skill `State classes` section + contract Expected-values table into `.claude/agents/zk-spec-author.md` as canonical references.

## Plan verification (per master plan §Verification)

1. ✅ `scripts/render-iceblue-baseline.sh stepbar` produces `doc/contracts/baselines/stepbar-iceblue.png` (Phase 1).
2. ✅ `zk-spec-author stepbar` produced all three artifacts with category split clean (Phase 3).
3. ✅ `scripts/check-doc-categories.sh` passes on the 5 seed components.
4. ⏳ Pending — requires `contract-approved: true` (user-gated, Phase 6).
5. ⏳ Pending — requires a real ZK upgrade to trigger drift (Phase 6 / future).
6. ⏳ Pending — 30-day measurement after rollout (Phase 6).

Conclusion: Phases 0-5 complete. The pipeline is ready to run; only user approval and the loop runs (Phase 6) remain.
