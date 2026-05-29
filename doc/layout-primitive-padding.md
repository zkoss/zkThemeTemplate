# Layout primitives have no default padding — by design

ZK's **layout primitives** — `vlayout`, `hlayout`, `vbox`, `hbox`, `div`,
`cell`, `borderlayout`, and every `*-body` element inside the layout family —
are intentionally **paddingless**. Authors who wrap content in
`<div>` / `<vlayout>` and expect MD3-style breathing room around it will see
text flush to the container's edges.

This is not a bug. It mirrors CSS Grid / Flexbox / Box layout semantics in
the rest of the web platform.

## Why?
If every `<vlayout>` carried 16px padding by default, nested layouts would
accumulate dead space:

```
<vlayout>            (+16px)
  <vlayout>          (+16px)
    <vlayout>        (+16px)
      content
    </vlayout>
  </vlayout>
</vlayout>
                     = 48px of unexplained whitespace
```

Predictable composition requires that the primitive **carries zero padding**
and the author opts in explicitly where needed.

## The pattern: wrap, don't pad the primitive
Use the `z-p-*` utility classes from `_utilities.css` on an inner wrapper:

```xml
<!-- ❌ Doesn't work — primitive ignores padding -->
<vlayout>Content</vlayout>

<!-- ✅ Wrap in a div with a padding utility -->
<vlayout>
    <div sclass="z-p-4">Content</div>
</vlayout>

<!-- Or use a semantic container that does carry padding -->
<panel title="…">
    <panelchildren>Content</panelchildren>      <!-- panel body has 16px padding -->
</panel>
```

## Available utilities
See `src/main/resources/web/zul/css/base/_utilities.css` for the full list.
The most common:

| Class | Effect |
|-------|--------|
| `z-p-0` … `z-p-8` | uniform padding (0, 4, 8, 12, 16, 20, 24, 32 px) |
| `z-px-0` … `z-px-8` | horizontal padding only |
| `z-py-0` … `z-py-8` | vertical padding only |
| `z-pt-*`, `z-pr-*`, `z-pb-*`, `z-pl-*` | per-side padding |

The numbering follows the `--zk-spacing-N` token scale (multiples of 4px).

## When the primitive vs. semantic-container distinction matters
| Component | Default body padding? | Reason |
|-----------|----------------------|--------|
| `vlayout`, `hlayout`, `div`, `vbox`, `hbox`, `cell` | No | Layout primitive — composes |
| `borderlayout`'s `*-body` | No | Layout primitive |
| `panel` (via `panelchildren`) | Yes | Semantic container — represents a card-like block |
| `groupbox` | Yes | Semantic container — represents a sectioned block |
| `window` (content area) | Yes | Semantic container — represents a dialog/dock |

If you want chrome-style "always padded" behaviour, use a semantic
container. If you want layout flexibility, use a primitive and apply
`z-p-*`.

## Forbidden patterns
- ❌ Adding `padding` directly to `.z-vlayout` / `.z-hlayout` / `.z-div`
   etc. in the theme. Always-on padding breaks composition.
- ❌ Workaround stylesheets that target `*-body` to add padding. Use the
   utility class on the wrapper instead.

## Cross-reference
- `tasks/design-review-2026-05-29.md` §3c — original audit and the three
  alternatives considered (utilities + docs vs. always-padded semantic
  containers vs. opt-in `m-padded` sclass token).
- `doc/skill-gaps.md` 2026-05-29 row "layout primitives — design decision"
  — gap log entry.
- `src/test/resources/web/borderlayout.zul` — the canonical example wrapping
  region content in `<div sclass="z-p-4">`.
