# IceBlue 棄用 LESS —— 實際執行計畫

**日期**:2026-07-29
**分支**:`iceblue`(自 `master` 最新 commit 開出)
**工作目錄**:`../zkThemeTemplate-iceblue`(git worktree)
**前置評估**:[drop-less-pure-css-evaluation.md](drop-less-pure-css-evaluation.md)

---

## 0. 範圍

**做**:把 IceBlue 的 153 個 `.less` 換成純 CSS,移除 `zkless-engine` 依賴,在過程中不改變
瀏覽器實際收到的 CSS(除了明確決策要改的部分)。

**不做**(這個分支刻意排除,以免混淆驗證訊號):

| 排除項 | 理由 |
|---|---|
| 動 `master` | 佔位符 / 模板身分要跟 RD 討論後再定(評估文 §8.1) |
| 導入 `@layer` | 會改變 cascade 行為 → 無法用「零差異」驗證。獨立議題,獨立分支 |
| Marble token 改名 / 對齊 | 是另一份文件的 Part B,獨立決策 |
| 移植 Marble 的 utility classes | 獨立決策 |
| `--zk-*` token 增減 | 本分支只搬,不改名不增減 |

**一句話**:這個分支只證明一件事 —— **「IceBlue 不需要 LESS 也能產生一模一樣的 CSS」**。
其他現代化留給後續分支,各自帶自己的驗證。

---

## 1. 已驗證的前提(實測,不是推論)

計畫的每個階段都建立在這些量測上。全部在 scratchpad 跑過:

> **P0 已重新量測(2026-07-29)。** 下表第 1、10 項的數字在 P0 被 `scripts/cssdiff.js` 推翻 ——
> 原數字是**來源端**(`.less` 裡的宣告)而非**輸出端**(`.css.dsp` 裡的宣告)。閘門比的是輸出端,
> 所以以輸出端為準。已就地更正,原值以刪除線保留。詳見
> [iceblue-drop-less-progress.md](iceblue-drop-less-progress.md) 的〈P0 修正的前提〉。

| # | 事實 | 數據 |
|---|---|---|
| 1 | master 的 LESS 樹能完整編譯 | 77 個 `.css.dsp`,**14323** 條 declaration 記錄(~~14807~~;另有 436 條 DSP 指令單獨比對) |
| 2 | **LESS 3.13.1 → 4.8.1 在 master 的 LESS 樹上輸出零差異** | 77 檔全部 declaration-level IDENTICAL。**只對 master 的 LESS 成立** —— 同一組比對跑在 Marble 的現代 CSS 上有 9 條差異(見 P1) |
| 3 | **`--compress` 開/關 輸出零差異** | 同上 → 可以產生「可讀版」輸出而不影響語意 |
| 4 | **`//` → `/* */` 前處理後編譯,輸出零差異** | 同上 → 註解保留技巧是安全的 |
| 5 | 未壓縮輸出**已經是可用的 `.css` 原始碼** | 值全是 `var(--zk-*)`、mixin 已展開、縮排可讀 |
| 6 | 元件之間**沒有耦合** | `_zkvariables.less` 只是名稱轉發;值只進 `norm.css.dsp` |
| 7 | 基礎層樞紐是 `_header.less` | 73 個入口檔 import 它;它再 import 變數 + palette + mixins |
| 8 | 842 個 `--zk-*` 值只從一條路徑產生 | `norm.less` → `_zkcssvariables.less` → `profiles/_@{themeProfile}` |
| 9 | 3 個輸出檔沒有 taglib header | `js/zkmax/sel/css/{listbox,tree}.css.dsp`、`js/zkmax/grid/css/grid.css.dsp` |
| 10 | 規模分佈(**輸出端**) | **2** 檔 ≤4 條;最大 4 檔:font-awesome **4545**、norm **1500**、tablet **681**、combo **586**(原記 ~~12 檔 ≤4~~、~~norm 1243、font-awesome 910、tablet 421、combo 407~~ 是來源端數字) |
| 11 | `goldenlayout.css.dsp` 有**兩份逐條相同的輸出** | `js/zkmax/goldenlayout/css/` 與 `js/zkmax/layout/css/`,各 413 條、diff 0 → P3 要一起轉,或先確認哪一份是死路徑 |
| 12 | `tbeditor.css.dsp` 也有兩份,但**不相同** | `js/zkmax/tbeditor/` 380 條 vs `js/zkmax/inp/` 375 條,67 條差異 → 是兩個不同來源,不能當複本處理 |

### 1.1 最關鍵的一項:第 5 點

`zklessc` 不壓縮時的輸出長這樣(`js/zul/wgt/css/button.css.dsp` 實際節錄):

```css
.z-button {
  font-family: var(--zk-base-title-font-family);
  color: var(--zk-button-color);
  min-height: var(--zk-base-button-height);
  border: var(--zk-button-border-width) solid var(--zk-button-border-color);
  -webkit-border-radius: var(--zk-input-border-radius);
  -moz-border-radius: var(--zk-input-border-radius);
  -o-border-radius: var(--zk-input-border-radius);
  -ms-border-radius: var(--zk-input-border-radius);
  border-radius: var(--zk-input-border-radius);
  ...
}
```

**LESS 變數已經解析成 `var(--zk-*)`,mixin 已經展開,格式可讀。**
所以每個元件的轉換不是「手工重寫」,而是「**拿編譯輸出當新的原始碼**」——
而且轉換的正確性是**構造上保證**的(未動任何一個 byte 之前,它逐條 declaration 就等於基準)。

這把 P3(74 個元件檔)從「數週手工」變成「一支腳本 + 人工複審」。

### 1.2 註解保留的正確做法(踩過的坑)

第 4 點的技巧是:編譯前把 `.less` 的 `//` 行註解改寫成 `/* */`,LESS 就會把它們帶進輸出。

**但只能對「正在轉換的入口檔」做,不能對共用 partial 做。** 實測若對整棵樹套用,
`_zkvariables.less` 的 40 多條 section 註解會被灌進**每一個**元件輸出:

```css
/* Global Variables */
/* ------------------------------------- */
/* Typography */
...   ← checkbox.css.dsp 裡出現的其實是變數檔的註解
```

---

## 2. 驗證策略

### 2.1 主閘門:declaration-level diff

工具:`scripts/cssdiff.js`(已寫好並驗證,scratchpad 版本待 P0 提交進 repo)。
它把每個 `.css.dsp` 攤平成有序的 `context || property:value` 記錄清單再逐筆比對。

**設計要點**(踩過的坑,都已修正):

- **DSP 指令要先抽離。** `.css.dsp` 不是純 CSS,`<%@ taglib %>` 與 `<c:if>` 位於任何 brace 之外,
  naive brace parser 會把它們併進第一個 selector,造成 74 個檔案假性差異。
- **順序敏感。** CSS declaration 順序有意義,所以比對是有序的,不是集合比對。
- **只正規化「證明無語意差異」的項目**,而且清單是可複審的:空白、`0.90`→`0.9`、`0px`→`0`、
  `a > b`→`a>b`、引號風格。
- **selector 與 value 要分開正規化。** `+` 在 selector 是相鄰選擇器,在 value 是 `calc()` 的加號 ——
  同一條規則套兩邊會出錯。

### 2.2 兩種閘門,不要混用

| 閘門 | 用在 | 判準 |
|---|---|---|
| **G-zero** | P1、P2、P3、P6 | `files differing: 0`。任何差異都是 bug |
| **G-delta** | P4、P5、P7 | 差異必須**逐條對應到已決策的變更**,且總數符合預估 |

**這是方法論上的重點:先把所有能「零差異」驗證的事做完,再做會改變輸出的事。**
如果邊轉換邊移除 vendor prefix,一旦出現差異就分不清是「轉換寫錯」還是「政策生效」。

### 2.3 視覺回歸是輔助,不是主閘門

declaration diff 在瀏覽器實際收到的 CSS 這一層是**完整的等價證明**(DSP 求值不變)。
視覺回歸只在 P4/P5/P7 這些有意改變輸出的階段才是必要的補充。

---

## 3. 執行階段

### P0 — 建立工作區與基準

```bash
cd /Users/hawk/Documents/workspace/zkThemeTemplate
git worktree add ../zkThemeTemplate-iceblue -b iceblue master
cd ../zkThemeTemplate-iceblue && npm install

# 基準:用 master 現況的工具鏈編一次,存成不可變的參照
npx zklessc -s src/main/resources/web -o baseline/ --compress
```

交付:
- worktree + `iceblue` 分支
- `scripts/cssdiff.js` 提交進 repo
- `baseline/`(gitignore,但要能一鍵重建)
- `npm run check:cssdiff` script
- `doc/iceblue-drop-less-progress.md`(進度 + 閘門紀錄,見 §5),以及把本計畫書搬進被追蹤的樹

**G-zero**:重跑一次 build,`cssdiff baseline/ target/…` 回報 0。
(先證明工具鏈與比對器本身是確定性的,再拿它去驗證別的東西。)

---

### P1 — 把 LESS 釘到 4.x

```json
"overrides": { "zkless-engine": { "less": "4.8.1" } }
```

**G-zero** ✅ **已預先驗證**:77 檔 / 14807 條 declaration,LESS 3.13.1 vs 4.8.1 零差異。

#### 為什麼還要升 —— 以及為什麼它**不是**本分支的正確性前提

先把範圍講清楚。phase0 spike §2 那 9 處靜默改壞(`min()` in relative colors、
`grid-column: 1 / -1`、巢狀 `@starting-style`…)是 **Marble 的 CSS** 才有的風險,不是 IceBlue
的 LESS。兩份量測是兩批不同的程式碼:

| 量測 | 對象 | 結果 |
|---|---|---|
| spike §4 | Marble 的 tokens+utility(828 條)+ 93 個元件 CSS | LESS 3 改壞 9 條 |
| 本文前提 #2 | **master 的 LESS 樹**(77 檔 / 14807 條) | 3.13.1 vs 4.8.1 **零差異** |

零差異就等於**證明** master 的 LESS 目前一條都沒用到那 9 種語法。加上範圍 §0 已排除 `@layer`
與 utility 回移,而 P2 之後轉出的 `.css` 全走 `build-css.js`、不經 `zklessc` —— 所以
「轉換途中有現代 CSS 經過 `zklessc`」在本分支**不會發生**。

實測潛在面:整棵 153 檔 LESS 只有 2 處裸斜線,兩處都安全 ——
- `js/zul/wgt/less/checkbox.less:29` 的 `calc(@checkboxSwitchHeight / 2)`,而該變數是
  `var(--zk-checkbox-switch-height)`(`_zkvariables.less:278`)→ 運算元無法求值,兩版都原樣輸出
- `zul/less/font/_core.less:22` 的 `font: … @fa-font-size-base/@fa-line-height-base FontAwesome`
  (`14px`/`1`)→ 這是唯一「兩版**可能**分歧」的構造,而 77 檔零差異的結果說明它們實際一致

那還升的理由 —— 注意要區分「**跑一次比對**」和「**留著這個 pin**」,兩者理由不同:

1. **跑一次比對是為了取得事實**(不需要留著 pin)。3.13.1→4.8.1 零差異這一跑,證明的是 master
   的 LESS 不依賴 LESS 3 的任何語意 —— 特別是 `math: always` 的裸除法。這是整個轉換的承重事實,
   應該留在分支歷史裡,不是留在 scratchpad。**這件事已經做完了。**
2. **留著 pin 的理由是前瞻性的,不是驗證。** 153 個 `.less` 會在 P3–P7 之間縮到 3 個,而本分支
   幾乎每一個都會動到。今天的潛在面很小(2 處),但手改時一旦引入斜線值或 `min()`,LESS 3 會在
   **exit 0** 下改壞 —— 沒有任何 build error 攔得住的失效模式。**三個理由裡只有這一個支持
   「pin 要留下來」。**
3. **成本一行,且 P8 隨 `zkless-engine` 一起刪掉。**

兩點要說清楚,免得把 P1 講得太漂亮:

- **這個 pin 不改變交付物。** 既然兩版在本來源上已證明輸出等價,P3 轉出的 `.css` 兩種情況下
  完全相同。它純粹是護欄,不是正確性前提。
- **也不是純上檔。** LESS 4 改了預設 math mode,所以新寫進 `.less` 的裸 `@a / 2` 會**靜默停止
  相除**。cssdiff 閘門抓得到(它是相對 baseline 的 delta),而且本分支本來就不該寫新的 LESS ——
  但它是「把一種靜默換成另一種靜默」,不是消除靜默。

**結論:P1 是可選的。** 不做,分支依然正確(剩下 3 個 `.less` 反正會在 P5/P6/P7 轉掉);做,
就換到一道 exit-0 護欄,代價一行、P8 刪除。建議做,但若不想在「以刪除該依賴為目的」的分支上
動它的版本,也是站得住的取捨。

反過來,評估文 §6 的第二個理由(「ZK core 自己也編 LESS,升版對它獨立有價值」)**不成立**:
主題端 `package.json` 的 npm `overrides` 碰不到 ZK core 的 build,那需要 upstream 升
`zkless-engine` 自己的依賴。

工作量:一行。

---

### P2 — 雙來源 build

新增 `scripts/build-css.js`,與 `zklessc` 並存:

```
target/classes/web/<theme>/
  ├── zklessc  處理所有 .less（逐檔 → .css.dsp）
  └── build-css.js  處理所有 .css（逐檔 → .css.dsp，加 taglib header、minify）
```

比 Marble 的版本簡單得多 —— 因為轉換後的元件檔是**自給自足、沒有 `@import`** 的(前提 6),
所以元件路徑只要「讀檔 → 加 header → minify → 寫出」。只有 `norm.css` 需要串接多個來源。

必須複製的行為:
- taglib header 三行,**除了前提 9 的那 3 個檔**
- minify 後的輸出等價(minifier 換成 CleanCSS,注意 `@scope` / 裸 `@layer` 的坑 —— 本分支
  兩者都不會用到,但 builder 要先把防護寫進去)

**G-zero**:此時尚無任何 `.css` 檔,輸出必須完全等於 baseline。

---

### P3 — 元件掃描:74 個檔案 → `.css`(工作量主體)

每個入口檔的處理程序,寫成腳本 `scripts/less2css.js`:

```
1. 複製該入口 .less（只有它,不含共用 partial）→ 把 // 註解改寫成 /* */
2. 用 zklessc 編譯它（不壓縮）→ 取得展開後、含註解的 CSS
3. 去掉 taglib header（改由 build-css.js 注入）
4. 寫成 src/main/resources/web/<path>/css/<name>.css
5. 刪除原 .less
6. cssdiff 該單檔 → 必須 0
```

順序:由小到大,每一批都跑閘門。

> **P0 更正**:原批次規劃建立在「12 檔 ≤4 條」上,但那是來源端數字 —— 輸出端只有 **2** 檔
> (`tablelayout` 1 條、`cardlayout` 4 條)。批 1 太小,不足以驗證腳本,所以改成以輸出端條數分界:

- 批 1(~8 檔,≤20 條):`tablelayout` 1、`cardlayout` 4 起算 —— 目的是驗證**腳本本身**,
  不是趕進度。這批要逐檔人工看過展開結果。
- 批 2:一般元件(輸出端 20–200 條,~55 檔)
- 批 3:大檔(輸出端 >200 條):`combo` 586、`goldenlayout` 413×2、`tbeditor` 380/375、
  `biglistbox`、`colorbox` 等

批 1 的實際檔案清單在 P3 開工時由 `scripts/cssdiff.js --list` 的條數排序決定,不預先寫死。

**保留在 LESS 的**:`norm.less`(P5)、`font-awesome.less`(P6)、`tablet.less`(P7)。

**G-zero**:每一檔、每一批,以及全樹。

人工複審重點(腳本無法判斷的):
- 展開後的 CSS 可讀性 —— 需不需要重新分段、把註解移到正確位置
- `_zkvariables.less` 的名稱轉發消失後,`var(--zk-*)` 名稱是否仍語意清楚
- 有沒有出現重複的 declaration(mixin 展開常見)

工作量:主體。腳本 ~1 天,74 檔的複審視要求多細,估 3–6 個工作段。

---

### P4 — vendor prefix 政策(第一個 G-delta 階段)

**必須先有決策**(評估文 L-2):IceBlue 作為 ZK 11 的 add-on,瀏覽器支援聲明是什麼?

若決定移除死前綴,預估影響:

| mixin | 呼叫點 | 展開 | 預期移除 |
|---|---|---|---|
| `.borderRadius()` | 103 | 515 | 412 |
| `.boxShadow()` | 46 | 230 | 184 |
| `.transform()` | 42 | 210 | 168 |
| `.applyCSS3()` | 30 | 150 | 120 |
| 四角 borderRadius | 24 | 120 | 96 |
| **合計** | **245** | **1225** | **≈980** |

加上原始碼手寫的 149 條 prefixed 宣告與 1 處 `progid:DXImageTransform`。

**P0 實測校準**(輸出端逐條數):

| 前綴 | 輸出端條數 |
|---|---|
| `-webkit-` | 313 |
| `-moz-` | 283 |
| `-ms-` | 281 |
| `-o-` | 250 |
| **合計** | **1127** |

上面的估算(980 + 149 = 1129)與實測 1127 只差 2 條 → **P4 的預估可信**,可以直接當 G-delta 上限用。
但 `progid:DXImageTransform` 在輸出端是 **0 處**(它在 `_zkmixins.less:240`,該 mixin 沒有可達
呼叫點)→ 不會出現在 delta 裡,別把它列進預期。

**G-delta**:diff 只能出現「移除 `-webkit-` / `-moz-` / `-o-` / `-ms-` 宣告」這一類記錄,
總數 ≤ **1127**(全移除的上限;實際數量取決於哪些前綴判定為死)。**任何非移除類的差異都是 bug。**

放在 P3 之後、獨立一階的理由見 §2.2。

---

### P5 — `norm.css`:tokens + reset + 全域(設計工作)

`norm.less`(輸出端 **1500** 條,全樹第二大 —— 最大是 font-awesome 的 4545)拆成:

```
zul/css/tokens/_default.css       ← profiles/_default.less 的 842 個 --zk-* 原樣搬
zul/css/tokens/_compact.css       ← profiles/_compact.less
zul/css/tokens/_iceblue.css       ← colors/_iceblue.less
zul/css/base/_reset.css           ← _reset.less（browserDefault 機制改寫）
zul/css/norm.css                  ← 全域樣式 + 由 build-css.js 串接上面各檔
```

**`browserDefault`(91 個插值站點)—— 唯一的真設計題。** 移植 Marble 已實證的機制:

```
單一來源 base/_reset.css
  ├─→ zul/css/reset.css        全域版,不加前綴
  └─→ zul/css/reset-embed.css  去掉 page-frame 規則後包 @scope (.z-page){…}
ThemeWebAppInit / ThemeProvider 讀 org.zkoss.zul.theme.browserDefault 選一份
```

注意 CleanCSS 會摧毀 `@scope`(實測輸出全空)→ 必須**先 minify 內層、再包 `@scope`**。

**G-delta**:
- 842 個 token declaration 必須**零差異**(這部分是純搬移)
- reset 部分是刻意的結構改變 → 需要 `browserDefault` 開/關兩種設定下的 computed-style A/B
- 必須沿用 Marble 已記載的限制:open float 會被移到 `document.body`、落在 `.z-page` 之外
  ——`master` 現行的 descendant-selector 做法有**同樣**限制,所以不是回歸,但要寫進文件

---

### P6 — Font Awesome 生成

`font-awesome.less`(910 條)是 `each()` + 遞迴 mixin 產生的。

**先確認決策**(評估文 L-5):ZK 11 的 icon 方向是 FA 還是 Lucide?

- 若 FA 保留 → 寫 `scripts/gen-fa-css.js`(Marble 的 `getLucideIcons()` 是同一形狀的先例)
- 若 FA 移除 → 本階段變成刪除 + 空 stub

**G-zero**(若保留):**4545** 條 declaration 零差異(~~910~~ 是 `.less` 來源端條數;`each()`
展開後輸出端是 4545,為全樹最大單檔)。

---

### P7 — `tablet.less` + `@themeProfile` / `@themePalette`

`tablet.less`(輸出端 **681** 條)依 profile 分成 `tablet/default/` 與 `tablet/compact/` 兩套,
並且用了 LESS 的 **import path 插值**(`@import "profiles/_@{themeProfile}"`)——
這是 LESS 獨有能力,純 CSS 沒有對應物,但也不需要:兩個 profile 只是同一組 842 個
`--zk-*` 的不同數值,改成 runtime override sheet 即可。

**G-delta**:這是刻意的對外 API 變更(「改 LESS 變數重編 jar」→「載入 override sheet」),
必須寫進 migration guide。與評估文 L-4 同一決策。

---

### P8 — 收尾

- 刪 `_zkmixins.less`、`_zkvariables.less`、`_header.less`、`_zkcssvariables.less`
- 移除 `zkless-engine` 依賴、pom 的 `zklessc` execution
- 更新 `readme.md`(目前寫著「We assume you're already familiar with Less」)
- 寫 migration guide:P4 的前綴政策、P7 的 profile/palette API 變更
- **同步義務**:ZK core `zk/zul/**/less` 那 66 個逐位元組相同的複本要一併處理(評估文 §4.4)

**G-zero**:全樹最終輸出 vs P0 baseline,差異必須完全等於 P4 + P5 + P7 三階段已核准的
delta 總和 —— 不多不少。

---

## 4. 風險

| 風險 | 對策 |
|---|---|
| 「編得過」不等於「輸出等價」 | 每階段 declaration diff;這正是 Phase 0 抓到 `grid-column: 1 / -1` 的方式 |
| minifier 取代 LESS 成為新風險源 | CleanCSS 會摧毀 `@scope`/裸 `@layer`;builder 內建防護 + 檢查 `output.warnings`(不只 `errors`) |
| 展開後 CSS 可讀性下降 | `//`→`/* */` 前處理保留段落註解(只對入口檔);人工複審分段 |
| 元件檔 mixin 展開產生重複宣告 | 複審項;非阻斷(語意不變) |
| P4/P5/P7 的 delta 審不完 | 三階段分開做,每階段的預期 delta 事先估算(P4 已估 ~980) |
| 決策未定就開工 | L-2(前綴政策)、L-5(FA 方向)分別是 P4、P6 的前置;P0–P3 不受影響,可以先做 |

---

## 5. 進度記錄

### 現況:repo 有兩套進度規定,兩套都不適用於本計畫

| 現有規定 | 形狀 | 為什麼不適用 |
|---|---|---|
| 全域 CLAUDE.md § Task Management | `tasks/todo.md` 勾選清單 + review 段 + `tasks/lessons.md` | 單一任務的暫存區(目前放的是 cross-cutting features 那件事),不是可並行的紀錄簿 |
| 元件 harness(`doc/orchestrator-playbook.md`) | `tasks/work-status.md`:一元件一列 + 狀態詞彙表 + orchestrator 單一寫入者 | 以「元件」為列;本計畫是階段式重構(P0–P8),沒有元件列 |

repo 裡真正**被 git 追蹤**的狀態文件都在 `doc/`,而且都是同一個模式:**規範與狀態分離**
(例:`doc/component-theme-variables-progress.md` 開頭明寫「本文件只記狀態,不定義規則」),
再用 `doc(...): record ...` 形式的 commit 逐步累積。

### 兩個要先處理的實務問題

1. **`tasks/` 在 `new_theme` 上完全沒有被追蹤。** 該分支 `.gitignore` 最後的裸 `tasks` 一行蓋掉了
   它上方註解宣告的意圖(「track design artifacts;ignore runtime state」)—— `git ls-files tasks/`
   回傳 **0 個檔案**,所以本計畫書的原稿不在版本控制裡。
   **P0 補充**:這條 ignore 是 **`new_theme` 分支專屬**的。`iceblue` 繼承 `master` 那份 5 行
   `.gitignore`,裡面沒有 `tasks` —— 所以在本分支上 `tasks/` 其實可以被追蹤。之所以仍然選 `doc/`,
   是因為 `doc/` 才是 repo 既有的「被追蹤的狀態文件」慣例,不是因為 `tasks/` 被擋。
2. **做事的地方看不到本計畫書。** P0 的 worktree 是 `../zkThemeTemplate-iceblue`,而該 worktree
   **沒有 `tasks/` 目錄**(未追蹤檔案不跟著 worktree 走)。在 `tasks/` 記進度等於記在執行者
   看不到的地方。

### 做法:記在 `iceblue` 分支上、被追蹤的 `doc/` 裡

- **規範** = 本文件(階段定義、G-zero/G-delta 判準)。
- **狀態** = `doc/iceblue-drop-less-progress.md`,在 `iceblue` 分支建立並追蹤 —— 跟著分支走、
  worktree 砍掉不會消失、PR 裡看得到。
- 本計畫書在 P0 一併搬進被追蹤的樹(放 `doc/`,或修掉 `.gitignore` 的裸 `tasks`),
  否則它無法和它所描述的工作一起被 review。
  **P0 已完成**:本文件即 `doc/iceblue-drop-less-execution-plan.md`,在 `iceblue` 分支上被追蹤。
  `new_theme` 上的 `tasks/iceblue-drop-less-execution-plan.md` 原稿自此為歷史副本,不再更新。

進度文件的形狀 —— 一階段一列:

| 階段 | 狀態 | 閘門 | 量測 | commit | 日期 |
|---|---|---|---|---|---|
| P0 | DONE | G-zero | files differing: 0(77 檔 / 14807 條) | `abc1234` | — |
| P1 | TODO | G-zero | — | — | — |

- 狀態詞彙沿用 harness 既有的(`TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`),不另創一套。
- 每跑一次 `cssdiff` 就在**附加式**的〈閘門紀錄〉段加一行(階段、baseline、差異檔數、差異條數)。
  P8 的最終核帳要靠這份紀錄把 P4 + P5 + P7 的 delta 加總對上 —— 沒有逐次紀錄就核不了帳。
- P3 的 74 檔逐批進度記在同一份文件的〈P3 批次〉小節(批 1 / 批 2 / 批 3 各自的檔案清單與勾選)。
- 踩到的坑照全域規定寫進 `tasks/lessons.md`(那份是刻意不追蹤的個人筆記)。

---

## 6. 現在需要你決定的

**可以立刻開工的:P0 → P1 → P2 → P3。** 這四階段全部是 G-zero,不需要任何政策決策,
而且 P3 是工作量主體。做完就已經證明了核心命題(「IceBlue 不需要 LESS」),
剩下的都是有意識的取捨。

其中 **P1 是可選的**(理由見該節):它不改變任何交付物,只是過渡窗口的 exit-0 護欄。
要不要留這個 pin 是唯一一個落在 P0–P3 範圍內的取捨。

**在 P4 之前要定**:L-2 —— IceBlue 作為 add-on 的瀏覽器支援聲明。
**在 P6 之前要定**:L-5 —— ZK 11 的 icon 方向(FA / Lucide)。
**在 P7 之前要定**:L-4 —— compact profile 的替代機制。

要我直接從 P0 開始嗎?
