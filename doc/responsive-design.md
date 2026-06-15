# Responsive Design 解法（Marble）

本文件說明 Marble 目前的響應式版面做法、設計取捨，以及如何使用。

## 0. TL;DR

| 層次 | 是什麼 | 用在哪 | 現況 |
|------|--------|--------|------|
| **通用 utility** | `.z-grid-fill`（auto-fit grid，無 breakpoint） | App／預覽頁中**彼此獨立**的卡片牆、儀表板磚、產品列表 | 已定義於 `_layout.css`、編譯進 `norm.css.dsp`；**尚未**用在任何 ZUL（預留給開發者） |
| **特例 pattern** | State Matrix 手機卡片重排（`@media` + CSS 變數 + `::before`） | 預覽頁的「狀態矩陣」這種**有共用表頭、需上下對齊**的二維表格 | 已套用：`pv.css` ＋ `pv/matrix.zul` |

兩者**不是同一個東西**：`z-grid-fill` 是一行就能用的通用工具；State Matrix 因為有「共用表頭＋欄位對齊」的限制，需要額外機制（見第 3 節）。

---

## 1. 設計原則：為什麼不引入 Bootstrap Grid

我們**刻意不**把 Bootstrap 的 12 欄 × 多 breakpoint × `col-sm-6 col-md-4` class 整套搬進 utility CSS：

1. **與現代 CSS 重複**：Bootstrap Grid 早於 CSS Grid。「卡片自動增減欄、窄螢幕換行、保持最小寬」用原生一行就能達成（見 `z-grid-fill`），不需要 breakpoint class 與 12 欄記帳。
2. **與 MD3/MUI 方向衝突**：本 theme 對齊 MD3/MUI。MUI 的 Grid 是 React 元件 props（`<Grid size={{xs:12, md:4}}>`），不是 class soup；`col-md-4` 會把 MD3 不採用的 12 欄思維帶回來，也和既有 `z-*` utility 風格不一致。
3. **範圍與維護**：整套 grid ≈ 數百行 CSS，等於自己養一個 mini-Bootstrap。

**取向**：優先用「intrinsic / auto-fit」式響應（讓內容依可用寬度自我排列），只有在真的需要「依裝置尺寸切換版面」時才用 `@media`。

---

## 2. `z-grid-fill` —— 通用響應式格線

### 定義（`src/main/resources/web/zul/css/utility/_layout.css`）

```css
.z-grid-fill {
    grid-template-columns: repeat(auto-fit, minmax(min(var(--zk-grid-min, 180px), 100%), 1fr));
}
```

- `auto-fit`：能塞幾欄就塞幾欄，塞不下自動換行。
- `minmax(..., 1fr)`：每欄最少 `--zk-grid-min`（預設 **180px**），有多餘空間就平均撐滿。
- `min(var(--zk-grid-min,180px), 100%)`：當容器比一張卡片還窄時，卡片縮到容器寬（**永不橫向溢出**）。
- **無 `@media`**：欄數隨容器寬度自動變化 —— 寬螢幕多欄、手機一欄。

### 用法

`z-grid-fill` 只設定 `grid-template-columns`，所以要搭配 `z-d-grid`（`display:grid`）和一個間距（`z-gap-*`）：

```xml
<!-- 基本：卡片牆，每張至少 180px，自動換行 -->
<div sclass="z-d-grid z-grid-fill z-gap-4">
    <div sclass="z-card">卡片 1</div>
    <div sclass="z-card">卡片 2</div>
    <div sclass="z-card">卡片 3</div>
    <div sclass="z-card">卡片 4</div>
</div>
```

行為：1200px 寬 → 6 欄；600px → 3 欄；390px 手機 → 2 欄；極窄 → 1 欄。全程不需要寫任何 breakpoint。

```xml
<!-- 自訂最小卡片寬：每張至少 240px（較寬的卡片） -->
<div sclass="z-d-grid z-grid-fill z-gap-6" style="--zk-grid-min: 240px">
    <div sclass="z-card">寬卡片 A</div>
    <div sclass="z-card">寬卡片 B</div>
</div>
```

```xml
<!-- 儀表板磚：搭配既有 spacing / elevation utility -->
<div sclass="z-d-grid z-grid-fill z-gap-4 z-p-4">
    <div sclass="z-card z-elevation-1 z-p-4">營收</div>
    <div sclass="z-card z-elevation-1 z-p-4">訂單</div>
    <div sclass="z-card z-elevation-1 z-p-4">使用者</div>
</div>
```

### `z-grid-fill` vs `z-grid-cols-N`（既有固定欄）

| | `z-grid-cols-N` | `z-grid-fill` |
|--|-----------------|---------------|
| 欄數 | **固定 N 欄**（內容收縮） | **隨寬度自動增減** |
| 換行 | 不換行 | 塞不下自動換行 |
| 適合 | 表單欄位對齊、需要固定欄數的版面 | 卡片牆、磚牆、清單，卡片彼此獨立 |
| 手機 | N 欄可能被擠很窄 | 自動降到 1~2 欄，保持可用 |

> 規則：**卡片彼此獨立（不需跨列對齊）→ 用 `z-grid-fill`；需要固定欄數對齊 → 用 `z-grid-cols-N`。**

---

## 3. State Matrix 手機卡片重排（特例）

### 為什麼不能直接用 `z-grid-fill`

預覽頁的「狀態矩陣」是**對齊的二維表格**：上方一條共用表頭（Default / Disabled / Readonly / Invalid / Inplace）＋多列資料列，欄位必須上下對齊。

- 一旦在窄螢幕減少欄數，**表頭列與資料列會各自獨立重排 → 對齊崩潰**。
- 而且每個 cell 只有 widget、**沒有自己的狀態標籤**（標籤集中在共用表頭）。

所以手機上正確做法是：**放棄共用表頭，讓每個 cell 變成「自帶標籤的卡片」**。這需要兩個配合：

### 機制（兩個檔案）

**(a) `src/test/resources/web/pv/matrix.zul`** —— 把欄標籤變成 CSS 變數，掛在 wrapper 上：

```xml
<zscript><![CDATA[
    java.util.List _cols = (java.util.List) arg.get("cols");
    StringBuilder _sb = new StringBuilder();
    for (int _i = 0; _i < _cols.size(); _i++)
        _sb.append("--pv-col-").append(_i + 1).append(":'").append(_cols.get(_i)).append("';");
    String pvColVars = _sb.toString();
]]></zscript>
<div sclass="pv-matrix ... pv-cols-${arg.cols.size()}${arg.colsSuffix}" style="${pvColVars}">
    ...
</div>
```

產出例如：`style="--pv-col-1:'Default';--pv-col-2:'Disabled';...--pv-col-5:'Inplace';"`。
**關鍵**：CSS 變數會沿 `.pv-matrix` wrapper **繼承**給底下所有 cell，所以一頁有多個 matrix 也各自獨立、自動 scope，**完全不必改動 18 個內容模板**。

**(b) `src/test/resources/web/pv.css`** —— `@media (max-width:599px)` 重排：

```css
@media (max-width: 599px) {
    .pv-matrix .pv-col-header-row { display: none; }          /* 隱藏共用表頭 */

    .pv-matrix .pv-row {                                       /* 改成 auto-fit 卡片 */
        grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
        gap: 16px;
    }
    .pv-matrix .pv-row > div:first-child {                     /* 變體標籤 → 整列小標題 */
        grid-column: 1 / -1; font-weight: 600;
    }
    .pv-matrix .pv-row > div:not(:first-child)::before {       /* 每張卡片加標籤 */
        content: ""; display: block; font-size: 11px; ...
    }
    .pv-matrix .pv-row > div:nth-child(2)::before { content: var(--pv-col-1); }
    .pv-matrix .pv-row > div:nth-child(3)::before { content: var(--pv-col-2); }
    /* ... 對應到第 N 欄 ... */
}
```

### 結果

- **桌機 / 平板（≥600px）**：維持原本的對齊表格（欄寬 `minmax(0,160px)` 上限＝原本的 px，外觀不變）。
- **手機（<600px）**：每列變體成組，狀態卡片 auto-fit 換行（每張 ≥150px），各自有 DEFAULT / DISABLED / READONLY... 標籤，下拉鈕完整、不重疊。

---

## 4. 該用哪個？（決策）

```
要排版的是「彼此獨立的卡片」嗎？
├─ 是 → z-grid-fill（一行搞定，無 breakpoint）
└─ 否，是「有共用表頭、需欄位對齊的二維表格」
        └─ 參考 State Matrix pattern：@media 重排 + CSS 變數自帶標籤
```

需要「永遠固定 N 欄」(例如表單兩欄對齊) → `z-grid-cols-N`。

---

## 5. Breakpoint 說明

- `z-grid-fill` **不用** breakpoint（intrinsic）。
- State Matrix 重排用 **sm = 600px**（對齊 MUI 的 sm；< sm 視為手機 → 堆疊）。
- 目前 utility CSS 僅在此 pattern 用到 `@media`；若未來要做「依裝置切換版面」的 App 級需求，再評估是否補一組對齊 MUI 的響應式 utility（sm 600 / md 900 / lg 1200 / xl 1536）。

## 6. 測試守則

響應式版面的回歸測試放在 `src/test/playwright/tablet.spec.ts`（mobile UA 專案）：

- `tablet-no-horizontal-overflow`：頁面在平板寬度下 `scrollWidth <= clientWidth`（防止橫向溢出→幻影垂直捲軸）。
- `tablet-matrix-card-usable`：在 390px 量最窄狀態卡片寬 ≥150px（防止「擠壓而非重排」）。

新增任何響應式版面時，沿用「失敗先行」：先寫一條會 fail 的幾何斷言，再寫 CSS 讓它 pass。

## 7. 注意事項 / 限制

- `z-grid-fill` 必須搭配 `z-d-grid`＋`z-gap-*` 才有效（它只設 `grid-template-columns`）。
- State Matrix 的 `::before` 標籤目前對應到 `nth-child(2)~(7)`（最多 6 欄）；若未來矩陣超過 6 欄，需在 `pv.css` 補對應規則。
- `matrix.zul` 的 `--pv-col-N` 注入用 zscript（已驗證 `arg` 在 zscript 可用）；屬預覽頁 test resource，正式 App 不需要此機制。
- 相關背景與量測證據：`tasks/mobile-vertical-scrollbar-diagnosis.md`、`tasks/responsive-state-matrix-plan.md`。
