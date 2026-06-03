# menubar

A horizontal or vertical menu container holding `<menu>` and `<menuitem>` children.

## DOM structure — intermediate `<ul><li>` wrapper

```
.z-menubar
└─ ul
    └─ li
        └─ .z-menu | .z-menuitem
```

ZK wraps each menu item in `<ul><li>` for semantic HTML and accessibility. The `<li>` is the structural child of `.z-menubar`, not the menu element itself.

Selectors that assume direct child:

```css
/* WRONG — fails because of intermediate ul/li */
.z-menubar > .z-menu { ... }

/* CORRECT */
.z-menubar > ul > li > .z-menu { ... }
```

## Orientation

- `orient="horizontal"` (default) — `<ul>` becomes a horizontal flex container
- `orient="vertical"` — `<ul>` stacks vertically

The orientation class is on `.z-menubar`: `.z-menubar-horizontal` / `.z-menubar-vertical`.

## Menu item DOM structure

Each `.z-menu` child has this internal structure:

```
.z-menu
└─ .z-menu-content
   ├─ .z-menu-icon   (optional — icon <i> element)
   ├─ .z-menu-text   (label text)
   └─ .z-menu-icon   (trailing arrow icon, for submenus)
```

State class: `.z-menu-selected` — added by ZK when the item is active/open.

## Submenu / popup

Hovering or clicking a `.z-menu` opens its popup (`.z-menupopup`) containing nested menu items. The popup is rendered outside the menubar in the DOM tree (positioned absolutely).

## Bundle

`menubar.css.dsp` covers menubar, menu, menuitem, menupopup, menuseparator.
