# 計畫:把 Pop-up 納入視覺 A/B harness

> 起因:使用者問「先前的視覺 A/B 有沒有測到 Pop-up?」
> 答案是 **完全沒有**。本文件是補上這塊的計畫書與驗證條件。

## 0. 現況查核結果(已證實)

`src/test/playwright/ab-capture.spec.ts` 對每一頁只做三件事:

```
page.goto(`/${name}.zul`) → 一連串等待(zk.loading / images / fonts / 子 frame) → shootStable()
```

**全程沒有任何一次 click / hover / focus / 鍵盤輸入**,也沒有呼叫任何 widget 的 JS API。
所以任何「需要互動才會出現在 DOM 裡」的東西,harness 從第一天就照不到。
`doc/visual-ab-harness.md` §5.1 第 7 輪自己也寫了這件事:

> `.z-button:hover{box-shadow:…}` → 0/116(**預期內**,截圖不觸發 hover)

Pop-up 是同一個盲點的更大一塊 —— hover 至少還是既有元素換樣式,
**pop-up 面板在關閉時根本不存在於 DOM**,連「被壓成 0 高度」都談不上。

## 1. 盲點有多大:以主題 CSS 的選擇器數量計

從 `baseline/`(原本的 IceBlue,LESS 編出來的那一份)實際抓出來的 pop-up 相關選擇器
(已排除 `.z-icon-*` 這種同字根的圖示名):

| 選擇器族 | baseline 中出現次數 | 目前是否被 A/B 照到 |
|---|---|---|
| `.z-nav-popup` / `.z-nav-open` / `.z-nav-text-popup` / `.z-navitem-text-popup` | 28 / 9 / 5 / 5 | ❌ |
| `.z-menupopup*` / `.z-menu-content-popup` / `.z-menu-popup` | 25 / 2 / 1 | ❌ |
| `.z-tbeditor-dropdown` / `.z-tbeditor-open-dropdown` | 18 / 8 | ❌ |
| `.z-confirmpopup-*`(arrow/icon/body/placement/ok/cancel/warning) | ≈40 | ❌ |
| `.z-daterangebox-popup*`(panels/today/linked/times/footer/clear/cancel) | ≈25 | ❌ |
| `.z-datebox-popup` / `.z-datebox-open` | 6 / 1 | ❌ |
| `.z-goldenlayout-dropdown` | 8 | ❌ |
| `.z-drawer-open` / `.z-drawer-mask*` | 5 / 2 | ❌ |
| `.z-toolbar-overflowpopup*` / `.z-toolbar-popup*` | ≈10 | ❌ |
| `.z-combobox-popup` / `.z-bandbox-popup` / `.z-timebox-popup` / `.z-timepicker-popup` | 3 / 2 / 2 / 2 | ❌ |
| `.z-chosenbox-popup*` / `.z-cascader-popup` / `.z-searchbox-popup` | 2 / 2 / 2 | ❌ |
| `.z-colorbox-popup` / `.z-colorpalette-popup` / `.z-colorpicker-popup` | 2 / 2 / 2 | ❌ |
| `.z-listhead-menupopup` / `.z-columns-menupopup` | 2 / 2 | ❌ |
| `.z-popup` / `.z-popup-content` | 1 / 2 | ❌ |
| `.z-portallayout-popup*` | 4 | ❌ |
| `.z-slider-popup` | 1 | ❌ |
| `.z-coachmark-open` / `.z-coachmark-mask` | 1 / 1 | ❌ |

**這不是「敏感度不足」,是結構性看不到。** 與 §6 的覆蓋率(80/85 個 `.css.dsp` 有被服務)
是兩件不同的事:檔案**有**被瀏覽器收下,只是裡面這些規則**沒有任何元素去命中**。
換句話說 §6 的 80/85 是**服務層**上界,本文件補的是**渲染層**下界。

## 2. 為什麼不是「加幾個 hover 測試」就好

pop-up 帶進三個 `ab-capture` 沒處理過的決定性問題:

1. **開啟動畫**。既有 spec 是「載入完成後」才注入 `NO_MOTION`。pop-up 是**注入之後**才開,
   若照舊順序,開啟過程的 transition 會讓連續兩張永遠不等。⇒ **必須先注入 NO_MOTION,再觸發**。
2. **滑鼠殘留位置**。用真的 click 開啟,滑鼠會停在觸發點上;ZK 會對滑鼠底下的
   `comboitem` / `menuitem` 加 `-hover` / `-seld` class。pop-up 一旦因為主題改動而位移,
   **被 hover 的項目會換人** ⇒ 產生與主題無關的巨大假差異。
   ⇒ 優先用 **widget 的 JS API**(`setOpen(true)` / `open()`)開啟,滑鼠完全不進場;
   非得 click 的(伺服器端驅動的 confirmpopup / messagebox / notification)開完立刻把滑鼠移開。
3. **截圖範圍**。`fullPage` 對 pop-up 是最差的選擇:pop-up 被 detach 到 `document.body`
   且絕對定位,開在下緣時會把 document 撐高 ⇒ 整頁位移、diff 爆掉;
   同時一個 300×200 的面板攤在 1280×4000 的整頁裡,§5.1 已量到的「稀有元件會被噪音吞掉」
   會更嚴重。⇒ **裁切到 pop-up 自己的 bbox + padding**(padding 留給 box-shadow)。

## 3. 設計

### 3.1 放在哪裡

- 新檔 `src/test/playwright/ab-popup.spec.ts`。
- `playwright.config.ts` 兩個 project 的 `testMatch` 從 `/ab-capture\.spec\.ts/`
  放寬成 `/ab-(capture|popup)\.spec\.ts/`。

**為什麼是「併入既有 project」而不是「新開一個 project」**:併入之後
`capture` / `diff` / `selftest` / 指紋 / app 生命週期 **一行都不用改** ——
pop-up 的 PNG 就是同一個 `AB_OUT` 目錄裡多出來的檔案,自動參與**每一次** A/B,
包含 `jar-baseline` 那條線。新開 project 則要各自跑 selftest、各自管標籤,沒有好處。

代價:pop-up 若不穩,會污染既有那條已經收斂到 0 的 selftest。這正是想要的大聲失敗
(§5.3 把「可重現性」訂為唯一判別器),不穩就修或依慣例列入 SKIP **並寫上量到的原因**。

### 3.2 命名

`popup__<page>__<scenario>.png`,例如 `popup__datebox__today-link.png`。
`diff` 只認 `*.png`,所以命名是唯一需要的整合工作。

### 3.3 場景表(version-controlled,不自動探索)

觸發動作本質上是逐元件的,**沒有可靠的自動探索法**,所以用明列的表格。
每一列都要帶「**要證明哪個選擇器被畫出來**」,否則一個場景跟忘記寫沒有差別。
(這是照 `ab-capture` 的 SKIP 慣例:每一條都要寫理由。)

### 3.4 已知照不到的(要寫進文件,不能默默漏掉)

| 元件 | 為什麼照不到 |
|---|---|
| **Selectbox** | ZK 的 `selectbox` 渲染成原生 `<select>`,展開的清單是**作業系統畫的**,不在 DOM 裡、Playwright 截不到。主題也管不到它 ⇒ 不是漏測,是本來就不存在的表面 |
| `<popup>` 的 tooltip 觸發 | `tooltip=` 屬性走 hover;用 widget API `open()` 開同一個面板即可,不必模擬 hover |

## 4. 驗證條件(順序不可換 —— §5.3 訂的前置條件)

1. `npm run build:css`(確保 `target/classes/web/iceblue11` 是當下原始碼的產物)
2. **`npm run visual:selftest`** → 必須 `pages differing: 0`,且 `pages missing: 0`。
   收不到就修,不放寬閾值。**這一步沒過,第 3 步的數字不可採信。**
3. `npm run visual:selftest ab-capture-mobile` → 同上(§5.3 明文:新增覆蓋後每個 project 都要重跑)
4. 反向控制:對 pop-up 專屬選擇器注入一行明顯改動(例如 `.z-combobox-popup{border-radius:12px}`),
   確認**新場景抓得到**、且原本 116 頁**抓不到** ⇒ 證明新增的訊號是新的,不是既有訊號的重複
5. A 側切到 `baseline/`(原本的 IceBlue)→ `visual:capture` → `visual:diff` → 逐條人工判讀

## 5. 交付物

- `src/test/playwright/ab-popup.spec.ts`
- `playwright.config.ts` 的 `testMatch` 放寬
- `doc/visual-ab-harness.md` 新增一節記錄機制、盲點與實測數字
- 本檔的「實測結果」回填

---

## 6. 實測結果(2026-08-19 收工)

完整記錄已寫進 `doc/visual-ab-harness.md` §7(機制、五個實測發現、照不到的清單)。
這裡只留結論數字。

| 驗證步驟 | 結果 |
|---|---|
| 場景數 | **28**(桌機 28;mobile 27 + `tbeditor` 一個具名 skip) |
| selftest 桌機 | 144 頁比對、**differing 0**;噪音 4 頁**全是 at-rest 頁**,28 張 pop-up 沒有一張進噪音名單 |
| selftest mobile | 143 頁比對、**differing 0**、missing 0 |
| 反向控制 | 注入 `.z-combobox-popup{border-radius:12px;border-color:#e00}` → **3 頁差異,全是 pop-up 場景**(3.4–4.4% 畫面、maxΔ 249–255);**原本 116 頁 at-rest 一頁都沒動**。還原後 byte 相同 |
| A/B vs `baseline/` 桌機 | 指紋 `df92b09541854f7d` → `7a447b74c81a24a0`(72/85 檔 byte 不同)、**144 頁 differing 0** |
| A/B vs `baseline/` mobile | **143 頁 differing 0**、missing 0 |

**反向控制是唯一關鍵的一列**:同一個改動,新場景看到 4.36% 的畫面、舊的 116 頁看到 0。
這同時證明了兩件事 —— 新訊號是新的,而且「pop-up 選擇器其實已被 at-rest 頁面命中」這個
可能的反駁不成立。

### 計畫與實作的偏差(照實記)

1. **§3.4 原本只列了 2 個照不到的**,實測是 **6 個**(多了 goldenlayout 的 tab dropdown、
   grid/listbox/tree 的 column menu、portallayout、mobile 的 tbeditor)。
   另外發現 **3 個「其實 at-rest 早就照到」**(confirmpopup 的 19 個靜態樣板、
   載入即開的 coachmark、toolbar 自己身上的 `-overflowpopup` class)—— 這 3 個原本被我
   算進缺口裡,是高估。
2. **「優先用 widget JS API」只對一半的元件成立**。`Chosenbox.open()` 會丟例外、
   collapsed `Nav.setOpen(true)` 是就地展開而非開面板、`Timebox` 桌機根本沒有 open —— 
   都是量出來的,不是讀原始碼推出來的(zkmax 沒有原始碼可讀)。
3. **多了一個計畫沒預期的噪音來源:游標**。§3 只想到「開啟動畫」與「截圖範圍」,
   結果三個獨立的失敗(mobile toolbar / desktop nav / mobile popup)全都是游標位置造成的,
   而且**該停還是該留沒有通則**。這是這次最主要的意外。
4. **附帶修掉 `AB_PORT`**:8081 被另一個專案的 dev server 佔住,harness 完全跑不動。
   `-Dserver.port` 蓋得過 Spring Boot 的 `setDefaultProperties`(已實測),所以加了
   env 覆蓋,不必去殺別人的 process。

---

## 7. 追加:column menu 的語料頁(2026-08-19,同日第二輪)

使用者指出 §3.4 那句「要加語料頁就得動 Marble」是錯的 —— **本 worktree 有自己的
`src/test/resources/web/`**,加在這裡即可。已補 `abpopup/column-menu.zul`,並選了**選項 B**。

| 項目 | 結果 |
|---|---|
| 場景數 | **28 → 30**(新增 `grid-column-menu`、`listbox-column-menu`) |
| 新覆蓋(at rest) | `.z-columns-menupopup` ×2、`.z-listhead-menupopup` ×1、`.z-column-button` ×5、`.z-listheader-button` ×3 |
| 新覆蓋(要開) | 自動 column menu 面板:sort / group / 欄位可見性 menuitem + `.z-menuseparator` + 勾選樣式 |
| selftest 桌機 / mobile | **147 頁 differing 0** / **146 頁 differing 0** |
| A/B vs `baseline/` 桌機 / mobile | **147 頁 differing 0** / **146 頁 differing 0**(指紋兩側不同,72/85 檔 byte 不同) |

**這一輪學到的三件事:**

1. **`.z-columns-menupopup` 根本不是面板的 class**,是**表頭上的修飾 class**
   (撐開 `padding-right` 讓出插入符位置),`menupopup` 一設好、**不開任何東西**就存在。
   所以這個缺口的**大部分**是被 `ab-capture` 的 at-rest pass 補掉的,不是 pop-up pass。
   ⇒ 先前把它列在「pop-up 缺口」裡是分類錯誤。
2. **`Treecols` 沒有 `setMenupopup`** —— 我一開始三個都寫上去,頁面直接 500。
   而且主題 CSS 本來就沒有 `.z-treecols-menupopup`,兩邊互相印證:**tree 沒有這個表面**。
   (`xmllint` 過了不代表能 render,又一次。)
3. **不能把本 worktree 的 `src/test/resources` 整個放上 classpath**:它是一份漂移過的語料
   複本(150 vs 158 頁、約 149 個同名檔),first-match-wins 會讓「服務哪一棵樹」變成
   靠 classpath 順序決定,而且**頁數與檔名都不會變** ⇒ 靜默換料。
   改成只把 `abpopup/` 複製成一個獨立的 classpath root,碰撞在結構上不可能。

**仍然照不到的**:`.z-goldenlayout-dropdown`(要 stack header 溢出)、
`.z-portallayout-popup*`(小螢幕 affordance)、mobile 的 `.z-tbeditor-dropdown`(Trumbowyg 自己關掉)、
原生 `<select>` 展開清單(作業系統畫的)。
