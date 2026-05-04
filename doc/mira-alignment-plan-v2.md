# ZK Material Theme — Mira Alignment Plan v2

**Target Reference:**: it visually mimics the **Mira dashboard** at https://mira.bootlab.io/dashboard/default as closely as possible. All token / component / icon work in this plan is driven by what this single page actually needs — it is the north star, not a generic "MD3 alignment" exercise.

This document combines the original dashboard alignment plan with the v2 updates. It serves as the primary technical specification for mimicking the Mira dashboard and its component library.

---

## 1. Core Rules & Logic

### Component Selection
- **(a) ZK Native First:** If a matching ZK widget exists, use it. Otherwise, use `<div>` with custom CSS classes (e.g., Badge, Card, Chip).
- **(b) Alerts:** Use ZK's `Clients.showNotification(...)`.
- **(c) Cards & Chips:** Implement using `<div>` structures and custom CSS to match MUI patterns.
- **(d) Dialogs:** Use `<window mode="modal">`. ZK windows provide the necessary accessibility, focus trapping, and lifecycle management out-of-the-box.

### Visual Assets & Charts
- **(a) Charts:** Do NOT use ZK Chart widgets. Use high-fidelity screenshots from the Mira site for all chart regions (e.g., Total Revenue, Sales by Country).
- **(b) Images:** Download and use original assets (avatars, logos, illustrations) directly from the Mira site.

### Data Displays
- **(a) Simple Tables:** Use `<grid>`.
- **(b) Selectable Tables:** Use `<listbox checkmark="true">` for tables requiring checkboxes.

### Navigation & Scope
- **(a) Sidebar Inert Items:** "Maps" should be listed in the sidebar but have no navigation target.
- **(b) Placeholder Pages:** "Documentation" and "Change Log" entries are listed but do not require content pages.
- **(c) Icons:** Exclusively use Lucide Icons.
- **(d) Full Sidebar Coverage:** Every sidebar menu item that is not explicitly excluded above (Maps, Documentation, Change Log) MUST have a working ZUL page implemented under `usecase2/`. Clicking a menu item must navigate to its real page — no dead links, no "coming soon" stubs.
- **(e) Sidebar Scrollability: The sidebar may scroll vertically. All menu items must be accessible by scrolling — no item may be permanently hidden or clipped regardless of viewport height.


---

## 1b. MUI CSS Reference

When implementing or refining any ZK component CSS, read the matching MUI 9.0.0 CSS file first. These files contain the exact padding, font sizes, border-radii, state-layer colors, and transitions used by Mira.

**Source directory**: `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/`
**Index**: `…/static-css-output/INDEX.md` — includes a ZK→MUI lookup table and class naming conventions.

Quick lookup for the most commonly needed files:

| ZK component | MUI CSS file |
|---|---|
| `<button>` / `<toolbarbutton>` | `Inputs/Button.css` |
| `<textbox>` / `<combobox>` / `<datebox>` | `Inputs/InputBase.css`, `Inputs/OutlinedInput.css` |
| `<checkbox>` | `Inputs/Checkbox.css` |
| `<radiogroup>` / `<radio>` | `Inputs/Radio.css` |
| `<grid>` / `<listbox>` (data table) | `DataDisplay/Table.css`, `DataDisplay/TableCell.css`, `DataDisplay/TableRow.css` |
| `<window>` / card `<div>` | `Surfaces/Card.css`, `Surfaces/Paper.css` |
| `<window mode="modal">` | `Feedback/Dialog.css`, `Feedback/DialogTitle.css`, `Feedback/DialogContent.css`, `Feedback/DialogActions.css` |
| `<progressmeter>` | `Feedback/CircularProgress.css`, `Feedback/LinearProgress.css` |
| `<tabbox>` | `Navigation/Tabs.css`, `Navigation/Tab.css` |
| `<navbar>` / `<menubar>` | `Navigation/Drawer.css`, `Navigation/Menu.css`, `Navigation/MenuItem.css` |
| `<paging>` | `Navigation/Pagination.css`, `Navigation/PaginationItem.css` |
| `.m-badge`, `.m-chip`, `.m-avatar` | `DataDisplay/Badge.css`, `DataDisplay/Chip.css`, `DataDisplay/Avatar.css` |
| Typography utilities (z-h1–z-h7) | `DataDisplay/Typography.css` |

---

## 2. Frozen Pages and New Layout

The 8 existing use-case pages are now **frozen** and serve as regression smoke tests. They are NOT targets for Mira-mimic styling:
- `src/test/resources/web/usecase/` (app-shell.zul, dashboard.zul, employee-grid.zul, media-manager.zul, order-entry.zul, product-browser.zul, report-viewer.zul, user-profile.zul).

New Mira-mimic pages live in a sibling folder, flat (no subdirectories):
`src/test/resources/web/usecase2/`
- `index.zul` (the dashboard mimic)
- `alerts.zul`, `accordion.zul`, `avatars.zul`, `badges.zul`, `buttons.zul`, `cards.zul`, `chips.zul`, `dialogs.zul`, `lists.zul`, `menus.zul`, `pagination.zul`, `progress.zul`, `tabs.zul`, `tooltips.zul`.

---

## 3. Sidebar Implementation (PE/EE Target)

The sidebar uses the `zkmax` navigation family to mimic Mira's collapsible section behavior.

| Widget | Java class | Role in Mira sidebar |
|---|---|---|
| `<navbar>` | `org.zkoss.zkmax.zul.Navbar` | Outer vertical container |
| `<nav>` | `org.zkoss.zkmax.zul.Nav` | Collapsible group (Pages, Components, etc.) |
| `<navitem>` | `org.zkoss.zkmax.zul.Navitem` | Clickable leaf item; supports `iconSclass` and `label` |

**Mapping Details:**
- **Brand/Search:** Positioned above the `<navbar>` in a `<vlayout>`.
- **Active State:** Controlled via server-side toggle of an `m-active` sclass.
- **Injection:** All `usecase2/` pages must inject the shared sidebar via `<apply templateURI="_sidebar.zul"/>` (NOT `<include src="_sidebar.zul"/>`). `<apply>` evaluates the template in the current page's component scope, which is required for the active-state sclass and any per-page bindings to resolve correctly. Using `<include>` creates an isolated IdSpace and breaks active-state coordination.

---

## 4. Component Mapping Table

| Mira component | Implementation | Notes / Rule |
|---|---|---|
| **Alerts** | `<div class="m-alert">` | Toast variants use `Clients.showNotification(...)` |
| **Accordion** | `<tabbox mold="accordion"/>` | Re-skin `.z-tabbox-accordion` selectors |
| **Avatars** | `<div class="m-avatar">` | Variants (sm/md/lg, circle) via modifier classes |
| **Badges** | `<div class="m-badge">` | **Rule (a) — div only** |
| **Buttons** | `<button>`, `<toolbarbutton>` | Variants (contained/outlined) via `sclass` |
| **Cards** | `<div class="m-card">` | **Rule (c) — div only** (header/body/footer) |
| **Chips** | `<div class="m-chip">` | **Rule (c) — div only** |
| **Dialogs** | `<window mode="modal">` | Rule (d) recommendation |
| **Lists** | `<div>` or `<grid>` | Visual only = div; Data-bound = grid/listbox |
| **Menus** | `<menubar>`, `<menupopup>` | Sidebar uses `<navbar>`, not menubar |
| **Pagination** | `<paging>` | Integrates with grid/listbox |
| **Progress** | `<progressmeter>` | Indeterminate spinner via div + CSS animation |
| **Tabs** | `<tabbox>` | Re-skin `.z-tabs` / `.z-tab` |
| **Tooltips** | `<popup>` | Triggered via `tooltip` attribute |

---

## 5. Execution Phases


### Phase 0 — Recon & Asset Collection
- Capture full-page screenshot of Mira dashboard → `doc/mira/dashboard-default-full.png`.
- Capture chart regions as PNGs (e.g., `total-revenue.png`) and save to `src/test/resources/web/usecase2/img/mira/charts/`.
- Extract visual tokens: primary palette (#376fd0), Inter font weights, 8px border-radii, and MUI shadow values.

### Phase 1 — Token Alignment
- Update `_colors.css`, `_typography.css`, `_shape.css`, and `_elevation.css`.
- Ensure every component CSS references `var(--md-sys-color-*)`.

### Phase 2 — Lucide Icon Integration
- Install Lucide font files in `src/main/resources/web/zul/css/fonts/`.
- Update `_icons.css` to map `.z-icon-*` to Lucide codepoints.

### Phase 3 — Build Mira Pages (usecase2/)
- **3.1 `index.zul`:** Build the dashboard mimic using the region map (KPI cards, charts, grid).
- **3.2 Sidebar:** Implement using the `<navbar>` / `<nav>` / `<navitem>` recipe.
- **3.3 Component Demos:** Create one ZUL page per "Components" section entry (e.g., `alerts.zul`, `buttons.zul`). Coverage must be exhaustive — every sidebar entry not on the explicit exclusion list (Maps, Documentation, Change Log) gets its own ZUL page wired to the sidebar link.
- **3.4 Tables & Dialogs:** Align Grid/Listbox and Window styling to Mira's MUI look.

### Phase 4 — Component CSS Polish
- **Before editing any component CSS**: read the corresponding MUI CSS file from `…/static-css-output/` (see Section 1b for the lookup table). Extract exact values for padding, font-size, border-radius, colors, and transition timing.
- Add selectors for the `zkmax` nav family.
- Add `<paging>` and `<tabbox mold="accordion">` selectors.
- Namespace custom Mira-specific classes with `m-` prefix (e.g., `.m-card`).

### Phase 5 — Verification

> **Operational SOP**: [`doc/visual-parity-spiral.md`](visual-parity-spiral.md) — contains the full session loop, stop conditions, framework gap rules, and diff document format. Use that document to run each session; use this section only for the progress tracker.

#### 5.1 Visual Parity Audit (per page)

Run the **Visual Parity Spiral** (see SOP above) for every page. Each session: CAPTURE → COMPARE → AUDIT → FIX → VERIFY → DONE.

**Stop conditions** (defined in the SOP):
- Max 2 fix attempts per diff row → `🚫 BLOCKED`
- Max 3 FIX→VERIFY loops per page → mark Done Enough and move on
- Framework structural differences → `⚠️ FRAMEWORK`, log in `doc/mira-reports/framework-gaps.md`

A page is **Done** when all P1/P2 diff rows are ✅, 🚫, or ⚠️. P3-only remainder = Done Enough.

#### 5.2 Sidebar Acceptance Checks
These are blocking checks — failure means Phase 5 is not complete:

- [ ] Every sidebar item (except Maps, Documentation, Change Log) navigates to a real, rendered ZUL page.
- [ ] The sidebar may scroll vertically. When scrolled to the bottom, all menu items must be fully visible — no item clipped, hidden, or cut off. Verify by scrolling the sidebar to the bottom and confirming every entry is readable.
- [ ] Active-state highlight matches Mira's active item styling.
- [ ] Collapsible group expand/collapse behavior matches Mira.

---

## 6. Progress Tracker

### Phase 0 — Recon & Asset Collection
- [x] Full-page screenshot of Mira dashboard → `doc/mira/mira.png` *(saved as `mira.png` rather than `dashboard-default-full.png`)*
- [ ] Chart region PNGs → `src/test/resources/web/usecase2/img/mira/charts/` *(directory not yet created)*
- [x] Visual tokens extracted (primary palette #376fd0, Inter font weights, 8px border-radii, MUI shadow values)

### Phase 1 — Token Alignment
- [x] `_colors.css` updated to Mira palette (#376fd0 primary)
- [x] `_typography.css` updated (Inter font, weights)
- [x] `_shape.css` updated (8px border-radii)
- [x] `_elevation.css` updated (MUI shadow values)
- [x] All component CSS references `var(--md-sys-color-*)` (41 component CSS files)

### Phase 2 — Lucide Icon Integration
- N/A Lucide font files *(SVG data URI / mask-image approach used instead of font files — no font directory needed)*
- [x] `_icons.css` maps `.z-icon-*` to Lucide icons (SVG data URI mask-image implementation)

### Phase 3 — Build Mira Pages
- [x] `index.zul` — SPA shell with MVVM (`UseCase2VM`)
- [x] `_sidebar.zul` — sidebar with `@command('navigate', page=...)` wiring
- [x] `default.zul` — dashboard content fragment (KPI cards, charts, grid)
- [x] `analytics.zul`
- [x] `saas.zul`
- [x] `pages.zul`
- [x] `projects.zul`
- [x] `orders.zul`
- [x] `products.zul`
- [x] `invoice-list.zul`
- [x] `invoice-detail.zul`
- [x] `tasks.zul`
- ~~`calendar.zul`~~ *(removed — no ZK calendar widget)*
- [x] `sign-in.zul`
- [x] `sign-up.zul`
- [x] `reset-password.zul`
- [x] `accordion.zul`
- [x] `alerts.zul`
- [x] `avatars.zul`
- [x] `badges.zul`
- [x] `buttons.zul`
- [x] `cards.zul`
- [x] `chips.zul`
- [x] `dialogs.zul`
- [x] `lists.zul`
- [x] `menus.zul`
- [x] `pagination.zul`
- [x] `progress.zul`
- [x] `tabs.zul`
- [x] `tooltips.zul`
- [x] `charts-apex.zul`
- [x] `charts-chartjs.zul`
- [x] `forms-editors.zul`
- [x] `forms-pickers.zul`
- [x] `forms-selection-controls.zul`
- [x] `forms-selects.zul`
- [x] `forms-text-fields.zul`
- [x] `tables-simple.zul`
- [x] `tables-advanced.zul`
- [x] `tables-datagrid.zul`
- [x] `icons-lucide.zul`

### Phase 4 — Component CSS Polish
- [ ] Button / toolbarbutton
- [ ] Textbox / combobox / datebox
- [ ] Checkbox / radio
- [ ] Grid / Listbox (data table)
- [ ] Window / card
- [ ] Modal dialog
- [ ] Progressmeter
- [ ] Tabbox (standard + accordion)
- [ ] Navbar / nav / navitem (sidebar)
- [ ] Paging
- [ ] Tooltip
- [ ] `.m-card`, `.m-chip`, `.m-badge`, `.m-avatar` custom classes

### Phase 5 — Visual Parity Audit

#### 5.1 Per-Page Audit
| Page | Screenshot Captured | Diffs Recorded | Diffs Fixed |
|------|-------------------|----------------|-------------|
| `default.zul` (dashboard) | [ ] | [ ] | [ ] |
| `analytics.zul` | [ ] | [ ] | [ ] |
| `saas.zul` | [ ] | [ ] | [ ] |
| `pages.zul` | [ ] | [ ] | [ ] |
| `projects.zul` | [ ] | [ ] | [ ] |
| `orders.zul` | [ ] | [ ] | [ ] |
| `products.zul` | [ ] | [ ] | [ ] |
| `invoice-list.zul` | [ ] | [ ] | [ ] |
| `invoice-detail.zul` | [ ] | [ ] | [ ] |
| `tasks.zul` | [ ] | [ ] | [ ] |
| `sign-in.zul` | [ ] | [ ] | [ ] |
| `sign-up.zul` | [ ] | [ ] | [ ] |
| `reset-password.zul` | [ ] | [ ] | [ ] |
| `accordion.zul` | [ ] | [ ] | [ ] |
| `alerts.zul` | [ ] | [ ] | [ ] |
| `avatars.zul` | [ ] | [ ] | [ ] |
| `badges.zul` | [ ] | [ ] | [ ] |
| `buttons.zul` | [ ] | [ ] | [ ] |
| `cards.zul` | [ ] | [ ] | [ ] |
| `chips.zul` | [ ] | [ ] | [ ] |
| `dialogs.zul` | [ ] | [ ] | [ ] |
| `lists.zul` | [ ] | [ ] | [ ] |
| `menus.zul` | [ ] | [ ] | [ ] |
| `pagination.zul` | [ ] | [ ] | [ ] |
| `progress.zul` | [ ] | [ ] | [ ] |
| `tabs.zul` | [ ] | [ ] | [ ] |
| `tooltips.zul` | [ ] | [ ] | [ ] |
| `charts-apex.zul` | [ ] | [ ] | [ ] |
| `charts-chartjs.zul` | [ ] | [ ] | [ ] |
| `forms-editors.zul` | [ ] | [ ] | [ ] |
| `forms-pickers.zul` | [ ] | [ ] | [ ] |
| `forms-selection-controls.zul` | [ ] | [ ] | [ ] |
| `forms-selects.zul` | [ ] | [ ] | [ ] |
| `forms-text-fields.zul` | [ ] | [ ] | [ ] |
| `tables-simple.zul` | [ ] | [ ] | [ ] |
| `tables-advanced.zul` | [ ] | [ ] | [ ] |
| `tables-datagrid.zul` | [ ] | [ ] | [ ] |
| `icons-lucide.zul` | [ ] | [ ] | [ ] |

#### 5.2 Sidebar Acceptance Checks
- [x] SPA navigation: sidebar clicks swap center content without full page reload
- [x] Hash-based URL deep linking: `index.zul#<pagename>` navigates directly to the matching page on load; sidebar clicks update the URL hash; browser back/forward restores the correct page (implemented in `UseCase2VM.java` via `Desktop.getBookmark()` / `Desktop.setBookmark()` / `onBookmarkChange`)
- [x] Every sidebar item (except Maps, Documentation, Change Log, Calendar) navigates to a real, rendered ZUL page
- [ ] Sidebar scrolls vertically; all items visible when scrolled to bottom
- [ ] Active-state highlight matches Mira's active item styling
- [ ] Collapsible group expand/collapse behavior matches Mira