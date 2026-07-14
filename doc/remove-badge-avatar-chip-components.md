# Remove badge / avatar / chip components — deletion runbook (deferred)

## Context

The Marble theme currently ships **hand-rolled** `badge`, `avatar`, and `chip` styling as
plain utility classes (`.z-badge*`, `.z-avatar*`, `.z-chip*`). In the upcoming **ZK 11.0**,
these are provided as **native framework components**, so the theme should stop maintaining
its own versions and instead style the native components when ZK 11 lands.

This document is a **findings + execution runbook** only. Per the user's instruction, **no
files are deleted/edited now** — this captures everything needed to perform the removal
cleanly in a future session. Current ZK version is `10.2.1-jakarta`.

The extraction is clean: the three utilities live in three dedicated CSS files with **no
tangled dependencies** in core framework config. The complication is **widespread incidental
use** of the classes across ~16 demo/use-case pages, which must be decided on at execution
time (see "Open decision" below).

---

## Part 1 — Dedicated artifacts to DELETE (whole files)

| # | File | Notes |
|---|------|-------|
| 1 | `src/main/resources/web/zul/css/base/_badges.css` | All `.z-badge*` + color variants (~94 lines) |
| 2 | `src/main/resources/web/zul/css/base/_avatars.css` | All `.z-avatar*`, sizes, `.z-avatar-group` (~47 lines) |
| 3 | `src/main/resources/web/zul/css/base/_chips.css` | All `.z-chip*` + color variants (~25 lines) |
| 4 | `src/test/resources/web/usecase2/avatars.zul` | Dedicated avatar demo page |
| 5 | `src/test/resources/web/usecase2/badges.zul` | Dedicated badge demo page |
| 6 | `src/test/resources/web/usecase2/chips.zul` | Dedicated chip demo page |
| 7 | `doc/mira/components-avatars.html` | Mira reference mockup |
| 8 | `doc/mira/components-badges.html` | Mira reference mockup |
| 9 | `doc/mira/components-chips.html` | Mira reference mockup |
| 10 | `src/test/resources/web/img/avatar-placeholder.svg` | **Orphan — 0 references** anywhere; safe delete (verify with grep first) |

`target/classes/**` and `target/test-classes/**` copies are build output — regenerated, no
manual deletion needed.

---

## Part 2 — Surgical edits (references inside shared files)

### Build & registration
- **`scripts/build-css.js`** (~lines 86–88): remove the three `normFiles` entries
  `'zul/css/base/_badges.css'`, `'zul/css/base/_chips.css'`, `'zul/css/base/_avatars.css'`
  (they bundle into `norm.css.dsp`).

### SPA navigation / validation
- **`src/test/resources/web/usecase2/_sidebar.zul`**: remove the **Avatars / Badges / Chips**
  `<navitem>` entries (3). ⚠️ The footer user `z-avatar` div is *incidental usage* (Part 3).
- **`src/test/java/zk/example/UseCase2VM.java`** (`VALID_PAGES` set): remove the string
  literals `"avatars"`, `"badges"`, `"chips"`.
- **`CLAUDE.md`** (project): the "UseCase2 SPA … Valid page names" list includes `avatars`,
  `badges`, `chips` — remove those three tokens.

### Utility reference page
- **`src/test/resources/web/utility/components.zul`**: remove the dedicated **chip**
  (~lines 8–25), **badge** (~29–79), and **avatar** (~83–150) demonstration sections — they
  document utilities that will no longer exist. (Highest incidental count: 52 matches.)

### Page-level CSS
- **`src/test/resources/web/usecase2/usecase2.css`**: remove the `.z-chip` card-spacing block
  (~lines 520–524: `.z-card--project .z-chip, .z-card--image .z-chip { … }`); optionally drop
  the now-orphan comment markers (~361–365, ~478–479).
  ⚠️ **KEEP** the `.z-nav-info` / `.z-navitem-info` block (~132–142) — that is navitem
  badge styling, **not** the removed `.z-badge` utility.

### Comment-only cleanups (optional, cosmetic)
- `src/main/resources/web/zul/css/tokens/_colors.css` line ~33: comment
  `/* … needed for badges */` — reword. **KEEP the tokens** (see Part 4).
- `src/main/resources/web/zul/css/tokens/_shape.css` line ~5: drop "chips" from
  `/* inputs, chips */`.
- `src/main/resources/web/zul/css/base/_reset.css` line ~3: drop "badge/chip/avatar" from the
  cascade-doc comment.
- `.claude/skills/zk-component-rules/components/hlayout-vlayout.md` (~lines 95, 98): the
  overflow-clipping example uses `.z-badge`; swap to a class that still exists.

### Docs scrub (planning/audit — treat as light cleanup)
- `doc/usecase-sclass-audit.md` (~line 7): drop `_chips.css` / `_badges.css` from the file list.
- `doc/mira-alignment-plan-v2.md`, `doc/visual-parity-spiral.md`,
  `doc/mira-reports/default-diffs.md`: remove badge/avatar/chip rows / checklist items.
- `doc/skill-gaps.md`: historical log — **leave as-is** (record of past work).

---

## Part 3 — Open decision: incidental usage (~16 pages)

These pages use `z-badge` / `z-avatar` / `z-chip` **incidentally** (status chips, user
avatars, count badges). After the CSS is deleted they render as unstyled plain elements.
**Decide the strategy at execution time:**

- **Option A — Strip markup:** remove the `z-*` elements from each page. Dashboards lose those
  visual elements (gaps) but no dangling references remain.
- **Option B — Migrate to ZK 11 native** `<badge>`/`<avatar>`/`<chip>` components. Only viable
  **after** upgrading from `10.2.1-jakarta` to ZK 11.0, then re-style the native component
  classes in the theme. This is the intended end-state per the project rationale.

Affected files (match counts at time of survey):

| File | matches | File | matches |
|------|:--:|------|:--:|
| `usecase2/projects.zul` | 40 | `usecase2/invoice-list.zul` | 8 |
| `usecase2/saas.zul` | 11 | `usecase2/products.zul` | 6 |
| `usecase2/pages-profile.zul` | 10 | `usecase/inventory-table.zul` | 5 |
| `usecase2/orders.zul` | 10 | `usecase2/tasks.zul` | 4 |
| `usecase2/pages-chat.zul` | 9 | `usecase2/analytics.zul` | 4 |
| `usecase2/default.zul` | 9 | `usecase/ops-dashboard.zul` | 4 |
| `usecase/ticket-inbox.zul` | 9 | `usecase2/pages.zul` | 3 |
| `usecase2/index.zul` (topbar avatar) | 1 | `usecase2/cards.zul` | 1 |
| `usecase2/_sidebar.zul` (footer avatar) | 1 | `usecase/item-editor.zul` | 1 |

---

## Part 4 — Explicitly KEEP (do NOT remove)

- **`--zk-color-status-*` and `--zk-color-on-status` tokens** (`tokens/_colors.css` ~96–102).
  Used far beyond badges/chips: `progressmeter.css`, `notification.css`, `toast.css`,
  `button.css`, and the `.z-text-*` / `.z-bg-*` utilities in `utility/_colors.css`. Removing
  them would break those components.
- **Navitem badge feature** — `.z-nav-info` / `.z-navitem-info` styling in
  `js/zkmax/nav/css/nav.css` and `usecase2.css`, plus `badgeText="…"` attributes on
  `<navitem>` in `_sidebar.zul` and `navbar.zul`. This is a native ZK nav feature, **not** the
  removed `.z-badge` utility.
- **`src/test/playwright/framework-classes.spec.ts`** "`.z-drop-ghost` is a styled chip" test
  (~line 69) — tests drag-drop ghost styling; "chip" is descriptive, not the `.z-chip`
  utility.

---

## Part 5 — Verification (after future execution)

1. `npm run build:css` → grep the built bundle: `grep -rn "z-badge\|z-avatar\|z-chip"
   target/classes/web/marble` returns **nothing**.
2. Repo sweep: `grep -rn "z-badge\|z-avatar\|z-chip" src/ doc/ CLAUDE.md` returns only the
   intentionally-kept items (none, if Option A; or native-component classes if Option B).
3. Build the jar: `mvn clean package -Dmaven.test.skip=true` (JDK 11) or full build on JDK 17.
4. Run the preview app (`withjdk.sh 17 mvn test exec:java@preview-app`) and confirm:
   - usecase2 SPA sidebar no longer lists Avatars / Badges / Chips;
   - deep-links `#avatars` / `#badges` / `#chips` no longer resolve (and `UseCase2VM`
     navigation doesn't error);
   - the utility/components reference page renders without the removed sections.
5. Run the Playwright screenshot suite — **no baseline changes expected** (no tested root
   component page uses these classes; no baselines exist for the deleted pages).

---

## Execution order (suggested)

1. Resolve the **Part 3 open decision** (strip vs migrate).
2. Delete Part 1 files.
3. Apply Part 2 surgical edits (build config → nav/VM/CLAUDE.md → reference page → page CSS →
   comments/docs).
4. Handle Part 3 incidental usages per chosen option.
5. `npm run build:css` and run Part 5 verification.
