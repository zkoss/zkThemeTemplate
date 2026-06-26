# Tablet Design Overview (Marble theme)

Source: `src/main/resources/web/zkmax/css/tablet/_*.css`
Build: concatenated into `zkmax/css/tablet.css.dsp` (see `scripts/build-css.js`, stage 5).

## How it loads — the core mechanism

The tablet bundle is **not** a media query. ZK EE (`TabletThemeURIHandler`) injects a
`<link href=…zkmax/css/tablet.css.dsp … disabled>` at cascade position 1 (after
`norm.css`) on **every** request — but it ships **disabled**. The ZK client runtime
sets `zk.mobile` from the request User-Agent and, on `DOMContentLoaded`, **enables**
the disabled link only when `zk.mobile` is true. So the switch is client-side but
keyed on UA; because the sheet loads after `norm.css`, its rules win on equal specificity.

| Context | `tablet.css.dsp` link | Rules applied |
|---------|-----------------------|---------------|
| **Desktop browser** | present but `disabled` (never loaded) | Base Marble theme only (`norm.css` + component `*.css.dsp`) |
| **Mobile / tablet browser** | enabled on `DOMContentLoaded` | Base Marble theme **+** `tablet.css.dsp` overrides |

Consequences:
- On a desktop browser the link stays disabled, so its rules are never applied and the
  sheet never even appears in `document.styleSheets`. Switching is **UA-based, not
  width-based**: resizing a desktop window narrow does **not** trigger tablet styling.
- The bundle is **geometry only** — it enlarges hit areas, glyphs and row heights.
  Palette, shape and typography tokens keep coming from the base `--zk-color-*` /
  `--zk-shape-*` tokens. No hardcoded hex anywhere.
- The design target is MD3 touch ergonomics: **44px minimum** hit area, **48px
  comfortable** hit area, **24px** control glyphs.

## Touch tokens (`_tokens.css`)

These layer on top of the regular `--zk-*` tokens and drive every partial:

| Token | Value | Purpose |
|-------|-------|---------|
| `--zk-touch-target-min` | 44px | MD3 minimum hit area |
| `--zk-touch-target-comfortable` | 48px | MD3 comfortable hit area |
| `--zk-touch-input-height` | 48px | text inputs / combo wrappers |
| `--zk-touch-icon-size` | 24px | control glyphs (up from ~14–20px) |
| `--zk-touch-scrollbar-size` | 16px | touch-width custom scrollbar |
| `--zk-touch-row-min-height` | 48px | mesh row / cell tap height |

---

## Per-component differences (desktop → mobile)

### 1. Buttons (`_buttons.css`)
| Element | Desktop | Mobile |
|---------|---------|--------|
| `.z-button` | 36px tall | **min 44px**, padding `6px / spacing-5` |
| Icon-only / FAB button | 40px | **44×44 square**, glyph **24px** |
| `.z-uploadbutton` | 36px | **min 44px** |
| `.z-toolbarbutton` | 36px | **44px**, min-width 44px |
| Combobutton label / dropdown arm | default | label **min 44px**, arm **44px wide** |

### 2. Text inputs + combo family (`_inputs.css`)
Covers textbox/intbox/decimalbox/doublebox/longbox/passwordbox and the combo
family (combobox, bandbox, datebox, timebox, spinner, doublespinner).
| Element | Desktop | Mobile |
|---------|---------|--------|
| Input wrapper | 40px | **min 48px** |
| Inner `<input>` | 38px | **min 48px** |
| Dropdown / picker buttons (combo/bandbox/date/time) | 28–36px | **44px wide, 48px tall** |
| Spinner steppers (tightest on desktop) | 28px | **44px wide** |
| Dropdown / picker glyphs | ~14–20px | **24px** |

### 3. Selection controls — checkbox / radio / switch (`_selection.css`)
The **glyph keeps its MD3 size**; what grows is the clickable row and the ripple
state-layer, so the finger target fills 48px.
| Element | Desktop | Mobile |
|---------|---------|--------|
| `.z-checkbox` / `.z-radio` row | default | **min-height 48px** |
| Checkbox state-layer ring | 40px | **48px** (mold margin 15px, `::before` inset −15px) |
| Radio state-layer ring | 40px | **48px** (input margin 14px, `::before` inset −14px) |
| Label text | body-medium | **body-large** (readable at arm's length) |
| Switch row | default | **min-height 48px** (track unchanged) |

### 4. Calendar / datebox popup (`_calendar.css`)
| Element | Desktop | Mobile |
|---------|---------|--------|
| Popup width | ~268px grid | **max-width 360px** (fits 7 comfortable columns) |
| Day cell height | 40px | **48px** |
| Hover / selected disc | smaller | **40×40** |
| Month / prev / next nav buttons | small | **44×44**, glyph **24px** |

### 5. Window / panel (`_window.css`)
Close-affordance **placement is unchanged** (see `doc/spec/md3-close-affordance-placement.md`);
only sizes grow.
| Element | Desktop | Mobile |
|---------|---------|--------|
| Window header | 56px | **min 48px** |
| Panel header | 48px | **min 48px** |
| Header buttons (close/min/max/expand) | 28–32px | **44×44**, glyph **24px** |

### 6. Mesh widgets — listbox / grid / tree + paging (`_mesh.css`)
| Element | Desktop | Mobile |
|---------|---------|--------|
| Listbox cell padding | default | `--zk-listbox-cell-padding` → **spacing-5** |
| Grid cell padding | default | `--zk-grid-cell-padding` → **spacing-5** |
| Row / cell min-height (list/row/tree) | content | **48px** |
| Header sort / menu buttons | small | **44×44**, glyph **24px** |
| Paging buttons | small | **44×44** (min-width 44px) |
| Paging input | small | **44px tall** |

### 7. Scrollbars (`_scrollbar.css`)
Marble only themes one scrollbar — the biglistbox custom `WScroll` widget. Native
scrollbars are left to the platform (touch overlay scrollbars), matching stock ZK.
| Element | Desktop | Mobile |
|---------|---------|--------|
| Biglistbox vertical WScroll | 14px wide | **16px** |
| Biglistbox horizontal WScroll | 14px tall | **16px** |

---

## What is deliberately NOT changed
- **Palette, shape, typography** — inherited from base tokens; tablet bundle is geometry-only.
- **Close/dismiss affordance placement** — unchanged per the close-affordance doc.
- **Native scrollbars** — left to the OS touch-overlay behavior.
- **Glyph sizes inside checkboxes/radios** — only their hit area/ripple grows.
- **Width-based responsiveness** — there is none; switching is purely UA-driven.
