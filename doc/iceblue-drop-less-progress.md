# IceBlue 棄用 LESS —— 進度紀錄

**本文件只記狀態,不定義規則。** 階段定義、G-zero/G-delta 判準、範圍邊界一律看
[iceblue-drop-less-execution-plan.md](iceblue-drop-less-execution-plan.md)。

狀態詞彙沿用元件 harness 既有的:`TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`。

---

## 階段

| 階段 | 狀態 | 閘門 | 量測 | commit | 日期 |
|---|---|---|---|---|---|
| P0 建立工作區與基準 | DONE | G-zero | `files differing: 0`(77 檔 / 14323 條) | `f34ca01` | 2026-07-29 |
| P1 LESS 釘到 4.x(S0+S1) | **DONE** | G-zero | `files differing: 0`(77 檔 / 14323 條);`less` 解析為 4.8.1;S1 守衛有負向控制 | 主旨 `P1(drop-less):` ⁺ | 2026-07-31 |
| P2 雙來源 build | DONE | G-zero | `files differing: 0`(77 檔 / 14323 條);儀器證明另見下方〈P2 儀器證明〉 | `dc46cd3` | 2026-07-30 |
| P3 元件掃描 74 檔 | **進行中** | G-zero + 逐步人工確認 | **步 0 完成:1/74 檔**(`tablelayout`)。`files differing: 0`、位元組與 baseline 相同 | `194f8f4`(工具 `8da83ed`) | 2026-07-31 |
| ↳ **P3 前置**:量全樹經 CSS 路徑的位元組相同率 | **DONE** | — | **24/75 位元組相同**;其餘 51 檔的差異全部分類到 5 類封閉清單,0 檔無法分類 | 見 `check:build-css` | 2026-07-31 |
| ↳ **P3 前置**:`build-css.js` 要有可重跑的檢查 | **DONE** | 自我證明 + 負向控制 | `npm run check:build-css` → 75 檔 / `files differing: 0` / exit 0;負向控制(`minify` 回傳空字串)→ exit 1 | 見〈P2 儀器證明〉 | 2026-07-31 |
| ↳ **P3 前置**:workflow 腳本加 `{step}` | **DONE** | 六條路徑實測 | `{step:0..4}` = 1/4/15/43/11,**一次只跑一步、跑完就回傳**;`{batch:1}` 改成**拒絕並說明**(接受它就等於回到「第一次人工檢查前先做 20 檔」),批 2/3 仍可別名 | `8da83ed` | 2026-07-31 |
| **視覺 A/B harness**(P4 前置) | TODO | 自我驗證須為 0 | — | — | — |
| **P4a** 前綴純移除(A 群) | BLOCKED | G-delta | **945** 條,全部有無前綴同伴 → 只允許 `- <prefixed>`,任何 `+` 都是 bug | — | — |
| **P4b** 前綴逐條判斷(C 群) | BLOCKED | G-delta | **143** 條,含 26 條須成對替換;B 群 44 條 carve-out 不得出現在 diff | — | — |
| P5 `norm.css` | TODO | G-delta | 842 token 須零差異 | — | — |
| P6 Font Awesome | TODO | G-zero | 4545 條 | — | — |
| P7 `tablet` + profile API | BLOCKED | G-delta | — | — | — |
| **規則表產生器**(P8 前置,有期限) | **DONE** | 846 列 / 834 語法 1:1 / **830** 行為 1:1 / 16 例外;**30** mixin / 38 定義列 | `3f3de5f` | 2026-07-30 |
| P8 收尾 | TODO | G-zero | 須等於 P4+P5+P7 已核准 delta 總和 | — | — |

### 兩個前置項的說明

- **視覺 A/B harness** —— 重用 Marble 既有的 preview 頁面與 Playwright,不搬語料進本分支。
  只需讓 preview app 能載入本模板編出的 theme jar,A/B 兩邊是**同一分支的兩次 build**
  (P0 的 LESS build vs 轉換後的 CSS build)。**先拿同一個 build 截兩次確認 diff 為零**,
  才可以拿它比對不同 build。計畫書 §2.4。
- **規則表產生器** —— ✅ **已完成(2026-07-30),期限風險解除。**
  `scripts/gen-var-table.js` + `scripts/gen-mixin-table.js`,各自自帶斷言、輸出跨次執行
  byte-identical、可在客戶 fork 上重跑。四支 npm script:`gen:var-table` / `check:var-table` /
  `gen:mixin-table` / `check:mixin-table`,全部 exit 0。
  產出:`doc/migration/less-var-to-token.{md,json}`、`doc/migration/mixin-to-css.md`。
  它解掉的風險是:這兩張表**只存在於即將被刪的檔案裡**,刪掉之後只能靠考古還原。

**BLOCKED 的原因**(都是等決策,不是等工作):

| 階段 | 卡在什麼 |
|---|---|
| P4a / P4b | L-2 —— IceBlue 作為 add-on 的瀏覽器支援聲明未定 |
| P7 | L-4 —— compact profile 的替代機制未定(**colour 那一半已解除**,density 那一半仍未定) |

### 已解除的 BLOCKED

| 階段 | 原本卡在 | 決定 | 日期 |
|---|---|---|---|
| P6 | L-5 —— ZK 11 的 icon 方向(FA / Lucide) | **Font Awesome 保留**。走計畫書 §P6 的「若 FA 保留」分支:寫 `scripts/gen-fa-css.js`,G-zero 4545 條。**不是**刪除 + 空 stub 分支 | 2026-07-30 |
| P1 | 計畫書 §P1 判定此階段**可選**,要不要留這個 pin 尚未拍板 | **做,而且不再是可選的。** L-7 拍板 Theme Pack 走「runtime `--zk-*` sheet + 新 CSS 語法」,而 3.13.1 靜默改壞的四種語法**正好落在那個語法區** → pin 從「過渡期護欄」升級成「下一步的前提」。已實作並過閘,見下方〈Tier 1〉 | 2026-07-30 決定 / 2026-07-31 實作 |
| P7(palette 半) | L-7 —— 23 套付費佈景以 `palettes/*.less` 出貨 | **palette 改成 runtime `--zk-*` override sheet**,沒有「編譯期換 palette」需要保留 → 整個轉換案不再被 Theme Pack 擋住。**density 那一半(L-4)仍未定** | 2026-07-30 |

P6 因此從 BLOCKED 轉 TODO。但它**相依於 P2** —— 產生出來的 `.css` 需要 `build-css.js` 才會變成
`.css.dsp`,否則閘門會把該檔報成 missing(看起來像產生器寫錯,其實不是)。順序:P2 → P6。

> Marble 的 `font-awesome.css.dsp` 是**空 stub**,因為 Marble 自己做 Lucide mask
> (見 `project_fa_to_lucide_migration`)。那是 Marble 的決定,**與本分支無關** ——
> IceBlue 保留 FA,兩個主題在這件事上分道揚鑣是預期的,不是不一致。

---

## 閘門紀錄(附加式,不覆寫)

每跑一次 `cssdiff` 加一行。**P8 的最終核帳要靠這份紀錄把 P4 + P5 + P7 的 delta 加總對上,
所以不能事後補、不能改寫既有列。**

| # | 日期 | 階段 | baseline | candidate | 差異檔數 | 差異條數 | 結果 |
|---|---|---|---|---|---|---|---|
| 1 | 2026-07-29 | P0 自我測試 | `baseline/` | `baseline/`(同一份) | 0 | 0 | PASS — 比對器對相同輸入回報零 |
| 2 | 2026-07-29 | P0 突變測試 | `baseline/` | 注入 5 種已知缺陷 | 2 | 6 | PASS — 見下方〈突變測試〉 |
| 3 | 2026-07-29 | P0 G-zero | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 工具鏈確定性成立 |
| 4 | 2026-07-30 | 開工前重驗 | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條。確認 P0 之後(兩次 doc commit)基準與樹仍然對齊,workflow 的前置條件成立 |
| 5 | 2026-07-30 | 規則表產生器 | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條。本階段只寫 doc + scripts,不動 theme 輸出,閘門本應不變 —— 跑它是為了證明「不動」而不是假設 |
| 6 | 2026-07-30 | P2 開工前 | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條。動手前先確認起點乾淨 |
| 7 | 2026-07-30 | P2 儀器證明(全樹走 CSS 路徑) | `baseline/` | scratchpad:75 檔經 `build-css.js`,`norm`/`tablet` 沿用 baseline(兩者留在 LESS) | **0** | **0** | **PASS** — **12142 / 14323 條**(84.8%)實際走過新的 CSS 路徑。這是 P2 唯一有力的證據,見〈P2 儀器證明〉 |
| 8 | 2026-07-30 | P2 round-trip `tablelayout`(1 條) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — `.less` 刪除、`.css` 就位;輸出與 baseline **逐 byte 相同** |
| 9 | 2026-07-30 | P2 round-trip `button`(36 條) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 含 8 條 mixin 展開的 vendor prefix(P4 標的);輸出**逐 byte 相同** |
| 10 | 2026-07-30 | P2 負向控制(故意讓 `HEADER` 少一個 taglib) | `baseline/` | `target/classes/web/iceblue` | **2** | **2** | **預期 FAIL(exit 1)** — 閘門抓到 `- <%@ taglib … prefix="z" %>`。**沒有這一步就不知道閘門會不會失敗**;已還原 |
| 11 | 2026-07-30 | P2 還原後重驗 | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 兩檔以檔案複製(不是 `git checkout`)還原,`git status --porcelain` 無 `.css`/`.less` 殘留 |
| 12 | 2026-07-31 | **P1(S0+S1)** | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條,`less` 實際解析為 **4.8.1**、engine 1.1.13。順帶驗掉 zkless doc 列為「要明確驗證」的一項:`compress: true` 在 LESS 4 已 deprecated 但**輸出沒有位移** |
| 13 | 2026-07-31 | **S1 守衛負向控制** | — | 在 `zul/less/_zkmixins.less` 尾端塞 `@import "~./zul/less/_reset.less";` | — | — | **預期 FAIL(exit 1)** — 守衛以指名檔案+行號的訊息失敗,整條 `check:cssdiff` 在 `zklessc` **之前**就中止。以檔案複製還原,md5 相同、`git status` 無殘留 |
| 14 | 2026-07-31 | §P2 複審(只動 doc) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條。**另加位元組層獨立複核**(`diff -rq -x .built-from`,完全不經過 `cssdiff`):**77 檔中 76 檔逐 byte 相同**;唯一例外 `font-awesome.css.dsp` 差 **7 個 byte** = 7 個前導零(`.1em`→`0.1em` 等)。方向是 **3.13.1 多加了來源沒有的零、4.8.1 照來源輸出**(來源 `zul/less/font/_variables.less:16-19,41` 本來就寫 `.1em`),落在 `canonical-number` 正規化內 → `cssdiff` 報 0 是正確而非寬鬆。計畫書 §2.6 第 1–2 層 |
| 15 | 2026-07-31 | **證明 P2 閘門真的空轉** | `baseline/` | `target/classes/web/iceblue`,但 `build-css.js` 的 `minify()` 改成 `return ''` | **0** | **0** | **PASS(而這正是問題)** — 每個產生的檔都會是空的,`check:cssdiff` 照樣 exit 0。**「沒有輸入時差異 0 是免費的」從論述變成實測。** 以檔案複製還原,md5 相同 |
| 16 | 2026-07-31 | **`check:build-css` 首跑**(全樹重導,自動化版) | `baseline/` | 暫存目錄:**75** 檔經 `build-css.js`,`norm`/`tablet` 由 baseline 原樣複製 | **0** | **0** | **PASS** — 77 檔比對 / 14323 條 / 覆蓋 **75** 檔。**位元組相同 24/75**;其餘 51 檔全部分類到 5 類序列化寫法差異(空白 48、前導零 33、`;}` 7、零值單位 7、空規則 2),**0 檔無法分類**。第一次跑時只有 4 類,抓到 `tbeditor` 兩份的**空規則**解釋不了 → 補成第 5 類,並記為 P3 來源清理項 |
| 17 | 2026-07-31 | **`check:build-css` 負向控制** | `baseline/` | 同 #16,但 `minify()` 改成 `return ''` | 多數 | 上千 | **預期 FAIL(exit 1)** — 與紀錄 #15 同一個破壞,`check:cssdiff` 沉默、這支檢查大聲失敗。**這就是補這支檢查的全部理由。** 以檔案複製還原,md5 `4cee89ed…` 相同 |
| 18 | 2026-07-31 | **P3 步 0**(`tablelayout`,第一個真正轉換的檔) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條。build 訊息從 `no .css sources … (nothing to do)` 變成 **`compiled 1 file(s)`** → `check:cssdiff` 從這一刻起真的走到 `build-css.js`。位元組層:`diff -rq` 全樹只有 `font-awesome` 不同(紀錄 #14 已解釋的 7 個前導零),`tablelayout.css.dsp` **逐 byte 相同** |
| 19 | 2026-07-31 | **步 0 之後重跑 #15 的破壞**(證明閘門不再空轉) | `baseline/` | `target/classes/web/iceblue`,`minify()` 改成 `return ''` | **1** | — | **預期 FAIL(exit 1)** — **同一個破壞,紀錄 #15 是 exit 0、現在是 exit 1。** 空轉不是被論述掉的,是被**第一個轉換過的檔**填掉的:有輸入之後,差異 0 就不再免費。以檔案複製還原,md5 `4cee89ed…` 相同,`git status` 無殘留 |
| 20 | 2026-08-03 | **縮排拍板 tab**(`tabIndent()` + 步 0 產物回頭套用) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條。改的是**來源**的前導空白,所以這一跑是在證明「縮排不進輸出」而不是假設:`tablelayout.css.dsp` 與 baseline **仍逐 byte 相同**,全樹 `diff -rq` 也只剩 `font-awesome`(紀錄 #14 的 7 個前導零) |

> ⁺ **P1 那一列刻意不寫 hash。** 這一列本身就在那顆 commit 裡,寫 hash 會自我指涉 ——
> 填上去、`--amend` 一次,hash 就變了,填的值當場失效(已經踩過一次)。
> 過去的做法是「再補一顆 commit 記 hash」,而那正是這次要整併掉的碎片來源。
> 用主旨定位:`git log --grep '^P1(drop-less)'`。
>
> **閘門紀錄 #1–#11 的 commit hash 已因 2026-07-31 的歷史整併而改變**(13 顆併成 5 顆,
> 樹逐位元組相同)。差異檔數/條數這些**量測**不受影響,只有 hash 要換算:
> `ae4ca36`→`f34ca01`、`77e0ce0`+`45d8544`→`20ea296`、`c240e20`+`3f1f457`+`37a2e93`+`9d210d0`→`3f3de5f`、
> `0fc113c`+`6eb89e0`→`dc46cd3`、`769f374`+`accc02a`+`e1b83d7`→`bd699de`。
> 舊 hash 仍可在 `backup/pre-squash-2026-07-31` 分支上查到。

---

## Tier 1(P1 = S0 + S1)

原本以獨立專案「拿掉 zkless-engine」評估,結論是**併入本計畫**:實測該引擎沒有註冊任何自訂 LESS
function / plugin / visitor / pre-post-processor,語法層面的全部貢獻是 `src/index.js:31` 那一行
`~./`→`/`;其餘都是建置流程。獨立做等於把 P2/P8 要寫的東西寫兩次。
完整分析:[iceblue-remove-zkless-engine.md](iceblue-remove-zkless-engine.md)。

| | 做了什麼 | 驗證 |
|---|---|---|
| **S0** | `package.json` 加 `"overrides": { "zkless-engine": { "less": "4.8.1" } }` | 閘門 #12,`less` 實際解析為 4.8.1 |
| **S1** | `scripts/check-less-conventions.js`(~120 行),串在 `check:cssdiff` 最前面 | 負向控制 #13 |
| 副作用修正 | `scripts/baseline.js` 改用 `require('less').version` —— LESS 4 宣告了 `exports` map 且**不**暴露 `./package.json`,舊寫法會丟 `ERR_PACKAGE_PATH_NOT_EXPORTED` | 基準腳本能跑 |
| 順手 | `readme.md:27` 的「install zkless-engine」是**過時的前置條件**(它是普通 devDependency,沒人手動裝)| — |

**為什麼 S0+S1 是一顆 commit 而不是兩顆。** zkless doc 原本要求各自一顆、各自跑閘門,好讓失敗
歸因到單一變數。歸因要的是**分開跑**,不是分開 commit —— 而 S1 在構造上不可能影響輸出(只新增
一支檢查腳本與一個 npm script 前綴),所以單次閘門的結果就已經歸因到 S0。

**S1 守住的是什麼(前提 #20)。** `~./` import 只在 **entry 檔的 buffer** 被改寫,partial 由 LESS
自己的 file manager 讀、看不到那個改寫 → partial 裡的 `~./` import 永遠解不開,而且失敗訊息是
**指路徑的 `FileError`,不是指規則的 `ParseError`**,所以沒有任何東西會指向真正的錯誤。
實測 74 個 entry 用 `~./`、partial 0 個 —— 這條不變條件從 ZK commit `53589bc7a8`(2013-05-20)
起就承重,**從未寫下來**。這才是這支守衛的價值:把部落知識變成具名的 build error。

**沒做的事:把 93 處 `@import "~./"` 正規化成 `/`-rooted。** 早期草案這樣提,兩邊都不划算 ——
`/`-rooted 其實是**引擎自己文件裡的寫法**,所以改寫不是「移除引擎語法」;而 66 個與 ZK core
共用的 `.less` 裡有 52 個目前**位元組相同**,其中 **34 個帶 `~./` import** → 改寫會讓還對齊的
那三分之二全部分歧,換來的只是「可用裸 lessc 編譯」這個沒人用的能力(永遠是透過 builder 編)。

---

## P2 儀器證明

**閘門在 P2 是無效的,必須另外補證。** P2 結束時樹上有 **0 個 `.css`**,所以 `build-css.js` 什麼都
不處理,閘門是**空轉通過**的 —— 它只證明 zklessc 沒被弄壞,對新程式碼路徑**一個字都沒證明**。
所以照 P0 證明 `cssdiff` 的方式證明這支 builder:

| # | 做法 | 結果 |
|---|---|---|
| 1 | 動手前跑閘門 | 0 差異(紀錄 #6) |
| 2 | **全樹重導**:zklessc 不壓縮編出 77 檔 → 抽掉 header → 當成 `.css` 來源 → 全部餵給 `build-css.js` → 比 baseline | **0 差異 / 12142 條**(紀錄 #7)。`norm`(header 在檔中間,P5)與 `tablet`(含 DSP tag,P7)沿用 LESS 輸出 |
| 3 | round-trip 最小檔 `tablelayout`(1 條):`.less`→`.css`、刪 `.less`、重編 | 0 差異,**byte-identical**(紀錄 #8) |
| 4 | round-trip `button`(36 條,含 vendor-prefix mixin 展開) | 0 差異,**byte-identical**(紀錄 #9) |
| 5 | **負向控制**:故意破壞 header 發射 | 閘門 **FAIL**,exit 1(紀錄 #10)。抓不到失敗的閘門不是閘門 |
| 6 | 以檔案複製還原,重跑閘門 | 0 差異,無殘留(紀錄 #11) |
| 7 | `withjdk.sh 17 mvn -o process-resources` | `compile-less` → `compile-css` 依序執行,BUILD SUCCESS。pom 接線經過實際執行驗證,不是只有寫進 XML |

### 2026-07-31:上面這六步已經變成一支可重跑的檢查

**原本的缺口不是「證明不夠」,是「證明不會重跑」。** 上表第 2 項做在 scratchpad,第 3、4 項
round-trip 的兩個檔**事後被還原**(紀錄 #11)。所以從 2026-07-30 起,`build-css.js` 是**無人看守
的程式碼**:來源樹 0 個 `.css`,閘門走不到它,改壞了不會有人知道。

實測(紀錄 #15):把 `minify()` 改成 `return ''` —— 每個產生的檔都空 ——
`npm run check:cssdiff` 仍然 `files differing: 0`、exit 0。

```bash
npm run check:build-css
```

`scripts/check-build-css.js` 把上表第 2 項自動化,並補了兩件當初沒做的事:

| | 內容 |
|---|---|
| 覆蓋 | **75** 檔經 `build-css.js`;`norm`(header 在檔中間)/`tablet`(選擇器位置 DSP tag)由 baseline 原樣複製補足 77 檔比對,輸出標為 `passthrough … (not evidence)` |
| 結果 | `files differing: 0`、**位元組相同 24/75** |
| 位元組差異分類 | 51 檔全部落在 5 類封閉清單(空白 48 / 前導零 33 / `;}` 7 / 零值單位 7 / 空規則 2);**分類不出來就 exit 1 並列出檔名** |
| 負向控制 | 同一個 `return ''` 破壞 → **exit 1**(紀錄 #17)。`check:cssdiff` 沉默、這支大聲失敗,這就是它存在的理由 |

**沒有併進 `check:cssdiff`**:它要多編一次整棵樹(~2–4 分鐘),而 `check:cssdiff` 是會一直跑的那支;
兩者問的也是不同問題 —— 一個驗**現在這棵樹**,一個用合成輸入驗**builder 本身**。
**要跑的時機**:P3 步 0 之前、以及每次改 `build-css.js` 之後。

**副產品**:5 類清單第一次跑只有 4 類,`tbeditor`(兩份)解釋不了 —— 查出來是**空規則** `.sel{}`
(LESS 壓縮器會刪、CleanCSS level 0 不刪)。補成第 5 類,並記成 P3 的來源清理項:
空規則要在來源清掉,不要在 builder 加特例隱藏。

> **覆蓋率數字被更正過(兩個 agent 互相矛盾,算術裁決)。** 實作者回報 13642 條 / 75 檔,
> 對抗性審核獨立重跑後回報 12142 條 / 75 檔。驗算:`14323 − 1500(norm) − 681(tablet) = 12142`
> 對應 75 檔;而 `14323 − 681 = 13642` 對應的是 **76** 檔 —— 所以 13642 與「75 檔」不可能同時成立。
> **以 12142(84.8%)為準。** 這件事的意義不只是改個數字:兩個 agent 都回報「0 差異 PASS」,
> 但其中一個的覆蓋率是錯的 —— **閘門結果正確不代表關於閘門的敘述正確**。

### 為什麼是 CleanCSS **level 0**,不是 Marble 用的 level 1

計畫書只說「minifier 換成 CleanCSS」。實測**這個選擇不夠精確** —— level 1 產生 60 檔差異。
用第 2 項的全樹語料掃了四種設定:

| 設定 | 差異檔數 | 差異條數 |
|---|---|---|
| level 1(預設,= Marble 的設定) | 60 | 2034 |
| level 1 + 關掉 selector 排序 | 53 | 936 |
| level 1 `all:false` + `removeWhitespace` | 34 | 583 |
| **level 0 + 自寫註解剝除 + `@media` prelude 收緊** | **0** | **0** |

`zklessc --compress` **不改寫值**,level 1 會,而且有四種是 `cssdiff` 無法(也不應該)正規化掉的:

1. 具名顏色 → hex(`black` → `#000`)
2. ` !important` → `!important`
3. **IE star hack 被刪掉**(`*zoom:1`、`*z-index:3`)—— 這是**真的少了 declaration**
4. selector list 被按字母重排

**`level: {1: {all: false}}` 關不掉這些**:CleanCSS 的 `all` 只翻**布林**選項,所以
`selectorsSortingMethod: 'standard'` 活著,而顏色改寫根本沒有選項可關。

level 0 是純重新序列化,但有兩件 LESS 壓縮器會做的事它不做,所以 builder 自己做:

- **註解**:level 0 全部保留(`specialComments` 是 level-1 選項)。`stripComments()` 刪一般註解、
  留 `/*!` 授權註解 —— 與 LESS 一致。**這件事對 P3 特別重要**,因為 P3 刻意在來源保留段落註解,
  不剝除的話每個輸出都會把它們一起帶進 jar。
- **`@media` prelude**:LESS 輸出 `@media (max-width:767px)`,CleanCSS 保留作者寫的
  `(max-width: 767px)`。`tidyMediaPreludes()` 補這一段。**`@supports` 故意不收緊** ——
  baseline 的 `@supports (-ms-accelerator: true)` 保留了空格,一起收緊會多出 4 條差異。

### 新發現的第三種「靜默摧毀」構造:選擇器位置的 DSP tag

計畫書 §4 的風險列只寫了 `@scope` 與裸 `@layer`,並說對策是「檢查 `output.warnings`(不只
`errors`)」。**實測那個對策不足以覆蓋這一類。**

`tablet.less` 的 browserDefault 開關會輸出 `<c:if …>${".z-page "}</c:if>*` 這種選擇器。
CleanCSS 5.3.3 把它改寫成 `<c:if …>${}".z-page "</c:if>*` —— **把字串搬出 EL 運算式之外**,
而且 `errors` 與 `warnings` **都是 0**(level 0 亦然)。這會讓 `${...}` 求值出錯,
是一條 warnings 檢查完全看不到的靜默毀損路徑。

`build-css.js` 因此改成 4 條前置守衛(`HOSTILE_CONSTRUCTS`),命中就**讓 build 失敗**,不是警告:

| 構造 | CleanCSS 的行為 | 何時會遇到 |
|---|---|---|
| `@scope` | 輸出全空,只在 warnings 報 | P5(browserDefault 改寫) |
| 裸 `@layer a,b;` | 連同**後面第一條規則**一起消失,只在 warnings 報 | §0 已排除,未來分支 |
| **DSP tag(`<c:if>` 等)** | `${"…"}` → `${}"…"`,**0 errors 0 warnings** | P5 的 reset、P7 的 `tablet` |
| 來源已含 taglib header | builder 會再加一次 → header 出現兩次 | P3 步驟 3 漏做時 |

P5/P7 要處理前兩類與第三類時,**正確做法不是放寬守衛**,而是「先 minify 內層,再包外層 /
先換佔位符,再還原」。守衛訊息裡直接寫了做法。

### 順手撿到的兩件 P3 要知道的事

1. **未壓縮輸出的 header 也不一定在 offset 0。** `tbeditor` 的展開輸出開頭是一段 `/*! … */`
   授權註解,taglib 在它**後面**。`less2css.js` 的步驟 3(去掉 header)不能用
   `startsWith`,要全域比對 —— 用 `startsWith` 會漏掉 `js/zkmax/{inp,tbeditor}/css/tbeditor`
   兩檔,而漏掉的結果是 header 被 builder 加成兩份(現在會被上表第 4 條守衛擋下來)。
2. **來源樹沒有 `css/` 目錄。** 現況每個元件只有 `<pkg>/less/`。P3 步驟 4 要
   `mkdir -p <pkg>/css/`,否則寫檔會失敗(第一次 round-trip 就踩到了)。

---

## P0 交付物

| 交付 | 狀態 | 位置 |
|---|---|---|
| worktree + `iceblue` 分支 | DONE | `../zkThemeTemplate-iceblue`,自 `master` `a89d44e` |
| `scripts/cssdiff.js` | DONE | 主閘門工具,含突變測試證據 |
| `scripts/baseline.js` | DONE | 建基準 + **拒絕覆寫**既有基準(見下) |
| `baseline/`(gitignore、可一鍵重建) | DONE | `npm run baseline`;`baseline/.built-from` 記錄來源 commit 與編譯器版本 |
| `npm run check:cssdiff` | DONE | 重編 + 比對,exit 0/1 |
| 進度文件 | DONE | 本文件 |
| 計畫書搬進被追蹤的樹 | DONE | `doc/iceblue-drop-less-execution-plan.md` |

### 基準的不可變性(P0 加的防護,原計畫沒寫)

原計畫只說 `baseline/` 要「gitignore 但能一鍵重建」。實作時發現這組合有個會讓**整套驗證失效
而且不會報錯**的失敗模式:P3 之後若有人重跑一次基準建置,`baseline/` 會變成「已轉換來源的輸出」,
`cssdiff` 就是拿轉換結果跟自己比 —— 回報 `files differing: 0`,而且什麼都沒證明。

`scripts/baseline.js` 因此預設**拒絕覆寫**既有 `baseline/`,並在 `.less` 檔數為 0(樹已完全轉換)
時直接拒絕執行。要重建必須明確 `rm -rf baseline`。基準的來源記在 `baseline/.built-from`:

```
commit:        a89d44e03ab732fb32aeb43f8e7e9ba29c701382
src dirty:     no
zkless-engine: 1.1.13
less:          3.13.1
.less sources: 153
```

### 突變測試(為什麼相信這個閘門)

「比對器對相同輸入回報 0」只證明它沒有偽陽性,不證明它抓得到東西。所以另外注入 5 種缺陷:

| 突變 | 內容 | 是否應被抓到 | 結果 |
|---|---|---|---|
| M1 | 刪掉一條 declaration(`float:left`) | 是 | 抓到,`- .z-frozen-body \|\| float:left` |
| M2 | 改一個值(`z-index:1`→`2`) | 是 | 抓到,`-`/`+` 一對 |
| M3 | 把同一 block 內兩條對調順序 | 是 | 抓到 —— 證明比對是**有序**的 |
| M4 | 移除一族 vendor prefix(模擬 P4) | 是 | 抓到,形狀正是 P4 G-delta 要的 `- <decl>` |
| M5 | 純格式改寫(空白、`rgba(` 逗號後空格) | **否** | **未回報** —— 正規化清單有效,不會被格式噪音淹沒 |

M5 是關鍵的一項:它證明這個閘門在 P3(展開後的 CSS 格式必然和壓縮輸出不同)不會製造上千條假差異。

---

## P0 修正的前提

計畫書 §1 的前提表有兩項被 P0 的實測推翻。兩項都是**同一個錯誤**:原數字是 `.less` **來源端**
的宣告數,而閘門比的是 `.css.dsp` **輸出端**。已在計畫書就地更正。

| 前提 | 原記 | 實測(輸出端) | 影響 |
|---|---|---|---|
| #1 declaration 總數 | 14807 | **14323**(+ 436 條 DSP 指令另計) | 只是標籤,不影響判準 |
| #10 `font-awesome` | 910 | **4545** | P6 的 G-zero 數字要改 |
| #10 `norm` | 1243 | **1500** | norm 不是最大檔,font-awesome 才是 |
| #10 `tablet` | 421 | **681** | — |
| #10 `combo` | 407 | **586** | — |
| #10 「12 檔 ≤4 條」 | 12 | **2** | **P3 批 1 的規劃失效**,已改成按輸出端條數分界 |

**經得起檢驗的前提**(P0 一併重驗,全部成立):

- #8 —— `norm.css.dsp` 裡正好 **842** 條 `--zk-*`,全在 `:root`,842 個不重複名稱。P5 的閘門成立。
- #9 —— 沒有 taglib header 的正好是那 3 檔(`js/zkmax/sel/css/{listbox,tree}`、`js/zkmax/grid/css/grid`)。
- P4 的 ~980 + 149 = 1129 估算 —— 實測輸出端共 **1127** 條前綴宣告(`-webkit-` 313、`-moz-` 283、
  `-ms-` 281、`-o-` 250),差 2 條。估算可信,可直接當 G-delta 上限。
  但 `progid:DXImageTransform` 輸出端 **0 處**(在 `_zkmixins.less:240`,無可達呼叫點)→ 不列入預期 delta。

### P0 新發現的前提

| # | 事實 | 對哪一階段有影響 |
|---|---|---|
| 11 | `goldenlayout.css.dsp` 有**兩份逐條相同**的輸出(`js/zkmax/goldenlayout/css/`、`js/zkmax/layout/css/`,各 413 條,diff 0) | P3:要嘛一起轉,要嘛先確認哪份是死路徑 |
| 12 | `tbeditor.css.dsp` 也有兩份,但**不相同**(380 vs 375,67 條差異) | P3:是兩個不同來源,不能當複本處理 |
| 13 | **有第二個 `_zkvariables.less`**:`zkmax/less/_zkvariables.less`,4 行、2 條宣告。而且它們**不是 token** —— `@iphone` / `@android` 是 media query 字串 | 規則表產生器:計畫書的 10 個例外**沒有這一類**。P8 的刪檔清單也要含這一檔 |
| 14 | `_zkmixins.less` 是 **30 個唯一名稱、38 個定義列**。差額來自 LESS 允許同名多載 —— 依參數個數或 `when` guard 分派,例如 `.boxShadow(@value)` 有 `isstring` 與 non-`isstring` 兩個版本 | 規則表產生器:計畫書與本文件原記「32 個定義」與「24 個名稱」**都錯**,已更正為 30 / 38 |
| 15 | **11 個 mixin 是死的**(30 個中,分佈在 38 個定義列裡的 13 列):整個 gradient / IE9 堆疊 | P4/P8:輸出端獨立佐證 —— baseline 裡 0 個 `linear-gradient`、`radial-gradient`、`-webkit-gradient(`、SVG data URI、`progid:` |
| 16 | **§P4 的估算被獨立重現,分毫不差**:245 呼叫點 / 1225 展開 | P4:上限 ≤1127 更可信 |
| 17 | **兩條覆寫路徑不等價**,三個獨立方向(CAVEAT-1/2/3) | 見計畫書 §P8。全部**先於本次轉換就存在**,`cssdiff` 看不到 → 閘門不受影響,但要寫進 migration guide |

### prereq 修正的前提(2026-07-30)

三個數字被推翻,其中**兩個是我上一輪自己寫進文件的**:

| 前提 | 原記 | 實測 | 怎麼錯的 |
|---|---|---|---|
| #14 mixin 名稱數 | 24 | **30** | 我的 grep 用 `^\.[a-zA-Z][a-zA-Z0-9]*`,遇到連字號就截斷 → `.gradient-ver`/`-hor`/`-diagm`/`-diagp`/`-rad` 全部塌成 `.gradient`,`.encodeURL-verGradient` 塌成 `.encodeURL`,**無聲少算 6 個可呼叫的 mixin**。`24/32` 與 `30/38` 各自內部一致;`24/38` 各取一個,描述不了任何檔案 |
| #13 `@iphone`/`@android` 的用途 | 「`tablet.less` 使用」 | **全樹 0 引用,是死的** | `tablet.less:2` 只是 `@import` 了那個檔,我把「import 了檔案」誤當成「用了變數」。分類要加,但 P7 不必編列移植 |
| §P8 例外數 | 10(後改 12) | **16** | 12 條分類例外之外,還有 4 條**語法 1:1 但行為不是**:`@iconColor`/`@activeColor`/`@inputDisableColor`(data URI)與 `@baseBackgroundColor`(`contrast()`) |

**教訓**:「數字對得上」不等於「數的是同一件事」。兩個內部一致的數對(24/32、30/38)交叉組合出
一個看起來合理、實際上不存在的 24/38 —— 而它之所以被抓到,是因為產生器**自帶斷言而且拒絕
為了通過而改斷言**,以及審核 agent 用**另一支獨立寫的 parser** 重數。單靠一次量測不會發現。

### workflow 的 args bug(2026-07-30,已修)

用 `{phase:"P2"}` 啟動的那一次,`args` 是以 **JSON 字串**而不是物件抵達腳本的,所以
`args.phase` 是 `undefined`,`|| 'prereq'` 的預設值讓它**又跑了一次 prereq** ——
回報 `phase:"prereq"`,燒掉 2 個 agent 去做已經 commit 完的事。

**第一次 prereq 之所以「成功」是巧合** —— 它根本沒讀到參數,只是預設值剛好就是 prereq。

兩個修法都做了:`readArgs()` 同時接受物件、JSON 字串與裸字串;而且**認不出來的 phase 直接
報錯**,不再回退到某個看起來像成功的東西。**預設值是一個合法階段**,正是讓這個 bug 無聲的原因。

### P4 拆成 P4a / P4b(2026-07-30)

**這是既有原則的延伸,不是新原則。** 計畫書 §2.2 早就寫著「先把所有能零差異驗證的事做完,
再做會改變輸出的事」—— 那是 P3(第一階段:原封不動展開)對 P4(第二階段:才動語法)。
現在只是把同一個原則**再往下套一層**:P4 自己也含三種不同的 diff 形狀,混在一顆階段裡,
G-delta 的「非預期形狀就是 bug」就檢查不了任何東西。

前綴宣告 **1132** 條(原記 1127,少算 5 條 `-khtml-user-select`)的分解:

| 群 | 條數 | 佔比 | 判斷成分 |
|---|---|---|---|
| A fan-out mixin(`border-radius` 532/`transform` 181/`box-shadow` 168/`box-sizing` 60) | **945** | **83%** | **零** —— 逐 rule 實測全部有無前綴同伴,無同伴 0 條 |
| B carve-out(無標準對應物) | 44 | 4% | 零 —— 不動 |
| C 手寫前綴 | 143 | 13% | **全部的判斷都在這 13%** |

所以 P4 的工作量分佈是 83% 機械 / 13% 判斷,**而原本的計畫把它們綁在一起**。
拆開後 P4a 只有一種合法 diff 形狀(純移除),閘門重新變得鋒利。

### P4 carve-out:44 條前綴宣告不能移除(順手撿到的)

`-webkit-font-smoothing` 16、`-moz-osx-font-smoothing` 16、`-webkit-touch-callout` 6 ——
這些**沒有**無前綴對應物,它們是唯一寫法,不是死前綴。另加 `-webkit-tap-highlight-color` 4、\
`-webkit-user-drag` 1、`-webkit-user-modify` 1,carve-out 共 **44** 條。

危險在於:機械掃描產生的 1132 條差異裡,這 44 條是**真回歸**,但形狀跟其他可移除的**完全一樣**,
G-delta 的形狀檢查分不出來 → carve-out 清單必須在動手前存在,否則 P4 的閘門實際上失效。
詳見計畫書 §P4。

### CAVEAT-3:master 既有的潛在 bug(順手撿到的)

`js/zkmax/big/less/biglistbox.less:281,389` 的 `background: contrast(@baseBackgroundColor);`:

- 值是 `var()` → LESS 無法求值 → 原樣輸出 `contrast(var(--zk-base-background-color))`,而
  **CSS 沒有產生顏色的 `contrast()`**(只有 `filter: contrast()`)→ 宣告無效、被瀏覽器丟棄。
- 值是字面值(`#FFFFFF`,正是 `readme.md:69` 建議客戶做的事)→ 編譯期算成 `background: #000000`。

所以**照著 readme 客製的客戶會意外啟用一條目前失效的宣告**。這是既有 bug,不是轉換造成的,
而且它逐條原樣通過 → `cssdiff` 看不到 → 閘門不受影響。要寫進 migration guide。

---

## P3 批次

**已開工:步 0 完成(1/74)。** 批次已於 2026-07-30 用 `cssdiff --list` 實測分界(原本的
`~8 / ~55 / ~11` 是估計值,**三個數字都不對**);**2026-07-31 開工當天重新推導一次,20 + 43 + 11
仍然成立** —— 這個數字是斷言,對不上就要停下來查,不能改斷言迎合實測。

| 批 | 範圍 | 檔數 | 步階 | 狀態 |
|---|---|---|---|---|
| 批 1 | 輸出端 ≤20 條 | **20**(原估 ~8) | 步 0 `tablelayout` → 步 1 `cardlayout`/`absolutelayout`/`anchorlayout`/`grid` → 步 2(+15) | **步 0 DONE**(`194f8f4`);步 1–2 待確認後開始 |
| 批 2 | 輸出端 21–200 條 | **43**(原估 ~55) | 步 3 | TODO |
| 批 3 | 輸出端 >200 條 | **11** | 步 4 | TODO |
| | | 20+43+11 = **74** ✓ | | |

### 每一步「你可以自己檢查什麼」(步 0 定型,步 1–4 照用)

由**最不需要信任**排到**最需要信任**。前三項完全不經過任何自製工具。

```bash
# 1. 讀 diff —— 步 0 是 8 行,一眼看完
git show 194f8f4 -- src/

# 2. 交付物有沒有變:built 的 .css.dsp 對 master 出的 baseline 逐 byte 比
cmp baseline/js/zkmax/layout/css/tablelayout.css.dsp \
    target/classes/web/iceblue/js/zkmax/layout/css/tablelayout.css.dsp && echo "0 byte 差異"

# 3. 有沒有順手動到別的檔(全樹位元組,完全不經過 cssdiff)
diff -rq -x .built-from baseline/ target/classes/web/iceblue
#    預期只有 zul/font/font-awesome.css.dsp —— 那是 P1 換 LESS 版本的既有差異(紀錄 #14),
#    跟轉換無關。除了它以外出現任何檔名,就是這一步弄壞了東西。

# 4. 閘門
npm run check:cssdiff        # files differing: 0

# 5. 閘門到底有沒有在做事(最強的一項,但會暫時改壞 build-css.js)
#    把 scripts/build-css.js 的 minify() 結尾改成 `return '';`,再跑第 4 項。
#    現在會 files differing: 1 / exit 1。步 0 之前同樣的破壞是 0 / exit 0(紀錄 #15 vs #19)。
#    還原請用檔案複製,不要 git checkout。
```

**第 2 項是重點:步 0 對「跑起來的 theme」的影響是 0。** 改的不是輸出,是**這個檔由誰編** ——
以前 `zklessc` 從 `.less` 編,現在 `build-css.js` 從 `.css` 編,兩條路徑產出同一串 byte。

### 步 0 的複核包(2026-07-31)

| 欄位 | 值 |
|---|---|
| 輸出 | `js/zkmax/layout/css/tablelayout.css.dsp` |
| 輸出端條數 | **1** |
| 來源 → 產物 | `…/less/tablelayout.less`(6 行)→ `…/css/tablelayout.css`(4 行) |
| **位元組是否與 baseline 相同** | **相同** |
| 宣告級差異 | 無(閘門 `files differing: 0`) |
| 空規則 | 0 |

產物全文只有三行:`.z-tablechildren { vertical-align: top; }`。`@import "~./zul/less/_header.less"`
在來源裡消失是**對的** —— header 現在由 `build-css.js` 注入,這正是 P2 建立的能力。

**步 0 撿到的三件事**(都不是 `tablelayout` 本身的問題,是機制的問題):

| # | 發現 | 處置 |
|---|---|---|
| 1 | 來源樹裡**沒有 `css/` 目錄** —— 它至今只當輸出目錄用。第一次跑直接 ENOENT | `less2css.js` 每次轉換都 `mkdir -p`。74 檔會在來源樹長出 74 個新的 `css/` 目錄 |
| 2 | 產物是 **2 空格縮排**(LESS 輸出的預設),但本 repo 的 `.less` 來源用 **tab** | **已拍板:tab**(2026-08-03,見下)。`less2css.js` 加 `tabIndent()`,步 0 的產物已回頭套用 |
| 3 | 我原本把 `less.render` 的 rejection 和 `finish()` 的錯誤用同一個 `.catch()` 接,於是寫檔失敗被標成「LESS failed」 | 已分開。步 0 的**全部意義**就是分辨「轉換器錯」與「builder 錯」,一個混淆兩者的錯誤訊息會直接抵銷掉它 |

> **已拍板(2026-08-03):tab,跟 repo 一致。** `build-css.js` 會把縮排全部壓掉,所以**輸出完全
> 不受影響** —— 這純粹是這 74 個「新的、要人維護的來源檔」讀起來要跟 repo 一致還是跟 LESS 預設
> 一致。趁只有 1 檔的時候改;73 檔之後再改就是一次橫跨全樹的空白 commit。
>
> **實作:`less2css.js` 的 `tabIndent()`,只動每行的前導空白,`floor(n/2)` 個 tab + 奇數餘 1 空格。**
> 唯一會被一個天真的 replace 改壞的是**多行註解的對齊** —— `/*` 開頭在第 4 欄、`*` 續行在第 5 欄的話,
> 變成 2 tab 與 2 tab + 1 空格,不管 tab 寬度多少都還是往內一欄。**保留餘數就是為了這個。**
>
> **這不是推論,是對整個語料量過的**(73 個尚未轉換的入口檔全部 in-process 編一次):前導空白
> 只出現 **0 / 1 / 2 / 4 / 5** 欄五種,**所有奇數欄都是註解續行**(非註解行的奇數欄 = **0**),
> 沒有任何一行已經含 tab,也沒有任何一行落在多行字串裡(CSS 字串不能跨行)。`ws=5` 只有 4 行,
> 全在 `tbeditor` 的兩份 vendor 註解區塊。
>
> **步 0 產物已回頭套用**:`tablelayout.css` 的那一行改成 tab,閘門仍 `files differing: 0`,
> 且 `tablelayout.css.dsp` 與 baseline **仍逐 byte 相同**(紀錄 #20)—— 縮排確實不進輸出。

74 = 77 個輸出減掉三個留在 LESS 的:`norm`(P5)、`font-awesome`(P6)、`tablet`(P7)。

批 1 有 20 檔而非 8 檔,對「批 1 的目的是驗證腳本」這件事是**好事** —— 語料更大,但每檔仍
≤20 條、可逐檔人工看完。批 3 的 11 檔:`popup` 217、`menu` 218、`tabbox` 237、`colorbox` 246、
`listbox` 261、`biglistbox` 299、`tbeditor` 375 + 380、`goldenlayout` 413 + 413、`combo` 586。

**批次 ≠ 步階(2026-07-31 加)。** 批次是**閘門與複審的分界**(以條數劃分,沒有變);
步階是**一次做多少、什麼時候停**。批 1 拆成三步 `1 → 4 → 15`,每步結束停下等人工確認 ——
理由與步 0 為什麼選 `tablelayout`,見計畫書 §2.6〈步階〉。

**每一步的紀錄要多兩欄**:位元組不同的檔數、人工確認與否。前者是不經過 `cssdiff` 的獨立訊號,
後者用來分辨「跑過了」和「被看過了」。

---

## 執行機制:workflow

`scripts/workflow/iceblue-drop-less.mjs` —— 一次跑**一個階段**,用 `{phase:"…"}` 指定:

| `phase` | 做什麼 | 可跑? |
|---|---|---|
| `prereq` | P8 的兩張規則表(**有期限**) | ✅ 現在就該跑 |
| `P2` | `build-css.js` + round-trip 自我證明 | ✅ |
| `P3` | 元件轉換,**必須**加 `{step:0\|1\|2\|3\|4}` | ✅(2026-07-31 補上步階) |
| `P6` | `gen-fa-css.js` | ✅(需 P2) |
| `P1` | 回報 **`status: done`** —— 已於 2026-07-31 完成(S0+S1) | ❌(沒事可做) |
| `P4` | 回報「已拆成 P4a/P4b,請改指定其中一個」 | ❌ |
| `P4a`/`P4b`/`P5`/`P7`/`P8` | 回報 blocked 與卡住的原因 | ❌ |

> 「已完成」與「被卡住」不是同一個答案,所以 `P1` 回報的 `status` 是 `done` 而不是 `blocked` ——
> 呼叫端對這兩者的處置不同。`NOT_RUNNABLE` 的值因此從字串改成 `{status, reason}`。

> **✅ 已修(2026-07-31,`8da83ed`):`P3` 收 `{step:0|1|2|3|4}`,一次只跑一步。**
> 原本最小單位是 `{batch:1}` = **20 檔**,跟計畫書 §2.6 的步 0 = **1 檔** 對不上 ——
> **工具表達不出來的規格,實務上就是那條規格被無聲忽略**,所以這是 P3 的前置條件而不是美化。
>
> 三個設計決定:
> - **沒有迴圈**。跑完一步就 `return`,連 `nextStep` 都只是回報下一步的編號,不會自己續跑。
>   會續跑的版本等於「回報成功、順便跳過了確認」,而確認就是步階制的全部內容。
> - **`{batch:1}` 改成拒絕並說明**,不是靜默接受。批 1 已經不對應單一次執行了,接受它
>   就是回到「第一次人工檢查前先做 20 檔」。批 2/3 本來就等於步 3/4,所以仍可別名。
> - **缺 step 或 step 不認識都大聲失敗**,理由與腳本開頭記的 phase 預設值 bug 相同:
>   預設值是個合法階段,才會讓錯誤看起來像成功。
>
> 六條路徑都實測過:`{phase:P3}`、`{batch:1}`、`{step:9}` 三者拒絕並給理由;
> `{batch:2}`、`{step:0}`、`{step:1}` 通過守衛進到轉換 agent。

**為什麼轉換本身不並行**(寫在腳本開頭的註解裡,這裡摘要):

- 整棵樹編譯只要 ~1.4 秒。74 檔是一次序列腳本執行,**沒有時間可省**。
- 每個會 build 的 agent 都寫 `target/classes/web/iceblue`,每次轉換都改**共用的來源樹** ——
  兩個轉換同時進行,等於 A 的閘門在編譯 B 刪了一半的 `.less`。失效是非決定性的,而且**長得像
  轉換 bug**。
- 一檔一顆 commit(§2.5)會搶同一個 git index。

**真正該 fan-out 的是複審** —— 計畫書 §P3 列的三件事(可讀性分段、註解位置、mixin 展開產生的
重複宣告)腳本判斷不了,共 74 檔,而複審是**唯讀**的。所以腳本的形狀是:序列轉換 → 並行複審 →
序列套用複審結果。

**階段之間不串接**,因為計畫書每個階段邊界都是「閘門 + 人工複審」。一次跑完好幾階的背景執行,
會在**跳過那些檢查點**的情況下回報成功 —— 而檢查點正是讓結果可信的東西。

---

## 重建基準的方法

`baseline/` 不進版控。要重建:

```bash
# 只有在來源尚未轉換時才有效(P0–P2 期間)
rm -rf baseline && npm run baseline

# P3 之後:必須從未轉換的 commit 重建,否則基準會被污染
git worktree add ../iceblue-baseline a89d44e
cd ../iceblue-baseline && npm install
npx zklessc -s src/main/resources/web -o ../zkThemeTemplate-iceblue/baseline/ --compress
```
