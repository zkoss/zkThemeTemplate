# Library / Widget-Config Issues

Tracks T3-wrapper issues that **cannot be fixed via CSS** — the underlying ZK widget `.ts` / `.java` source needs change. These are escalated per `doc/orchestrator-playbook.md` Step 4 (`ESCALATED_LIBRARY_CONFIG`).

Owner: must be triaged by the user / ZK source maintainer; the orchestrator never autonomously edits widget source.

---

## Open issues

### M11 — goldenlayout areas grid ratio not honored
**Detected**: 2026-06-03, eval-reports/goldenlayout.md iter-9
**Component**: `goldenlayout` (T3)
**Failing outcome row**: `M11` — when `areas="A A B / A A B / C C D"` is set, ZKDoc documentation states panel-A width should be 2× panel-B width and AB-row height 2× CD-row height. Live preview shows all three top stacks at equal (1:1:1) width.
**Symptom**: GoldenLayout's `config.dimensions` / `content` initial flex ratios are NOT being computed from the cell-count of the `areas` attribute. Likely `Splitter`/`Stack` initial `size` percentages are emitted as equal rather than proportional to the area-cell count.
**Suspect source**: `zkmax/src/main/resources/web/js/zkmax/goldenlayout/GoldenLayout.ts` — search for `areas` parsing → initial config emission.
**Reference**: `/Users/hawk/Documents/workspace/DOC/zkdoc/zk_component_ref/images/ZKCompRef_GoldenLayout.png` shows the documented 2:1 ratio.
**Not CSS-fixable**: GoldenLayout writes inline `style="width: …%"` on `.lm_item.lm_row > .lm_stack`. Theme CSS cannot override inline width without `!important` AND breaking user-drag resize.
**Status**: open — awaiting ZK widget-source maintainer triage.
