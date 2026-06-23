# Marble — Framework-class compliance audit

**Theme:** marble · **ZK version:** 10.2.1-jakarta · **Audit date:** 2026-06-23 · **Status: RESOLVED**

This is the **result layer** of the framework-class compliance check. Spec + procedure live in
the theme-independent skill: `.claude/skills/zk-component-rules/reference/framework-classes.md`.
Marble replaces stock ZK CSS entirely (see `reference/theme-override-is-replace.md`), so every
JS-toggled contract class must be defined here — none is inherited from stock.

## How this was generated

```bash
mvn clean package -Dmaven.test.skip=true   # produce target/classes/web/marble
node .claude/skills/zk-component-rules/tools/check-framework-classes.mjs \
  --theme-css-dir target/classes/web/marble
```

## Result — 16 contract classes, all PASS

| Class | JS toggle site | Status |
|-------|----------------|--------|
| `.z-flex` family (5) | `zk/flex.ts` | ✅ present (`zul/css/base/_cssflex.css`) |
| `.z-renderdefer` | `zk/widget.ts:redraw_` | ✅ present |
| `.z-word-nowrap` | `zul/mesh/Frozen.ts` | ✅ added (`zul/css/base/_dnd.css`) |
| `.z-dragged` | `zk/widget.ts:cloneDrag_` | ✅ added — `opacity:.4` |
| `.z-drag-over` | `zk/widget.ts:dropEffect_` | ✅ added — primary-container + dashed outline |
| `.z-drag-ghost` | `zk/widget.ts:ghost` (clone path) | ✅ added — elevation-4, rounded |
| `.z-drop-ghost` | `zk/widget.ts:ghost` (message path) | ✅ added — inverse-surface chip |
| `.z-drop-content` | `zk/widget.ts:ghost` | ✅ added |
| `.z-drop-icon` | `zk/widget.ts:ghost` + `DD_dragging` | ✅ added — mask glyph |
| `.z-drop-text` | `zk/widget.ts:ghost` | ✅ added |
| `.z-drop-allow` / `.z-drop-disallow` | `zk/widget.ts:DD_dragging` | ✅ added — plus-circle / ban glyph |

**Checker verdict: PASS — all 16 contract classes defined.**

## What changed since the first audit (2026-06-23 AM)

The first pass found **6 missing** classes against a 12-class registry. Building the fix via TDD
surfaced that the registry was **incomplete**: the listitem/row drag path uses a richer
message-ghost structure — `.z-drop-ghost` → `.z-drop-content` → `.z-drop-icon` + `.z-drop-text` —
none of which were in the registry, and the 5 drag-feedback hooks were wrongly attributed to
`norm.less` (stock ships **no CSS** for them). The registry was corrected and extended to 16
contract classes; all are now implemented.

## Implementation (TDD)

1. **Contract:** `doc/contracts/framework-classes.md` — expected computed values per class.
2. **Preview:** `dnd.zul` — live DnD + static ghost swatches (frozen is covered by `grid.zul`).
3. **Test (RED→GREEN):** `src/test/playwright/framework-classes.spec.ts` (project `framework`),
   7 tests. Frozen (f1) verified on the real `grid.zul` Frozen Columns example; drag/ghost classes
   via injecting the exact runtime markup and asserting computed styles (deterministic — avoids
   flaky drag simulation).
4. **CSS (fix):** `src/main/resources/web/zul/css/base/_dnd.css`, bundled via `footerFiles` in
   `scripts/build-css.js`. MD3 tokens throughout; ghost icon is a mask glyph (Marble pattern).

**Verification:** `framework` spec 7/7 pass; Tier-1 checker PASS (16/16); `dnd.zul`
render-smoke pass.

## Tier 2 — semantic review
`.z-flex` family: no component hard-codes `display:flex`/`flex-basis:0` onto a JS-managed container.
`.z-drop-ghost`: the rule sets appearance only, never `position`/`top`/`left`, so ZK's inline
cursor-tracking is preserved (asserted by test g1). No violations.
