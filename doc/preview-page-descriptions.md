# Preview Page Descriptions

These descriptions cover all ZK CE components across 8 enterprise UI scenarios.
Use each description as input to the `zul-writer` skill to generate `.zul` preview pages.

---

## Page 1: Application Shell (`app-shell.zul`)

**Scenario:** Main application frame for an enterprise ERP system. A full-page `borderlayout` with five regions. The **north** region contains a horizontal toolbar (`toolbar`) with the company logo (`image`) on the left, followed by a `menubar` with top-level menus: File, Edit, View, Tools, Help. The File menu (`menupopup`) has items for New, Open, Save, a `menuseparator`, and Exit. The **west** region (200px fixed width) shows a vertical navigation panel. The **center** region displays a `tabbox` with three tabs: Dashboard, Tasks, and Notifications — each `tabpanel` contains a `label` as placeholder. The **east** region (180px collapsible) shows a mini-calendar widget using a `calendar` component. The **south** region shows a `label` acting as a status bar. Use `include` to reference a header fragment file. Add an inline `style` block for custom fonts and a `script` block for a greeting alert on load. Use `div` and `span` for minor layout grouping inside panels.

---

## Page 2: Employee Data Grid (`employee-grid.zul`)

**Scenario:** HR employee roster with advanced filtering and inline editing. A `toolbar` at the top contains: a `toolbarbutton` for Add Employee, a `toolbarbutton` for Export, a `separator`, a `combobox` (with `comboitem` options: All Departments, Engineering, HR, Finance, Operations) for department filter, a `datebox` for hire date from/to, and a `bandbox` (with a `bandpopup` containing a multi-field advanced filter: `textbox` for name, `checkbox` for active status, `selectbox` for job grade, and a `button` Apply). Below the toolbar, a `grid` with: `auxhead`/`auxheader` row spanning columns for "Personal Info" (Name, Email), "Employment" (Dept, Grade, Hire Date), and "Status" columns. Frozen first two columns (Name, Employee ID). `columns` with sortable `column` headers. `rows` with `row` entries. One `group` row for each department with a `groupfoot` showing the count. A `detail` component on each row that expands to show the employee's address and notes (`textbox`). A `foot`/`footer` row showing total count. A `paging` component below for pagination. A `popup` component triggered by right-clicking a row, offering Edit, Delete, and View History options via `button` elements.

---

## Page 3: Order Entry Form (`order-entry.zul`)

**Scenario:** A `window` (normal mode, titled "New Sales Order") hosting a multi-tab order entry form. A `tabbox` with four tabs: **General**, **Line Items**, **Shipping**, **Attachments**.

- **General tab:** Two `groupbox` components side-by-side in an `hbox`. Left groupbox (Caption: "Customer Info"): `textbox` for Customer Name, `inputgroup` wrapping a prefix Label "ID:" and an `intbox` for Customer ID, `combobox` with `comboitem` options for Account Type, `datebox` for Order Date, `timebox` for Order Time. Right groupbox (Caption: "Order Details"): `selectbox` for Priority, `radiogroup` with three `radio` options (Standard, Express, Overnight) for Shipping Method, `checkbox` for Taxable, `decimalbox` for Discount %, `doublebox` for Tax Rate, `longbox` for PO Number (supports large numbers), `doublespinner` for Weight (kg, step 0.5), `spinner` for Quantity.

- **Line Items tab:** A `listbox` with `listhead`/`listheader` columns (SKU, Description, Qty, Unit Price, Total). Items grouped by category using `listgroup` and `listgroupfoot`. A `listfoot`/`listfooter` showing order total. A `button` to add line items.

- **Shipping tab:** `textbox` rows for Address, City, State, ZIP inside a `vbox`. A `combobox` for Country.

- **Attachments tab:** `fileupload` component (multiple files), a `progressmeter` showing upload progress, a `listbox` of uploaded files.

Bottom of the window: `hbox` with a `combobutton` (Save + dropdown for "Save as Draft" / "Save and Submit") and a `button` Cancel.

---

## Page 4: Product Category Browser (`product-browser.zul`)

**Scenario:** A two-pane product browser with a `hlayout`. Left pane (25% width): A `tree` with `treecols`/`treecol` headers (Category, Count). `treechildren` with nested `treeitem`/`treerow`/`treecell` representing: Electronics → Phones, Laptops; Clothing → Men, Women, Kids; Home & Garden → Kitchen, Tools. A `treefoot`/`treefooter` row showing total categories. A `splitter` between the two panes. Right pane (75%): A `toolbar` with `toolbarbutton` icons for List View and Grid View, a `separator`, and a `textbox` for search. Below: a `listbox` with `listhead`/`listheader` (Image, Name, SKU, Price, Stock, Rating). `listitem`/`listcell` rows with an `image` thumbnail, product name as an `a` (link), price formatted in a cell, an inline `rating` component (1–5 stars), and stock level as a `progressmeter` (0–100%). Items grouped by sub-category using `listgroup` with a `listgroupfoot` showing sub-total. A `listfoot`/`listfooter` row showing grand total count. A `paging` component for pagination. Clicking a product opens a `popup` showing product details with an `image`, `html` for the description, and a `button` to add to cart.

---

## Page 5: KPI Dashboard (`dashboard.zul`)

**Scenario:** An auto-refreshing operations dashboard. A `vlayout` containing: a `toolbar` row at the top with a `label` "Operations Dashboard", a `separator`, and a `toolbarbutton` "Refresh". A hidden `timer` component set to 30 seconds for auto-refresh. Below: a `hlayout` with four `panel` components (each with `panelchildren`), one per KPI card:

1. **Orders Today** — `label` showing count, `progressmeter` showing % of daily target
2. **Customer Satisfaction** — `rating` component (read-only, 4.2/5), `label` with score
3. **Server Load** — `slider` (read-only, value 67, min 0, max 100) with color zones
4. **Revenue** — `label` with currency, `html` block for a mini sparkline placeholder

Below the KPI cards: two `groupbox` components in an `hbox`. Left groupbox (Caption: "Recent Alerts"): a `listbox` (no headers, single column) with `listitem`/`listcell` alert messages. Right groupbox (Caption: "System Status"): a `grid` with two `column`s (Service, Status) and `row`s using `checkbox` (read-only checked/unchecked) to indicate up/down. A `vbox` at the bottom contains a `label` "Embedded Analytics" and an `iframe` pointing to a placeholder analytics URL. Use `div` for card padding and `span` for inline badge styling.

---

## Page 6: User Profile & Settings (`user-profile.zul`)

**Scenario:** Account settings page using `anchorlayout` for a fluid two-column layout. Left column (`anchorchildren` anchored 40%): A `groupbox` (Caption: "Profile Photo") with an `image` (large avatar) and a `fileupload` button below it. Below that, a `groupbox` (Caption: "About") with a `textbox` (multiline) for bio, a `rating` component for "Rate Your Experience". Right column (anchored 55%): A `groupbox` (Caption: "Personal Information") with: `textbox` for First Name and Last Name in an `hbox`, `textbox` for Email, `datebox` for Date of Birth, `combobox` for Country, `intbox` for Phone (area code) + `textbox` for number in an `inputgroup`. A `groupbox` (Caption: "Preferences"): `radiogroup` with `radio` options for Theme (Light/Dark/Auto), `checkbox` for Email Notifications, `checkbox` for SMS Alerts, `slider` for Session Timeout (5–60 min), `doublespinner` for Font Size (8.0–24.0, step 0.5), `spinner` for Items Per Page. A `groupbox` (Caption: "Security"): `textbox` (password type) for current password, new password, confirm. An `absolutelayout` region (200x80px) using `absolutechildren` for a CAPTCHA widget: `captcha` component + `textbox` for CAPTCHA input. Bottom: `hbox` with `button` Save, `button` Cancel, a `separator`, and `a` (hyperlink) "Delete Account". Use `separator` and `space` for visual spacing between sections.

---

## Page 7: Media & Content Manager (`media-manager.zul`)

**Scenario:** A content management page for a corporate intranet. A `tabbox` with three tabs:

- **Image Gallery tab:** A `groupbox` (Caption: "Site Map Navigation") containing an `imagemap` of a company building floor plan image, with clickable `area` hotspots for different departments (each area has a tooltip label). Below: a `vbox` with `image` thumbnails in an `hlayout` grid pattern. A `toolbar` with `toolbarbutton` for Upload New Image and Delete Selected. A `fileupload` (multiple) with `progressmeter` below.

- **Audio Library tab:** A `listbox` with columns (Title, Duration, Format, Uploaded). Each `listitem` has a play button (`toolbarbutton` with play icon). Below the list: an `audio` player component with `track` (subtitle/caption track) for accessibility. A `groupbox` (Caption: "Upload Audio") with `fileupload`, `textbox` for title, `combobox` for format selection, `checkbox` for "Add Subtitles", `button` Upload.

- **Embedded Content tab:** A `groupbox` (Caption: "External Preview") with an `iframe` (600x400px) for embedding external content. A `textbox` for entering the embed URL and a `button` Load. A `captcha` component below the URL field (for security validation before loading external content) with a `textbox` for CAPTCHA answer and a `button` Verify. An `html` component to display raw HTML snippet previews. A `vbox` with `label`, `span`, and `div` for annotations around the iframe.

---

## Page 8: Report Builder (`report-viewer.zul`)

**Scenario:** A financial report builder with parameter sidebar and output area. A `borderlayout` fills the page. **North** region: `toolbar` with `toolbarbutton` items: Run Report, Export PDF, Export CSV, a `separator`, Print, a `separator`, and a `combobox` for saved report templates. **West** region (220px, collapsible): Report parameter panel. A `vbox` contains: `groupbox` (Caption: "Date Range") with two `datebox` inputs (From, To) and a `calendar` for quick date selection. `groupbox` (Caption: "Filters") with `combobox` for Region, `selectbox` for Currency, `checkbox` rows for each business unit, `spinner` for Top-N results, `decimalbox` for minimum threshold. `button` Run at the bottom. **Center** region: A `grid` for the report output with `columns`/`column`, `rows`/`row`, `group`/`groupfoot` for category subtotals, `foot`/`footer` for grand totals, `auxhead`/`auxheader` for quarter groupings across the top. A `frozen` component to pin the row label column. A `paging` component below. **East** region (160px): A `panel` (Caption: "Actions") with `panelchildren` containing `vbox` of `toolbarbutton` links and an `a` link to documentation. Below: a `popup` (shown on export button click) with `radiogroup`/`radio` for format selection and a `button` Download. **South** region: `hlayout` with `label` showing "Report generated at...", `space`, and `progressmeter` for generation progress. Use `script` to handle report parameter change events and `style` to customize report table appearance. Use `html` to render a formatted report summary header inside the center region.

---

## Component Coverage Map

| Group | Components |
|---|---|
| Layout | Borderlayout, North, South, East, West, Center, Hlayout, Vlayout, Hbox, Vbox, Box, Absolutelayout, Absolutechildren, Anchorlayout, Anchorchildren, Splitter, Cell, Div, Span |
| Navigation | Menubar, Menu, Menuitem, Menupopup, Menuseparator, Tabbox, Tabs, Tab, Tabpanels, Tabpanel, Toolbar, Toolbarbutton, A |
| Data Display | Grid, Columns, Column, Rows, Row, Foot, Footer, Auxhead, Auxheader, Frozen, Group, Groupfoot, Detail, Listbox, Listhead, Listheader, Listitem, Listcell, Listgroup, Listgroupfoot, Listfoot, Listfooter, Paging, Tree, Treecols, Treecol, Treechildren, Treeitem, Treerow, Treecell, Treefoot, Treefooter |
| Inputs | Textbox, Intbox, Decimalbox, Doublebox, Longbox, Spinner, Doublespinner, Combobox, Comboitem, Bandbox, Bandpopup, Datebox, Timebox, Checkbox, Radio, Radiogroup, Selectbox, Slider, Inputgroup, Calendar |
| Containers | Window, Panel, Panelchildren, Groupbox, Caption, Popup |
| Media | Image, Imagemap, Area, Audio, Track, Iframe, Html |
| Misc | Button, Combobutton, Label, Fileupload, Progressmeter, Rating, Separator, Space, Captcha, Timer, Include, Script, Style |
