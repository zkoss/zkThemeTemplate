# Use-Case Pages — sclass → Utility Class Audit

Scope: every `sclass` used across the 7 use-case demo pages in
`src/test/resources/web/usecase/` plus the sidebar `div` in `index.zul`.

For each sclass: can it be replaced by an existing utility class
(`src/main/resources/web/zul/css/base/_utilities.css`, `_chips.css`, `_badges.css`,
and the button variants in `js/zul/wgt/css/button.css`)? If not, the reason is recorded.

Legend:
- **OK** — already a framework utility/component class; nothing to change.
- **REPLACE** — a custom helper that an existing utility (or short utility combo) fully covers.
- **KEEP** — custom class with no utility equivalent; reason given.


---

## C. Custom classes with NO utility equivalent (KEEP — class, reason, page)

| sclass | Defined in | Page(s) that use it | Why no utility replacement |
|--------|-----------|---------------------|----------------------------|
| `pref-row` | account-settings.zul (inline) | account-settings | `flex + align + gap + padding + border-bottom` **plus a `:last-child` override** that removes the last divider. The pseudo-class rule can't be a utility. |
| `ticket-row`, `ticket-dot`, `dot-high`/`dot-med`/`dot-low` | ticket-inbox.zul (inline) | ticket-inbox | Arbitrary dimensions (8px dot, `border-radius:50%`) and per-priority colors. No utility for a fixed-px dot or arbitrary inline-block sizing. |
| `msg-bubble`, `msg-bubble-me` | ticket-inbox.zul (inline) | ticket-inbox | Chat bubble: bg + `12px` radius + `10px 14px` padding. Padding/radius are **non-token px values**; `z-rounded-md` + `z-p-*` would change the look. |
| `chart-placeholder` | ops-dashboard.zul (inline) | ops-dashboard | Dashed border + fixed `220px` height + centered content. **No arbitrary-height utility.** |

---

## D. Resolved — custom classes replaced by built-in utility combos

Per the principle below, these three helpers were removed from `usecase.css` and
every usage across the 7 use-case pages **and** the `utility/*.zul` showcase pages
was rewritten with built-in utility classes. Verified in-browser: ops-dashboard,
item-editor, and utility/components render identically.

| Removed class | Replaced by (utility combo) | Dropped rule (no visual change) |
|---------------|-----------------------------|----------------------------------|
| `page-content` | `z-d-flex z-flex-col z-gap-4 z-p-4 z-bg-surface-low` | `min-height:100%` dropped; `box-sizing:border-box` is already global via `_reset.css` (`*`) |
| `section-title` | `z-d-block z-fs-title-sm z-fw-medium z-text-on-surface z-mb-3` | per-typescale `line-height:20px` dropped (title-small weight = 500 = `z-fw-medium`) |
| `kpi-card` | *(class deleted, kept `z-flex-1 z-min-w-0 z-card`)* | `min-width:180px` was already overridden by the co-applied `z-min-w-0` (utilities win in the layer order), so removal is a true no-op |

Also removed the now-dead `.z-tabbox.page-content` / `.z-tabbox.page-content .z-tabpanels`
rules (no tabbox uses `page-content`) and the `.kpi-card .z-h1` rule.

### Resolved from "My comments"

| Removed class | Replaced by | Notes |
|---------------|-------------|-------|
| `nav-item`, `nav-item--active`, `settings-nav` | built-in **`navbar` / `navitem`** (vertical orient) | account-settings sub-nav now uses the zkmax nav components; active item via `selected="true"`. Theme already styles `z-navbar`/`z-navitem` (MD3). Verified in-browser. |
| `trend-up` | `z-text-success` | True 1:1 swap — both resolve to `--zk-color-status-success`. (Note 2 below is now stale: `.trend-up` had already been changed to use the status token.) |

---

# 主要原則
用多個內建 CSS Class 來達到同樣的效果,因為 use case zul 是展示頁面,所以我要盡量使用內建 CSS Class 的完成所有的畫面,而不要用一個特定的客製的 CSS Class
這不是在做 APP ,所以目的不同。我要證明既有的現有內建的CSS可以完成多數視覺效果

# My comments

* `nav-item`, `nav-item--active` : 是否可以整個改用zk 內建元件呢?
* trend-up 應該可以換掉 z-text-success