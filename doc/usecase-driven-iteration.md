# Use-Case 驅動設計計畫

https://mui.com/store/previews/mira-pro-react-material-admin-dashboard/

## 背景與目標

本計畫採用**以最終目的為導向**的設計方法：
- 視覺目標：**模仿 Mira dashboard** 的企業風格（藍靛色系 `#376fd0`、Inter 字型、圓角卡片）
- 用 8 個真實業務情境頁面（usecase）作為驗證目標
- 先截圖觀察最終頁面效果，對照 `doc/mira/*.html` 參考頁面，再反推需要修改哪些元件的 CSS
- 每個 iteration 必須有**瀏覽器截圖**作為視覺驗證證據，由 AI 自動分析

---

## 整體流程

```
前置作業（換色系 + 清 ZUL inline style）
       ↓
啟動 preview app
       ↓
┌─── Iteration Loop（每頁最多 3 次）────────────────────┐
│  1. OBSERVE  → 截圖 + 對照 Mira HTML 參考頁面         │
│  2. AUDIT    → 識別視覺差異 + MD3 合規問題            │
│  3. FIX      → zk-theme-creator 修改對應元件 CSS      │
│  4. REBUILD  → npm run build:css                      │
│  5. VERIFY   → 再次截圖，對比 before/after            │
│  6. PASS?    → 視覺像 Mira + 無 Critical MD3 問題     │
│                                                       │
│  ⚠️ 達到 3 次上限仍未解決 → 標記 ZK Constraint 跳過   │
└───────────────────────────────────────────────────────┘
       ↓（8 個頁面全部通過）
  mvn clean package 最終建置
```

---

## 啟動指令

```bash
# 啟動 preview app（需 JDK 17），同時自動監看 CSS 變更
withjdk.sh 17 mvn test exec:java@preview-app
```

---

## Iteration 優先順序

由「基礎元件多」→「複合元件多」排序：

| 順序 | 頁面 | URL | 核心元件 | Mira 參考 |
|------|------|-----|---------|-----------|
| 1 | dashboard.zul | `/usecase/dashboard.zul` | vlayout, panel, groupbox, listbox, progressmeter, rating, slider | `dashboard-default.html` |
| 2 | app-shell.zul | `/usecase/app-shell.zul` | borderlayout, menubar, toolbar, tabbox, calendar | `dashboard-default.html` (sidebar) |
| 3 | order-entry.zul | `/usecase/order-entry.zul` | window, tabbox, groupbox, grid, inputgroup, combobutton, listbox | `forms-text-fields.html` |
| 4 | employee-grid.zul | `/usecase/employee-grid.zul` | grid(group/auxhead/frozen), paging, datebox, bandbox, popup | `tables-advanced-table.html` |
| 5 | user-profile.zul | `/usecase/user-profile.zul` | anchorlayout, absolutelayout, textbox, slider, rating | `pages-profile.html` |
| 6 | product-browser.zul | `/usecase/product-browser.zul` | splitter, tree, listbox, rating, popup, paging | `products.html` |
| 7 | report-viewer.zul | `/usecase/report-viewer.zul` | borderlayout, toolbar, groupbox, grid(group), datebox, calendar | `dashboard-analytics.html` |
| 8 | media-manager.zul | `/usecase/media-manager.zul` | tabbox, audio, fileupload, progressmeter | `pages-blank.html` |

---

## 每個 Iteration 的標準步驟

### Step 1 — 截圖觀察（OBSERVE）

1. 導航至 use-case 頁面
2. 全頁截圖（**before 圖**，存為 `doc/screenshots/{page}-before.png`）
3. **驗證截圖已存檔**：在報告中記錄 `"Saved {page}-before.png, {N} bytes"`；若 Write 失敗則重試
4. 讀取 console 錯誤
4. **必須** 呼叫 `Read` 開啟對應的 **Mira 參考 HTML**（`doc/mira/*.html`）— 不允許只依賴文字描述，對照分析以下差異：
   - **整體色系**：是否符合 Mira 藍靛色 `#376fd0` 主色調
   - **卡片 / 容器**：圓角、陰影是否與 Mira 一致
   - **字型層次**：標題/內文大小對比是否清晰
   - 布局問題：元件重疊、溢出、異常捲動條
   - 間距問題：元件緊貼（margin/gap 為 0）、內距不足
   - 元件狀態：hover/focus 無視覺回饋

### Step 2 — 審查（AUDIT）

1. 基於截圖比對，列出與 Mira 的視覺差異（Critical / Warning）
2. 同時確認 MD3 token 使用正確（無 hardcoded hex）
3. 輸出報告儲存至 `doc/md3-reports/{page}-v{n}.md`（n = 迭代次數）

**Critical（必須修正）：**
- 整體布局崩潰
- 主色調完全不符（不是藍靛色系）
- 核心元件完全無樣式

**Warning（記錄但不阻塞）：**
- 細節與 Mira 略有差異
- 間距稍微不一致
- Hover 效果較弱

### Step 3 — CSS 修正（FIX）

1. **寫 CSS 前必做**：
   - 查閱 `doc/component-dom-structures.md` 確認目標元件的實際 class 名稱
   - 若 doc 中未記載，讀取 ZK source mold 檔確認（路徑見「Agent Skills 對應」表）
   - 不允許猜測 class 名稱（參考上方 Known ZK DOM Quirks 清單）
2. 判斷每個問題的修正類型：
   - **Theme 修正**：問題根因在元件樣式本身 → 修改 `src/main/resources/web/js/zul/*/css/*.css` 或 `src/main/resources/web/zul/css/tokens/*.css`
   - **Application 修正**：問題是 use-case 頁面特有 → 修改 `src/test/resources/web/usecase/usecase.css` 或對應 ZUL
3. 修正後 rebuild 並做 smoke test：
   ```bash
   npm run build:css
   # 確認目標頁面已改善，再瀏覽 dashboard.zul 確認未回歸
   ```

### Step 4 — 再截圖驗證（VERIFY）

1. 重新導航至頁面（強制重整）
2. 全頁截圖（**after 圖**，存為 `doc/screenshots/{page}-after.png`）
3. **驗證截圖已存檔**：記錄 `"Saved {page}-after.png, {N} bytes"`
4. 對照 Mira 參考頁面確認改善程度
5. 更新 `doc/md3-reports/{page}-v{n}.md` 的 Remediation Log
6. **報告最後一節必須是**：
   ```markdown
   ## Files Written
   - doc/screenshots/{page}-before.png ({N} bytes)
   - doc/screenshots/{page}-after.png ({N} bytes)
   ```

---

## ⚠️ 迴圈上限規則（防止無限迴圈）

**每個 use-case 頁面最多執行 3 次迭代（OBSERVE → FIX → VERIFY）。**

- 第 1 次：修正所有 Critical 問題
- 第 2 次：修正剩餘 Critical + 主要 Warning
- 第 3 次：最後一次修正機會

**第 3 次結束後仍未解決的問題，必須標記原因後跳過：**
- `⚠️ ZK Constraint` — ZK 框架 DOM 結構限制，CSS 無法解決
- `📋 Design Decision` — 有意為之的設計差異，不需完全複製 Mira
- `📋 Accepted` — 差異可接受，不影響整體視覺品質

**不得因單一問題卡住整個流程。**

---

## 通過條件（Per Page）

### Must Pass（否則繼續修改，最多到第 3 次）
- [ ] 截圖無布局崩潰（無元素溢出、重疊、異常捲動）
- [ ] 整體色系符合 Mira 藍靛風格
- [ ] 核心元件有基本樣式（不是純瀏覽器 default）
- [ ] Console 無紅色 CSS/JS 錯誤

### Should Pass（記錄但不阻塞）
- [ ] 視覺細節接近 Mira 對應頁面
- [ ] 所有 color 屬性使用 `--md-sys-color-*` token（無 hardcode hex）
- [ ] Hover / Focus / Active 狀態視覺可區分

---

## 最終完成條件

- [ ] 8 個 use-case 頁面截圖全部通過視覺驗證
- [ ] 8 份審查報告存於 `doc/md3-reports/`
- [ ] Before/after 截圖對存於 `doc/screenshots/`
- [ ] `withjdk.sh 17 mvn clean package` 建置成功

---

## Agent Skills 對應

| 步驟 | 使用工具 / Skill |
|------|----------------|
| 截圖觀察 | Playwright browser tools |
| Mira 參考比對 | Read `doc/mira/*.html` + AI 視覺分析 |
| Console 檢查 | browser console tools |
| CSS 實作修改 | `zk-theme-creator` agent |
| CSS 重建 | Bash: `npm run build:css` |
| ZK DOM 參考 | `/Users/hawk/Documents/workspace/ZK10/zk/zul` |

---

## 關鍵 CSS 檔案路徑

```
src/main/resources/web/zul/css/
├── tokens/
│   ├── _colors.css          ← MD3 color token 根源（主色 #376fd0）
│   ├── _typography.css      ← Inter 字型
│   ├── _spacing.css         ← 4dp 間距系統
│   ├── _elevation.css       ← Mira 卡片陰影
│   ├── _shape.css           ← 圓角值
│   └── _motion.css          ← 動畫 timing
├── base/
│   ├── _reset.css           ← 基礎 reset + fs-* 工具類
│   ├── _utilities.css       ← md-hbox / md-flex-1 / page-content 等
│   └── _icons.css           ← 圖示字型
└── zk-material.css          ← 全域入口樣式

src/main/resources/web/js/zul/
├── wgt/css/                 ← button, checkbox, toolbar, groupbox, ...
├── inp/css/                 ← input, combobox, datebox, slider, ...
├── grid/css/                ← grid
├── sel/css/                 ← listbox, tree
├── tab/css/                 ← tabbox
├── menu/css/                ← menu, menubar
├── wnd/css/                 ← window, panel
├── mesh/css/                ← paging, auxhead, frozen
├── box/css/                 ← hbox, vbox, hlayout, vlayout
├── layout/css/              ← borderlayout, anchorlayout, ...
└── db/css/                  ← calendar
```

---

## 注意事項

1. **Mira 參考優先**：每個頁面 iteration 開始前，先讀取對應的 `doc/mira/*.html` 作為視覺目標
2. **截圖是硬性要求**：每個 iteration 必須有 before/after 截圖
3. **迴圈上限**：每頁最多 3 次，第 3 次後未解決的問題標記原因跳過
4. **瀏覽器重整**：rebuild CSS 後，需重新導航頁面才能看到效果
5. **每次修正後必須更新報告**：標記每個 finding 的最終狀態（`✅ Fixed` / `⚠️ ZK Constraint` / `📋 Design Decision` / `📋 Accepted`）

---

## Known ZK DOM Quirks

Agent 使用前必須先查核這份清單，避免重複猜測錯誤的 class 名稱：

| 元件 | 直覺猜測（錯誤） | 實際 ZK Class |
|------|----------------|---------------|
| Panel 內容區 | `.z-panel-content` | `.z-panelchildren` |
| Rating 星星 | `.z-rating-star` | `.z-rating-icon` |
| Progressmeter 填色 | `.z-progressmeter-bar` | `.z-progressmeter-image` |
| Paging 上一頁 | `.z-paging-prev` | `.z-paging-previous` |
| Listcell 內容 | `.z-listcell-cnt` | `.z-listcell-content` |
| Treecell 內容 | `.z-treecell-cnt` | `.z-treecell-content` |
| Grid cell 內容 | `.z-cell-content` | `.z-row-content` |
| Groupbox 內容區 | `.z-groupbox-body` | `.z-groupbox-content` |
| Window/Panel 標題 | `.z-window-title span` | `.z-window-header` 下的純文字節點 |
| Caption 文字 | `.z-caption-text` | `.z-caption-content` 下的純文字節點 |
| BorderLayout 布局 | `display: flex` | 各 region 必須 `position: absolute`（JS layout engine） |
| Menubar 子元素 | `.z-menubar > .z-menu` | `.z-menubar > ul > li > .z-menu`（有中介 `<ul>`） |

> 完整 DOM 結構參考：`doc/component-dom-structures.md`（從 iceblue_c 主題驗證）

---

## Sub-Agent Prompt 範本（改進版）

以下為啟動每個頁面 iteration agent 的標準 prompt 結構：

```
## 頁面資訊
目標頁面：{page}.zul (http://localhost:8080/usecase/{page}.zul)
Mira 參考：doc/mira/{reference}.html

## Before Writing Any CSS — 必做步驟
1. 讀取 `doc/component-dom-structures.md` — 確認元件 class 名稱，不猜測
2. 若 doc 中無對應元件，讀取 ZK source:
   /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/{component}/
3. **必須** Read `doc/mira/{reference}.html` — 不允許只依賴文字描述

## 截圖存檔要求
- Before: `doc/screenshots/{page}-before.png` → 存檔後記錄 "Saved {page}-before.png, {N} bytes"
- After:  `doc/screenshots/{page}-after.png`  → 存檔後記錄 "Saved {page}-after.png, {N} bytes"
- 若 Write 工具靜默失敗，重試一次；仍失敗則在報告中標記 "⚠️ Screenshot write failed"
- 報告最後一節固定格式：
  ```
  ## Files Written
  - doc/screenshots/{page}-before.png ({N} bytes)
  - doc/screenshots/{page}-after.png ({N} bytes)
  ```

## After Every Fix — 必做步驟
1. `npm run build:css`
2. 重新導航至 {page}.zul（強制重整）
3. 再截圖確認改善
4. **smoke test**：導航至 `http://localhost:8080/usecase/dashboard.zul` 確認未回歸

## 報告
存至 `doc/md3-reports/{page}-v{n}.md`
最後一行列出：已存檔的截圖路徑 + 檔案大小
```

---

## 執行批次建議

- 每個 session 最多處理 **3–4 個頁面**，避免 API rate limit 中斷
- 每個 agent 完成後，**啟動下一個 agent 之前**，主 context 執行：
  ```bash
  ls -lh doc/screenshots/{page}*.png
  ls doc/md3-reports/{page}-v*.md
  ```
  - 若截圖缺失 → 重啟 agent，附加指令：「截圖未存檔，請重新存 before/after PNG 並記錄 bytes」
  - 若報告缺失 → 重啟 agent，附加指令：「報告未存檔，請重新存 doc/md3-reports/{page}-v{n}.md」
  - 不跳過驗證直接繼續下一頁

---

## 截圖資料夾結構

```
doc/
├── screenshots/
│   ├── {page}-before.png    ← agent 產出（每次迭代）
│   ├── {page}-after.png     ← agent 產出（每次迭代）
│   └── issues/              ← 使用者提供的問題截圖（不由 agent 管理）
│       ├── selection-border.png
│       └── ...
└── md3-reports/
    └── {page}-v{n}.md       ← agent 審查報告（Markdown only）
```
