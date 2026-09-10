# Path-rewrite map (item 3.2)

The marble-theme skill, the five subagents, and `doc/spec` cite repository-relative
paths (e.g. `scripts/probe.js`, `src/main/resources/web/...`). Every one of those
strings resolves against the **wrong** repository — silently, with no error — once a
session is rooted in `zk` instead of this repo. This map is the checked-in record of
every such string and what happens to it under the migration: kept and rewritten
(`MAP`), pointed at a generated-output tree (`OUTPUT`), left behind because it no
longer exists here (`STALE`), intentionally not carried over (`DROP`), or left for a
later item to decide (`DEFER`). Items 3.5, 3.6 and 3.10–3.14 apply this map when they
rewrite the skill, the agents and `doc/spec` for the `zk` repository.

- **Measured:** 2026-09-10, by `doc/migration/tools/check-path-map.js --list`
- **Row count:** 101 distinct path strings (the plan's "63" was a lower bound)
- **Verify:** `cd /Users/hawk/Documents/workspace/zkThemeTemplate && node doc/migration/tools/check-path-map.js` — exits 0 when every found string is mapped, no extra rows exist, every `MAP` target is the mechanical prefix substitution, every `STALE` source is confirmed absent from this repo, and every `DEFER` row names the deciding item.

**Dispositions**

| Disposition | Meaning |
| --- | --- |
| `MAP` | The source exists in this repo and rewrites, by mechanical prefix substitution, to the target path (relative to the `zk` root). |
| `OUTPUT` | The source is a build-output path; the target is the equivalent path in the `zk`-side generated tree. |
| `STALE` | The source does not exist in this repo (or the content it names is gone) — the fix belongs in the referencing file, not in this map. |
| `DROP` | The capability is intentionally not carried over to `zk`; there is no target. |
| `DEFER` | The disposition depends on a decision owned by another item (named in the notes); there is no target yet. |

| Source (this repo) | Disposition | Target (relative to zk root) | Notes / referenced by |
| --- | --- | --- | --- |
| `.claude/agents/zk-theme-evaluator.md` | MAP | `.claude/agents/zk-theme-evaluator.md` | zk-spec-author.md, icon-policy.md |
| `.claude/agents/zk-theme-generator.md` | MAP | `.claude/agents/zk-theme-generator.md` | zk-spec-author.md |
| `.claude/skills/marble-theme/scripts/audit-css.sh` | MAP | `.claude/skills/marble-theme/scripts/audit-css.sh` | css-audit.md |
| `.claude/skills/marble-theme/scripts/count-important.js` | MAP | `.claude/skills/marble-theme/scripts/count-important.js` | important-reduction.md |
| `.claude/skills/marble-theme/scripts/probe.js` | MAP | `.claude/skills/marble-theme/scripts/probe.js` | important-reduction.md |
| `.claude/skills/zk-component-rules/` | MAP | `.claude/skills/zk-component-rules/` | zk-theme-evaluator.md, zk-theme-generator.md |
| `.claude/skills/zk-component-rules/SKILL.md` | MAP | `.claude/skills/zk-component-rules/SKILL.md` | zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md |
| `.claude/skills/zk-component-rules/authoring/contract-tiers.md` | MAP | `.claude/skills/zk-component-rules/authoring/contract-tiers.md` | zk-spec-author.md, zk-theme-evaluator.md |
| `.claude/skills/zk-component-rules/components/` | MAP | `.claude/skills/zk-component-rules/components/` | zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md |
| `.claude/skills/zk-component-rules/components/dropupload.md` | MAP | `.claude/skills/zk-component-rules/components/dropupload.md` | component-theme-variables.md |
| `.claude/skills/zk-component-rules/components/scrollbar.md` | MAP | `.claude/skills/zk-component-rules/components/scrollbar.md` | DESIGN.md |
| `.claude/skills/zk-component-rules/components/splitlayout.md` | MAP | `.claude/skills/zk-component-rules/components/splitlayout.md` | DESIGN.md |
| `.claude/skills/zk-component-rules/reference/css-flex-classes.md` | MAP | `.claude/skills/zk-component-rules/reference/css-flex-classes.md` | spacing-policy.md |
| `.claude/skills/zk-component-rules/reference/selected-state-families.md` | MAP | `.claude/skills/zk-component-rules/reference/selected-state-families.md` | DESIGN.md |
| `doc/component-theme-variables-progress.md` | MAP | `doc/component-theme-variables-progress.md` | zk-theme-evaluator.md, new-component-checklist.md |
| `doc/contracts/` | MAP | `doc/contracts/` | tokens.md, md3-design-verifier.md, zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md |
| `doc/contracts/_template.html` | MAP | `doc/contracts/_template.html` | zk-spec-author.md |
| `doc/contracts/baselines/` | MAP | `doc/contracts/baselines/` | zk-spec-author.md |
| `doc/contracts/biglistbox.md` | MAP | `doc/contracts/biglistbox.md` | component-theme-variables.md |
| `doc/contracts/confirmpopup.md` | MAP | `doc/contracts/confirmpopup.md` | native-modern-ui-components.md |
| `doc/contracts/daterangebox.md` | MAP | `doc/contracts/daterangebox.md` | native-modern-ui-components.md |
| `doc/contracts/navbar.md` | MAP | `doc/contracts/navbar.md` | component-theme-variables.md |
| `doc/contracts/searchbox.md` | MAP | `doc/contracts/searchbox.md` | component-theme-variables.md |
| `doc/contracts/stepbar.md` | MAP | `doc/contracts/stepbar.md` | component-theme-variables.md |
| `doc/forced-colors-review.html` | STALE | — | forced-colors.md — file gone |
| `doc/gap-5-tail-pge.md` | MAP | `doc/gap-5-tail-pge.md` | forced-colors.md |
| `doc/harness/design-reviews/` | MAP | `doc/harness/design-reviews/` | md3-design-verifier.md |
| `doc/harness/eval-reports/` | MAP | `doc/harness/eval-reports/` | zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md |
| `doc/harness/outcome-migration-status.md` | MAP | `doc/harness/outcome-migration-status.md` | zk-spec-author.md |
| `doc/harness/work-status.md` | MAP | `doc/harness/work-status.md` | md3-design-verifier.md, zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md |
| `doc/important-decisions.md` | MAP | `doc/important-decisions.md` | important-inventory.md |
| `doc/mira-reports/framework-gaps.md` | STALE | — | zk-mui-structural-gaps.md — file gone; doc/mira-reports/ no longer exists |
| `doc/orchestrator-playbook.md` | MAP | `doc/orchestrator-playbook.md` | md3-design-verifier.md |
| `doc/screenshots/` | MAP | `doc/screenshots/` | verification.md, md3-design-verifier.md, zk-theme-evaluator.md, forced-colors.md, layer-architecture-review.md, new-component-checklist.md |
| `doc/screenshots/goldenlayout-page.gif` | MAP | `doc/screenshots/goldenlayout-page.gif` | md3-design-verifier.md, zk-theme-evaluator.md |
| `doc/skill-gaps.md` | MAP | `doc/skill-gaps.md` | important-reduction.md, zk-spec-author.md, zk-theme-evaluator.md, DESIGN.md, forced-colors.md, md3-close-affordance-placement.md, navigation-surface-rules.md |
| `doc/spec-author-pipeline-plan.md` | STALE | — | zk-spec-author.md — file gone |
| `doc/spec/DESIGN.md` | MAP | `doc/spec/DESIGN.md` | zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md |
| `doc/spec/brand-override.md` | MAP | `doc/spec/brand-override.md` | brand-override.md, zk-spec-author.md, zk-theme-generator.md, auto-contrast-text.md |
| `doc/spec/component-theme-variables.md` | MAP | `doc/spec/component-theme-variables.md` | tokens.md, zk-spec-author.md, zk-theme-generator.md |
| `doc/spec/data-dense-mode.md` | MAP | `doc/spec/data-dense-mode.md` | density.md, zk-spec-author.md |
| `doc/spec/forced-colors.md` | MAP | `doc/spec/forced-colors.md` | zk-spec-author.md |
| `doc/spec/icon-index.md` | MAP | `doc/spec/icon-index.md` | zk-theme-evaluator.md, icon-policy.md |
| `doc/spec/icon-policy.md` | MAP | `doc/spec/icon-policy.md` | zk-theme-evaluator.md, icon-index.md |
| `doc/spec/important-inventory.md` | MAP | `doc/spec/important-inventory.md` | important-reduction.md |
| `doc/spec/index.md` | MAP | `doc/spec/index.md` | SKILL.md |
| `doc/spec/layer-architecture-review.md` | MAP | `doc/spec/layer-architecture-review.md` | layers.md |
| `doc/spec/md3-close-affordance-placement.md` | MAP | `doc/spec/md3-close-affordance-placement.md` | tablet-design-overview.md |
| `doc/spec/new-component-checklist.md` | MAP | `doc/spec/new-component-checklist.md` | md3-design-verifier.md, zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md |
| `doc/spec/reset-scoping.md` | MAP | `doc/spec/reset-scoping.md` | css-dsp.md, layers.md |
| `doc/spec/spacing-policy.md` | MAP | `doc/spec/spacing-policy.md` | zul-authoring.md |
| `doc/spec/window-design-rules.md` | MAP | `doc/spec/window-design-rules.md` | navigation-surface-rules.md |
| `doc/verification-harness-decisions.md` | MAP | `doc/verification-harness-decisions.md` | verification.md |
| `scripts/audit-css.sh` | STALE | — | SKILL.md, css-audit.md — stale skill-relative mention; fix: `../scripts/audit-css.sh` or `.claude/skills/marble-theme/scripts/audit-css.sh` |
| `scripts/build-css.js` | MAP | `scripts/build-css.js` | zk-theme-evaluator.md, DESIGN.md, css-dsp-file-structure.md, forced-colors.md, icon-index.md, icon-policy.md, layer-architecture-review.md, native-modern-ui-components.md, print-styles.md, reset-scoping.md, tablet-design-overview.md, zindex-scale.md |
| `scripts/check-css-dsp.js` | MAP | `scripts/check-css-dsp.js` | css-dsp.md, css-dsp-file-structure.md |
| `scripts/check-default-display.js` | STALE | — | SKILL.md, css-audit.md — stale skill-relative mention; fix: `../scripts/check-default-display.js` or `.claude/skills/marble-theme/scripts/check-default-display.js` |
| `scripts/check-icon-coverage.sh` | MAP | `scripts/check-icon-coverage.sh` | icon-index.md, icon-policy.md |
| `scripts/count-important.js` | STALE | — | SKILL.md, important-reduction.md — stale skill-relative mention; fix: `../scripts/count-important.js` or `.claude/skills/marble-theme/scripts/count-important.js` |
| `scripts/js-source-hash.sh` | MAP | `scripts/js-source-hash.sh` | zk-spec-author.md, zk-theme-evaluator.md |
| `scripts/probe.js` | STALE | — | SKILL.md, css-audit.md, important-reduction.md, check-default-display.js — stale skill-relative mention; fix: `../scripts/probe.js` or `.claude/skills/marble-theme/scripts/probe.js` |
| `scripts/render-iceblue-baseline.sh` | MAP | `scripts/render-iceblue-baseline.sh` | zk-spec-author.md |
| `src/main/resources/` | MAP | `zul/src/main/resources/` | DESIGN.md |
| `src/main/resources/metainfo/zk/config.xml` | DEFER | — | css-dsp.md — decided by 1.5 (core-registration variant) |
| `src/main/resources/web/` | MAP | `zul/src/main/resources/web/` | SKILL.md, tokens.md |
| `src/main/resources/web/css/` | STALE | — | zk-theme-creator.md — stale prefix; tokens live under `web/zul/css/tokens/`, not `web/css/tokens/` |
| `src/main/resources/web/css/tokens/` | STALE | — | zk-theme-creator.md — stale prefix; tokens live under `web/zul/css/tokens/`, not `web/css/tokens/` |
| `src/main/resources/web/js/` | MAP | `zul/src/main/resources/web/js/` | md3-design-verifier.md |
| `src/main/resources/web/js/zkmax/db/css/daterangebox.css` | MAP | `../zkcml/zkmax/src/main/resources/web/js/zkmax/db/css/daterangebox.css` | css-dsp-file-structure.md |
| `src/main/resources/web/js/zul/wgt/css/` | MAP | `zul/src/main/resources/web/js/zul/wgt/css/` | native-modern-ui-components.md |
| `src/main/resources/web/marble/` | STALE | — | css-dsp-file-structure.md — stale prefix; the `marble/` segment was removed from the CSS-DSP source tree |
| `src/main/resources/web/zkmax/css/tablet/` | MAP | `../zkcml/zkmax/src/main/resources/web/zkmax/css/tablet/` | css-dsp-file-structure.md |
| `src/main/resources/web/zul/css/base/_icons.css` | MAP | `zul/src/main/resources/web/zul/css/base/_icons.css` | icon-policy.md |
| `src/main/resources/web/zul/css/tokens/` | MAP | `zul/src/main/resources/web/zul/css/tokens/` | md3-design-verifier.md |
| `src/main/resources/web/zul/css/tokens/_forced-colors.css` | MAP | `zul/src/main/resources/web/zul/css/tokens/_forced-colors.css` | forced-colors.md |
| `src/main/resources/web/zul/css/tokens/_zindex.css` | MAP | `zul/src/main/resources/web/zul/css/tokens/_zindex.css` | zindex-scale.md |
| `src/main/resources/web/zul/css/utility/` | MAP | `zul/src/main/resources/web/zul/css/utility/` | zul-authoring.md |
| `src/main/resources/web/zul/css/utility/_layout.css` | MAP | `zul/src/main/resources/web/zul/css/utility/_layout.css` | responsive-design.md |
| `src/main/resources/web/zul/css/utility/_print.css` | MAP | `zul/src/main/resources/web/zul/css/utility/_print.css` | print-styles.md |
| `src/test/java/zk/example/ThemePreviewApp.java` | DROP | — | verification.md — Spring Boot host; replaced by the 31-line servlet (P2 recipe) |
| `src/test/java/zk/example/iceblue/ThemePreviewIceblueApp.java` | DROP | — | verification.md — Spring Boot host; replaced by the 31-line servlet (P2 recipe) |
| `src/test/playwright/component-theming.spec.ts` | MAP | `zkpreview/src/test/playwright/component-theming.spec.ts` | zk-theme-generator.md |
| `src/test/playwright/playwright.config.ts` | MAP | `zkpreview/src/test/playwright/playwright.config.ts` | verification.md, zk-theme-evaluator.md, new-component-checklist.md, print-styles.md, reset-scoping.md, zindex-scale.md |
| `src/test/playwright/print-utilities.spec.ts` | MAP | `zkpreview/src/test/playwright/print-utilities.spec.ts` | print-styles.md |
| `src/test/playwright/render-smoke.spec.ts` | MAP | `zkpreview/src/test/playwright/render-smoke.spec.ts` | new-component-checklist.md |
| `src/test/playwright/reset-scoping.spec.ts` | MAP | `zkpreview/src/test/playwright/reset-scoping.spec.ts` | reset-scoping.md |
| `src/test/playwright/tablet.spec.ts` | MAP | `zkpreview/src/test/playwright/tablet.spec.ts` | css-dsp-file-structure.md, responsive-design.md |
| `src/test/playwright/zindex-scale.spec.ts` | MAP | `zkpreview/src/test/playwright/zindex-scale.spec.ts` | zindex-scale.md |
| `src/test/resources/web/` | MAP | `zkpreview/src/main/webapp/` | verification.md, zul-authoring.md, zk-spec-author.md, zk-theme-evaluator.md, icon-index.md, icon-policy.md, spacing-policy.md |
| `src/test/resources/web/component-theming.zul` | MAP | `zkpreview/src/main/webapp/component-theming.zul` | zk-theme-generator.md |
| `src/test/resources/web/icons-lucide.zul` | MAP | `zkpreview/src/main/webapp/icons-lucide.zul` | icon-policy.md |
| `src/test/resources/web/label.zul` | MAP | `zkpreview/src/main/webapp/label.zul` | DESIGN.md |
| `src/test/resources/web/pv/matrix.zul` | MAP | `zkpreview/src/main/webapp/pv/matrix.zul` | zk-theme-evaluator.md, responsive-design.md |
| `src/test/resources/web/utility/grid-layout.zul` | MAP | `zkpreview/src/main/webapp/utility/grid-layout.zul` | responsive-design.md |
| `src/test/resources/web/utility/print.zul` | MAP | `zkpreview/src/main/webapp/utility/print.zul` | print-styles.md |
| `src/test/resources/web/utility/responsive.zul` | MAP | `zkpreview/src/main/webapp/utility/responsive.zul` | responsive-design.md |
| `src/test/resources/web/utility/zindex.zul` | MAP | `zkpreview/src/main/webapp/utility/zindex.zul` | zindex-scale.md |
| `target/classes/web/marble/` | OUTPUT | `zul/codegen/web/` | SKILL.md, css-dsp-file-structure.md |
| `target/classes/web/marble/zul/css/norm.css.dsp` | OUTPUT | `zul/codegen/web/zul/css/norm.css.dsp` | forced-colors.md |
| `target/test-classes/web/` | OUTPUT | `zkpreview/build/webapp/` | zul-authoring.md |
| `tasks/gen-reports/` | STALE | — | zk-spec-author.md, zk-theme-evaluator.md, zk-theme-generator.md — deleted in P0; the three agents that cite it are re-pointed to doc/harness/gen-reports/ by 3.10–3.14 |
