# 第 4 層獨立驗證報告 —— P5:norm 轉純 CSS(tokens + palette + reset + globals)

> 覆核者:第 4 層獨立 agent(唯讀,未 commit、未改動任何受版控檔案)。
> 驗收對象:`fea5f32`(build-css.js 機制)+ `a03edcf`(轉換本體),P5 之前的 HEAD 為 `5958d1b`。
> 工作目錄 `/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`,分支 `iceblue`。
>
> **本報告的每一個數字都是自己下指令重新量的**,沒有一格 證據 是抄 commit message 或既有文件。
> 部分項目刻意用**與專案自帶工具不同的方法**重推(見 C4),目的是找出工具本身可能遮蔽的差異。

## 0. 環境備註(重要 —— 驗證期間 HEAD 移動過)

開工時 `git log --oneline -1` 實測 HEAD = `a03edcf`。驗證進行到 C9 之後再查,HEAD 已變成 `dde09ee`,
中間多了 3 顆 commit:

| commit | 時間 | 影響 |
|---|---|---|
| `1c8cdca` | 14:54 | 只動 doc |
| `8d391d3` | 14:56 | **動到 CSS 來源**:`_reset.css`、`norm.css`、`tokens/_{default,compact}.css` |
| `dde09ee` | 14:58 | 只動 doc + `tasks/p5-browserdefault-options.md` |

**已確認這件事沒有讓任何一條判定失效**,方法是把 `a03edcf` 的來源樹另外取出來重建、與現況輸出逐 byte 比對:

```
git archive a03edcf src/main/resources/web | tar -x -C <scratch>
node scripts/build-css.js -s <scratch>/src/main/resources/web -o <scratch>/out
diff -rq <scratch>/out target/classes/web/iceblue_css     # 84 檔無一行 "differ"
cmp <scratch>/out/zul/css/norm.css.dsp target/classes/web/iceblue_css/zul/css/norm.css.dsp   # exit 0
```

即 `8d391d3` 的來源改動是**輸出中性**的(把 53 個行尾註解移回各自宣告上方),
`a03edcf` 與 `dde09ee` 兩個來源樹產出的 84 個 `.css.dsp` **逐 byte 相同**(`norm.css.dsp` 兩邊皆 **72900 B**)。
**C1–C4、C7、C8 都在 `dde09ee` 上重跑過一次**,數字與第一輪完全相同,下表引用的是重跑值。
仍列為〈發現 1〉,因為 commit message 裡的數字是在一個此後已變動的樹上量的。

其餘:`git status --short` 全程為空(除了驗證期間被 `dde09ee` 收進版控的 `tasks/p5-browserdefault-options.md`),
本報告只在 scratchpad 底下寫檔,未使用 `npm run baseline`,未 `git checkout` 任何東西。

## 1. 結論

**PASS-WITH-FINDINGS。** 9 條斷言 **全部 CONFIRMED**,其中 **C4 用比專案自帶分類器更嚴格的方法重驗,結論更強**
(不只是「落在封閉清單內」,而是「在保留 descendant combinator 與值元數的正規化下逐 byte 相同」)。
6 項發現皆**不推翻任何一條斷言**:1 項是流程觀察(HEAD 移動)、1 項是**新機制未設守衛的真缺口**(佔位符還原)、
1 項**局部推翻 commit message 的措辭**(var-table「逐項相同」不精確)、其餘 3 項是文件漂移與既有缺口。

## 2. 逐條結果表

| # | 斷言 | 判定 | 證據 |
|---|---|---|---|
| C1 | 閘門未移動:`npm run check:cssdiff` 為 85 檔 / 14863 條 / files differing: 0 | **CONFIRMED** | 實跑 `npm run check:cssdiff`,尾段輸出逐字為 `files compared:  85` / `declarations:    14863` / `files differing: 0`。中段可見兩條工具鏈同時作用:`success: compiled 1 file(s)`(zklessc,只剩 `zkmax/less/tablet.less`)與 `build-css: compiled 84 file(s)`(比 P5 前多 1 檔,即 `norm.css`)。**在 `dde09ee` 上重跑一次,三個數字完全相同**;`mvn clean package` 重寫 `target/` 之後再單獨跑 `node scripts/cssdiff.js baseline/ target/classes/web/iceblue_css`,仍是 85 / 14863 / **0**。另核:`git diff --stat 5958d1b..a03edcf -- baseline/ doc/baseline-manifest.sha256` **輸出為空** ⇒ P5 沒有動基準,閘門不是靠改基準過的;`npm run check:baseline` 印出 `check:baseline OK — 86 files match doc/baseline-manifest.sha256`。 |
| C2 | `check:bytes` UNEXPLAINED 0;`check:build-css` 84 covered、全部來自真來源、0 unclassified | **CONFIRMED** | `npm run check:bytes`:`files compared: 85` / `byte-identical: 25/85` / `differing but explained: 60` / **`UNEXPLAINED: 0`** / `OK — zero semantic bytes differ anywhere in the tree.`。`npm run check:build-css`:`through build-css.js: 84 file(s)` / `of which: 84 converted (real source), 0 reconstructed from LESS` / `passthrough: 1 file(s)` / `byte-identical: 24/84` / `byte-differing: 60 — all accounted for by serialization class`,**沒有出現 `⚠ … differ in a way NO known class explains` 那一段**(即 unclassified 0),結尾 `OK — build-css.js reproduces baseline/ from CSS sources.`。內含的 declaration diff 亦為 85 / 14863 / **0**。中段 `2/5  + 84 already-converted source(s) copied verbatim, plus 5 partial(s) they @import` 佐證 84 檔確實全部走真來源、零重建。兩支都在 `dde09ee` 上重跑,數字相同。 |
| C3 | 兩側 DSP 對等:90 個 `${".z-page "}`、93 個 `<c:if `、93 個 `</c:if>`、建置側 0 個 `${}` 腐化、恰好 3 個 taglib、header 仍在 tokens/reset 接縫(非 offset 0) | **CONFIRMED** | 對 `baseline/zul/css/norm.css.dsp`(**72837 B**)與 `target/classes/web/iceblue_css/zul/css/norm.css.dsp`(**72900 B**)分別跑 `/usr/bin/grep -o` 計數:前綴 **90 = 90**、`<c:if ` **93 = 93**、`</c:if>` **93 = 93**、`${}"` **0 = 0**、`<%@` **3 = 3**。header 位置用 `node -e "…indexOf('<%@ taglib')"` 量:baseline **43785**、建置側 **43840**,**兩側皆遠離 0**,確實坐在 tokens/reset 接縫上(差 55 B 是 tokens 區的序列化差,見 C4)。另用 `<c:if[^>]*>` 全掃拼法種類:**兩側都只有 2 種**,分別出現 **3** 次與 **90** 次,沒有第三種變體。 |
| C4 | baseline 與建置 `norm.css.dsp` 的每一處差異都落在 `check-build-css.js` 的封閉序列化類別內,且沒有一處牽涉 DSP、EL、選擇器語意或 declaration | **CONFIRMED(用更嚴格的方法)** | **(a) 自行切塊逐塊比對**:自寫腳本把兩檔以 `}` 切塊(保留分隔符),**兩側皆 356 塊**(專案 commit 記的 357 是 `split('}')` 含尾端空字串的口徑,兩側皆 357,非矛盾)。**20 / 356 塊有差異**,套 `classify()` 後分佈:`whitespace around , and >` 11、`leading zero on decimals` 6、兩類合併 2、三類合併 1,**UNEXPLAINED 0**。**(b) 三道獨立語意閘**(對全部 20 塊逐塊跑):DSP/EL token 序列(`<x:y`、`<%`、`${` 全抓)不同者 **0 塊**;選擇器不同者 **0 塊**;declaration 集合不同者 **0 塊**。**(c) 不信任專案分類器,另建嚴格正規化器**:第 4 類 `whitespace around , and >` 實作其實是 `replace(/\s+/g,'')` **全刪空白**,比它的名字寬得多 —— 這會連 descendant combinator(`a b` vs `ab`)這種**真的改語意**的差異一起吃掉。因此另寫只刪「CSS 標點 `{}(),;:>+~` 兩側」空白、其餘空白折成單一空格的正規化器,再加前導零 / `0px` / `;}` 三項,結果:**`strict-normalized EQUAL: true`,兩側正規化後皆 72646 B** ⇒ 在**保留 descendant combinator 與值元數**的前提下兩檔仍完全相同,差異確定不含語意。**(d) 人工逐條過目**:再把 20 塊以 `;` 細切,得 **45 個相異片段、0 個片段數不符**,全部親眼看過,類型只有四種 —— `rgba(0,0,0,.9)` vs `rgba(0, 0, 0, 0.9)`、`.67em` vs `0.67em`、`0` vs `0px`、`a>b` vs `a > b`(僅 3 處,`.z-error .button>.z-icon-times`、`#zk_proc>.z-modal-mask`、`.gecko .z-draggable-over>*`),以及 `background-image: url(…)` 的冒號後空白。**沒有一條是宣告增刪或選擇器改寫。** |
| C5 | build-css.js 的改動對 P5 之前的 83 個來源是惰性的 | **CONFIRMED** | `git archive 5958d1b src/main/resources/web \| tar -x -C <scratch>` 取出舊樹(實測 **83** 個非底線 `.css` entry、**1** 個 `_*.css` partial、**63** 個 `.less`);`git show 5958d1b:scripts/build-css.js > old-build-css.js` 取出舊腳本。兩支腳本各跑一次同一棵舊樹:舊腳本 `build-css: compiled 83 file(s)`、新腳本 `build-css: compiled 83 file(s)`。`diff -r out-old out-new` **無任何輸出(exit 0)**,兩邊檔數皆 **83** ⇒ **83/83 逐 byte 相同**。(舊腳本從 scratch 目錄執行需 `NODE_PATH=<repo>/node_modules` 才找得到 `clean-css`,已如此執行。) |
| C6 | 守衛沒有被放寬:真 DSP tag / 真 `<%` directive / 真 `@scope` / 裸 `@layer a,b;` / 未解析 `@import` 在來源裡仍讓建置失敗 | **CONFIRMED** | 在 scratch 建 8 個最小 `.css`,各自獨立來源目錄,逐一跑 `node scripts/build-css.js -s <dir> -o <out>`。**五項指定守衛全部 EXIT=1** 且訊息指名正確類別:`<c:if …>${".z-page "}</c:if>a{}` → `contains DSP tag in CSS (e.g. <c:if>)`;`<%@ taglib … %>a{}` → `contains taglib header already present in the source`;`@scope (.z-page){a{color:red}}` → `contains @scope`;`@layer base, components;` → `contains bare @layer order statement`;`a{color:red} @import url("nowhere.css");`(行中 + url 形式,`resolveImports()` 認不得)→ `contains unresolved @import`。附帶:`@import "does-not-exist.css";` 由 `resolveImports()` 先擋下,EXIT=1、訊息 `@import "…" does not resolve`。**放寬的邊界也實測了**:hostile 構造放在**一般註解**內 → EXIT=0(這是刻意的,壓縮器看不到它);放在 `/*!` 註解內 → **EXIT=1**,與腳本自述一致。 |
| C7 | `browserDefault` 語意端到端保住:3 個 `${empty …}` 區塊恰好包住 html/body/main 家族且無其他規則;90 個 `${not empty …}` 前綴各自貼在一個選擇器上,空白零增減 | **CONFIRMED** | 自寫腳本以**完整字面**(整段 `<c:if test="${empty c:property('org.zkoss.zul.theme.browserDefault')}">`)在兩檔各自定位。**(a) 3 個區塊,兩側逐項相同**:區塊 1 body **87 B / 3 條規則**,選擇器 `html`、`body`、`main`;區塊 2 body **22 B / 1 條**,選擇器 `html,body`;區塊 3 body **28 B / 1 條**,選擇器 `body`。**除這 5 條之外沒有任何規則被包進去。** **(b) 90 個前綴**:抽出每個前綴標籤到下一個 `{` 之間的字串,兩側各 90 筆,寫檔後 `diff` **exit 0(逐字相同)** ⇒ **沒有多一個或少一個空白**。其中 **28 筆**含 `,`,檢視後確認是多選擇器清單(`<前綴>b,<前綴>strong{…}` 這種每個選擇器各帶一個前綴的正確形狀),兩側計數與內容皆同。**(c) 全 `<c:if>` 區域文字比對**:以 `/<c:if[\s\S]*?<\/c:if>[\s\S]{0,60}/g` 抽出 **兩側各 60 個區域**,只有 **3 個** 不同,而且差異全部落在標籤**之後**的尾巴文字(`monospace, monospace`、`.35em`、`rgba(0, 0, 0, 0)`),**標籤本身 0 差異**。來源端交叉核對:`_reset.css` 有 **56** 個 `.ZKBD `、`norm.css` 有 **34** 個,56+34 = **90**;OFF-START/OFF-END 各為 1+2 = **3** 對,與輸出端完全對得上。 |
| C8 | 轉換沒有靜默丟東西(含閘門看不到的 `_compact.css`) | **CONFIRMED** | **(a) 輸出端 `:root`**:兩檔第一個 `:root{…}` 內 `--zk-*` 宣告數 **baseline 862 / built 862,unique 皆 862**,把兩份 token 名稱序列寫檔 `diff` **exit 0** ⇒ 名稱與**順序**逐一相同。以 `;` 細切該塊亦為 **A=862 / B=862**。**(b) 來源端行數**:`/usr/bin/grep -cE '^\s*--zk-'` 對 `tokens/_default.css` = **862**、`tokens/_compact.css` = **862**;對 `git show 5958d1b:…/profiles/_default.less` = **862**、`_compact.less` = **862**。**(c) 逐 token 名值比對(這才是關鍵)**:自寫腳本剝除 `//` 與 `/* */` 註解後抽 `--name: value` 對。`default`:862 vs 862、**only in css 0 / only in less 0**、**宣告順序完全相同**、殘留非宣告文字兩側皆為空字串、值差 **5** 筆 —— 全部是 LESS 的 `e('…')` escape 被解開(`e('round(up, …)')` → `round(up, …)`),即 zklessc 本來就會做的事。`compact`:862 vs 862、only-in 兩側皆 0、順序相同、值差 **1** 筆(`--zk-searchbox-icon-right: e('0px')` → `0px`),同一原因。**(d) `_compact.css` 端到端實證**(閘門完全看不到的那條路):見第 4 節,舊 `@themeProfile: "compact"` 的 LESS 建置與新 `@import "tokens/_compact.css"` 的 CSS 建置,`norm.css.dsp` 在嚴格正規化下**完全相同**。 |
| C9 | `mvn` 打包完好:jar 內 85 個 `.css.dsp`、0 個 raw `.css` / `.less` | **CONFIRMED** | `withjdk.sh 17 mvn -q clean package -Dmaven.test.skip=true`,**EXIT=0**。`unzip -Z1 target/iceblue_css-10.4.0-jakarta-Eval.jar`:220 個 entry,`.css.dsp$` **85**、`.css$` **0**、`.less$` **0**。(同時產出的 `-bundle.jar` 只有 4 個 entry,是把主 jar 包起來的外層,不是漏檔。)另抽驗內容而非只數檔名:`unzip -p … web/iceblue_css/zul/css/norm.css.dsp` 得 **72900 B**,`cmp` 對 `target/classes/…/norm.css.dsp` **exit 0**;jar 內該檔 `${".z-page "}` **90**、`<c:if ` **93**、`<%@` **3** ⇒ **DSP 有活著進 jar,不是被打包流程吃掉**。 |

驗證順序:C1 → C2 → C3 → C4 → C7 → C8 → C5 → C6 → C9(C9 會重寫 `target/`,刻意排最後);
發現 HEAD 移動後,C1–C4、C7、C8 全部在 `dde09ee` 上重跑一次。

## 3. 發現

### 發現 1(MEDIUM,流程)驗證期間來源樹被改動,commit message 的數字是在一棵此後已變動的樹上量的

見第 0 節。`8d391d3`(14:56)動到 4 個 CSS 來源檔,而 `a03edcf`(14:48)的 commit message 引用的
`files differing: 0`、`90 = 90`、`357 = 357` 等數字是在它自己那一刻量的。**本報告已證明兩棵樹輸出逐 byte 相同**
(`diff -rq` 84 檔無差異、`norm.css.dsp` 兩邊皆 72900 B),所以**結論不受影響**;
但「驗收對象是 2 顆 commit」這個前提在執行期間就已經不成立了。
**建議**:第 4 層驗收開跑後,實作端先停在一個標記點,或至少在交付書上寫明「驗收 commit 之後不再推進」。

### 發現 2(MEDIUM,新機制的真缺口)佔位符**還原**方向沒有守衛,而且套用在全部 84 個輸出上

`restorePlaceholders()` 在 `minify()` 裡是**無條件**呼叫的,對每一個來源都跑。
它做的是純字串 `split().join()`,**沒有任何「這個檔案是否應該含佔位符」的檢查**。實測:

```
來源 : a::after{content:".ZKBD "}
輸出 : a::after{content:"<c:if test="${not empty c:property('…browserDefault')}">${".z-page "}</c:if>"}
結果 : EXIT=0,無 error、無 warning
```

也就是說,**任何一個來源檔只要在任何位置出現字面 `.ZKBD `(含引號字串內),就會被靜默注入 DSP**。
同理,來源含**兩個** `/*!ZK-TAGLIB-HEADER*/` 會把三行 taglib **輸出兩次**,同樣 EXIT=0(實測確認)。

這正是 `build-css.js` 檔頭自己在講的那一類「compiled fine, output is wrong」風險,只是方向相反:
去程(`HOSTILE_CONSTRUCTS`)守得很緊,回程完全沒守。

**現況零影響,可證**:`/usr/bin/grep -rl 'ZKBD' src/main/resources/web/` 只列出 `zul/css/base/_reset.css`
與 `zul/css/norm.css` 兩檔(`.ZKBD ` 56 + 34 = 90,OFF 標記 1+2 = 3 對),`ZK-TAGLIB-HEADER` 只在 `norm.css` 出現 1 次。
**建議**(便宜且與現有風格一致):在 `restorePlaceholders()` 之前或之後加一條 assert —— 佔位符出現次數
只允許在**白名單輸出**(`zul/css/norm.css.dsp`)非零,其餘檔一律必須為 0;`ZK-TAGLIB-HEADER` 全樹至多 1 次。
成本一行,擋的是一個目前只靠「沒人這樣寫」在防的靜默腐化。

### 發現 3(LOW,局部推翻 commit message 的措辭)`check:var-table` 的失敗清單**不是**「逐項相同」,有 2 項被 P5 移動了

`a03edcf` 的 commit message 寫「`check:var-table` still exits 1 for the PRE-EXISTING S14 reason —
verified identical against a HEAD snapshot of the source tree」,S37 寫「失敗清單與現在**逐項相同**」。

實測用**真正的 P5 前狀態**(舊腳本 `git show 5958d1b:scripts/gen-var-table.js` + 舊來源樹)當基準:

```
node <5958d1b 的 gen-var-table.js> --src <5958d1b 來源樹> --check   # EXIT=1
npm run check:var-table                                              # EXIT=1
diff <(兩份的 ASSERTION FAILURE 區塊)
```

**exit code 相同、12 條 assertion 全部仍失敗、其中 10 條逐字相同**,但有 **2 條的量測值被 P5 移動了**:

| assertion | P5 前 | 現在 |
|---|---|---|
| rows whose LESS name is never referenced | expected 42, measured **773** | expected 42, measured **837** |
| rows dead on both sides (name and token) | expected 25, measured **698** | expected 25, measured **837** |

**成因已定位**:`scripts/gen-var-table.js:476` 是 `const lessFiles = walk(srcRoot, '.less')` ——
liveness 掃描**只讀 `.less`**。P5 刪掉 `norm.less` / `_reset.less` / `profiles/*.less` 之後,
原本被那幾個檔引用的 LESS 名稱一律變成「沒人引用」。

**判定**:「exit 1 是既有的」**成立**;「失敗清單逐項相同」**不成立**。這不影響任何一條斷言(該檢查在 P5 前就紅),
但它是一個**會隨 drop-less 每一階持續劣化**的量測 —— P7/P8 再刪 `.less`,這兩個數字還會再漲。
**建議**:S14 拍板時一併把 liveness 掃描改成同時讀 `.css`,否則到最後一階這兩條會變成純噪音。

### 發現 4(LOW,新機制的邊角)`resolveImports()` 是**註解盲**的

`resolveImports()` 跑在 `stripComments()` **之前**、對原始文字操作,而它的 regex 只要求
`@import` 在行首(`^[ \t]*@import`)。所以一個被 `/* */` 註解掉、但 `@import` 自成一行的匯入
**仍然會被解析並就地展開**。實測:

```
來源 : /*⏎@import "_part.css";⏎*/⏎a{color:red}
結果 : EXIT=1,build-css: t.css: minifier warnings: Unexpected '*/' at 3:1.
```

**是硬失敗不是靜默腐化**(展開進來的 partial 內含 `*/`,把註解提早關掉),所以危害有限;
但錯誤訊息指向 `*/` 而不是「你註解掉的 @import 被展開了」,診斷會走冤枉路。
若 partial 內恰好沒有 `*/`,則展開的內容會落在註解裡被 `stripComments()` 丟掉 —— 淨效果與註解掉相同,無害。
**建議**:低優先。真要修就是 `resolveImports()` 改成跑在剝註解之後,但那會動到 taglib marker 的位置語意,不划算;
在 `resolveImports()` 的 doc comment 加一句「it is comment-blind」即可。

### 發現 5(LOW,文件漂移)三處敘述與現況對不上

1. **`scripts/check-build-css.js:156`** —— 註解寫「`norm.css` @imports **four** of them」,
   實際 `/usr/bin/grep -c '^@import' src/main/resources/web/zul/css/norm.css` = **3**
   (`tokens/_default.css`、`tokens/_iceblue.css`、`base/_reset.css`)。
   `walkCssSources()` 會 stage 全樹 **5** 個 `_*.css`(多出 `tokens/_compact.css` 與 `zul/font/_font-awesome.css`),
   所以執行結果正確、只有註解的數字錯。
2. **`scripts/build-css.js:32,140` 與 `doc/browserdefault-masking.md:62`** —— 都寫 taglib header 在
   **byte 43785 of 72837**。那是 **baseline** 的座標;**建置輸出**是 **43840 / 72900**(本報告實測)。
   文字讀起來像在描述當前產出,實際描述的是比較基準。差 55 B 的來源是 tokens 區的序列化差(C4 已列舉),
   **不是缺陷**,但這個數字會隨每次 baseline 更新而失效,建議改寫成「on the tokens/reset seam, not offset 0」
   這種不帶絕對數的說法,或註明「baseline 座標」。
3. **`doc/migration/less-var-to-token.{md,json}`** —— 仍指名已刪除的
   `zul/less/profiles/_{default,compact}.less`、`zul/less/_zkcssvariables.less`、`zul/less/norm.less`,
   而且 `.md:65-66` 還寫「**842** `--zk-*` declarations」(現況 **862**)。**路徑與數字兩軸都過期。**
   這是**產生出來的**文件,S37 已記載且卡在 S14(重跑產生器會把 S14 的漂移一起烘進去),
   本報告只補一件事:**它不只路徑舊,數字也舊**,S14 拍板重跑時兩者會一起修好。
   其餘提到這些路徑的檔(`doc/iceblue-drop-less-*.md`、`tasks/*.md`、`scripts/workflow/iceblue-drop-less.mjs`、
   `scripts/less2css.js:102`、`scripts/build-css.js:33`)都是**歷史敘述或設計理由**,指涉過去狀態是正確的,**不需要改**。

### 發現 6(LOW,既有,非本輪造成)`check:mixin-table` 的 exit 1 與 P5 完全無關

`npm run check:mixin-table` **EXIT=1**(抱怨 plan §P4 的 245/1225 與來源的 30/150 對不上,以及
`_zkmixins.less` 的 30 names / 38 lines vs 24 / 32 的口徑矛盾)。
`git diff --stat 5958d1b..a03edcf -- scripts/gen-mixin-table.js` 與
`… -- src/main/resources/web/zul/less/_zkmixins.less` **兩者皆為空**(P5 沒碰);
把 `--src` 指向 5958d1b 舊樹重跑,輸出與現況 `diff` **除 npm 自己那 3 行 banner 外完全相同** ⇒ **純既有缺口**。

## 4. compact profile 的迴歸面(委託指定追查)

**(a) 新旋鈕真的有效,而且與舊旋鈕等價。** 把來源樹複製到 scratch,只改 `norm.css` 第一行 import:

```
@import "tokens/_default.css";  ->  @import "tokens/_compact.css";
node scripts/build-css.js -s <scratch>/web -o <scratch>/out
```

得 `--zk-base-font-size:12px`(對照:預設建置是 `16px`)。再用**舊路徑**做對照組 —— 取 `5958d1b` 的來源樹,
只改 `_zkvariables.less` 的 `@themeProfile: "default"` → `"compact"`,`npx zklessc --compress` 編譯:

```
LESS-compact  norm.css.dsp = 71923 B      CSS-compact  norm.css.dsp = 71983 B
嚴格正規化(保留 descendant combinator 與值元數)後:EQUAL: true
兩側 :root --zk-* 皆 862
```

⇒ **`tokens/_compact.css` 忠實,新旋鈕與舊旋鈕產出同一份 compact 主題。** 這是 C8 最重要的一塊,
因為 build 裡**沒有任何東西**會編譯 `_compact.css`(它是 `_` partial,`walk()` 跳過;也沒有檔 `@import` 它),
閘門對它是全盲的。

**(b) 只設 `@themeProfile`(舊 readme 教的做法)會發生什麼 —— 實測。** 複製現況來源樹,**只**把
`_zkvariables.less` 改成 `compact`,兩條工具鏈都跑:

| 輸出 | 與預設建置比對 | 意義 |
|---|---|---|
| `zul/css/norm.css.dsp` | `cmp` **exit 0(逐 byte 相同)**,仍是 `--zk-base-font-size:16px` | **桌機主題完全沒有變 compact** |
| `zkmax/css/tablet.css.dsp` | `cmp` **不同** | 平板主題**已經**變 compact |

**結論**:照舊 readme 只設一處的使用者,會拿到「桌機 default + 平板 compact」的分裂主題,
**而且沒有任何檢查會叫**(閘門只建 default,`check:cssdiff` / `check:bytes` / `check:build-css` 三支都看不到)。
`readme.md:45-60` 現在已明文教兩處並寫了理由(「Set both, or the desktop theme and the tablet theme disagree.」),
與 S36 一致 —— **文件面已收,機制面到 P7 用 runtime override sheet 取代兩個旋鈕時才真正收掉。**
在那之前這是一個**只靠 readme 防守的迴歸面**,建議 P7 前若有 release,至少加一支
「兩個旋鈕必須一致」的靜態檢查(讀 `norm.css` 第一行 import + 讀 `@themeProfile`,不一致就 exit 1)。

## 5. 覆蓋表 —— 驗到什麼程度、沒驗什麼

| 面向 | 方法 | 覆蓋 |
|---|---|---|
| declaration 等價 | `check:cssdiff`(85 檔 / 14863 條)+ `cssdiff` 單獨重跑 | **完整**,0 差異 |
| byte 等價 | `check:bytes`(UNEXPLAINED 0)+ 自寫嚴格正規化器(72646 = 72646) | **完整**,且比專案工具嚴 |
| `norm.css.dsp` 逐區域 | 自切 356 塊 + 細切 45 個相異片段,**全部人工過目** | **完整** |
| DSP / EL 完整性 | 字面計數 + 拼法枚舉 + 90 個前綴附著段逐字 `diff` + 60 個 `<c:if>` 區域比對 | **完整** |
| builder 惰性 | 舊腳本 vs 新腳本跑同一棵舊樹,`diff -r` exit 0 | **完整**(83/83) |
| 守衛 | 8 個最小案例實跑,含 5 項指定 + 放寬邊界兩側 | **完整** |
| 打包 | jar entry 計數 + 抽出 `norm.css.dsp` `cmp` + DSP 計數 | **完整** |
| token 內容 | 名稱序列 `diff` + 逐 token 名值 + 順序 + `_compact` 端到端建置對照 | **完整** |
| **runtime 行為(DSP 解譯後的兩種 CSS)** | **未做** | **未覆蓋** —— 委託書已言明無法跑 DSP 解譯器,改以「兩檔 `<c:if>` 區域文字對等」代替。這證明**模板相同**,不證明**ZK 解譯結果相同**;但由於 baseline 是 master 出貨的同一份模板且逐區域對等,推論風險極低 |
| **視覺 A/B** | **未做** | **未覆蓋** —— 委託書 9 條斷言未要求。專案已有 `npm run visual:*` harness,若要對 `browserDefault` 開/關兩種形態做畫面確認,需另跑一輪(且需 S33 的採信範圍限制) |
| **`_iceblue.css` palette 覆蓋機制** | 只確認內容為 2 行純註解(與 ZK 的 `_iceblue_css.less` 同性質) | **未覆蓋** —— S29 的 palette 缺口已裁示歸 P7,非本輪範圍 |

GATE: PASS-WITH-FINDINGS
