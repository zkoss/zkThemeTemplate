# Data-Dense (Compact) Display Mode

Marble's defaults target general business UIs. Data-dense applications — ERP-class
screens (iDempiere and similar) that pack many rows and fields into a viewport — need
a tighter UI. Marble exposes this as a **whole-app density switch driven entirely by
CSS variables**: override a small seed set at `:root` and the *entire* UI shrinks
coherently. No forking, no per-component classes, no ZUL markup changes.

## How it works

The density system has three layers, all defined in
[_sizing.css](../src/main/resources/web/zul/css/tokens/_sizing.css):

1. **Control-height ladder** — the seed rungs `--zk-control-height-{xs,sm,md,lg,xl}`
   (28 / 32 / 40 / 48 / 56 px by default). This is what you flip.
2. **Semantic alias layer** — `--zk-input-height`, `--zk-button-height`,
   `--zk-toolbar-height`, `--zk-window-header-height`, … Each maps a component type to
   a rung *by meaning*. The intentional size *relationships* (input 40 > button 36,
   toolbar 48 > input 40) live here, defined once — so they survive any tier change.
3. **Data-cell padding** — `--zk-grid-cell-padding`, `--zk-listbox-cell-padding`,
   `--zk-tree-cell-padding` (the biggest lever for table density).

Every component's CSS binds to a rung or an alias — never a raw px. So re-pointing the
seeds at `:root` cascades through the whole theme at once. This mirrors how Salesforce
Lightning (Comfy/Compact) and Ant Design (`controlHeight` seed) deliver global density.

## Switching to compact

Add the compact preset to **your application's** stylesheet, loaded **after** the
Marble theme (equal-specificity `:root` rules are decided by load order). Either copy
[marble-compact.css](./marble-compact.css) verbatim, or paste this block:

```css
:root {
    /* control-height ladder */
    --zk-control-height-xs: 24px;
    --zk-control-height-sm: 28px;
    --zk-control-height-md: 32px;   /* inputs, icon-button, list rows, menu items */
    --zk-control-height-lg: 40px;   /* toolbar, menubar, tabs, panel/groupbox header, notification */
    --zk-control-height-xl: 48px;   /* window header, FAB */
    /* off-ladder semantic seeds */
    --zk-button-height: 30px;
    --zk-button-height-lg: 38px;
    --zk-menuitem-height: 30px;     /* popup menu rows */
    --zk-data-row-min-height: 36px; /* tree rows + grid/list paging bar */
    --zk-header-padding-y: 8px;     /* window/panel header vertical padding */
    /* data-cell padding */
    --zk-grid-cell-padding: 6px 12px;
    --zk-listbox-cell-padding: 6px 12px;
    --zk-tree-cell-padding: 4px 12px;
}
```

You only flip the **5 rungs + 4 off-ladder seeds + 3 padding knobs**. Everything else
(inputs, headers, tabs, FAB, paging…) follows automatically through the alias layer.

## The full knob set

| Token | Default | Compact | Drives |
|---|---|---|---|
| `--zk-control-height-xs` | 28px | 24px | sm/icon-sm buttons, close buttons, editor-toolbar btn |
| `--zk-control-height-sm` | 32px | 28px | paging controls, window-close |
| `--zk-control-height-md` | 40px | 32px | **inputs**, icon-button, list rows, vertical menu items, `--zk-control-height` |
| `--zk-control-height-lg` | 48px | 40px | toolbar, menubar, tabs, panel/groupbox header, notification, vertical-button |
| `--zk-control-height-xl` | 56px | 48px | window header, FAB |
| `--zk-button-height` | 36px | 30px | filled/outlined/text button, combobutton, overflow button |
| `--zk-button-height-lg` | 44px | 38px | `.z-button-lg` |
| `--zk-menuitem-height` | 36px | 30px | popup menu rows |
| `--zk-data-row-min-height` | 52px | 36px | tree data rows, grid/listbox paging bar |
| `--zk-grid-cell-padding` | 16px | 6px 12px | grid cells |
| `--zk-listbox-cell-padding` | 16px | 6px 12px | listbox cells |
| `--zk-tree-cell-padding` | 8px / 16px | 4px 12px | tree cells |

### Finer control

The aliases are individually overridable too. To shrink, say, only the toolbar without
touching the rest of the `lg` rung, set `--zk-toolbar-height: 40px;`. The full alias
list is in [_sizing.css](../src/main/resources/web/zul/css/tokens/_sizing.css).

## Intentionally NOT scaled

Icon-glyph font-sizes, calendar day cells, textarea min-height (content-driven), and
decorative geometry stay fixed — they are not control heights and coupling them to the
ladder would distort glyphs. Adjust them individually if a specific case needs it.

## Notes

- **Touch targets**: compact heights drop below the MD3 44/48px touch minimum. That's
  correct for dense *desktop* ERP use. On mobile UAs the tablet layer
  (`zkmax/css/tablet/_tokens.css`) still scales controls up via its own touch tokens.
- **Picking your own tier**: the compact values above are a balanced starting point.
  For an even denser tier, keep stepping the ladder down (e.g. md 28, lg 36) — the
  alias layer keeps everything proportional.
