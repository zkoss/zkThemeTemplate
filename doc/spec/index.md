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

## Related

- [`../contracts/`](../contracts/) — per-component design contracts (one `.md` per ZK component). These are the component-level specs; they stay outside this directory because they are wired into the verification harness, agents, and skills.
- Everything else under [`../`](../) — design rationale (`responsive-design.md`, `verification-harness-decisions.md`, …), audits, process playbooks, and reference docs.
