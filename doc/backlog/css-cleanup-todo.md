# CSS Cleanup — 逐項執行清單

> 來源:2026-06-15 的一次性 CSS hygiene 審計「待核可後續工項」(該報告已結案並移除;審計方法見 `marble-theme` skill 的 `reference/css-audit.md`)。
> 節奏:**一次一項**;動工前先給舉例 → 你核可 → 實作 → 驗證 → 各自獨立 commit。
> 排序原則:**先低風險、可機械驗證,後需視覺回歸的重構**(非報告字母序)。

## 進度

- [x] **D3 多餘 longhand/shorthand** — 已完成(commit `433c897`,value-preserving)
- [x] **B4 重複 box-shadow 抽 token** — 已完成(commit `2e8a8cb`,value-preserving;抽 `--zk-elevation-resting`,button|panel 截圖全綠)
- [x] **B1(上半)button.css 色盤 tokenise** — 已完成:
  - error/info 等值替換(commit `467cf1f`,value-preserving)
  - success 補 `--zk-color-success` main token + button 引用(commit `7860c31`,value-preserving)
  - warning 收斂:`--zk-color-warning` 改 MUI main `#ed6c02`、button 引用、status-warning 留 light(commit `59c2d34`;button value-preserving,messagebox/badge `#f57c00→#ed6c02` 微調已同意)
  - 順手:重抓過時 button gallery 基準(缺 COLORS 區,commit `11ca362`)
  - **未動(無 token、button 專屬)**:light/dark 中性色(`#f5f5f5`/`#333`/`#e0e0e0`/`#212121`/`#fff`/`#000`)、`::before` 白/黑 overlay、elevated `box-shadow` 字面值
- [x] **B1(下半 Group A)notification 內容 tint hex tokenise** — 已完成(commit `f09da44`,value-preserving;3 行 color-mix 內 hex→token)
  - [x] **Group B** notification arrow-border `rgba()`→`color-mix(... transparent)`(commit `8147a1b`,value-preserving;headless Chromium 實測 computed 相等,僅序列化格式差)。**notification.css 現零硬編碼色**
  - **Group C 覆蓋已補**(commit `1898418`):toast gallery 截圖 + toast base computed(`rgba(50,50,50,0.95)`)+ tooltip `.z-popup-tooltip` computed(`rgba(97,97,97,0.92)`)。發現:plain `tooltip=` 出白底 popup;`.z-tooltip`(misc.css)無 ZUL 引用=不可達。
- [x] **Group C 結案**(深色 scrim/tooltip 調查 → 多為死碼):
    - toast `rgba(50,50,50,0.95)` base:查 `Toast.java:95` Java API 一律把 null type 補成 "info" → typeless base 經 server API 不可達 = **死樣式**,已刪兩行(commit `3c0e97f`)。toast.css 零硬編碼色。
    - `.z-tooltip`(misc.css):全專案無引用、ZK runtime 不發此 class = **死碼**,整條規則已刪(commit `8982ef4`)。
    - `.z-popup-tooltip`(popup.css)`rgba(97,97,97,0.92)`+`#fff`:唯一存活的深色 tooltip,死碼刪除後變**單一使用** → 依「不為單一消費者發明 token」原則**留字面值**,已由 tooltip computed 測試守值。
    - **新增覆蓋**(commit `1898418`):toast gallery 截圖 + toast base computed + tooltip computed,補掉 popup 類已知缺口。
- [x] **A2 + A3a 孤兒 token 清理** — 已刪 **12 個**(tertiary×4、elevation alias×3、shape-chip、typescale-default×3、`--zk-motion-transition-standard`);修 `components.zul` 移除 preview-ZUL 依賴;移除 `DESIGN.md:131` preset 文件行。**尚未 commit**。
- [x] **A2 + A3a 孤兒 token 清理** — 已 commit(`26f1d35` 刪 12 個 orphan token)
- [x] (tooling) stylelint 設定 + 報告 — 已 commit(`be71bbe`)
- [x] **B2 base 控制高度 tokenise** — 已完成(commit `35f734e`,value-preserving)。新增 `tokens/_sizing.css` → `--zk-control-height: 40px`,串入 build normFiles;22 處 control-row `min-height: 40px`(15 檔:inputs/select/menu/toolbar/checkbox/inputgroup)→ `var(--zk-control-height)`。**刻意保留字面值**:button 圖示/FAB 方形尺寸、calendar 日格/表頭(概念不同,不與 control-height 耦合)。命名:不用 `touch-target`(40px < MD3 44/48 最小觸控,且 tablet 層已占用該名);21 個受影響元件截圖全綠。

## 建議執行順序

### 🟢 第 1 群:零視覺變動 / 可機械驗證(先做,建立信心)

1. **A2 + A3a — 孤兒 token 清理**
   - 內容:刪除 0 引用且非系統化 scale 的 token(tertiary 整組、inverse-primary、elevation alias、`--zk-typescale-default-*`、`medium1` 等)。
   - 風險:**極低**(純刪除未引用項)。唯一風險=對外主題 API,需確認沒有外部覆寫依賴。
   - 驗證:`npm run build:css` + `npm run lint:css` + grep 確認 0 引用;視覺無變化。
   - 我的建議:**從這項開始**。warm-up,且能把報告中最大宗的「Medium」清掉。

2. **B4 — 重複 box-shadow 抽 token**
   - 內容:button.css:12 與 panel.css:15 的相同 shadow 字串 → 抽 `--zk-elevation-resting`(或類似),兩處共用。
   - 風險:**零**(等值抽取,computed 不變)。
   - 驗證:build + 比對 shadow 值字串一致。

### 🟡 第 2 群:需設計決策 / 輕度視覺檢查

3. **B1(上半)— button.css 色盤 tokenise**
   - 先做等值替換:`error`→`var(--zk-color-error)`、`info`→`var(--zk-color-status-info)`(零變動);
   - 再決定 `success`/`warning`/`light`/`dark` 是否新增 token(可能改像素,需截圖確認)。
   - 風險:等值部分=零;新增 token 部分=低(若沿用現值則零)。
   - 驗證:button.zul 截圖比對。

4. **B1(下半)— tooltip / toast / overlay / notification 色 tokenise**
   - 內容:`rgba(...)` 裸值 → `color-mix(... var(--zk-color-*) X%, transparent)` 等。
   - 風險:低-中(color-mix 需確認等值)。
   - 驗證:對應頁面截圖比對。

5. **B2 — base 觸控尺寸 tokenise**
   - 內容:散落的 `min-height: 40px` 等 → 新增 base 觸控 token(tablet 層已有 44/48px 可參照)。
   - 風險:低(token 值=40px 則零變動,純 plumbing)。
   - 驗證:build + 抽查元件高度不變。

### 🟠 第 3 群:結構性重構(最後做,需逐元件視覺回歸)

6. - [x] **C1 / C2** — 評估後改為「抽 token」(非抽 class)。詳見 [css-c1-c2-assessment.md](css-c1-c2-assessment.md)。
   - **架構發現**:抽共用 class 在 ZK 主題不可行(純 CSS 無法把 marker class 注入 widget-emitted DOM;規則分散於不同 `*.css.dsp` bundle 無法合併)。唯一可行 DRY = 把重複「值」抽 token。
   - **C1**(commit `05b9806`,value-preserving):`--zk-state-layer-transition`(_motion.css)取代 22 處 overlay `::before` 的 `transition: opacity short3 standard`(19 檔)。保留:checkbox/radio short2、grid/listbox 複合 button-reveal。
   - **C2**(commit `286b462`,value-preserving):`--zk-focus-ring: 2px solid primary`(_colors.css)取代 16 處標準 ring(14 檔);offset 仍 per-component(grid/tree/listbox inset 變體共用同 ring)。保留:`.z-focus-ring` 3px、`outline-color` override、文字框/select/slider 的 border/box-shadow focus。
   - 驗證:受影響元件 Playwright 截圖全綠(checkbox focus 等)。唯一失敗 = button gallery,經 stash 隔離證實為**既有過時基準**(button.zul 平行 WIP 變高 88px),與 C1/C2 無關,未動該基準。

## ✅ Cleanup 全數結案

D3 / B4 / B1(button 色盤 + notification + toast/tooltip 死碼)/ A2+A3a 孤兒 token / stylelint 工具 / B2 控制高度 / C1 / C2 皆已完成並各自 commit。剩餘審計報告中的 D14(selector 合併)、F(死碼)屬未排程之未來工項。

**待辦旁支**:button-gallery 截圖基準已過時(button.zul 受平行 WIP 影響長高),需另行確認該 .zul 變更是否為刻意設計後再更新基準 — 不屬本 cleanup。

## 每項的固定流程
1. 我先給該項的具體**舉例**(現況片段 + 改後片段 + 是否 value-preserving)。
2. 你核可範圍。
3. 實作 → `npm run build:css` + `npm run lint:css`(必要時截圖)。
4. 獨立 commit,訊息註明是否 value-preserving。
5. 回此清單勾選。
