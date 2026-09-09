# Tier 1 #2 — 裝置自適應（Responsive visibility + Container queries）

> 承 `doc/framework-feature-gaps.md` Tier 1 #2。實作「依裝置／容器尺寸切換版面」的 utility，
> 補齊 Marble 目前 utility CSS **完全沒有 `@media`** 的落差。對齊 MUI breakpoint
> 與 `doc/spec/responsive-design.md` §5 已預留的尺度。

## 設計決策（已定，理由附後）

### (a) Viewport 響應可見性 — mobile-first / min-width
- **命名**：`z-d-{value}-{bp}` = 「在 viewport ≥ bp 時，`display:{value}`」。
- **breakpoint**（MUI，responsive-design.md §5）：`sm`=600、`md`=900、`lg`=1200、`xl`=1536。
  `xs`=0 即 base（不需 media query，用無後綴的既有 `z-d-*` 覆蓋）。
- **display 值**（精選 5 個，涵蓋 hide/show + 版面切換；不做投機的全矩陣）：
  `none / block / flex / grid / inline-block`。
- **矩陣**：5 值 × 4 bp = **20 class**。
- **組合語意**（min-width 疊加）：
  - 手機隱藏、≥md 顯示側欄：`z-d-none z-d-block-md`
  - 只在 <md 顯示漢堡鈕：`z-d-block z-d-none-md`
- breakpoint 數值只能寫**字面 px**（CSS 限制：`@media` 條件不能用 `var()`）；於註解列出 MUI 尺度。

### (b) Container queries — 依容器寬度（貼合 intrinsic 哲學）
- **containment 原語**：`.z-container { container-type: inline-size; }` — 標記查詢容器。
- **容器版顯示變體**：`z-cq-{value}-{bp}`（`d`→`cq` 對映 viewport 家族），包在
  `@container (min-width: X)` 內。同 5 值 × 4 bp = **20 class**。
- 沿用**同一組 sm/md/lg/xl 尺度**（一套心智模型），文件註明「量的是容器 inline-size，不是 viewport」。
- `z-cq-*` **必須**有 `z-container` 祖先才生效（demo/文件一律成對出現，避免無容器 fallback 的歧義）。

### 檔案落點
- CSS：全部加進既有 `src/main/resources/web/zul/css/utility/_layout.css`（維持「display utilities 住這」
  的分類，隨 `norm.css.dsp` 自動打包，無新 build 接線）。放在既有 `@layer zk-utilities { … }` 塊**內**
  （已驗證 `@media`/`@container` 嵌在 `@layer` 內可通過 CleanCSS level-1 build，見 rowlayout.css 前例）。
- 預覽頁：新檔 `src/test/resources/web/utility/responsive.zul`（比照 `utility/colors.zul` 版式），
  並在 `usecase/index.zul` Utility CSS 分類加一條 `Responsive` navitem。
- 文件：更新 `doc/spec/responsive-design.md` §5（把「未來再評估」改為「已提供」+ 用法）。
- 測試：新增 `src/test/playwright/responsive-utilities.spec.ts`
  - viewport：寬視窗 `z-d-none-md` 隱藏、窄視窗顯示（`setViewportSize` 跨 900 斷言 computed `display`）。
  - container：同一 `z-cq-none-md` 在 1000px `z-container` 內隱藏、在 400px 內顯示。

## 為何這樣設計
- **mobile-first / min-width**：MUI（本 theme 對齊對象）與 Tailwind 皆 min-width；`col-*` 12 欄式已於 §1 明確排除。
- **精選 5 值而非全矩陣**：Simplicity First／不做投機；`inline`/`inline-flex`/`contents` 極少用於 RWD 切換，需要再加。
- **container 與 viewport 同尺度**：一套尺度好教；容器版真正落在「dashboard 欄／split pane」等可寬區塊，值合理。
- **`z-container` 為必要前提**：規避「無容器時 `@container` fallback 到 viewport」的實作歧義。

## 驗證
1. `npm run build:css` → 確認 `target/classes/web/marble/**/norm.css*` 含 `@media`/`@container` 且 class 名正確。
2. `withjdk.sh 17 mvn test exec:java@preview-app` → 開 `/utility/responsive.zul` 及
   `usecase/index.zul#utility/responsive` 目視。
3. `npx playwright test --project=…`（新 spec）→ 幾何/computed-display 斷言綠。

## 完成後
- commit 只 stage 本次變更路徑（`_layout.css`、`responsive.zul`、`index.zul`、`responsive-design.md`、
  新 spec/測試、`tasks/…`）；**不**碰工作區既有的 `native-modern-ui-components.md`、`auto-contrast-text.md`。
- 於 `doc/framework-feature-gaps.md` 標記 Tier 1 #2 進度。
