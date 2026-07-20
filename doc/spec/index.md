# Marble Theme — Specification Index

This directory collects the **normative specifications** for the Marble theme: the
documents that *define* how the theme must look and behave. When two sources
disagree, these specs win.

For the *why* behind these rules (design rationale), point-in-time audits, harness
process docs, and reference lookups, see the other documents that remain directly
under [`../`](../).

## Specs

| Spec | What it governs |
|------|-----------------|
| [DESIGN.md](DESIGN.md) | Root design-language rulebook — surface palette, text colors, elevation hierarchy |
| [design-decisions.md](design-decisions.md) | Scope & won't-do decisions — dark mode, dedicated high-contrast theme, RTL backlog, theme priority, absent font props, ZK version support |
| [component-state-model.md](component-state-model.md) | Readonly vs disabled state model — popup controls render readonly as active, grey reserved for disabled |
| [brand-override.md](brand-override.md) | Brand-color override: seed one token (`--zk-color-primary`) → containers/overlays derive via `oklch(from …)` absolute tone |
| [component-theming-api.md](component-theming-api.md) | Per-component appearance knobs (`--zk-<comp>-*`) — restyle one component (fill/border/radius/state) at `:root` or a region without forking; cascade/load-order rules + per-family knob vocabulary. Shipped: button, input, window, grid, listbox, tree |
| [window-design-rules.md](window-design-rules.md) | Window `mode` → elevation mapping; `border` must never drive shadow |
| [spacing-policy.md](spacing-policy.md) | Widgets carry zero default margins; spacing is opt-in via containers/utilities |
| [navigation-surface-rules.md](navigation-surface-rules.md) | Navigation chrome uses MD3 tonal elevation (surface-container tiers), not box-shadows |
| [md3-close-affordance-placement.md](md3-close-affordance-placement.md) | Where close/dismiss icons sit (inline trailing vs surface top-corner) |
| [icon-policy.md](icon-policy.md) | FontAwesome → Lucide icon name mapping policy |
| [icon-index.md](icon-index.md) | Auto-generated canonical lookup of valid `z-icon-*` names + FA aliases (the reference data `icon-policy.md` governs; regenerate via `npm run build:css`) |
| [css-dsp-file-structure.md](css-dsp-file-structure.md) | The required `*.css.dsp` output files the theme must produce |
| [reset-scoping.md](reset-scoping.md) | `org.zkoss.zul.theme.browserDefault` reset-CSS scoping for JS-Embed host pages |
| [data-dense-mode.md](data-dense-mode.md) | Compact density via `data-density="compact"`; control-height ladder + alias layer |
| [tablet-design-overview.md](tablet-design-overview.md) | Tablet/mobile responsive theme layer (`tablet.css.dsp`) |
| [responsive-design.md](responsive-design.md) | Responsive utility system — `z-grid-fill` auto-fit + `z-grid-cols-auto`; intrinsic/auto-fit over Bootstrap Grid |
| [zk-mui-structural-gaps.md](zk-mui-structural-gaps.md) | ZK↔MUI differences unresolvable by CSS alone (floating label, multi-select, calendar today-marker, ripple) — expected limits, not bugs |
| [native-modern-ui-components.md](native-modern-ui-components.md) | Native `badge`/`chip`/`avatar`/`avatargroup` (ZK 10.4+) — class/attribute contract; old-utility → native-severity mapping; replaces the former `.z-badge`/`.z-chip`/`.z-avatar` utility CSS |

## Related

- [`../contracts/`](../contracts/) — per-component design contracts (one `.md` per ZK component). These are the component-level specs; they stay outside this directory because they are wired into the verification harness, agents, and skills.
- Everything else under [`../`](../) — design rationale (`verification-harness-decisions.md`, …), audits, process playbooks, and reference docs.
