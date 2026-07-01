# Tablet (mobile-UA) parity audit — Marble vs ZK default theme

**Mandate (user):** wherever the ZK **default theme**'s `zkmax/css/tablet.css.dsp` gives a
component mobile-browser–specific design, Marble's tablet bundle must give it one too.

**Source of truth (default theme):**
`/Users/hawk/Documents/workspace/ZK10/zkcml/zkmax/codegen/resources/web/zkmax/css/tablet.css.dsp`
(single minified file — the whole default mobile stylesheet).

**Marble side:** `src/main/resources/web/zkmax/css/tablet/_*.css` partials, ordered in
`scripts/build-css.js` → `tabletFiles`, bundled into `zkmax/css/tablet.css.dsp` and injected
only on a mobile UA by ZK's `TabletThemeURIHandler`.

## Governing principle (how we match, not what we copy)

The default theme's mobile rules fall into two kinds:

1. **Touch-target / interaction geometry** — enlarge tap areas (checkbox 24px, menu row
   min-height, header sort buttons 38px, slider knob 22px, tree/detail toggle icons, close
   affordances…). This is genuine mobile *usability* and is **framework-class portable** — the
   selectors (`.z-menuitem-content`, `.z-tab`, `.z-listitem-checkable`, …) are ZK DOM classes,
   identical in Marble. **We MUST reach parity here.**
2. **Font-size bumps** (→15px/17px) — the default theme scales its ~13px desktop type up for
   phone legibility. Marble's desktop type is already MD3 `body-medium` (14px) / larger headers,
   which is comfortable on mobile. Blindly copying `15px/17px` would fight Marble's tuned type
   scale. **We do NOT copy these**; we only bump a font where Marble's mobile text is genuinely
   too small (none found). This is consistent with the project rule: *apply the intent with
   `--zk-*` tokens and MD3 values, never copy default-theme pixels.*

All Marble tablet values come from the touch tokens in `tablet/_tokens.css`
(`--zk-touch-target-min` 44px, `--zk-touch-target-comfortable` 48px, `--zk-touch-icon-size` 24px,
`--zk-touch-row-min-height` 48px, `--zk-touch-scrollbar-size` 16px, `--zk-touch-slider-knob` 28px).
MD3's minimum touch target is 48dp / 44px — **larger** than the default theme's 38px, so Marble
is stricter, not a copy.

## Coverage matrix

Legend: ✅ covered · ◑ partial (touch-critical piece missing) · ➕ gap to close · N/A Marble
doesn't ship the component (no desktop CSS) · 🔤 font-bump only (intentionally skipped, see
principle #2).

| Default-theme family | Kind | Marble desktop CSS | Marble tablet before | Action |
|---|---|---|---|---|
| checkbox / radio (line-height, content, input 24px) | touch | checkbox.css | ✅ `_selection.css` | — |
| button (font 15px) | 🔤 | button.css | ✅ `_buttons.css` (touch height) | — |
| combobutton icon/text | touch | combobutton.css | ✅ `_buttons.css` | — |
| toolbarbutton | touch | toolbarbutton.css | ✅ `_buttons.css` | — |
| textbox/intbox/… + combo/date/time/spinner inputs | 🔤+touch | inp/db css | ✅ `_inputs.css` (buttons+height) | — |
| spinner / timebox / doublespinner buttons | touch | spinner/timebox css | ✅ `_inputs.css` | — |
| calendar (cells 36px) + calendar/timebox **wheel** pickers | touch | calendar.css | ✅ `_calendar.css` + `_wheel.css` | — |
| slider knob | touch | slider.css | ✅ `_slider.css` | — |
| mesh cell padding / row height / header sort buttons | touch | listbox/grid/tree | ✅ `_mesh.css` | — |
| window/panel header + control icons | touch | wnd css | ✅ `_window.css` (header + control icons) | — |
| biglistbox custom scrollbar track | touch | scrollbar.css | ◑ `_scrollbar.css` (track width only) | note (EE, niche) |
| **menu / menubar / menuitem / menupopup** | touch | menu.css | ➕ none | **`_menu.css`** |
| **tabbox** (tab tap, tab close, tab scroll, tab image) | touch | tabbox.css | ➕ none | **`_tabbox.css`** |
| **tree expand/collapse icon + tree checkbox** | touch | tree.css | ➕ none | **extend `_mesh.css`** |
| **mesh checkable cells** (list/tree header/item/group) | touch | listbox/tree | ➕ none | **extend `_mesh.css`** |
| **grid detail** open/close icon | touch | grid.css | ➕ none | **extend `_mesh.css`** |
| **grid/listbox group** toggle icon | touch | grid/listbox | ➕ none | **extend `_mesh.css`** |
| **paging** prev/next nav icon | touch | paging.css | ◑ (button+input only) | **extend `_mesh.css`** |
| **combobox/timepicker dropdown item** tap height | touch | combobox.css | ➕ none | **extend `_inputs.css`** |
| **notification** close button | touch | notification.css | ➕ none | **`_feedback.css`** |
| **errorbox / errorbox close** (validation) | touch | errorbox.css | ➕ none | **`_feedback.css`** |
| borderlayout collapse/expand affordance | touch | borderlayout.css | intentional redesign | none — see below |
| label / popup / caption / groupbox / messagebox label / toolbar label / auxheader | 🔤 | — | 🔤 skipped | none (principle #2) |
| chosenbox | touch | — | N/A (no chosenbox.css) | none |
| colorbox / colorpalette / colorpicker | touch | — | N/A (no colorbox.css) | none |
| navbar / nav / navitem | touch | — | N/A (no navbar.css) | none |
| timepicker (dedicated EE input) | touch | — | N/A (folded into combo item rule) | none |
| base resets (`*` user-select, native input appearance) | reset | base/_reset.css | N/A (Marble owns its reset) | none |

## What gets added

- **`_menu.css`** — `.z-menu-content` / `.z-menuitem-content` → `min-height: var(--zk-touch-target-min)`;
  menu/menuitem icons + images → `--zk-touch-icon-size`; `.z-menubar-icon` glyph.
- **`_tabbox.css`** — `.z-tab` → touch min-height; `.z-tab-button` (per-tab close) + `.z-tabbox-*-scroll`
  (tab-strip scroll arms) → `--zk-touch-target-min`; `.z-tab-image`/`.z-tab-icon` → `--zk-touch-icon-size`.
- **`_mesh.css` (extended)** — checkable cells (`.z-listitem-checkable`, `.z-listheader-checkable`,
  `.z-listgroup-checkable`, `.z-treerow-checkable`) → 24px; tree toggle (`.z-tree-icon`) + group toggles
  (`.z-group-icon`, `.z-listgroup-icon`) + detail (`.z-detail`, `.z-detail-icon`) → touch icon size;
  `.z-paging-icon` → touch icon size.
- **`_inputs.css` (extended)** — `.z-comboitem` dropdown option → `min-height: var(--zk-touch-target-min)`.
- **`_feedback.css`** — `.z-notification-close`, `.z-errorbox-close` (and the notification close's inner
  glyph, which desktop pins to 14px) → `--zk-touch-icon-size` (24px) box + glyph. Not forced to 44px:
  a 44px dismiss would dominate the compact toast/tooltip; 24px matches/exceeds the default theme's
  22px while the whole toast body stays the primary read target.

No new tokens required — all reuse `tablet/_tokens.css`.

## Deliberately not done (with rationale)

- **Font-size bumps** (label/popup/caption/groupbox/messagebox/toolbar/auxheader): principle #2.
- **window `.z-window-content` / panel `.z-panel-body` padding**: the default theme's change here is a
  font+padding bump that tracks its own 15px mobile type (principle #2). The touch affordances — header
  height and the maximize/minimize/close control icons — are already covered in `_window.css`.
- **borderlayout / splitter collapse affordance**: Marble replaced the default theme's `.z-borderlayout-icon`
  header arrow with an MD3 splitter *pill* that (a) is JS-positioned along its long axis via `margin-left`
  and (b) has its cross-axis locked to the 8px bar thickness by design (`borderlayout.css` §"pill cross-axis
  (8px) == bar height (8px)"; the former 28→44px growth was explicitly retired 2026-06-23). Forcing a 44px
  box would break JS centering and that invariant. The whole splitter strip is already the hover/active
  activation zone, so the grab area is generous. Left as-is by design, not an oversight.
- **chosenbox / colorbox / navbar / timepicker**: Marble ships no desktop CSS for these, so there is
  nothing to make mobile-friendly. If any is themed later, add its tablet partial then.
- **biglistbox scrollbar internals** (drag/pos/tick 22px): Marble already widens the track to 16px
  (the load-bearing touch win). The internal drag-thumb geometry is EE-only and rarely used; left as a
  follow-up, noted here so it isn't mistaken for "covered."
