# Native modern UI components — badge / chip / avatar (ZK 10.4+)

## Status
Adopted with the **ZK 10.4.0.FL.20260713-Eval** upgrade (base of ZK 11.0). Replaces the
theme's former hand-rolled `.z-badge` / `.z-chip` / `.z-avatar` **utility CSS**, which was
deleted (`zul/css/base/_badges.css`, `_chips.css`, `_avatars.css`).

## What changed
ZK 10.4 ships four native "modern UI components" (ZK-6097), registered in ZK core
`metainfo/zk/lang.xml`: **`avatar`, `badge`, `chip`, `avatargroup`**. (There is **no `tag`
component** — a "tag pill" is `chip`.) The theme now styles the native widgets instead of
utility classes.

- Theme CSS lives at `src/main/resources/web/js/zul/wgt/css/{badge,chip,avatar,avatargroup}.css`
  (package `zul.wgt`; auto-scanned 1:1 → `<name>.css.dsp`). Each is self-contained, token-only,
  wrapped in `@layer zk-components`. Registered as `CSS_URI_BACKED` in `scripts/build-css.js`.
- No `lang-addon.xml` edits: ZK core owns the component→css-uri wiring; `MarbleThemeProvider`
  rewrites `~./js/zul/wgt/css/<c>.css.dsp` → `~./marble/…`.

## Native class / attribute contract
- **badge**: `<span class="z-badge z-badge-{severity} [z-badge-{placement}|z-badge-standalone]
  [z-badge-dot]">…<span class="z-badge-indicator">n</span></span>`. Attrs: `count`, `value`,
  `max` (default 99), `showZero`, `dot`, `severity` (info default), `placement` (top_right default).
- **chip**: `<span class="z-chip z-chip-{severity} [z-chip-small] [z-chip-rounded]
  [z-chip-closable] [z-chip-disabled]">…<button class="z-chip-close">…</button>?</span>`. Attrs:
  `label`/`image` (LabelImageWidget), `severity` (info default), `size`, `rounded`, `closable`,
  `disabled`. Per-instance colour via `style="--zk-chip-bg/--zk-chip-border/--zk-chip-color"`.
- **avatar**: `<span class="z-avatar z-avatar-{shape} z-avatar-{size}">img|icon|<span
  class="z-avatar-text">AB</span></span>`. Attrs: `image`, `label`, `shape` (circle default),
  `size` (medium default), `gap`. Size via `--zk-avatar-size` / `--zk-avatar-font-size` hooks.
- **avatargroup**: overlapping stack; `size`/`shape` cascade to children; `--zk-avatargroup-overlap`;
  "+N" overflow = `.z-avatargroup-overflow`.

## Severities: fixed native set vs. old utility variants
Native severities are **info · success · warning · danger · secondary**. The old utility palette
had extra names; migration mapping (applied to all ZUL usages):

| old utility variant | native severity |
|---|---|
| `z-chip-info` / `z-badge-info` | `info` |
| `z-chip-success` / `z-badge-success` | `success` |
| `z-chip-warning` / `z-badge-warning` | `warning` |
| `z-chip-error` / `z-badge-error` | **`danger`** |
| `z-chip-neutral` | **`secondary`** |
| `z-chip-primary` | **`info`** |
| `z-chip-on-primary` | **dropped** (no equivalent) |

## Preview
Dedicated pages: `badge.zul`, `chip.zul`, `avatar.zul` (component browser → **Data Display**).
Showcase: `utility/components.zul`. Migrated real usages: `usecase/ticket-inbox`,
`inventory-table`, `ops-dashboard`, `item-editor`.

## Follow-up (out of scope here)
The 10.4 upgrade also introduced three more native components — **breadcrumb, carousel,
confirmpopup** — currently **empty-stubbed** in `build-css.js` (render with ZK default styling).
They still need real Marble theming.
