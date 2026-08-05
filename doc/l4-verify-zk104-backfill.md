# 第 4 層獨立驗證報告 —— ZK 10.4 補齊 8 個元件 + artifact 版號

> 覆核者:第 4 層獨立 agent。委託書:`tasks/l4-verify-zk104-backfill-brief.md`。
> 驗收對象:13 顆 commit,`4aac5e5`…`c89e4b2`,工作目錄
> `/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`(分支 `iceblue`,委託書寫
> `drop-less`,以 `git branch --show-current` 實測結果為準,見下方備註)。
>
> **狀態:已完成。** 本檔案採取「先建骨架、逐條回填」策略 —— 每驗完 1–2 條就更新對應列並存檔,
> 以避免因執行環境中斷而遺失已完成的驗證進度。12 條斷言與追加委託均已完成獨立取證。

## 0. 環境備註

- `git branch --show-current` 實測為 `iceblue`,非委託書所述 `drop-less`。分支名稱差異記錄於此,
  不影響驗收範圍(commit 範圍 `4aac5e5`…`c89e4b2` 已用 `git log --oneline 4aac5e5^..c89e4b2` 核對,
  13 顆 commit 存在且連續)。

## 1. 結論

**PASS-WITH-FINDINGS。** 12 條斷言中 11 條 **CONFIRMED**、1 條(C2)**REFUTED(後半段)**——但這是自我複核**自己已經承認**的推翻(S29),本報告獨立重跑同一套指令**得到相同結果**,沒有新增判定分歧。追加委託的 S29 同性質缺口掃描**沒有找到新缺口**。3 項 LOW/MEDIUM 發現皆為既有缺口或方法學觀察,非本輪 8 元件 + 版號補齊工作本身造成,不影響「補齊已完成且沒有波及既有 77 個輸出」這個核心交付主張。

## 2. 逐條結果表

| # | 斷言 | 結果 | 決定性證據 |
|---|---|---|---|
| C1 | 相對於 ZK 10.4,本主題原本缺的元件輸出恰好 8 個,現已歸零 | **CONFIRMED** | 用**與自我複核不同的獨立方法**重推:`find <ZK10/zk/zul,ZK10/zkcml/zkex,ZK10/zkcml/zkmax 三棵 10.4 樹的 web/> -path "*/less/*" -iname "[^_]*.less"`(非底線開頭 = entry,底線開頭 = partial,依專案既有慣例)得 **80** 個,加 1 個不在 `less/` 下的 `zul/font/font-awesome` entry(`find` 天然把 `zul/less/norm.less`、`zul/less/footer.less`、`zkmax/less/tablet/…` 一併算進 80 裡,因為它們同樣在某個 `less/` 目錄下)⇒ **ZK 10.4 側共 81 個 entry**,與 S26/appendix 引用數字相同,但用不同指令重新推出。正規化路徑後與 `find target/classes/web/iceblue_css -name "*.css.dsp"`(**85** 個,今日實跑)做 `comm`:**`comm -13`(ZK 有、主題沒有)= 空**——**缺口確實歸零**。`comm -23`(主題有、ZK 沒有)= 恰好 **4** 個:`js/zkmax/inp/css/tbeditor.css.dsp`、`js/zkmax/layout/css/goldenlayout.css.dsp`、`js/zkmax/med/css/cropper.css.dsp`、`js/zkmax/wgt/css/signature.css.dsp`——與 L2.5/S18/S24 記載的「4 個舊路徑死複本」名字**逐一相同**。81+4=85 算術一致。**另外用 `4aac5e5^` 那一版的 baseline manifest(77 檔)重跑同一組 `comm`**,得到「ZK 有、主題沒有」恰好 **8** 個,名字正是 `avatar/avatargroup/badge/breadcrumb/carousel/chip/confirmpopup/daterangebox`——**證實「原本恰好缺 8」也成立,不只是「現在歸零」。** |
| C2 | token 缺口恰好 20 個 `--zk-severity-*`,且 `zul/less/` 沒有其他該補的漂移 | **REFUTED(後半段,與自我複核結論相同,但本輪獨立重驗)** | **前半段獨立重驗 CONFIRMED**:`/usr/bin/grep -crE '^\s*--zk-' <ZK10.4 zul/less/profiles/_default.less \| _compact.less>` 與同一組指令對主題檔,**兩邊皆 862**;`diff` 這 3 個檔(`_default.less`/`_compact.less`/`_zkvariables.less`)**exit code 全部 0**(逐 byte 相同)。**後半段獨立重驗 REFUTED**——不是照抄自我複核的結論,是自己重跑 `diff -rq <ZK10.4 zul/less/> src/main/resources/web/zul/less/`,**得到與自我複核相同的 5 處差異**:①`_zkcssvariables.less` 內容不同(`cat` 兩邊確認:ZK 3 行 import,主題少最後一行 `@import "colors/_@{themePalette}_css";`)②`colors/_iceblue_css.less` 只在 ZK(`cat` 確認是 34 B / 2 行純註解)③`font/` 目錄只在 ZK④`footer.less` 只在 ZK⑤`norm.less` 內容不同(`diff` 確認只差 1 行 `@import "~./zul/less/font/_variables.less"`,722 vs 721 行)。③④⑤判定為 P6 的合法後果(已轉換,非缺口);①②是**真缺口**,已寫入〈發現〉。 |
| C3 | 8 個元件的 LESS 是逐字取自 ZK 10.4 / zkcml,沒有本地改寫 | **CONFIRMED** | 來源樹核對:`ZK10/zk`、`ZK10/zkcml` 兩棵樹 `git branch --show-current` 皆為 **`10.4`**(HEAD `d5ff128c`/`e095c004`,2026-07)。7 個 `js/zul/wgt/less/*.less` 對 `ZK10/zk/zul/src/main/resources/web/js/zul/wgt/less/`;`daterangebox.less` 對 `ZK10/zkcml/zkmax/src/main/resources/web/js/zkmax/db/less/`(用 `src/main/resources`,不用 `bin/main/` gradle 產物,依計畫書 §0 註記)。對 commit `0fede67`(引入當時)逐檔 `diff <(git show 0fede67:<path>) <ZK10 source>`:**8 個檔 `diff` exit code 全部 0**;另用 `shasum -a 256` 交叉核對,**8 對 hash 逐字相同**(見下方 hash 值)。這些 LESS 檔已在後續 P3 commit(`66fbaf9`…`d70eceb`)轉成 CSS 後從 repo 移除(`ls src/main/resources/web/js/zul/wgt/less/` 現為空),故本項針對的是**匯入當時**的內容,取自 `git show 0fede67`。 |
| C4 | `baseline/` 只有加法:1 個檔更新(`norm.css.dsp`)+ 8 個新增,既有 77 檔未被動到 | **CONFIRMED** | `git show 4aac5e5^:doc/baseline-manifest.sha256` 與 `git show c89e4b2:doc/baseline-manifest.sha256` 兩個時間點的 manifest 逐行 `diff`(排除 `#` 註解行):**變更恰好只有 3 類**——(1) `baseline/.built-from` hash 改變(provenance 註記檔,非元件輸出,預期會變);(2) `baseline/zul/css/norm.css.dsp` hash 改變(+20 severity token 的必然結果,C2 範圍);(3) **恰好新增 8 行**:`daterangebox.css.dsp`、`avatar/avatargroup/badge/breadcrumb/carousel/chip/confirmpopup.css.dsp`。**其餘所有既有 hash 行逐字相同,無一被改、無一被刪**。`# files:` 註解行 `78 → 86`(78 = 77 元件 + 1 個 `.built-from`;86 = 85 元件 + 1 個 `.built-from`),算術一致。 |
| C5 | 閘門紀錄 #41 的 `files differing: 0` 是因構造成立(空轉),#42 才是真比較 | **CONFIRMED** | `git log --oneline 4aac5e5^..c89e4b2 -- doc/baseline-manifest.sha256` 只列 2 個 commit:`ab994ed`(token 層)與 `0fede67`(元件 LESS 匯入層)——**後續 8 個 P3 轉換 commit(`66fbaf9`…`d70eceb`)完全沒有再動 manifest**。`git show 0fede67`:同一個 commit 裡**同時新增 8 個 `.less` 檔並更新 manifest**(`+8` hash 行、`0` 刪除),也就是 baseline 是在**來源仍是 LESS 的那一刻**建立的;commit message 原文已自陳「the gate's 0 differing here is TRUE BY CONSTRUCTION and proves nothing…baseline and candidate come from the SAME compile」——**這句話與 S26/appendix #41 一字不差**,已追到源頭。由於之後的 8 個轉換 commit 不再碰 manifest,baseline 對這 8 個檔**維持在「LESS 編譯」那個狀態不變**;而 `ls src/main/resources/web/js/zul/wgt/less/`(及 `js/zkmax/db/less/`)**現在是空的**,`find … -iname "avatar*"` 只找到 `.css`(不再有 `.less`)——即今天候選端來源已是**轉換後的 CSS**,與 baseline 的 LESS 來源**確實不同源**。實跑 `npm run check:bytes` 印出 **UNEXPLAINED: 0**,8 個目標檔(`avatar/avatargroup/badge/breadcrumb/carousel/chip/confirmpopup/daterangebox`)全部列在「有位元組差異但已歸類」名單中(與既有 33 個舊檔同一份名單,同屬 `whitespace`/`leading zero` 類),**證明 #42 是真比較**(有 byte 差、但語意層 0 差異),不是像 #41 那樣的恆真句。 |
| C6 | 收工數字:輸出 85 檔 / 14863 條 declaration / differing 0;來源端 83 `.css` + 2 `.less` | **CONFIRMED** | 實跑 `npm run check:cssdiff`(非 `npm run baseline`,只重建再比對,未重建基準)輸出:`build-css: compiled 83 file(s)`、`success: compiled 2 file(s)`(zklessc)、`files compared: 85`、`declarations: 14863`、`files differing: 0`。與委託書 / 自我複核引用的數字**逐一相同**。 |
| C7 | 執行層驗收:8 個元件的選擇器真的進到瀏覽器實收的彙整 CSS、20 個 severity token 被服務、`Unable to load` 歸零 | **CONFIRMED** | 起 `withjdk.sh 17 mvn test exec:java@preview-app`(PID 73198,port 8080),直接 `curl` 抓瀏覽器實際載入的 `<link>` 資源 `http://127.0.0.1:8080/zkau/web/e83f2645/_zkiju-iceblue_css/zul/css/zk.wcs;jsessionid=…`(HTTP 200,**551518 B**)。`grep -oE '\.z-<comp>'` 對此檔逐一計數:avatar **28**、avatargroup **13**、badge **25**、breadcrumb **13**、carousel **36**、chip **13**、confirmpopup **57**、daterangebox **46** —— **與紀錄 #42 引用的數字逐一相同**。`grep -oE '\-\-zk-severity-[a-zA-Z0-9-]*' \| sort -u \| wc -l` = **20**(4 類 × 5 屬性,danger/info/secondary/success/warning × bg/border/color/text)。`grep -ci "unable to load" preview-app.log` = **0**(新鮮啟動的 app log,非沿用舊 log)。 |
| C8 | 「覆蓋率 81/85」那個數字作廢(探針壞了,不是覆蓋率掉了) | **CONFIRMED** | 針對 S28 指名「尾端切片探針誤判為缺」的 4 個檔(`js/zul/grid/css/grid`、`js/zul/wnd/css/window`、`js/zul/inp/css/slider`、`js/zkmax/layout/css/scrollview`),對同一份 `live_zkwcs.css`(§C7 抓到的瀏覽器實收 `zk.wcs`,551518 B)做選擇器反查:`grep -oE '\.z-<comp>'` 得 grid **39**、window **25**、slider **85**、scrollview **28** —— **全部非零**,證明這 4 個檔確實在彙整檔裡,不是真的缺。另外直接 `curl` 個別檔(含 3 個同名 `grid.css.dsp`:`js/zul/grid/`、`js/zkmax/grid/`、`js/zkex/grid/`,分屬不同 edition)全部 HTTP 200、位元組數非零(294–7972 B)。**與 S28 原引數字(41/31/90/28)略有差異**(scrollview 精確相符,其餘 3 個接近但不完全相同)——判定為量測口徑差異(S28 未載明是否對單一 css.dsp 檔或對全 `zk.wcs` 計數、是否含 3 個同名 grid 檔的疊加),**不影響 C8 的判定**:核心主張「探針壞、覆蓋率沒真掉」只需要「非零」這個事實,4 個檔皆非零,與 S28 結論一致。 |
| C9 | 這 8 個元件不需要在本主題做任何註冊(`config.xml` / `lang-addon.xml` / `zk.xml` 都不必動) | **CONFIRMED** | `git diff --stat 4aac5e5^..c89e4b2 -- '*config.xml' '*lang-addon.xml' '*zk.xml'` 只列出 `config.xml`(2 行)與 `lang-addon.xml`(2 行),`git diff` 內容顯示這 4 行**全部是 `version-uid` 從 `10.2.1-jakarta-Eval` 改成 `10.4.0-jakarta-Eval`**(C10 的範圍,非元件註冊)。`cat` 兩檔全文確認**沒有任何 `<component>` 區塊**——本主題的 `lang-addon.xml` 從來就不宣告 widget class,那些定義在 ZK 自己的 `zul`/`zkmax` jar 內;主題只提供 `<listener>`(`IceblueCssThemeWebAppInit`)接 CSS 路徑改寫。`find . -iname "zk.xml"` 在整個 repo(排除 `target/`、`node_modules/`)**找不到任何 `zk.xml`**——本項對這個主題而言不是「有改但沒動」,而是**這個檔案本來就不存在於此 repo**。 |
| C10 | artifact 版號 `10.4.0-jakarta-Eval` 在 4 處一致,且與 `zk.version` 無耦合 | **CONFIRMED** | 逐檔 `grep`:`pom.xml:11` `<version>10.4.0-jakarta-Eval</version>`;`config.xml:8` `<version-uid>10.4.0-jakarta-Eval</version-uid>`;`lang-addon.xml:8` 同上;`Version.java:29` `UID = "10.4.0-jakarta-Eval"`。**4 處字串逐字相同**。`zk.version`(`pom.xml:21`)是 `10.4.0-jakarta.FL.20260713-Eval`——**與上述 4 處字串不同**,確認無耦合(FL 帶日期,描述依賴;artifact 版號不帶 FL,描述本 artifact,`pom.xml:6-10` 註解本身即說明此設計)。**附帶觀察(LOW,非本項斷言範圍)**:`pom.xml:9-10` 註解自己承認「這 4 處只互相一致即可,沒有機制偵測任一處漂移」——`package.json` 亦無對應版號、無 `check:version` 腳本;是自我揭露的結構性缺口,不是本輪造成,列入〈建議〉。 |
| C11 | L3-A 第 1–38 列與 S1–S25 未被改寫,只有附加 | **CONFIRMED** | `git diff 4aac5e5^..c89e4b2 -- doc/iceblue-drop-less-progress-appendix.md`:**整份 diff 只有 1 個 `-` 行**,內容是 `<summary><b>25 條狀態層更正</b>…` → `<summary><b>29 條狀態層更正</b>…`(計數標籤從 25 改成 29,反映新增 S26–S29,**不是 S1–S25 任何一條的內容**)。其餘全部是 `+`:2 列 L2 對照表新增(artifact 版號、ZK 10.4 補齊)、閘門紀錄 **#39/#40/#41/#42** 新增在 #38 之後、狀態層更正 **S26/S27/S28/S29** 新增在 S25 之後。**第 1–38 列與 S1–S25 的內容本身,diff 裡完全沒有出現**,即逐 byte 未動。 |
| C12 | 補齊沒有悄悄動到既有 77 個輸出 | **CONFIRMED** | 與 C4 同一份逐行 diff 證據:既有 77 個輸出中,**76 個 hash 完全未變**,**唯一變動的是 `norm.css.dsp`**——而這一個變動是**有名字、有 commit(`ab994ed`)、有文件記載的**(C2 的 +20 severity token),不是「悄悄」發生的未預期變更。`git diff --stat 266dc7c..c89e4b2 -- src/main/resources/web`(既有元件來源目錄)可交叉核對:除新增的 8 個檔與 3 個 token 檔(`_default.less`/`_compact.less`/`_zkvariables.less`)外,沒有其他既有來源檔被改動。 |

驗證順序依委託書優先序:C7 → C3 → C9 → C10 → C8,再回頭獨立重驗 C5 / C12 / C1 / C2 / C4 / C11 / C6。

## 3. 發現

### 發現 1(MEDIUM,既有缺口,非本輪造成,本輪獨立重驗確認)palette 覆蓋機制的 import 缺 1 行

與自我複核 S29 相同的發現,本報告獨立重跑 `diff -rq` 與 `cat` 重新取得,不是抄自我複核的結論(見 C2 證據)。`zul/less/_zkcssvariables.less` 少 `@import "colors/_@{themePalette}_css";` 這一行,連帶主題 `zul/less/colors/` 底下沒有 `_iceblue_css.less`。對現狀(`@themePalette` = `"iceblue"`)零影響——ZK 那份 `_iceblue_css.less` 只有 34 B / 2 行純註解。但換成非 iceblue palette(例如 `amber`)會**靜默失效**:對照組 `_amber_css.less` 是 1114 B 的 `:root{--zk-*}` 覆蓋,在本主題目前的 import 鏈裡會被無聲丟掉,而 `readme.md:50` 正是教使用者設 `@themePalette` 的那一行。
**建議**:補上該行 import 並補 `colors/_iceblue_css.less`(逐字取自 ZK 10.4,兩者必須成對——單獨補 import 會因缺檔導致建置失敗)。與本輪指定的 8 元件無關,屬 palette 機制,建議另開 commit 處理,不建議夾帶進本輪範圍。

### 發現 2(LOW,方法學觀察,非缺陷)紀錄 #42 引用的選擇器命中數字,只有在「不加詞界」的寬鬆比對法下才能重現

本報告用 `grep -oE '\.z-<comp>\b'`(嚴格詞界、逐檔獨立量)重跑,avatar/breadcrumb/carousel 三個檔量到的數字(8/7/30)**低於**紀錄 #42 引用的數字(28/13/36),原因是這三個元件在**同一份彙整 CSS** 裡各自都有一個「複合字首」的姊妹類別(`.z-avatargroup`、`.z-breadcrumbitem`、`.z-carouselitem`——字尾緊接字母,無連字號,故嚴格詞界排除、無詞界的子字串比對不排除)。改用「不加詞界的子字串比對」(`grep -oE '\.z-<comp>'`,無 `\b`)重跑,**逐一精確重現** #42 引用的全部 8 個數字(28/13/25/13/36/13/57/46)。兩種方法的**結論相同**(8 個目標元件的選擇器皆非零,確實進到彙整 CSS),差異純屬「要不要把複合字首的姊妹類別算進來」的口徑選擇,不影響 C7/C8 的判定,但建議日後在記錄這類「選擇器命中數」時**註明用的是哪一種比對法**,以便他人重現數字而不誤以為是量測錯誤。

### 發現 3(LOW,既有結構缺口,非本輪造成)artifact 版號 4 處一致性沒有自動化檢查

`pom.xml:9-10` 的註解自陳「這 4 處(`pom.xml`/`config.xml`/`lang-addon.xml`/`Version.java`)只需彼此一致,沒有機制偵測任一處漂移」。`package.json` 沒有對應版號欄位,也沒有 `check:version` 一類的腳本。本輪 4 處確認一致(見 C10),不是本輪造成的缺口,但建議未來補一支輕量檢查腳本(比照 `check:bytes`/`check:cssdiff` 的模式),避免下次升版有人忘記其中一處。

## 4. S29 同性質缺口的掃描結果

**比對的兩邊路徑**(`git branch --show-current` 實測皆為 `10.4`):
- 主題側:`/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue/src/main/resources/web`
- ZK 側(zul edition):`/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web`(HEAD `d5ff128c`,2026-07-13)
- ZK 側(zkex edition):`/Users/hawk/Documents/workspace/ZK10/zkcml/zkex/src/main/resources/web`(HEAD `e095c004`,2026-07-09,與 zul 同一個 `zkcml` repo)
- ZK 側(zkmax edition):`/Users/hawk/Documents/workspace/ZK10/zkcml/zkmax/src/main/resources/web`(同上 repo)

**先定界:S29 這一類缺口(缺 import / 缺 partial / 缺 profile / palette 檔)只可能發生在「LESS import 圖」還存在的地方。** `find src/main/resources/web -iname "*.less"` 列出主題現存的**全部 63 個 `.less` 檔**,只落在兩個頂層目錄——`zul/less/`(S29 已查、本輪獨立重驗,見 C2)與 `zkmax/less/`。委託書列名的 `js/zul/**/less/`、`js/zkex/**/less/`、`js/zkmax/**/less/`——`find … -iname "*.less"` 對這三組路徑**逐一跑,結果均為空**,即 drop-less 已把這三組全部轉完,目前**沒有任何 `.less` 檔留在裡面**,自然沒有「缺 import/partial」的空間(plain CSS 不用 `@import`)。額外核實:對 ZK 10.4 本身的這三組路徑跑 `find … -iname "_*.less"`(底線開頭 = partial 慣例)**三組全部是空**——即 ZK 10.4 自己在這些每元件 `less/` 目錄裡也**沒有任何跨檔共用的 partial**,每個 entry 只依賴頂層 `zul/less/_header.less` 這一個共用檔(已在下方核實逐 byte相同)。所以委託書點名的 4 個目錄裡,3 個(`js/zul/**/less/`、`js/zkex/**/less/`、`js/zkmax/**/less/`)**結構上不可能有 S29 這一類缺口**——已核對到「兩側都沒有東西可少」的程度,不是略過。

**逐目錄結果**:

| 目錄 | 方法 | 結果 |
|---|---|---|
| `zul/less/`(頂層) | `diff -rq` 全樹 | **5 處差異**,與 S29 完全相同(獨立重驗,見 C2 詳細證據):①`_zkcssvariables.less` 缺 1 行 import(**真缺口**)②`colors/_iceblue_css.less` 缺檔(①的必然後果,**真缺口**)③`font/` 目錄只在 ZK(P6 合法後果)④`footer.less` 只在 ZK(P6 合法後果)⑤`norm.less` 缺 1 行(P6 合法後果,722→721 行) |
| `zkmax/less/`(頂層:`_zkvariables.less`、`tablet.less`、`tablet/` 全子樹) | `diff` 逐檔 + `diff -rq tablet/` | **0 差異,逐 byte 相同**(`_zkvariables.less` 211 B、`tablet.less` 137 B、`tablet/default|compact/` 共 54 個 partial 全部相同) |
| `js/zul/**/less/` | `find -iname "*.less"`(主題側) | **空**——已全部 drop-less 完成,無檔可比 |
| `js/zkex/**/less/` | 同上 | **空** |
| `js/zkmax/**/less/` | 同上 | **空** |
| `zkex/less/`(頂層,委託書未列但順手查) | `ls` 兩側 | **兩側都不存在**——zkex edition 本來就沒有這層機制,N/A |

**結論:沒有找到新的、S29 之外的缺口。** 已知的 1 個真缺口(`_zkcssvariables.less` 少 1 行 import + 缺 `colors/_iceblue_css.less`)範圍就是 S29 原本找到的那個,沒有擴大也沒有第二個。

## 5. 我沒能驗證的,以及為什麼

**12 條全部有自己重新取證,沒有直接採信自我複核的結論。** 兩個判準上可以再深入,但判定不改變:

1. **紀錄 #42「這一輪沒有產出可信的覆蓋率數字,見 S27」**——本報告沒有重算 85 檔版本的完整 A/B 覆蓋率(S24 那個標記探針:逐檔插一條唯一規則、重抓彙整檔、逐 byte 還原、sha256 確認)。這件事委託書 12 條斷言裡沒有一條要求算出這個數字(C7/C8 要的是「8 個目標元件命中」與「81/85 探針作廢」,兩者都已核實),所以不影響任何一條的判定,但如果下一輪要用「完整覆蓋率」做斷言,需要另外重跑那個標記探針,本報告的正面命中證據(選擇器計數)不能直接當覆蓋率百分比使用。
2. **8 個元件的視覺呈現(有沒有畫對,不只是有沒有選擇器)**——委託書 C7 的用詞是「選擇器真的進到瀏覽器實收的彙整 CSS」,本報告驗的正是這個(選擇器命中 + severity token 服務 + `Unable to load` 歸零),這在委託書的取證規則下已足夠。但本報告**沒有**用瀏覽器截圖或視覺 diff 檢查這 8 個元件實際渲染出來是否符合預期外觀——這件事委託書沒有列為斷言,也超出「LESS 逐字取自 ZK 10.4」(C3,已用 sha256 confirmed)所能保證的範圍之外(LESS 逐字相同不保證渲染在本主題的 token 值下視覺正確,只保證規則沒被改寫)。如果需要視覺層驗收,建議另開一輪用既有的 Playwright/截圖流程。

除上述兩點外,12 條斷言與追加的 S29 同性質缺口掃描皆已用可重跑指令與其實際輸出重新取證,判定結果詳見上表與第 4 節。
