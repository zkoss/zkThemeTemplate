---
name: marble-theme
description: >-
  Everything needed to maintain Marble, the Material Design theme for ZK Framework that becomes
  the default look-and-feel in ZK 11.0. Use this whenever the work touches Marble's CSS, tokens
  or theme architecture: implementing or refining a component's styles; adding, renaming or
  auditing a `--zk-*` token; wiring a new `.css.dsp` output; a component rendering unstyled or
  a stylesheet 404-ing; brand-colour or seed overrides; compact/data-dense density; z-index and
  stacking questions; running the preview app or the Playwright visual-regression suite; filing a
  ZK bug found while theming; or asking how Marble's vocabulary relates to the older IceBlue
  theme. Also use it when someone asks "how does this theme get built", "where does this CSS
  end up", "which port is the preview app on", or "why is there an `!important` here" — even if
  they never say "Marble". Also covers auditing CSS hygiene — orphan tokens, hardcoded colours,
  duplicate shadows, or redundant `display` declarations — and removing, reducing or justifying
  an `!important`.
---

# Maintaining Marble

Marble is a pure-CSS Material Design theme for ZK Framework, visually aligned with MUI v7 while
its tokens follow MD3 naming. No LESS, no preprocessor. It is slated to become the default
look-and-feel for **ZK 11.0** and has had no public release yet, so there is no backward
compatibility to preserve — but there *is* an installed base on the older IceBlue theme whose
vocabulary Marble does not share (see `reference/iceblue-parity.md`).

## The five rules that are never negotiable

1. **Every custom property is `--zk-*`.** `--md-sys-*` is banned, even though the token *values*
   follow MD3. Never invent a token family that does not already exist — in particular there are
   no `--zk-font-weight-*` tokens.
2. **No hardcoded colour.** Every colour comes through `var(--zk-color-*)`. A literal hex in
   component CSS is a defect.
3. **Cascade layers are assigned at build time**, in the order
   `zk-base < zk-components < zk-utilities`. Reset rules **must** land in `zk-base`.
   `build-css.js`'s `assertLayer()` enforces this and fails the build.
4. **Source is `.css`; the shipped artifact is `.css.dsp`.** ZK does not discover component CSS
   by convention — 78 `<css-uri>` entries name each file individually. See
   `reference/css-dsp.md` before adding, renaming or removing any file.
5. **Surgical changes.** Touch only what the task requires; match the surrounding style. When a
   theme-global invention collides with a ZK JS assumption, the first option to evaluate is
   *deleting the invention*, not engineering exceptions around it.

## Where things live

```
src/main/resources/web/
├── zul/css/                    → the zk/zul module (CE) — 87 files
│   ├── tokens/  _colors _typography _spacing _sizing _shape _elevation
│   │            _motion _zindex _fonts _splitter _component-theme _forced-colors
│   ├── base/    _reset _icons _cssflex _dnd
│   └── utility/ _colors _spacing _layout _typography _borders _elevation
│                _components _stack _print
├── js/zul/<pkg>/css/           → per-component CSS, 1:1 with a .css.dsp output
├── js/zkmax/<pkg>/css/         → zkcml/zkmax (EE) — 27 files
├── js/zkex/<pkg>/css/          → zkcml/zkex (PE) — 5 files
└── zkmax/css/tablet/           → concatenated into one tablet.css.dsp (EE-injected)
```

Build output lands in `target/classes/web/marble/`. `_`-prefixed files are **partials** —
they are bundled by `build-css.js`, never shipped individually.

## Commands

```bash
npm install                                    # first time
npm run build:css                              # build the theme CSS
npm run watch                                  # rebuild + live-reload on change
npm run check:css-dsp                          # verify ZK's <css-uri> requests all resolve
npm run check:forced-colors                    # Windows High-Contrast a11y guards
npm run check:doc-links                        # dead links in doc/
npm run lint:css                               # stylelint
npm run audit:css                              # hardcoded px / orphan tokens
withjdk.sh 17 mvn test exec:java@preview-app   # preview app — JDK 17, one line, see below
mvn clean package                              # jar (add -Dmaven.test.skip=true on JDK 11)
```

**The preview app is on `http://127.0.0.1:8081`** and the IceBlue baseline app on `:8082`. Use
`127.0.0.1`, never `localhost`. `withjdk.sh 17` must be chained on one line — a bare `setjdk`
does not outlive the call. Details and the Playwright projects: `reference/verification.md`.

## Reference

| File | Read it when |
|---|---|
| `reference/tokens.md` | Adding, renaming or auditing a token; component-level theming variables; the z-index scale; what counts as a consumer |
| `reference/layers.md` | Anything touching `@layer`, the reset, the icon stub, or a surviving `!important` |
| `reference/zul-authoring.md` | Writing or fixing a preview page; a page that 404s or 500s; text that will not take a font; a flex row that stacks |
| `reference/brand-override.md` | A customer wants to rebrand by overriding one seed colour |
| `reference/density.md` | Compact / data-dense mode; anything about control heights |
| `reference/css-dsp.md` | Adding or renaming a CSS file; a component renders unstyled; a stylesheet 404s |
| `reference/verification.md` | Running the preview app, the Playwright suite, or screenshot baselines; the tablet gate; A/B against another theme |
| `reference/pitfalls.md` | **Read this before any non-trivial change.** Eleven mistakes already made once |
| `reference/bug-filing.md` | The defect is ZK's, not the theme's, and needs a Jira ticket |
| `reference/iceblue-parity.md` | Questions about IceBlue, the `--zk-*` public API break, or Theme Pack palettes |
| `reference/css-audit.md` | Auditing CSS hygiene — orphan tokens, hardcoded colours, repeated shadows, `display` declarations that restate a default; what `npm run audit:css` reports and how to triage it |
| `reference/important-reduction.md` | Removing, reducing or justifying an `!important`; the count and probe scripts; the render-neutral proof bar |

## ZK version coordinates

ZK's FL/Eval builds publish **two servlet flavours under distinct version strings** in the eval
repository, and `dependency:resolve` succeeding does **not** tell you which one you got:

- javax (legacy): `11.0.0.FL.<date>-Eval`
- jakarta: `11.0.0-jakarta.FL.<date>-Eval` — `-jakarta` sits **before** `.FL`, not at the end

The preview app is Spring Boot 3 and needs the **jakarta** flavour; the wrong one fails at
startup with `Failed to introspect … ZkAutoConfiguration: javax/servlet/…`. `pom.xml`'s
`<zk.version>` is currently `11.0.0-jakarta.FL.20260909` — the `pom.xml` is authoritative, and the
root `CLAUDE.md` still names an older version. List candidates with
`curl -s https://mavensync.zkoss.org/eval/org/zkoss/zk/zk/maven-metadata.xml | grep '<version>11'`;
check a resolved jar's flavour with
`unzip -p <zk.jar> 'org/zkoss/zk/ui/http/*.class' | strings | grep -c javax/servlet`.

## External reference: MUI's CSS

Marble's visual values follow MUI. Before implementing or refining any component's CSS, read the
matching MUI stylesheet for exact padding, font sizes, state-layer colours and transitions:
`/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` — the `INDEX.md`
there holds the ZK → MUI file lookup (Button → `Inputs/Button.css`, Grid/Listbox →
`DataDisplay/Table.css`, Window dialog → `Feedback/Dialog.css`, Tabbox → `Navigation/Tabs.css`,
and so on). This path is machine-local; after migration, re-home or re-fetch the extract.

## Scripts

This skill's tooling lives in `scripts/`.

- `scripts/audit-css.sh` — mechanical hygiene pass; `npm run audit:css`.
- `scripts/check-default-display.js` — check 5 of the audit; resolves root tags from ZK molds.
- `scripts/count-important.js` — comment-aware `!important` inventory.
- `scripts/probe.js` — computed-style A/B probe against the running preview app.

`doc/spec/index.md` remains the normative index for the specifications this skill summarises.
