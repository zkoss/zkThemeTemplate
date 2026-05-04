# Visual Parity Spiral — UseCase2 vs Mira

## Context

This document is the **operational SOP for Phase 5** of [`doc/mira-alignment-plan-v2.md`](mira-alignment-plan-v2.md). The master plan owns the progress tracker and page order; this document owns the session procedure, stop conditions, and framework gap rules.

All UseCase2 pages exist and routing works. The visual gap between the ZK implementation and the Mira reference (`mira.bootlab.io`) is significant on many pages. This document defines the repeatable **implement → screenshot → audit → fix** loop that systematically closes this gap one page at a time.

---

## Stop Conditions

### Per-diff stop (single row in diff table)
- After **2 fix attempts** on one row without visible improvement → mark `🚫 BLOCKED` and move on.
- Do not spend a 3rd attempt on the same diff row in the same session.

### Per-page stop
- After **3 full FIX→VERIFY loops** on a page with open P1/P2 rows remaining → stop, document remaining rows as `WONTFIX` or `BLOCKED`, and move to the next page.
- A page with only P3 rows open is considered **Done Enough** — mark ✅ and move on.

### Framework limitation stop
- If a diff is caused by a **fundamental ZK vs MUI structural difference** (see section below), mark the row `⚠️ FRAMEWORK` immediately, document it in `doc/mira-reports/framework-gaps.md`, and do not attempt to fix it.

---

## Framework Gaps — Known ZK vs MUI Differences

Some visual differences cannot be fully resolved because ZK and MUI (React) have different DOM structures, event models, and component lifecycles. These are **expected** and should be tracked, not chased.

See: `doc/mira-reports/framework-gaps.md`

### Known categories of unresolvable gaps

| Category | Description | Workaround |
|---|---|---|
| Component DOM wrapper | ZK wraps every component in extra `<span>` or `<div>` with `z-*` class — extra nesting can shift layout | Style the wrapper; accept minor spacing delta |
| Form input internals | ZK `<textbox>`, `<combobox>` render with inner `<input>` + outer `<span>` — hard to match MUI's single `<input>` with floating label | Best-effort styling; document gap |
| Button hover/ripple | MUI uses a Material ripple effect on buttons; ZK has no equivalent in pure CSS | CSS hover overlay is close enough; no ripple |
| SVG icons vs font icons | Mira uses Lucide SVG icons; ZK uses Font Awesome icon font — glyph shapes differ | Accept glyph difference; focus on size/color |
| Image components | ZK `<image>` renders `<span class="z-image"><img/></span>` — span wrapper can break edge-to-edge layouts | Use `<html>` CDATA for images needing edge-to-edge |
| Transition/animation | MUI has React-controlled mount/unmount transitions; ZK has limited CSS-only transitions | Static CSS transitions are acceptable |
| Data-driven content | Mira uses real API data + photos; ZK demo uses placeholder text/images | Placeholder content is acceptable |
| Autocomplete dropdown | MUI combobox uses a Portal-rendered dropdown; ZK uses ZK popup mechanism | Accept structural difference |

---

## The Spiral Loop (one session = one page)

### Layer order within each page (Macro → Micro)

| Layer | What to check |
|---|---|
| L1 Layout | Column count, widths, heights, overflow, flex/grid structure |
| L2 Surface | Background colors, card colors, border colors, shadows |
| L3 Typography | font-family, font-weight, font-size, line-height, color |
| L4 Spacing | padding, margin, gap — match px values to Mira |
| L5 Shape & detail | border-radius, icon (correct glyph + size), hover/focus state |

Always fix L1 before L5 — layout diffs mask spacing diffs.

### Per-session steps

```
1. CAPTURE  — Screenshot local page at 1440×900 via browser automation
              (navigate to http://localhost:8080/usecase2/index.zul#<page>)
              Save → doc/mira-reports/<page>-local.png

2. COMPARE  — Open Mira reference page in browser
              Save screenshot → doc/mira-reports/<page>-target.png

3. AUDIT    — Run $critique and $layout (impeccable analysis commands) on the local page
              to generate a structured list of UX/spacing/hierarchy issues.
              Then do side-by-side diff against Mira target, L1 → L5.
              Merge both sources into the diff table at doc/mira-reports/<page>-diffs.md.
              Each row: Priority | Layer | Element/Selector | Local value | Target value
              Mark any row that is a framework gap ⚠️ FRAMEWORK immediately.

4. FIX      — Implement CSS/ZUL changes for all P1 diffs, then P2, then P3
              Touch only files relevant to the current page's issues
              Shared CSS fixes (sidebar, card, topbar) benefit all pages — do these first
              STOP CONDITION: max 2 attempts per diff row; max 3 FIX→VERIFY loops per page

5. VERIFY   — Re-screenshot local page
              Update diff table (mark fixed rows ✅, blocked rows 🚫, framework rows ⚠️)
              If diffs remain AND loop count < 3: loop back to FIX
              If loop count = 3 OR only P3 rows remain: proceed to DONE

6. DONE     — Mark page ✅ in progress tracker
              Any 🚫 BLOCKED or ⚠️ FRAMEWORK rows → copy to framework-gaps.md
```

### Diff document format (`doc/mira-reports/<page>-diffs.md`)

```markdown
# <page> — Visual Diff Report

## Status: IN PROGRESS | DONE | DONE ENOUGH

| Priority | Layer | Element | Local | Target | Fixed |
|---|---|---|---|---|---|
| P1 | L1 | .m-card grid layout | 1 column | 3 columns | ✅ |
| P2 | L2 | .m-card background | #f5f5f5 | #fff | 🚫 BLOCKED |
| P3 | L5 | .z-icon-users size | 14px | 20px | ⚠️ FRAMEWORK |
```

Priority:
- **P1** = layout-breaking (wrong structure, missing element, overflow)
- **P2** = obviously wrong to a casual observer (wrong color, wrong font weight)
- **P3** = subtle (1–2px spacing, minor shade difference)

Status:
- ✅ Fixed
- 🚫 BLOCKED — tried 2× with no progress; move on
- ⚠️ FRAMEWORK — ZK vs MUI structural difference; document in framework-gaps.md

---

## Page Order

Fix shared infrastructure first, then pages by visual complexity / user-reported issues:

1. **Shared** — sidebar, topbar, `.m-card`, `.m-avatar`, `.m-badge` (fixes propagate everywhere)
2. `projects.zul` — ✅ DONE (trial run complete)
3. `default.zul` — highest visibility (dashboard landing page)
4. `analytics.zul`, `saas.zul`, `orders.zul`, `products.zul` — data-heavy pages
5. `invoice-list.zul`, `invoice-detail.zul`, `tasks.zul` — table-centric pages
6. Auth pages: `sign-in.zul`, `sign-up.zul`, `reset-password.zul`
7. Component demos: `buttons.zul`, `cards.zul`, `forms-*.zul`, `tables-*.zul`, etc.

---

## Impeccable Integration

The `impeccable` skill's **analysis commands** accelerate the AUDIT step. Only use these — not the design-generation commands, which would fight against matching Mira's exact style.

| Command | When to use |
|---|---|
| `$critique <page>` | Full heuristic review — UX issues, visual hierarchy, cognitive load |
| `$audit <page>` | Technical checks — accessibility, spacing consistency, responsive |
| `$layout <page>` | Focused spacing / rhythm / alignment issues (maps to L4) |

**Do not use**: `$craft`, `$shape`, `$colorize`, `$bolder`, `$typeset` — these impose impeccable's own design laws (OKLCH palette, typography preferences) which conflict with pixel-matching Mira's MUI-based design.

---

## Key Files to Edit (by fix type)

| Fix type | File |
|---|---|
| Sidebar layout / nav colors | component CSS + `usecase2.css` |
| Card / surface | `.m-card` in `usecase2.css` |
| Topbar | `src/test/resources/web/usecase2/usecase2.css` |
| Per-page layout | `src/test/resources/web/usecase2/<page>.zul` |
| ZK component (button, listbox, tabbox) | `src/main/resources/web/js/zul/*/css/*.css` |

**MUI CSS reference before editing any ZK component**: `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` — see `INDEX.md` for ZK→MUI file mapping.

---

## Verification Checkpoint (end of each session)

- [ ] `doc/mira-reports/<page>-diffs.md` exists with all rows marked ✅ / 🚫 / ⚠️
- [ ] No row has been attempted more than 2 times without resolution
- [ ] Framework gaps documented in `doc/mira-reports/framework-gaps.md`
- [ ] Local screenshot is visually close to target at 1440×900 (P1/P2 cleared)
- [ ] No regressions on previously completed pages (spot-check sidebar + one earlier page)
- [ ] Progress tracker row updated in `doc/mira-alignment-plan-v2.md`
