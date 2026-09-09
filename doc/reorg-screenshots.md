# Plan: Reorganize `doc/screenshots` into one folder per preview page

> **SUPERSEDED — do not execute.** This plan proposed one folder per preview page. The project went
> the other way: `doc/screenshots/` is now FLAT (`<page>-<scenario>.png`, zero subfolders — verified
> 2026-09-09), and `playwright.config.ts` documents that layout as the convention. Kept as the record
> of a design that was considered and rejected. `scripts/reorg-screenshots.sh` is the matching
> one-shot migration script and is equally dead.

> On execution, copy this file to `doc/reorg-screenshots.md` (repo convention — plans live in the repo, not `~/.claude/plans/`). Plan mode only permits editing this file, hence it lives here for now.

## Context

`doc/screenshots/` currently has **164 folders**, almost one per individual image (`button-gallery/`, `button-default-hover/`, `gallery-splitter/`, `tablet-button-gallery/`, …). The goal is a **preview-page-based** layout: one folder per preview page, holding every shot captured from that page (gallery + interaction states + tablet).

**Critical discovery — this is not a file-move.** These folders are **Playwright snapshot baselines**. [playwright.config.ts](src/test/playwright/playwright.config.ts) sets `snapshotPathTemplate: '{snapshotDir}/{testName}/{arg}{ext}'`, so **folder = test-name path**, **file = snapshot arg**. Three specs generate them:

| Producer (project) | Current path | Rule |
|---|---|---|
| `screenshot.spec.ts` (chromium) — desktop depth | `<page>-<state>/<state>.png` | `describe('<page>')` › `test('<state>')` |
| `gallery-scan.spec.ts` (gallery) — auto-scan of `web/*.zul` | `gallery-<comp>/<comp>.png` | `describe('gallery')` › `test('<comp>')` |
| `tablet.spec.ts` (tablet) — mobile-UA | `tablet-<comp>-gallery/gallery.png` | `describe('tablet-<comp>')` › `test('gallery')` |

A pure `git mv` would break the suite: comparison tests wouldn't find their baseline, and the next `--update-snapshots` would regenerate the old sprawl. **So the reorg = refactor specs + config → migrate baselines → update living docs.**

8 folders are *already* in the target shape (`slider/`, `cascader/`, `coachmark/`, `linelayout/`, `stepbar/`, `splitter/`, `goldenlayout/`, `portallayout/`) — these are hand-captured by the `zk-theme-evaluator` agent, which already writes to `doc/screenshots/<component>/`. The fix makes Playwright write there too; both producers then co-locate per page (exactly the user's intent).

## Decisions (confirmed with user)

1. **Uniform semantic filenames** inside each page folder: `gallery.png` (full-page shot), `<state>.png` (`hover`/`focus`/`active`; button keeps `default-*`/`outlined-*`), `tablet.png` (tablet gallery). gallery-scan's `<comp>.png` → `gallery.png`.
2. **Tablet shots merge** into the page folder as `tablet.png` (also resolves the `gallery.png` name clash with the desktop shot).
3. **Update living docs only**; leave the ~60 point-in-time `doc/harness/eval-reports/*` and `doc/harness/design-reviews/*` as historical.

## Target structure (examples)

```
doc/screenshots/
  button/       gallery.png  default-hover.png default-focus.png default-active.png
                outlined-hover.png outlined-focus.png outlined-active.png  tablet.png
  textbox/      gallery.png  hover.png focus.png  tablet.png
  grid/         gallery.png  hover.png  tablet.png
  grid-header/  gallery.png                     ← separate .zul page ⇒ own folder
  splitter/     gallery.png  <evaluator GIFs>
  slider/       gallery.png  hover.png focus.png tablet.png  <evaluator GIFs>
```
Grid/listbox/tree sub-pages (`grid-header`, `grid-detail`, `grid-grouping`, `grid-livegrouping`, `grid-paging`, `grid-utilities`, `listbox-header`, `listbox-grouping`, `tree-header`) are their own `.zul` preview pages, so they stay as their own folders — consistent with "one preview page per folder."

## Implementation

### 1. Config — [playwright.config.ts](src/test/playwright/playwright.config.ts)
Change the template so `{arg}` carries the full `<page>/<file>` path (Playwright allows `/` in snapshot names):
```ts
snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
```
Update the adjacent comment: baselines are now disambiguated by the `<page>/` prefix in the arg (and by `tablet.png` vs `gallery.png` filenames), not by a `tablet-`/`gallery-` folder prefix. Only these 3 specs emit snapshots (`framework-classes`, `render-smoke`, `reset-scoping` emit none — verified), so the template change is safe.

### 2. Specs — page-qualify every `toHaveScreenshot` arg
Each screenshot arg becomes `<page>/<file>.png`. Thread the page folder explicitly (clear, no `titlePath` fragility):

- **[screenshot.spec.ts](src/test/playwright/screenshot.spec.ts)** — add `const DIR = '<page>'` at the top of each screenshot-producing `describe` (button, textbox, checkbox, combobox, listbox, grid, datebox, timebox, spinner, bandbox, selectbox, tabbox, tree, window, panel, toast). Extend the `padShot(page, target, name)` helper to `padShot(page, target, dir, name)` and prefix `${dir}/`. Change gallery/state calls to `` `${DIR}/gallery.png` ``, `` `${DIR}/hover.png` ``, button's `` `${DIR}/${label}-${name}.png` ``, etc. (22 screenshot sites; assertion-only tests like `viewport-fill`, `container-header-height`, `notification`, `errorbox-position-invariance` emit no snapshot — leave untouched.)
- **[gallery-scan.spec.ts](src/test/playwright/gallery-scan.spec.ts)** — one call: `toHaveScreenshot(`${comp}/gallery.png`, …)` (was `` `${comp}.png` ``).
- **[tablet.spec.ts](src/test/playwright/tablet.spec.ts)** — `visualCases` loop: derive `const comp = name.replace(/^tablet-/, '')` and use `toHaveScreenshot(`${comp}/tablet.png`)`. Handle the one extra screenshot in `describe('tablet-combobox-sheet')` → `combobox/tablet-sheet.png`.

### 3. Migrate existing baselines (`git mv`, one-shot script)
Write `scripts/reorg-screenshots.sh` (removable after run; stage its output as renames). Rules applied to each existing folder:
- Leading `gallery-` → `comp = folder[8:]`; move `gallery-<comp>/<comp>.png` → `<comp>/gallery.png`.
- Leading `tablet-` + trailing `-gallery` → `comp = folder[7:-8]`; move `tablet-<comp>-gallery/gallery.png` → `<comp>/tablet.png`.
- Desktop `<page>-<state>/<stem>.png` (folder ends with `-<file-stem>`) → `<page>/<stem>.png`.
- The 8 evaluator dirs (bare page names, no rule match) → **leave in place**.

The script must `git mv` (preserve history), create the target dir, and **assert the target file doesn't already exist** before each move. Collision audit already done — none exist (evaluator GIFs/`page.png`/`fixed-*.png`/`eval-results.json` never clash with incoming `gallery.png`/`<state>.png`/`tablet.png`). Legacy state folders for components no longer in the desktop spec (e.g. `rating-hover`, `colorbox-focus`, `intbox-hover`) are relocated mechanically too; they're harmless stale baselines, not pruned (out of scope).

### 4. Living-doc updates only
- [doc/test-architecture.md](doc/test-architecture.md) — rewrite the baseline-path description from `doc/screenshots/<testName>/<arg>.png` to `doc/screenshots/<page>/<file>.png`; explain the `{arg}`-carries-path template.
- the visual-regression procedure note — update baseline-path references.
- [.claude/agents/zk-theme-evaluator.md](.claude/agents/zk-theme-evaluator.md) & [.claude/agents/md3-design-verifier.md](.claude/agents/md3-design-verifier.md) — already use `doc/screenshots/<component>/`; verify wording still matches and note Playwright PNGs now co-locate. [doc/orchestrator-playbook.md](doc/orchestrator-playbook.md) already shows `doc/screenshots/textbox/` — verify only.
- Leave `doc/harness/eval-reports/*` and `doc/harness/design-reviews/*` (historical).

## Verification (must all pass)

1. Start preview app (background): `withjdk.sh 17 mvn test exec:java@preview-app`.
2. `cd src/test/playwright && npx playwright test` — run **without** `--update-snapshots`. Since baselines were moved to exactly where the refactored specs now look, every screenshot test must **PASS with no diff and no newly-written baseline**. This is the core proof.
3. `git status` shows only renames (`R`) + the spec/config/doc edits — **zero untracked new files under `doc/screenshots/`**. Any untracked baseline means a spec arg-path didn't match its migrated location → fix that spec.
4. Confirm folder count collapsed from 164 to ~1-per-page and that a representative merged folder (e.g. `button/`) holds gallery + 6 states + tablet.

## Files to modify
- `src/test/playwright/playwright.config.ts`
- `src/test/playwright/screenshot.spec.ts`, `gallery-scan.spec.ts`, `tablet.spec.ts`
- `scripts/reorg-screenshots.sh` (new, one-shot) + the `git mv` renames under `doc/screenshots/`
- `doc/test-architecture.md`, the visual-regression procedure note, `.claude/agents/zk-theme-evaluator.md`, `.claude/agents/md3-design-verifier.md` (verify: `doc/orchestrator-playbook.md`)
