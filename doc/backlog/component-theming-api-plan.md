# 實作規劃 — 元件級主題 API（Tier 1 #1）

> 對應 `doc/framework-feature-gaps.md` Tier 1 第 1 項。本檔為實作規劃，尚未動工。

## 1. 目標

讓企業採用者能**只改單一元件的外觀**（顏色/邊框/圓角/狀態），而**不需 fork 主題或寫脆弱的 CSS override** ——
即 MUI `theme.components.MuiButton.styleOverrides` / Ant `ConfigProvider theme.components.Button.*` 的等價物，
但以 Marble 既有的「純 CSS custom property」方式達成。

## 2. 關鍵洞察：不是從零發明，是「完成 + 正名」既有 pattern

Marble **已經有這套機制的骨架**，只是不完整、也沒被當成公開 API 文件化：

- `tokens/_sizing.css` 已經在 `:root` 曝露**每元件的尺寸** knob（`--zk-button-height`、`--zk-input-height`、`--zk-window-header-height`、`--zk-grid-cell-padding` …），元件直接 `var()` 消費。
- `tokens/_splitter.css` 已經在 `:root` 曝露 splitter 的**外觀** knob（`--zk-splitter-bar-bg`、`-pill-fill` …，含 `color-mix()` 衍生 hover/active）。

**本任務 = 把同一套已驗證的 pattern 從「尺寸」延伸到「外觀」（色/邊框/圓角/狀態），涵蓋關鍵元件，並正式文件化為公開 API。**
尺寸維度已完成，直接沿用既有 knob；本次只補外觀維度。

## 3. 設計決策（皆有 audit 佐證）

### 3.1 機制：在 `:root` 宣告 `--zk-<comp>-*`，元件從 `@layer zk-components` 內消費

- 採 **Pattern A（宣告於 `:root`、預設值 = 目前實際值、元件無 fallback 直接 `var()` 消費）**，與 `_splitter.css` / `_sizing.css` 完全一致（可被 DevTools 探索、單一檔集中、自我文件化）。
- **絕不**把 knob 宣告在元件選擇器上（`.z-button { --zk-button-bg: … }`）。原因（`_sizing.css:64-85` 已白紙黑字寫明、亦符合既有 cascade 守則）：元件上宣告的 custom property 會**遮蔽** `:root` override，且 `var()` 衍生值在 `:root` 被「凍結」後 region scope 收不到。

### 3.2 Cascade 安全性（audit 已證實）

- token `:root` 區塊是 **unlayered**；元件 CSS 在 `@layer zk-components`。**unlayered 永遠贏 layered** → 採用者的 `:root` knob override 一定蓋過主題的 layered 元件預設。
- 兩個 unlayered `:root`（主題預設 vs 採用者）同 specificity（0,1,0）→ **由 source order 決定** → 採用者 CSS 需**載在 `norm.css.dsp` 之後**，或用略高 specificity（如 `:root[data-*]`，比照既有 brand preset `:root[data-brand]` 0,2,0 蓋過 base `:root`）。
- **Regional override 無載入順序問題**：`.checkout { --zk-button-bg: green }` 是把值設在祖先元素上，內部 `.z-button` 靠**繼承**取最近祖先的值（green），與 `:root` 預設不在同一元素上競爭 → 天生生效。

### 3.3 零視覺回歸（硬性）

每個新 knob 的**預設值 = 目前該屬性的實際值**（token 或 literal 原封不動）。元件把直接值換成 `var(--zk-<comp>-knob)`。
未 override 時渲染逐 byte 相同 → 現有 screenshot baseline 不應變動。

### 3.4 knob 詞彙「依元件家族」而非統一（audit 核心發現）

各元件狀態實作方式不同，強套統一 knob 會失真：

| 家族 | 狀態實作 | knob 取向 |
|------|---------|-----------|
| **Button** | `::before` overlay（背景色=overlay 色，opacity=state token）；focus 另有 outline ring | 曝露 overlay 色 + 各 state opacity + base 色/圓角 |
| **Input** | 逐狀態 **border-color** 變化（focus 另 +2px 並補償 padding）；無 overlay、無 shadow | 曝露各狀態 border-color + surface/text 色 |
| **Window** | base surface + **mode 決定 elevation**；header 控制鈕 hover = literal 換背景色 | 曝露 surface/border/圓角 + header 色 + icon hover 色（elevation 維持 mode 擁有） |
| **Grid** | outlined card；狀態 = **背景色 swap**，且**不一致**（plain row hover 用 hardcoded `rgba(0,0,0,0.04)`，striped/group/sort 用 `color-mix(on-surface 8%)`） | 曝露 surface/border/圓角 + header 色 + row-hover 色（順帶收斂不一致）|

### 3.5 knob 檔案落點

新增單一檔 `tokens/_component-theme.css`（依元件分區、重註解，比照 `_sizing.css` 風格）。
理由：把「元件主題 API 的曝露面」集中一處，最利於文件同步；元件數成長再拆檔。
（命名避開 `utility/_components.css`（那是 `z-card`）。）
加入 `scripts/build-css.js` 的 token 串接清單：**verbatim/unlayered**，排在其它 base token **之後**（可引用它們）、`_forced-colors.css` **之前**（後者須維持最後以讓 `--zk-focus-ring` 覆寫勝出）。

## 4. 首波範圍（pilot）

**button / textbox(input 家族) / window / grid** —— 刻意涵蓋三種狀態模型（overlay / border / bg-swap）+ 一個資料元件，
以此驗證 pattern 跨家族成立。後續 pass 再擴 listbox / tree / tab / combobox / menu / panel …。

**明確延後**（首波不做，避免 scope creep）：button 的 outlined/text/icon/fab 與 color 變體 knob（先只做 base filled）；
window 的 per-mode elevation knob；整體只曝露「策展過的表面」（bg/fg/border/radius/關鍵狀態/尺寸），不是每個屬性。

## 5. knob 目錄（pilot，含精確預設值）

> 尺寸類多數**沿用既有** `_sizing.css` knob（下表標「既有」），本次只**新增外觀類**。

### 5.1 Button（`js/zul/wgt/css/button.css`）
| knob | 預設（=現值） | 消費點 |
|------|--------------|--------|
| `--zk-button-bg` | `var(--zk-color-primary)` | `.z-button` background-color |
| `--zk-button-fg` | `var(--zk-color-on-primary)` | `.z-button` color |
| `--zk-button-radius` | `var(--zk-shape-button)` (4px) | border-radius |
| `--zk-button-overlay-color` | `var(--zk-color-on-primary)` | `.z-button::before` background-color |
| `--zk-button-hover-opacity` | `var(--zk-state-hover-opacity)` (.08) | `:hover::before` opacity |
| `--zk-button-focus-opacity` | `var(--zk-state-focus-opacity)` (.12) | `:focus-visible::before` |
| `--zk-button-active-opacity` | `var(--zk-state-pressed-opacity)` (.12) | `:active::before` |
| `--zk-button-elevation` | `var(--zk-elevation-resting)` | box-shadow |
| `--zk-button-padding-y` | `6px`（現為 literal）| padding Y |
| `--zk-button-padding-x` | `var(--zk-spacing-4)` | padding X |
| `--zk-button-height`（既有）| `36px` | min-height |

### 5.2 Input（`js/zul/inp/css/input.css`，共用 `.z-textbox/.z-intbox/...`）
| knob | 預設（=現值） | 消費點 |
|------|--------------|--------|
| `--zk-input-bg` | `var(--zk-color-surface)` | background-color |
| `--zk-input-fg` | `var(--zk-color-on-surface)` | color |
| `--zk-input-border-color` | `var(--zk-color-outline)` | border-color（rest）|
| `--zk-input-border-color-hover` | `var(--zk-color-on-surface)` | `:hover` |
| `--zk-input-border-color-focus` | `var(--zk-color-primary)` | `:focus(-visible)` |
| `--zk-input-border-color-error` | `var(--zk-color-error)` | `.z-error/.z-*-invalid` |
| `--zk-input-radius` | `var(--zk-shape-input)` (4px) | border-radius |
| `--zk-input-height`（既有）| `var(--zk-control-height)` (40px) | min-height |

### 5.3 Window（`js/zul/wnd/css/window.css`）
| knob | 預設（=現值） | 消費點 |
|------|--------------|--------|
| `--zk-window-bg` | `var(--zk-color-surface)` | `.z-window` background-color |
| `--zk-window-border-color` | `var(--zk-color-outline-variant)` | border / header border-bottom |
| `--zk-window-radius` | `var(--zk-shape-corner-extra-small)` (4px) | border-radius |
| `--zk-window-header-fg` | `var(--zk-color-on-surface)` | 標題 color |
| `--zk-window-icon-hover-bg` | `var(--zk-color-surface-container)` | `.z-window-icon:hover` |
| `--zk-window-close-hover-bg` | `var(--zk-color-error-container)` | `.z-window-close:hover` |
| `--zk-window-header-height` / `-header-padding-y`（既有）| 56px / 16px | header |

### 5.4 Grid（`js/zul/grid/css/grid.css`）
| knob | 預設（=現值） | 消費點 |
|------|--------------|--------|
| `--zk-grid-bg` | `var(--zk-color-surface)` | `.z-grid` / `.z-row` background |
| `--zk-grid-border-color` | `var(--zk-color-outline-variant)` | 框線 / cell border-bottom |
| `--zk-grid-radius` | `var(--zk-shape-card)` (6px) | border-radius |
| `--zk-grid-header-fg` | `var(--zk-color-on-surface-variant)` | `.z-column` color |
| `--zk-grid-row-hover-bg` | `rgba(0,0,0,0.04)`（現為 hardcoded literal）| `.z-row:hover` |
| `--zk-grid-stripe-bg` | `var(--zk-color-surface-container-lowest)` | `.z-row-odd` |
| `--zk-grid-foot-bg` | `var(--zk-color-surface-container-low)` | `.z-grid-foot` |
| `--zk-grid-cell-padding`（既有）| 16px | cell padding |

> `--zk-grid-row-hover-bg` 與 `--zk-button-padding-y` 預設維持現有 literal 以保零回歸；
> 「把 row-hover 收斂為 `color-mix(on-surface …)` 與 striped 一致」列為**可選** follow-up，非本次行為變更。

## 6. 實作步驟

1. 建 `tokens/_component-theme.css`：依 §5 宣告 pilot knob 於 `:root`，預設 = 現值，分區重註解。
2. `scripts/build-css.js`：把該檔加入 token 串接清單（unlayered、排 base token 後 / `_forced-colors.css` 前）。
3. 逐 pilot 元件 CSS **外科式**改寫：把 §5 列出的直接 token/literal 換成 `var(--zk-<comp>-knob)`；**只動這些屬性**，不改行為。
4. `npm run build:css`；確認 `norm.css.dsp` 含 knob、各元件 `.css.dsp` 已改為引用 knob；`npm run check:css-dsp` 通過。
5. 寫 `doc/spec/component-theming-api.md`：機制、**cascade / 載入順序守則**、命名詞彙、per-component knob 表、whole-app vs regional override 範例、與 brand-override / density 的關係、「如何把新元件納入 API」的 recipe。
6. 加 demo 頁 `src/test/resources/web/component-theming.zul`：一個 scoped 區塊 override（如 pill 按鈕 + 綠框輸入）與預設並排；視情況於 `usecase/index.zul` 加 navitem。
7. Playwright（`src/test/playwright/`）computed-style A/B：
   - scoped override 改變目標元件 computed style；
   - **同頁 sibling 預設元件不受影響**（證明 scoping 不外洩）；
   - whole-app `:root` override 生效；
   - 預設頁零回歸（沿用現有 visual/computed baseline）。

## 7. 驗證

- **零回歸**：現有 button/textbox/window/grid 的 screenshot / computed baseline 不得變（預設 = 現值，理應不變）。
- **API 生效**：上述新 Playwright specs 綠燈。
- **建置完整**：`npm run build:css` + `npm run check:css-dsp` 通過。
- 依 CLAUDE.md：`withjdk.sh 17 mvn test exec:java@preview-app` 起站，肉眼確認 demo 頁 + 既有 pilot 頁。

## 8. 風險 / 注意

- **載入順序**：whole-app override 須載在 `norm.css.dsp` 之後（或用 `:root[data-*]` 提高 specificity）。文件須醒目標註。Regional override 無此問題（靠繼承）。
- **region 對上游 seed 的凍結**：在 region 覆寫上游 `--zk-color-primary` 期待衍生 knob 跟著變 → 不會（凍結）。採用者應**直接覆寫元件 knob**。文件說明。
- **變體延後**：outlined/text/fab/color 變體 knob 首波不做；只做 base filled。
- **scope creep**：抵抗曝露每個屬性；只留策展表面。
- **FAB / color 變體的 hardcoded** box-shadow / hex fallback（如 `var(--zk-color-secondary,#4db6ac)`）維持原狀，不在本次處理。
