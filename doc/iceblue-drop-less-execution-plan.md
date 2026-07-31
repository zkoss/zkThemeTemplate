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
| 13 | **有第二個 `_zkvariables.less`** | `zkmax/less/_zkvariables.less`,4 行 2 條,而且**不是 token**(`@iphone`/`@android` 是 media query 字串)→ §P8 的例外分類要加一類,刪檔清單要加一檔。**更正(prereq 實測)**:這兩條**是死的** —— `tablet.less:2` 只是 `@import` 了這個檔,但全樹 153 個 `.less` 對這兩個名稱是 **0 次引用**。分類要加,但 P7 不需要為它們編列移植工作 |
| 14 | `_zkmixins.less` 是 **30 個名稱 / 38 個定義列** | ~~24 個名稱~~、~~32 個定義~~ 都是量錯的。`24/32` 與 `30/38` 各自內部一致,`24/38` 各取一個 —— 描述不了任何檔案。`24` 來自 `\w`-only 的名稱 pattern,會**無聲丟掉 6 個帶連字號但可呼叫**的 mixin(`.encodeURL-verGradient`、`.gradient-ver/-hor/-diagm/-diagp/-rad`)。38 個定義列則一直是對的:差額是 LESS 的同名多載(依參數個數或 `when` guard 分派) |
| 15 | **11 個 mixin 是死的**(30 個中),分佈在 38 個定義列裡的 13 列 | 整個 gradient / IE9 堆疊。輸出端獨立佐證:baseline 裡 0 個 `linear-gradient`、`radial-gradient`、`-webkit-gradient(`、SVG data URI、`progid:` |
| 16 | **§P4 的估算被獨立重現,分毫不差** | 呼叫點 `borderRadius` 103、`boxShadow` 46、`transform` 42、`applyCSS3` 30、四角 24 = **245**,展開 **1225** —— 用另一支獨立寫的 parser 數出同樣結果 → P4 的 ≤1127 上限更可信 |
| 17 | **taglib header 是「一行」不是「三行」** | `--compress` 輸出裡三個 directive **無分隔字元串接、後面沒有換行**,CSS 緊接著開始(`button.css.dsp` 前 200 bytes 有 **0** 個換行)。P2 的 `build-css.js` 要照這個形狀產生 |
| 18 | **`norm.css.dsp` 的 taglib 在檔案中間**(byte 43088 / 72140) | 它先是 ~43 KB 的 `:root{--zk-*}`,**然後**才三個 taglib,再 normalize.css + `<c:if>` reset —— directive 落在 `norm.less` 引入 `_reset.less` 的接縫上。JSP page directive 位置無關所以合法,只是少見。**前提 #9 仍然成立**(真正完全沒有 header 的還是那 3 檔;77 檔中有 73 檔以 header 開頭)。影響:P2 的 builder **不可以假設「header 一定在 offset 0」**,P5 串接 norm 時要保留它在接縫的位置,不能上提 |

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

推論要講清楚:**P0–P3 與 P6 不需要截圖。** 這幾階段是 G-zero,declaration 相同就等於 render 相同,
截圖只會增加 flake、不會增加資訊。硬加視覺檢查反而製造一種假的安心感。
真正需要視覺 A/B 的機制見 §2.4。

### 2.4 視覺 A/B harness(P4 的前置)

**在哪些階段有價值,差別很大 —— 不要一視同仁:**

| 階段 | 價值 | 理由 |
|---|---|---|
| P5 | **最高** | `browserDefault` 從 descendant selector 改成 `@scope`,是真的會改變「誰被選到」的結構性變更 |
| P7 | 中 | profile 從編譯期 import 插值改成 runtime override sheet,機制換了 |
| P4 | **最低** | 「`-webkit-border-radius` 是不是死前綴」是**瀏覽器支援政策**問題,Chrome 截圖答不出來。這裡真正的證據是 §P4 的 declaration delta,不是像素 |

**做法:重用 Marble 已有的 harness,不搬頁面。** Marble repo 已經有:

- 158 個 preview `.zul` 頁面
- `src/test/java/zk/example/iceblue/ThemePreviewIceblueApp.java`(:8081)
- `scripts/capture-iceblue.js`、`scripts/render-iceblue-baseline.sh`
- pom execution `preview-app-iceblue`、Playwright 專案與既有 baseline

要補的只有一件事:**讓 preview app 能載入本模板編出來的 theme jar**。
現況 `ThemePreviewIceblueApp.java:27` 是刻意**不設** preferred theme —— 它渲染的是 ZK 內建的
iceblue,不是本模板的輸出。所以 A/B 的兩邊應該是**同一分支的兩次 build**:

```
P0 的 LESS build  →  theme jar A   ┐
                                    ├─→ 同一組 preview 頁面 → 截圖 diff
轉換後的 CSS build →  theme jar B  ┘
```

**兩個必須寫下來的限制:**

1. **157/158 個頁面用到 Marble 的 `z-*` utility classes,IceBlue 沒有這些 class**(§0 已排除移植)。
   對「自己比自己」的 A/B 這是可接受的 —— 兩邊一樣沒有 utility,而被轉換的 CSS 是**元件內部**的,
   照樣渲染。但**訊號品質會下降**:塌掉的版面可能遮住 P4/P5 改到的 border / shadow / spacing。
   看到乾淨的 diff 時要記得這一點,別把「沒看到差異」當成「沒有差異」。
2. **先證明儀器,再相信儀器。** 跟 P0 對 `cssdiff` 做的一樣:先拿**同一個 build** 截兩次、
   確認 diff 為零,才能開始拿它比對兩個不同 build。

**不做**:把 158 個 `.zul` + 221 個素材(9.2 MB)+ composer/VM Java 搬進本 worktree。
那會產生第二份會各自漂移的 preview 語料,而且本分支沒有 Playwright / npm test 相依。
「讓模板本身附帶更豐富的 preview 語料」(模板現在只有 `preview.zul`,`readme.md:84` 是叫使用者
自己加)是**產品改善,不是轉換需求** —— 與 §0 其他排除項同一個理由。

### 2.5 commit 粒度:為了 fork-merge,不是為了 AI 考古

`readme.md:20` 寫得很明白,本模板的使用方式是 **fork**,而且理由正是
「easier to merge bug fixes from the original repository and **migrate to the new version**」。
所以 merge 衝突的品質**直接取決於 commit 粒度** —— 這是本節的主要理由,比「留給 AI 看歷史」強得多。

一個客戶 fork 之後客製了 `button.less`。若整個 P3 是一顆 commit,他 merge 上游時會對一個
74 檔的巨大變更產生衝突;若是一檔一顆,git 能自動解掉他沒動過的絕大多數,衝突被侷限在那一檔。

**粒度跟著「變更的性質」走,不是跟著階段走:**

| 階段 | 粒度 | 理由 |
|---|---|---|
| P3 | **一檔一顆**(~74) | 變更是**逐檔特有**的。commit message 由 `less2css.js` 統一產生(檔名、輸出端條數、`cssdiff` 結果)。批次仍然是**複審與閘門**單位,但不再是 commit 單位 |
| P4 | 一顆 | 規則是**均勻**的(移除死前綴),客戶可以機械式重新套用,不需要逐檔歷史 |
| P5 | ~5 顆 | 每個拆出來的檔案都是一個獨立的結構決策 |
| P7 | 1–2 顆 | 對外 API 變更,與 migration guide 的條目成對 |

**要對 AI 的作用講實話**(免得高估):commit 歷史**是**有幫助,但它是三種機制裡**最弱**的一種 ——
它帶的是**個案**而不是**規則**,需要 clone 完整歷史再翻 70+ 顆 commit,而 P3 的 diff 特別不會教人
(刪掉 40 行 LESS、加上 120 行展開後的 CSS,那是規則的一次套用,不是規則本身)。
真正讓升級可行的是 §P8 的**規則表**與**可執行的工具**。粒度值得做,但理由是 fork-merge。

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
> (`tablelayout` 1 條、`cardlayout` 4 條)。批 1 太小,不足以驗證腳本,所以改成以輸出端條數分界。
>
> **2026-07-30 實測**:三個批次的檔數估計(`~8 / ~55 / ~11`)也**都不對**,已用
> `cssdiff --list` 實測更正如下。

- 批 1(**20** 檔,≤20 條;原估 ~8):`tablelayout` 1、`cardlayout` 4 起算 —— 目的是驗證
  **腳本本身**,不是趕進度。這批要逐檔人工看過展開結果。
  20 檔比原估的 8 檔**更好**:語料更大,但每檔仍 ≤20 條,人工逐檔看得完。
- 批 2(**43** 檔,21–200 條;原估 ~55):一般元件
- 批 3(**11** 檔,>200 條):`popup` 217、`menu` 218、`tabbox` 237、`colorbox` 246、
  `listbox` 261、`biglistbox` 299、`tbeditor` 375+380、`goldenlayout` 413+413、`combo` 586

20 + 43 + 11 = **74** ✓(= 77 個輸出減掉 `norm`/`font-awesome`/`tablet` 三個留在 LESS 的)。

檔案清單仍由 `scripts/cssdiff.js --list` 的條數排序在開工時決定,不預先寫死 ——
但**檔數要對得上**:上面三個數字是斷言,對不上就代表推導錯了或樹動過,要停下來查,
不能改斷言去迎合實測結果。

**保留在 LESS 的**:`norm.less`(P5)、`font-awesome.less`(P6)、`tablet.less`(P7)。

**G-zero**:每一檔、每一批,以及全樹。

**commit 粒度:一檔一顆(~74 顆)**,理由見 §2.5(fork-merge 衝突侷限化)。
批次仍是複審與閘門單位,但不是 commit 單位。message 由 `less2css.js` 統一產生,內容至少要有:
被轉換的檔名、輸出端 declaration 條數、該檔 `cssdiff` 的結果。

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

**commit 粒度:一顆**(§2.5)—— 規則均勻,客戶可機械式重新套用。

**視覺 A/B 在這一階價值最低**(§2.4):截圖回答不了「這個前綴在我們宣告支援的瀏覽器裡是不是死的」。
這一階的證據是上面的 declaration delta 加上 L-2 的支援政策,不是像素。
但 §2.4 的 harness 應該在**進入 P4 之前**就架好並自我驗證過,因為 P5 會真的需要它。

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
- 842 個 token declaration 必須**零差異**(這部分是純搬移;P0 已重驗:正好 842 條、全在 `:root`、
  842 個不重複名稱)
- reset 部分是刻意的結構改變 → 需要 `browserDefault` 開/關兩種設定下的 computed-style A/B
- 必須沿用 Marble 已記載的限制:open float 會被移到 `document.body`、落在 `.z-page` 之外
  ——`master` 現行的 descendant-selector 做法有**同樣**限制,所以不是回歸,但要寫進文件

**這是視覺 A/B 價值最高的一階**(§2.4):descendant selector → `@scope` 改變的是「誰被選到」,
declaration diff 看不出這件事,computed-style A/B 與截圖 A/B 在這裡是**必要**的補充,不是加分項。

**commit 粒度:~5 顆**(§2.5)—— 上面每個拆出來的檔案各自是一個獨立結構決策。

---

### P6 — Font Awesome 生成

`font-awesome.less`(來源端 910 條 → **輸出端 4545 條**)是 `each()` + 遞迴 mixin 產生的。

> **決策已定(2026-07-30):Font Awesome 保留。** L-5 拍板 —— ZK 11 繼續用 FA。
> 本階段因此走「FA 保留」分支,**不是**刪除 + 空 stub 分支。P6 從 BLOCKED 轉 TODO。

- ✅ **FA 保留** → 寫 `scripts/gen-fa-css.js`(Marble 的 `getLucideIcons()` 是同一形狀的先例)
- ~~若 FA 移除 → 本階段變成刪除 + 空 stub~~(不採用)

**為什麼這一階是「產生器」而不是「轉換」**:P3 其他 74 檔都適用「拿編譯輸出當新來源」,
但這裡那樣做會產出一個 **4545 條、沒有人維護得動**的檔案,而且每加一個 icon 都要手改。
所以要寫的是 icon 清單 + 產生邏輯,不是把展開結果存檔。
使用者必須能在**不手改 4545 條**的前提下加一個 icon —— 這是驗收條件。

**相依於 P2**:產生出來的 `.css` 需要 `build-css.js` 才會變成 `.css.dsp`。P2 未完成就跑 P6,
閘門會把該檔報成 missing —— 那看起來像產生器寫錯,其實不是。順序:P2 → P6。

**G-zero**:**4545** 條 declaration 零差異(~~910~~ 是 `.less` 來源端條數;`each()`
展開後輸出端是 4545,為全樹最大單檔)。

**閘門的盲點要另外補**:條數相符**不代表** codepoint 正確 —— 一個寫錯的 codepoint
條數照樣過關,只是渲染出錯的字形。所以 P6 除了 G-zero 還要抽驗 codepoint 對應,
並實測「加一個 icon → 重新產生 → 只多出預期的宣告 → 移除後回到 0」這個往返。

> Marble 的 `font-awesome.css.dsp` 是**空 stub**(Marble 自己做 Lucide mask)。
> 那是 Marble 的決定,**與本分支無關** —— 兩個主題在 icon 這件事上分道揚鑣是預期的。

---

### P7 — `tablet.less` + `@themeProfile` / `@themePalette`

`tablet.less`(輸出端 **681** 條)依 profile 分成 `tablet/default/` 與 `tablet/compact/` 兩套,
並且用了 LESS 的 **import path 插值**(`@import "profiles/_@{themeProfile}"`)——
這是 LESS 獨有能力,純 CSS 沒有對應物,但也不需要:兩個 profile 只是同一組 842 個
`--zk-*` 的不同數值,改成 runtime override sheet 即可。

**G-delta**:這是刻意的對外 API 變更(「改 LESS 變數重編 jar」→「載入 override sheet」),
必須寫進 migration guide。與評估文 L-4 同一決策。

**視覺 A/B 價值中等**(§2.4):機制換了,值得比對;但 tablet 需要 mobile UA 的 Playwright 專案。

**commit 粒度:1–2 顆**(§2.5),與 migration guide 的對應條目成對進版。

---

### P8 — 收尾

#### ⚠ 前置:規則表要在刪檔**之前**產生(這一項有期限)

`_zkvariables.less` 與 `_zkmixins.less` 一旦刪掉,下面兩張表就只能靠考古還原。
**產生器必須在這兩個檔還存在時跑完並提交。**

> **✅ 已完成(2026-07-30)。** 產生器與兩張表都已產出並提交,期限風險解除。
> `scripts/gen-var-table.js`(`npm run gen:var-table` / `check:var-table`)、
> `scripts/gen-mixin-table.js`(`gen:mixin-table` / `check:mixin-table`),兩支都自帶斷言、
> 輸出跨次執行 byte-identical、且可在**客戶自己的 fork** 上重跑(`--fork` 把 drift 降級為報告)。

| 產出 | 內容 | 來源(P8 會刪掉) |
|---|---|---|
| `doc/migration/less-var-to-token.md` + `.json` | 844 + 2 = **846** 列。其中 **834** 列**語法上**是乾淨的 1:1 `@var → var(--zk-token)`,但只有 **830** 列**行為上**可以機械改名(見下);例外共 **16** 列 | `_zkvariables.less` ×**2 檔** |
| `doc/migration/mixin-to-css.md` | **30** 個 mixin(分佈在 **38** 個定義列 —— LESS 允許同名依參數個數或 `when` guard 多載)各自展開成什麼,含 11 個死 mixin 標記與 §P4 交叉引用 | `_zkmixins.less` |

例外從原記的 10 條變成 **16** 條:12 條是**分類上**的例外,另 4 條**語法上是 1:1、行為上不是**:

| 類別 | 項目 |
|---|---|
| 設定字串(不是 token) | `@themeProfile`、`@themePalette` |
| 圖檔路徑 | `@loadingAnimationDefer`、`@loadingAnimationLoad`、`@sliderTicks`、`@progressmeterBackgroundImage` |
| 一對多 token 清單 | `@containerButtonColors`、`@borderlayoutCollapsedIconColors`、`@splitterButtonTextColors`、`@menuScrollableIconColors` |
| **media query 字串**(前提 #13) | `@iphone`、`@android` —— 而且**兩條都是死的**,全樹 0 引用 |
| **data URI 內的 `var()`**(CAVEAT-2) | `@iconColor`、`@activeColor`、`@inputDisableColor` |
| **編譯期顏色函式運算元**(CAVEAT-3) | `@baseBackgroundColor` |

**產生器要自帶斷言**(846 / 834 / 16 / **30** 名稱 / 38 定義列),對不上就 fail —— 否則表格會
無聲漂移,而它一旦漂移,發現的人是客戶而不是我們。

#### ✅ 已解決:覆寫 token 不等價於覆寫 LESS 變數(原本列為「還沒解決」)

原問題:覆寫 `--zk-color-primary` 是否**行為上**等價於覆寫 `@colorPrimary`?
**答案是不等價**,而且是三個獨立方向。全部實測驗證,全部**先於本次轉換就存在於 master**,
`cssdiff` 逐條比對看不到它們(它們原樣通過),所以閘門不受影響:

| | 機制 | 證據 |
|---|---|---|
| **CAVEAT-1** | 覆寫 LESS 變數會把 `var(--zk-token)` **換成字面值**,token 從編譯輸出裡**消失** → 下游的 runtime 覆寫從此無聲失效。LESS 覆寫比較「強」但比較不可組合 —— 這正是 `readme.md:8-10` 在警告的事 | 編譯輸出 |
| **CAVEAT-2** | `var()` 落在 `data:image/svg+xml` URI **裡面**,不會對宿主頁面求值 → 覆寫 token 完全無效,覆寫 LESS 變數才有效 | `baseline/js/zul/wgt/css/selectbox.css.dsp` 內含 URL-encoded 的 `fill='var(--zk-icon-color)'`;來源 `js/zul/wgt/less/selectbox.less:3-5` |
| **CAVEAT-3** | `contrast(@baseBackgroundColor)`:值是 `var()` 時 LESS **無法求值**,原樣輸出成 `contrast(var(--zk-base-background-color))` —— 而 CSS **沒有**產生顏色的 `contrast()`(只有 `filter: contrast()`),所以該宣告**無效、被瀏覽器丟棄**。值是字面值(`#FFFFFF`,正是 `readme.md:69` 建議的客製方式)時,LESS 編譯期算成 `background: #000000`。**覆寫 LESS 變數會啟用一條目前失效的宣告;覆寫 token 永遠影響不到這個位置** | `js/zkmax/big/less/biglistbox.less:281,389`,以隔離的 `lessc` 執行驗證;未求值的形式原樣出現在 baseline 輸出裡 |

CAVEAT-3 是**master 既有的潛在 bug**,不是轉換造成的 —— 但它必須寫進 migration guide,
因為一個照著 `readme.md:69` 做的客戶會**意外啟用**它。

窮盡掃過全樹確認例外集合完整:153 個 `.less` 裡只有 **16 處**編譯期函式呼叫吃 `_zkvariables`
的變數 —— 2 處 `contrast()`(上面那條)與 14 處 `extract()`(就是那 4 條一對多清單,分類正確)。
沒有 `@media` prelude 引用變數,`calc()` 之外沒有變數算術。

**為什麼這是最有價值的升級產出**:`readme.md:69` 建議客戶「以覆寫變數的方式客製」,所以一個
守規矩的客戶的客製內容**幾乎就是一堆變數覆寫**。他的遷移因此主要是**改名**:
`@colorPrimary: red` → `--zk-color-primary: red`。有了這張表,AI 幾乎可以機械式完成;沒有這張表,
就得逐一猜對應關係。

#### 前置:把工具做成客戶可執行

- `scripts/less2css.js` + `scripts/cssdiff.js` 要能在**客戶自己的 fork** 上跑:
  他把自己的 `.less` 轉成 `.css`,並用同一道閘門**證明**轉換前後等價。
  邊際成本接近零(P3 本來就要做這兩支),而且比歷史有用 —— 這是「教他釣魚」那一項。
- migration guide 要寫明**逃生門**:客戶可以把被刪掉的 partial(`_zkvariables.less`、
  `_zkmixins.less`、`_header.less`)vendor 進自己的 fork,繼續用 LESS。
  **「升級到 ZK 11」和「跟著棄用 LESS」是兩個可以分開的決定** —— 不要讓客戶以為被迫一起做。

#### 收尾本體

- 刪 `_zkmixins.less`、`_zkvariables.less`(**兩個** —— `zul/less/` 與 `zkmax/less/`,前提 #13)、
  `_header.less`、`_zkcssvariables.less`(**確認上面兩張表已提交後**才刪)
- 移除 `zkless-engine` 依賴、pom 的 `zklessc` execution
- 更新 `readme.md`:目前寫著「We assume you're already familiar with Less」(第 6 行),
  以及第 45–51、68–77 行整段以 LESS 變數/`_header.less` import 為前提的客製教學都要改寫
- 寫 migration guide:P4 的前綴政策、P7 的 profile/palette API 變更、上面兩張規則表、逃生門
- **同步義務**:ZK core `zk/zul/**/less` 那 66 個逐位元組相同的複本要一併處理(評估文 §4.4)

**G-zero**:全樹最終輸出 vs P0 baseline,差異必須完全等於 P4 + P5 + P7 三階段已核准的
delta 總和 —— 不多不少。核帳資料來自進度文件的〈閘門紀錄〉。

---

## 4. 風險

| 風險 | 對策 |
|---|---|
| 「編得過」不等於「輸出等價」 | 每階段 declaration diff;這正是 Phase 0 抓到 `grid-column: 1 / -1` 的方式 |
| minifier 取代 LESS 成為新風險源 | CleanCSS 會摧毀 `@scope`/裸 `@layer`;builder 內建防護 + 檢查 `output.warnings`(不只 `errors`) |
| 展開後 CSS 可讀性下降 | `//`→`/* */` 前處理保留段落註解(只對入口檔);人工複審分段 |
| 元件檔 mixin 展開產生重複宣告 | 複審項;非阻斷(語意不變) |
| P4/P5/P7 的 delta 審不完 | 三階段分開做,每階段的預期 delta 事先估算(P4 已實測校準為 ≤1127) |
| 決策未定就開工 | L-2(前綴政策)、L-5(FA 方向)分別是 P4、P6 的前置;P0–P3 不受影響,可以先做 |
| **規則表隨 P8 刪檔一起消失** | `@var → --zk-token`(834/844)與 24 個 mixin 的對應表**只存在於即將被刪的檔案裡**。P8 把「產生器先跑完並提交」列為刪檔前置(見 §P8) |
| **基準被污染,閘門變成空轉** | P3 之後若重跑基準建置,`cssdiff` 會拿轉換結果跟自己比,回報 0 卻什麼都沒證明。`scripts/baseline.js` 預設拒絕覆寫,且在 `.less` 檔數為 0 時拒絕執行(P0 已實作) |
| **視覺 A/B 訊號被塌掉的版面遮住** | 157/158 個 preview 頁面依賴 IceBlue 沒有的 `z-*` utility。截圖乾淨**不等於**沒有差異;P5 要同時做 computed-style A/B,不能只看圖(§2.4) |
| **一顆巨大 commit 讓客戶 merge 不了** | 客戶的升級路徑是 fork + merge(`readme.md:20`)。P3 一檔一顆 commit,把衝突侷限在他真正改過的檔案(§2.5) |

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
| P0 | DONE | G-zero | files differing: 0(77 檔 / 14323 條) | `ae4ca36` | 2026-07-29 |
| P1 | BLOCKED | G-zero | — | — | — |

- 狀態詞彙沿用 harness 既有的(`TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`),不另創一套。
- 每跑一次 `cssdiff` 就在**附加式**的〈閘門紀錄〉段加一行(階段、baseline、差異檔數、差異條數)。
  P8 的最終核帳要靠這份紀錄把 P4 + P5 + P7 的 delta 加總對上 —— 沒有逐次紀錄就核不了帳。
- P3 的 74 檔逐批進度記在同一份文件的〈P3 批次〉小節(批 1 / 批 2 / 批 3 各自的檔案清單與勾選)。
- 踩到的坑照全域規定寫進 `tasks/lessons.md`(那份是刻意不追蹤的個人筆記)。

---

## 6. 現在需要你決定的

**P0 已完成並過閘**(`ae4ca36`,`files differing: 0`)。

**可以立刻開工的:P2 → P3。** 兩階段都是 G-zero,不需要任何政策決策,而且 P3 是工作量主體。
做完就已經證明了核心命題(「IceBlue 不需要 LESS」),剩下的都是有意識的取捨。

其中 **P1 是可選的**(理由見該節):它不改變任何交付物,只是過渡窗口的 exit-0 護欄。
要不要留這個 pin 是唯一一個落在 P0–P3 範圍內的取捨 —— **尚未拍板**。

**在 P4 之前要定**:L-2 —— IceBlue 作為 add-on 的瀏覽器支援聲明。
~~**在 P6 之前要定**:L-5~~ → **已定,見下表**。
**在 P7 之前要定**:L-4 —— compact profile 的替代機制。

### 已拍板的三件事(2026-07-30)

| 議題 | 決定 |
|---|---|
| 視覺檢查怎麼做 | **重用 Marble 既有的 harness,不搬 preview 頁面進本分支**。範圍限 P4/P5/P7,P0–P3/P6 是 G-zero 不需要截圖。見 §2.4 |
| commit 粒度 | **P3 一檔一顆,之後按政策一顆**。理由是 fork-merge 衝突侷限化(`readme.md:20`),不是 AI 考古。見 §2.5 |
| **L-5 —— icon 方向** | **Font Awesome 保留**。P6 走「寫產生器」分支,不是「刪除 + 空 stub」。**P6 解除 BLOCKED**,但相依於 P2。見 §P6 |

連帶新增兩個**前置工作項**(不是新階段,不產生 theme 輸出):
視覺 A/B harness(P4 前)、規則表產生器(P8 前,**有期限** —— 來源檔會被刪)。

### 執行機制

`scripts/workflow/iceblue-drop-less.mjs` —— 一次跑一個階段(`{phase:"prereq"|"P2"|"P3"|"P6"}`,
P3 可加 `{batch:1|2|3}`)。被 gate 住的階段會回報 blocked 與原因,不會偷跑。
形狀是**序列轉換 → 並行複審 → 序列套用複審結果**;為什麼轉換不並行、階段之間為什麼不串接,
寫在腳本開頭的註解與進度文件的〈執行機制〉。

**現在最該跑的是 `prereq`** —— 它是唯一**有期限**的工作項(來源檔在 P8 被刪),
而且它不動 theme 輸出、動不到閘門。
