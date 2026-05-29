# Component: goldenlayout
tier: T3
category: layout
shared-css-file: src/main/resources/web/js/zkmax/layout/css/goldenlayout.css
siblings: []
preview: (no dedicated preview yet — GoldenLayout is a zkmax enterprise component)

## T3 metadata

library: GoldenLayout (https://golden-layout.com/), JS-based dockable multi-pane layout
library-version: 2.x (used by ZK 10 zkmax)
theme-bridge:
  available: false              # GoldenLayout has its own theme system (light/dark + their own CSS bundle)
  variables: {}
  notes: |
    GoldenLayout ships its own theme CSS (e.g. `goldenlayout-base.css` + `goldenlayout-light-theme.css`).
    Best path is to import the light-theme file, then override its variables in our wrapper scope ONLY where
    GoldenLayout 2.x exposes them. If it doesn't, fall back to wrapper-only.
wrapper-selectors:
  - .z-goldenlayout              # ZK widget root container
forbidden-selectors:
  - .lm_*                        # GoldenLayout's own namespace — every internal class starts with lm_
  - "[class^='lm_']"             # selector form that matches the namespace
escalation-path: ESCALATED_LIBRARY_CONFIG

## References
- ZK widget source: /Users/hawk/Documents/workspace/ZK10/zkcml/zkmax/src/main/resources/web/js/zkmax/goldenlayout/GoldenLayout.ts
- DESIGN.md sections: §1, §5, §11

## DOM key selectors (wrapper-only)
```
.z-goldenlayout                  ← ZK widget root
```
Everything inside is GoldenLayout's own DOM (`.lm_root`, `.lm_item`, `.lm_header`, `.lm_tab`, `.lm_content`, etc.) — DO NOT style any of those.

## Expected values

| id | selector | property | expected | source |
|----|----------|----------|----------|--------|
| c1 | `.z-goldenlayout` | background-color | rgb(255,255,255) OR transparent | DESIGN.md §1 |
| c2 | `.z-goldenlayout` | border-radius | 6px (card-like) | DESIGN.md §5 |
| c3 | `.z-goldenlayout` | box-shadow | level-1 card OR (if standalone in a page-card already) none | DESIGN.md §6 |
| c4 | `.z-goldenlayout` | min-height | (page-dependent — confirm reasonable default) | infer |

## States to evaluate
- [ ] default rendered with at least one pane visible
- [ ] panes are draggable (functional, not visual — Evaluator skips)

## Notes for Generator
- All tab visual styling, divider colours, drag indicators, pane backgrounds are owned by GoldenLayout's theme CSS. Re-themeing those means swapping the imported GoldenLayout theme file OR a JS-config call — both escalate to `ESCALATED_LIBRARY_CONFIG`.
- If the contract's expected values can be satisfied by wrapper rules alone, that is the entire job.
