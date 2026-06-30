# Icon Policy

This theme delivers all icons via the [Lucide](https://lucide.dev/) icon set, rendered with CSS `mask-image` driven by per-icon SVG data URIs. There are two distinct sources of `z-icon-*` class references:

| Source | Examples | Naming rule |
|--------|----------|-------------|
| ZK widget JS (compiled, immutable) | `<i class="z-icon-caret-down">` injected by `Scrollbar.ts`; `domIconHTML('left')` in `tab/mold/tabbox.js` emitting `z-icon-chevron-left` | Cannot rename. FA-style names that are not in Lucide MUST be aliased in `FA_TO_LUCIDE` (see `scripts/build-css.js`). |
| Preview / example ZULs (`src/test/resources/web/**/*.zul`) | `iconSclass="z-icon-settings"`, `sclass="z-icon-trash-2"` | MUST resolve to a **served** class: a real Lucide name **or** a ZK built-in FA/custom alias (`FA_TO_LUCIDE` / `CUSTOM_ICONS`). Invented / misspelled names are FORBIDDEN. Lucide names are preferred for new content. |

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

Current alias set: see the table in `doc/spec/icon-index.md`, section "FA → Lucide
aliases". The single ZK-widget name without coverage is `z-icon-fw` — it is a
FontAwesome "fixed-width" modifier with no glyph, handled by a single rule in
`src/main/resources/web/zul/css/base/_icons.css` setting `width: 1.25em`.

**Maintenance**: when bumping the ZK version, re-run

```bash
grep -rhoE 'z-icon-[a-z0-9-]+' /path/to/ZK10/zk/zul/src/main/resources/web/js/ \
    | sort -u
```

and diff against `doc/spec/icon-index.md`'s Lucide list ∪ FA alias table. Any newly
appearing name must be either present in Lucide or added to `FA_TO_LUCIDE`.

## Rule 2 — Preview / example content (must resolve to a served class)

Every `z-icon-{name}` literal in `src/test/resources/web/**/*.zul` MUST resolve to a
class that `scripts/build-css.js` actually serves — i.e. `{name}` is one of:

```
node_modules/lucide-static/icons/{name}.svg  EXISTS   (a Lucide name)
{name} is a key of FA_TO_LUCIDE                        (a ZK FA-style alias, e.g. caret-down)
{name} is a key of CUSTOM_ICONS                        (a bare ZK glyph, e.g. exclamation)
{name} == fw                                           (the no-glyph width modifier)
```

- **Both kinds are allowed**: a Lucide name *or* a ZK built-in FA/custom class name.
  ZK widget JS emits the FA-style names (`caret-down`, `angle-up`, `cogs`, …) and the
  build serves a real `.z-icon-{fa}` rule for each, so they render — and a static
  mockup of a widget's DOM (e.g. `scrollbar.zul`'s State Gallery, which mirrors
  `zul.Scrollbar`) SHOULD use the exact emitted name so it matches the live widget.
- **Forbidden**: invented / misspelled names (`my-custom-icon`) — anything with no
  served `.z-icon-*` rule.
- **Preferred for new content**: when you have a free choice, use the Lucide name
  directly (it is self-documenting); reach for an FA alias only when reproducing what
  ZK emits. The theme does not extend Lucide — if a glyph you want isn't in Lucide and
  isn't a ZK-emitted alias, pick a different Lucide icon.

**Excluded catalogs** (performance — these are whole-page icon listings, not ordinary
content): `src/test/resources/web/usecase2/icons-lucide.zul` (regenerated from
`lucide-static` on every build) and `utility/icons.zul` (the "All Lucide Icons" page,
which also hosts the FA-compat alias demo). Both are skipped by `check-icon-coverage.sh`.

> Historical note: an earlier `<!-- icon-lint:disable -->` / `<!-- icon-lint:enable -->`
> region opt-out existed to exempt FA-style names in authored ZULs. It was removed once
> Rule 2 was widened to accept ZK FA/custom aliases everywhere (both kinds now resolve to
> a served class, so no region exemption is needed).

## Enforcement

| Tool | Scope | When |
|------|-------|------|
| `scripts/check-icon-coverage.sh` | Rule 2 — all preview ZULs | Run locally; will be wired into pre-commit / CI |
| `.claude/agents/zk-theme-evaluator.md` | Rule 1 + Rule 2 (manual check during component evaluation) | When evaluator inspects a component |
| `scripts/build-css.js` (FA_TO_LUCIDE) | Rule 1 — declarative alias source | Build time |

## Canonical reference

`doc/spec/icon-index.md` — auto-generated, regenerate with `npm run build:css`.
Lists every valid Lucide name plus the active FA→Lucide alias table. This is
the file generator and evaluator should consult when in doubt.
