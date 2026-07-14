# 給 ZK Framework 維護者的「主題可製化」建議

> 來源：從零打造 Marble（Material Design）主題的全程經驗。
> 證據來自本專案累積的知識庫：`.claude/skills/zk-component-rules/`、`doc/contracts/`、`doc/spec/`、`doc/skill-gaps.md`、以及 `MarbleThemeProvider.java` / `scripts/build-css.js` 等實作。
> 對象：ZK Framework 元件與主題機制的設計維護者。
> 目的：讓「未來做一個全新元件外觀」更容易、成本更低、更好客製化。

---

## 一句話總結

目前做一個 ZK 主題，本質上是**「整檔替換 stock CSS」＋「靠逆向工程才能知道 DOM/class/state 長怎樣」**。
這逼著主題作者必須先變成 ZK 內部專家，重抄幾乎所有結構性 CSS，再踩一輪「靜默失效」的雷（檔案被悄悄丟棄、layout 無聲崩掉、class 猜錯）。

最高槓桿的三個改動：

1. **把「結構 CSS」與「外觀 CSS」分層** — 主題只供「皮」，框架永遠負責「骨架」。
2. **為每個元件提供有文件的 CSS 變數主題 API** — 讓客製化 = 改變數，而不是重寫整份 CSS。
3. **框架自己擁有 contract classes（JS-toggled / core-emitted）並附預設樣式** — 消除「漏定義 → layout 無聲崩掉」。

做到這三點，後面所有摩擦點大多自動消失。

---

## 根本問題：主題作者被迫成為「ZK 內部專家」

從 Marble 的經驗看，主題作者真正花掉的時間，**幾乎都不在「決定它該長怎樣」**（那才是主題該做的事），而在：

- 搞清楚 ZK 實際 render 出什麼 DOM、什麼 class、什麼 state class
- 重抄 stock CSS 裡所有「跟外觀無關但元件 JS 賴以運作」的結構規則
- 反覆踩那些沒有錯誤訊息的靜默失效

這份知識在本專案最後被沉澱成一整個 `zk-component-rules` skill（30+ 個元件檔 + 18 份 cross-cutting reference）。
**這個 skill 的存在本身，就是 ZK 主題機制可製化不足最有力的證據** — 它記錄的全是「框架沒告訴你、但你不知道就會出錯」的事。

下面把摩擦點轉成「框架該怎麼改」的建議，依槓桿排序。

---

## P0 — 架構性改動（一次解決一大片）

### 1. 結構層 / 外觀層分離（最高槓桿）

**現況摩擦**
ZK 的主題覆蓋是**「替換」而非「合併」**：主題在某元件的 `<css-uri>` 路徑提供 CSS，ZK 就**只送主題版、完全不載 stock 版**（證據：`reference/theme-override-is-replace.md`）。
後果是主題若只想換顏色，卻會連帶弄丟所有定位/排版/方向規則 → 元件無聲崩掉。Marble 因此被迫**逐一重抄每個元件的全部結構規則**，rangeslider / multislider / colorbox 幾乎是整個重寫。
同類災情：vertical 方向規則漏抄（`skill-gaps` 2026-05-14 rangeslider vertical track）、popup 少寫 `position:absolute` 就掉到頁面左下角（`reference/floating-popup-in-body.md`）。

**建議框架改動**
把每個元件的 CSS 切成兩疊（用 CSS `@layer` 最自然）：

```
@layer zk.structure {  /* 框架擁有，永遠載入，主題不可整檔替換 */
  .z-combobox { display:inline-flex; position:relative; ... }   /* 幾何、定位、方向 */
}
@layer zk.skin {       /* 主題擁有，這層才是主題要寫的 */
  .z-combobox { background:...; border-color:...; }             /* 顏色、字級、圓角、陰影 */
}
```

主題只覆蓋 `zk.skin`，`zk.structure` 由框架保證存在。
這一刀同時解掉：override=replace 重抄、popup position 漏寫、方向規則漏抄、`!important` 大戰。

**收益**：主題作者不再需要懂元件 JS 賴以運作的幾何，新主題的 CSS 量與出錯面**大幅下降**。

---

### 2. 每個元件一套「有文件的 CSS 變數主題 API」（最高「可客製化」槓桿）

**現況摩擦**
今天要改一個元件外觀，沒有官方的變數介面，只能去逆向 stock CSS、量 padding、抄 selector。
Marble 自己定義了一整套 `--zk-*` token，但那是**主題私有**的，下一個主題作者得從零再建一次。
焦點環、popup 尺寸、密度、方向…全都是靠手調 px（`skill-gaps` 大量 tooltip/`top:-36px` 之類的硬調紀錄）。

**建議框架改動**
框架為每個元件公布一組**官方命名、有文件**的 CSS 變數，並在 stock 結構 CSS 內消費它們：

```css
.z-combobox {
  background: var(--zk-combobox-bg, Field);
  border: var(--zk-combobox-border-width, 1px) solid var(--zk-combobox-border-color, ...);
  border-radius: var(--zk-combobox-radius, 0);
  min-height: var(--zk-combobox-height, ...);
}
```

如此一來，「客製化一個元件」= 在 `:root` 覆蓋幾個變數，**不必碰 selector、不必重寫 CSS**。
配合 #1，主題的最小型態可以只是「一份變數覆蓋表」。企業客戶要做 corporate skin 的成本會從「寫一個主題」降到「填一張色票」。

**收益**：這是把 ZK 從「換主題要工程」變成「換主題像填表」的關鍵。本專案的 `--zk-*` 命名與 `doc/spec/` token 文件可直接當框架化的起點。

---

### 3. Framework contract classes 由框架擁有 + 附預設樣式 + 機器可讀 registry

**現況摩擦**
ZK 的 JS 會在 runtime 自己 toggle 一批 class：`.z-flex` 家族、drag/drop（`.z-drag-ghost`/`.z-drop-allow`/`.z-drop-disallow`…）、`.z-renderdefer`、`.z-loading`、`.z-modal-mask`、`.z-error` 等。

- 主題**漏定義或改名**這些 class → JS 照樣 `addClass`，但 CSS 不 match → **layout 無聲崩掉，沒有任何錯誤**（`reference/framework-classes.md`、`reference/css-flex-classes.md`）。
- 其中 drag-ghost 等 class **stock CSS 根本沒給任何樣式**，漏寫就整個拖曳殘影看不見（`skill-gaps` 2026-06-23）。
- core-emitted 的 class（`.z-loading`/`.z-error`/`.z-modal-mask`）不屬於任何單一元件檔，主題若用「逐元件寫 CSS」的心智模型就會整批漏掉。
- `.z-modal-mask` 因為 inline style 在 `inset:0` 後又多寫了 `top:0;left:0`，主題覆蓋被迫用 `!important`。

Marble 為此被迫：寫一份 16 個 contract class 的規格、做一支 CI checker（`tools/check-framework-classes.mjs`）、並維護機器可讀的 `framework-classes.json`。**這整套東西本該是框架提供的。**

**建議框架改動**
- 把這些 contract class 的**結構樣式放進框架擁有的 base layer**（見 #1），主題就不可能漏掉。
- 對 drag-ghost / drop-icon 這類「純 hook」**附一份可被覆蓋的預設外觀**，而不是丟空殼給主題。
- 官方**公布機器可讀的 contract-class registry**（本專案的 `framework-classes.json` 可直接捐出來當藍本），並附一支 CI 可跑的 presence checker。
- 清掉 `.z-modal-mask` 多餘的 inline `top/left`，讓主題不必 `!important`。

**收益**：消除整類「沒有錯誤訊息的 layout 崩潰」，這是新手主題作者最難 debug 的一種。

---

## P1 — 一致性（把「每個元件都要重學一次」變成「學一次」）

### 4. 統一 state model：一律用 root 上的 data-attribute

**現況摩擦**
disabled / readonly / invalid 的表示法**每個元件不一樣**（`reference/state-classes.md`）：有的是 root 加 class、有的看 mold（checkbox/switch/toggle 各自不同前綴）、combo 家族又是 `-input`/`-button` 拆邊。
主題作者沒辦法寫一套通用 selector，得**逐元件學它的 state 慣例**。

**建議框架改動**
所有元件的狀態**統一表現在 root 的 data-attribute**：`data-disabled`、`data-readonly`、`data-invalid`、`data-checked`。
主題就能寫一條通則 `[data-invalid]{ ... }` 套全元件，而不是 N 種 `.z-xxx-invalid`。

**收益**：state 樣式從「N 個元件 × N 種寫法」降到「一套規則」。

---

### 5. Build pipeline：大聲失敗，別靜默丟檔；公布 bundle manifest

**現況摩擦**（全是「沒錯誤訊息」的雷）
- `.css.dsp` 其實**不會跑 DSP 處理**，但只要 CSS 裡出現 `${...}` 或 `<%@ %>`，WCS bundler 會嘗試處理、失敗、回傳空字串，然後**把整個檔案悄悄從 bundle 丟掉**。colorbox 就這樣從 73 條規則變成 0 條，沒有 404、沒有 build error（`reference/css-dsp-pipeline.md`、`skill-gaps` 2026-05-14）。
- 多個元件編進**共用 bundle 但各自有獨立 source 檔**（combo.css.dsp 涵蓋 6 個 input），所以「對所有兄弟生效」的規則得**抄到 6 個檔**（`reference/css-file-bundling.md`）。
- 命名陷阱：`toolbarbutton` 的 CSS 在 `footer.css.dsp`、`splitter` 併進 `box.css.dsp`、有些 `.css.dsp` 根本沒在 `lang-addon.xml` 註冊（永遠不會被送）。

**建議框架改動**
- bundler 遇到「處理後變空」**直接 build fail 或印 warning**，絕不靜默丟檔。
- 提供**不需 DSP 的資產 URL 機制**（或乾脆真的跑 DSP），讓主題能正常引用圖片/字型。
- 公布一份**機器可讀的 manifest**：component → source file → 輸出 bundle → 是否註冊。build 時據此驗證註冊完整性，並當作主題作者的地圖。

**收益**：把「debug 半天才發現整個檔被吃掉」變成「build 當下就報錯」。

---

### 6. DOM / class 命名：穩定、可預測、版本化文件

**現況摩擦**
ZK 的 `.z-{元件}-{部位}` 命名**系統性地會破例**：`.z-panelchildren`（不是 `-content`）、`.z-row-content`（在 row 不在 cell）、`.z-rating-icon`（不是 `-star`）、`.z-progressmeter-image`（不是 `-bar`）、`.z-paging-previous`（不是 `-prev`）…猜 class 有 10~15% 會猜錯（`reference/class-name-quirks.md`）。
而且 ZK 10 改了部分 mold/DOM，舊版 ZKDoc 的範例跟實際 render 不符（`doc/zk-source-reference.md`）→ 只能讀 source 或開 DevTools。
另外 grid/listbox/tree 的斑馬條紋**不能用 `:nth-child()`**（virtual scroll 會重排），必須用 `.z-*-odd` class — 這違反一般 CSS 直覺，不知道就會中招。

**建議框架改動**
- 每個 release **自動從 source 產生一份「DOM / class 契約」文件**（含每個部位的 class、state class、斑馬條紋用 `-odd` 而非 nth-child 之類的注意事項）並版本化。
- 長期可考慮收斂命名破例；至少把破例集中列冊。

**收益**：主題作者寫 selector 前不必開 DevTools 逐一驗證，velocity 直接拉高。

---

## P2 — 把現代主題的「該有功能」變成框架一等公民

### 7. 響應式 / 密度（density）內建，而不是另做一個主題

**現況摩擦**
- 平板模式得**另外註冊一個 `tablet:` 前綴的主題**、放一套獨立 CSS，等於「一個 JAR 裡做兩個主題」（`MarbleThemeWebAppInit.java`、`reference/tablet-theme-mechanism`）。datebox/timebox 在 touch UA 還會換成完全不同 DOM 的 wheel picker，沒有任何 stock 樣式（`reference/mobile-wheel-picker.md`）。
- compact / data-dense 模式 ZK **完全沒有內建**，Marble 自建了一整套 `data-density` 屬性 + 控制高度階梯 + 語意 alias 層（`doc/spec/data-dense-mode.md`）。每個元件都得手動調，沒有「整體 ×0.8」的捷徑。

**建議框架改動**
- 響應式做成**同一主題內的 layer / media-query**，不是第二個主題；wheel-picker 等 touch-only DOM 由框架附預設可覆蓋樣式。
- 把 **density 做成框架級 token 契約**（例如統一的 `data-density` + 一組高度/間距變數），主題只要提供變數值就免費得到 compact 模式。

**收益**：響應式與密度從「每個主題重做一次的大工程」變成「填變數」。

---

### 8. 焦點環 / popup 定位等「幾何問題」由框架負責

**現況摩擦**
- 焦點環不能用「1px→2px border」（會把 box 撐大造成 layout 抖動）；composite input 要用 inset box-shadow、單一 input 要 border+padding 補償、放進 inputgroup 又要第三種寫法（`reference/focus-affordance-no-layout-shift.md`、`skill-gaps` 2026-06-25）。一個「加焦點框」的小需求變成三層分析。
- 浮動 popup 被 detach 到 `<body>`，ZK 設了 inline `left/top` **卻不設 `position`**，主題不補 `position:absolute` 就失效；百分比寬度又會以 viewport 為基準（`reference/floating-popup-in-body.md`）。
- JS 定位的 tooltip/marks 偏移量得**逐方向手調 px**。

**建議框架改動**
- 提供**標準焦點環機制**（例如統一用 `box-shadow` ring + 一個 `--zk-focus-ring` 變數），讓主題不必自己處理盒模型細節。
- popup detach 後**由 JS 一併設 `position:absolute`**（它本來就在設 left/top），主題不必補。
- JS 定位元素由 JS 直接寫座標，不要靠主題猜偏移。

**收益**：把最容易出 1~5px bug、最耗時手調的部分收回框架。

---

### 9. 不支援的屬性不要暴露；component-forced state 要有 metadata

**現況摩擦**
- `timepicker` 在 ZUL 可寫 `buttonVisible="false"`，但 server 端 `Timepicker.java` 根本**沒有 setter** → 丟 HTTP 500；主題若為這 state 寫了 CSS，全是死碼（`components/timepicker.md`、`reference/zul_render_smoke`）。
- `timepicker` 建構子強制 `setReadonly(true)`，所以它**永遠是 readonly**、input 永遠帶不透明底 → 焦點環得特例改畫在 `::after`。這從 ZUL API 完全看不出來，主題作者寫了通則才發現它破例。

**建議框架改動**
- 元件**不要對外暴露自己沒實作的繼承屬性**；用不支援的屬性時給明確 warning 而非 500。
- 「強制狀態」（如 timepicker 恆 readonly）寫進**機器可讀的元件 metadata**，讓主題與工具能事先得知。

**收益**：消除死碼與「寫了才知道不支援」的試誤成本。

### 10. 全域 reset 與 ZK 的 `<a>` widget 衝突 + 主題 library property 要有文件

**現況摩擦**
ZK 用 `<a>` render 一堆控制項（menuitem/toolbarbutton/tab/listitem/treerow/`.z-a`），所以一條 `a:hover{text-decoration:underline}` 的常規 reset 會破壞數十個元件（`skill-gaps` 2026-05-14）。Marble 被迫用 `a[href]:not([class*="z-"])` 過濾。
另外 reset 在 JS-Embed host page 的 scoping 靠 `org.zkoss.zul.theme.browserDefault` 這個 library property，但它**沒有對主題作者公開的文件**，且舊作法依賴 DSP 條件式（Marble 的 build 不跑 DSP，得自己拆成兩份 reset）（`doc/spec/reset-scoping.md`）。

**建議框架改動**
- ZK widget 的 `<a>` 應可被安全地排除於 UA anchor 樣式（已都帶 `z-*` class，可在 base layer 內統一 reset），並文件化「安全的 reset 寫法」。
- **公布主題相關的 library property 清單與用途**，並提供非 DSP 的設定途徑。

---

## 快速見效清單（low effort, high value）

不需大改架構、可先做的：

| # | 行動 | 對應摩擦 |
|---|------|----------|
| Q1 | bundler「處理後變空」改成 build fail / warning，別靜默丟檔 | #5 |
| Q2 | 公布機器可讀的 component→source→bundle→registration manifest | #5 #6 |
| Q3 | 每個 release 自動產生並版本化 DOM/class 契約文件 | #6 |
| Q4 | 採用本專案的 `framework-classes.json` + checker 當官方 contract registry | #3 |
| Q5 | 清掉 `.z-modal-mask` 多餘的 inline `top/left`（免去主題 `!important`） | #3 |
| Q6 | drag-ghost / drop-icon 等純 hook class 附一份可覆蓋的預設樣式 | #3 |
| Q7 | popup detach 後由 JS 一併設 `position:absolute` | #8 |
| Q8 | 元件不暴露自己沒 setter 的屬性；用到時給 warning 而非 500 | #9 |

---

## 優先順序總表

| 優先 | 建議 | 一句話收益 | 改動幅度 |
|------|------|------------|----------|
| **P0** | #1 結構層/外觀層分離（`@layer`） | 主題只供皮，不再重抄骨架、不再無聲崩 | 大（最高槓桿） |
| **P0** | #2 元件級 CSS 變數主題 API | 客製化從「寫主題」降到「填變數」 | 大（最高「可客製」槓桿） |
| **P0** | #3 框架擁有 contract classes + registry + 預設 | 消除整類無錯誤訊息的 layout 崩潰 | 中 |
| **P1** | #4 統一 state model（data-attribute） | state 樣式從 N 種寫法變一套 | 中 |
| **P1** | #5 build 大聲失敗 + bundle manifest | 靜默丟檔變即時報錯 | 小～中 |
| **P1** | #6 版本化 DOM/class 契約文件 | 不必開 DevTools 逐一驗 selector | 小（可自動產生） |
| **P2** | #7 響應式/密度內建為 layer | 響應式/compact 從大工程變填變數 | 中～大 |
| **P2** | #8 焦點環/popup 幾何收回框架 | 消除最耗時的 px 手調 bug | 中 |
| **P2** | #9 不暴露無 setter 屬性 + state metadata | 消除死碼與試誤 | 小 |
| **P2** | #10 reset 與 `<a>` widget 共存 + property 文件 | 全域 reset 不再誤傷元件 | 小 |

---

## 結語：可製化的北極星

把這份建議濃縮成一個檢驗標準，給 ZK 維護者一個「北極星」：

> **一個新主題的最小型態，應該可以只是「一份 CSS 變數覆蓋表」 —— 不必碰任何 selector、不必懂任何元件的 DOM 或 JS、也不可能讓 layout 無聲崩掉。**

今天離這個目標的距離，恰好等於 `zk-component-rules` skill 的厚度。
每把一條知識從「主題作者必須自己摸索」搬進「框架保證或自動產生」，那本 skill 就薄一頁，而下一個主題的成本就低一截。
