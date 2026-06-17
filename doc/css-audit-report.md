# CSS Audit Report — Marble Theme

> 對 `marble` 主題所有 CSS(tokens / utility / 元件 CSS,含 zul + zkmax + zkex)做的一次性回顧檢查:重複變數、多餘定義、硬編碼值與其他不必要項目。
> 產出日期:2026-06-15。檢查工具:`stylelint` + `rg`(ripgrep)變數引用計數。

## 摘要

整體 **乾淨度高**。主要發現集中在三類:

| 類別 | 結論 | 嚴重度 |
|---|---|---|
| 檔內重複 selector / 重複 property | 幾乎為零(僅 3 處 goldenlayout 為刻意分段) | ✅ Low |
| 多餘 longhand / shorthand 冗值 | 16 處,**已安全自動修正 15 處**(1 處留報告) | ✅ 已處理 |
| 孤兒 token(0 引用) | 約 40+ 個,多為「系統化完整 scale」或對外 API,**不建議盲刪** | 🟡 Medium |
| 硬編碼顏色(裸值,非 var fallback) | 約 25 處,集中於 button / notification / toast / popup | 🟠 Medium-High |
| 重複的 box-shadow 字面值 | button.css 與 panel.css 完全相同字串 | 🟡 Medium |
| 同值不同名 token | 1 組(motion 250ms) | ⚪ Low / 刻意 |

> **判讀重點**:`var(--zk-color-x, #fallback)` 形式的 hex **不是違規**,是刻意的防禦性 fallback。本報告的「硬編碼」只計裸值(無 `var()` 包覆)。

---

## A. Token / 變數層

### A1. 重複定義(同變數定義多次)
- **檔內**:stylelint `declaration-block-no-duplicate-custom-properties` → **0 筆**。
- **跨檔**:`--zk-grid-cell-padding`(grid.css:11 / tablet/_mesh.css:13)與 `--zk-listbox-cell-padding`(listbox.css:10 / tablet/_mesh.css:10)各定義兩次 → **刻意的響應式覆寫**(tablet 層放大 cell padding),非 bug。其餘元件區域變數(`--zk-rangeslider-*`、`--zk-touch-*`)各只定義一次。
- **結論**:無重複定義 bug。

### A2. 同值不同名
- `--zk-motion-duration-short3: 250ms` 與 `--zk-motion-duration-medium1: 250ms` 同值。
  - 實際使用:`short3` 被引用 **181 次**(事實上的標準 transition 時長),`medium1` **0 次**。
  - 另注意命名異常:`short3(250ms) > short4(200ms)`,順序與直覺相反。
  - **建議**:保留 `short3`;`medium1` 可併入孤兒清單考慮移除(見 A3)。命名異常僅記錄,不動(改名會牽動 181 處引用)。

### A3. 孤兒 token(全 CSS 0 個 `var()` 引用)
> ⚠️ 孤兒 ≠ 可刪。tokens 是**對外主題 API**,且系統化 scale(完整 typescale / motion / elevation)刻意保留完整性。以下分三級建議。

**(a) 可考慮移除的一次性 alias / 未用色(低風險)**
| Token | 說明 |
|---|---|
| `--zk-color-tertiary` / `-on-tertiary` / `-tertiary-container` / `-on-tertiary-container` | 整組 tertiary 色盤未用 |
| `--zk-color-inverse-primary` | 未用 |
| `--zk-color-on-warning` | 未用(warning 系其餘有用) |
| `--zk-elevation-panel` / `-drawer` / `-window` | 語意 alias,0 引用(`-dialog`/`-dropdown`/`-card` 有用) |
| `--zk-elevation-5` | 最高層級未用 |
| `--zk-motion-transition-standard` | 複合 preset,0 引用 |
| `--zk-shape-chip` | 0 引用 |
| `--zk-state-disabled-container-opacity` | 0 引用 |

**(b) 系統化 scale 的未用成員(建議保留,完整性)**
- Motion durations 0 引用:`long1`、`long2`、`medium1`、`medium3`、`medium4`、`short4`
- Motion easings 0 引用:`emphasized-accelerate`、`standard-accelerate`、`standard-decelerate`
- Typescale 0 引用:多數 `*-line-height` 與部分 `*-weight`(display/headline/title 系),以及 `--zk-typescale-default-size/weight/line-height` 三個 alias
- **建議**:保留 scale 主體;惟 `--zk-typescale-default-*` 三個 alias 0 引用、且非 scale 成員,可考慮移除。

**(c) 偵測指令(供日後重跑)**
```bash
# 每個 token 的 var() 引用次數
cd src/main/resources/web
for v in $(rg -o '^\s*(--zk-[a-z0-9-]+):' -r '$1' zul/css/tokens/*.css | sort -u); do
  printf "%-45s %s\n" "$v" "$(rg -c --no-filename "var\($v[,)]" $(rg -l "var\($v" . ) 2>/dev/null | awk '{s+=$1}END{print s+0}')"
done
```

### A4. 破壞 DRY 的字面值(semantic token 用字面值)
- `--zk-shape-card: 6px`(_shape.css:15)— 同檔其餘 alias 皆 `var(...)`,僅此一個寫死 `6px`(非 scale 上的值:scale 是 4/8/12/16…)。引用 **21 次**。
- **建議**:記錄即可,**不自動修**(改為 `var(--zk-shape-corner-small)`=8px 會改變外觀;6px 是刻意中間值)。若要對齊 scale 需設計決策。

---

## B. 硬編碼值(裸值,違反 token 規則)

### B1. 硬編碼顏色(裸 hex / rgb,無 var 包覆)
| 檔案:行 | 值 | 對應 token? | 建議 |
|---|---|---|---|
| button.css:150,176,183 | `#2e7d32` (success) | ❌ 無等值 token | 需新增 `--zk-color-status-success-strong` 類 token(值決策) |
| button.css:151,177,184 | `#ed6c02` (warning) | ❌ 無等值 token | 同上 |
| button.css:152,178,185,198,203,234,238 | `#d32f2f` (error) | ✅ `= --zk-color-error` | 可 tokenise(見下) |
| button.css:153,179,186,199,204 | `#0288d1` (info) | ✅ `= --zk-color-status-info` | 可 tokenise(見下) |
| button.css:154,155,164 | `#f5f5f5` `#333` `#e0e0e0` `#212121` `#000` | ❌ 中性灰,無等值 token | light/dark 變體,需設計決策 |
| button.css:149–155… | `#fff` (多處 on-color 文字) | ⚠️ 值=多個 token | 語意模糊(on-primary?),不宜機械替換 |
| popup.css:26 / misc.css:305 | `rgba(97,97,97,0.92)` | ❌ tooltip 底色 | 可建 `--zk-color-tooltip-bg` |
| toast.css:33,34 | `rgba(50,50,50,0.95)` `#ffffff` | ❌ | 同上 |
| notification.css:131,144,157(+border 變體) | `rgba(2,136,209,.12)` 等 | ⚠️ = status 色 @12% | 可改 `color-mix(... var(--zk-color-status-info) 12%, transparent)` |
| grid.css:222,415 / tree.css:448 / listbox.css:673 | `rgba(0,0,0,.04)` `rgba(255,255,255,.6)` | ❌ frozen/sticky 遮罩 | 可 tokenise overlay 色 |
| combobox.css:176 | `rgba(0,0,0,.08)` | ❌ | 同上 |

> **button.css 色盤現況**:`primary`/`secondary` 已用 `var(--token, #fallback)`,但 `success/warning/error/info/light/dark` 仍裸值 → **色盤本身已不一致**。建議統一:把 `error`→`var(--zk-color-error, #d32f2f)`、`info`→`var(--zk-color-status-info, #0288d1)`(等值,提升一致性),並為 success/warning 新增 token。
> 本次**未自動修**此項(涉及 token 語意對應決策,留待核可)。

### B2. 硬編碼 px(觸控目標)
- `min-height: 40px` 等觸控尺寸散見多檔。
- **注意**:tablet 層 `zkmax/css/tablet/_tokens.css` **已有** `--zk-touch-target-min: 44px`、`--zk-touch-input-height: 48px` 等 token,但僅 tablet 層使用;base 層的 40px 仍裸值。
- **建議**:若要 base 也走 token,需新增 base 觸控 token(值決策),報告留待後續。

### B3. 硬編碼 font-size
- `datebox.css` / `paging.css` 的 `font-size: 16px`。
- `16px` 同時 = `--zk-typescale-body-large-size` 與 `--zk-typescale-title-medium-size`(語意模糊)→ **不自動替換**,留報告。

### B4. 重複的 box-shadow 字面值
- `button.css:12` 與 `panel.css:15` 出現**完全相同**字串:
  `rgba(50,50,93,0.024) 0px 2px 5px -1px, rgba(0,0,0,0.05) 0px 1px 3px -1px`
- 此值不等於任何 `--zk-elevation-*`。
- **建議**:抽成新 token(如 `--zk-elevation-resting`)由兩處共用。屬重構+新 token,留待核可,本次未動。

---

## C. 跨檔重複的 CSS 區塊(設計樣式,非 bug)

> 以下為**刻意複製**的設計樣式,抽共用屬重構、需逐元件視覺回歸驗證 → **本次只記錄,不動**。

- **C1. state-layer `::before` overlay**:21+ 檔近乎相同(`inset:0; background:currentColor; opacity:0; transition`)。可考慮抽成共用 placeholder class,但 ZK 元件 class 各異、且 overlay 色/opacity 偶有差異,抽共用需謹慎。
- **C2. focus-visible outline**:14 檔重複 `outline: 2px solid var(--zk-color-primary); outline-offset: 2px;`。同上。
- **C3. transition**:多處 `transition: ... var(--zk-motion-duration-short3) var(--zk-motion-easing-standard)`(已走 token,僅是宣告重複)。

---

## D. 檔內重複(stylelint 權威掃描)

- **D1. 重複 selector**:僅 `goldenlayout.css` 3 處(`.lm_goldenlayout`、`.lm_header`、`.lm_controls` 各出現兩次)。
  - 經檢視為**刻意分段**(一段管 layout、一段管 visual,各帶說明註解,屬性不重疊)→ **不合併**(合併會破壞分段註解語意)。stylelint 設為 `warning` 並記為已知。
- **D2. 重複 property(同塊內)**:`declaration-block-no-duplicate-properties` → **0 筆**。
- **D3. 多餘 longhand / shorthand 冗值**:16 筆 → 見「已執行的安全修正」。

---

## E. Utility 層

- **E1. 重複 class 名**:跨 8 個 utility 檔 → **無**。
- **E2. 重疊宣告(刻意 alias)**:`.z-gap-2/3/4/6` vs `.z-hstack-sm/.../lg`、`.z-text-secondary` vs `.z-text-muted` → 經確認為**語意別名**,刻意保留,不動。
- **E3. 硬編碼值**:utility 內的 `display:flex`、`50%`、`font-weight:600` 等皆為 layout 原語 / 關鍵字,**非主題值**,正確。

---

## F. 死碼(無對應 DOM 的 selector)

- 需掃描所有 `.zul` + ZK 執行期 DOM 才能準確判定,易誤判(ZK 動態 class) → **本次不做自動 PurgeCSS**。
- 未發現明顯死碼;若要進行,建議獨立工項並以實際渲染 DOM 為準。

---

## 已執行的安全修正(value-preserving,Phase 2)

> 原則:替換後 computed value **完全不變**,且不刪除註解。

| # | 檔案:行 | 修正前 | 修正後 | 規則 |
|---|---|---|---|---|
| 1 | bandbox.css:90 | `margin: 4px 0 0 0` | `margin: 4px 0 0` | shorthand 冗值 |
| 2 | combobox.css:135 | `margin: 4px 0 0 0` | `margin: 4px 0 0` | shorthand 冗值 |
| 3 | combobox.css:143 | `overflow-y/-x` | `overflow: hidden auto` | 多餘 longhand |
| 4 | combobox.css:281 | `padding: 4px 0 5px 0` | `padding: 4px 0 5px` | shorthand 冗值 |
| 5 | menu.css:272 | `margin: 2px 0 0 0` | `margin: 2px 0 0` | shorthand 冗值 |
| 6 | frozen.css:53 | `overflow-x/-y` | `overflow: scroll hidden` | 多餘 longhand |
| 7 | tabbox.css:65 | `flex-direction/-wrap` | `flex-flow: row nowrap` | 多餘 longhand |
| 8 | toolbar.css:52 | `flex-direction/-wrap` | `flex-flow` | 多餘 longhand |
| 9 | messagebox.css:58 | `overflow-x/-y` | `overflow` | 多餘 longhand |
| 10 | goldenlayout.css:439 | 4× `border-*-radius` | `border-radius` | 多餘 longhand |
| 11 | cascader.css:115 | `overflow-x/-y` | `overflow` | 多餘 longhand |
| 12 | searchbox.css:181 | `overflow-x/-y` | `overflow` | 多餘 longhand |
| 13 | timepicker.css:174 | `margin: 4px 0 0 0` | `margin: 4px 0 0` | shorthand 冗值 |
| 14 | pdfviewer.css:35 | `top/left/right/bottom:0` | `inset: 0` | 多餘 longhand |
| 15 | colorbox.css:387 | `margin: -4px 0 0 0` | `margin: -4px 0 0` | shorthand 冗值 |

| 16 | _wheel.css:44 | `left/right/top/bottom !important` | `inset: auto 10px 0 !important` | 多餘 longhand(**手動**,保留註解) |

> 第 16 筆排除於 `--fix` 之外手動處理:該處每行帶說明註解且皆 `!important`,`--fix` 自動合併會刪除註解,故手動合併並改寫註解。
>
> ⚠️ **`--fix` 副作用警告**:`stylelint --fix` 會把 `/* */` 註解內、用於記錄 DOM 結構的 `<!--` 誤轉義成 `\3c !--`(已在 cardlayout/datebox/inputgroup 三檔出現並還原)。故本次 `--fix` 限縮 glob 並逐行檢視 diff;`npm run lint:css` 預設**只報告不修**。

---

## 標準化機制(Phase 3:stylelint 常駐)

- 新增 `.stylelintrc.json` + npm script `lint:css`。
- **不 extends `stylelint-config-standard`**:整套會產生 ~989 筆,絕大多數是純風格雜訊(`selector-class-pattern` 會誤報每個 `.z-*`/`.lm_*`、`property-no-vendor-prefix` 會誤報必要的 `-webkit-`、`no-descending-specificity` 屬刻意 cascade),會淹沒真正的重複/冗餘訊號。
- 採**聚焦規則集**,只盯使用者關心的「重複 / 多餘 / 不必要」:
  `no-duplicate-selectors`(goldenlayout 設 warning)、`declaration-block-no-duplicate-properties`、`declaration-block-no-duplicate-custom-properties`、`declaration-block-no-redundant-longhand-properties`、`shorthand-property-no-redundant-values`、`no-duplicate-at-import-rules`、`block-no-empty`、`comment-no-empty`、`no-empty-source`。
- **限制**:stylelint 無法偵測「跨檔重複 token 定義」與「裸 hex vs var fallback」的差別,故 B 類(硬編碼色)與 A1 跨檔仍須靠 grep / 人工(指令見 A3c)。`color-no-hex` 因會誤報大量合法 `var(--x, #fallback)` fallback 而**不啟用**。

### Baseline(修正後)
- 執行 `npm run lint:css`:**0 errors**,3 warnings(goldenlayout 刻意分段,已知接受)。

---

## 待核可的後續工項(本次未動,需設計決策或視覺回歸)
1. button.css 色盤統一 tokenise(error/info 等值替換 + success/warning 新增 token)。
2. tooltip / toast / overlay / notification 色 tokenise(B1 下半)。
3. 重複 box-shadow 抽 `--zk-elevation-resting` token(B4)。
4. base 層觸控尺寸 tokenise(B2)。
5. 孤兒 token 清理(A3a / `--zk-typescale-default-*`),確認非對外 API 後再刪。
6. state-layer / focus-visible overlay 抽共用 class(C1/C2),需逐元件視覺回歸。
