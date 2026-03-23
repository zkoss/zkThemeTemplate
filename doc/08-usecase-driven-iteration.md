# Use-Case 驅動設計計畫

## 背景與目標

目前主題已有 50+ 個元件 CSS 檔案，但設計方式是「逐元件調整」，缺乏整體視角。

本計畫改為**以最終目的為導向**的設計方法：
- 用 8 個真實業務情境頁面（usecase）作為驗證目標
- 先截圖觀察最終頁面效果，再反推需要修改哪些元件的 CSS
- 每個 iteration 必須有**瀏覽器截圖**作為視覺驗證證據，由 **AI 自動分析**，不依賴人眼判斷

---

## 整體流程

```
前置作業（換色系 + 清 ZUL inline style）
       ↓
啟動 preview app
       ↓
┌─── Iteration Loop ────────────────────────────────────┐
│  1. OBSERVE  → 截圖 + AI 視覺分析                     │
│  2. AUDIT    → md3-design-verifier 生成 MD3 合規報告  │
│  3. FIX      → zk-theme-creator 修改對應元件 CSS      │
│  4. REBUILD  → npm run build:css                      │
│  5. VERIFY   → 再次截圖，對比 before/after            │
│  6. PASS?    → md3-design-verifier 無 Critical 問題   │
└───────────────────────────────────────────────────────┘
       ↓（8 個頁面全部通過）
  mvn clean package 最終建置
```

---

## 啟動指令

```bash
# Terminal 1 — 啟動 preview app（需 JDK 17）
setjdk 17 && mvn test exec:java@preview-app

# Terminal 2 — 監看 CSS 變更（自動重編）
npm run watch
```

---

## Iteration 優先順序

由「基礎元件多」→「複合元件多」排序，確保改動有最大覆蓋面：

| 順序 | 頁面 | URL | 核心元件 |
|------|------|-----|---------|
| 1 | dashboard.zul | `/usecase/dashboard` | vlayout, panel, groupbox, listbox, progressmeter, rating, slider |
| 2 | app-shell.zul | `/usecase/app-shell` | borderlayout, menubar, toolbar, tabbox, calendar |
| 3 | order-entry.zul | `/usecase/order-entry` | window, tabbox, groupbox, grid, inputgroup, combobutton, listbox |
| 4 | employee-grid.zul | `/usecase/employee-grid` | grid(group/auxhead/frozen), paging, datebox, bandbox, popup |
| 5 | user-profile.zul | `/usecase/user-profile` | anchorlayout, absolutelayout, textbox, slider, rating, captcha |
| 6 | product-browser.zul | `/usecase/product-browser` | splitter, tree, listbox, rating, popup, paging |
| 7 | report-viewer.zul | `/usecase/report-viewer` | borderlayout, toolbar, groupbox, grid(group), datebox, calendar |
| 8 | media-manager.zul | `/usecase/media-manager` | tabbox, audio, fileupload, progressmeter |

---

## 每個 Iteration 的標準步驟

### Step 1 — 截圖觀察（OBSERVE）

工具：`mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__computer`

1. 導航至 use-case 頁面
2. 全頁截圖（**before 圖**，存為 `doc/screenshots/{page}-before.png`）
3. 讀取 console 錯誤：`mcp__claude-in-chrome__read_console_messages`
4. **AI 視覺分析**截圖，識別以下問題：
   - 布局問題：元件重疊、溢出容器、異常捲動條
   - 間距問題：元件緊貼（margin/gap 為 0）、內距不足
   - 顏色問題：主色調是否企業風格、是否過於鮮豔
   - 排版問題：字型大小階層不清晰、contrast 不足
   - 元件狀態：hover/focus/active 無視覺回饋

### Step 2 — MD3 合規審查（AUDIT）

工具：`md3-design-verifier` agent

1. 提供截圖 + 對應元件 CSS 路徑
2. 指定審查重點元件
3. 輸出報告儲存至 `doc/md3-reports/{page}-v1.md`

### Step 3 — CSS 修正（FIX）

工具：`zk-theme-creator` agent

1. 提供 md3-design-verifier 報告
2. 指定需修改的 CSS 檔案
3. 說明問題與期望效果

### Step 4 — 重建 & 再截圖（VERIFY）

```bash
npm run build:css
```

1. 重新導航至頁面（強制重整）
2. 全頁截圖（**after 圖**，存為 `doc/screenshots/{page}-after.png`）
3. 視覺對比 before/after
4. 再次執行 md3-design-verifier 確認問題已解決

---

## 通過條件（Per Page）

### Must Pass（否則繼續修改）
- [ ] 截圖無布局崩潰（無元素溢出、重疊、異常捲動）
- [ ] `md3-design-verifier` 報告：**Critical(❌) 項目 = 0**
- [ ] Console 無紅色 CSS/JS 錯誤

### Should Pass（記錄但不阻塞）
- [ ] `md3-design-verifier` 報告：Warning(⚠️) 項目 ≤ 3
- [ ] 所有 color 屬性使用 `--md-sys-color-*` token（無 hardcode hex）
- [ ] Hover / Focus / Active 狀態視覺可區分

---

## 最終完成條件

- [ ] 8 個 use-case 頁面截圖全部通過視覺驗證
- [ ] 8 份 MD3 驗證報告存於 `doc/md3-reports/`
- [ ] Before/after 截圖對存於 `doc/screenshots/`
- [ ] `mvn clean package` 建置成功

---

## Agent Skills 對應

| 步驟 | 使用工具 / Skill |
|------|----------------|
| 截圖觀察 | `mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__computer` |
| Console 檢查 | `mcp__claude-in-chrome__read_console_messages` |
| DOM 結構查詢 | `mcp__claude-in-chrome__javascript_tool` |
| MD3 審查報告 | `md3-design-verifier` agent |
| CSS 實作修改 | `zk-theme-creator` agent |
| CSS 重建 | Bash: `npm run build:css` |
| ZK DOM 參考 | `/Users/hawk/Documents/workspace/ZK10/zk/zul` |

---

## 關鍵 CSS 檔案路徑

```
src/main/resources/web/css/
├── tokens/
│   └── _colors.css              ← MD3 color token 根源
├── components/
│   ├── layout/
│   │   ├── _borderlayout.css    ← app-shell, report-viewer 結構核心
│   │   └── _anchorlayout.css   ← user-profile 兩欄布局
│   ├── containers/
│   │   ├── _panel.css           ← dashboard KPI card 視覺品質關鍵
│   │   ├── _groupbox.css        ← 表單分組容器，多頁面使用
│   │   └── _window.css          ← order-entry dialog
│   ├── data/
│   │   ├── _grid.css            ← 最廣泛使用（3+ 頁面）
│   │   ├── _listbox.css         ← dashboard, order-entry, product-browser
│   │   ├── _tree.css            ← product-browser 左側導航
│   │   ├── _auxhead.css         ← employee-grid 多層表頭
│   │   └── _paging.css          ← 分頁元件
│   ├── navigation/
│   │   ├── _toolbar.css         ← 所有頁面頂部工具列
│   │   ├── _tabbox.css          ← app-shell, order-entry, media-manager
│   │   └── _menu.css            ← app-shell menubar
│   └── inputs/
│       ├── _textbox.css
│       ├── _combobox.css
│       └── _datebox.css
```

---

## 前置作業（開始 Iteration 前先完成）

### 1. 更換主色調：紫色 → 企業級鋼藍色

**原因**：現有 Purple (#6750A4) 色系對企業應用而言過於鮮豔、缺乏穩重感。

**新色調**：Corporate Steel Blue — 參考 SAP Fiori / IBM Carbon / Salesforce 等主流企業級設計系統的藍色風格，低彩度、穩重、專業。

修改檔案：`src/main/resources/web/css/tokens/_colors.css`

**Primary（鋼藍色）** 替換整個 primary palette：
```css
--md-ref-palette-primary-0:  #000000;
--md-ref-palette-primary-10: #001B45;
--md-ref-palette-primary-20: #00317A;
--md-ref-palette-primary-30: #0047B0;
--md-ref-palette-primary-40: #1A5DC8;   /* 主色：企業藍，不過分鮮豔 */
--md-ref-palette-primary-50: #4178D5;
--md-ref-palette-primary-60: #6895E2;
--md-ref-palette-primary-70: #90B2EF;
--md-ref-palette-primary-80: #BAD0F8;
--md-ref-palette-primary-90: #D8E8FF;
--md-ref-palette-primary-95: #EBF2FF;
--md-ref-palette-primary-99: #FAFCFF;
--md-ref-palette-primary-100: #FFFFFF;
```

**Secondary（藍灰色）** 替換 secondary palette（目前為紫灰色）：
```css
--md-ref-palette-secondary-0:  #000000;
--md-ref-palette-secondary-10: #171D28;
--md-ref-palette-secondary-20: #2C3340;
--md-ref-palette-secondary-30: #434A59;
--md-ref-palette-secondary-40: #5B6270;   /* 輔色：藍灰 */
--md-ref-palette-secondary-50: #747B8A;
--md-ref-palette-secondary-60: #8F96A4;
--md-ref-palette-secondary-70: #AAB1BF;
--md-ref-palette-secondary-80: #C6CCD9;
--md-ref-palette-secondary-90: #E2E7F4;
--md-ref-palette-secondary-95: #EFF3FF;
--md-ref-palette-secondary-99: #FAFCFF;
--md-ref-palette-secondary-100: #FFFFFF;
```

**Tertiary（深青色）** 替換 tertiary（目前為粉紅）：
```css
--md-ref-palette-tertiary-0:  #000000;
--md-ref-palette-tertiary-10: #002022;
--md-ref-palette-tertiary-20: #003B3E;
--md-ref-palette-tertiary-30: #00575C;
--md-ref-palette-tertiary-40: #007478;   /* 第三色：深青，企業成熟感 */
--md-ref-palette-tertiary-50: #009499;
--md-ref-palette-tertiary-60: #00B4BA;
--md-ref-palette-tertiary-70: #2DD2D8;
--md-ref-palette-tertiary-80: #80EAED;
--md-ref-palette-tertiary-90: #C4F5F6;
--md-ref-palette-tertiary-95: #E1FAFB;
--md-ref-palette-tertiary-99: #F5FFFE;
--md-ref-palette-tertiary-100: #FFFFFF;
```

neutral / neutral-variant / error palette **保持不變**。

### 2. 清除 report-viewer.zul 內嵌樣式

`src/test/resources/web/usecase/report-viewer.zul` 頂部有一段 `<style>` 區塊需完全移除：

```html
<!-- 移除這整段 -->
<style>
.report-header { background: #f5f5f5; padding: 12px; border-bottom: 2px solid #1a73e8; margin-bottom: 8px; }
.report-title { font-size: 20px; font-weight: bold; }
.report-sub { font-size: 12px; color: #666; margin-top: 4px; }
</style>
```

原則：**use-case ZUL 頁面不應包含任何 `<style>` 區塊**，所有樣式由主題 CSS 負責。

---

## 已知系統性問題：元件間距（Spacing）

### 問題描述

元件預設擺放時彼此之間沒有間距，全部緊貼在一起。ZK Framework 預設 margin=0，layout 元件預設不給子元件間距。

### 解決策略

在 Iteration 過程中，當截圖發現元件擠在一起時，在對應 CSS 修正步驟中一併處理：

1. **Layout 容器**（vlayout、hlayout、hbox、vbox）：設定 `gap`
   - 預設：`var(--md-sys-spacing-3)` (12px)
   - 緊湊：`var(--md-sys-spacing-2)` (8px)
2. **容器元件內部**（groupbox、panel、window）：設定 `padding: var(--md-sys-spacing-4)` (16px)
3. **行內元件**（toolbar 內 button、label）：設定 `margin-inline: var(--md-sys-spacing-1)` (4px)

相關 CSS 檔案：`_box.css`、`_layout.css`、`_groupbox.css`、`_panel.css`

---

## 注意事項

1. **截圖是硬性要求**：每個 iteration 必須有 before/after 截圖，由 AI 自動分析，作為視覺驗證證據
2. **瀏覽器重整**：`npm run watch` 自動重編 CSS 後，需重新導航頁面才能看到最新效果
3. **ZUL 頁面不得有 inline style**：若發現其他 ZUL 有 `<style>` 區塊，一律在前置作業中清除