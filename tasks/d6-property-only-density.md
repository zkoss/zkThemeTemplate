# D6 —— 規格收斂:density 只支援設定值切換(桌面 + 平板)

> 2026-08-17 user 裁示,記為 **C25**。承接 [C24](../doc/iceblue-drop-less-plan-appendix.md#l3-g-change-log--規範層的斷言變更)
> (平板層只認 library-property),把同一條規格套到桌面層。
> 這一階**縮小**已完工的 D1–D3,不是新增功能。

---

## L1 執行摘要

### 裁示

**`org.zkoss.zul.theme.density` 是切換 density 的唯一方式,桌面與平板皆然。**
執行期動態切換(`IceblueDensity.apply()`)**不在本版規格內**,未來再考慮。
理由:**前一版兩層都沒有動態切換** —— `@themeProfile` 時代切 compact 要改 LESS 變數、重編 jar、換 jar。
本版用一個 library-property 取代第二個出貨 jar,**能力相當、成本大降**。

### 為什麼連 CSS 的屬性掛勾也要拿掉,不是只刪 Java API

**只刪 API、留著 `[data-density="compact"]` 選擇器,會留下一條通往 S36 分裂主題的活路。**

D4 之後平板層只認 property。若桌面層還留著屬性掛勾,任何人(自己寫 JS、自己在樣板塞屬性)
一旦設了那個屬性,在行動裝置上就會得到**桌面 compact + 平板 default** ——
那正是 S36、也正是 D4 被設立來消滅的東西。**留半套 = 留一個已知的錯誤狀態。**

⇒ 桌面層改成與平板層**完全同一個機制**:整段包在 `<c:if>` 裡,由伺服器二選一。

### 兩個要先講清楚的代價

1. **預覽程式側邊欄的即時 density 切換會失效。** 設計審查要看 compact 得改用
   `-Dorg.zkoss.zul.theme.density=compact` 重啟 —— 這與客戶的真實作法一致,但少了即時對照。
2. **D3(已完工並驗證過的 Java API)整個刪除**,連同它的 Playwright 執行期測試。
   git 留著,未來要恢復是把 CSS 與 API 一起加回來。

### 效益

| | 現況 | D6 之後 |
|---|---|---|
| 切換方式 | property + 屬性 + Java API(3 條路) | **property(1 條路)** |
| 桌面 / 平板機制 | 兩套不同的 | **同一套** |
| 預設模式下多送的 CSS | 14498 B(gzip 後 2403 B)恆送 | **0** —— 只有 compact 時才輸出 |
| 通往 S36 的活路 | 有(屬性掛勾) | **無** |

---

## L2 執行步驟

| # | 動作 | 驗證 |
|---|---|---|
| 1 | `gen-density-css.js`:`SELECTOR` 由 `.ZKDENSITY [data-density="compact"]` 改為 `:root`,整段包進 D4 已有的 `/*!ZKDENSITY-COMPACT-START/END*/` | `npm run gen:density-css` 後 `check:density-css` 綠 |
| 2 | 重新產生 `tokens/_density-compact.css` | 350 條宣告不變 |
| 3 | `build-css.js`:移除已無人使用的 `.ZKDENSITY ` placeholder | `check:build-css` 綠 |
| 4 | `density-delta.js`:形狀斷言(350 / 1 區塊 / 1 檔)應原封不動成立,只改敘述 | `check:bytes` `UNEXPLAINED: 0` |
| 5 | `check-density-property.js`:三態判準從「選擇器有沒有 `:root,` 前綴」改為「**區塊在不在**」 | 三態實測綠 + 負向控制 |
| 6 | 刪 `IceblueDensity.java`、`check-density-runtime.js`、對應 npm script | `mvn compile` 綠 |
| 7 | 預覽程式移除側邊欄的 density 開關(`usecase/index.zul`、`UseCaseVM.java`、`usecase.css`) | 預覽程式啟得起來 |
| 8 | `readme.md` 的 density 段落改寫 | `check:doc-refs` 綠 |
| 9 | 文件:C25、L-4 的 D3 標為不出貨、D5 範圍調整、計畫/進度列 | — |

## L3 驗收

| 項 | 判準 |
|---|---|
| `check:gate` / `check:bytes` / `check:build-css` / `check:doc-refs` | exit 0,`UNEXPLAINED: 0` |
| `check:density-css` | exit 0(350 條未變) |
| `check:density-property` | 三態:未設 → **沒有** compact 區塊;`compact` → 有,且鍵在 `:root`;`foo` → 同「未設」 |
| `check:tablet-density` | 不受影響,仍 895=895 / 869=869 |
| **D1/D2 delta 形狀** | 仍是 1 檔 / 0 移除 / 350 新增 —— **這一階不改變 delta 的大小,只改變它的選擇器與條件** |
| 全樹 `data-density` | 只剩文件與紀錄,來源檔零出現 |
