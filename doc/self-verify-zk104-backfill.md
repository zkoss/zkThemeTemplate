# ZK 10.4 補齊的複核(**自我複核,不是第 4 層獨立驗證**)

> **這份文件不能取代第 4 層。** 常規是「P3 之後每個步驟收工都要獨立 agent 覆核」,而這一輪
> **獨立 agent 連續三次死在 API 529**(伺服器端暫時性錯誤,與工作內容無關),三次都沒有留下任何
> 產出。下面這些檢查是**我自己跑的**,所以它有一個結構上的弱點:**它檢查不到「我沒想到要檢查的
> 東西」** —— 而前面每一輪獨立覆核抓到的缺陷,恰好多半屬於那一類。
>
> **⇒ 第 4 層對 `4aac5e5`…`d976d2a` 仍然欠著,不是已完成。**

驗收對象:11 顆 commit,`4aac5e5`(artifact 版號)→ `d976d2a`(文件)。
計畫書 `tasks/backfill-8-components-and-version.md`。

## 結論

**PASS-WITH-FINDINGS。** 交付物本身沒有問題;**一條我自己寫下的斷言被推翻**(C2 太強),
另外撿到**一個既有的結構缺口**(與本輪改動無關,但之前沒有任何地方記過)。

## 逐條結果

| # | 斷言 | 結果 | 決定性證據 |
|---|---|---|---|
| C1 | 缺口原本恰好 8,現已歸零 | **CONFIRMED** | 換第二種寫法重推(這次含**不在 `less/` 底下**的 entry、掃 zul / zk / zkmax / zkex 四個 edition):ZK **81** entry vs 主題 **85**,`comm -23`(ZK 有、主題沒有)**為空**;81 + 4 個已知舊路徑死複本 = 85 ✓ |
| C2 | token 缺口恰好 20,**且沒有其他漂移** | **REFUTED(後半段)** | 前半段成立(862 − 842 = 20,`profiles/_default.less` 的差異就是那 22 行);**但我當時只 diff 了 3 個 token 檔就宣稱「沒有其他漂移」**。`diff -rq` 整個 `zul/less/` 得到 **5 處**差異,其中 1 處是真缺口 —— 見〈發現 1〉 |
| C4 | 既有 baseline 未被動到 | **CONFIRMED** | `check:baseline OK — 86 files`;manifest 的 `#` 註解含 backfill 出處 2 處;A1 的 1 changed / 0 missing / 0 extra 與 A2 的 hash 行 0 刪 / 8 增 |
| C5 | #41 的閘門「因構造成立」、#42 才是真比較 | **CONFIRMED,而且比我寫的更強** | 見〈發現 3〉 |
| C11 | L3-A 第 1–38 列與 S1–S25 未被改寫 | **CONFIRMED** | 對 `d976d2a~1`:38 → 42 列、25 → 28 條,**舊列被改寫數 = 0**(逐行 `comm -23`);`見 S26`×2 / `見 S27`×2 / `見 S28`×1 與 `#39`…`#42` 的引用全部指對 |
| C12 | 補齊沒有悄悄動到既有 77 個輸出 | **CONFIRMED** | `git diff --name-status 266dc7c..HEAD -- src/main/resources/web` 只有 **8 個新增 `.css` + 3 個 token 檔**,**既有元件來源一個都沒動** ⇒ 既有輸出只可能經 token 鏈影響 `norm`;而 A1 更新 baseline 前的閘門就已回報**只有 1 個檔差異** |
| C6 | 算術與閘門數字 | **CONFIRMED** | 85 檔 / 14863 條 / 0;`build-css` 83 + `zklessc` 2 = 85;來源端 83 `.css` + 2 `.less`;`check:bytes` UNEXPLAINED **0** |
| C3 · C7 · C8 · C9 · C10 | 逐字匯入 · 執行層驗收 · 探針作廢 · 無需註冊 · 版號完整性 | **僅有我自己原本的量測,本輪未再獨立複驗** | 留給第 4 層 |

## 發現

### 發現 1(MEDIUM,**既有缺口,非本輪造成**)palette 的 `_css` 覆蓋機制在本主題是斷的

`zul/less/_zkcssvariables.less` 在 ZK 10.4 是**兩行** import,本主題只有**一行**:

```
  @import "profiles/_@{themeProfile}";
+ @import "colors/_@{themePalette}_css";     ← 主題缺這一行
```

連帶 `zul/less/colors/` 底下也沒有 `_iceblue_css.less`(ZK 10.4 有)。

**對現狀零影響,可證**:`@themePalette` 是 `"iceblue"`,而 ZK 的 `colors/_iceblue_css.less`
只有 **34 B / 2 行註解**(`// Iceblue` + `// Just leave it blank.`)—— 因為 iceblue 是預設
palette,沒有東西要覆蓋。所以少這一行**不會改變任何輸出**,閘門看不到、畫面也看不到。

**但它是真缺口**:換成別的 palette 就會靜默失效。對照 `zkthemebuilder/palettes/_amber_css.less`
是 **1114 B 的 `:root { --zk-* }` 覆蓋**;在本主題的 chain 裡那一整份會**被無聲丟掉**。而
`readme.md:50` 正是教使用者設 `@themePalette` 的那一行 ⇒ **照 readme 走、換非 iceblue palette
的人,拿不到 palette 的自訂屬性覆蓋。** 這也與 S23 討論 `_css` 命名時查到的事實同一組。

**最小修法**:補上那行 import + 補 `colors/_iceblue_css.less`(可逐字取自 ZK 10.4)。
兩者都不改輸出(檔是空的),但**單獨補 import 會讓建置失敗**(找不到檔),必須成對做。
**本輪未修** —— 它與被指定的 8 個元件無關,且屬於 palette 覆蓋機制,該獨立決定。

### 發現 2(LOW,已判定為合法)`zul/less/` 另外 3 處差異都是 P6 的合法後果

- **`footer.less` 只在 ZK** —— 主題已轉成 `zul/css/footer.css`。
- **`zul/less/font/` 只在 ZK** —— P6 把 FA 換成 `gen-fa-css.js` + `zul/font/font-awesome.css`,
  LESS partial 合法消失。
- **`norm.less` 少一行** `@import "~./zul/less/font/_variables.less"` —— 是同一件事的後果。
  **實測它是惰性的**:ZK 的 `norm.less` 沒有用到任何 `@fa*` 變數,唯一像 icon 的
  `@iconColor` 在**兩邊都定義在 `_zkvariables.less:72`、內容相同**。
  **順帶一個好消息**:兩邊 `norm.less` 只差這一行(**721 vs 722** 行)⇒ **norm 完全沒有落後
  10.4**,P5 面對的是同一份內容。

### 發現 3(把 C5 的敘述改強,不是缺陷)#41 的兩側是**同一批 byte**,不只是同一次編譯

我原本寫「baseline 與候選出自同一次編譯」。實測更直接:匯入時我是把 `target/` 的檔**複製**成
baseline,所以那一刻兩側**逐 byte 相同** ⇒ `files differing: 0` 是恆真句,連序列化差異都不會有。

而**現在**同一個檔:baseline `b6a559f2…` vs target `b1085a4e…` —— **byte 不同、宣告相同**。

> **#41 沒有 byte 差異、#42 有 byte 差異,這件事本身就是「#41 空轉、#42 有內容」的證據。**

這個判準比原文好用,因為它可以**機械檢查**:一個「匯入 LESS」的步驟如果兩側 byte 相同,就知道
那一列的 0 不算數。已把這句寫進 S26。

## 我沒能驗證的,以及為什麼

- **C3 / C7 / C8 / C9 / C10** —— 本輪只有我原本的量測,沒有第二人複驗。C7(執行層驗收)特別值得
  獨立重跑,因為它要起 app、抓瀏覽器實收的彙整 CSS,而那是最容易「看起來對」的一環。
- **「我沒想到要檢查的東西」** —— 這是自我複核的結構性盲點,也是這份文件不能結案的原因。
  發現 1 是靠 `diff -rq` 整個目錄才浮出來的;同樣性質的缺口在**別的目錄**(`zkmax/less/`、
  `js/zkex/`、`js/zkmax/*/less/`)有沒有,本輪**沒有掃**。
