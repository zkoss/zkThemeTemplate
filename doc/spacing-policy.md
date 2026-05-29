# Marble Spacing Policy (default rhythm)

## TL;DR

| 軸向 | 預設 (auto) | Opt-in 容器 | 元件範圍 |
|------|-------------|------------|----------|
| **垂直** (`margin-block-end`) | ✅ 有 | `.z-vstack` / `<vlayout>` | **僅 block-level 容器類** widgets，不含 atomic widgets |
| **水平** (`margin-inline-end`) | ❌ 沒有 | `.z-hstack` / `<hlayout>` / `<toolbar>` | 所有 atomic widgets 都不該有 |

---

## 1. Bootstrap 實際做法（澄清誤解）

Bootstrap 並**不是**所有元件都加 `margin-bottom`。它的 reset (`_reboot.scss`) 只對**文字/結構性 HTML 元素**加：

```
p, h1-h6, ul/ol/dl, table, pre, blockquote,
figure, address, hr, fieldset
```

而 **widget 類完全不加**：
- `.btn`、`.card`、`.alert`、`.badge`、`.form-control`、`.input-group`、`.nav`、`.navbar`、`.modal`、`.dropdown` — 全部沒有 built-in `margin`。
- 水平更是完全沒有 — 都靠 `.hstack` (flex+gap) 或 `.me-*` utility。

**Bootstrap 5 之後新增的 `.vstack` / `.hstack`** 就是承認「container 比 per-widget margin 更可控」。MUI 的 `<Stack>` 也是同一個結論。

## 2. 為什麼不能套用到「所有」元件

垂直、水平都一樣，atomic widgets 加 margin 會在三種情境造成 bug：

| 情境 | 問題 |
|------|------|
| 放在 `<toolbar>` / `<menubar>` (flex `gap`) | margin + gap 雙重間距 |
| 放在 grid / listbox 的 cell | 撐破 cell 對齊 |
| 放在 form row 裡 | label 跟 input 不齊高 |

而且 flex/grid children **不會** margin collapse，所以雙重間距是肉眼可見的（這就是你剛剛在 cardlayout 看到 8px 那題的根因）。

## 3. Marble 的分類

### A. Block-level 容器 → 加 `margin-block-end` ✅
通常獨立佔一個區段、不會放在 toolbar/grid cell：

`cardlayout, borderlayout, vlayout, panel, window, groupbox, fieldset, grid, listbox, tree, tabbox, anchorlayout, absolutelayout, portallayout, splitlayout`

### B. 行為像 block 但常被嵌入 → 不加，由 container 決定
`hlayout, progressmeter, image, iframe, html` — 這幾個我之前清單放進去，其實該拿掉。它們經常出現在 row、cell、toolbar 裡，自動加 margin 會踩雷。

### C. Atomic widgets → 完全不加 ❌
`button, checkbox, radio, textbox, combobox, datebox, label, badge, chip, icon` — **垂直跟水平都不該有**。要排列就用 `<hlayout>` / `<vlayout>` / `.z-hstack` / `.z-vstack`。

## 4. 對於 `.z-button { margin: 0 4px 4px 0 }` 的建議

這個是舊 ZK theme 留下來的 legacy hack。它造成：
- 跟 toolbar/menubar flex `gap` 雙重間距。
- 在 grid cell 裡撐破對齊。
- 跟 HTML inline whitespace 疊加 = 不一致的 4px / 8px / 12px gap。

**建議拿掉**，改成：
- 水平排列 button：`<hlayout>` 或 `<div sclass="z-hstack">` (flex + `gap: var(--zk-spacing-3)`)
- 垂直排列 button：`<vlayout>` 或 `<div sclass="z-vstack">`

跟 Bootstrap / MUI / Vaadin 對齊，且使用者學一次 `.z-hstack` / `.z-vstack` 就能套用到所有元件，比記每個元件的隱性 margin 簡單。

## 5. 結論回答使用者三個問題

1. **「Default Vertical Rhythm 適不適合套用到所有元件？」**
   → 不適合。只該套在 **block-level 容器類**，atomic widgets 絕對不能加。

2. **「Bootstrap 是否只套用在一部分元件？」**
   → 是。Bootstrap 只對 text/structural HTML 加 `margin-bottom`，所有 widget (btn, card, alert…) 都沒有。Marble 的「block-level container 才加」比 Bootstrap 略寬，但精神一致。

3. **「水平間距是否也適合套用類似原則？」**
   → 不適合。水平 spacing 在所有現代 framework 都是 **container-driven** (`.hstack` / `<Stack row>` / `gap`)，不是 per-widget margin。應該把 `.z-button` 殘留的 `margin: 0 4px 4px 0` 拿掉，全部走 `.z-hstack` / `<hlayout>`。
