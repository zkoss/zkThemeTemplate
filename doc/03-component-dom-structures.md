# ZK Component DOM Structures

This document records the DOM structure of each ZK component for CSS styling reference.

## How to Research DOM Structure

1. **ZK Source Location**: `/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/`

2. **Key Files**:
   - `{category}/{Component}.ts` - Component logic, properties
   - `{category}/mold/{component}.js` - HTML template
   - `{category}/less/{component}.less` - Existing styles (reference)

3. **Browser DevTools**: Start preview app and inspect elements

---

## Buttons

### Button (`.z-button`)

**Source**: `wgt/mold/button.js`, `wgt/Button.ts`

**DOM Structure**:
```html
<button type="button|submit|reset" class="z-button [z-button-{sclass}]" [disabled]>
    <!-- With image -->
    <img class="z-button-image" src="..." alt="" aria-hidden="true" />

    <!-- With icon (iconSclass) -->
    <i class="z-icon-xxx" aria-hidden="true"></i>

    <!-- Label text -->
    Label Text
</button>
```

**Properties**:
- `type`: button, submit, reset
- `disabled`: boolean
- `orient`: horizontal, vertical (affects layout)
- `dir`: normal, reverse (image/label order)
- `image`: URL for button image
- `iconSclass`: CSS class for icon

**CSS Classes**:
- `.z-button` - Main container
- `.z-button-image` - Image element
- `.z-button[disabled]` - Disabled state

**States**:
- `:hover` - Mouse over
- `:focus` - Keyboard focus
- `:active` - Mouse down
- `[disabled]` - Disabled

**Implemented**: ✅ `components/buttons/_button.css`

---

### Toolbarbutton (`.z-toolbarbutton`)

**Source**: `wgt/mold/toolbarbutton.js`, `wgt/Toolbarbutton.ts`

**DOM Structure**:
```html
<button type="button" class="z-toolbarbutton">
    <img class="z-toolbarbutton-image" src="..." />
    <i class="z-icon-xxx"></i>
    <span class="z-toolbarbutton-content">Label</span>
</button>
```

**Implemented**: ⬜ TODO

---

### Combobutton (`.z-combobutton`)

**Source**: `wgt/mold/combobutton.js`, `wgt/Combobutton.ts`

**DOM Structure**:
```html
<span class="z-combobutton">
    <button class="z-combobutton-button">...</button>
    <button class="z-combobutton-dropdown">
        <i class="z-icon-caret-down"></i>
    </button>
</span>
```

**Implemented**: ⬜ TODO

---

## Inputs

### Textbox (`.z-textbox`)

**Source**: `inp/mold/textbox.js`, `inp/Textbox.ts`

**DOM Structure**:
```html
<input type="text" class="z-textbox" [disabled] [readonly] />
```

**States**:
- `:hover`
- `:focus`
- `[disabled]`
- `[readonly]`
- `.z-textbox-invalid` - Invalid state

**Implemented**: ⬜ TODO

---

### Combobox (`.z-combobox`)

**Source**: `inp/mold/combo.js`, `inp/Combobox.ts`

**DOM Structure**:
```html
<span class="z-combobox">
    <input class="z-combobox-input" />
    <button class="z-combobox-button">
        <i class="z-combobox-icon z-icon-caret-down"></i>
    </button>
</span>
<!-- Popup rendered separately -->
<div class="z-combobox-popup">
    <ul class="z-combobox-content">
        <li class="z-comboitem">...</li>
    </ul>
</div>
```

**Implemented**: ⬜ TODO

---

### Datebox (`.z-datebox`)

**Source**: `db/mold/calendar.js`, `inp/mold/combo.js`

**Similar structure to Combobox with calendar popup**

**Implemented**: ⬜ TODO

---

## Selection

### Checkbox (`.z-checkbox`)

**Source**: `wgt/mold/checkbox.js`, `wgt/Checkbox.ts`

**DOM Structure**:
```html
<label class="z-checkbox">
    <input type="checkbox" class="z-checkbox-input" [disabled] [checked] />
    <span class="z-checkbox-mold">
        <i class="z-checkbox-icon z-icon-check"></i>
    </span>
    <span class="z-checkbox-content">Label</span>
</label>
```

**States**:
- `:hover`
- `:focus`
- `[checked]` / `:checked`
- `[disabled]`
- `.z-checkbox-indeterminate` - Indeterminate state

**Implemented**: ⬜ TODO

---

### Radio (`.z-radio`)

**Similar to Checkbox, uses `.z-radio` prefix**

**Implemented**: ⬜ TODO

---

## Data Components

### Listbox (`.z-listbox`)

**Source**: `sel/mold/listbox.js`, `sel/Listbox.ts`

**DOM Structure**:
```html
<div class="z-listbox">
    <div class="z-listbox-header">
        <table>
            <tr class="z-listheader">
                <th class="z-listheader">Header 1</th>
            </tr>
        </table>
    </div>
    <div class="z-listbox-body">
        <table>
            <tr class="z-listitem [z-listitem-selected]">
                <td class="z-listcell">Cell content</td>
            </tr>
        </table>
    </div>
    <div class="z-listbox-footer">...</div>
</div>
```

**Implemented**: ⬜ TODO

---

### Grid (`.z-grid`)

**Source**: `grid/mold/grid.js`, `grid/Grid.ts`

**DOM Structure**:
```html
<div class="z-grid">
    <div class="z-grid-header">
        <table>
            <tr class="z-columns">
                <th class="z-column">Header</th>
            </tr>
        </table>
    </div>
    <div class="z-grid-body">
        <table>
            <tr class="z-row">
                <td class="z-cell">Cell content</td>
            </tr>
        </table>
    </div>
</div>
```

**Implemented**: ⬜ TODO

---

### Tree (`.z-tree`)

**Source**: `sel/mold/tree.js`, `sel/Tree.ts`

**DOM Structure**:
```html
<div class="z-tree">
    <div class="z-tree-body">
        <table>
            <tr class="z-treerow">
                <td class="z-treecell">
                    <span class="z-tree-icon z-tree-open"></span>
                    <span class="z-tree-line"></span>
                    Content
                </td>
            </tr>
        </table>
    </div>
</div>
```

**Implemented**: ⬜ TODO

---

## Navigation

### Tabbox (`.z-tabbox`)

**Source**: `tab/mold/tabbox.js`, `tab/Tabbox.ts`

**DOM Structure**:
```html
<div class="z-tabbox">
    <ul class="z-tabs">
        <li class="z-tab [z-tab-selected]">
            <a>Tab Label</a>
        </li>
    </ul>
    <div class="z-tabpanels">
        <div class="z-tabpanel">
            Panel content
        </div>
    </div>
</div>
```

**Implemented**: ⬜ TODO

---

### Menu (`.z-menu`)

**Source**: `menu/mold/menu.js`, `menu/Menu.ts`

**DOM Structure**:
```html
<div class="z-menubar">
    <div class="z-menu">
        <a class="z-menu-content">Menu Label</a>
    </div>
</div>
<!-- Popup -->
<div class="z-menupopup">
    <ul class="z-menupopup-content">
        <li class="z-menuitem">
            <a class="z-menuitem-content">Item</a>
        </li>
    </ul>
</div>
```

**Implemented**: ⬜ TODO

---

## Containers

### Window (`.z-window`)

**Source**: `wnd/mold/window.js`, `wnd/Window.ts`

**DOM Structure**:
```html
<div class="z-window [z-window-modal]">
    <div class="z-window-header">
        <span class="z-window-header-content">Title</span>
        <div class="z-window-header-buttons">
            <button class="z-window-icon z-window-minimize">...</button>
            <button class="z-window-icon z-window-maximize">...</button>
            <button class="z-window-icon z-window-close">...</button>
        </div>
    </div>
    <div class="z-window-content">
        Content
    </div>
</div>
```

**Implemented**: ⬜ TODO

---

### Panel (`.z-panel`)

**Source**: `wnd/mold/panel.js`, `wnd/Panel.ts`

**Similar to Window, uses `.z-panel` prefix**

**Implemented**: ⬜ TODO

---

### Popup (`.z-popup`)

**Source**: `wgt/mold/popup.js`, `wgt/Popup.ts`

**DOM Structure**:
```html
<div class="z-popup">
    Content
</div>
```

**Implemented**: ⬜ TODO

---

## Layout

### Box / Hbox / Vbox (`.z-hbox`, `.z-vbox`)

**Source**: `box/mold/box.js`, `box/Box.ts`

**DOM Structure**:
```html
<div class="z-hbox">
    <div class="z-hbox-inner">
        <!-- Children -->
    </div>
</div>
```

**Implemented**: ⬜ TODO

---

### BorderLayout (`.z-borderlayout`)

**Source**: `layout/mold/borderlayout.js`, `layout/Borderlayout.ts`

**DOM Structure**:
```html
<div class="z-borderlayout">
    <div class="z-north">North</div>
    <div class="z-south">South</div>
    <div class="z-east">East</div>
    <div class="z-west">West</div>
    <div class="z-center">Center</div>
</div>
```

**Implemented**: ⬜ TODO

---

## Adding New Components

When researching a new component:

1. Find source files in ZK repo
2. Read mold file for HTML structure
3. Read component TS file for properties and states
4. Check existing LESS file for class names
5. Document structure above
6. Create CSS file in appropriate category folder
7. Test in preview app
