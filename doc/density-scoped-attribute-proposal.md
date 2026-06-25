# Marble 密度（Density）方案：用一個 scoped 屬性，純 CSS 切換 Compact / 預設

本文件說明兩件事：

1. 目前 compact 機制背後那個容易踩雷的 **「別名凍結問題」（freeze problem）** 到底是什麼。
2. 一個給 **Marble 使用者（不是 demo）** 的通用、純 CSS 的密度切換方案，以及為什麼它同時解決了凍結問題。

---

## 0. 背景：Marble 的三層尺寸 token 系統

密度相關的尺寸 token 分成三層（定義在 `tokens/_sizing.css`）：

```css
:root {
    /* 第 1 層：control-height 階梯（leaf / 原始值） */
    --zk-control-height-xs: 28px;
    --zk-control-height-sm: 32px;
    --zk-control-height-md: 40px;   /* 預設控制項：input、icon-button、選單列、清單列 */
    --zk-control-height-lg: 48px;   /* 工具列、選單列、tab、面板標題等 chrome bar */
    --zk-control-height-xl: 56px;   /* window 標題、FAB */

    /* 第 2 層：語意別名層（semantic layer）——元件真正讀的就是這一層 */
    --zk-input-height:   var(--zk-control-height-md);  /* 40 */
    --zk-button-height:  …;
    --zk-toolbar-height: var(--zk-control-height-lg);  /* 48 */
    --zk-tab-height:     var(--zk-control-height-lg);  /* 48 */
    /* …等等 */

    /* 第 3 層：資料儲存格 padding（grid / listbox / tree cell-padding） */
}
```

**關鍵事實：**幾乎所有元件 CSS 讀的都是「第 2 層語意別名」（例如 `var(--zk-input-height)`），而不是直接讀第 1 層的 leaf 階梯。這個事實是整個方案能成立的基礎。

（例外只有 4 個檔案會直接讀第 1 層 leaf，後面第 4 節會說明。）

---

## 1. 什麼是「別名凍結問題」（freeze problem）？

### 核心原理：var() 是在「宣告它的那個元素」上被替換的

CSS 自訂屬性（custom property）有一個很多人會忽略的規則：

> `var()` 的替換（substitution），是在**宣告這個屬性的那個元素**上完成的，算出一個「具體值」之後，再以這個具體值往子層繼承。

來看 `:root` 上的這兩行：

```css
:root {
    --zk-control-height-md: 40px;
    --zk-input-height: var(--zk-control-height-md);   /* 在 :root 上就被算成 40px */
}
```

`--zk-input-height` 在 `:root` 這個元素上，就立刻被替換成 `40px` 這個**具體值**。之後它往下繼承時，帶的是 `40px` 這個固定值——**而不是** `var(--zk-control-height-md)` 這個「公式」。

### 凍結是怎麼發生的

假設我們想做 compact 模式，於是在某個**後代元素**（例如 `body` 或某個 `<div>`）上改寫 leaf：

```css
body.compact {
    --zk-control-height-md: 32px;   /* 只改了 body 上的 leaf */
}
```

直覺上會以為「leaf 改成 32px，input 就會跟著變 32px」。**但不會。** 原因是：

- 這行只改了 `body` 上的 `--zk-control-height-md`。
- 但 `--zk-input-height` 的**宣告只存在於 `:root`**；`body` 上**從來沒有重新宣告** `--zk-input-height`。
- 既然 `body` 上沒有重新宣告，那個 `var()` 公式就不會在 `body` 上重新替換。`--zk-input-height` 仍然是它在 `:root` 上早就算好、並繼承下來的那個 **凍結值 40px**。

結果：元件讀到的 `--zk-input-height` 還是 **40px**，input 完全不會變小。

> **這就是「凍結」：** 別名（第 2 層）在 `:root` 上被算成具體值之後就「凍住」了。後代元素只改第 1 層 leaf，並不會讓第 2 層別名重新計算——除非那個別名也在同一個元素上被重新宣告。

### 它造成的實際災情

凡是「透過第 2 層別名」取得尺寸的元件——input、toolbar、tab、各種 header、FAB——在 `body.compact` 這種**後代 scope** 的覆寫下**全都不會縮小**。只有那些「直接讀了 compact 區塊裡明列的那個 token」的元件才會縮。這正是先前 `/usecase` demo 用 `body` scope 切換時，輸入框不縮小的根因。

### 兩種正確解法

1. **把覆寫放在「宣告別名的同一個元素」上**，也就是 `:root` / `<html>` 本身。
   因為 leaf 覆寫和別名宣告在同一個元素，別名就會重新替換。
   → 這就是 `doc/marble-compact.css`（`:root` scope）能正常運作的原因，也是 demo 後來改成把 class 加在 `document.documentElement`（即 `:root`）才修好的原因。
   **限制：只能整頁（whole-app）套用，無法只套用在某個區塊。**

2. **直接改寫「元件真正讀的那個別名」（第 2 層 semantic layer）**，而不是去改第 1 層 leaf。
   因為你覆寫的就是元件實際讀取的那個 token，後代覆寫一定有效，而且**可以套在任何層級**。
   → 這是下面要提的通用方案的核心。

---

## 2. 給 Marble 使用者的通用方案：把密度做成一個 scoped 屬性

### 設計原則：主題提供「宣告式旋鈕」，而不是「切換按鈕」

主題本身**不應該**內建一個切換開關（那是某個 app 的事）。主題應該提供一個**宣告式的旋鈕**，讓使用者自己決定怎麼設定它——可以是靜態 HTML 屬性、可以是後端 render、可以是他們自己的 JS、也可以是他們自己用 `:has()` 做的開關。

這正是 MUI / Spectrum / Material Web 提供密度的方式：一個掛在某個 scope 上的**屬性**，而不是一個 widget。

### 機制：`[data-density="compact"]`，覆寫「語意別名層」

在核心主題（例如 `tokens/_sizing.css`）加入：

```css
[data-density="compact"] {
    --zk-input-height: 32px;
    --zk-button-height: 30px;
    --zk-toolbar-height: 48px;
    --zk-tab-height: 40px;
    --zk-menuitem-height: 30px;
    --zk-data-row-min-height: 36px;
    --zk-header-padding-y: 8px;
    --zk-grid-cell-padding: 6px 12px;
    /* …約 15 個「元件真正會讀」的 token… */
}
```

使用者的用法——**同一套機制，任何層級都適用：**

```html
<!-- 整頁套用 -->
<html data-density="compact">

<!-- 只套用在某個區塊；可以巢狀、可以被內層覆蓋 -->
<div data-density="compact"> …一個資料密集的 grid… </div>
```

未來還可保留 `comfortable`（預設）與 `spacious` 等值。

### 為什麼要覆寫「語意別名層」而不是「leaf 階梯」——這就是整個關鍵

這正是把第 1 節的凍結問題「一般化解決」的手法。

- 目前的 `marble-compact.css` 覆寫的是**第 1 層 leaf**（`--zk-control-height-md` 等）。如同第 1 節所述，這**只有在 `:root` scope 才會生效**，因為別名在 `:root` 被替換後就凍結了。所以 leaf 覆寫**永遠無法做到區塊級（region）scope**。

- 改成覆寫**元件真正讀的第 2 層 token**（例如 `--zk-input-height: 32px`，直接給具體值），就能套在**任何祖先元素**上：元件會從「最近的、有宣告該 token 的祖先」讀到值，完全不需要 `var()` 公式重新替換。於是**整頁**與**區塊級**密度，都從**同一個區塊**自然得到，不需要任何額外處理。

這個特性，就是讓這套方案真正「通用」的原因。

---

## 3. 為什麼不用 `:has()` 或 JS 切換放進核心主題？

`:has()` 開關或 JS class toggle 都預設了「畫面上存在某個特定的切換 widget」。主題不該假設這件事。主題只負責提供一個宣告式旋鈕（屬性／class），至於要怎麼設定它，交給使用者：

- 靜態寫死在 HTML 屬性上；
- 後端 server-render 時帶上；
- 使用者自己的 JS；
- 使用者自己用 `:has()` 做一個純 CSS 開關（例如 `:root:has(#my-switch:checked)`）。

這才是與框架無關、真正通用的契約。

---

## 4. 關於那 4 個直接讀 leaf 的地方（已在實作中解決）

有 4 個元件檔案會**直接讀第 1 層 leaf**（不是透過語意別名）：

| 檔案 | 用途 | 讀的 leaf |
|------|------|-----------|
| `js/zul/wgt/css/button.css` | icon-button / FAB 尺寸變體、header min-height | `xs` / `lg` |
| `js/zul/layout/css/borderlayout.css` | header min-height | `lg` |
| `js/zul/wnd/css/window.css` | 關閉鈕方塊尺寸 | `sm` |
| `js/zul/wnd/css/panel.css` | 關閉鈕方塊尺寸 | `xs` |

**最初的擔心是**：若 `[data-density="compact"]` 只覆寫語意別名，這 4 個直接讀 leaf 的地方在區塊級 scope 下不會跟著變。

**實作上的解法**：`[data-density="compact"]` 區塊把**第 1 層 leaf 也一起覆寫成 literal**（不是只覆寫語意別名）。因為 leaf 本身是 literal、不是 `var()` 衍生值，所以它不受凍結問題影響——掛在哪個元素上，該元素子樹中「直接讀 leaf」的元件就會讀到覆寫後的值。於是這 4 個地方在**整頁與區塊**兩種 scope 下都會正確縮小，**不需要任何後續改指**。

> 換句話說：凍結問題只影響「`var()` 衍生的語意別名」。只要在 `[data-density]` 區塊裡把 leaf 與語意別名**都以 literal 列出**，任何 scope（`<html>` 或某個容器）都能完整生效。

---

## 5. 實作狀態

1. ✅ **已完成** — 在 `tokens/_sizing.css` 的 `:root` 區塊之後，加入 `[data-density="compact"]`，以 literal 覆寫 leaf 階梯 + 語意別名 + 儲存格 padding（值對齊 `doc/marble-compact.css`）。
   - 已用 Playwright 驗證：input 高度 `default 40px` →`整頁 attr 32px` →`區塊 attr 內 32px / 外 40px`（不外漏、可區塊化）。
2. ✅ **已完成** — 新增 Java API `org.zkoss.theme.marble.MarbleDensity`，讓使用者免寫 JS：
   - `MarbleDensity.apply(Density.COMPACT)` — 整頁（透過 `Clients.evalJavaScript` 設在 `<html>`）。
   - `MarbleDensity.apply(component, Density.COMPACT)` — 單一區塊（透過 ZK 原生 `Component.setClientDataAttribute`，不碰 JS 字串）。
   - 適用於**執行期切換**；若要設「整頁預設值」，仍建議用 CSS preset 或後端 render 帶屬性，避免 FOUC（首次 paint 後才套用造成的閃動）。
3. ⏳ **可選** — 把 `doc/marble-compact.css` 重新定位為 `html[data-density="compact"] { … }`（向後相容的整頁 preset，本質上就是同一個區塊套在 root scope）。
4. ⏳ **可選** — `/usecase` demo 的切換開關改為設定這個屬性（純 CSS 用 `:root:has()`，或呼叫 `MarbleDensity.apply(...)`，皆可——那是 demo 的事，不是主題的事）。

這個方案比「目前的 leaf-rung preset」和「`:has()` 開關」都更通用，而且對使用者來說是純 CSS。

---

## 附錄：一句話總結凍結問題

> `var()` 在宣告它的元素上就被算成具體值並凍結；在後代只改它依賴的 leaf，並不會讓它重新計算。
> 所以密度覆寫要嘛放在宣告別名的同一個元素（`:root`，但只能整頁），要嘛直接覆寫「元件真正讀的那一層」（語意別名，任何層級都可、可區塊化）。
