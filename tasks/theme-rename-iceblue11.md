# 主題改名: `iceblue_css` → `iceblue11`

> **狀態: 已執行(2026-08-12,user 裁示「do it」)。** 評估部分(L1–L3)維持原樣,
> 執行結果與實測數字記在 L4;閘門紀錄 **#58**、S 表 **S54**。
>
> 原文寫作時本文件只是評估,沒有動任何來源檔。

## L1 摘要

**可以改,而且現在是最便宜的時點。**

- **未發行** —— `org/zkoss/theme/iceblue_css/` 在 `maven2` 與 `eval` 都是 **404**。主題名是公開介面
  (`org.zkoss.theme.preferred`、`zktheme` library property、`<depends>`、以及**服務出來的資源 URL**),
  發行後再改就是 breaking change。
- **有前例** —— 這棵樹已經改過一次名: `fa7a51e4` 「rename iceblue -> iceblue_css」,只動了 **15 個檔**。
  該 commit 還留下了 4 條命名硬限制(S23),`iceblue11` **全數通過**。
- **閘門不會被驚動** —— `baseline/` 與 `src/main/resources/web/` 對 `iceblue_css` 各 **0 處命中**,
  比對的**內容**根本不含主題名。改的只有輸出目錄路徑。
- **機械成本** —— 程式/建置 **17 檔 33 處**;文件/紀錄 **21 檔 88 處**(後者建議不要整批改,見 L2.5)。
- **唯一實質反對理由是語意,不是技術** —— 見 L2.4。

---

## L2

### 2.1 為什麼「現在改是免費的,以後不是」

主題名不是內部識別字,它會外洩到四個地方:

| 外洩面 | 形式 |
|---|---|
| 應用組態 | `org.zkoss.theme.preferred=iceblue_css`、`zktheme=iceblue_css` |
| 其他 addon 的相依宣告 | `metainfo/zk/config.xml` 的 `<depends>iceblue_css</depends>` |
| 瀏覽器實際抓的 URL | `…/_zkiju-iceblue_css/zul/css/zk.wcs`(前次改名的驗收就是看這條) |
| jar / zip 檔名 | `iceblue_css-11.0.0-Eval.jar`、`bin` zip 裡的 `iceblue_css.jar` |

四項在發行前都沒有下游。發行後任何一項都是 breaking change。

### 2.2 閘門完全不受影響(這一點決定了驗收有多便宜)

```
baseline/                  對 "iceblue_css" 命中 0 檔
src/main/resources/web/    對 "iceblue_css" 命中 0 檔
```

⇒ 改名**不會動到任何一個 declaration**。變的只有 `target/classes/web/<artifactId>`
(pom 用 `${project.artifactId}` 推導),而 `cssdiff.js` 是吃參數的,改 `package.json` 即可。

**所以驗收可以下一個很強的斷言**: 改名前後 `check:gate` 的每一個數字必須**逐項相同**
(85 檔 / 14863 declarations / files differing: 0;313/313 `-webkit-`;P4a 60 deferred;
P4b 9 檔 −14/+7),`visual:selftest` 必須 116/116 且 `pages differing: 0`。
任何一個數字動了,就代表改名碰到了不該碰的東西。

### 2.3 `iceblue11` 是否合法 —— 對照 S23 記下的 4 條硬限制

| 限制 | 為什麼 | `iceblue11` |
|---|---|---|
| 不得等於 `StandardTheme.DEFAULT_NAME`(`iceblue`) | 否則 `ServletFns.resolveThemeURL` 會跳過 `~./` → `~./<theme>/` 改寫,ZK 服務自己 jar 裡那份,我們的輸出檔靜默沒被要求(S21) | ✅ |
| 不得含連字號 | 會成為 Java package segment | ✅ |
| 不得以數字開頭 | 同上 | ✅ 開頭是 `i` |
| display 名也要一起改 | 否則 theme picker 會出現兩個看起來一樣的項目 | ⚠️ 需一併改成 `Iceblue 11` |

**次要觀察**: `org/zkoss/theme` 下已發行的名字全是小寫、變體一律用底線
(`iceblue_c`、`iceblue_n`、`wcag_c`)。`iceblue11` 會是第一個把數字直接黏上去的名字。
不算違規 —— 而且未來要出 compact 變體時 `iceblue11_c` 仍然讀得通。

### 2.4 命名語意 —— 唯一實質的反對意見

前次改名的 commit 把選字理由寫得很明確:

> `_css` names what actually differs -- the source language -- **without implying a visual change,
> which matters because the whole thesis is that the two sides are identical.**

`iceblue11` 標示的是**世代**,讀起來像「ZK 11 的新外觀」。但這個專案的中心主張恰好相反 ——
兩邊視覺**完全相同**(`visual:selftest` 116/116、`pages differing: 0`)。
名字與主張反向,會誤導第一次看到它的 reviewer。

兩個名字都會過期,只是過期的原因不同:

- `_css` 在 LESS 全面退場後失去意義 —— 也就是**這個專案成功的那一天**。
- `iceblue11` 在 ZK 12 失去意義 —— 但那是可預期的時程。

**真正該先確認的是終局**: 如果這個主題最後是要**取代 ZK 11 核心裡的預設主題**,
那它終究會叫回 `iceblue`,現在這個名字只是 A/B 期間用來與預設區隔的鷹架
(S21/S23 正是為了這個才改名的)。若是這樣,`iceblue_css` → `iceblue11`
只是把一個鷹架換成另一個鷹架。

**建議**:

| 若終局是… | 建議 |
|---|---|
| 以獨立主題對外發行,與核心預設並存 | **改**,`iceblue11` / display `Iceblue 11` |
| A/B 期間的鷹架,最後併回核心的 `iceblue` | **不改**,力氣留給 L-4 / P7 |

### 2.5 文件的 88 處建議不要整批 sed

`doc/iceblue-drop-less-progress-appendix.md`(25 處)這類檔案是**歷史紀錄** ——
S 編號發現、閘門紀錄、當時實際跑過的指令與量到的數字。整批換字等於改寫「當時發生了什麼」。

做法: 只改**可複製貼上的指令與路徑**,散文與歷史保留舊名,並在 appendix 補一條 S 編號記下
`iceblue_css` → `iceblue11` 的對應,讓舊 log 仍然可讀。

### 2.6 順手會碰到的既有債(不在改名範圍內,只是提出)

1. **輸出路徑硬編在 12 個站點**(7 支 script 各一個常數 + `package.json` 5 條 npm script;
   另有 `scripts/workflow/iceblue-drop-less.mjs` 的 3 處敘述,合計字面 **15 次**)。前次改名 commit 明講
   「the output path is hard-coded in 8 places, which is why the directories drifted apart in the
   first place -- deliberately not refactored here」。改名是收掉它的自然時機
   (`scripts/baseline-ab.js:311` 已經是從 pom 動態讀 `artifactId` 的寫法,可作為範本)。
2. **`baseline-gate.json` 是沒有任何讀者的產物**,untracked,而它的 `candidate` 欄位還寫著
   `target/classes/web/iceblue` —— **上上個名字**。改名時要嘛更新要嘛刪掉,
   否則第三個名字又會留下一份化石。
3. **`pom.xml:211` 的 `<_include>${project.basedir}/src/archive/META-INF/MANIFEST.MF` 指向不存在的檔**
   (`src/archive/` 整個目錄不存在)。與改名無關的既有問題,但會讓 `mvn package` 失敗。未處理。

---

## L3 技術附錄

### 3.1 量測(2026-08-12)

```
發行狀態
  https://mavensync.zkoss.org/maven2/org/zkoss/theme/iceblue_css/  -> 404
  https://mavensync.zkoss.org/eval/org/zkoss/theme/iceblue_css/    -> 404
  eval 下已發行的主題: atlantic breeze iceblue_c iceblue_n sapphire silvertail wcag wcag_c zktheme

命中統計 (排除 node_modules / target / .git)
  程式+建置 (pom, package.json, scripts, src)  17 檔 / 33 處
  文件+紀錄 (doc, tasks, readme.md)            21 檔 / 88 處
  baseline/                                     0 檔
  src/main/resources/web/                       0 檔
```

### 3.2 前次改名 commit `fa7a51e4` 動到的 15 個檔

```
doc/iceblue-drop-less-progress-appendix.md   doc/iceblue-drop-less-progress.md
package.json   pom.xml   readme.md
scripts/baseline-ab.js   scripts/build-css.js   scripts/check-bytes.js
scripts/less2css.js      scripts/workflow/iceblue-drop-less.mjs
src/main/java/org/zkoss/theme/{iceblue => iceblue_css}/IceblueCssThemeWebAppInit.java
src/main/java/org/zkoss/theme/{iceblue => iceblue_css}/Version.java
src/main/resources/metainfo/zk/config.xml    src/main/resources/metainfo/zk/lang-addon.xml
src/test/java/zk/example/ThemePreviewApp.java
                                            15 files, +54 / −56
```

這次比上次多 2 個檔: `src/test/resources/metainfo/zk/config.xml`(`<depends>`)與
`src/test/java/zk/example/FontAwesomeIconsVM.java`(P6 之後才出現),
另外多了 `scripts/ab-visual.js`、`check-p4a-delta.js`、`check-p4b-delta.js`(P4 之後才出現)。

### 3.3 若要執行 —— 逐檔清單

| # | 檔 | 改什麼 |
|---|---|---|
| 1 | `pom.xml` | `<artifactId>`、`<name>`、`<description>`(`Iceblue CSS` → `Iceblue 11`) |
| 2 | `src/main/java/org/zkoss/theme/iceblue_css/` | `git mv` → `…/iceblue11/`(保留 rename detection) |
| 3 | `IceblueCssThemeWebAppInit.java` | 檔名 → `Iceblue11ThemeWebAppInit.java`;package、class 名、`THEME_NAME`、`THEME_DISPLAY`、檔頭第 1 行註解 |
| 4 | `Version.java` | package |
| 5 | `src/main/resources/metainfo/zk/config.xml` | `<config-name>` + 2 個 FQCN |
| 6 | `src/main/resources/metainfo/zk/lang-addon.xml` | `<addon-name>` + `<version-class>` |
| 7 | `src/test/resources/metainfo/zk/config.xml` | `<depends>` |
| 8 | `src/test/java/zk/example/ThemePreviewApp.java` | `org.zkoss.theme.preferred` |
| 9 | `src/test/java/zk/example/FontAwesomeIconsVM.java` | `web/iceblue_css/zul/font/font-awesome.css.dsp` |
| 10 | `package.json` | 5 條: `zklessc`、`zklessc-dev`、`build:css`、`build:tree`、`check:cssdiff` |
| 11 | `scripts/{build-css,check-bytes,check-p4a-delta,check-p4b-delta,less2css,baseline-ab}.js` | 輸出路徑常數各 1 處 |
| 12 | **`scripts/ab-visual.js`** | `THEME_DIR`、`-Dorg.zkoss.theme.preferred`、**`_zkiju-iceblue_css` 守門探針 ×2 + 錯誤訊息** |
| 13 | `scripts/workflow/iceblue-drop-less.mjs` | 3 處(註解與提示中的指令) |
| 14 | `readme.md` | 5 處(jar 檔名、安裝步驟、`zktheme=` 值) |
| 15 | `baseline-gate.json` | 更新或刪除(見 L2.6.2) |
| 16 | `doc/**`、`tasks/**` | **只改可執行指令與路徑**,歷史散文保留舊名 + appendix 補一條 S 編號 |

> **⚠️ 最容易漏、後果最貴的是 #12。** `ab-visual.js` 的 `guardProbe()` 用
> `_zkiju-iceblue_css` 判斷「主題到底有沒有被載入」。漏改會 `die()`,
> 而且吐出的錯誤訊息會指向**完全錯誤的原因**(「主題 jar 沒被載入」),
> 這正是 S21 當初花掉最多時間的那類假象。

### 3.4 驗收

1. `withjdk.sh 17 mvn clean test-compile` 綠
2. `npm run check:gate` —— **每一個數字與改名前逐項相同**
3. `npm run visual:selftest` —— 116/116、theme fingerprint SAME、`pages differing: 0`
4. `/usr/bin/grep -rI "iceblue_css" pom.xml package.json scripts src` 回 **0 行**
5. 服務出來的頁面連的是 `_zkiju-iceblue11/zul/css/zk.wcs`(沿用前次改名的驗收法)

---

## L4 執行結果(2026-08-12)

### 4.1 驗收 —— 五項全過

| # | 斷言 | 結果 |
|---|---|---|
| 1 | `withjdk.sh 17 mvn -q clean test-compile` | **EXIT=0**;`build-css: compiled 84 file(s) to …/target/classes/web/iceblue11` |
| 2 | `check:gate` 數字逐項相同 | **比預期更強** —— 見 4.2 |
| 3 | `visual:selftest` | **116/116 頁 PASS**、theme finger **SAME** `10ece0d16ed85599`、**`pages differing: 0`**、raster noise 5 頁(全部 maxΔ 1,遠低於 ≤8 / ≤64px 的實測地板) |
| 4 | `grep -rI "iceblue_css" pom.xml package.json scripts src` | **0 行** |
| 5 | 服務出來的頁面連新名字 | 守門探針兩輪皆印 **`_zkiju-iceblue11 present, marble refs 0`** |

**額外做的一項**(L3.4 沒列,但這是專門為此打造的工具): `node scripts/baseline-ab.js status`
的四名一致檢查 —— registered / preferred / maven `<artifactId>` / 腳本輸出目錄
**全部 = `iceblue11`**,`config.xml` listener 指向
`org.zkoss.theme.iceblue11.Iceblue11ThemeWebAppInit`,`⇒ all four agree`,
且 `dirs present: iceblue11`(**單一目錄**,`mvn clean` 已清掉舊的 `web/iceblue_css`,
沒有留下 S20 那種會讓目錄各自漂移的化石)。

### 4.2 斷言 #2 的實際做法與結果

不是「肉眼比幾個數字」,而是把改名前後兩份 `check:gate` **全文**各自把主題名正規化成
`__THEME__` 之後 `diff`:

```
sed 's/iceblue_css/__THEME__/g' gate-before.txt > before.norm
sed 's/iceblue11/__THEME__/g'   gate-after.txt  > after.norm
diff before.norm after.norm
```

輸出**只有一行**:

```
131c131
< success: compiled 1 file(s) (0.137 sec)
---
> success: compiled 1 file(s) (0.134 sec)
```

—— zklessc 的計時字串。其餘**逐 byte 相同**:P4a 45 檔 / 728 條、`-webkit-` **313 = 313**、
deferred **60**、P4b **9 檔 / 14 移除 / 7 新增**、deferred 1 orphan。
這正是 L2.2 預測的結果,而且是用比較嚴的方式量的。

### 4.3 執行時偏離計畫的兩處

1. **`baseline-gate.json` 決定不動**(L2.6.2 原本寫「要嘛更新要嘛刪掉」)。
   它 untracked、無讀者、無寫者,`candidate` 欄位停在 `target/classes/web/iceblue`。
   把路徑改成新名字會**謊報這份資料的來源**(資料是 `iceblue` 時代產的),
   刪掉則是動使用者工作樹裡與本次無關的東西 ⇒ **原樣保留,在此記一筆**。
2. **文件不是整批取代,是逐檔判讀** —— 而且這個決定當場救了一次:
   `_iceblue_css.less` 是 **ZK core 自己的 palette 檔**(`zul/less/colors/`,自 10.3.0.1
   起打包進 `zul` jar),與本主題同名純屬 S23 記下的語意歧義。整批 `sed` 會把
   `doc/iceblue-drop-less-execution-plan.md:491,493`、`doc/self-verify-zk104-backfill.md:49,51,60`、
   `doc/iceblue-drop-less-progress.md:159,224` 這 **7 行**改壞;整棵樹範圍的 sed 則會打到
   **全部 28 處** `_iceblue_css`。

**改了的文件**(活的部分): `doc/visual-ab-harness.md`(8 處,整份都是現行機制)、
`doc/iceblue-drop-less-progress.md`(2 處:一條可執行指令、一句現況陳述)、
`doc/iceblue-drop-less-plan-appendix.md`(1 處:流程圖重畫的 TODO)、
`tasks/utility-css-vs-p7-ordering.md`(4)、`tasks/l4-density-mechanism.md`(4)、
`tasks/utility-icons-fa-catalog.md`(1)、`tasks/p5-browserdefault-options.md`(1)。

**沒改的文件**(歷史): 閘門紀錄 #35–#57、`doc/l4-verify-*.md`、`doc/self-verify-*.md`、
`doc/iceblue-drop-less-zk-bump-report.md`、`tasks/l4-*-brief.md`、S 表既有條目。

實測殘留(不含本文件): 字面 `iceblue_css` 共 **101 次**,其中 **28 次是 ZK core 的
`_iceblue_css.less`**(不屬於改名範圍),其餘 **73 次是歷史紀錄裡的舊主題名**,
對應關係記在 **S54**。

### 4.4 一個意外的好處

S23 當初就記下:`iceblue_css` 同時是 **ZK core 已出貨的 palette 名稱**
(`@themePalette: "iceblue_css"` 合法),而 `readme.md` 正是教使用者設 `@themePalette` 的地方
⇒ 舊名等於把「兩個看起來一樣的東西」的混淆搬到隔壁命名空間。
`iceblue11` 與 palette 命名空間不再相撞,**這個歧義一併消失了**。

### 4.5 尚未處理

- **未 commit。** 工作樹目前同時帶著**兩筆**未提交的改動:上一輪的版號調整
  (`11.0.0-Eval`,4 個檔)與本次改名 —— 兩者在 `pom.xml`、`Version.java`、
  `config.xml`、`lang-addon.xml` 這 4 個檔上重疊。要分成兩顆 commit 的話,
  版號那筆要先出。
- **`pom.xml:211` 的 `<_include>` 仍指向不存在的 `src/archive/META-INF/MANIFEST.MF`**
  (L2.6.3) —— 與改名無關的既有問題,`mvn package` 會失敗,未處理。
- **輸出路徑仍硬寫在 12 個站點**(7 支 script 的常數 + `package.json` 5 條;
  字面 15 次,含 workflow mjs 的 3 處敘述) —— S23 記的技術債,這次同樣刻意不重構。
  S23 當時記的是「8 個地方 / 9 次」,增加的是 P4 之後才出現的
  `ab-visual.js`、`check-p4a-delta.js`、`check-p4b-delta.js` —— **這條債正在長大**。
