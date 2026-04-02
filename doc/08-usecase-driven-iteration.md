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
│  3. DESIGN   → frontend-design 分析版面、提供設計方向 │
│  4. FIX      → zk-theme-creator 修改對應元件 CSS      │
│  5. REBUILD  → npm run build:css                      │
│  6. VERIFY   → 再次截圖，對比 before/after            │
│  7. PASS?    → md3-design-verifier 無 Critical 問題   │
└───────────────────────────────────────────────────────┘
       ↓（8 個頁面全部通過）
  mvn clean package 最終建置
```

---

## 啟動指令

```bash
# 啟動 preview app（需 JDK 17），同時自動監看 CSS 變更
setjdk 17 && mvn test exec:java@preview-app
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

### Step 3 — 設計方向分析（DESIGN）

工具：`frontend-design` skill

1. 提供 before 截圖 + md3-design-verifier 報告
2. 請 frontend-design 分析：
   - 整體版面結構是否符合 MD3 視覺層次
   - 間距、色彩、排版的具體改善方向
   - 各元件的設計優先順序建議
3. 輸出設計建議，作為 zk-theme-creator 的實作依據

> **觸發條件**：當 md3-design-verifier 報告有 2 個以上 Critical 問題，或版面需要整體重構時使用。  
> 單一元件的小修正（1 個 Critical 以下）可直接跳至 Step 4。

### Step 4 — CSS 修正（FIX）

工具：`zk-theme-creator` agent

1. 提供 md3-design-verifier 報告 + frontend-design 設計建議（若有）
2. 判斷每個問題的修正類型，再指定對應的 CSS 檔案：
   - **Theme 修正**：問題根因在元件樣式本身 → 修改 `src/main/resources/web/zul/css/` 下的對應元件 CSS
   - **Application 修正**：問題是 use-case 頁面特有的版面或內容需求 → 修改 `src/test/resources/web/usecase/usecase.css` 或對應 ZUL
3. 說明問題與期望效果
4. 修正完成後，更新 `doc/md3-reports/{page}-v1.md` 的 Remediation Log，標記每個 finding 的最終狀態（含修正類型）

### Step 5 — 再截圖驗證（VERIFY）

1. 重新導航至頁面（強制重整）
2. 全頁截圖（**after 圖**，存為 `doc/screenshots/{page}-after.png`）
3. 視覺對比 before/after
4. 再次執行 md3-design-verifier 確認問題已解決
5. 若有使用 frontend-design 建議，對照確認設計方向已落實

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
| 設計方向分析 | `frontend-design` skill（複雜版面或多個 Critical 問題時啟用） |
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

## 注意事項

1. **截圖是硬性要求**：每個 iteration 必須有 before/after 截圖，由 AI 自動分析，作為視覺驗證證據
2. **瀏覽器重整**：`npm run watch` 自動重編 CSS 後，需重新導航頁面才能看到最新效果
3. **ZUL 頁面不得有 inline style**：若發現其他 ZUL 有 `<style>` 區塊，一律在前置作業中清除
4. **每次修正後必須更新報告**：每完成一輪修正，必須在 `doc/md3-reports/{page}-v1.md` 的 Remediation Log 補記當次所有處理項目，要求：
   - 每個 finding 都必須標記最終狀態：`✅ Fixed` / `⚠️ ZK Constraint` / `📋 Design Decision` / `📋 Accepted`
   - 包含具體修改內容（檔案名 + 修改描述）
   - 若原本標記為 ❌ 或 ⚠️ 但實際已存在或已解決，應標記為 `✅ Already present` 並說明
   - 報告底部需更新 **Post-Fix Status**，明確列出剩餘 ❌ 和 ⚠️ 數量
   - 無法修正的項目必須在報告中說明原因（ZK 框架限制 / 設計決策），不得靜默忽略