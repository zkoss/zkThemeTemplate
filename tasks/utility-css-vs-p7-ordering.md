# utility CSS 與 P7 的先後順序 — 分析與建議

> 2026-08-11。回答「補 IceBlue 版 utility CSS 跟 P7,哪個先做」。
> 結論寫在 L1,理由與量測在 L2,原始數據在 L3。

---

## L1 執行摘要

**建議:把「utility CSS」拆成兩件事,它們的順序不一樣。**

| # | 工作 | 建議時機 | 為什麼 |
|---|---|---|---|
| **A** | **preview 專用的 utility stylesheet(test scope)** | **現在就可以做** | 對閘門**可證明中性**;而且 P7 正卡在 L-4,現在不做這個也開不了 P7 |
| **B** | **主題出貨 `z-*` utility API** | **P8 之後** | 它是**淨新增宣告**,會直接破壞轉換案的 G-zero / G-delta 帳 |
| **P7** | `tablet` holdout + palette/profile runtime API | **等 L-4 的 density 那一半裁示** | 它從頭到尾**不依賴** preview 頁面好不好看 |

**一句話:A 現在做、P7 等裁示、B 排到 P8 之後。三者之間沒有真正的依賴,只有一條紅線 —— B 不能插在 P8 前面。**

---

## L2 理由

### 2.1 為什麼 B 一定要排在 P8 之後(這是唯一的硬約束)

轉換案的驗收工具是 `scripts/cssdiff.js`,它把 `baseline/` 與新建出來的
`target/classes/web/iceblue11` **逐條宣告、依序**比對。整個案子的說法不是
「它還能編譯」,而是「瀏覽器收到的 CSS 等價」。各階段的判準只有兩種:

* **G-zero** —— 0 條差異;
* **G-delta** —— 差異必須逐條落在事先核准的清單裡(`check:p4a` / `check:p4b` 那種)。

而 **P8 的驗收條件白紙黑字是「須等於 ~~P4 + P5 + P7~~ `P4a + P4b + D1/D2 + D4`
已核准 delta 總和」**(公式於 2026-08-14 更正,見計畫書附錄 L3-G 的 **C21**;
本文的論證不受影響 —— 重點是「那個總和只能是轉換造成的差異」,不是它由哪幾段組成)。

出貨一層 utility CSS = 對主題輸出**淨增數百條宣告**。這些宣告和轉換案毫無關係,卻只有兩條路:

1. 併進 P8 的 delta 總和 → 那個總和就不再是「轉換造成的差異」,**P8 的判準失去意義**;
2. 重切 `baseline/` → 等於把「轉換前的樣子」這個唯一參照抹掉,**前面 P3–P7 累積的證明鏈當場作廢**。

兩條都不能走。所以 B 必須等 P8 收工、`baseline/` 完成它的任務之後,再以**獨立功能**的身分重新切基準。

### 2.2 為什麼 A 是安全的(而且已經實測過)

`npm run check:cssdiff` 比的是 `baseline/` 對 `target/classes/web/iceblue11`。
**test 資源編到 `target/test-classes`,永遠不在比對範圍內。**

這不是推論 —— 本次搬遷已經是一次實驗:一口氣加了 **382 個 test 檔**(149 個 zul、
219 個資產、13 個 Java、1 個 test-scope 依賴),`check:gate` 全程 **EXIT 0**、
`check:baseline` 86 檔相符、`baseline/` 0 dirty。**A 的性質和它完全相同。**

### 2.3 為什麼「A 先」不會浪費工

P7 要把 `@themePalette` 的**編譯期插值**換成 **runtime `--zk-*` override sheet**,
而它的驗收多一條:**override sheet 必須表達得出 palette 覆蓋**。

一份用 `--zk-*` token 寫成的 preview utility sheet,正好是那個機制的**第一個消費者**
—— 它可以當 P7 的測試素材,而不是 P7 的負擔。反過來說,**現在不寫**,P7 收工時也還是
得從零生一份出來驗。

### 2.4 為什麼 A 不是 P7 的前置(不要誤會成依賴)

視覺 A/B harness(`ab-capture.spec.ts`)的語料是 **Marble worktree 的頁面**,
由 `AB_MARBLE_WEB` 掃出來,而 `ab-visual.js` **從不把本分支的 `target/test-classes`
放上 classpath**。也就是說:

> **把搬進來的 preview 頁面弄好看,對 P7 的閘門一點幫助都沒有。**

A 的價值是**人眼複審**(125 張截圖現在版面是塌的),不是機器驗收。兩者互不相欠。

### 2.5 現在的缺口有多大

以目前語料實測:

| 項目 | 數量 |
|---|---|
| preview 頁面用到的非 icon `z-*` class | **353** |
| 主題已經有的 | **76** |
| **缺** | **277** |

缺的以版面類為大宗(`text` 34、`d` 17、`bg` 15、`grid` 15、`flex` 12、`gap` 8、
`overflow` 7、`rounded` 7 …),**`z-d-flex` 本身就是缺的** —— 實測 badge.zul 那排
容器的 computed 值是 `display:block`、`gap:normal`,整頁版面塌陷就是這麼來的。

因此 A 有一個很划算的第一刀:**先補 display / flex / gap / spacing 這幾組**,
就能讓大多數頁面的骨架站起來,顏色與字級再跟上。不是 277 條手寫規則,而是幾組機械展開。

### 2.6 A 要放在哪裡(檔案位置與掛載方式)

**先講不能放哪裡:`src/main/resources/web/` 底下一律不行。** pom 的
`zktheme.web.resources` 就是這個目錄,`zklessc` 與 `build-css.js` 都以它為來源,
產物落在 `target/classes/web/iceblue11/` —— **正好是 `cssdiff` 拿去跟 `baseline/` 比的那棵樹**。
放進去就等於做成了 B,閘門立刻紅。

**要放的是兩個新檔,都在 `src/test/` 底下:**

| 檔案 | 作用 |
|---|---|
| `src/test/resources/web/preview/utility.css` | utility 規則本體。`~./preview/utility.css` 可直接被服務(`usecase.css` 已證明這條路徑可行) |
| `src/test/java/zk/example/PreviewStylesInit.java` | 實作 `WebAppInit`,在 `init()` 裡呼叫 `webapp.getConfiguration().addThemeURI("~./preview/utility.css")` |
| `src/test/resources/metainfo/zk/config.xml` | 註冊上面那個 listener(test scope,與主題自己的 `src/main/resources/metainfo/zk/config.xml` 平行存在,ZK 會掃 classpath 上全部的 config.xml) |

**為什麼要走 `addThemeURI` 而不是在頁面上加 `<style src>`:** 目前 125 頁裡只有 12 頁有
`<style src="~./usecase/usecase.css">`,其餘 113 頁**一個樣式表引用都沒有**。逐頁加等於改 125 個檔,
而且以後每新增一頁都要記得加。`Configuration.addThemeURI()`(ZK 10.4 有此 API,已用 `javap` 確認)
是把一支樣式表掛到**每一個 desktop** 的框架級做法,一次搞定、零頁面編輯。

**為什麼放在 test scope 是安全的(不只是「應該沒事」):** 視覺 A/B 的 classpath 是
`[Marble test-classes, deps, iceblue target/**classes**]` —— **iceblue 的 `target/test-classes`
從來不在上面**,所以這支 listener 與這份 CSS 在 A/B 執行時根本不存在,不可能污染比對。

**實作時必須實測的兩件事**(我還沒驗,不要當成已知):

1. `StandardThemeProvider` 會改寫 `~./zul/css/**` 這個命名空間的 URI。`~./preview/utility.css`
   不在那個形狀裡,**預期**原樣通過,但要用瀏覽器實際收到的 `<link>` 確認。
2. **來源順序**:utility 必須排在元件 CSS **之後**才贏得了同特異度的對決
   (例如 `.z-label` 對 `.z-text-sm` 都是 0,1,0)。這棵樹**沒有 `@layer`**,
   所以完全靠順序;要確認 `addThemeURI` 掛出來的 `<link>` 在 `zk.wcs` 之後。

### 2.7 A 是 B 的草稿,不是拋棄式的 —— 所以現在就要照 B 的形狀寫

**前提已確認:最終目標是把 utility CSS 併進本專案出貨,做法比照 Marble。**
A 因此不是暫時擋著用的東西,而是 B 的第一版原稿。這對「今天怎麼寫」有五個具體約束:

1. **class 名稱與 Marble 完全一致。** 兩個主題的 utility 應該可互換,使用者換主題不必改頁面。
   同時也讓搬進來的 125 頁不用再改一次。
2. **檔案切法與 Marble 一致** —— `_layout.css` / `_spacing.css` / `_typography.css` /
   `_colors.css` / `_borders.css` / `_stack.css` / `_components.css` / `_elevation.css` /
   `_print.css`。A 階段放在 `src/test/resources/web/preview/utility/` 底下同名擺放,
   **升級成 B 就只是 `git mv` 到 `src/main/resources/web/zul/css/utility/` 再把檔名加進
   `build-css.js` 的打包清單**,不是重寫。(一支 `addThemeURI` 只掛一個 URI,
   所以 listener 裡逐檔各呼叫一次,維持 1:1。)
3. **不要用 `@layer`。** 這棵樹的輸出**完全沒有 `@layer`**,而且 CleanCSS 對裸 `@layer`
   有已知的破壞行為。utility 要贏靠的是**打包順序排最後**(Marble 的 build 本來也是這樣做),
   A 階段則靠 `addThemeURI` 掛在 `zk.wcs` 之後。兩邊都成立,升級時不需要改寫。
4. **缺的 scale token 一起寫在同一份裡的 `:root` 區塊。** 見下方 ⚠️。
5. **顏色一律走 token,不寫死。** 能對到 IceBlue 既有 role 的就對過去
   (`--zk-color-primary`、`--zk-base-text-color`、`--zk-base-border-color` …),
   這樣 P7 把 palette 換成 runtime `--zk-*` override sheet 之後,**utility 會自動跟著換色**。

#### ⚠️ 事先要知道的落差:B 不只是「加 9 個 CSS 檔」,還要加一層 scale token

實測 IceBlue 的 `norm.css.dsp` 宣告了 **862 個 `--zk-*`**,但其中**絕大多數是逐元件的**
(`--zk-mesh-body-padding`、`--zk-grid-detail-content-padding`、`--zk-borderlayout-header-font-size` …)。
真正屬於設計系統層級的只有這些:

| 類別 | IceBlue 現有 | Marble utility 需要 |
|---|---|---|
| 字級 | `--zk-base-font-size` + `--zk-font-size-{x-small…x-large}`(5 階,字詞命名) | `z-text-xs/sm/base/lg/xl/2xl` 之類的數值階 |
| 圓角 | `--zk-base-border-radius`、`--zk-border-radius-{small,large}`(3 階) | `z-rounded-*` |
| 顏色 | `--zk-color-primary{,-dark,-light,-lighter}`、`--zk-color-accent{,2,3}`、`--zk-color-background{1,3}`、`--zk-color-grey-{dark,light,lighter}`、`--zk-base-{text,border,background}-color`(約 15 個 role) | surface / container / on-surface / secondary / muted 等一整組語意角色 |
| **間距** | **完全沒有 scale**(所有 `-padding` 都是逐元件的) | `z-p-*` / `z-m-*` / `z-mb-*` / `z-gap-*` —— 缺的 277 個裡佔很大一塊 |

⇒ **B 真正的內容是「新增一層 scale token + 9 個 utility 檔」**,而那層 token 一旦出貨就是
IceBlue 的**公開 API**(這個主題已經以 842 個 `--zk-*` 對外承諾過一次)。
這是個產品決策,不是收尾工程 —— 現在知道,好過 P8 才發現。

A 階段先把這層 scale 寫在 preview sheet 的 `:root` 裡,等於**免費得到一份提案稿**:
到 B 的時候要審的不是空白,而是一份已經被 125 頁實際用過、證明夠用的清單。

### 2.8 A 已完成(2026-08-11)+ 範圍界線

10 支 sheet 落在 `src/test/resources/web/preview/utility/`,由 `PreviewStylesInit`
(test-scope `metainfo/zk/config.xml` 註冊)以 `addThemeURI()` 掛到每個 desktop。
缺口 **277 → 32**;`check:gate` EXIT 0、`baseline/` 0 dirty;125 頁全部 pass。

實測確認了 §2.6 標為「必須實測」的兩件事:`StandardThemeProvider` **不會**改寫
`~./preview/**` 的 URI;`<link>` 順序是 `zk.wcs` → 10 支 sheet,utility 在後,如所需。

移植時唯一的**刻意差異**:拆掉 Marble 每支檔案外面的 `@layer zk-utilities { }`。
照抄會讓結果**完全相反** —— 未分層的規則勝過任何已分層的規則,而這棵樹沒有任何 `@layer`,
保留包裝等於讓 utility 輸給它要覆蓋的元件 CSS。

**範圍界線(2026-08-11 裁示:不補)** —— 剩下的 32 個不是「還沒做完」,是**不屬於 utility 層**:

| 類別 | 數量 | 說明 |
|---|---|---|
| `z-button-*`(severity / outlined / text / sm / lg) | 20 | Marble 的**元件變體**,住在元件 CSS |
| `z-progressmeter-*` | 4 | 同上 |
| `z-row-selected`、`z-grid-noborder`、`z-listbox-noborder`、`z-tree-noborder`、`z-popup-tooltip`、`z-drop-ghost` | 6 | 同上 |
| `z-text-on-surface-variant`、`z-text-on-primary-container` | 2 | 形狀像顏色 utility,但 **Marble 的 `_colors.css` 也沒有** —— 頁面用了不存在的 class |

要不要在 IceBlue 補這些,是**元件設計**決策(得為此主題設計一套 button 變體外觀),
不是移植工作 —— 適合等 P8 之後與 B 一起談。

---

## L3 附錄

### L3.1 數字修正:277,不是先前說的 217

先前回報「231 用到 / 217 缺」。本次重算為 **353 / 277**。差異來自**量測口徑**,不是語料變動:

* 先前只掃 `sclass=`;這次同時掃 `sclass=` 與 `class=`;
* 先前的掃描範圍偏窄,這次走訪整個 `src/test/resources/web`(含 `pv/`、`utility/`);
* 兩次都排除 `z-icon-*`。

**兩個數字都不改**,以本次(353 / 277)為準,口徑如上。

### L3.2 「缺」的定義與已知偽陽性

判定方式:把 `target/classes/web/iceblue11` 底下所有 `.css` / `.dsp` 串起來,
抓出所有 `.z-xxx` 形式的 class 選擇器,再拿頁面用到的集合去減。

已知會混進來的偽陽性:`z-button*`(20 個)有一部分是 `component-theming.zul` 在示範
**元件** class,不是 utility;真正動手前應先把這類挑掉。**277 是上界,不是待寫規則數。**

### L3.3 相關約束備忘

* P7 目前狀態 **BLOCKED**,擋在 **L-4 的 density 那一半**(colour 那一半已由 L-7 解除)。
* P7 另外背著:tablet 裡剩下的 **61 條**可移除前綴、第 15 條 `-moz-appearance`、
  S52 記到的 `.z-focus-a` 特異性打平,以及 `_zkcssvariables.less` 缺的 palette import。
* B 真正動工時要一併決定的產品面問題:IceBlue master 已經以 `--zk-*` 出貨 **842** 個
  自訂屬性作為公開 API,新增 utility 層要不要、以及如何與它對齊。
