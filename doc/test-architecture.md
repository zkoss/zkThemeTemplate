# Test Architecture & Coverage

> **Status:** descriptive (reflects the suite as of 2026-06-29) + a remediation roadmap
> for per-component visual coverage. This is a *process/architecture* doc, so it lives in
> `doc/` root, not `doc/spec/` — `doc/spec/` is reserved for normative *design* specs
> (see [spec/index.md](spec/index.md)).

## 1. Overview — two complementary test layers

Marble is verified by **two distinct, complementary layers**. Don't conflate them:

| Layer | What it is | Where it's documented |
|-------|-----------|------------------------|
| **A. Runnable test suite** (Playwright) | Automated checks a CI/dev run executes against the live preview app: visual baselines, computed-style regression guards, smoke, framework-class contracts, reset scoping, tablet UX. | **This document.** |
| **B. AI verification harness** | The human+agent loop that *authors and signs off* component design: contracts, evaluator/generator agents, dual gates, outcome minimums. | [verification-harness-decisions.md](verification-harness-decisions.md), [orchestrator-playbook.md](orchestrator-playbook.md), [spec-author-architecture.md](spec-author-architecture.md), [state-coverage-audit.md](state-coverage-audit.md) |

This document covers **Layer A**. Layer B is the *process* that decides whether a
component "looks right"; Layer A is the *code* that keeps it from silently regressing.

## 2. The Playwright suite — 6 projects

Config: [src/test/playwright/playwright.config.ts](../src/test/playwright/playwright.config.ts).
`baseURL: http://localhost:8080` (the preview app must be running), `snapshotDir:
doc/screenshots`, snapshot path `{testName}/{arg}{ext}` — **no `{projectName}` segment**,
so tablet specs use a `tablet-` describe prefix to keep their baselines from colliding
with the desktop ones.

| Project | Spec file | What it guarantees | What it does **not** do |
|---------|-----------|--------------------|--------------------------|
| `chromium` | [screenshot.spec.ts](../src/test/playwright/screenshot.spec.ts) | Desktop **depth layer**: visual baselines (gallery + hover/focus/active) for 16 components **and** ~14 **computed-style/geometry regression guards** | It is *not* one-screenshot-per-component — it is a hand-picked depth list (see §5) |
| `gallery` | [gallery-scan.spec.ts](../src/test/playwright/gallery-scan.spec.ts) | Desktop **breadth layer**: one gallery screenshot per visual preview page, **auto-discovered** by scanning `src/test/resources/web/*.zul`. New pages are covered the moment they're added | One shot per page only — no per-state matrix; skips non-visual/non-deterministic pages (see the spec's `SKIP` set) |
| `smoke` | [render-smoke.spec.ts](../src/test/playwright/render-smoke.spec.ts) | Every preview page (105) loads with **no HTTP 500 / ZK compose error** and renders its wrapper | No visual/style assertions — "it renders", not "it looks right" |
| `framework` | [framework-classes.spec.ts](../src/test/playwright/framework-classes.spec.ts) | JS-toggled **framework classes** ZK emits at runtime: `.z-word-nowrap` (frozen grid), `.z-dragged`, `.z-drag-over`, `.z-drag-ghost`, `.z-drop-ghost/content/icon` | Injects DOM to test runtime markup — does not perform real drag gestures |
| `reset` | [reset-scoping.spec.ts](../src/test/playwright/reset-scoping.spec.ts) | `org.zkoss.zul.theme.browserDefault` reset-CSS scoping: global `reset.css` vs `@scope(.z-page)` `reset-embed.css` | — |
| `tablet` | [tablet.spec.ts](../src/test/playwright/tablet.spec.ts) | iPad-Air viewport + mobile UA: `tablet.css` enablement, **44px touch targets**, no horizontal overflow, wheel pickers, bottom-sheet combobox, 4 gallery baselines | Only 4 components have tablet *visual* baselines |

> **Key nuance:** the `chromium` project mixes two test kinds. About 16 components have a
> real `toHaveScreenshot()` **visual baseline**; another ~14 `describe` blocks are
> **computed-style assertions** that pin a specific past regression (e.g. errorbox beak
> position, notification opacity, inputgroup focus shift) *without* a screenshot. A
> component can therefore have automated protection without appearing in the baseline set.

## 3. How to run

```bash
# 1. Start the preview app (prerequisite for every project) — needs JDK 17
withjdk.sh 17 mvn test exec:java@preview-app          # serves http://localhost:8080

# 2. Run the whole suite (all 5 projects)
npm run screenshot:test

# 3. Re-baseline after an intentional visual change
npm run screenshot:update                              # playwright --update-snapshots

# Target one project / one component
npx playwright test --config src/test/playwright/playwright.config.ts --project=chromium
npx playwright test --config src/test/playwright/playwright.config.ts -g "button"
```

Adjacent CSS-quality gates (not Playwright, but part of the same verification habit):

```bash
npm run lint:css     # stylelint over src/main/resources/web/**/*.css
npm run audit:css    # orphan tokens, hardcoded colors, duplicate rules (css-theme-audit skill)
```

**Iceblue reference comparison** (compare Marble against stock ZK to find coverage gaps):

```bash
withjdk.sh 17 mvn test exec:java@preview-app-iceblue -Dspring.profiles.active=iceblue  # :8081
./scripts/render-iceblue-baseline.sh <component...>    # → doc/contracts/baselines/<comp>-iceblue.png
./scripts/audit-css-coverage.sh                        # .z-* class coverage gap vs iceblue
```

Other verification tooling: `scripts/check-doc-categories.sh` (skill↔contract boundary
invariants) and `.claude/skills/zk-component-rules/tools/check-framework-classes.mjs`
(framework-class compliance across themes).

## 4. Visual-regression mechanism

- **Two structural page families** (`screenshot.spec.ts` header comment):
  - **Gallery pages** (button, textbox, the input controls): one `.z-p-8` wrapper holding
    `pv-cols-N` / `pv-row` demo rows. Gallery shot captures the whole `.z-p-8`; dynamic
    states target a bare `.z-*` element (`.z-textbox`, `.z-combobox-input`, …).
  - **Variant pages** (listbox, grid, tabbox, tree, window, panel): each demo is wrapped
    in `.pv-variant-<name>`; capture/scope by that wrapper.
- **Reusable state arrays:** `hoverFocusStates` (hover, focus) and `buttonDynamicStates`
  (adds `active` via `mouse.down()`).
- **Baseline layout:** `doc/screenshots/<testName>/<arg>.png`, e.g.
  `button-default-hover/default-hover.png`, `textbox-gallery/gallery.png`.
- **Tablet baselines** carry a `tablet-` prefix (`tablet-button-gallery/…`) so they never
  collide with desktop baselines under the `{projectName}`-less path template.

## 5. Coverage matrix (the honest picture)

There are **105 preview pages** (`src/test/resources/web/*.zul`). Automated coverage by kind:

| Coverage kind | Count | Components |
|---------------|-------|-----------|
| **Depth visual baseline** (`screenshot.spec.ts`, gallery + states) | **16 desktop** | button, textbox, checkbox, combobox, listbox, grid, datebox, timebox, spinner, bandbox, selectbox, tabbox, tree, window, panel, toast |
| **Breadth gallery baseline** (`gallery-scan.spec.ts`, auto-discovered) | **73 pages** | every other *visual* page — layouts, data variants, inputs, containers, feedback, enterprise (see §6 step 2) |
| **Tablet visual baseline** | 4 | button, checkbox, combobox, listbox |
| **Computed-style / geometry regression guard** (no screenshot) | ~14 blocks | button (disabled variants), combobox (item gap), colorbox (viewport-fill + popup dismiss), window/panel/groupbox (header height), errorbox, notification, toast (base), tooltip, linelayout, splitter/splitlayout/borderlayout, stepbar, dropupload, inputgroup |
| **Framework-class contract** | drag/drop + frozen grid | grid (frozen), dnd / drag-drop classes |
| **Smoke (renders without error)** | **all 105** | every preview page |

**So: does every component have a basic visual test? → Now yes, for every *visual* page.**
The depth layer (16) + the breadth scan (73) give **89 of 105 pages** a visual baseline.
The remaining **16** are intentionally excluded in `gallery-scan.spec.ts`'s `SKIP` set
(the authoritative list — tune it there): non-visual primitives (`area`, `html`, `iframe`,
`imagemap`, `scrollbar`), meta/SPA pages (`overview`, `preview`, `inputs`), and
non-deterministic/hardware/animated pages whose screenshot would be flaky (`camera`,
`barcodescanner`, `captcha`, `video`, `audio`, `fileupload`, `loading`, `loadingbar`).
Because the breadth scan reads the filesystem, **a new preview page is auto-covered** the
moment it's added — the silent-gap problem is closed.

### Two correctness caveats found while writing this doc

1. **`screenshot.spec.ts` is a hand-maintained list, not a scan.** Each component needs a
   manually-added `test.describe()` block. A new `*.zul` preview page gets **zero** visual
   coverage until someone edits the spec — the gap grows silently.
2. **The `snapshotDir` is shared with the AI-harness eval artifacts.** There are **no
   stale/orphan Playwright baselines** — every real baseline (the `*-gallery` / `*-hover`
   / `*-focus` / `*-active` folders) maps to a current test. But `doc/screenshots/` also
   holds committed *manual eval artifacts* — GIFs/SVG/JSON/ad-hoc PNGs for `cascader`,
   `coachmark`, `goldenlayout`, `linelayout`, `portallayout`, `slider`, `splitter`,
   `stepbar` — written there by the `zk-theme-evaluator` agent convention and **linked
   from `tasks/eval-reports/*.md`, `tasks/design-reviews/*.md`, and `doc/skill-gaps.md`**.
   These are referenced evidence, **not** test baselines, and must not be pruned. Mixing
   both kinds in one directory is a smell (a future cleanup could relocate the eval-artifact
   convention to its own folder), but that is out of scope here.

### Pages with no visual baseline (intentionally excluded)

After the breadth scan (§6 step 2), the only pages **without** a visual baseline are the
**16** in `gallery-scan.spec.ts`'s `SKIP` set — by design, not by gap (that `Set` is the
authoritative list; this prose tracks it):

- **Non-visual primitives / structural:** area, html, iframe, imagemap, scrollbar
- **Meta / SPA pages:** overview, preview, inputs
- **Non-deterministic / hardware / external / animated** (a static shot would be flaky): camera, barcodescanner, captcha, video, audio, fileupload, loading, loadingbar

To add one of these later, remove it from `SKIP` and supply a determinism strategy. The
**calendar** page is the worked example: ZK bakes the *server's* "now" into a `<calendar>`'s
default `value` (month + selected-day highlight) and evaluates `constraint="no past/future"`
greying against the real clock, so freezing only the browser clock does **not** help. The
fix (in `calendar.zul`) pins every `<calendar value="${fixedDate}">` and the datebox to a
fixed **past** date (2020-03-15): a past month is unambiguously "past" vs any real today, so
the today-highlight never shows and the greying is stable. Apply the same idea elsewhere
(stub media for `video`/`audio`, etc.).

> **Cross-environment caveat:** the SKIP set was tightened to also capture `signature`,
> `cropper`, `pdfviewer`, `biglistbox`, and `barcode`. These render via `<canvas>` /
> embedded docs / virtualised lists and passed deterministically here (with the spec's
> `maxDiffPixelRatio: 0.01` tolerance), but carry higher cross-machine/CI flake risk. If CI
> later flags one, re-add it to `SKIP` or raise its tolerance.

## 6. Roadmap to per-component visual coverage

The goal: **every visual component gets at least a basic gallery screenshot, and new
components are covered by default.** Recommended order:

1. ~~**Prune the orphan baselines**.~~ ✅ **Done 2026-06-29 — superseded by the actual
   finding.** Investigation showed there are *no* orphan Playwright baselines (see §5
   caveat 2). The only cruft was **4 empty untracked dirs** (`anchorlayout`, `rowlayout`,
   `tablelayout`, `timepicker`), now removed. The GIF/PNG/JSON folders are referenced eval
   evidence and were deliberately **kept**.
2. ~~**Structural fix — make coverage automatic (recommended).**~~ ✅ **Done 2026-06-29.**
   Added [gallery-scan.spec.ts](../src/test/playwright/gallery-scan.spec.ts) + a dedicated
   `gallery` project in [playwright.config.ts](../src/test/playwright/playwright.config.ts).
   It **scans `src/test/resources/web/*.zul` at collection time** and captures one `.z-p-8`
   gallery screenshot per page, with a `SKIP` set (non-visual/non-deterministic) and a
   `COVERED_ELSEWHERE` set (the 16 bespoke components). **73 baselines generated and
   verified** (initially 59; the `SKIP` set was later tightened to also cover `a`, `label`,
   `separator`, `space`, `scrollview`, `dnd`, `runtime-error`, `signature`, `cropper`,
   `pdfviewer`, `biglistbox`, `barcode`, `calendar` — made deterministic, see §5 — and
   `coachmark`) — a second run with no `--update` passes deterministically. A new `.zul`
   is now covered the moment it's added.
   - Hand-written blocks remain in `screenshot.spec.ts` for the richer state matrices
     (button variants, input hover/focus, `.pv-variant-*` layout pages) and the
     computed-style guards — the depth layer; the scan is the breadth layer.
   - Regenerate after intentional visual changes: `npm run screenshot:update`.
3. ~~**Backfill state coverage**~~ ✅ **Done 2026-06-29 (first pass).** Added hover/focus
   depth blocks to `screenshot.spec.ts` for the distinct interactive controls whose state
   layer the breadth gallery can't show: **radiogroup** (hover/focus), **rating** (hover —
   highlight spread), **slider** (hover/focus on the knob), **colorbox** (hover/focus on
   the swatch). 7 new baselines, verified. Containers (groupbox, popup, drawer, menubar,
   toolbar) and the grid/listbox/tree variant pages are adequately served by their breadth
   gallery shot; revisit if a specific interaction regresses.
4. ~~**Extend tablet baselines** beyond the current 4 seed components.~~ ✅ **Done
   2026-06-29.** Added 8 touch-relevant form/data controls to `tablet.spec.ts`'s
   `visualCases` (textbox, datebox, timebox, spinner, selectbox, radiogroup, slider, grid),
   taking the tablet gallery from 4 → 12. 8 new baselines, verified at the iPad-Air
   viewport. The interaction tests (touch-size, wheel picker, bottom-sheet, dismiss) still
   cover the original seeds.
5. Interaction-only states (drag, open-popup, validation) that a static gallery can't
   show are tracked in [state-coverage-audit.md](state-coverage-audit.md) — keep that audit
   as the source of truth for "which states a contract requires vs which the gallery shows".

**Progress:** steps 1–2 are done (2026-06-29) — the breadth scan now makes the "basic
visual test per visual page" guarantee self-maintaining. Steps 3–4 (state depth and
broader tablet coverage) remain.

## 7. Related docs

- [spec/index.md](spec/index.md) — normative design specs (the "what it must look like")
- [verification-harness-decisions.md](verification-harness-decisions.md) — why the AI harness is shaped as it is
- [orchestrator-playbook.md](orchestrator-playbook.md) — how to run the agent verification loop
- [spec-author-architecture.md](spec-author-architecture.md) — skill vs contract documentation split
- [state-coverage-audit.md](state-coverage-audit.md) — contract states vs preview-gallery coverage
