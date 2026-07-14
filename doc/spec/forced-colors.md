# Forced colors / Windows High-Contrast Mode (`forced-colors`)

*Implemented 2026-07-14 · GAP 5 · WCAG 2.1 SC 1.4.1 / 1.4.11 (non-text contrast)*

## Why

Under `@media (forced-colors: active)` (Windows High-Contrast Mode; also emulable in Chrome/Edge/Firefox) the OS replaces the page palette with a small set of **system colors** and **removes every `box-shadow`**. Marble is an MD3-style theme, so several affordances would break:

| Pattern Marble uses | What forced-colors does to it | Result without a guard |
|---|---|---|
| `box-shadow` inset focus ring on text inputs (datebox/timebox/spinner/bandbox) | `box-shadow` stripped; the 1px border and its focus color both collapse to one system color | **No visible focus change** on keyboard focus |
| `box-shadow` elevation on popups / windows / menus | `box-shadow` stripped | **Boundary invisible** — floating surfaces merge into the page |
| Selected row = `primary-container` bg + `on-primary-container` text | both forced to system colors | Selection **indistinguishable** from unselected |
| Checkbox checked = `primary` box + baked white SVG check | box bg forced to `Canvas`; baked white glyph does **not** follow | **Invisible check** — cannot tell checked from unchecked |
| Masked Lucide/SVG glyphs = `background-color: currentColor` + `mask-image` (the theme's whole icon system) | `background-color` force-mapped to `Canvas` (page bg), **not** the foreground | **Every icon vanishes** — same-as-background shape (e.g. spinner up/down arrows) |
| `::before`/`::after` state-layer hover tints | pseudo `background-color` dropped | Hover/pressed feedback gone *(cosmetic — not restored)* |

Target customers (government / finance / EU accessibility-directive) frequently treat high-contrast support as a hard requirement.

## Approach

**One central, unlayered block** — `src/main/resources/web/zul/css/tokens/_forced-colors.css`, bundled into the global `norm.css.dsp` via the `normFiles` list in `scripts/build-css.js` (placed last among the token files so its `--zk-focus-ring` override wins over `_colors.css`). Mirrors the GAP 4 `prefers-reduced-motion` precedent in `tokens/_motion.css`.

Why one central file instead of per-component guards:

- **Unlayered beats layered.** Component CSS lives in `@layer zk-components`; token files are unlayered. In the cascade, unlayered rules win over *any* named layer regardless of specificity — so the guards override component styles **without `!important`** and **without editing ~20 component files**.
- All selectors are global ZK class names, so no component-local context is needed.
- Single file = one place to review, and one place to re-verify survives CleanCSS minification.

**System colors only.** Inside the media block, colors use CSS system-color keywords (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `GrayText`) — the only palette honored in forced-colors mode. `--zk-color-*` custom properties are *not* reset by forced-colors, but any real color they feed (background, border, outline, box-shadow) is force-mapped or stripped, so brand tokens must not be relied on here.

## What the guard restores

1. **Elevation-only surfaces** → `border: 1px solid CanvasText` on `.z-window`, `.z-panel`, `.z-popup(-content)`, `.z-menupopup`, `.z-menu-popup`, `.z-combobox-popup`, `.z-bandbox-popup`, `.z-listbox`, `.z-grid`, `.z-card`.
2. **Text-input focus** → `outline: 2px solid Highlight; outline-offset: -1px` on `:focus-within` for `.z-datebox`, `.z-timebox`, `.z-spinner`, `.z-doublespinner`, `.z-bandbox`, `.z-combobox`.
3. **Selected rows** → `background-color: Highlight; color: HighlightText` on selected `.z-listitem` / `.z-treerow` (and their cell content).
4. **Compound glyph indicators** → `forced-color-adjust: none` on the checked/indeterminate `.z-checkbox-mold` (+ its `::after`) and the selected-row / select-all check icons. These are a *designed fill+glyph pairing* (blue box + white check) whose contrast is guaranteed by design; opting them out of the OS palette keeps them legible rather than letting the box flip to `Canvas` under a check that can't follow.
5. **Masked icon glyphs** → `background-color: CanvasText` on the whole `z-icon-*` family plus the component-local masked icons (`.z-tree-icon i`, `.z-rating-icon`, `.z-colorbox-icon`, colorbox palette/picker toggles, `.z-messagebox-icon`, paging OS-mold nav chevrons). The theme paints every icon as a `background-color: currentColor` fill clipped by a `mask-image`; forced-colors force-maps `background-color` to `Canvas` (page bg), so the fill must be re-pointed at the foreground. Content icons on a Highlight fill (selected rows / current page) get `HighlightText`. **Check/radio indicators are excluded** — they are baked-SVG boxes handled by item 4, and overriding their fill would flatten the box. Because the guard is *unlayered* it beats even the higher-specificity component rules that re-declare an icon's fill (e.g. `.z-combobox-button .z-icon-caret-down::before`).
6. **Buttons** → `border: 1px solid ButtonText` (delineates the shape once the fill collapses to `ButtonFace`); disabled buttons use `GrayText`.
7. **Focus token** → `--zk-focus-ring` retargeted to `2px solid Highlight` (explicit; `outline-color` is force-mapped anyway, but this makes intent clear for its 17 consumers).

## Intentionally NOT handled

- **`::before`/`::after` state-layer hover/pressed tints** — cosmetic feedback, not information loss. Focus (outline) and selection (Highlight) carry the necessary state.
- **Baked-gray dropdown chevrons** (`datebox`/`selectbox`, `stroke='%23666'` in a `background-image` data-URI) keep their fixed color. The input remains usable (border + focus outline survive); recoloring would require converting the data-URI to a `mask-image`. Known minor limitation.

## Approach rationale (vs a dedicated high-contrast theme)

Marble uses a CSS `forced-colors` override, **not** a separate dedicated high-contrast theme. This matches the industry mainstream:

- **Vaadin** (the closest Java-web analog to ZK) ships forced-colors support inside its *base styles* — a CSS-override approach, not a separate theme. It hit the exact same trap (Lumo focus rings drawn with `box-shadow` vanished in WHCM) and fixed it in V24.1 by adding outlines/borders.
- **Microsoft Fluent** moved *away* from a dedicated high-contrast theme toward standard `forced-colors` + system colors (Edge blog, 2020).
- **PrimeFaces/PrimeNG, GWT, Wicket** have no systematic forced-colors layer.

Consequently, the "dedicated high-contrast theme" line in `theme-competitive-gap-analysis.md` is marked **won't-do** (same disposition as dark mode): shipping the forced-colors override *is* the modern way to meet the requirement.

## Extending to a new component

Because the guard is one central file keyed by ZK class, adding coverage for a new
(or previously-missed) component is a small, repeatable edit — no new file, no build
wiring. The process:

1. **Detect** — run the audit, which greps every component CSS for the four fragile
   patterns and reports any whose class is not yet in the guard file:
   ```bash
   npm run check:forced-colors          # advisory report
   npm run check:forced-colors -- --strict   # exit 1 if anything uncovered (for CI)
   ```
   (Heuristic linter — treat each hit as "review against this spec", not a hard error.)
2. **Classify** the component's fragile pattern(s) and pick the matching remedy:
   | Pattern found | Remedy → which list in `_forced-colors.css` |
   |---|---|
   | `box-shadow` elevation on a surface/popup | add its class to the **(1a) border** list |
   | `box-shadow` focus ring on an input | add its `:focus-within`/`:focus` selector to the **(1b) outline** list |
   | selected-row/item tint | add its selected selector to the **(2a) Highlight/HighlightText** list |
   | baked-color SVG check/glyph indicator | add its selector to the **(2b) `forced-color-adjust: none`** list |
   | masked glyph (`mask-image` + `background-color: currentColor`) | add its selector to the **(2d) icon-fill** list (`background-color: CanvasText`, or `HighlightText` if on a selection fill) |
3. **Rebuild & verify** — `npm run build:css`, then `npm run test:forced-colors` (add a
   case to `forced-colors.spec.ts` if the component introduces a new failure mode).

### Coverage status (as of 2026-07-14)

**Full component coverage.** After the initial anchor pass, the audit's tail of 27
lower-frequency components (calendar selected day, accordion selected tab, paging current
page, drawer/toast/notification/groupbox surfaces, slider/selectbox/timepicker/searchbox
focus, cascader/chosenbox/goldenlayout/organigram/nav, etc.) was folded into the central
lists via the process above. `npm run check:forced-colors -- --strict` now **exits 0** —
every component CSS with a fragile pattern is represented in the guard. This coverage was
produced with a Planner–Generator–Evaluator loop and verified by an independent
computed-style probe across all four buckets (see `tasks/gap-5-tail-pge.md`). New
components should keep it at strict-zero using the checklist above.

**Masked-icon fill (pattern 5, added after the initial pass).** A field report —
"the spinner up/down arrows disappear under emulated high-contrast" — surfaced a
whole missing bucket: the theme's *entire icon system* paints glyphs as
`background-color: currentColor` clipped by a `mask-image`, and forced-colors
force-maps `background-color` to `Canvas` (page bg), so every masked icon went
invisible. Fixed centrally (item 5 in "What the guard restores"); a 5th audit
pattern (`masked-icon-fill`) now detects the `mask-image` + `currentColor` combo,
and computed-style probes confirm spinner/combobox/datebox/rating/tree/colorbox/
paging glyphs paint at the foreground while the baked check/radio boxes stay
untouched. *Audit caveat:* coverage is scored per-file (any covered class ⇒
covered), so a component already listed for another bucket (e.g. combobox, datebox,
tree, paging) will **not** be re-flagged for a masked icon — those were covered by
inspection, not by the linter. Only fully-new files (rating, colorbox, messagebox)
were flagged and added.

## Verify

There is **no real forced-colors on macOS** — "Increase contrast" maps to `prefers-contrast: more`, not `forced-colors`. On this dev machine you must emulate.

1. Build: `npm run build:css`, then confirm the rules survive minification:
   ```bash
   grep -o "@media (forced-colors:active)" target/classes/web/marble/zul/css/norm.css.dsp
   ```
2. Run the preview app: `withjdk.sh 17 mvn test exec:java@preview-app`.
3. **Manual:** Chrome/Edge DevTools → Rendering → *Emulate CSS media feature* `forced-colors: active`. Check `checkbox.zul` (three states distinguishable), `datebox.zul` (focus outline appears), `listbox.zul` (selection uses system Highlight), `window.zul` (visible border).
4. **Automated:** Playwright context option `{ forcedColors: 'active' }` (`page.emulateMedia({ forcedColors: 'active' })`), mirroring the existing tablet-UA project pattern. Under emulation `Highlight` ≈ `rgba(5,0,73,.8)` and `HighlightText` = white, so a selected row measures dark-blue bg + white text — verifiable via computed style.
5. **Regression:** turn emulation off → theme appearance is byte-for-byte unchanged (every rule is inside the media block).
