# Marble 主題 — 與主流 Web Framework 的功能落差分析

> 分析日期：2026-07-20。基準 ZK 版本：10.4.0-jakarta。
> 本文件是**分析 + roadmap**，非 normative spec（規範以 `doc/spec/` 為準）。

> **進度更新（2026-07-23）— Tier 1 #1 已交付。** 「元件級主題變數（Component Theme Variables）」
> 從 3 元件 pilot 擴為**全面完工並入庫**：每個有專屬 stylesheet 的視覺元件都已套上可覆寫的
> `--zk-<comp>-*`（`_component-theme.css` 共 **73** 個 `--zk-<comp>-` 家族、tracker A 表 **61** 列元件），
> 含 **CTV-1…9** 檢驗條件、`component-theming` 測試 **105 綠**、涵蓋全 **172** 元件的進度 tracker（**B / D 皆清空**——
> 連原本受阻、無 base CSS 的 breadcrumb / carousel 也已補齊 base 元件 CSS + 變數）。另補 **Authoring rule 5**：
> typography 屬全域 typescale、非元件旋鈕。實作採 generator（sonnet）↔ 獨立 Opus checker 的雙角色 workflow。
> 規範見 [`spec/component-theme-variables.md`](spec/component-theme-variables.md)；逐元件進度見
> [`component-theme-variables-progress.md`](component-theme-variables-progress.md)。commits `12ed13f`→`87d5dfb`（+`69415b6`）。

## 目的

Marble 即將成為 ZK 11.0 的預設外觀主題。本文回答一個問題：**排除 RTL 與 Dark Theme 之後**，
相較目前市面上受歡迎的 Web Framework，Marble 在 **CSS 功能** 與 **主題（theming）功能** 上還缺少什麼？

比較基準：
- **Utility-CSS 類**：Tailwind CSS、Bootstrap 5、Open Props（token 廣度參考）
- **元件庫主題系統類**：MUI (Material UI)、Ant Design、Chakra UI

Marble 同時橫跨兩種角色 —— 既是「元件主題」（對齊 MUI），又內建整套 `z-*` utility class
（對齊 Tailwind/Bootstrap），故兩類都比。

> 明確排除（皆已有專屬決策，不在本文討論）：
> - **Dark mode** — won't-do（見 `doc/spec/design-decisions.md` §1）
> - **RTL** — backlog，唯一已知功能性缺口（§3）

---

## 先確認：Marble「已經很強」的部分（避免誤報為缺口）

- **Token 架構現代**：`oklch(from …)` relative-color 推導、`@layer` cascade layers、logical properties（RTL-ready）、`:has()`、`prefers-reduced-motion`、完整 MD3 typescale / spacing / elevation / shape / motion ladder。
- **主題客製**：單 seed 品牌換色（`--zk-color-primary` → 自動推導 container / fill / focus）、4 個品牌 preset、`MarbleBrand` / `MarbleDensity` Java runtime API、compact 密度層。
- **A11y 基礎扎實**：forced-colors（Windows 高對比）、focus-visible、sr-only / visually-hidden、reduced-motion 皆具備。
- **響應式**：intrinsic auto-fit grid（`z-grid-fill`、`z-grid-cols-auto`）+ 獨立的平板/手機 UA 主題層（`tablet.css.dsp`）。

以上不列為缺口。以下才是相對主流框架真正欠缺的。

---

## 落差清單（依企業級 ROI 分層）

### Tier 1 — 對「企業預設主題」而言真正該補的落差

| # | 落差 | 主流框架怎麼做 | Marble 現況 | 為何重要 |
|---|------|---------------|------------|---------|
| 1 | **元件級主題變數(Component Theme Variables)** ✅ | MUI `theme.components.MuiButton.styleOverrides` / `variants`；Ant `ConfigProvider theme.components.Button.*`；Chakra component theme | **✅ 已完成**：所有有 stylesheet 的視覺元件皆宣告可覆寫 `--zk-<comp>-*`（**73** 家族／A 表 **61** 列元件），含 CTV-1…9 檢驗條件 + 全 **172** 元件 tracker（B/D 清空）、`component-theming` **105** 測試綠（原為缺口，現已系統化並完工） | **MUI / Ant 最大賣點**。企業客戶最常要「只改我們的 button / grid 樣式而不 fork 主題」 |
| 2 | **裝置自適應控制**（container queries + 響應可見性） ✅ | Tailwind `@container` / `md:`；Bootstrap `.d-md-none` 響應顯示；MUI breakpoints | **✅ 已完成**：`_layout.css` 新增 viewport `.z-d-{value}-{bp}`（mobile-first / min-width，sm 600 / md 900 / lg 1200 / xl 1536）＋ container query `.z-container` / `.z-cq-{value}-{bp}`（`container-type: inline-size` + `@container`）；預覽頁 `utility/responsive.zul`、`responsive` Playwright 專案 4 綠、`responsive-design.md` §5 更新 | Dashboard / ERP 常需「依容器寬度切換」。**Container queries** 比 breakpoint 更貼合 Marble 的 intrinsic 哲學 |
| 3 | **列印樣式** `@media print` | Bootstrap `.d-print-*` + print reset | 完全沒有 | ERP / CRM 天天印報表、發票、清單。目標客群最需要，卻是 0 覆蓋 |
| 4 | **z-index / 疊層尺度** | MUI `theme.zIndex`（appBar / drawer / modal / snackbar / tooltip）；Bootstrap `$zindex-*`；Chakra `zIndices` | 無 z-index token scale、無 utility | 框架衛生。避免企業 App 自訂 overlay 時的 z-index 大戰；主題自身 overlay 排序也該有文件化尺度 |
| 5 | **Skeleton / shimmer 載入態** | MUI `Skeleton`、Ant `Skeleton`、Bootstrap placeholders | 只有 spinner / progress bar 元件 | 資料密集型 App（正是目標客群）載入時幾乎都用骨架屏。缺一個 `.z-skeleton` utility |

### Tier 2 — Utility 廣度與細節打磨（可批次補齊）

主流 utility 框架有、Marble 缺的 utility family（挑高使用率的）：

- **`opacity`**（`.z-opacity-50`）、**`cursor`**（`pointer` / `not-allowed`）、**`user-select`**、**`pointer-events`**
- **`aspect-ratio`**（`aspect-video` / `square`）+ **`object-fit`**（cover / contain）—— 卡片 / 媒體版面基本款
- **多行 line clamp**（`line-clamp-2 / 3`）—— 目前只有單行 `z-text-truncate`；卡片 / 清單摘要極常用
- **`backdrop-filter`（blur）** + **transform**（rotate / scale / translate）+ **gradient 背景** utility
- **`z-index` / `order`** utility；**border-color / border-width** 變體（目前只有 `z-border` / `z-border-0`）
- **elevation utility 補 4 / 5**（token 到 5，utility 只到 3）
- **尺寸尺度太粗**：`w-* / h-*` 只有 25 / 50 / 75 / full / auto；缺固定尺度、缺 `max-width` / `min-width`（如 `max-w-prose`）、缺 `grid-rows-*` / `place-*` / `gap-7+`
- **可重用動效 preset**（`.z-animate-fade-in` 等）—— 有 motion token 與元件內 keyframes，但沒開放成 utility（Open Props / Tailwind `animate-*` 有）
- **原生控制項快速勝利**：`accent-color`（讓原生 checkbox / radio / range 免費吃品牌色）、`color-scheme`

### Tier 3 — 設計工具與交付（tooling，非 CSS 本身）

- **Design token 匯出**（W3C DTCG JSON / Style Dictionary）+ **Figma kit** + **多 token 視覺 playground**
  （`doc/spec/design-decisions.md` §6 已自認：目前只有單 seed 色彩 picker）。
  MUI / Ant / Tailwind 都有 —— 對「ZK 11 預設主題」的**企業導入與設計團隊交付**是真實推力。
- **Skip-link / skip-to-content** a11y pattern（政府 / 金融 WCAG 稽核常見缺項；其餘 a11y 已很完整）。
- **`clamp()` fluid typography**（可選；哲學上貼合 intrinsic，但 MD3 用固定 typescale，優先度低）。

### Tier 4 — 前沿 primitive（建議延後，非企業剛需）

View Transitions API、scroll-snap（輪播 / 圖廊）、scroll-driven animations、CSS anchor positioning、subgrid。
ZK 多以 JS 定位 overlay、企業需求低，選擇性補（如圖廊用 scroll-snap）即可。

---

## 一句話結論

排除 RTL / Dark 後，Marble 的 **token 與架構層已對齊甚至領先**主流框架；真正的落差集中在兩處：

1. **元件級客製（Component Theme Variables）**（MUI / Ant 的核心賣點）—— 結構性;**現已落地**;
2. **應用層 CSS 廣度**（列印、container queries、skeleton、z-index 尺度、opacity / aspect-ratio / line-clamp 等 utility）—— 量多但單項成本低，可批次補齊。

Tooling（token 匯出 / Figma）是導入推力但屬周邊。前沿 primitive 可延後。

---

## Tier 1 Roadmap（impact / effort / 切入點）

| # | 項目 | Impact | Effort | 實作切入點（要動哪些檔） |
|---|------|--------|--------|------------------------|
| 1 | **元件級主題變數(Component Theme Variables)** ✅ 已完成 | 高（最大賣點） | 高（已投入） | **✅ 已交付**（commits `12ed13f`→`87d5dfb`）。落地做法與原規劃有一處**設計修正**：改採 **no-fallback** —— 每元件於 `tokens/_component-theme.css` 的 `:root` 宣告 `--zk-<comp>-*`（預設 = 原值、零回歸），component CSS 於 `@layer zk-components` 內以 `var(--zk-button-bg)` **無 fallback** 消費（非原規劃的 `var(--zk-button-bg, …)`；理由見 Authoring rule 3：預設只在 `:root` 宣告一次、避免 fallback 漂移、DevTools 可探）。原「先做 3–5 個 pilot」已擴至**全部**有 stylesheet 的視覺元件（含新做 base CSS 的 breadcrumb / carousel）。流程：generator（sonnet）實作 ↔ 獨立 Opus checker 驗 CTV-1…9。檔：`src/main/resources/web/js/zul/**/css/*.css` + `doc/spec/component-theme-variables.md` + `doc/component-theme-variables-progress.md` |
| 2 | **裝置自適應**（container queries + 響應可見性） **✅ 已交付** | 中高 | 中 | (a) ✅ viewport 響應可見性 `.z-d-{value}-{bp}`（`value` ∈ none/block/flex/grid/inline-block × bp ∈ sm 600/md 900/lg 1200/xl 1536，mobile-first）。(b) ✅ container queries：`.z-container`（`container-type: inline-size`）＋ `.z-cq-{value}-{bp}`（`@container` 變體，同尺度）。落地：`utility/_layout.css` 既有 `@layer zk-utilities` 塊內（`@media`/`@container` 已驗證通過 CleanCSS build）；預覽頁 `src/test/resources/web/utility/responsive.zul` + `usecase` navitem「Responsive」；`responsive-design.md` §5 改寫為「已提供 + 用法」；回歸測試 `responsive-utilities.spec.ts`（`responsive` 專案，4 綠）。**設計注記**：value 精選 5 個（非全矩陣，Simplicity First）；`z-cq-*` 必須有 `z-container` 祖先 |
| 3 | **列印樣式** `@media print` | 中高（企業） | 低 | 新 `utility/_print.css`：`.z-d-print-none` / `.z-d-print-block`、elevation → border、展開 overflow 讓 grid 完整印出、移除 sticky。經 `scripts/build-css.js` bundle 進 `norm.css.dsp`。檔：新 utility + build script + 新 `doc/spec/print-styles.md` |
| 4 | **z-index / 疊層尺度** | 中 | 低中 | 新 `tokens/_zindex.css` token ladder（dropdown 1000 / sticky 1020 / fixed 1030 / modal-backdrop 1040 / modal 1050 / popover 1060 / tooltip 1070 / toast 1080，對齊 Bootstrap / MUI）+ `.z-index-*` utility。稽核既有 window / popup / menu z-index 對齊。bundle 進 `norm.css.dsp` |
| 5 | **Skeleton / shimmer** | 中高 | 低中 | 純 CSS utility `.z-skeleton`（surface-variant + shimmer keyframe，**須 reduced-motion guard**）+ `-text` / `-circle` / `-rect` 變體。沿用 `js/zul/wgt/css` 既有 keyframe 寫法。檔：新 `utility/_skeleton.css`（或併入 `_components.css`） |

**Tier 2** 建議打包成一次「utility 廣度 pass」（多為附加、低風險）：opacity / cursor / user-select / aspect-ratio / object-fit / 多行 line-clamp / backdrop-blur / transform / gradient / border-color·width / elevation 4·5 / 更細尺寸尺度 / 動效 preset / `accent-color`。落在既有 `_layout.css`、`_borders.css`、`_colors.css`、`_elevation.css` + 新 `_effects.css`。

---

## Verification（如何驗證補上的功能）

- 新 utility：`npm run build:css` 後在 preview app（`withjdk.sh 17 mvn test exec:java@preview-app`）用實際 ZUL 頁驗證，並沿用 `src/test/playwright/` 幾何 / computed-style 斷言（如 `tablet.spec.ts` 模式）。
- 元件級主題變數（Component Theme Variables）：寫一頁覆寫 `--zk-<comp>-*` 的 demo，Playwright 量 computed style 確認生效且**不影響其他元件**（已落地,見 CTV-1…9 檢驗條件）。
- 列印樣式：Playwright `page.emulateMedia({ media: 'print' })` 斷言 `.z-d-print-none` 等隱藏 / 顯示行為。
- Skeleton：`prefers-reduced-motion` 下 shimmer 動畫須停止（比照 `tokens/_motion.css` 既有守則）。
