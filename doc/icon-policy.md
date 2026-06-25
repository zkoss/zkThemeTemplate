# Icon Policy

This theme delivers all icons via the [Lucide](https://lucide.dev/) icon set, rendered with CSS `mask-image` driven by per-icon SVG data URIs. There are two distinct sources of `z-icon-*` class references:

| Source | Examples | Naming rule |
|--------|----------|-------------|
| ZK widget JS (compiled, immutable) | `<i class="z-icon-caret-down">` injected by `Scrollbar.ts`; `domIconHTML('left')` in `tab/mold/tabbox.js` emitting `z-icon-chevron-left` | Cannot rename. FA-style names that are not in Lucide MUST be aliased in `FA_TO_LUCIDE` (see `scripts/build-css.js`). |
| Preview / example ZULs (`src/test/resources/web/**/*.zul`) | `iconSclass="z-icon-settings"`, `sclass="z-icon-trash-2"` | MUST use the real Lucide name. FA aliases, custom names, and theme-specific names are FORBIDDEN. |

## Rule 1 — ZK widget icons (alias when needed)

ZK 10 emits 32 unique `z-icon-*` names from compiled JS/TS sources under
`/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/`. We
cannot modify these. The strategy is:

1. If the name exists in `node_modules/lucide-static/icons/`, no action needed —
   `scripts/build-css.js` emits it as a regular Lucide rule.
2. If the name is FA-only (`caret-down`, `cogs`, `compress`, `info-circle`, …),
   add an entry to the `FA_TO_LUCIDE` map in `scripts/build-css.js`. The build
   step emits a second `.z-icon-{fa-name}{...}` rule reusing the matching
   Lucide SVG.

Current alias set: see the table in `doc/icon-index.md`, section "FA → Lucide
aliases". The single ZK-widget name without coverage is `z-icon-fw` — it is a
FontAwesome "fixed-width" modifier with no glyph, handled by a single rule in
`src/main/resources/web/zul/css/base/_icons.css` setting `width: 1.25em`.

**Maintenance**: when bumping the ZK version, re-run

```bash
grep -rhoE 'z-icon-[a-z0-9-]+' /path/to/ZK10/zk/zul/src/main/resources/web/js/ \
    | sort -u
```

and diff against `doc/icon-index.md`'s Lucide list ∪ FA alias table. Any newly
appearing name must be either present in Lucide or added to `FA_TO_LUCIDE`.

## Rule 2 — Preview / example content (Lucide names only)

Every `z-icon-{name}` literal in `src/test/resources/web/**/*.zul` MUST satisfy:

```
node_modules/lucide-static/icons/{name}.svg  EXISTS
```

- No FA names (`cogs`, `times`, `caret-down`, `volume-up`, …). Even though
  `FA_TO_LUCIDE` makes them work at runtime, preview content must be
  self-documenting. Use the Lucide name directly.
- No invented names (`my-custom-icon`).
- The only exception is `z-icon-fw` (the no-glyph width modifier).

When a preview author wants an icon that does not exist in Lucide, the answer
is: pick a different Lucide icon. The theme does not extend Lucide.

**Auto-generated catalog**: `src/test/resources/web/usecase2/icons-lucide.zul`
is regenerated from `lucide-static` on every build. It is excluded from this
rule by construction.

**Region opt-out**: a block wrapped between `<!-- icon-lint:disable -->` and
`<!-- icon-lint:enable -->` comments is exempt from Rule 2. This exists solely
for the "FontAwesome-compat aliases" demo in `utility/icons.zul`, which
intentionally renders the FA-style names ZK widget JS emits (to document the
`FA_TO_LUCIDE` mapping). `check-icon-coverage.sh` honors these markers; do not
use them to bypass the rule for ordinary preview content.

## Enforcement

| Tool | Scope | When |
|------|-------|------|
| `scripts/check-icon-coverage.sh` | Rule 2 — all preview ZULs | Run locally; will be wired into pre-commit / CI |
| `.claude/agents/zk-theme-evaluator.md` | Rule 1 + Rule 2 (manual check during component evaluation) | When evaluator inspects a component |
| `scripts/build-css.js` (FA_TO_LUCIDE) | Rule 1 — declarative alias source | Build time |

## Canonical reference

`doc/icon-index.md` — auto-generated, regenerate with `npm run build:css`.
Lists every valid Lucide name plus the active FA→Lucide alias table. This is
the file generator and evaluator should consult when in doubt.
