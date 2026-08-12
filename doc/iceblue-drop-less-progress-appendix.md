# IceBlue 棄用 LESS —— 進度紀錄 技術附錄(L3)

> **本檔只記狀態,不定義規則** —— 與
> [iceblue-drop-less-progress.md](iceblue-drop-less-progress.md) 同一條規則。
> 階段定義、G-zero / G-delta 判準、範圍邊界、**術語表**一律看
> [iceblue-drop-less-execution-plan.md](iceblue-drop-less-execution-plan.md)。
>
> 這裡只有**原文保留**的微觀細節:commit hash、byte 差異、實測 log、逐檔複核包、變更歷史。
> L1/L2 只寫當前狀態;**要複核那些狀態是怎麼得出來的,看這裡。**
>
> **索引與〈何時要看〉在進度書的
> [L3 技術附錄](iceblue-drop-less-progress.md#l3-技術附錄獨立檔)一節**,本檔不另立一份 ——
> 一份索引兩個地方維護,遲早對不上。
>
> **摺疊規則**:複核期間會反覆查的兩節(**L3-A** 閘門紀錄、**L3-F** 複核包)**不摺疊**;
> 其餘收在 `<details>` 裡,`<summary>` 帶關鍵數字。
>
> **⚠ 本檔內文的 `§2.6:455` 這類「章節:行號」引用已失效。** 那是 2026-08-04 三層式重構**之前**
> 計畫書的行號。**章節部分仍然有效**(`§2.6` = 計畫書附錄 **L3-C** 的 2.6 小節,判準的規範版在
> 計畫書 **L2.2**),失效的只有冒號後面的行號。完整的舊編號對照見
> [計畫書〈舊章節編號對照〉](iceblue-drop-less-execution-plan.md#舊章節編號對照l3-內文與外部文件仍在用)。
>
> **這些引用刻意不就地改寫**:它們大多落在 **L3-A 閘門紀錄**裡,而那份紀錄是
> **附加式、既有列不覆寫**的 —— 改寫一列就破壞了 P8 核帳的依據。

---

### 階段與 commit 對照

L2 的階段狀態表刻意不放 commit hash(微觀細節歸 L3)。對照如下:

| 階段 | commit |
|---|---|
| P0 建立工作區與基準 | `f34ca01` |
| P1 LESS 釘到 4.8.1(S0 + S1) | 主旨 `P1(drop-less):` ⁺ |
| P2 雙來源 build | `dc46cd3` |
| **P3 元件轉換 74 檔** | 步 0 `194f8f4`;步 1 `a046bdb`…`370d45b`;步 2 `aa3fac3`…`fbe44bf`;步 3 `5d12946`…`657a890`;步 4 `63be065`…`d74bf65`(工具 `8da83ed`、`82bea4d`、`7f8cd23`、`13da402`) |
| ↳ P3 前置:位元組相同率 | 見 `check:build-css` |
| ↳ P3 前置:`build-css.js` 檢查 | 見 L3-C〈P2 儀器證明〉 |
| ↳ P3 前置:workflow 加 `{step}` | `8da83ed` |
| 規則表產生器(P8 前置) | `3f3de5f` |
| 第 1+2 層變成 repo 腳本(`check:bytes`) | `9230348` |
| artifact 版號跟上 ZK(議題 B) | `4aac5e5` |
| **ZK 10.4 補齊 8 檔**(議題 A) | token 層 `ab994ed`;匯入 8 個 LESS `0fede67`;逐檔轉 CSS `66fbaf9`(avatar)、`e8542aa`(avatargroup)、`990f7fe`(badge)、`c2c3eb7`(breadcrumb)、`ccb9c60`(carousel)、`71601d4`(chip)、`36154ba`(confirmpopup)、`d70eceb`(daterangebox) |

**⁺ P1 那一列刻意不寫 hash**,理由見 L3-A 末尾的註腳(自我指涉 + 2026-07-31 的歷史整併換算表)。

---

### L3-A 閘門紀錄(附加式,不覆寫)


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

| 21 | 2026-08-03 | **P3 步 1**(4 檔:`cardlayout` 4、`absolutelayout` 5、`anchorlayout` 5、`grid` 6) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條,build 訊息 `compiled 5 file(s)`。**四檔逐 byte 都與 baseline 相同**(每檔轉換當下由 `less2css.js` 自己驗一次,步末再全樹驗一次:`diff -rq` 只剩 `font-awesome`)。來源端 5 `.css` + 72 `.less` = **77** ✓。`grid` 是**第一個 `NO_HEADER` 檔** → 順帶證明 `build-css.js` 對這三檔是**不注入** header,而不是「還沒遇到」 |
| 22 | 2026-08-03 | **`check:build-css` 在步 1 之後假警報 → 修好** | `baseline/` | 暫存目錄 | **5 → 0** | **0 → 0** | **先 FAIL 後 PASS** —— 失敗的是**檢查本身**:已轉換的檔沒有 `.less` 可重建,於是從候選樹裡消失,`cssdiff` 報 **`files differing: 5` / `diff records: 0`**(差異數 0 卻報差異 = 檔案不存在的形狀)。加了步 2b 直接複製已轉換的**真實來源**,回到紀錄 #16 的數字:覆蓋 **75**、位元組相同 **24/75**、0 檔無法分類,其中 **5 檔是真實來源、70 檔是重建**。**這條會隨每次轉換自己變紅**,不修就會變成沒人看的紅燈 |
| 23 | 2026-08-03 | **`stripHeader` 的 offset-0 假設破功**(`footer` 被腳本拒收) | — | — | — | — | **預期 REFUSE(exit 1)** —— `less2css.js` 對 `zul/less/footer.less` 印「有不屬於前導 header 的 DSP 指令」。查出來不是 footer 的問題:`stripHeader` 把 `<%@ … %>` 錨在 offset 0,而**有三檔在 `@import "_header.less"` 之前先吐一段區塊註解**,header 因此落在第 3 行。**只有未壓縮路徑看得見** —— `--compress` 會刪註解,所以 77 個 baseline 的 header 全在 offset 0,這個缺口一路到第一個這種檔要轉才浮出來。修在腳本(`7f8cd23`):跳過「只由註解與空白構成」的前綴、**保留該前綴**,只拿掉 header 那一段。六種形狀逐一斷言(offset 0 / 一段註解 / 兩段註解 / 完全沒有 header / 檔中間 / `${…}` EL 保留) |
| 24 | 2026-08-03 | **P3 步 2**(15 檔,批 1 收工:`listbox` 6、`tree` 6、`footer` 7、`video` 8、`columnlayout` 9、`anchornav` 9、`dropupload` 9、`a` 9、`sliderbuttons` 10、`barcodescanner` 13、`layout` 13、`rowlayout` 14、`frozen` 15、`rating` 18、`auxhead` 19) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條。來源端 20 `.css` + 57 `.less` = **77** ✓。**第一次出現位元組不同的轉換**(步 0/1 的 5 檔剛好全相同):15 檔中 10 檔逐 byte 相同、5 檔不同(`footer`、`video`、`layout`、`frozen`、`rating`)。全樹獨立複核 → **71/77 相同**,不同的 6 檔(含 `font-awesome`)**先正規化前導零、再去掉全部空白之後兩邊完全相等** ⇒ 全樹**零個語意 byte** 不同。`listbox`+`tree` 補完 `NO_HEADER` 三檔 → **三條都走過了**。`check:build-css` 仍 exit 0:覆蓋 75、位元組相同 24/75、51 檔落在同 5 類、0 檔無法分類,真實來源/重建從 5/70 變 **20/55** |
| 25 | 2026-08-03 | **P3 步 3**(43 檔,批 2 收工:輸出端 22–185 條,`inputgroup` 22 → `nav`/`tree` 185) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條,43 檔逐檔閘門全 0,無一次失敗。來源端 63 `.css` + 14 `.less` = **77** ✓(14 = 批 3 的 11 檔 + 三個留 LESS 的 holdout)。全樹獨立複核 → **37/77 逐 byte 相同**、40 檔不同、**0 檔無法解釋**:轉換的 63 檔中 24 相同 / 39 不同,仍是 LESS 的 14 檔中 13 相同 / 1 不同(`font-awesome`,紀錄 #14 的既有項)。`check:build-css` 仍 exit 0:覆蓋 75、位元組相同 24/75、51 檔落在同 5 類、0 檔無法分類,真實來源/重建從 20/55 變 **63/12** |
| 26 | 2026-08-03 | **`⚠ empty rules` 偵測器看不到它要抓的形狀** | — | — | — | — | **修好(輸出 byte 不變)** —— `[^{}]*\{\s*\}` 要求規則主體只有空白,所以「主體只剩註解」的規則從來沒被計到,而**那正是步 1 造出來的形狀**:`//` 改寫成區塊註解後,原本只包著一行 `//` 註解與一個**巢狀**規則的 LESS 規則,在解巢之後變成一個只剩註解的空殼。LESS 以前會刪掉它(先刪 `//`,規則就真的空了),所以 `baseline/` 沒有、我們的輸出有。實測已轉換的 63 檔:**9 個這種規則、分佈 4 檔**(`nav` 6、`borderlayout` 1、`paging` 1、`tree` 1),**真正空的 0 個**。順帶修掉第二個盲點:註解裡的 `}` 會提前結束主體、把規則藏起來 —— 不是假想,兩份 `tbeditor` 的授權標頭都含 `@{zprefix}`,而那兩檔正是另外 2 個 empty-rule 輸出。`bare` 與 `comment-only` 分開計數,因為清理方式不同(空規則直接刪;只剩註解的要先把註解搬出去)。15 種形狀逐一斷言 + 在 `tbeditor` 上實跑後還原(`13da402`) |
| 27 | 2026-08-03 | **P3 步 4**(11 檔,批 3 收工 —— **P3 全部轉完 74/74**:`popup` 217 → `combo` 586) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** — 77 檔 / 14323 條,11 檔逐檔閘門全 0,無一次失敗。來源端 **74 `.css` + 3 `.less` = 77** ✓(3 = `norm`/`font-awesome`/`tablet`)。**`build-css: compiled 74 file(s)`。** 全樹獨立複核 → **26/77 逐 byte 相同**、51 檔不同、**0 檔無法解釋**。`check:build-css` 仍 exit 0:覆蓋 75、位元組相同 24/75、51 檔落在同 5 類、0 檔無法分類,真實來源/重建從 63/12 變 **74/1**(僅剩 `footer` 由 LESS 重建)。**本步 11 檔逐 byte 相同 0 檔** —— 複核第 1 層對整批結構上不可用,見〈步 4 的複核包〉 |
| 28 | 2026-08-03 | **CRLF 來源會不會把 `\r` 漏進轉換後的 `.css`** | — | — | — | — | **量過:不會(0 個)** —— `rewriteLineComments` 用 `indexOf('\n')` 找 `//` 註解結尾,所以 CRLF 檔的 `\r` 會被收進改寫後的區塊註解裡(`// x\r\n` → `/* x\r */`)。而**註解在輸出端會被 `stripComments` 去掉,所以閘門結構上看不到這件事** —— 只會表現成來源檔行尾混用。全樹只有 4 個 CRLF 檔:`js/zkmax/tbeditor/less/tbeditor.less`(批 3 的 entry)與 `_zkvariables`/`_header`/`_reset` 三個 partial。**partial 不算數** —— 步 1 只改寫 entry 檔,partial 由 LESS 自己的 file manager 讀,`//` 被靜默丟掉(§P3 的「只對 entry」是結構性的)。in-memory 實測那個 CRLF entry:來源 600 個 `\r` → 改寫後仍 600 → **LESS 算繪輸出 0 個**,LESS 的 renderer 會正規化行尾(連註解內也一併)。已提交的 74 檔實測 **0 檔含 `\r`** ⇒ **不需要改腳本**;先量再決定,避免為一個不存在的問題引入 G-delta |

| 29 | 2026-08-04 | **用詞更正:「第 1 層不可用」跟計畫書 §2.6 對 P3 的定義不一致** | — | — | — | — | **更正(量測數字全部不變)** —— §2.6:455 明文寫「**P3 的第 1 層鏡片不是「位元組相同」,而是「位元組相同 or 差異落在 5 個已列名的類別裡」**」,並指名 `npm run check:build-css` 逐檔分類回報。按這個定義,**批 3 的第 1 層沒有不可用,而是通過了**:11/11 落在封閉清單內、清單外 0 檔;全樹 77/77 同樣通過。紀錄 #24/#25/#27 與步 2/3/4 複核包裡的「第 1 層不可用」用的是**嚴格逐 byte 相同**那個窄義 —— 那是 §2.6 明文說**不要外推到 P3** 的鏡片(它只對 LESS→LESS 成立,實測 76/77;走 CSS 路徑是 24/75)。**兩個說法的結論方向相反**:窄義讀起來像「最強的檢查失效了」,§2.6 的定義是「規格要求的檢查通過了」,後者才對。**既有列一律不改寫**(附加式),更正集中在此列與〈第 3 項的預期結果會變〉。附帶更正:先前說「第 2 層的腳本不在 repo、承諾是空的」**講過頭了** —— §2.6:456 指名的 `check:build-css` 就在 repo 且 exit 1 於無法分類;真正缺的只有全樹 77 檔變體(多涵蓋 `norm`/`tablet` 兩個 passthrough,而那兩檔 check 自己標記為 not evidence) |
| 30 | 2026-08-04 | **第 2 層從一次性腳本變成 repo 腳本:`npm run check:bytes`**(`9230348`) | `baseline/` | `target/classes/web/iceblue` | **0**(未解釋) | — | **PASS(exit 0)** —— **77 檔比對、26 檔逐 byte 相同、51 檔差異已歸因、0 檔無法解釋**,與手寫版逐一相符。動機:步 2/3/4 的第 2 層都是我手寫一次性腳本跑的,而**只有這個 session 能重跑的檢查,對之後的維護者等於不存在**。產品化時補了兩個缺口:(a) 路徑對 repo root 解析,從任何 cwd 跑都一樣(實測 `cd ~` 跑出同一組數字);(b) **`baseline/` 沒有對應檔的多餘輸出**現在會被報出來 —— 以 baseline 為主的走訪結構上看不見它,而那正是殘留 `.less` 被 `conflictingLess` 漏掉時的形狀。**兩個負向控制都 exit 1**:在已產生的 `button.css.dsp` 尾端塞一條真宣告 → `!!! 1720B vs 1750B after normalization`;放一個 baseline 沒有的 `stale-leftover.css.dsp` → `!!! EXTRA output`。以重跑 build 還原(`target/` 是產物,**沒有動 `baseline/`、沒有動來源**),還原後 `check:cssdiff` 仍 77 檔 / 14323 條 / `files differing: 0` |
| 31 | 2026-08-04 | **P6 —— Font Awesome:LESS 迴圈換成 JS 產生器**(`gen-fa-css.js` + `fa-icons.json` + `_font-awesome.css` 樣板) | `baseline/` | `target/classes/web/iceblue` | **0** | — | **PASS(G-zero)** —— 77 檔 / **14323** 條 / `files differing: 0`;FA 單檔 **`ok`(4545 條)**,正好是計畫書 L2.3 P6 要求的數字。兩個工具鏈的檔數**同時**變:`zklessc` **3 → 2 檔**(只剩 `norm`/`tablet`)、`build-css` **74 → 75 檔** —— 75 正好是 L2.0 術語表裡「builder 覆蓋檔數」的上限,**覆蓋率到頂**;這兩個數字一起變也順便回答了 L2.2 對 P6 的預警(「閘門會不會空轉」):FA 這次**確實走過**新的程式碼路徑。**最強的證據不是閘門** —— 產生器的輸出與被刪掉的 `font-awesome.less` 經 `less.render()`(4.8.1、去掉 3 行 taglib)**逐 byte 相同(208825 B)**,所以忠實度是**由構造保證**的,跟 P3「拿編譯輸出當新來源」同一個標準,只是這裡的「來源」變成資料 + 樣板。獨立驗證另外量到 **3611 個 distinct selector,0 增 0 減**。第 1/2 層:`check:bytes` **UNEXPLAINED 0**;FA 自己只用到 5 類封閉清單裡的 **3 類**(前導零、`;}`、空白),`unit on a zero length` 與 `empty rule` **兩類用不到**(逐類剔除實測)。差異全部集中在 `@font-face` 的 `src:` —— 舊 LESS 把整段包在 `e('…')` escape 裡,所以原樣保留了空白與字串裡那個 `;`,CleanCSS level 0 收緊了。**閘門的兩個盲點另外補**:(a) **codepoint** —— 抽驗獨立於本 repo 的 FA6 已知碼位(`user f007`、`check f00c`、`xmark f00d`、`github f09b` …)加 6 組 FA4↔FA6 同碼位一致(`times==xmark` …)全過,獨立驗證另抽 88 項亦全過;(b) **「加一個 icon」往返實測** —— 只改 `fa-icons.json` 兩行 → 重新產生 → 閘門精確報出 `+ .z-icon-zk-roundtrip-probe::before \|\| content:"\e9f9"` 與其 alias(4545 → 4547、`files differing: 1`),還原後產生檔**逐 byte 回到原狀**、閘門回到 0。**三個負向控制**:改一個 codepoint(`\f007`→`\f008`,**位元組長度不變**)→ `check:fa-css` exit 1 並指出行號;刪掉產生檔 → exit 1 報 missing;`fa-icons.json` 塞畸形資料(名稱含 `.`、codepoint 少了反斜線)→ **exit 2**(獨立驗證指出 `--check` 結構上抓不到「新加的畸形項目」,而那正是 P6 的驗收路徑 → 因此補了資料形狀驗證)。**順帶刪掉一個死 import**:`zul/less/norm.less:4` 的 `@import "~./zul/less/font/_variables.less"` 全樹 0 次引用,留著會讓 2457 個碼位有兩份來源;刪掉後 `norm.css.dsp` 不只 declaration 零差異,**在 `check:bytes` 的 51 檔差異清單裡也不出現 = 逐 byte 相同**,這就是它是死碼的證明。partial 數 **76 → 61** |
| 32 | 2026-08-04 | **L2.4 來源清理待辦第 1–4、6 項 —— 空殼規則與註解歸位**(32 個 `.css`,不動任何腳本) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS(G-zero)** —— 77 檔 / **14323** 條 / `files differing: 0`,**閘門的三個數字一個都沒動**。這一階的證據不在閘門上(閘門對「只動註解」結構上不敏感 —— `build-css.js` 在 minify **之前**就跑 `stripComments()`),而在**四個獨立的結構量測**:(a) **空殼規則(husk)15 → 0**,全樹 `0`;(b) `check:build-css` 的**封閉清單從 5 類降到 4 類** —— `8 file(s) empty rule` 那一列**整個消失**;(c) `check:bytes` **77 檔 / 26 逐 byte 相同 / 51 已歸因 / UNEXPLAINED 0**,與 P6 收工時**完全相同**,這就是「第 2、3、6 項不改輸出 byte」的證明;(d) **語意零變動**:對 32 個改動檔逐檔做「去註解 → 去空規則 → 正規化空白(字串內不動)」後與 `HEAD` 比對,**32/32 相同**。第 (b) 項正好是 L2.4 表頭對第 1、4 項的預測兌現,而且**比預測更強**:不是下降,是歸零。**做了什麼**:15 個空殼規則刪掉、標籤搬到它們真正描述的規則上面;`@{zprefix}` 4 處還原為 `Trumbowyg`(全樹 `@{` 歸零);**14 個**斷行註解(`/* x\n */`,CRLF 來源的殘留;分佈在 `tbeditor`(zkmax/tbeditor) 7、`scrollview` 3、`footer` 2、`layout` 1、`frozen` 1 共 **5 檔**)收成一行,全樹歸零;`footer.css` 的 `#footer.append-style()` 墓碑註解刪掉(第 3 項)。**編輯原則**:註解文字**一律原文保留、只改位置**;**共 7 處例外改寫**,每一處都有理由 —— (1)(2) 兩份 `tbeditor` 點名了已刪除的 `tbeditor.less`;(3) `colorbox` 的 `toolbar.less` → `toolbar.css`(順帶修掉 `form`→`from` 錯字,複審原文明文允許);(4) `inputgroup` 點名了兩個已刪除的 `.less`;(5) `goldenlayout` 16 行 `/* Appears N times */` 標註的變數已被 inline → 收成 1 行;(6)(7) `listbox`/`tree` 的 `/* reset table */` 與 `/* checkbox style */` 原本標註 mixin **定義**,mixin 已不存在 → 加上括號說明展開處(複審建議的原文)。**註解總數 344 → 307(−37),逐項對得上**:兩份 `goldenlayout` 各 **−14**(標頭 −15、補回 1 條見下)、`nav` 空殼標籤 **−6**(`/* first level */`、`/* topmost level */` ×4、`/* third level */` —— 後者仍存活於 `.z-nav-popup ul`)、`footer` 第 3 項 −1、`menu` 的 `/* define common font property */` −1(它標註的 mixin 群已不存在,而 `.z-menubar` 根本沒設 font)、`listbox`/`tree` 各 −1(`/* list cell */`、`/* tree cell */` 與緊鄰上一行的區段標題重複)、`colorbox` **+1**(孿生區塊補上同一句 provenance)。**規則 `{` 數 1703 → 1684(−19)也對得上**:15 個空殼 + 4 個 `@{zprefix}` 字面裡的 `{`。**順手解掉複審留的一個未決問題** —— `goldenlayout:49` 記錄「有一條 `.less` 註解被轉換器**默默丟掉**」並建議全樹 grep。量了:把 149 個被刪的 entry `.less` 與對應 `.css` 逐檔比註解清單,扣掉本次的刻意刪除後,**全樹只有 2 條**是 P3 轉換器真的丟掉的 —— 兩份 `goldenlayout` 各一條 `&:hover, // When hovered by mouse...`。已補回。**注意這個形狀比原本以為的窄**:選擇器位置的 `//` 註解**大多存活**(`nav.less` 光是 `> ul { //first level` 這種就有 8 條,全部以「規則主體第一行」的形式落在 `nav.css` 裡)。真正會被丟掉的是**多選擇器清單裡、逗號續行上**的 `//` 註解 —— 全樹 2 條,現在 0 條。**兩個數字動了但不是 CSS 變了**:`unit on a zero length` 8 → 7、`whitespace around , and >` 49 → 48。成因是 `classify()`(`scripts/check-build-css.js:128-141`)**「改到就算用到」而且 `x === y` 就 `break`** —— `biglistbox` 的真差異原本是 {前導零, 空規則},空規則差異撐著讓迴圈跑過第 3、4 關,那兩關**兩邊都改**(無害)卻被計入;空規則消失後它在第 2 關就相等直接 `break`。實測 `biglistbox.css.dsp` 的 `used` 從四類變成 `["leading zero on decimals"]` 一類。**那兩個數字本來就是虛胖的**,這次順便暴露 `classify()` 會高報類別(不是缺陷,但值得記著)。**沒有做的事**:第 5、7 項(G-delta,等 P4);複審剩下的 54 條 —— 已把原文搬進 `doc/iceblue-p3-review-residual-findings.md`,因為它們原本只存在於一次性工作目錄裡;`less2css.js` 的 CR 處理**沒有修**(見 S16) |
| 33 | 2026-08-04 | **第 32 列的獨立驗證(第 4 層)—— 找到並修掉一個孿生檔只修一半的缺陷** | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS-WITH-FINDINGS → 修完後 PASS**。獨立驗證 agent 自己重寫偵測器(husk tokenizer 自測 8/8、含註解內 `}` 兩個方向;字串感知的語意正規化器),獨立複現全部數字,並找到 **1 個真缺陷 + 5 個記錄錯誤**。**真缺陷:`js/zkmax/goldenlayout/css/goldenlayout.css` 只修了一半。** 該檔與 `js/zkmax/layout/css/goldenlayout.css` 在 `HEAD` 是**逐 byte 相同的孿生檔**(md5 一致),但複審只稽核了後者,所以第 6 項的 6 處修改只落在後者身上,前者只拿到補回的那 1 條註解 → **孿生對分裂了**。已修:把後者複製到前者(`diff -q` 乾淨、兩檔 `git diff --numstat` 都是 `8 24`)。**同時掃了全樹的孿生對**:`HEAD` 共 **3 組**(`goldenlayout`、`cropper`、`signature`),只有 `goldenlayout` 分裂過(另兩組本次沒有任何 finding,所以自然仍相同)—— **孿生對的分裂風險已封閉**。**另外修的 3 處**:(a) `listbox`/`tree` 的 `/* for checkbox …, use font-awesome */` 與 `/* for checkbox partial …, use font-awesome */` 原本被放到規則主體第一行,驗證指出那**恰好變成在標註 `display: block`** —— 而那正是該 finding 的抱怨本身;改成自足敘述(點名 `.z-icon-check` / `.z-icon-minus`,共 4 處);(b) `listbox`/`tree` 的 `/* ZK-2151 … */` 與區段標題順序還原成 `.less` 的原順序(ZK-2151 在上);(c) `tbeditor`(zkmax/inp) 的 `/* Potix: style modified */` 改成與孿生檔一致的行尾形式。**第 32 列的 5 個記錄錯誤已就地更正**(那一列與本列在同一顆 commit 裡,尚未成為歷史):檔數 31 → **32**;註解 309 → 285(−24)→ **344 → 307(−37)**(原數字漏算補回的那 1 條,而且量測時的檔集少算了 `goldenlayout` 孿生檔);`{` 數 1598 → 1579 → **1703 → 1684**(同一個檔集問題,差值 −19 不變);斷行註解「7 個、全在 `tbeditor`」→ **14 個、5 檔**(原數字是在已修掉 4 檔之後才量的);改寫例外「4 處」→ **7 處**。**驗證也確認了**:語意零變動 32/32、`@{` 全樹 0、S16 的 431 個 CR 與 `less2css.js` **完全沒有 `\r` 處理**、第 1–31 列未被改寫(`git diff --numstat` 對附錄只有 `4 insertions, 1 deletion`,唯一刪除是 `<summary>` 的計數)。**驗證另外撿到一條 P6 的漏失**,見 S17 |
| 34 | 2026-08-05 | **視覺 A/B 的 A 側 —— `baseline/` 完整性清單 + 側邊切換腳本**(`scripts/baseline-ab.js` + `doc/baseline-manifest.sha256`,不動任何 theme 來源) | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** —— 77 檔 / 14323 條。本階段只加 doc + scripts,theme 輸出本應不變;跑它是為了**證明**「不動」而不是假設(同第 5 列的作法)。**本列額外證明了切換無損可逆**:切換前先把 77 檔的 sha256 快照下來 → `install a` 回報 **A — verified (77/77 byte-identical to baseline, no extra .css.dsp)** → `install b` 之後 77 檔**逐 byte 回到快照**(`diff` 空輸出)⇒ A/B 來回不會在輸出目錄留下殘渣。**負向控制做了三個**:(a) 把 manifest 的一個 hash 改一個字元 + 加一列不存在的檔 → `check:baseline` 回報 `CHANGED` + `MISSING` 並 exit 1,`install a` **拒絕安裝**;(b) 事先在輸出目錄放一個假資產 `img/sentinel-asset.png` 與一個沒有來源的 `__extra.css.dsp` → 覆蓋後**資產原封不動**、`__extra` 被移除並列名;(c) manifest 事後從備份還原並用 `shasum -c` 證明逐 byte 相同。**manifest 可脫離本腳本驗證**:`shasum -a 256 -c doc/baseline-manifest.sha256` → 78 檔全 `OK`、非 OK 列 **0**。**第 4 層獨立驗證(同一顆 commit 內)= PASS-WITH-FINDINGS,找到 2 個 HIGH + 2 個 MEDIUM/LOW 已修**:(1) `inspectSide()` 的 B 分支只算 `differ` / `extra`,**`missing` 算了卻沒用** ⇒ 刪掉 5 檔甚至清空輸出目錄都回報「B、exit 0」—— 正是這支腳本聲稱要防的無聲謊言,只是被 wiring 壞掉的 `w.ok` 暫時遮住,名字修好就會現形。已修:`missing > 0` → `B-incomplete` + exit 1(實測刪 2 檔 → `INCOMPLETE: 2 of 77 output(s) missing` / exit 1)。(2) `install b` 在 `baseline/` 不存在時**未經捕捉的 ENOENT stack trace**,專門為此寫的 `requireBaseline()` 指引反而不會出現。已修:`inspectSide()` 前置守衛(實測 → `cannot name the side — baseline/ is missing`、exit 0、無 trace)。(3) `inspectWiring().ok` 只比兩個名字,**`artifactId` 印了卻不納入判準** —— 而 29 個圖檔資產正是騎在它上面,改完名字後資產會 404 而 `npm run ab` 仍回報 OK。已修:四個名字(registered / preferred / artifactId / 本腳本輸出目錄)必須是同一個字串。(4) 三處措辭不精確已改:「每個 `.css.dsp` 都滿是 `--zk-`」實為 **57/77**(20 檔一個都沒有)、「no matter how long you wait」被 `setLifetime(1hr)` 的閒置逐出打破、docblock 的「overlay 後重啟」與後文的「不必重啟」自相矛盾。**驗證同時獨立確認**:C1 往返兩次皆乾淨、C3 共 5 種 manifest 損毀型態(含刪列 → `EXTRA`、改路徑 → `MISSING`+`EXTRA`、整檔不存在 → exit 2)、`readManifest` 的兩空白切法**無路徑含空白**(78/78 合 `^[0-9a-f]{64}  [^ ]`)、假 marker 說 A 而目錄是 B → `A — CORRUPT: 51 differ` exit 1(**marker 沒有在危險方向被過度信任**)、L3-A 第 1–33 列與 S1–S18 **逐 byte 未動**、S19 的 delta **恰好等於插入的那一句**(`s19.replace(inserted,'') === HEAD`)、附錄 numstat `4 2` |
| 35 | 2026-08-05 | **執行 `init.sh`(theme name = `iceblue`)—— 把樣板佔位符換成真身分** | `baseline/` | `target/classes/web/iceblue` | **0** | **0** | **PASS** —— 77 檔 / 14323 條。`init.sh` 只改 8 個白名單檔 + 1 個目錄改名,**不碰 `src/main/resources/web`**,所以閘門本應不動;跑它是為了證明。填入的值:groupId `org.zkoss.theme`(對齊 Java 套件 `org.zkoss.theme.<name>` 與 `~/.m2/repository/org/zkoss/theme/*` 的既有慣例)、artifactId `iceblue`(**`init.sh` 內 `themeName=$artifactId`,所以它同時就是主題名**)、version `10.2.1-jakarta-Eval`(對齊 pom 的 `zk.version`)、displayName `Iceblue`(對齊 `StandardTheme.DEFAULT_DISPLAY`)。**四個名字現在一致**(registered / preferred / maven `<artifactId>` / 腳本輸出目錄 = `iceblue`),`npm run ab` 從 exit 1 轉為 **exit 0**;`web/iceblue` 也第一次有了 **29 個圖檔資產**。**但主題仍然沒有被服務,原因換了一個,見 S21。** 另外兩件事:(a) `init.sh` 在 macOS 上有 bug,見 S22;(b) 那 29 個資產是**編輯器的自動建置**(VSCode Java language server)在 `pom.xml` 一改就重新 import、跑了 maven 的 resource copy 放進去的 —— 第 4 層獨立驗證量到更硬的證據:`pom.xml` 11:29:46 → 目標檔 11:29:47,`config.xml` 11:30:35 → 目標檔 11:30:36,**兩次都是 1 秒延遲**,比「同一分鐘」強得多。~~也就是說編輯器自己就會寫進這個輸出目錄,A 側被無聲蓋掉的風險不只來自 `mvn`。~~ **←這個推論被自己的證據推翻(第 4 層指出,2026-08-05)**:寫進資產的是 `pom.xml:105-112` 的 `<resource>` 區塊,而它**排除 `**/*.less` 與 `**/*.css`**,所以**永遠不可能產出 `.css.dsp`**;77 個 `.css.dsp` 來自 `exec-maven-plugin`,而 m2e 不會執行它(這正是本列自己觀察到的「dsp mtime 沒動」)。**A 側與 B 側的唯一差別就是 `.css.dsp`,`install a` 也只覆蓋 `.css.dsp` ⇒ 編輯器的建置動不到側邊。** 正確的說法只有前半:編輯器會往這個輸出目錄寫資產,值得知道,但**它不是 S20 順序陷阱的第二個來源** |
| 36 | 2026-08-05 | **主題改名 `iceblue` → `iceblue_css` —— 視覺 A/B 第一次真的量到東西** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— 77 檔 / 14323 條(**candidate 路徑也跟著改了**,舊的 `web/iceblue` 與 `web/___ARTIFACT_ID___` 兩個殘留目錄已清掉,`target/classes/web/` 底下現在只有 `iceblue_css` 一個)。**S21 的封鎖解除,而且是用量測證明的**:(a) 頁面連的 URL **主題段回來了** —— `_zkiju-iceblue_css/zul/css/zk.wcs`、`iceblue_css/zkmax/css/tablet.css.dsp`;(b) 服務出來的 `zk.wcs` 從 415355 B 變成 **531482 B**,`--zk-` 的**出現次數**從 **0** 變成 **4171** —— 其中**真正的自訂屬性宣告是 842 條**(其餘是 `var()` 讀取)。**842 這個數字要留意**:它正好等於 L2.1 裡 P5 要求零差異的 token 數,兩者很容易混。~~`--zk-` 自訂屬性從 0 變成 4171~~ **←措辭錯了(第 4 層指出):4171 是出現次數,不是宣告數。**;(c) `iceblue_css/zul/css/norm.css.dsp` → 200 / **63161 B**(我們那份,而且**這次是被要求的**);(d) ~~app log 的 `FileNotFoundException` **0 條** ⇒ 每一個被改寫的 URL 都有對應檔案,77 檔覆蓋完整,沒有漏網的元件。~~ **←這一條的推論無效、結論也是錯的(第 4 層指出,2026-08-05)。** 「0 條 FNFE」證明不了覆蓋率:頁面只連**兩個** CSS URL(彙整檔 + tablet),其餘 75 檔是伺服器端組進去的,**沒有人引用的 `.css.dsp` 根本不會被打開,自然不可能丟例外** ⇒ 零例外與「任意數量的檔沒被用到」完全相容。實測(標記探針:逐檔加一條唯一規則、重抓彙整檔、再逐 byte 還原)結果是 **74/77 才真的到瀏覽器**,詳見 **S24**。**(e) 最關鍵的一條 —— A/B 終於有訊號**:同一個 `zk.wcs`,A 側 `a56858a9…` / **530434 B**,B 側 `6f293b24…` / **531482 B**,**兩側不同**(對照 S21 當時兩側 sha256 完全相同)。**(f) 而且差異的性質也當場證明了**:把兩份服務出來的 CSS 套上 `check-bytes.js` 那 5 類封閉序列化正規化之後,**兩邊都是 525145 B 且字串完全相同**(~~524709~~ **←這個數字錯了,第 4 層指出:524709 需要第 6 個轉換 —— 把 `/* … */` 註解也刪掉,而那不在 `check-bytes.js` 的封閉清單裡**。5 類正規化的正確值是 **525145**;差的 436 B 全部是 `/*! … */` bang 註解。**結論不受影響**:兩側正規化後仍然逐 byte 相同,而且 `normalize()` 是幂等的,跑 2、3 次都是 525145。順帶複驗了 docblock 那個警告是真的:把空白挪到最前面會得到 525169 vs 525207 —— **不相等**)⇒ **瀏覽器收到的是「byte 不同、語意相同」的 CSS** —— 這是本轉換的核心主張第一次在 **HTTP 層**(而不只是磁碟上)被證明。改動範圍:Java 套件與類別(`git mv` 保留改名追蹤)、`config.xml` / `lang-addon.xml` / `pom.xml` / `ThemePreviewApp`、`package.json` 4 支 script、4 支硬寫輸出路徑的 script(`build-css` / `less2css` / `check-bytes` / `baseline-ab`)、`readme.md` 5 處。**顯示名稱刻意改成 `Iceblue CSS`**(不是 `Iceblue`),否則主題選單會出現兩個一模一樣的 `Iceblue` —— 那正是這次改名要避免的混淆 |
| 37 | 2026-08-05 | **第 36 列的獨立驗證(第 4 層)—— 修掉 1 個腳本缺陷、更正 6 處敘述** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS-WITH-FINDINGS → 修完後 PASS**。77 檔 / 14323 條(只動 1 支 script + 文件,輸出本應不變;跑它是為了證明)。第 4 層獨立複驗了改名的每一項,**兩個標題結論都成立**(主題確實被服務、A/B 確實有訊號),但**寫法錯了 6 處**:(1) **「77 檔覆蓋完整」是錯的 → 74/77**,而且推論本身無效 —— 見 **S24**,這是本輪最有價值的發現;(2) **525145 而不是 524709**,且不該掛在 `check-bytes.js` 的 5 類名下(524709 需要第 6 個轉換);(3) S23 的 `_css` 命名理由**是反的** —— 產品裡 `_css` 早就有既定含意(palette 的 CSS 自訂屬性版本,27 組 1:1),而且 `_iceblue_css.less` **從 10.3.0.1 起就打包進 `zul` jar**,不是「zkthemebuilder 裡一個沒人用的空白 stub」;(4) `4171` 是 `--zk-` 的**出現次數**,真正的宣告數是 **842**;(5) L2.1 有一列還寫著現況是 `iceblue`;(6) 「8 處」是 8 個地方但**字面 9 次**。**修掉的腳本缺陷**:`inspectWiring()` 的 `expected` 是用**目錄名**組出來的,所以 Java `package` 宣告與自己的目錄不符時**檢查會跟自己說 OK 並 exit 0** —— 已改成從檔案自己的 `package` 行推導,並額外驗 package 末段 == 目錄名;負向控制實測(把 package 改成 `WRONGPKG` → exit 1 並指出是 package 行不符,改完逐 byte 還原)。**第 4 層也獨立確認**:L3-A 第 1–35 列與 S1–S22 逐 byte 未動、`git diff --stat HEAD~1/~2/~3 -- src/main/resources/web` 全空、`check:bytes` UNEXPLAINED 0、`baseline/` 78 檔 mtime 全部仍是 2026-07-29 |
| 38 | 2026-08-05 | **`zk.version` 10.2.1-jakarta-Eval → 10.4.0-jakarta.FL.20260713-Eval(S24 的修法)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— 77 檔 / 14323 條。**閘門與 ZK 版本無關這件事本身也被證明了**:`baseline/` 是 node 工具鏈(`zklessc` + `build-css.js`)產出的,不碰任何 ZK jar,所以升版後逐檔差異仍然是 0 —— 這是刻意去跑來證明,不是假設。**選 `-jakarta.FL.<date>-Eval` 而不是 `X.FL.<date>-Eval`**:後者出貨 javax,Spring Boot 3.x 的 preview app 會死在 `javax/servlet/*`;`mvn -o dependency:list` 確認 zk / zul / zkmax / zkex / zweb **五顆全部解析到 10.4.0-jakarta.FL.20260713-Eval**,app 自報 `ZK 10.4.0.FL.20260713`。**S24 的目的達成,實測**:(a) 10.4 jar 的前綴白名單確實多了 `~./zul/font/`(`strings` 讀 class 得四個字串,10.2.1 只有兩個);(b) **彙整檔現在放的是我們的 font-awesome** —— `agg.includes(theme fa)` = **true**、`agg.includes(jar fa)` = **false**(10.2.1 時恰好相反);(c) **覆蓋率 74/77 → 75/77**,未參與畫面的位元組 **35.4% → 7.0%**;(d) 剩下 2 個仍不在彙整檔內的就是預期的那兩個 —— `js/zkmax/inp/css/tbeditor.css.dsp`(舊路徑死複本,S18)與 `zkmax/css/tablet.css.dsp`(桌機 UA 下 `disabled`,P7);(e) **A/B 訊號仍在**:A `7d76bbd6…` / 530434 B vs B `9bf798ec…` / 531453 B 不同,而兩側正規化後**都是 525145 B 且相同**(與 10.2.1 上同一個數字,交叉印證語意等價不隨 ZK 版本改變)。**但升版也揭出一筆代價,見 S25** |
| 39 | 2026-08-05 | **artifact 自己的版號跟上 ZK`10.2.1-jakarta-Eval` → `10.4.0-jakarta-Eval`(議題 B,user 裁示選項 A)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— 77 檔 / 14323 條,**與升版前完全相同**。4 處:`pom.xml` 的 `<version>`、`config.xml` 與 `lang-addon.xml` 的 `<version-uid>`、`Version.java` 的 `UID`;**它們只需彼此一致,建置與 runtime 都不會拿去跟 `zk.version` 對照 ⇒ 漂移是靜默的**。不取 `10.4.0-jakarta.FL.20260713-Eval`:FL 日期描述的是**依賴**、而且是移動標的,這個字串標識的是 **artifact 自己**。跑閘門是為了證明「不動」而不是假設 —— 同時 `git diff -- src/main/resources/web` 為空、`xmllint --noout` 兩個 XML 乾淨 |
| 40 | 2026-08-05 | **補齊第一層:20 個 `--zk-severity-*` token(S25 / 議題 A 的前置)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— 77 檔 / **14343** 條(14323 + 20)。**更新 baseline 之前**先量:**1 檔差異 / 20 筆,全部是 `+`、全部落在 `:root`、沒有一筆 `-`、沒有第二個檔** —— 預期的形狀完全命中。`check:bytes` 只把 `norm.css.dsp` 標為 UNEXPLAINED(**71136 → 71833 B**)。**三個檔補完之後與 ZK 10.4 逐 byte 相同**(`profiles/_default.less`、`profiles/_compact.less`、`_zkvariables.less`)⇒ 補的是原件而不是重寫。**token 缺口是封閉的**:ZK 10.4 定義 **862** 個 `--zk-*`、本主題 **842**,差的就是這一組,沒有其他漂移。**`baseline/zul/css/norm.css.dsp` 是本輪唯一被改的既有 baseline 檔** —— 跨越這次更新跑 manifest 檢查得到 **1 changed / 0 missing / 0 extra**,那才是「其餘 76 檔沒被動到」的證明;更新後 baseline norm 定義 862 個 `--zk-*`,與預測相符。`_compact.less` 沒有被 `@themeProfile` 選中所以不影響輸出,但仍然補 —— 少補就是 compact 模式悄悄掉色 |
| 41 | 2026-08-05 | **補齊第二層:從 `zk` / `zkcml` 的 `10.4` 分支匯入 8 個元件 entry LESS(輸出 77 → 85)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **⚠ PASS,但這一列的 0 是「因構造成立」,不得當成正確性證據。** 既有 77 檔的證明力來自「baseline 來自 master 的 LESS、候選來自轉換後的 CSS」兩者不同源;這 8 個檔匯入當下**仍是 LESS**,baseline 與候選出自**同一次編譯** ⇒ 差異必然為 0。真正的比較在紀錄 #42。**更新 baseline 之前**量到 85 檔 / **8 檔差異 / 0 筆**(全部 `ONLY IN CANDIDATE`),即「新檔,不是內容不符」。**8 這個數字是用第二種獨立方法確認的,不是信 app log** —— log 只會抱怨頁面真的請求過的檔,那是 S24 已經踩過的無效推論;改用來源樹逐檔對:ZK 側 **81** 個 entry vs 主題側 **77**,同樣的 8 個名字(兩側一開始都少算 1,因為 `zul/font/font-awesome` 是唯一不在 `less/` 底下的 entry)。順帶浮出 **4 個「主題有、ZK 沒有」** = L2.5 已記的舊路徑死複本(tbeditor / goldenlayout / cropper / signature),與 S18 第三次互相印證。`baseline/` **只新增這 8 個檔**:把新 manifest 的 hash 行與已 commit 的那份逐行對,**0 行刪除、8 行新增、且新增的正是這 8 條路徑** —— 那才是「既有 77 檔沒被動到」的證明。8 個輸出都非空、taglib header 都在 offset 0。`check:baseline` OK 86 檔(78 + 8) |
| 42 | 2026-08-05 | **補齊第三層:8 個 backfill 元件逐檔轉成 CSS(P3 紀律,一檔一 commit)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS —— 這一列才是真正的證明。** baseline 是 `zklessc` 從匯入的 LESS 編出來的、候選是 `build-css.js` 從轉換後的 CSS 編出來的,**兩者不同源**,所以 `files differing: 0` 恢復意義。逐檔閘門 8/8 全 0,無一次失敗;宣告數 30 + 22 + 44 + 35 + 113 + 49 + 104 + 123 = **520**,正好等於 14863 − 14343。位元組差異全部落在既有的封閉序列化類別(`whitespace around , and >`、`leading zero on decimals`),**`check:bytes` 全樹 UNEXPLAINED = 0**(norm 也回到乾淨,因為 #40 已更新它的 baseline)。收工狀態:來源端 **83 `.css` + 2 `.less` = 85**,`build-css.js` 覆蓋 **83** 檔、`zklessc` 剩 **2** 檔。**執行層驗收(不是閘門,閘門只證明轉換無損)**:起 preview app 抓瀏覽器實收的彙整 CSS,8 個元件的選擇器全部到位(`.z-avatar` 28 / `.z-avatargroup` 13 / `.z-badge` 25 / `.z-breadcrumb` 13 / `.z-carousel` 36 / `.z-chip` 13 / `.z-confirmpopup` 57 / `.z-daterangebox` 46 次命中)、20 個 `--zk-severity-*` 全部被服務、`Unable to load` **歸零**。**這一輪沒有產出可信的覆蓋率數字,見 S27** |
| 43 | 2026-08-05 | **第 4 層獨立驗證重跑同一個閘門**(`4aac5e5`…`c89e4b2`,覆核者不是實作者) | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS —— 85 檔 / 14863 條,三個數字由第三方獨立重現。** 這一列的意義不在數字(#42 已經記過),而在**誰跑的**:同一個 `npm run check:cssdiff`(**沒有**跑 `npm run baseline`)由獨立覆核者在自己的 session 裡跑出 `build-css: compiled 83 file(s)` + `zklessc 2 file(s)` + `files compared: 85` + `declarations: 14863` + `files differing: 0`,與實作者引用的數字**逐一相同** ⇒ 排除「數字是實作者手抄錯」與「只有實作者的環境才過」兩種可能。同一輪並獨立重跑 `check:bytes`(**UNEXPLAINED 0**,8 個 backfill 檔全部落在既有 5 類封閉清單內)。報告:`doc/l4-verify-zk104-backfill.md` |
| 44 | 2026-08-05 | **視覺 A/B harness —— 自我驗證 + 反向控制**(L2.4 前置項收工;不動任何 theme 來源) | `selftest-a`(截圖) | `selftest-b`(截圖) | **0**(頁) | — | **PASS**。**主閘門不動**:`check:cssdiff` 仍是 85 檔 / **14863** 條 / `files differing: 0`(這一列動的只有 `package.json` / `.gitignore` / 兩支新腳本 / `src/test/playwright/`,一個 theme 來源檔都沒碰)。**這一列的判準是「頁」而不是「條」** —— 語料 **116 頁**(Marble worktree 已編好的 `target/test-classes/web`,**沒有**搬進本分支)、theme 指紋 `6e5a856e8a80ddf9` / 85 個 `.css.dsp`。**自我驗證**:同一個 build 截兩次 → `theme finger: SAME` + `pages differing: 0`,**連續兩輪**;噪音 4–5 頁、全部 ≤42px 且 maxΔ 1。**反向控制(這一列真正的證據)**:對 `target/.../button.css.dsp` 追加一行 `.z-button{border-radius:12px}` → `theme finger: DIFFERENT` + **36 頁差異**,全部是有 button 的頁,最小 370px / maxΔ 255 ⇒ 對噪音上限(≤64px 且 maxΔ ≤8)有 **≈6 倍**餘裕;隨後 `npm run build:css` 把指紋還原回 `6e5a856e8a80ddf9`(**未曾修改任何來源檔,也沒有用 `git checkout`**)。**啟動守門探針**:抓 `/button.zul` 斷言 `_zkiju-iceblue_css` 在場且 `marble` 出現 **0** 次 —— 沒有它,一個「主題其實沒載到」的 harness 會給出完美的零,與 #41 的空轉同型。**載入機制不需要改 Marble worktree 任何一個檔**:ZK 的 `Library.getProperty` 找不到時會退回 `System.getProperty`(`zcommon/…/lang/Library.java:77`),而 `ThemePreviewIceblueApp` 本來就故意不設 preferred theme ⇒ 命令列 `-Dorg.zkoss.theme.preferred=iceblue_css` 即可;classpath **刻意排除** Marble 的 `target/classes`,否則 `MarbleThemeWebAppInit` 會裝上並**鎖住**(`setCustomThemeProvider(true)`)`MarbleThemeProvider`,而它會把 `font-awesome.css.dsp` **整條丟掉** —— 那是 P6 的全部交付、全樹 28%。收斂過程與 6 項實測發現見 **S32**;規格 `doc/visual-ab-harness.md` |
| 45 | 2026-08-06 | **第 4 層獨立驗證視覺 A/B harness(`196773e`)—— 推翻 #44 的一個數字,並修掉兩個真缺陷** | `selftest-a`(截圖) | `selftest-b`(截圖) | **0**(頁) | — | **PASS-WITH-FINDINGS**(覆核者判定:9 CONFIRMED / **1 REFUTED** / 3 PARTIAL);**修完之後 `selftest` 連續三輪 PASS**。**主閘門不動**:`check:cssdiff` 仍 85 檔 / **14863** 條 / `files differing: 0`,一個 theme 來源檔都沒碰。**被推翻的是 #44 的「連續兩輪 `pages differing: 0`」** —— 覆核者獨立重跑兩次**都不是 0**:`iframe` 6855px / maxΔ255,兩次幾乎同一個 box(`10,60,304,274`),而噪音頁的 maxΔ 從沒超過 6 ⇒ 那是系統性錯誤分類,不是噪音。覆核者定位到「冷 session 的第一次 capture」;**本輪追下去發現根因更基本,而且與冷熱無關**:spec 的**每一個等待**(`waitForFunction` / `addStyleTag` / `fonts.ready`)都只作用在 **main frame**,而 `iframe.zul` 用真正的 `<iframe>` 內嵌 `~./html.zul` ⇒ **內層頁面從來沒有被等過**,拍到什麼純粹看誰先跑完。**直接證據**(臨時探針,量完即移除):main frame 全部等待完成的當下,子 frame 是 `readyState=loading` 且 `zk` **尚未載入**;全 116 頁**只有這一個**子 frame。已修 —— 新增 `settleFrame()`:每個子 frame 等 `readyState==='complete'` +(有 `zk` 才等)`zk.loading` + 圖片 `complete`,並注入同一份 no-motion CSS。**第二個真缺陷是修完 iframe 之後自己冒出來的**:`toolbar` 開始間歇壞掉,5 次 capture 裡中 2 次(一次 `255px / maxΔ 59`,一次**整頁拍不穩** ⇒ `MISSING`,這也是 C8「不穩就不寫 PNG」那條路徑**第一次被真實觸發**)。它與 #44 第 2 項同型,但**那份清單漏了語料側**:`ANIMATED_ASSETS` 只寫死主題自己的 5 個 GIF,而 `toolbar.zul` 用的是 ZK 自帶的 `~./img/network.gif`,**也是動畫 GIF**(NETSCAPE2.0 marker、6011 bytes)。已改成**看內容、不看路徑**:攔所有 `.gif` → `route.fetch()` 取 body → 含 `NETSCAPE2.0` 才 `abort`,否則原樣 `fulfill`。實測:ABORT `prgmeter-anim`(6 次)/ `progress-32` / `progress-72`(117 次)/ `network.gif`,keep `volumn` / `live` / `defender` / `battery`(靜態,保留)。**過程中我自己的第一版正規表示式是錯的**,而且是探針抓到的不是推理出來的:`/\.gif(\?|$)/` 漏掉 ZK 的 **`;jsessionid=` 路徑參數** ⇒ `network.gif` 根本沒被攔到,第一次跑只印出 3 條 ABORT;修正為 `/\.gif(?:[;?]|$)/i`。**收工**:`npm run visual:selftest` 連續 **3** 輪 `pages differing: 0` **且 `pages missing: 0`**(噪音 3–7 頁)。順手修掉覆核者的 LOW 發現 6:`diff` 的 verdict 在有 `missing` 時會先報 missing —— 原本可能印「harness is deterministic」而回傳碼卻是 1。報告 `doc/l4-verify-visual-ab.md`、委託書 `tasks/l4-verify-visual-ab-brief.md`;敏感度與兩個盲區見 **S33** |
| 46 | 2026-08-06 | **S16 —— 修 `less2css.js` 的 CR 處理(P5 唯一還缺的前置)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— 85 檔 / **14863** 條(只動 1 支**不在 build 路徑上**的轉換腳本,輸出結構上不可能變;跑它是為了證明,不是為了發現)。**缺陷**:`rewriteLineComments` 用 `src.indexOf('\n', i)` 找 `//` 註解的結尾,只認 LF ⇒ CRLF 來源的 `\r` 被收進註解**內容**,得到 `/* x\r */`;`\r` 本身不會出現在輸出(LESS 的 renderer 連註解內的行尾都正規化)—— **正規化的結果就是缺陷本身**:`\r` 變成 `\n`,一行的註解變成兩行、`*/` 獨自落在第二行。**已改成掃到第一個行終止符**(`\r` 或 `\n` 皆可,順帶涵蓋 lone-CR)。**端對端實測**(以 `norm.less` 上方那兩個 import 當前綴,把 `_reset.less` 當作 P5 會做的那樣送進改寫 + `less.render`):**斷行註解 13 → 0**;註解總數兩側都是 **89**、**把空白摺疊後兩份輸出逐字元相同** ⇒ 沒有任何註解文字被增刪,唯一的差別就是那 13 個換行(byte 60884 → 60870,−14 = 12 × −1 + 1 × −2,多的那 1 是 `_reset.less:414` 註解文字尾端本來就有空白)。**13 這個數字是量的不是數的** —— 改寫前後的區塊註解數之差。**迴歸控制**:對樹上**仍存在的 2 個 entry `.less`** 逐檔跑舊/新兩版改寫器,**0 檔不同**(它們沒有 CR)⇒ 已轉好的 83 檔結構上不可能被這次改動影響;對 **61 個 partial** 跑同一個對照,**恰好 3 檔不同** —— `_reset`(431 CR)、`_header`(7)、`_zkvariables`(4),與 S16 記的三個檔完全吻合,沒有第四個 |
| 47 | 2026-08-06 | **P5 步 1 —— `build-css.js` 取得三個機制(串接 / 自帶 header / DSP 佔位符)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— 85 檔 / **14863** 條。**這一列的重點不是閘門,是「機制對既有 83 檔完全無作用」這件事被量過**:把 `5958d1b` 的來源樹(`git archive`)餵給**新版**腳本,83 個輸出**逐 byte 等於**現行建置的產物 —— 也就是說,如果這顆 commit 弄壞了什麼,它弄壞的東西還沒有人使用。三個機制:`resolveImports()` 就地展開 `@import`(**必須在 minify 之前** —— CleanCSS 的 `inline` 預設是 `['local']`,會拿 process cwd 去解路徑,所以「沒解掉的 `@import`」不是無害而是危險,已加成第 5 條 `HOSTILE_CONSTRUCTS`);`TAGLIB_MARKER` 讓來源自己決定 header 位置(`norm.css.dsp` 的 header 在 byte **43785** 的 tokens/reset 接縫,搬到 offset 0 是無謂的差異),判準讀的是**來源**不是輸出,且與 `NO_HEADER` 衝突時**報錯**而不是默默取一邊;`PLACEHOLDERS` 在 minify **之後**把 `.ZKBD ` / `ZKBD-OFF` 還原成 DSP。**守衛沒有被放寬**:`assertMinifierSafe()` 改成跑在**去註解後**的文字上(= 壓縮器真正看到的東西)—— 註解裡的敵意構造根本到不了 CleanCSS,而跑在原文上會讓 `norm.css` **無法在自己的檔頭說明自己的機制**(它的註解同時提到 `@import` 與 taglib,兩者都會讓建置失敗)。`/*!` 註解仍在掃描範圍內 |
| 48 | 2026-08-06 | **P5 步 2 —— `norm` 轉純 CSS(tokens + palette + reset + 全域)** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS,而且是 G-zero 不是計畫書原訂的 G-delta** —— 85 檔 / **14863** 條。`browserDefault` **不改 `@scope`**(**S35**),runtime 行為一個 byte 都沒動,所以不需要開/關兩組 computed-style A/B。**輸出端 DSP 逐項對齊 baseline**:selector 前綴 **90 = 90**(來源側 `_reset.css` 56 + `norm.css` 34)、`<c:if ` 與 `</c:if>` **93 / 93**(= 90 前綴 + 3 整塊)、`${}` 腐化 **0**、taglib 指令 **3** 條且仍在接縫、規則區塊 **357 = 357**。**byte 差異 20 / 357 個區塊,全部落在既有的封閉序列化清單內**(`classify()` 非 null),逐一看過:值內逗號空白(`"Helvetica Neue", Helvetica`、`monospace, monospace`、`rgba(0, 0, 0, 0)`)、前導零(`.67em` vs `0.67em`)、`>` 兩側空白、`background-image: url(…)` 的冒號後空白 —— **沒有一處涉及 DSP、EL、選擇器語意或 declaration**。**順手清掉 1 個註解空殼**(`@media print` 裡的 `img{}`,是 S8 那一類的最後一個;註解已移出保留)。`build-css.js` 覆蓋 83 → **84**,`zklessc` 只剩 **1**;`check:build-css` 的 `norm` 從 **passthrough 轉為真來源實測**(84 檔全部來自真來源、0 未分類);`check:bytes` UNEXPLAINED **0**;`withjdk.sh 17 mvn package` 產出的 jar **85 個 `.css.dsp` / 0 個原始 `.css` 或 `.less`**。**兩個非閘門後果一併記錄**:compact profile 暫時要設兩處(**S36**)、產生出來的遷移文件指向已刪路徑且不能靠重跑解決(**S37**) |
| 49 | 2026-08-06 | **P5 的第 4 層獨立驗證(`fea5f32`..`dde09ee`)—— 補上 restore 方向的守衛、更正 S37 一句** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS-WITH-FINDINGS** —— 85 檔 / **14863** 條。**C1–C9 九條斷言全部 CONFIRMED**,且 **C4 是用比自我複核更強的方法確認的**:覆核者**不信任專案自己的第 4 類序列化**(名字叫「`,` 與 `>` 兩側空白」,實作卻是 `replace(/\s+/g,'')` 的**全空白剝除** —— 那也會蓋掉一個被弄丟的 descendant combinator),自己寫了只剝**標點相鄰**空白的正規化器,在它底下 baseline 與 built 的 `norm.css.dsp` **逐 byte 相同(72646 = 72646)**;另外**手眼看過全部 45 個以 `;` 切出的差異片段**,只有 `rgba` 空白、前導零、`0` vs `0px`、`>` 空白。**找到 1 個真缺口(MEDIUM)並已修(`364f8ec`)**:`restorePlaceholders()` 跑在**全部 84 個輸出**上,但**沒有任何守衛** —— `a::after{content:".ZKBD "}` 會把 `<c:if>` 注進一個**帶引號的值**裡、exit 0 零警告;兩個 taglib marker 會把 header 印兩次,一樣安靜。**出去的方向一直很嚴(`HOSTILE_CONSTRUCTS`),回來的方向卻在賭 `.ZKBD` 是個不太可能出現的字串。** 已改成明說「佔位符只屬於 `zul/css/norm.css`」,兩個負向控制皆 exit 1 且指出原因,單 marker 的正向控制照樣建置成功。**更正一句自我複核**:S37 原本寫「失敗清單逐項相同」,實際是 **10 / 12 相同**,2 條因 P5 移動(`773 → 837`、`698 → 837`)—— 我當時是拿**改過的腳本**跑舊樹,覆核者用**舊腳本 + 舊樹**才逼出來(見報告發現 3)。**另外兩件記下來**:(a) 驗證期間 HEAD 從 `a03edcf` 前進到 `dde09ee`,覆核者**自己證明那三顆對輸出無影響**(`git archive a03edcf` 重建 → 84 檔逐 byte 相同)並在 `dde09ee` 重跑 C1–C4/C7/C8 得到相同數字;(b) **compact 旋鈕的等價性被獨立證明了** —— LESS `@themeProfile:"compact"` 與 CSS `@import "tokens/_compact.css"` 產出 strict-equal、兩邊皆 862 個 token;但**只設 `@themeProfile`** 時 `norm.css.dsp` 與 default 建置**逐 byte 相同**(還是 16px)而 `tablet.css.dsp` 真的切換了 ⇒ **S36 描述的分裂主題確實會發生,而且沒有任何檢查看得到**,目前只靠 `readme.md` 的文字擋著。報告 `doc/l4-verify-p5-norm.md`。**視覺 A/B 本輪未跑**(委託書沒要求),另計 |
| 50 | 2026-08-06 | **P5 的視覺 A/B(baseline vs P5 建置,116 頁)** | `baseline/`(側 A) | `target/classes/web/iceblue_css`(側 B) | **0** | **0** | **PASS** —— 主閘門 85 檔 / **14863** 條照舊為 0;視覺側 **116 頁比對、pages differing: 0**。**theme 指紋 DIFFERENT(`75f538af22468640` / `5c570ab19195cdc2`)** —— 這一欄是本列的重點:兩側**確實是不同的 theme byte**,所以這個 0 不是空轉,而是「20 個序列化差異區塊在 116 頁裡照不出任何畫面變化」的端對端確認。跑之前先做 `visual:selftest`(同一個 build 截兩次)得 **pages differing: 0 / pages missing: 0**,證明 harness 當下是決定性的。雜訊 4 頁,全部在實測噪音下限之內(≤64px 且 maxΔ ≤8)。**採信範圍照 S33 限制**:語料是 Marble 的頁面、不是針對 85 個輸出檔設計的,稀有元件會漏接,`camera` / `barcodescanner` / `video` 三個輸出檔結構性看不到 —— 所以這一列說的是「**看不到差異**」,不是「**沒有差異**」。**計畫書原本把 P5 列為視覺 A/B 價值最高的一階**,理由是 `@scope` 會改變「誰被選到」;既然不採 `@scope`(**S35**),這一輪的角色就從「判定改動對不對」降為「確認真的沒動」——價值取決於該階段有沒有真的改選擇器,不取決於階段編號(已改寫進計畫附錄 §2.4) |
| 51 | 2026-08-07 | **重算視覺 A/B 覆蓋率(85 檔),並把它變成可重跑的 `npm run visual:coverage`** | `baseline/` | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— 85 檔 / 14863 條(探針只動 `target/` 的建置產物,而且會逐 byte 還原;跑前跑後各驗一次)。**實測:80 到彙整檔 / 1 被連但 `disabled`(`zkmax/css/tablet.css.dsp`,桌機 UA,P7 的檔)/ 4 從來沒人要 ⇒ A/B 覆蓋率上界 80/85**,未參與畫面位元組 **39367 / 640189 = 6.1%**(位元組口徑同 S24:磁碟上的 `.css.dsp` 大小)。**4 個沒人要的全部是 S18 的舊路徑死複本**(`js/zkmax/layout/goldenlayout`、`js/zkmax/med/cropper`、`js/zkmax/wgt/signature`、`js/zkmax/inp/tbeditor`)—— 活的是**元件名資料夾**、死的是**分類資料夾**,而這一組結論用**兩種獨立方法**得到:標記探針(服務出來的位元組)與 `unzip -p zkmax-10.4.0-….jar metainfo/zk/lang-addon.xml` 的 `<widget-package>` / `<css-uri>` 宣告。**這個數字推翻了 S24 的 75/77,見 S38。** 三個控制組全過:正向(`zul/css/norm.css.dsp` = `AGG`)、負向(`--holdout` 一個已知 `AGG` 的檔 → 翻成 `MISS`,且彙整檔正好少 29 B = 一個標記)、跨頁(`/button.zul` 與 `/usecase/inventory-table.zul` 命中集合相同 —— 「一頁就夠」這個假設至此才被驗過)。**還有一個不必信任程式碼的算術核對**:未注入 551581 B → 注入後 553901 B,差 **2320 B ÷ 29 B = 80**,與「80 個檔到彙整檔」逐一相符。還原 **85/85 sha256 相同**。口徑與方法全部寫進 [visual-ab-harness.md §6](visual-ab-harness.md) |
| 52 | 2026-08-07 | **P4a —— vendor prefix 純移除(L-2 選項 C)** | `baseline/` | `target/classes/web/iceblue_css` | **45** | **728** | **PASS(G-delta)** —— **這是全計畫第一個「差異不為 0 才算對」的階段**,所以 `cssdiff` 的 exit code 不再是通過訊號:判準改為 `npm run check:p4a`(`scripts/check-p4a-delta.js`)**exit 0**。它斷言六件事,任何一件不成立就 exit 1:(1) 每一筆差異都是**移除**,出現任何 `+` 就失敗(成對替換是 P4b,另一顆 commit);(2) DSP 指令一條都沒動;(3) 被移除的屬性一定帶 `-moz-`/`-ms-`/`-o-`/`-khtml-`;(4) B 群 carve-out `-moz-osx-font-smoothing` 不得出現;(5) **每一筆移除,candidate 在同一個 rule 裡仍然宣告了無前綴版本** —— 這條才是「安全」而不只是「形狀對」的證據;(6) `-webkit-` 條數兩側相同(**313 = 313**)。實測 **728 條 / 45 檔**:`-ms-` 255、`-moz-` 239、`-o-` 230、`-khtml-` 4;屬性 `border-radius` 378、`transform` 135、`box-shadow` 114、`box-sizing` 45、`user-select` 16、`transition-*` 21、`transform-origin` 6、`outline` 2、`flex-direction` 9、`flex` 1、`appearance` 1。**與拍板時的預測 728 完全相同**(788 − tablet 60)。**三個負向控制全部觸發**:在 `fisheye.css` 刪掉一條 `-webkit-border-radius` → `removed a -webkit- declaration` + `-webkit- count changed: 313 → 312`;同一處加一條 `zoom:1` → `ADDED record (P4a may only remove)`;`--expect 727` → `expected 727, measured 728`(exit 1)。控制組跑完以 Edit 還原(**沒有** `git checkout`,工作樹有未 commit 的 P4a 變更),還原後 shape gate 再次 exit 0。編輯是腳本做的(`npm run p4a:strip`),而且**冪等** —— 再跑一次 `--check` 是 `would remove: 0`,所以它同時是「不得復活」的來源端守門員。`check:less-conventions` / `check:fa-css` 仍 exit 0。**`check:bytes` 與 `check:build-css` 轉為 FAIL,是結構必然,不是缺陷 —— 見 S41。** **tablet 的 60 條刻意不在本階**(P7 holdout,仍由 zklessc 編譯),shape gate 用 `DEFERRED` 明文擋住它被動到 |
| 53 | 2026-08-07 | **P4a 第 4 層獨立驗證,以及它揪出的閘門強化** | `baseline/` | `target/classes/web/iceblue_css` | **45** | **728** | **PASS-WITH-FINDINGS** —— 第 4 層對 C1–C12 **全部 CONFIRMED**,無一被推翻,全部用**不經過被驗證腳本**的方法重量(自寫 tokenizer 做**多重集**差異而非 LCS、`git show --numstat` 自行加總、`git show 41efc3a^:` 對照工作樹)。**最有價值的一條發現是閘門自己的弱點**:`check-p4a-delta.js` 原本以**正規化後的 selector 字串**為 key 建同伴桶,所以同 selector 的不同 rule block 會被合併 —— 一個真的失去同伴的 block 可以被它的同名兄弟背書。覆核者另寫 per-block-instance 檢查證明**本樹遮蔽案例 = 0**(所以那次 PASS 是對的),但斷言強度不如 docstring 自稱。**同日修正**:改用 block instance(record 串流中連續同 ctx 的一段),並加斷言「block 數與 ctx 序列兩側相同」;**修正後仍 exit 0**。**新斷言的負向控制**:在 `combo.css` 六個同 selector 區塊中的**一個**刪掉無前綴 `border-radius` → 精確報出 **3** 條 `removal left no unprefixed twin in that same rule block`(`.z-combobox-input` 的 `-moz-`/`-o-`/`-ms-border-radius`),而**舊實作會放行這 3 條** ⇒ 強化不是形式上的;以 scratchpad 副本還原,還原後 exit 0。**另外三條獨立佐證**:(a) 對 **candidate** 重跑資格掃描,全樹只剩 **60** 條符合條件且**全在 tablet**,其餘 84 檔 0 —— 完全不經過 `p4a:strip`,同時關掉「`combo` 只改到幾組」與「孿生檔只改一邊」兩個疑慮;(b) 前綴總帳結清 **1132 → 404**,非 webkit 殘留 **91 = 16 carve-out + 60 tablet + 15 P4b 孤兒**,而獨立掃出的孤兒**正好 15**;(c) `norm.css` 兩側同為 3 taglib + 93 `<c:if>` + 93 `</c:if>` 且逐字相同,全樹 DSP directive 差異 **0**。順帶揭出兩處既有文件口徑不一致(**S42** `-webkit-` 285 vs 313、**S43** 1127 vs 1132),兩者都非 P4a 引入。唯讀性:`git status --porcelain` 只有委託書那一個 `??`,`baseline/` 零異動。完整報告 [l4-verify-p4a.md](l4-verify-p4a.md) |
| 54 | 2026-08-07 | **第 1、2 層複核改為 delta-aware(S41 裁示選項 A)** | `baseline/` **+ 推導出的 P4a delta** | `target/classes/web/iceblue_css` | **0** | **0** | **PASS** —— S41 的問題不是那兩支壞了,是「candidate 是不是**等於** `baseline/`」這個問題在 G-delta 階段過期了。新的 `scripts/p4a-delta.js` 把那 728 條當作 **`baseline/` 的純函數**重新推導(四個條件全都讀得出來:屬性帶四種可移除前綴之一、不是 `-moz-osx-font-smoothing` carve-out、**同一個 rule block** 另有無前綴同伴、不在 P7 holdout),`check:bytes` 與 `check:build-css` 改與**調整後的基準**比對。**沒有 manifest、沒有快照、`baseline/` 一個 byte 都沒動**(調整後的樹只存在於記憶體與 temp dir)。**這不是套套邏輯**:`p4a-strip-prefixes.js` 改的是**來源 `.css`**、逐行做;這一支讀的是**編譯後、壓縮過的 `.css.dsp` 輸出**、走括號與分號結構,兩邊獨立寫成。**兩者獨立算出完全相同的分解** —— **728 條 / 45 檔**,`-ms-` 255 / `-moz-` 239 / `-o-` 230 / `-khtml-` 4,屬性直方圖 14 項逐項相同(`border-radius` 378、`transform` 135、`box-shadow` 114、`box-sizing` 45、`user-select` 16、`transition-duration` 9、`flex-direction` 9、`transform-origin` 6、`transition-timing-function` 6、`transition-delay` 3、`transition-property` 3、`outline` 2、`flex` 1、`appearance` 1)。實測:`check:bytes` **UNEXPLAINED 0**(byte 相同 25 / 以 5 類序列化解釋 60);`check:build-css` **85 檔 / 14135 條 / files differing 0**,byte 相同 24/84、byte 不同 60 全部落在既有 4 類序列化。**14135 = 14863 − 728**。**三個負向控制全部觸發**:(a) 在 `fisheye.css` 刪掉一條 `-webkit-border-radius`(P4a **未**核准移除的)→ 兩支都紅,`794B vs 743B` / `no known class explains`;(b) 加回一條 P4a 已移除的 `-moz-border-radius` → 兩支都紅,`794B vs 842B` —— 證明 delta-aware **不等於**「一律忽略前綴差異」,復活一樣會被抓;(c) 把推導規則擅自放寬到含 `-webkit-` → 尺寸斷言開火,`derived 975 removals, expected 728` / `derived 47 changed files, expected 45`,`check:build-css` 直接 exit 2 不往下跑。控制組全部以 scratchpad 副本還原,還原後 `git status --porcelain` 不再列出這兩個檔。**728 刻意宣告兩次**(`p4a-delta.js` 的 `EXPECTED_REMOVALS` 與 package.json 的 `check:p4a --expect 728`):兩者走不同程式碼、看不同輸入,若哪天不一致,**不一致本身就是發現**。`check:cssdiff` 維持 **45 / 728**(判準仍是 `check:p4a`,見 #52),`check:less-conventions` / `check:fa-css` / `check:p4a` 全部 exit 0 |
| 55 | 2026-08-07 | **delta-aware 改動的第 4 層獨立驗證** | `baseline/` **+ 推導出的 P4a delta** | `target/classes/web/iceblue_css` | **0** | **0** | **PASS-WITH-FINDINGS** —— C1–C11 **全部 CONFIRMED**。覆核者**自己寫了第三套實作**(Python,字元狀態機遮罩 + **堆疊式**葉節點判定,與 `p4a-delta.js`「最後一個 `{` 勝出」是不同演算法、不同語言),再加上**來源端 ground truth**(`git diff --numstat 41efc3a^ 41efc3a`)—— 兩條路徑都獨立得到 **728 / 45**,且 14 項屬性直方圖逐項相同。直方圖不是引用 `p4a:strip` 的報告,而是**從 P4a commit 的 `-` 行重建**的。**逐檔比對零不符**(不只是總數對得上),孿生死複本 `cropper` 42/42、`goldenlayout` 42/42、`signature` 6/6 一致。C10(兩套獨立實作)以五點論證確認:輸入語料不同(89 個展開來源 `.css` vs 85 個壓縮 `.css.dsp`)、演算法不同(行導向正則 vs 字元偏移遮罩)、失敗模式互不適用、無程式相依、細節選擇各自為政(前者 `toLowerCase()` 屬性名、後者不做)。C11 以自寫稽核確認:728 條被刪切片**全部**符合前綴宣告形狀,含大括號/DSP 標籤 **0**、含 `url(` **0**,全樹 taglib / `<c:if>` / `${` / `url(` / `<%` 計數變化 **0**,norm 的 base64 payload 逐字相同;另驗 `combo` 四種 placeholder **前綴選擇器**(`::-webkit-input-placeholder` 6 / `::-moz-placeholder` 6 / `:-ms-input-placeholder` 6)調整前後數量不變 —— 前綴**選擇器**與前綴**屬性**沒有被混為一談。**最有價值的一條發現是驗證協定自己的盲點**(→ **S45**):`baseline/` 被 `.gitignore` 忽略,所以歷來每一輪指定的唯讀證明 `git status --porcelain` 對「基準有沒有被寫」**結構上永遠是綠的**;覆核者只好改用 mtime(基準最新 mtime 比本輪早 **2.09 天**)加程式碼路徑分析補上。**另外兩條**:(a) 巢狀 at-rule 路徑**正確但完全沒有資料在實測它** —— 10 個檔有 depth≥2 區塊,但巢狀區塊內前綴宣告 **0** 條,728 條全在 depth 1,`tablet` 解禁後也踩不到,所以「兩套實作一致」**不能**當成這條路徑的證據;(b) 完整帳目結清 —— candidate 殘留 **75 條可剝除前綴 + 16 carve-out**,其中「合格但未移除」的**只有 tablet 的 60 條**,其餘 15 條全是無同伴的 P4b orphan ⇒ **728 + 60 + 15 + 16** 是一本沒有缺口的帳。順帶揭出 `p4a-delta.js` 註解裡 data URI 的舉例失準(說 png/base64,實際 norm 是 `${c:encodeURL("data:image/gif;base64,…")}`、selectbox 是 `data:image/svg+xml;charset=utf8`,**兩種形狀都真實存在**)—— 保護行為正確,只有舉例錯,**同日修正**。**唯讀性**:`git status --porcelain` 只有委託書那一個 `??`;三個負向控制**完全沒有動 repo**(對 scratchpad 副本突變,用覆核者自己移植的比對邏輯重現偵測性),因此不存在還原殘留風險。委託書 `tasks/l4-verify-s41-delta-aware-brief.md` |
| 56 | 2026-08-10 | **P4b —— vendor prefix 逐條判斷(C 群孤兒)** | `baseline/` **+ 已核准的 P4a delta** | `target/classes/web/iceblue_css` | **9** | **14 移除 / 7 新增** | **PASS** —— 普查先自 `baseline/` 推導孤兒母體(帶可移除前綴、非 carve-out、**同 block 無無前綴同伴**),並**自帶自檢**:同一支 parser 必須先重現 P4a 的 **728 / 45**,重現不了就中止 —— 重現不了的 parser 數出來的孤兒也不可信;實測通過。母體 **15 條**,與拍板數字逐項相同(`-moz-appearance` 6 / `-ms-zoom` 3 / `-ms-touch-action` 2 / `-moz-user-select` 2 / `-ms-flex-align` 1 / `-khtml-user-select` 1)。**第一個發現:本階實際只動 14 條** —— 第 15 條(`-moz-appearance: none`)落在 **P7 holdout `zkmax/css/tablet.css.dsp`**,和 P4a 讓掉的 60 條同一個理由,計入 P7。**判準是「選讓現代瀏覽器行為不變的那一邊」,而且雙向都用到**:Firefox 今天**確實吃** `-moz-appearance` / `-moz-user-select`,純移除會退化 ⇒ **改名成標準屬性**(`rename` 7);`-ms-zoom` / `-ms-touch-action` / `-ms-flex-align` / `-khtml-user-select` 現代瀏覽器**全都不吃**,純移除等於沒動、補標準宣告**反而是新增行為** ⇒ **純移除**(`remove` 4 + `remove-rule` 3)。兩個方向都收斂到「不改行為」⇒ **P4b 沒有夾帶任何功能變更**。`-ms-zoom` 三條各是其 block 的**唯一**宣告,連 selector 一起移除,且「block 確實只有那一條」是**斷言**不是假設。**P4b 的 delta 不可推導**(母體恰是 P4a 的補集),核准清單為 `scripts/p4b-delta.js` 的**明文 table**(14 筆,每筆帶 `count`),理由逐條寫在 `tasks/p4b-decisions.md` —— 依 §P4b〈前置〉要求**動手前**就寫好。**兩支 shape 閘門互相把對方的 delta 從 baseline 側抵銷掉**(`check:p4a` 左側 = `baseline + P4b`,`check:p4b` 左側 = `baseline + P4a`),所以 **P4a 那六項斷言一條都沒有放寬**,而整份 diff 剛好被兩支認領完;兩者順序可交換由 `p4b-delta.js` **實測斷言**(不是用講的)。為了讓兩階不會對「一個 block 到哪裡為止」有不同看法,block 走訪抽成共用的 `eachBlock()`,由 P4a 與 P4b 共用 —— 重構後 `p4a:delta` 立刻重現 **728 / 45 與 14 項直方圖逐項相同**。實測:`check:p4b` **9 檔 / 14 移除 / 7 新增**、`check:p4a` 仍 **728 / 45** 且 `-webkit-` **313 = 313**、`check:bytes` **UNEXPLAINED 0**、`check:build-css` **85 檔 / 14128 條 / files differing 0**(**14128 = 14135 − 14 + 7**)、`check:baseline` **86/86**、`check:gate` **exit 0**。儀器 `check:cssdiff` 來到 **48 檔 / 749 筆**(= 728 + 14 + 7;48 = 45 + 9 − 6 檔重疊),**exit 1 且是對的**。**三個負向控制全部觸發**:(a) 把一條 `rename` 的**值**從 `textfield` 偷改成 `none` → 第 3 項斷言開火 `rename left no matching "appearance:textfield" in .z-slider-input`,並連帶 `13 removals / 6 additions`;(b) 漏做一條(把 `appearance` 改回 `-moz-appearance`)→ **兩支閘門各自從相反端抓到**,`check:p4a` 報 `ADDED record (P4a may only remove)`、`check:p4b` 報 `expected 14 removals, measured 13`;(c) `remove-rule` 的安全斷言以合成輸入驗證(來源改不出這個情境,且不得改 `baseline/`)—— block 仍有第二條宣告時丟出 `remove-rule on a block with 2 declarations`,超出核准次數時丟出 `-ms-zoom matched 2 time(s), table says 1`,而正常情形乾淨刪掉整條 rule。控制組全部以 scratchpad 副本還原(**不是** `git checkout`),還原後 sha256 與突變前逐字相同 |
| 57 | 2026-08-10 | **P4b 的第 4 層獨立驗證** | `baseline/` **+ 已核准的 P4a delta** | `target/classes/web/iceblue_css` | **9** | **14 移除 / 7 新增** | **PASS-WITH-FINDINGS** —— **C1–C12 全部 CONFIRMED,零 REFUTED**。覆核者**自己寫了一套 Python 遞迴下降 CSS parser + `difflib`**,並且**重建了 `HEAD~1` 的輸出樹**來做真正的前後比對(而不是信任我對「改了什麼」的敘述),另以 `cssdiff` 對同一組樹取得第二個獨立讀數(9 檔 / 21 筆)。C5 得到**比主張更強**的結果:不只 `-webkit-` 總數 313 = 313,**21 項 `-webkit-` 屬性直方圖逐項相同**。C6 除了獨立重推 728 / 45,還做了 `eab6fe60^` 與 HEAD 兩版 `applyP4a` 的 **A/B**:對 85 個 baseline 檔逐檔比對輸出文字與移除清單,**0 檔不同** ⇒ `eachBlock()` 重構是**可證明的行為保持**。C9 以 `check-p4a-delta.js` 的**去註解 diff** 確認改動恰好三處(一個 `require`、`load(file)`→`load(text)`、左側資料來源置換),**12 個斷言位置逐 byte 相同** ⇒ 沒有任何斷言被放寬。C11 帳目:可移除前綴 **803 → 61**,剩下的 **61 條全部**在 P7 holdout,`742 = 728 + 14`,總帳 **819** 結清,**無無主殘留**。C12 的 `14135` 是覆核者**實際跑 pre-commit 閘門**量到的,所以 `14135 − 14 + 7 = 14128` 是驗證過的、不是假設。C10 三個負向控制全部重做並全部觸發,其中 (b) 證實**兩支閘門從相反端各自獨立抓到同一個漏做**。**四項發現全部落在「理由寫得比證據強」,沒有一項是行為錯誤**:(1) `.z-focus-a` 的**結論對、理由不成立** —— 「1px + `font-size:0` 所以不可觀察」證明不了什麼(`overflow:hidden` 裁的是**繪製**不是**選取**);真正成立的是 ZK 各 mold 產出的 `.z-focus-a` 是**沒有文字節點的空 `<div>`**(覆核者在 ZK 原始碼逐一確認)且 `user-select: auto` 本來就計算成 `text`;(2) **原文漏掉的結構變化** —— `tablet.css.dsp` 的 `${".z-page "}*{-webkit-user-select:none}` 特異性 (0,1,0),改動前 webkit 根本看不到 `.z-focus-a` 的 `-moz-`/`-khtml-` 宣告(**沒有競爭**),現在 `user-select: text` 與它**打平**,結果取決於樣式表順序 —— 因 (1) 實際不可觀察,但 **P7 會再遇到一次**;(3) `-ms-flex-align` 拿掉後,同一個 block 裡還留著 `display: -ms-flexbox`,是**半套 IE10 fallback**,零行為影響但該與 S51 第 ② 類一起收;(4) 我在決策書裡「連 IE 都不吃」那句**是錯的** —— Microsoft 在 IE8 standards mode 確實出過 `-ms-zoom`;不影響決策(判準問的是**今天**的現代瀏覽器)。**四項已於同日全部修正進 `tasks/p4b-decisions.md`。** **一個衝突,而且是覆核者自己的**:首輪量到 `-webkit-` 312、P4a 725/45,根因是**覆核者自己 parser 的 bug** —— `progressmeter.css.dsp` 裡 `url(${c:encodeThemeURL("…")})` 開出一個假 block;補上 `${…}`/括號守衛並與 grep 交叉驗證(13 屬性 × 85 檔,0 不符)後成為 313 與 728/45,**與我的數字一致**。覆核者仍把它記下來,因為 `.css.dsp` 的 DSP EL **同時出現在值與 selector 位置**,是任何人寫檢查器都會踩的坑。**唯讀性**:`git status --porcelain` 只有委託書與報告兩個 `??`;`git diff --stat baseline/` 空;`check:baseline` **86/86**。唯一寫過的 repo 路徑是 `target/`(build 產物,本來就不追蹤),控制組後以 `npm run build:tree` 還原並以 `check:p4b` exit 0 + `check:bytes` UNEXPLAINED 0 確認;**全程未用 `git checkout`/`restore`**。報告 [l4-verify-p4b.md](l4-verify-p4b.md),委託書 `tasks/l4-verify-p4b-brief.md` |
| 58 | 2026-08-12 | **主題改名(第二次)`iceblue_css` → `iceblue11`(user 決定,S54)** | `baseline/` **+ 已核准的 P4a delta** | `target/classes/web/iceblue11` | **9** | **14 移除 / 7 新增** | **PASS(G-zero)** —— **一條 declaration 都沒動**,這一點是可證明的而不是宣稱的:`baseline/` 與 `src/main/resources/web/` 對字串 `iceblue_css` **各 0 處命中** ⇒ 被比對的**內容**根本不含主題名,改的只有 `web/${project.artifactId}` 這個**目錄路徑**。因此驗收下的是最強的斷言 —— **把改名前後兩份 `check:gate` 全文各自把主題名正規化成 `__THEME__` 後 `diff`,結果只差一行 zklessc 的計時字串(`0.137 sec` vs `0.134 sec`)**,其餘**逐 byte 相同**:P4a 45 檔 / 728 條、`-webkit-` 313 = 313、deferred 60、P4b 9 檔 / 14 移除 / 7 新增、deferred 1 orphan。`withjdk.sh 17 mvn -q clean test-compile` **EXIT=0**;`npm run visual:selftest` **116/116 頁、theme finger SAME、pages differing: 0**(raster noise 5 頁,全部 maxΔ 1,遠低於 ≤8/≤64px 的實測地板)。**改名真的生效、而且是在 HTTP 層證明的**:守門探針兩輪都印 `_zkiju-iceblue11 present, marble refs 0` —— 服務出來的頁面連的是新名字。`baseline-ab.js status` 的四名一致檢查:registered / preferred / maven `<artifactId>` / 腳本輸出目錄 **全部 = `iceblue11`**,`config.xml` listener 指向 `org.zkoss.theme.iceblue11.Iceblue11ThemeWebAppInit`,`dirs present: iceblue11`(單一目錄,`mvn clean` 已清掉舊的 `web/iceblue_css`,**沒有留下 S20 那種漂移用的化石目錄**)。改動範圍:Java 套件與類別(`git mv` 保留改名追蹤)、`config.xml` / `lang-addon.xml`(主)、`config.xml`(測試 scope 的 `<depends>`)、`pom.xml` 的 `artifactId`/`name`/`description`、`ThemePreviewApp`、`FontAwesomeIconsVM`、`package.json` 5 條 script、7 支硬寫輸出路徑的 script、`scripts/workflow/iceblue-drop-less.mjs` 3 處敘述、`readme.md` 5 處、`doc/visual-ab-harness.md` 8 處。**顯示名同步改為 `Iceblue 11`**(理由同 S23:主題選單不得出現兩個看起來一樣的項目)。**文件刻意只改「活的」部分** —— 可複製貼上的指令、路徑、以及對**現況**的陳述;歷史紀錄(本表 #35–#57、`l4-verify-*` 報告、S 表既有條目)與 ZK core 的 palette 檔名 `_iceblue_css.less` **一律不改字**,對應關係記在 **S54** |

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

### L3-B Tier 1(P1 = S0 + S1)

<details>
<summary>為什麼「拿掉 zkless-engine」併入本計畫、S0/S1 各做了什麼、為什麼合成一顆 commit、以及<b>沒做</b>的那件事(93 處 <code>~./</code> import 不改寫)</summary>


原本以獨立專案「拿掉 zkless-engine」評估,結論是**併入本計畫**:實測該引擎沒有註冊任何自訂 LESS
function / plugin / visitor / pre-post-processor,語法層面的全部貢獻是 `src/index.js:31` 那一行
`~./`→`/`;其餘都是建置流程。獨立做等於把 P2/P8 要寫的東西寫兩次。

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

</details>

---

### L3-C P2 儀器證明

<details>
<summary><b>六步儀器證明</b>(全樹重導 12142 條 / 覆蓋 75 檔、兩檔 round-trip 逐 byte 相同、負向控制 exit 1)+ 為什麼是 CleanCSS <b>level 0</b> 而不是 level 1(實測 60 檔差異)+ 第三種靜默摧毀構造:選擇器位置的 DSP tag(0 errors 0 warnings)</summary>


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

#### 2026-07-31:上面這六步已經變成一支可重跑的檢查

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
空規則要在來源清掉,不要在 builder 加特例隱藏。**完整清單見下方〈P3 來源清理待辦〉。**

> **這一段有兩個數字被後來的量測推翻,留原文不改寫,只指路。**(a) 上面的 `.sel{}` 是類別說明
> 裡的**示意**選擇器,實際規則是 `&-editor`,而且它**不是**真的空規則,是「主體只剩註解」——
> 見〈步 3 的複核包〉第 3 項。(b) **每一類的檔數會隨轉換推進而變**,不是固定值:空規則那一類
> 在 P3 步 3 之後從 **2 檔變 6 檔**(步 1 的 `//` → `/* */` 改寫會造出這種空殼)。要當下的數字,
> 跑 `npm run check:build-css`,不要引用這裡的快照。

> **覆蓋率數字被更正過(兩個 agent 互相矛盾,算術裁決)。** 實作者回報 13642 條 / 75 檔,
> 對抗性審核獨立重跑後回報 12142 條 / 75 檔。驗算:`14323 − 1500(norm) − 681(tablet) = 12142`
> 對應 75 檔;而 `14323 − 681 = 13642` 對應的是 **76** 檔 —— 所以 13642 與「75 檔」不可能同時成立。
> **以 12142(84.8%)為準。** 這件事的意義不只是改個數字:兩個 agent 都回報「0 差異 PASS」,
> 但其中一個的覆蓋率是錯的 —— **閘門結果正確不代表關於閘門的敘述正確**。

#### 為什麼是 CleanCSS **level 0**,不是 Marble 用的 level 1

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

#### 新發現的第三種「靜默摧毀」構造:選擇器位置的 DSP tag

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

#### 順手撿到的兩件 P3 要知道的事

1. **未壓縮輸出的 header 也不一定在 offset 0。** `tbeditor` 的展開輸出開頭是一段 `/*! … */`
   授權註解,taglib 在它**後面**。`less2css.js` 的步驟 3(去掉 header)不能用
   `startsWith`,要全域比對 —— 用 `startsWith` 會漏掉 `js/zkmax/{inp,tbeditor}/css/tbeditor`
   兩檔,而漏掉的結果是 header 被 builder 加成兩份(現在會被上表第 4 條守衛擋下來)。
2. **來源樹沒有 `css/` 目錄。** 現況每個元件只有 `<pkg>/less/`。P3 步驟 4 要
   `mkdir -p <pkg>/css/`,否則寫檔會失敗(第一次 round-trip 就踩到了)。

</details>

---

### L3-D P0 交付物、基準的不可變性、突變測試

<details>
<summary>7 項 P0 交付物 · 基準為什麼<b>拒絕覆寫</b> · <b>5 種突變測試</b>(4 種必須抓到、純格式改寫必須抓不到)· 重建基準的方法</summary>


| 交付 | 狀態 | 位置 |
|---|---|---|
| worktree + `iceblue` 分支 | DONE | `../zkThemeTemplate-iceblue`,自 `master` `a89d44e` |
| `scripts/cssdiff.js` | DONE | 主閘門工具,含突變測試證據 |
| `scripts/baseline.js` | DONE | 建基準 + **拒絕覆寫**既有基準(見下) |
| `baseline/`(gitignore、可一鍵重建) | DONE | `npm run baseline`;`baseline/.built-from` 記錄來源 commit 與編譯器版本 |
| `npm run check:cssdiff` | DONE | 重編 + 比對,exit 0/1 |
| 進度文件 | DONE | 本文件 |
| 計畫書搬進被追蹤的樹 | DONE | `doc/iceblue-drop-less-execution-plan.md` |

#### 基準的不可變性(P0 加的防護,原計畫沒寫)

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

#### 突變測試(為什麼相信這個閘門)

「比對器對相同輸入回報 0」只證明它沒有偽陽性,不證明它抓得到東西。所以另外注入 5 種缺陷:

| 突變 | 內容 | 是否應被抓到 | 結果 |
|---|---|---|---|
| M1 | 刪掉一條 declaration(`float:left`) | 是 | 抓到,`- .z-frozen-body \|\| float:left` |
| M2 | 改一個值(`z-index:1`→`2`) | 是 | 抓到,`-`/`+` 一對 |
| M3 | 把同一 block 內兩條對調順序 | 是 | 抓到 —— 證明比對是**有序**的 |
| M4 | 移除一族 vendor prefix(模擬 P4) | 是 | 抓到,形狀正是 P4 G-delta 要的 `- <decl>` |
| M5 | 純格式改寫(空白、`rgba(` 逗號後空格) | **否** | **未回報** —— 正規化清單有效,不會被格式噪音淹沒 |

M5 是關鍵的一項:它證明這個閘門在 P3(展開後的 CSS 格式必然和壓縮輸出不同)不會製造上千條假差異。

#### 重建基準的方法

`baseline/` 不進版控。要重建:

```bash
# 只有在來源尚未轉換時才有效(P0–P2 期間)
rm -rf baseline && npm run baseline

# P3 之後:必須從未轉換的 commit 重建,否則基準會被污染
git worktree add ../iceblue-baseline a89d44e
cd ../iceblue-baseline && npm install
npx zklessc -s src/main/resources/web -o ../zkThemeTemplate-iceblue/baseline/ --compress
```

</details>

---

### L3-E 前提的修正與順手撿到的發現

<details>
<summary>P0 推翻的 <b>6 個前提數字</b> · P0 新發現的 <b>7 條前提</b>(#11–#17)· prereq 推翻的 3 個數字 · workflow 的 args bug · P4 拆成 P4a/P4b 的分群實測 · <b>44 條 carve-out</b> · CAVEAT-3(master 既有的潛在 bug)</summary>


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

#### P0 新發現的前提

| # | 事實 | 對哪一階段有影響 |
|---|---|---|
| 11 | `goldenlayout.css.dsp` 有**兩份逐條相同**的輸出(`js/zkmax/goldenlayout/css/`、`js/zkmax/layout/css/`,各 413 條,diff 0) | P3:要嘛一起轉,要嘛先確認哪份是死路徑 |
| 12 | `tbeditor.css.dsp` 也有兩份,但**不相同**(380 vs 375,67 條差異) | P3:是兩個不同來源,不能當複本處理 |
| 13 | **有第二個 `_zkvariables.less`**:`zkmax/less/_zkvariables.less`,4 行、2 條宣告。而且它們**不是 token** —— `@iphone` / `@android` 是 media query 字串 | 規則表產生器:計畫書的 10 個例外**沒有這一類**。P8 的刪檔清單也要含這一檔 |
| 14 | `_zkmixins.less` 是 **30 個唯一名稱、38 個定義列**。差額來自 LESS 允許同名多載 —— 依參數個數或 `when` guard 分派,例如 `.boxShadow(@value)` 有 `isstring` 與 non-`isstring` 兩個版本 | 規則表產生器:計畫書與本文件原記「32 個定義」與「24 個名稱」**都錯**,已更正為 30 / 38 |
| 15 | **11 個 mixin 是死的**(30 個中,分佈在 38 個定義列裡的 13 列):整個 gradient / IE9 堆疊 | P4/P8:輸出端獨立佐證 —— baseline 裡 0 個 `linear-gradient`、`radial-gradient`、`-webkit-gradient(`、SVG data URI、`progid:` |
| 16 | **§P4 的估算被獨立重現,分毫不差**:245 呼叫點 / 1225 展開 | P4:上限 ≤1127 更可信 |
| 17 | **兩條覆寫路徑不等價**,三個獨立方向(CAVEAT-1/2/3) | 見計畫書 §P8。全部**先於本次轉換就存在**,`cssdiff` 看不到 → 閘門不受影響,但要寫進 migration guide |

#### prereq 修正的前提(2026-07-30)

三個數字被推翻,其中**兩個是我上一輪自己寫進文件的**:

| 前提 | 原記 | 實測 | 怎麼錯的 |
|---|---|---|---|
| #14 mixin 名稱數 | 24 | **30** | 我的 grep 用 `^\.[a-zA-Z][a-zA-Z0-9]*`,遇到連字號就截斷 → `.gradient-ver`/`-hor`/`-diagm`/`-diagp`/`-rad` 全部塌成 `.gradient`,`.encodeURL-verGradient` 塌成 `.encodeURL`,**無聲少算 6 個可呼叫的 mixin**。`24/32` 與 `30/38` 各自內部一致;`24/38` 各取一個,描述不了任何檔案 |
| #13 `@iphone`/`@android` 的用途 | 「`tablet.less` 使用」 | **全樹 0 引用,是死的** | `tablet.less:2` 只是 `@import` 了那個檔,我把「import 了檔案」誤當成「用了變數」。分類要加,但 P7 不必編列移植 |
| §P8 例外數 | 10(後改 12) | **16** | 12 條分類例外之外,還有 4 條**語法 1:1 但行為不是**:`@iconColor`/`@activeColor`/`@inputDisableColor`(data URI)與 `@baseBackgroundColor`(`contrast()`) |

**教訓**:「數字對得上」不等於「數的是同一件事」。兩個內部一致的數對(24/32、30/38)交叉組合出
一個看起來合理、實際上不存在的 24/38 —— 而它之所以被抓到,是因為產生器**自帶斷言而且拒絕
為了通過而改斷言**,以及審核 agent 用**另一支獨立寫的 parser** 重數。單靠一次量測不會發現。

#### workflow 的 args bug(2026-07-30,已修)

用 `{phase:"P2"}` 啟動的那一次,`args` 是以 **JSON 字串**而不是物件抵達腳本的,所以
`args.phase` 是 `undefined`,`|| 'prereq'` 的預設值讓它**又跑了一次 prereq** ——
回報 `phase:"prereq"`,燒掉 2 個 agent 去做已經 commit 完的事。

**第一次 prereq 之所以「成功」是巧合** —— 它根本沒讀到參數,只是預設值剛好就是 prereq。

兩個修法都做了:`readArgs()` 同時接受物件、JSON 字串與裸字串;而且**認不出來的 phase 直接
報錯**,不再回退到某個看起來像成功的東西。**預設值是一個合法階段**,正是讓這個 bug 無聲的原因。

#### P4 拆成 P4a / P4b(2026-07-30)

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

#### P4 carve-out:44 條前綴宣告不能移除(順手撿到的)

`-webkit-font-smoothing` 16、`-moz-osx-font-smoothing` 16、`-webkit-touch-callout` 6 ——
這些**沒有**無前綴對應物,它們是唯一寫法,不是死前綴。另加 `-webkit-tap-highlight-color` 4、\
`-webkit-user-drag` 1、`-webkit-user-modify` 1,carve-out 共 **44** 條。

危險在於:機械掃描產生的 1132 條差異裡,這 44 條是**真回歸**,但形狀跟其他可移除的**完全一樣**,
G-delta 的形狀檢查分不出來 → carve-out 清單必須在動手前存在,否則 P4 的閘門實際上失效。
詳見計畫書 §P4。

#### CAVEAT-3:master 既有的潛在 bug(順手撿到的)

`js/zkmax/big/less/biglistbox.less:281,389` 的 `background: contrast(@baseBackgroundColor);`:

- 值是 `var()` → LESS 無法求值 → 原樣輸出 `contrast(var(--zk-base-background-color))`,而
  **CSS 沒有產生顏色的 `contrast()`**(只有 `filter: contrast()`)→ 宣告無效、被瀏覽器丟棄。
- 值是字面值(`#FFFFFF`,正是 `readme.md:69` 建議客戶做的事)→ 編譯期算成 `background: #000000`。

所以**照著 readme 客製的客戶會意外啟用一條目前失效的宣告**。這是既有 bug,不是轉換造成的,
而且它逐條原樣通過 → `cssdiff` 看不到 → 閘門不受影響。要寫進 migration guide。


</details>

---

### L3-F P3 批次的檔案清單、每一步可以自己檢查什麼、步 0-4 的逐檔複核包

#### P3 批次(含每一批的 commit 範圍)


**批 2 收工:63/74。** 批次已於 2026-07-30 用 `cssdiff --list` 實測分界(原本的
`~8 / ~55 / ~11` 是估計值,**三個數字都不對**);**2026-07-31 開工當天重新推導一次,20 + 43 + 11
仍然成立** —— 這個數字是斷言,對不上就要停下來查,不能改斷言迎合實測。

| 批 | 範圍 | 檔數 | 步階 | 狀態 |
|---|---|---|---|---|
| 批 1 | 輸出端 ≤20 條 | **20**(原估 ~8) | 步 0 `tablelayout` → 步 1 `cardlayout`/`absolutelayout`/`anchorlayout`/`grid` → 步 2(+15) | **批 1 DONE(20/20)** —— 步 0 `194f8f4`、步 1 `a046bdb`/`c8a6fbc`/`af89eda`/`370d45b`、步 2 `aa3fac3`…`fbe44bf` |
| 批 2 | 輸出端 21–200 條 | **43**(原估 ~55) | 步 3 | **批 2 DONE(43/43)** —— `5d12946`(`inputgroup` 22)…`657a890`(`tree` 185),一檔一顆;工具 `13da402` |
| 批 3 | 輸出端 >200 條 | **11** | 步 4 | **批 3 DONE(11/11)—— P3 收工 74/74** —— `63be065`(`popup` 217)…`44ebc40`(`goldenlayout` 413),一檔一顆;`combo` 586 由 **L-8 拍板後**最後轉(`d74bf65`) |
| | | 20+43+11 = **74** ✓ | | |

74 = 77 個輸出減掉三個留在 LESS 的:`norm`(P5)、`font-awesome`(P6)、`tablet`(P7)。

批 1 有 20 檔而非 8 檔,對「批 1 的目的是驗證腳本」這件事是**好事** —— 語料更大,但每檔仍
≤20 條、可逐檔人工看完。批 3 的 11 檔:`popup` 217、`menu` 218、`tabbox` 237、`colorbox` 246、
`listbox` 261、`biglistbox` 299、`tbeditor` 375 + 380、`goldenlayout` 413 + 413、`combo` 586。

**批次 ≠ 步階(2026-07-31 加)。** 批次是**閘門與複審的分界**(以條數劃分,沒有變);
步階是**一次做多少、什麼時候停**。批 1 拆成三步 `1 → 4 → 15`,每步結束停下等人工確認 ——
理由與步 0 為什麼選 `tablelayout`,見計畫書 §2.6〈步階〉。

**每一步的紀錄要多兩欄**:位元組不同的檔數、人工確認與否。前者是不經過 `cssdiff` 的獨立訊號,
後者用來分辨「跑過了」和「被看過了」。


#### 每一步「你可以自己檢查什麼」(步 0 定型,步 1–4 照用)

由**最不需要信任**排到**最需要信任**。前三項完全不經過任何自製工具。

```bash
# 1. 讀 diff —— 步 0 是 8 行,一眼看完
git show 194f8f4 -- src/

# 2. 交付物有沒有變:built 的 .css.dsp 對 master 出的 baseline 逐 byte 比
cmp baseline/js/zkmax/layout/css/tablelayout.css.dsp \
    target/classes/web/iceblue/js/zkmax/layout/css/tablelayout.css.dsp && echo "0 byte 差異"

# 3. 有沒有順手動到別的檔(全樹位元組,完全不經過 cssdiff)
diff -rq -x .built-from baseline/ target/classes/web/iceblue
#    ⚠ 這一項的「預期結果」隨轉換進度改變,見下方〈第 3 項的預期結果會變〉。
#    P3 收工後預期 51 個檔名(不是 1 個),因為兩條工具鏈的序列化習慣不同。
#    「出現檔名」本身不再是壞消息 —— 要看的是它有沒有落在那 5 類封閉寫法內。
#
# 3b. 上一項印出來的檔名,自動歸因到那 5 類(2026-08-04 加,紀錄 #30)
npm run check:bytes          # 77 比對 / 26 逐 byte 相同 / 51 已歸因 / 0 無法解釋
#    這一項**是**自製工具,所以排在信任線以下 —— 它做的是第 3 項要你人工判斷的那一步。
#    要不信任它就跑第 3 項:同一組檔名,只是沒有歸因。

# 4. 閘門
npm run check:cssdiff        # files differing: 0

# 5. 閘門到底有沒有在做事(最強的一項,但會暫時改壞 build-css.js)
#    把 scripts/build-css.js 的 minify() 結尾改成 `return '';`,再跑第 4 項。
#    現在會 files differing: 1 / exit 1。步 0 之前同樣的破壞是 0 / exit 0(紀錄 #15 vs #19)。
#    還原請用檔案複製,不要 git checkout。
```

##### 第 3 項的預期結果會變 —— 別把「有差異」讀成「壞了」

**這一項原本寫「除了 `font-awesome` 以外出現任何檔名,就是這一步弄壞了東西」,那句話從步 2
起就已經是錯的**(步 2 是第一次出現位元組不同的轉換),留到步 4 才發現。照舊版說法做會看到
51 個檔名、然後得出完全相反的結論,所以改掉。

| 進度 | `diff -rq` 預期出現幾個檔名 |
|---|---|
| 步 0 / 步 1(5 檔) | **1** —— 只有 `font-awesome`(紀錄 #14,P1 換 LESS 版本的既有差異,與轉換無關) |
| 步 2 收工(20 檔) | 6 |
| 步 3 收工(63 檔) | 40 |
| **步 4 收工 / P3 收工(74 檔)** | **51** |

**為什麼會這樣,以及為什麼它不是品質問題。** 兩條工具鏈把**同一份 CSS 寫成文字**的習慣不同,
差異全部落在 5 類**封閉**的序列化寫法內:`.8s` vs `0.8s`、`0` vs `0px`、`;}` vs `}`、
`,`/`>` 兩側空白、空規則留不留。**語意零差異** —— 同一本書換字體重排,字句一樣。
而檔案越大,「一個 `>` 或一個 `,` 都沒出現」的機率越低,所以**逐 byte 相同的比例必然下降**:
5/0 → 10/5 → 12/31 → **0/11**(批 3 的 11 檔逐 byte 相同 0 檔,>200 條的檔幾乎不可能避開 5 類)。

> **要盯的指標換了。** 「逐 byte 相同幾檔」衡量的是**還有多少檔我們沒碰過**,會單調下降,
> 不是品質。品質指標是**「無法解釋」幾檔** —— 也就是出現 5 類之外的第 6 種差異。
> 那個數字從步 0 到步 4 **一直是 0**。真正該停下來讀的訊號是它變成非 0,不是第 3 項印出檔名。

###### 「第 1 層」有兩個意思,對 P3 只有一個算數(2026-08-04 更正,紀錄 #29)

計畫書 §2.6:455 早就寫明了,但步 2–步 4 的複核包一路用錯了窄義:

| 說法 | 定義 | 批 3(11 檔) | 全樹(77 檔) |
|---|---|---|---|
| 窄義:**嚴格逐 byte 相同** | `diff -rq` 一句「全部位元組相同」 | 0 | 26 |
| **§2.6 對 P3 定義的第 1 層** | 逐 byte 相同 **or** 差異落在 **5 類已列名的封閉清單**內 | **11/11 通過** | **77/77 通過**(清單外 0 檔) |

> **§2.6:450-457 原文:「⚠ 這個 76/77 只對 LESS→LESS 成立,不要外推到 P3……所以 P3 的第 1 層
> 鏡片不是「位元組相同」,而是「位元組相同 or 差異落在 5 個已列名的類別裡」。」**
> 窄義那個 76/77 是「同一套 LESS 工具鏈換版本」量到的;P3 換的是**整個序列化器**
> (LESS 壓縮器 → CleanCSS level 0),所以窄義本來就不該當 P3 的鏡片。
>
> **兩個說法的結論方向相反**,所以這不只是措辭:窄義讀起來像「最強的檢查失效了」,
> §2.6 的定義是「規格要求的檢查通過了」。**後者才對。**
> 執行它的工具是 `npm run check:build-css`(§2.6:456 指名),**在 repo 裡**,分類不出來就 exit 1。

**第 2 項是重點:步 0 對「跑起來的 theme」的影響是 0。** 改的不是輸出,是**這個檔由誰編** ——
以前 `zklessc` 從 `.less` 編,現在 `build-css.js` 從 `.css` 編,兩條路徑產出同一串 byte。

#### 步 0 的複核包(2026-07-31)

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

#### 步 1 的複核包(2026-08-03,4 檔)

| 輸出 | 條數 | 來源 → 產物 | 位元組 | 空規則 | commit |
|---|---|---|---|---|---|
| `js/zkmax/layout/css/cardlayout.css.dsp` | 4 | 11 行 → 9 行 | **相同** | 0 | `a046bdb` |
| `js/zul/layout/css/absolutelayout.css.dsp` | 5 | 11 行 → 10 行 | **相同** | 0 | `c8a6fbc` |
| `js/zul/layout/css/anchorlayout.css.dsp` | 5 | 18 行 → 15 行 | **相同** | 0 | `af89eda` |
| `js/zkmax/grid/css/grid.css.dsp` | 6 | 18 行 → 19 行 | **相同** | 0 | `370d45b` |

**步 1 比步 0 多驗到的兩件事**(這才是它作為獨立一步的價值,不只是「多做 4 檔」):

1. **兩條 header 分支都走過了。** `grid` 是 `NO_HEADER` 三檔的**第一個**,輸出確認以 `.z-grid`
   起頭、**沒有** taglib —— 所以 `build-css.js` 對這三檔是「刻意不注入」,不是「還沒遇到」。
   另三檔走注入分支。
2. **`tabIndent()` 第一次由腳本自己套用**(步 0 是事後回頭套的),含 `grid` 的兩個
   `/* … */` 段落註解 —— 註解跟著 tab 一起進來源、且不進輸出。

**步 1 撿到的三件事**(同樣都是機制的問題,不是這 4 個元件的問題):

| # | 發現 | 處置 |
|---|---|---|
| 1 | `less2css.js` 產生的 commit message 一律寫 `injects the taglib header` —— 對 `NO_HEADER` 三檔是**假話**,而 `grid` 就是其中一檔,假話已經進過一次 log | 已改成依 `NO_HEADER` 分支換句(`f1e422b`),`grid` 那顆 `--amend` 掉。`NO_HEADER` **從 `build-css.js` import**,不另抄一份 —— 抄了就會和真正做決定的那支漂移 |
| 2 | `npm run check:build-css` 在步 1 之後**失敗**:已轉換的檔沒有 `.less` 可重建 → 從候選樹消失 → `files differing: 5` 但 `diff records: 0` | 加步 2b:直接複製已轉換的真實來源(`07f0708`)。**不修的話它會隨每次轉換更紅**,最後變成沒人看的紅燈。修完回到紀錄 #16 的數字,其中 5 檔已是真實來源 |
| 3 | `anchorlayout` 帶一條 `-ms-zoom: 1` | **不動**。P3 是 G-zero,前綴是 P4 的標的;在這裡順手刪就是把 delta 混進零差異階段 |

> **`git diff --cached --name-only` 只印出目的檔是正常的。** 4 檔裡有 3 檔被 git 判為 rename
> (`less/x.less => css/x.css`),`--name-only` 對 rename 只印目的路徑 —— `.less` 的刪除**在**那顆
> commit 裡(`git show --stat` 看得到)。步階檢查清單第 1 項照 `git show` 讀就不會誤判。

#### 步 2 的複核包(2026-08-03,15 檔 —— 批 1 收工 20/20)

| 輸出 | 條數 | 來源 → 產物 | 位元組 | commit |
|---|---|---|---|---|
| `js/zkmax/sel/css/listbox.css.dsp` | 6 | 16 行 → 17 行 | **相同** | `aa3fac3` |
| `js/zkmax/sel/css/tree.css.dsp` | 6 | 15 行 → 16 行 | **相同** | `7192bb3` |
| `zul/css/footer.css.dsp` | 7 | 32 行 → 22 行 | 差 `>` 兩側空白 | `771974e` |
| `js/zkmax/med/css/video.css.dsp` | 8 | 24 行 → 19 行 | 差前導零 | `0d05a41` |
| `js/zkex/layout/css/columnlayout.css.dsp` | 9 | 26 行 → 23 行 | **相同** | `c46d038` |
| `js/zkmax/nav/css/anchornav.css.dsp` | 9 | 19 行 → 16 行 | **相同** | `c9bbdb0` |
| `js/zkmax/wgt/css/dropupload.css.dsp` | 9 | 8 行 → 12 行 | **相同** | `7fb47fa` |
| `js/zul/wgt/css/a.css.dsp` | 9 | 25 行 → 21 行 | **相同** | `1180888` |
| `js/zkex/slider/css/sliderbuttons.css.dsp` | 10 | 23 行 → 17 行 | **相同** | `f49a3d6` |
| `js/zkmax/barscanner/css/barcodescanner.css.dsp` | 13 | 24 行 → 20 行 | **相同** | `a744070` |
| `js/zul/box/css/layout.css.dsp` | 13 | 38 行 → 37 行 | 差 `,`/`>` 兩側空白 | `be92b3c` |
| `js/zkmax/layout/css/rowlayout.css.dsp` | 14 | 21 行 → 26 行 | **相同** | `f21049e` |
| `js/zul/mesh/css/frozen.css.dsp` | 15 | 41 行 → 36 行 | 差空白 | `5f1e667` |
| `js/zul/wgt/css/rating.css.dsp` | 18 | 40 行 → 33 行 | 差前導零 + 空白 | `c0260c1` |
| `js/zul/mesh/css/auxhead.css.dsp` | 19 | 33 行 → 31 行 | **相同** | `fbe44bf` |

**步 2 比步 0+1 多驗到的兩件事:**

1. **`NO_HEADER` 三檔全部走過了。** `listbox` 與 `tree` 補完 `grid`(步 1)剩下的兩檔 ——
   這條分支現在是**被三次量到**,不是「有一個樣本」。(步 1 的口頭回報把這兩檔說成落在步 3,
   那是回報錯了 —— 計畫書 §2.6 一直寫的是「`listbox`、`tree` 留在步 2」。每一步的檔案清單
   都用 `cssdiff --list` 當場重推,而不是沿用上一步的說法,就是為了讓這種錯自己現形。)
2. **第一次出現位元組不同的轉換。** 步 0/1 的 5 檔剛好全部逐 byte 相同,所以複核第 1 層
   (byte-identity,完全不需要 `cssdiff` 的六種正規化)一路都成立。步 2 的 15 檔裡有 5 檔不同
   —— **這是預期的,不是退步**:`check:build-css` 早就量到全樹 51/75 檔會差,分成 5 類封閉的
   序列化寫法。意思是**第 1 層對這些檔在結構上就不可用**,由第 2 層(直接讀差異 byte)承擔。

**步 2 末的全樹獨立複核**(不經過 `cssdiff`,可自己重跑):

```
byte-identical: 71/77
  差異 6 檔:video / layout / frozen / rating / footer / font-awesome
  先把前導零正規化(0.5 → .5)、再去掉全部空白 ⇒ 六檔兩邊完全相等
⇒ 全樹零個語意 byte 不同
```

> **正規化的順序會決定結論,踩過一次。** 先去空白再正規化前導零,`0.2em 0.25em` 會併成
> `0.2em0.25em`,第二個零前面變成字母 `m` 就不再符合「前導」的條件 —— `font-awesome` 因此被
> 誤報成「無法解釋」。**先零、後空白。** 這個假警報值得記,因為它長得跟真的差異一模一樣。

**步 2 撿到的四件事**(前兩件是機制,後兩件是來源內容):

| # | 發現 | 處置 |
|---|---|---|
| 1 | `stripHeader` 把 taglib 那一段錨在 offset 0,**三檔在 `@import "_header.less"` 之前先吐一段區塊註解**,header 因此落在第 3 行 → `footer` 被腳本拒收。`--compress` 會刪註解,所以 77 個 baseline 全在 offset 0,**只有未壓縮路徑看得見** | 修在腳本(`7f8cd23`):跳過只由註解與空白構成的前綴、**保留該前綴**,只拿掉 header。**不改 footer 的來源** —— 另兩檔是 `tbeditor` 的 Trumbowyg MIT 授權標頭,那段必須原字保留進新來源,改來源就等於在步 4 讓同一個問題再爆一次 |
| 2 | `footer` 是第一個非逐-byte-相同的轉換 | 逐 byte 讀過:全部差異就是一個子選擇器,baseline `.z-flex>:not(.z-flex-item)`、我們 `.z-flex > :not(…)`;去掉空白兩邊相等。LESS 壓縮器會收緊組合子,CleanCSS level 0 不會(level 1 在 P2 已因別處位移被否決) |
| 3 | `footer` 帶著全樹**唯一**一個 LESS namespace hook:`#footer() { .append-style() {} }`,在檔尾以 `#footer.append-style();` 呼叫。純 CSS 表達不出來,轉換必然刪掉它 | **就這樣刪**。它是空的,而且 `append-style` 在整個 repo 只出現在這一個檔 → 這裡沒有東西被弄壞。但「別的主題會不會填這個 hook」是**產品面**問題,記到 P8 一併回答,不在 P3 決定 |
| 4 | 兩份 `tbeditor.less` 的授權標頭寫 `@{zprefix} v2.7.2`,而 `@zprefix: z-tbeditor` 定義在**第 13 行**、標頭在第 2–5 行,且 **LESS 不會在 `/* */` 裡做插值** → 編出來是字面的 `@{zprefix}` | 記成來源清理項(見下)。今天看不到是因為 `--compress` 會刪註解;一旦這兩檔變成 CSS **來源**,這段字就會留在人要維護的檔案裡。而且授權標頭該寫的是 **Trumbowyg**,不是一個 CSS class 名 —— 這是既有的 latent 錯字,不是轉換造成的 |

#### 步 3 的複核包(2026-08-03,43 檔 —— 批 2 收工 63/74)

依輸出端條數排序,就是實際轉換的順序(每檔一顆 commit,閘門逐檔跑,**43 次全 0、無一次失敗**)。

| 輸出 | 條數 | 來源 → 產物 | 位元組 | commit |
|---|---|---|---|---|
| `js/zul/wgt/css/inputgroup.css.dsp` | 22 | 50 行 → 45 行 | `,`/`>` 空白 | `5d12946` |
| `js/zkmax/med/css/camera.css.dsp` | 24 | 40 行 → 41 行 | `,`/`>` 空白 | `a041e85` |
| `js/zkex/menu/css/fisheye.css.dsp` | 26 | 28 行 → 39 行 | **相同** | `e89deb5` |
| `js/zkex/grid/css/grid.css.dsp` | 29 | 47 行 → 42 行 | **相同** | `88af83c` |
| `js/zul/wgt/css/selectbox.css.dsp` | 29 | 54 行 → 42 行 | **相同** | `69189d5` |
| `js/zul/wgt/css/separator.css.dsp` | 32 | 39 行 → 45 行 | 前導零 | `7391fbb` |
| `js/zul/wgt/css/caption.css.dsp` | 33 | 75 行 → 65 行 | `,`/`>` 空白 | `8939c3d` |
| `js/zul/wgt/css/button.css.dsp` | 36 | 40 行 → 49 行 | **相同** | `2eb8c8b` |
| `js/zkmax/nav/css/coachmark.css.dsp` | 54 | 99 行 → 95 行 | 前導零, `,`/`>` 空白 | `5197930` |
| `js/zkmax/layout/css/organigram.css.dsp` | 57 | 111 行 → 92 行 | 零長度單位, `,`/`>` 空白 | `b49ffd8` |
| `js/zkmax/signature/css/signature.css.dsp` | 60 | 74 行 → 87 行 | 前導零, `,`/`>` 空白 | `22ec25b` |
| `js/zkmax/wgt/css/signature.css.dsp` | 60 | 74 行 → 87 行 | 前導零, `,`/`>` 空白 | `9bf239f` |
| `js/zul/box/css/box.css.dsp` | 61 | 136 行 → 127 行 | 前導零, `,`/`>` 空白 | `fc84a21` |
| `js/zkmax/layout/css/splitlayout.css.dsp` | 62 | 109 行 → 107 行 | `,`/`>` 空白 | `e81162e` |
| `js/zkmax/layout/css/linelayout.css.dsp` | 70 | 144 行 → 124 行 | `,`/`>` 空白 | `7f7e9d5` |
| `js/zkmax/wgt/css/drawer.css.dsp` | 73 | 122 行 → 115 行 | **相同** | `867e581` |
| `js/zul/wgt/css/groupbox.css.dsp` | 73 | 125 行 → 121 行 | `,`/`>` 空白 | `33ec2b1` |
| `js/zul/wgt/css/progressmeter.css.dsp` | 73 | 144 行 → 135 行 | 前導零, `,`/`>` 空白 | `b681649` |
| `js/zul/wgt/css/combobutton.css.dsp` | 74 | 110 行 → 114 行 | **相同** | `34a216a` |
| `js/zkmax/slider/css/multislider.css.dsp` | 78 | 198 行 → 155 行 | **相同** | `5e9001b` |
| `js/zkex/slider/css/rangeslider.css.dsp` | 84 | 195 行 → 161 行 | **相同** | `2ae425d` |
| `js/zkex/pdfviewer/css/pdfviewer.css.dsp` | 87 | 173 行 → 152 行 | 前導零, `,`/`>` 空白 | `7ebe6b2` |
| `js/zul/wgt/css/checkbox.css.dsp` | 87 | 107 行 → 134 行 | 前導零, 零長度單位, `,`/`>` 空白 | `73bac11` |
| `js/zkmax/layout/css/portallayout.css.dsp` | 92 | 167 行 → 151 行 | `,`/`>` 空白 | `6f96bb7` |
| `js/zul/wnd/css/panel.css.dsp` | 93 | 135 行 → 134 行 | 前導零, `,`/`>` 空白 | `4b879b9` |
| `js/zul/inp/css/input.css.dsp` | 94 | 165 行 → 237 行 | 前導零, `,`/`>` 空白 | `81606dd` |
| `js/zul/mesh/css/paging.css.dsp` | 96 | 138 行 → 157 行 | `,`/`>` 空白, **空規則** | `e6950f4` |
| `js/zkmax/inp/css/cascader.css.dsp` | 97 | 160 行 → 143 行 | 前導零, `,`/`>` 空白 | `50d2484` |
| `js/zkmax/wgt/css/stepbar.css.dsp` | 100 | 219 行 → 184 行 | **相同** | `dc63a7f` |
| `js/zul/inp/css/slider.css.dsp` | 100 | 148 行 → 150 行 | 前導零, `,`/`>` 空白 | `2c6d14a` |
| `js/zkmax/layout/css/scrollview.css.dsp` | 104 | 105 行 → 150 行 | `;}`, 前導零, `,`/`>` 空白 | `dae89ad` |
| `js/zul/wgt/css/toolbar.css.dsp` | 108 | 190 行 → 182 行 | 前導零, `,`/`>` 空白 | `f124497` |
| `js/zkmax/inp/css/timepicker.css.dsp` | 116 | 177 行 → 181 行 | 前導零, `,`/`>` 空白 | `38d91c7` |
| `js/zul/db/css/calendar.css.dsp` | 125 | 227 行 → 229 行 | `,`/`>` 空白 | `bdf5794` |
| `js/zul/layout/css/borderlayout.css.dsp` | 127 | 268 行 → 403 行 | `,`/`>` 空白, **空規則** | `fb1fd91` |
| `js/zul/wnd/css/window.css.dsp` | 127 | 194 行 → 191 行 | `;}`, 前導零, `,`/`>` 空白 | `4bc33df` |
| `js/zkmax/inp/css/chosenbox.css.dsp` | 128 | 159 行 → 179 行 | 前導零, `,`/`>` 空白 | `231dc92` |
| `js/zkmax/inp/css/searchbox.css.dsp` | 136 | 221 行 → 209 行 | `,`/`>` 空白 | `37d162b` |
| `js/zkmax/cropper/css/cropper.css.dsp` | 151 | 182 行 → 230 行 | 前導零, 零長度單位, `,`/`>` 空白 | `32b0c6d` |
| `js/zkmax/med/css/cropper.css.dsp` | 151 | 182 行 → 230 行 | 前導零, 零長度單位, `,`/`>` 空白 | `0b1bff2` |
| `js/zul/grid/css/grid.css.dsp` | 167 | 310 行 → 331 行 | `;}`, `,`/`>` 空白 | `a34e47b` |
| `js/zkmax/nav/css/nav.css.dsp` | 185 | 312 行 → 367 行 | 前導零, `,`/`>` 空白, **空規則** | `f10269b` |
| `js/zul/sel/css/tree.css.dsp` | 185 | 339 行 → 351 行 | `;}`, `,`/`>` 空白, **空規則** | `657a890` |

**步 3 比步 0–2 多驗到的三件事:**

1. **這是第一次「多數檔案第 1 層不可用」的一步。** 43 檔裡只有 12 檔逐 byte 相同、31 檔不同 ——
   比例正好翻轉(步 2 是 10 相同 / 5 不同)。原因不是品質變差,而是**檔案越大就越可能碰到
   那 5 類序列化寫法**:`,`/`>` 兩側空白幾乎每個檔都有。所以步 3 的複核重心整體移到第 2 層,
   而第 2 層是**全樹一次算完**的(見下),不是逐檔目視。
2. **重複來源檔第一次出現。** `cropper` 與 `signature` 各有**兩個輸出路徑**,而兩邊的
   `.less` 來源**逐 byte 相同**(md5 一致,不是兩個變體)。轉換照樣一檔一顆、各自產生自己的
   `.css`,所以樹裡現在有兩份一樣的 `cropper.css`、兩份一樣的 `signature.css`。
   **這不是轉換造成的重複**,是來源樹本來就這樣(`goldenlayout` 在批 3 還有第三對)。
   要不要收斂成一份是**產品面**問題(兩個輸出路徑都必須繼續存在,元件會去要),記在 P8。
3. **同名不同檔的陷阱被實際踩到並擋掉。** 批 2 裡 `grid`、`signature`、`cropper` 各自指向
   兩個不同輸出,`less2css.js` 只吃完整輸出路徑、不吃 stem,所以不可能轉錯檔;複核表的
   commit 也逐一驗過(`88af83c` = zkex/grid、`a34e47b` = zul/grid,依此類推)。

**步 3 末的全樹獨立複核**(不經過 `cssdiff`,可自己重跑):

```
byte-identical: 37/77
  已轉換的 63 檔:24 相同 / 39 不同
  仍是 LESS 的 14 檔:13 相同 / 1 不同(font-awesome,紀錄 #14 的既有項)
  40 個不同的檔全部落在 5 類封閉的序列化寫法內
⇒ 全樹零個語意 byte 不同,0 檔無法解釋
```

> **正規化順序的那個假警報在步 3 又差點復發。** 腳本已寫死「前導零 → 零長度單位 → `;}` →
> 空規則 → **空白最後**」,理由見步 2 的說明。這次多一個理由:**空規則要在去空白之前處理**,
> 否則 `sel {\n}` 併成 `sel{}` 之後才刪,會連帶把前面的選擇器一起吃掉。

**步 3 撿到的三件事:**

| # | 發現 | 處置 |
|---|---|---|
| 1 | `⚠ empty rules` 偵測器**看不到它要抓的形狀**。`[^{}]*\{\s*\}` 要求主體只有空白,而步 1 造出來的是「主體只剩註解」:`// tree cell` 改寫成區塊註解後,原本只包著一行註解與一個**巢狀**規則的 LESS 規則,解巢之後留下一個只剩註解的空殼。LESS 以前會刪掉它(先刪 `//`,規則就真的空了)→ `baseline/` 沒有、我們的輸出有 | 修在腳本(`13da402`),**輸出 byte 不變**,只是複核包終於看得見。實測已轉換的 63 檔:**9 個、分佈 4 檔**(`nav` 6、`borderlayout` 1、`paging` 1、`tree` 1);真正空的 **0 個**。順帶修掉「註解裡的 `}` 會提前結束主體」這第二個盲點 —— 不是假想,兩份 `tbeditor` 的授權標頭都含 `@{zprefix}`。15 種形狀逐一斷言,並在 `tbeditor`(批 3,同時具備兩種形狀)上實跑後還原 |
| 2 | **解巢會讓區段註解變成孤兒。** `tree.less` 的 `// tree cell` 原本**緊貼在**巢狀的 `.z-treecell` 上面;LESS 把子規則提出去、註解留在原地,於是新來源長成 `.z-treerow { /* tree cell */ /* check mark */ … }` —— 六個標籤擠在一個空殼裡,而它們要說明的規則在 7 行之後。`nav` 是同一個形狀 ×6 | 記成來源清理項(見下第 4 項)。**閘門看不到這件事**(兩邊都 0 條),這正是第 3 層人工複核存在的理由。清理方式是**把註解搬到它說明的規則上面、再刪掉空殼**,不是直接刪 —— 那些註解是有內容的(`/* ZK-2151: … */`、`/* Bug 2949287 */`) |
| 3 | 清理清單第 1 項寫錯了:`.sel{}` 其實是 `check:build-css` **類別說明裡的示意選擇器**,不是真的選擇器。實際的規則是兩份 `tbeditor` 的 `&-editor`,主體是一段**本來就存在的區塊註解**(`lset for resetCss option`),所以它屬於「只剩註解」而**不是**空規則 | 已改正下表第 1 項。結論:**全樹沒有一個真正空的規則**,6 個 empty-rule 輸出全部是註解空殼(4 檔由步 1 造成、2 檔 `tbeditor` 本來就有) |

#### 步 4 的複核包(2026-08-03,11 檔 —— 批 3 收工,**P3 收工 74/74**)

依輸出端條數排序,就是實際轉換的順序(每檔一顆 commit,閘門逐檔跑,**11 次全 0、無一次失敗**)。
`combo` 排最後不只因為它最大 —— 它要等 **L-8 拍板**才能動,見下方第 4 項。

| 輸出 | 條數 | 來源 → 產物 | 位元組 | commit |
|---|---|---|---|---|
| `popup` | 217 | `js/zul/wgt/less/` → `js/zul/wgt/css/` | 不同 | `63be065` |
| `menu` | 218 | `js/zul/menu/less/` → `js/zul/menu/css/` | 不同 | `0ef1fb3` |
| `tabbox` | 237 | `js/zul/tab/less/` → `js/zul/tab/css/` | 不同 | `4b6b313` |
| `colorbox` | 246 | `js/zkex/inp/less/` → `js/zkex/inp/css/` | 不同 | `6f2bc56` |
| `listbox` | 261 | `js/zul/sel/less/` → `js/zul/sel/css/` | 不同 | `3878988` |
| `biglistbox` | 299 | `js/zkmax/big/less/` → `js/zkmax/big/css/` | 不同 | `32523bc` |
| `tbeditor` | 375 | `js/zkmax/inp/less/` → `js/zkmax/inp/css/` | 不同 | `9fee13b` |
| `tbeditor` | 380 | `js/zkmax/tbeditor/less/` → `js/zkmax/tbeditor/css/` | 不同 | `93f4d13` |
| `goldenlayout` | 413 | `js/zkmax/goldenlayout/less/` → `js/zkmax/goldenlayout/css/` | 不同 | `eebe6d3` |
| `goldenlayout` | 413 | `js/zkmax/layout/less/` → `js/zkmax/layout/css/` | 不同 | `44ebc40` |
| `combo` | 586 | `js/zul/inp/less/` → `js/zul/inp/css/` | 不同 | `d74bf65` |

**步 4 比步 0–3 多驗到的四件事:**

1. **第 1 層複核在這一批完全不可用 —— 11 檔逐 byte 相同 0 檔。** 四步連起來是一條乾淨的曲線:
   步 0/1 **5 檔全相同** → 步 2 **10 相同 / 5 不同** → 步 3 **12 / 31** → 步 4 **0 / 11**。
   這不是品質下降,是**機制的必然**:檔案越大,碰到那 5 類序列化寫法中至少一類的機率就越接近 1
   ——「`,`/`>` 兩側空白」在 >200 條的檔裡幾乎不可能不出現。所以步 4 的複核**全部**壓在
   第 2 層(全樹、不經過 `cssdiff`、可自己重跑)與第 3 層(本複核包)上,而兩者都給了 0 個未解釋項。
2. **「同名的重複來源檔一定是複本」這個假設不成立,`tbeditor` 就不是。**
   `goldenlayout` 兩份來源**逐 byte 相同**(md5 `f3aaf30…`,`cropper`/`signature` 之後的第三對,
   如步 3 所預期);但 `tbeditor` 兩份是**真的兩個版本** —— 上游 Trumbowyg **v2.7.2 vs v2.31**、
   Potix 的改法也不同(375 vs 380 條、586 vs 600 行、md5 不同)。
   **這對 P8 的「要不要收斂成一份」是不同的問題**:`goldenlayout`/`cropper`/`signature` 是去重,
   `tbeditor` 是**版本落後**,合併等於挑一個版本。已分開記進 P8 的產品面問題。
3. **步 3 修的偵測器(`13da402`)在下一步立刻回本。** 步 4 又抓到 **6 個註解空殼、分佈 4 檔**
   (`listbox` 2、`biglistbox` 2、兩份 `tbeditor` 各 1)—— **修之前這 6 個是看不見的**。
   全樹現況:**15 個註解空殼、分佈 8 檔,真正空的 0 個**,而 `check:build-css` 的
   「empty rule」類別剛好也是 **8 檔** —— 兩個獨立實作互相對上。
4. **`combo`:L-8 選 A,而預估的重複量測出來完全命中。** 計畫書 §P3〈`combo` 的迴圈〉當初從
   `baseline/` 推估的三個數字,在轉出來的來源檔上實測**一字不差**:
   `height:var(--zk-combo-input-height)` **18** 次、`font-size:var(--zk-input-text-size)` **12** 次、
   `display:inline-block` **13** 次。356 行 `.less` → 1065 行 `.css`,**3.0× 展開,P3 最大**
   —— 迴圈攤平就是這個倍率的來源(其餘 73 檔多在 1.5–2×)。
   六個 per-component 區塊的選擇器數也很平:combobox 35、bandbox 33、datebox 32、
   timebox 43、spinner 42、doublespinner 42。

**步 4 末的全樹獨立複核**(不經過 `cssdiff`,可自己重跑):

```
byte-identical: 26/77
  已轉換的 74 檔:24 相同 / 50 不同
  仍是 LESS 的 3 檔:2 相同 / 1 不同(font-awesome,紀錄 #14 的既有項)
  51 個不同的檔全部落在 5 類封閉的序列化寫法內
⇒ 全樹零個語意 byte 不同,0 檔無法解釋
```

> **從 37/77 掉到 26/77 不是回歸。** 這一步把 11 檔從「仍是 LESS、位元組相同」搬到
> 「已轉換、位元組不同」,37 − 11 = 26,對得上。**「位元組相同」這個數字會隨著轉換進度單調下降,
> 它衡量的是「還有多少檔沒被我們碰過」,不是品質。** 真正的品質指標是**未解釋項 = 0**。

**步 4 撿到的三件事:**

| # | 發現 | 處置 |
|---|---|---|
| 1 | **CRLF 來源會不會漏 `\r` 進來源檔** —— `rewriteLineComments` 用 `indexOf('\n')` 找 `//` 結尾,CRLF 檔的 `\r` 會被收進改寫後的區塊註解(`// x\r\n` → `/* x\r */`)。**註解在輸出端被剝掉,所以閘門結構上看不到**,只會表現成來源檔行尾混用 | **量過:0 個,不需要改腳本。** 全樹只有 4 個 CRLF 檔,其中 3 個是 partial ——**不算數**,步 1 只改寫 entry。唯一的 CRLF entry(`js/zkmax/tbeditor`)in-memory 實測:來源 600 個 `\r` → 改寫後 600 → **LESS 算繪輸出 0 個**(renderer 連註解內的行尾都正規化)。已提交的 74 檔實測 0 檔含 `\r`。**先量再決定** —— 直接「順手修好」會為一個不存在的問題引入 G-delta。紀錄 #28 |
| 2 | 同名不同檔的陷阱在批 3 最密:`tbeditor` ×2、`goldenlayout` ×2 指向 4 個不同輸出 | `less2css.js` 只吃完整輸出路徑、不吃 stem,所以不可能轉錯檔。複核表的 11 筆 commit **逐一驗證它同時動到該路徑的 `.css` 與 `.less`**(不是比對 stem),11/11 通過 |
| 3 | 步 3 記的「重複來源檔逐 byte 相同」被步 4 反證了一半(見上第 2 項) | 步 3 的敘述**不改寫**(它對 `cropper`/`signature` 是對的),在本節與 P8 的產品面問題裡補上 `tbeditor` 是版本落後、不是複本 |


---

### L3-G P3 收工複審:74 檔獨立 fan-out(2026-08-04,計畫書 L3-C 2.6 第 4 層首次執行)

<details>
<summary><b>8 個唯讀 agent</b> · 74 檔全部被複審、0 檔重複 · findings <b>120</b> 條,其中 <b>suspected semantic change = 0</b> · 證明了「工具與 agent 不是彼此的超集」(偵測器 15/15 窮盡 vs agent 找到 55 處偵測器結構上看不到的問題)</summary>


執行機制腳本裡設計好的 `P3: review` **從來沒跑過** —— 步 0–4 的第 3 層複核包全部是實作者自評。
這次補跑:**8 個唯讀 agent**,每片約 1675 行,重複檔對(`goldenlayout`/`cropper`/`signature`)
刻意放同一片,免得同一個發現被報兩次。

**覆蓋率是斷言出來的,不是相信回報** —— 拿 74 個已 commit 的 `.css` 去對 8 份回報的
`filesReviewed`:**74 檔全部被複審、0 檔重複、0 個不存在的路徑**。

| 指標 | 數 |
|---|---|
| findings 總數 | **120**(cleanup 78、nit 42、blocking 0) |
| **suspected semantic change** | **0** ← 最重要的一個數字 |
| 可現在就套用(只動來源,輸出 byte 不變) | 106 |
| 必須延後(會改輸出宣告數) | 14 |
| 有 findings 的檔 | 45 / 74 |

**分類軸是 G-zero,不是嚴重度。** 註解位置、可讀性、token 清晰度只動註解與空白,經
`stripComments` + minify 之後輸出一個 byte 都不會變,所以**閘門本身就能證明它們安全**;
重複宣告刪掉會改宣告數,只能延後。一個 `semantic-change` 才是真正的壞消息 —— 它代表閘門有盲點。

#### 這次複審真正證明的事:工具與 agent 不是彼此的超集

|  | 註解空殼(主體只剩註解) | 位置錯的註解(所在規則**仍有宣告**) |
|---|---|---|
| 機械偵測器(`check:build-css` 的 empty-rule 類) | **15/15,窮盡** | **0 —— 結構上看不到** |
| 8 個複審 agent | 9/15(漏了 `nav` 5 個、第二份 `tbeditor` 1 個) | **55 處** |

Ground truth 是另寫一支偵測器數的(先遮掉註解再找空主體,免得註解裡的 `}` 提早結束主體):
**15 個、8 檔**,與既有清冊逐檔相符。

> **所以兩邊都要,而且各有各的權威範圍:清冊的數字用偵測器的,新形狀靠 agent 找。**
> 偵測器對它認得的形狀窮盡、對其他形狀全盲;agent 找到了偵測器結構上看不到的一整類問題,
> 但**它不窮盡** —— 拿 agent 的回報當清冊會少算 6 個空殼。這是把「派 agent 驗證」
> 寫進 §2.6 第 4 層的實證依據,也是它**不能取代**第 1、2 層的理由。

#### 抽驗(不照單全收)

| 宣稱 | 驗證 |
|---|---|
| `tabbox.css` 同一個選擇器出現兩次、值互相矛盾 | **完全正確** —— `.z-tabbox-right > .z-tabs` 在 **161 行 `float: left`**、**194 行 `float: right`**,後者生效、前者是死的。閘門證明此檔與 baseline 相同 ⇒ 這是**來源既有**的噪音,**不是轉換造成的** |
| `nav.css:9` 三段區塊註解被解巢留在「仍有宣告」的規則尾端 | **正確**,而且正是偵測器看不到的形狀:`.z-navbar { …8 條宣告…; /* overall style */ /* horizontal style */ /* vertical style */ }` |
| `combo` 的重複量 | **正確,而且比計畫書的估計精確**,見下 |

#### `combo` 的實測推翻了計畫書的估計 —— 兩個數字都記

| 來源 | 折疊後的宣告數 |
|---|---|
| 計畫書 §P3 與清理項 5 的**估計** | ~100 |
| **複審實測** | **191**(586 → 191,**−67%**;1064 行 → ~530 行,−50%) |

複審者把 6 個 clone 正規化(去註解、代換元件 token)後互 diff:**0 行不同,各 129 條有效行** ——
六份除了元件名以外逐字相同,所以折疊是**機械轉換、沒有判斷空間**。三個預期重複數也逐一命中:
`height:var(--zk-combo-input-height)` ×18、`font-size:var(--zk-input-text-size)` ×12、
`display:inline-block` ×13。另外量到 `color:var(--zk-input-placeholder-color)` ×24、
`background:var(--zk-input-background-color)` ×13。串接安全性也查了:**沒有元素會同時帶兩個
clone 的 class**,所以分組不改變解析順序,823–944 行的 cross-component 覆寫仍在分組之後。

> **不改斷言去符合量測**(§2.1 硬禁令)。清理項 5 的 `~100` 換成 `191(實測)`,但**舊估計保留在
> 這張表裡**。舊估計的推導過程沒有被記下來,所以**無法歸因它錯在哪** —— 這本身就是教訓:
> 寫進計畫書的估計要附推導,不然後來只能知道它錯了、不知道為什麼。

#### 禁令是被驗證的,不是被相信

8 個 agent 全程唯讀。收工後 `git status --porcelain` 只有**三個先前就已 modified** 的 doc;
74 檔 `.css`、`baseline/`、腳本、`package.json` 全部沒被動到。
唯一的寫入是每個 agent 各自在 session scratchpad 寫一份 JSON —— 在 repo 外面。

</details>

---

### L3-H 執行機制:workflow

<details>
<summary>一次跑一個階段 · P3 必須加 <code>{step}</code> · 三個設計決定(沒有迴圈、<code>{batch:1}</code> 拒絕、缺 step 大聲失敗)· 為什麼轉換不並行、階段之間為什麼不串接</summary>


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

</details>

---

### L3-I Change Log —— 狀態層的敘述更正

<details>
<summary><b>34 條狀態層更正</b> —— 全部只改敘述,<b>量測數字一律不動</b>;既有的閘門紀錄列不改寫</summary>

**規範層的斷言變更**(前提數字、判準形狀、方法學結論)在**計畫書 L3-G**,不重複。
這裡只收「同一組量測被描述錯了」的更正。

三條配套規則,它們與「假設被推翻就改結論」相容而非衝突:

- **L3-A〈閘門紀錄〉是附加式的** —— 不能事後補、**不能改寫既有列**。
  P8 的最終核帳要靠它把 P4 + P5 + P7 的 delta 加總對上,改寫一列就核不了帳。
  更正一律**另開新列**(紀錄 #29 就是這樣做的)。
- **不改斷言去符合量測。** 舊估計保留在原處,不因為量出了新數字就抹掉。
- **既有段落原文不改寫,只指路。** 例:L3-C〈P2 儀器證明〉裡兩個被後來量測推翻的數字,
  原文留著、旁邊加一段指向正確處。

| # | 日期 | 被推翻的敘述 | 更正後的結論 | 出處 |
|---|---|---|---|---|
| S1 | 2026-07-30 | P2 全樹重導覆蓋 **13642** 條 / 75 檔 | **12142** 條 / 75 檔(84.8%) | 兩個 agent 互相矛盾,算術裁決:`14323 − 1500 − 681 = 12142` 對應 75 檔;`13642` 對應的是 76 檔。**閘門結果正確不代表關於閘門的敘述正確** |
| S2 | 2026-07-30 | workflow 用 `{phase:"P2"}` 啟動 → 回報 `phase:"prereq"` 看起來像成功 | `args` 以 **JSON 字串**而非物件抵達,`|| 'prereq'` 的預設值讓它又跑了一次 prereq。**預設值是一個合法階段,正是讓這個 bug 無聲的原因** | 已修:`readArgs()` 三種型別都接受,**認不出來的 phase 直接報錯** |
| S3 | 2026-07-31 | 5 類序列化寫法清單原本只有 **4** 類 | **5** 類 —— `tbeditor` 兩份解釋不了,查出來是空規則 | `check:build-css` 首跑 |
| S4 | 2026-07-31 | L3-C〈P2 儀器證明〉裡的 `.sel{}` 與「每一類幾檔」 | `.sel{}` 是**類別說明裡的示意選擇器**,不是字面值;**每一類的檔數會隨轉換推進而變**(空規則那一類從 2 檔變 6 檔)。要當下的數字就跑 `npm run check:build-css` | 原文不改寫,只在該段加指路 |
| S5 | 2026-08-03 | 步 1 口頭回報說 `listbox` / `tree` 落在**步 3** | 計畫書一直寫的是**步 2**,回報錯了 | 每一步的檔案清單都用 `cssdiff --list` **當場重推**,不沿用上一步的說法 —— 就是為了讓這種錯自己現形 |
| S6 | 2026-08-03 | 「`diff -rq` 除了 `font-awesome` 以外出現任何檔名,就是這一步弄壞了東西」 | **從步 2 起就已經是錯的**。預期檔名數隨進度變:步 0/1 **1** → 步 2 **6** → 步 3 **40** → 步 4 **51**。**「出現檔名」本身不再是壞消息** | 留到步 4 才發現。**要盯的指標換成「無法解釋幾檔」** —— 那個數字從步 0 到步 4 一直是 **0** |
| S7 | 2026-08-03 | `⚠ empty rules` 偵測器涵蓋了它要抓的形狀 | `[^{}]*\{\s*\}` 要求主體只有空白,**「主體只剩註解」從來沒被計到** —— 而那正是步 1 的 `//` → `/* */` 改寫造出來的形狀 | 修在腳本(`13da402`),**輸出 byte 不變**。順帶修掉第二個盲點:註解裡的 `}` 會提前結束主體 |
| S8 | 2026-08-03 | 註解空殼 **9** 處 | **15** 處 / 8 檔;**真正空的規則全樹 0 個**(`bare=0`) | 偵測器修好後步 4 立刻又抓到 6 處 |
| S9 | 2026-08-03 | 清理項第 1 項是「2 個空規則 `.sel{}`」 | 實際規則是兩份 `tbeditor` 的 `&-editor`,主體是**本來就存在的區塊註解** → 屬於「只剩註解」,**不是**空規則 | 步 3 第 3 項 |
| S10 | 2026-08-03 | 「同名的重複來源檔一定是複本」 | `goldenlayout` / `cropper` / `signature` 是複本(md5 一致);**兩份 `tbeditor` 是真的兩個上游版本**(Trumbowyg v2.7.2 vs v2.31)→ 對 P8 是**兩個不同的問題**:去重 vs 版本落後 | 步 4 第 2 項 |
| S11 | 2026-08-04 | 「批 3 的第 1 層複核**不可用**」(步 2/3/4 複核包與紀錄 #24/#25/#27 都這樣寫) | 那是**嚴格逐 byte 相同**的窄義,而計畫書明文說**不要外推到 P3**。按 P3 的定義(相同 **or** 落在 5 類封閉清單內):**批 3 11/11 通過、全樹 77/77 通過,清單外 0 檔**。兩個說法的結論方向相反,**後者才對** | 紀錄 #29。**量測數字全部不變**,既有列一律不改寫 |
| S12 | 2026-08-04 | 「第 2 層的腳本不在 repo、承諾是空的」 | **講過頭了** —— `check:build-css` 就在 repo 且無法分類時 exit 1。真正缺的只有全樹 77 檔變體,已於 `9230348` 補成 `npm run check:bytes` | 紀錄 #29 / #30 |
| S13 | 2026-08-04 | L2.4 表頭:清理待辦「**全部**會改變輸出 byte,所以**不屬於 G-zero**」 | **7 項裡只有 2 項成立。** 閘門形狀有三種:**2、3、6** 只動註解 → 輸出**逐 byte 相同**(`stripComments()` 在 minify 前就跑);**1、4** 刪的是註解空殼產生的空規則 → byte 變但 declaration 數不變,**仍過 G-zero**;**只有 5、7 改變 declaration 數**,才是 G-delta。**排程後果**:1–4、6 共 5 項不必等 P4 | 表頭寫在第 6 項(2026-08-04)加入**之前**,而第 6 項自己就寫「這一項是 G-zero」→ 同一節內自相矛盾。**量測數字全部不變**,只改敘述 |
| S14 | 2026-08-04 | L2.2〈規則表產生器〉:「四支 npm script … **全部 exit 0**」 | **兩支現在 exit 1**:`check:var-table`(例:「LESS 名稱從未被引用」expected **42** / measured **753**;「rows dead on both sides」expected **25** / measured **678**)、`check:mixin-table`(`unique names` **30** vs 文件記的 **24**)。**沒有改動任何 expected 值** —— 依規則不改斷言去符合量測 | **不是 P6 造成的,是 P3 的後遺症。** 用臨時 worktree 在 P6 之前的樹(`d6a48ef`)重跑,量到**完全相同**的數字;P6 只讓 `mixin-table` 的資訊列 `less files scanned` 從 **79 → 63**(= 刪掉的 16 檔),斷言與判決一個都沒動。成因:斷言是在 **153 檔 LESS** 的樹上校準的,P3 刪掉 74 個 entry 之後,「LESS 名稱有沒有被引用」失去了它的量測對象。**兩張表的產出內容不受影響**(`38 / 30 / 15` 三個數字未變、`mixin-to-css.md` 不記錄掃檔數)⇒ 這是**儀器過期**,不是遷移表錯。發現於 P6 收工前的例行檢查 |
| S15 | 2026-08-04 | L2.4 第 6 項「位置錯的註解 55 處、**22 檔**」 | **「55 處」是對的,「22 檔」是錯的 —— 應為 28 檔。** 先前一度懷疑「55」低報(原始資料看起來是 65),那個懷疑是錯的:65 是 `comment-placement` 這個 kind 的**全部**發現數,其中 **9 條本來就記在第 1、4 項名下**(它們就是空殼規則:`biglistbox` 199/480、`tbeditor` 453、`nav` 20、`borderlayout` 2、`paging` 140、`listbox` 223/353、`tree` 228)、**1 條記在第 3 項名下**(`zul/css/footer.css`)⇒ 65 − 9 − 1 = **55** ✓。但**檔數不能照同樣方式減** —— 原本的算法是 `30 − 7(空殼檔)− 1(footer)= 22`,而那 7 個空殼檔裡有 **6 個仍然帶著非空殼的第 6 項發現**(`listbox` 5、`tree` 4、`tbeditor` 3、`borderlayout` 3、`biglistbox` 2、`nav` 2),只有 `paging` 可以整檔減掉(它唯一的 `comment-placement` 發現就是那個空殼)。實測:**55 條橫跨 28 檔**。**「55」沒有改動;「22」依本表慣例就地標示更正為 28**(同第 4 項 `~~9~~ → 15` 的寫法) | 由第 4 層獨立驗證指出並複現(紀錄 #33) |
| S16 | 2026-08-04 | (新增,不是更正)複審建議「修 `less2css.js` 的 CR 處理 —— 全 repo 6 檔受影響」| **本次刻意不修工具,只修那 6 檔的產出。** 理由:P3 已收工,改轉換器不會回頭改變已轉好的檔,而且那 6 檔的畸形註解本次已全部手修歸零。**但它對 P5 是真的前置** —— `norm.less` 匯入的 `zul/less/_reset.less` 有 **431 個 CR**(`_header.less` 7、`zkmax/less/_zkvariables.less` 4),所以 P5 一轉 `norm.less` 就會重新產生同一種 `/* x\n */` 畸形註解。**P5 開工前先修 `less2css.js` 的 CR 處理,否則會重做一次這次的清理**。**←已收工(2026-08-06,紀錄 #46):`_reset.less` 端對端實測斷行註解 13 → 0,P5 前置全部解除。連帶推翻紀錄 #28 的「不需要改腳本」,見 S34** | 量測於紀錄 #32,`find src/main/resources/web -name '*.less'` 全數掃 CR |
| S17 | 2026-08-04 | (新增,不是更正)紀錄 #31 稱 P6 的產生器輸出與舊 `.less` 的 `less.render()` **逐 byte 相同**,隱含「什麼都沒漏」| **輸出的確逐 byte 相同,但來源端漏了一條註解。** 第 4 層驗證在比對全樹註解清單時撿到:被刪掉的 `zul/font/font-awesome.less:9` 有一條 `// Font Awesome core compile (Web Fonts-based)`,**在 `_font-awesome.css` 樣板與產生出來的 `font-awesome.css` 裡都不存在**。不影響 #31 的任何量測(`//` 註解本來就不會進入 `less.render()` 的輸出,所以逐 byte 相同的結論不受影響),也不影響閘門(`stripComments()`)。**是來源可讀性的漏失,不是產出缺陷。****本次刻意不補** —— 它屬於 P6 的樣板,補了要重新產生 11917 行的 `font-awesome.css`,會把一顆「只動註解」的 commit 混進另一階的檔。留在這裡,連文字一起記下來,補的時候照抄 | 紀錄 #33 的第 4 層驗證 |
| S18 | 2026-08-05 | L2.5 第 2 項:「**兩個輸出路徑都必須繼續存在**(元件會各自去要),所以收斂需要建置期複製或 import 機制」 | **這個理由是錯的 —— 舊路徑那一份從來沒有人要。** 實測 `zkcml/zkmax/src/main/resources/metainfo/zk/lang-addon.xml`:每個 `css-uri` 只有**一個** `widget-package` 會要,而且一律是**新路徑** —— `widget-package` / `css-uri` 行號:`zkmax.goldenlayout` **549 / 553**(`goldenpanel` 560 共用同一個 package)、`zkmax.cropper` **653 / 657**、`zkmax.signature` **642 / 646**、`zkmax.tbeditor` **351 / 355**。**產品端來源樹只留新路徑**(`zkmax/src/main/resources/web/js/zkmax/{goldenlayout,cropper,signature,tbeditor}/less/`,舊路徑不存在),`zkmax/codegen` 的預設 `.css.dsp` 也只在新路徑。**帶著新舊兩份的只有 `zkthemebuilder/template`** ⇒ 這是**樣板端的遺留**,每一個從樣板長出來的主題都繼承它,**該往上游報**。後果:(a) 問題從「怎麼去重」變成「刪掉 4 個死檔要不要走 G-delta」(輸出 **77 → 73** 檔);(b) **這是四對不是三對** —— `tbeditor` 的路徑形狀與另三對相同(見第 3 項);(c) 不需要建置期複製或 import 機制。**沒有直接刪** —— 舊 `widget-package` 可能還被更舊的 ZK 版本或客戶手寫的 `<?link?>` 指到,那是產品面判斷,留在 L2.5 | 由 user 指出方向(「從 zkcml 原始碼比對對應路徑」),2026-08-05 逐檔實測;`grep -B12 '<css-uri>css/<comp>.css.dsp'` 全數收斂到單一 `widget-package` |
| S19 | 2026-08-05 | (新增,不是更正)「LESS 已經刪掉了,視覺 A/B 的 baseline 要從哪裡來?」—— 文件沒有任何地方回答過這個問題 | **基準不需要 LESS,它已經在硬碟上。** `baseline/` 是 **77 個 `.css.dsp` + 1 個 `.built-from`**,建於 2026-07-29,來源 commit `a89d44e`(= 與 master 的 merge-base,樹上 **153 `.less` / 0 `.css`**)。而 `.css.dsp` 正是 runtime 唯一吃的東西 ⇒ **A 側不必重編譯任何 LESS**,把 `baseline/*` 蓋到 `target/classes/web/iceblue/` 再重啟 preview app 就是 A 側,同一顆 jar、同一批圖檔字型(轉換完全沒動那 **29** 個非 `.less` 資產),唯一變數就是那 77 個檔。**←「蓋到 `web/iceblue/`」這一句不完整,而且掩蓋了一個更大的問題,見 S20。****要重建也還在**:`git worktree add <dir> a89d44e && npm ci && node scripts/baseline.js`,而 `baseline.js` 在 `.less` 檔數為 0 時會拒絕執行,所以不可能誤用已轉換的樹自我比對。**但重建有一個沒被寫出來的細節**:`.built-from` 記的是 `less: 3.13.1`,而 P1 已把樹釘到 **4.8.1** ⇒ 今天重建拿到的是**宣告等價**(P1 的閘門就是這麼證的)而**非保證逐 byte 相同**的基準。`cssdiff` 比宣告、視覺 A/B 比像素,兩者都不需要 byte 相同,所以這不擋事 —— 但**要 byte 相同就得同時退回 3.13.1**。**真正的殘餘風險是 `baseline/` 未進版控**(`.gitignore:9`):遺失不會有任何錯誤訊息。低成本緩解是把 77 個檔的 sha256 清單 commit 進 repo(77 行),讓遺失**可偵測**。**這一階真正缺的不是基準,是被截圖的頁面與 harness 本身** —— 此 worktree `src/test/resources/web/` 只有 **1 個** `.zul`(`preview.zul`),`package.json` 裡**沒有 playwright**、也沒有測試目錄 | 2026-08-05 實測:`baseline/.built-from`、`git ls-tree -r a89d44e`、`find baseline -type f`、`node -e "require('less').version"` = 4.8.1 |
| S20 | 2026-08-05 | S19:「把 `baseline/*` 蓋到 `target/classes/web/iceblue/` 再重啟 preview app 就是 A 側,**同一顆 jar、同一批圖檔字型**」 | **機制對、目錄錯,而且真正的問題比目錄大:這個 worktree 的主題從來沒有被服務過。** 三個名字互不相同 —— (a) **註冊主題名 = `___THEME_NAME___`**(`ThemeWebAppInit` 的 `THEME_NAME`;preview app 的 `org.zkoss.theme.preferred` 也是它);(b) **maven 輸出 `target/classes/web/___ARTIFACT_ID___`**(`zktheme.theme.outputDirectory` = `${project.build.outputDirectory}/web/${project.artifactId}`,而 pom 的 `<artifactId>` 從未被替換)—— **29 個圖檔資產全部在這裡**;(c) **npm 閘門輸出 `target/classes/web/iceblue`**(package.json 硬寫)—— **0 個資產**。這棵樹是**半初始化**的樣板:`pom.xml` 的輸出路徑與 `package.json` 的 `build:css` 被手動指到 iceblue,但 Java/metainfo 那一半的 `___THEME_NAME___` 從來沒跑過 `init.sh`。**實測跑起 preview app 的結果**:`GET /` → 200,但頁面自己的 `<link>` 指向 `~./___THEME_NAME___/zkmax/css/tablet.css.dsp` → **404**;`/___THEME_NAME___/zul/css/norm.css.dsp` → **404**,`/iceblue/zul/css/norm.css.dsp` → **200 但沒有人要求它**;彙整檔 `_zkiju-___THEME_NAME___/zul/css/zk.wcs` → 200 / 175619 B,**內容卻不是本主題** —— 去註解去空白後抽 28 條本地 `norm` 規則命中 **0 條**,而且服務出來的 CSS **一個 `--zk-` 自訂屬性都沒有**,對照本主題 `norm.css.dsp` 單一檔就有 **1496 個**。**而且沒有「回退到內建 CSS」這回事** —— 第 4 層驗證把服務出來的 `zk.wcs` 解析成 **3639 條規則,其中 3603 條是 `.z-icon*`、4 條 `@font-face`、4 條 `.fa*`,元件規則 0 條**;ZK 自己 jar 裡的 `web/zul/css/norm.css.dsp` 同樣被主題改寫過路徑、同樣 404(對它抽樣也是 0/28)⇒ **兩側都是幾乎沒有樣式的頁面(只剩 icon 字型)**。**最強的證據**:服務出來的 `zk.wcs` 在裝 A 側與裝 B 側時 **sha256 完全相同**(`0a1738c5…`)⇒ **A/B 截圖會逐像素相同**。**後果是假成功**:名字修好之前,A 側與 B 側都會拍到 ZK 內建 CSS,視覺 A/B 會回報「零差異」而其實什麼都沒測到 —— 這比「只有一頁 `preview.zul`」嚴重,缺頁面會**明顯失敗**,這個**不會**。**修法已量測、刻意未執行**:帶佔位符的 tracked 非 doc 檔共 **8 個**(全樹 `___THEME_NAME___` 19 處 / `___THEME_NAME_CAP___` 5 處 / `___ARTIFACT_ID___` 3 處),要動的是 **6 檔 + 1 個目錄改名 + 1 個檔改名**,**外加兩個容易漏的**:(i) `package.json` 的 `zklessc` / `zklessc-dev` 仍指向 `target/classes/web/___THEME_NAME___` —— 改完名字之後跑它會寫到**第三個**沒人服務的目錄;(ii) `readme.md` 6 處純文件。`init.sh` 的 `templateFiles` 是 8 檔白名單、**不含 `src/main/resources/web`**,所以它威脅不到閘門,但它是互動式而且會重寫已經客製過的 `pom.xml`,建議手改而不是跑它。**修好之後會多一個順序陷阱**:`compile-less` / `compile-css` 綁在 **`process-resources`**,而文件寫的啟動指令 `mvn test exec:java@preview-app` 會跑到那個 phase ⇒ 名字統一之後,**每次啟動 app 都會把 B 側重建到 `install a` 寫的同一個目錄、無聲蓋掉 A 側**。正確順序是**先啟動、後 `install a`**(而且不必重啟,`ThemePreviewApp.java:15` 的 `WCS.cache=false` 讓下一個 request 就生效);忘了也會被抓到 —— marker 還說 A 而 byte 已經是 B,`npm run ab` 會報 `A — CORRUPT`。**沒有動的理由**:改註冊主題名等於改這個 artifact 的公開身分(addon name / Java package),那是產品面決定,不是轉換分支能單方面做的 | 2026-08-05 實測:`withjdk.sh 17 mvn -q test exec:java@preview-app` 起服務後逐 URL `curl -w '%{http_code}'`;`node` 去註解去空白比對 served `zk.wcs` 與 `target/classes/web/iceblue/zul/css/norm.css.dsp`;`npm run ab` 現在會把這三個名字一起印出來並 **exit 1** |
| S21 | 2026-08-05 | S20 的修法:「把四個名字統一成 `iceblue`,主題就會被服務」 | **名字統一了,主題還是沒有被服務 —— 而 `iceblue` 恰好是唯一不能用的那個名字。** `ServletFns.resolveThemeURL`(`zweb/.../web/fn/ServletFns.java:104-105`)第一件事就是 `if (Strings.isBlank(themeName) || StandardTheme.DEFAULT_NAME.equals(themeName)) resolved = url;` —— **原封不動回傳,不做 `~./` → `~./<theme>/` 改寫**;而 `StandardTheme.DEFAULT_NAME`(`zweb/.../web/theme/StandardTheme.java:36`)的值**字面上就是 `"iceblue"`**。所以把主題命名為 `iceblue` 等於宣告「我是預設主題」,ZK 不加前綴,`~./zul/css/norm.css.dsp` 直接落到 classpath 上 **ZK 自己 jar 裡**的那一份,我們放在 `web/iceblue/` 底下的 77 個檔**沒有人會要**。**實測(init.sh 之後起服務)**:頁面連的 URL 從 `_zkiju-___THEME_NAME___/zul/css/zk.wcs` 變成 **`/zul/css/zk.wcs`(主題段整段消失)**;`/zkau/web/zul/css/norm.css.dsp` → 200 / **15824 B**(jar 那份),`/zkau/web/iceblue/zul/css/norm.css.dsp` → 200 / **63125 B**(我們那份,**存在、可服務、沒人要求**)—— **`/zkau/web/` 前綴不可省,少了它兩個都是 404**;服務出來的 `zk.wcs` 415355 B,`--zk-` 自訂屬性 **0 個**,我們的 `norm` 規則只命中 **6/28**(那 6 條是 ZK 10.2.1 的 iceblue 與本轉換共有的部分)。**這是比 S20 更危險的失敗模式**:S20 的頁面沒有樣式,一眼就知道壞了;這裡的頁面**看起來完全正常**(它就是真的 iceblue,只是 jar 裡那份),而 A/B 會回報零差異。**已用最強的方式證明**:同一個 URL,裝 A 側與裝 B 側時服務出來的 byte **sha256 相同**(`95c350b0…`),而同一時間我們自己那個沒人要求的 `js/zul/inp/css/input.css.dsp` **確實隨側邊改變**(`c6beb62e` vs `dab86e19`)⇒ **切換確實生效,只是沒有人在看**。**兩條可行的出路,都已驗證或量測**:(a) **主題名不要叫 `iceblue`** —— 改寫就會生效,`~./<name>/…` 指到我們的檔;(b) **保留 `iceblue`,改成遮蔽 ZK core 的路徑** —— 輸出目錄從 `web/iceblue/` 改成 `web/` 本身,靠 `target/classes` 在 classpath 上先於 jar 來覆蓋。**(b) 已實測可行**:把我們的 `norm.css.dsp` 複製到 `target/classes/web/zul/css/` 後,`/zkau/web/zul/css/norm.css.dsp` 回傳的就是 **63125 B(我們那份)而不是 15824 B**,而且**不必重啟**(`org.zkoss.web.classWebResource.cache=false`);第 4 層獨立驗證還多量了一件事 —— 遮蔽會一路傳到瀏覽器真正載入的彙整檔:`zk.wcs` 從 **415355 → 462656 B**、`--zk-` 從 **0 → 1496**。而且 (b) 更貼近這個專案的真正歸宿 —— `baseline/` 的路徑形狀(`zul/css/…`、`js/zul/…`)本來就是 **ZK core 的資源路徑,不是主題子目錄的形狀**。**選哪一條會改到 `package.json`、閘門的 candidate 路徑與文件引用,所以留給決策,不自行選定。** ~~26 處文件引用~~ **←這個數字是錯的(第 4 層指出,2026-08-05):「26」是 `check:cssdiff` 在 `doc/*.md` 的**出現行數**,不是路徑引用數,兩者被寫串了。** 實測:`target/classes/web/iceblue` 在 `doc/*.md` 共 **35 處 / 33 行**(短寫法 `web/iceblue` 共 **40 處**),其中 **24 處落在附加式不覆寫的 L3-A 閘門紀錄列裡** —— 那些是歷史事實,**本來就不該改** ⇒ **真正需要跟著改的只有 11 處**。**另一個必須寫下來的實驗限制**:`ThemeFns.getCurrentTheme()` 的最後一段 fallback 就是回傳 `StandardTheme.DEFAULT_NAME`,所以「註冊成 `iceblue`」與「根本沒註冊成功」會產生**完全相同**的觀測(都走 `ServletFns.java:104` 那條 skip、都給出沒有前綴的 URL)。本次的「四個名字一致」是靠類別編譯成功 + `config.xml` 接線推出來的,**不是靠觀測到註冊行為**;要證明註冊,得把 preferred 暫時設成一個**非預設**的名字,看 `~./<name>/` 前綴會不會出現。這不影響本 S 的結論(兩條出路對兩種情況都一樣),但別把它當成已證實 | 2026-08-05 讀 `resolveThemeURL` / `StandardTheme` 原始碼 + 起服務逐 URL `curl -w '%{size_download}'` + 兩側 `shasum` 對照 + classpath 遮蔽探針(用完即刪) |
| S22 | 2026-08-05 | (新增,不是更正)`init.sh` 可以直接拿來用 | **它在 macOS 上會產生一個沒有人打錯的錯字。** 第 75 行原本是 `themeNameCap=$(echo $themeName \| sed 's/.*/\u&/g')`,而 `\u`(首字母轉大寫)**是 GNU sed 的擴充,BSD sed(macOS)不支援** —— 它把 `\u` 當成字面的 `u`,於是 `iceblue` 變成 **`uiceblue`**:產生出 `uiceblueThemeWebAppInit.java`、`public class uiceblueThemeWebAppInit`,並且被寫進 `config.xml` 的 `<listener-class>`。**它會編譯、會註冊、也會執行**,只是類別名稱是垃圾;因為 `config.xml` 跟著一起錯,所以連「class not found」都不會發生 ⇒ **沒有任何症狀**。本次已(a)把三處 `uiceblue` 更名回 `Iceblue`(檔名、類別、`<listener-class>`),(b)把 `init.sh` 第 75 行換成 POSIX 參數展開 + `tr`,並實測 `iceblue→Iceblue`、`breeze→Breeze`、`x→X`、`sapphire_c→Sapphire_c`。**這是樣板本身的缺陷,該往上游報** —— 每個在 mac 上跑過 `init.sh` 的人都拿到了這個錯字。**同一份上游報告還要帶上另外兩個(第 4 層補的,本次未修 —— 它們不影響 `iceblue`,而且改的是互動式輸入驗證,不屬於本分支)**:(i) 第 93–98 行的 `sed` 把使用者輸入**未跳脫**就代進去 —— DISPLAY NAME 打 `Ice & Blue` 會變成 `Ice ___DISPLAY_NAME___ Blue`(`&` 在 sed 取代字串裡等於整個 match),打 `Ice/Blue` 直接 `bad flag in substitute command`,而 `set -e` 從第 72 行就開著 ⇒ **中途爆掉、留下改到一半的樹**;(ii) 沒有驗證 artifactId 以字母開頭,`9lives` 會產生 `9livesThemeWebAppInit` —— **不合法的 Java 識別字** | 2026-08-05 執行後 `/usr/bin/grep -rn 'uiceblue' src/` 撿到 3 處;`man sed` + 4 個名字的迴圈實測;第 4 層另以 `bash`/`sh` 各跑 11 個名字(含 `Iceblue`、`ICEBLUE`、`úber`、`9lives`、`my-theme`)並實測 `&` 與 `/` 兩種輸入 |
| S23 | 2026-08-05 | S21 留下的二選一(改名 vs 遮蔽 core 路徑) | **決策:改名,`iceblue` → `iceblue_css`**(user 決定,理由是 10.4.0 FL 的預設主題也叫 `iceblue`,並存會搞混)。**沒有自己發明名字,而是沿用產品既有的變體命名空間** —— `~/.m2/repository/org/zkoss/theme/` 底下本來就有 `iceblue_c`(從 5.0.0 一路出貨到 **10.4.0.FL.20260713-Eval**)與 `iceblue_rem`(10.3.x),`iceblue_<suffix>` 就是 iceblue 衍生版的既定寫法;~~`_css` 說明差別在**來源語言**而不是外觀,不抵觸「兩側必須零差異」這個主張(相對地 `newiceblue` / `iceblue2` 都暗示重新設計)。唯一的既有用途是 `zkcml/zkthemebuilder/palettes/_iceblue_css.less`,**1 行、內容是 `// Just leave it blank.`、全 zkcml 零引用**。~~ **←這段理由是反的,而且「唯一用途」也錯(第 4 層指出,2026-08-05)。** 實測:`zkthemebuilder/palettes/` 底下是 **27 個普通 palette + 27 個 `_css` palette,嚴格 1:1 配對**(amber、aquamarine、aurora、cardinal、deepsea、material、montana…),而 `_css` 那一份的意思是**同一組 palette 的 CSS 自訂屬性版本**,不是「來源語言是 CSS」的標記 —— `_amber.less`(223 B)宣告 `@loadingAnimationDefer`、`@sliderTicks`,`_amber_css.less`(1114 B)宣告 `:root { --zk-color-primary: #FFA706; … }`。`_iceblue_css.less` 只有 34 B / 2 行(`// Iceblue` + `// Just leave it blank.`)**是因為 iceblue 是預設 palette、沒有東西要覆蓋**,它的 26 個兄弟檔都是 396–2910 B 的真實內容。而且它**不只存在於 zkthemebuilder** —— 它在 ZK core 自己的 palette 來源(`zk/zul/src/main/resources/web/zul/less/colors/_iceblue_css.less`)裡,**並且從 10.3.0.1 起就打包進 `zul` jar**(在 `zul-10.3.0.1-Eval.jar`、`zul-10.3.0.1-jakarta-Eval.jar`、`zul-10.4.0-SNAPSHOT.jar` 內都驗到;10.2.1 的 jar 只有 `_iceblue_css.less` 的兄弟 `_iceblue.less`,所以從這個 worktree 看起來像沒人用)。「zkcml 零引用」那一半是對的(來源命中 0)。**後果**:`@themePalette: "iceblue_css"` 是一個**合法且已出貨的 palette 名稱**,與「一個叫 `iceblue_css` 的主題」是**兩件不同的東西** —— 而 `readme.md:50` 正是教使用者設 `@themePalette` 的那一行 ⇒ **這等於把「兩個看起來一樣的東西」的混淆,搬到隔壁一個命名空間去**,正是這次改名要消除的問題。**主題 artifact 的命名空間確實還是乾淨的**(`org/zkoss/theme/` 底下沒有任何 `*_css` artifact),所以這是**語意上的歧義,不是功能衝突** —— 比原本 `iceblue` 撞 `DEFAULT_NAME` 的硬性衝突輕,但**必須讓決策者知道**。**取名的硬性限制(值得寫下來,下次還會用到)**:(a) 不能是 `iceblue`(= `DEFAULT_NAME`,見 S21);(b) **不能有連字號** —— 名字會變成 Java 套件 `org.zkoss.theme.<name>`,`iceblue-css` 是非法識別字,底線則合法且產品自己在用;(c) 不能以數字開頭(`init.sh` 無驗證,見 S22);(d) `init.sh` 只把**第一個字母**轉大寫,所以類別名要手動訂為 `IceblueCssThemeWebAppInit`;(e) **顯示名稱也要改**(訂為 `Iceblue CSS`),否則主題選單會並列兩個 `Iceblue`,混淆原封不動。**結果見紀錄 #36 —— 封鎖解除,A/B 第一次量到訊號。** 另外記一筆**技術債**:輸出路徑 `target/classes/web/<name>` 在 **4 支 script + `package.json` 4 支 npm script = 8 個地方**(**字面出現 9 次** —— `check:cssdiff` 一支就寫了兩次:`zklessc -o` 的參數與 `cssdiff.js` 的 candidate 參數)裡各硬寫一份,這次改名要同步改這 8 處(`pom.xml:17` 是第 9 個站點,但它是 `${project.artifactId}` 推導的,自己就跟上了 ⇒ 不計) —— 正是它們會各自漂移的原因(S20 的三個目錄不一致就是這樣來的),但本次**刻意不重構**,只做改名 | 2026-08-05 `ls ~/.m2/repository/org/zkoss/theme/`、`wc -l` + `head` 讀 `_iceblue_css.less`、`/usr/bin/grep -rln 'iceblue_css' zkcml` = 0 |
| S24 | 2026-08-05 | 紀錄 #36:「app log 0 條 FNFE ⇒ **77 檔覆蓋完整**,沒有漏網的元件」 | **實際到達瀏覽器的是 74/77,而且沒到的那一個是全樹最大的檔。** 第 4 層用標記探針量出來(逐檔插一條唯一規則、重抓彙整檔、再逐 byte 還原並以 sha256 確認),我獨立複驗了最關鍵的一項。**三個沒到的檔,三個不同原因,都不是本轉換的缺陷**:(1) **`zul/font/font-awesome.css.dsp` —— P6 的整個交付物,175588 B,佔全樹 28.3%**:彙整檔裡放的是 **ZK jar 那份(175617 B)**,不是我們的。實測 `agg.includes(theme fa)` = **false**、`agg.includes(jar fa)` = **true**,而我們那份直接要是 200 / 175588 B、log 裡 `Unable to load` **0 條** —— 也就是說它不是壞掉,是**根本沒被要求**。**根因已查到 jar 層**:`WcsExtendlet` 對 `zk.wcs` 的每個 `<stylesheet href>` 都會呼叫 `tp.beforeWidgetCSS`,而 `StandardThemeProvider.beforeWidgetCSS` 只對白名單前綴做主題改寫 —— **10.2.1 的 jar 裡白名單只有 `~./zul/css/` 與 `~./js/zul/` 兩個**(`unzip -p zul-10.2.1-jakarta-Eval.jar …/StandardThemeProvider.class | strings` 只吐這兩個),**`~./zul/font/` 是 10.4 才加上去的**(`zk/zul/src/.../StandardThemeProvider.java:82` 有三個前綴)⇒ **在本專案目前釘的 `zk.version` 上,主題自己的 font-awesome 永遠不會被服務**。兩份的差異純粹是序列化(`src:url(` vs `src: url(`),所以**畫面看不出差別**,但代價是 **P6 的產出從來沒有被視覺 A/B 驗過**。**修法**:把 `zk.version` 從 `10.2.1-jakarta-Eval` 升到 10.4.0 FL —— 那正好也是這個主題要對齊的版本。(2) `js/zkmax/inp/css/tbeditor.css.dsp` —— **舊路徑死複本**,ZK 10.2.1 把 tbeditor 放在 `js/zkmax/tbeditor/css/`,而那個兄弟檔**確實在彙整檔裡** ⇒ 與 **S18** 完全一致,再次獨立佐證了「舊路徑從來沒有人要」。(3) `zkmax/css/tablet.css.dsp` —— 有被 `<link>` 連,但帶 `disabled`(桌機 UA 下不啟用),是 P7 的檔,預期行為。**合計**:175808 + 15918 + 27638 = **219364 B / 620417 B = 35.4% 的位元組不參與畫面**,其中 font-awesome 一個就佔 28.3%。**對 harness 的意義**:視覺 A/B 的**覆蓋率上限是 74/77**,這件事必須在拿 A/B 去驗 P4 / P5 / P7 之前寫清楚,否則會把「沒有差異」誤讀成「這個檔沒問題」 —— 而 font-awesome 恰恰是**最不能這樣誤讀**的那一個(P6 已收工、G-zero 過了,但那是宣告層的證明,不是視覺層的) | 2026-08-05 第 4 層標記探針 + 我獨立複驗:`curl` 取主題與 jar 兩份 fa 做 `includes()` 對照、`strings` 讀 10.2.1 jar 的 `StandardThemeProvider.class`、對照 10.4 source 第 82 行 |
| S25 | 2026-08-05 | (新增,不是更正)升 `zk.version` 是 S24 的修法,隱含「升上去就好了」 | **升版達成了目的,但同時揭出一筆本來就存在、只是看不見的欠債:這個主題比它要對齊的 ZK 少了 8 個元件的 CSS。** 升到 10.4 之後 app log 出現 **8 條** `Unable to load ~./iceblue_css/…`(以及對應的 8 條 `Failed to load the resource`),逐一比對 jar 內容確認**全部都是 10.2.1 之後才加入的元件**(10.2.1 的 jar 裡不存在、10.4 的 jar 裡存在):`js/zul/wgt/css/` 的 **avatar、avatargroup、badge、breadcrumb、carousel、chip、confirmpopup**,以及 `js/zkmax/db/css/daterangebox`。**後果不是「少一點樣式」而是「完全沒有樣式」**:`beforeWidgetCSS` 把 `~./js/zul/wgt/css/badge.css.dsp` 改寫成 `~./iceblue_css/js/zul/wgt/css/badge.css.dsp`,該檔不存在 ⇒ include 失敗、記一條 log,而 **ZK 不會退回去用 jar 自己那一份**(`WcsExtendlet` 只有 `footerUri` 那一處做了 `getResource() != null` 檢查,元件 CSS 的兩個迴圈都沒有)⇒ 這 8 個元件在本主題下**一條 CSS 都沒有**。**這不是升版造成的迴歸,是升版讓它現形**:本主題的 LESS 是從 10.2.1 分出來的,而它的目標是 10.4 / ZK 11,所以這 8 個檔遲早都要補 —— 在 10.2.1 上只是因為那些元件還不存在,所以看不出來。**刻意不補**,理由是它會動到本專案最核心的不變量:補齊等於來源端 +8、輸出端 **77 → 85**,而 `baseline/` 只有 77 檔、閘門的 `files compared: 77` 是整套驗證的地基 ⇒ 這是 **G-delta 級的範圍變更,必須先決定,不能順手做**。**與 S24 的關係**:S24 說 A/B 覆蓋率的上限是 74/77,升版後是 **75/77**(未參與畫面的位元組 35.4% → **7.0%**),但那是「本主題有的 77 個檔裡有幾個被用到」;**S25 是另一個維度 —— 本主題該有幾個檔**。兩者都要記,否則會把「75/77 幾乎全覆蓋」誤讀成「這個主題在 10.4 上是完整的」 | 2026-08-05 `/usr/bin/grep -oE 'Unable to load ~\./iceblue_css/[^ ]+'` 取 8 條去重;逐檔 `unzip -l` 對 10.2.1 與 10.4 兩組 jar 各查一次(8 × 2 全部一致);`WcsExtendlet.java` 兩個元件迴圈確認無 fallback |
| S26 | 2026-08-05 | S25:「**刻意不補** …… 補齊等於輸出 **77 → 85**,這是 **G-delta 級的範圍變更,必須先決定,不能順手做**」 | **決定已下:補齊(user 裁示議題 A 選項 B),並指定來源為 `zk` / `zkcml` 的 LESS 原始檔。已收工,見紀錄 #40–#42。** S25 的判斷本身沒有被推翻 —— 它確實是 G-delta,所以走了決策;這一列記的是決策之後的結果與**一個必須寫下來的方法學性質**。**(1) 補齊是三層而不是「新增 8 個檔」**:8 個元件 LESS 引用 20 個 `@severity*` 變數,主題沒有 ⇒ 只做元件層**連編譯都不過**;而 `@severity*` 在 10.4 是純 `var(--zk-severity-*)` 直通(`_zkvariables.less:567-586`),真正的值在 `profiles/_default.less:543-562` ⇒ 只做「元件 + 直通」會編譯成功但 badge/chip 的顏色**解析為空**,那是把範圍悄悄縮小,不做。**(2) token 缺口是封閉的,而且恰好就是這一組**:ZK 10.4 定義 **862** 個 `--zk-*`、本主題 **842**,`diff` 三個 token 檔得到的唯一差異就是那 22 行(空行 + 註解 + 20 條),補完之後三個檔與 ZK 10.4 **逐 byte 相同** ⇒ ~~「本主題落後 10.4」這件事在 token 層**沒有第二處**。~~ **←這半句太強,見 S29** —— 我當時只 diff 了那 3 個檔就下了「沒有其他漂移」的結論,而 `diff -rq` 整個 `zul/less/` 還有 5 處差異,其中 1 處是真缺口。**(3) ⚠ 最重要的一條:匯入當下的閘門是「因構造成立」的,證明不了任何事。** 既有 77 檔的 G-zero 證明力來自「baseline 來自 master 的 LESS、候選來自轉換後的 CSS」**兩者不同源**;新匯入的 8 個檔在紀錄 #41 那一刻**仍是 LESS**,baseline 與候選出自**同一次編譯** ⇒ `files differing: 0` 是恆真句。真正的比較從紀錄 #42(轉成 CSS)才開始,而它 8/8 全 0。**這個性質已寫進 `baseline/.built-from`**(內容會被抄進 committed 的 manifest 註解),所以下一個讀者不會把 #41 誤讀成證據。**(4) 基準的身分變了,必須明說**:`baseline/` 自此不再是「master 在 `a89d44e0` 的輸出」,而是「該輸出 **+** 從 ZK 10.4 自身 LESS 編出的 8 檔 backfill + norm 的 20 條 token」。既有檔沒被動到是**量出來的**,不是宣稱的:#40 跨越更新得到 1 changed / 0 missing / 0 extra,#41 對 manifest hash 行逐行比得到 0 刪 / 8 增。**(5) 收工數字**:輸出 **77 → 85**、declaration **14323 → 14863**、來源端 **83 `.css` + 2 `.less`**、`build-css.js` 覆蓋 **83**、`zklessc` 剩 **2**;執行層驗收見紀錄 #42(8 個元件選擇器全部進到瀏覽器實收 CSS、20 個 token 被服務、`Unable to load` 歸零) | 2026-08-05 `git branch --show-current` 確認 `zk` / `zkcml` 都在 `10.4`;`diff -q` 逐檔確認匯入無 byte 差;`diff` 三個 token 檔對 ZK 10.4;`/usr/bin/grep -cE '^\s*--zk-'` 得 862 / 842;紀錄 #40–#42 的閘門與 manifest 量測 |
| S27 | 2026-08-05 | L1〈現況〉:「`build-css.js` 現在覆蓋 **75 檔** —— **正好是 P2 儀器預估的上限,builder 覆蓋率到頂**」 | **這個結論在檔集變大之後失效,不是被突破。** P2 的儀器是對「當時樹上有的 76 個 entry」做的預估,上限 75 在**那個檔集**裡成立;ZK 10.4 補齊帶進 8 個 P2 從未看過的檔,所以今天的 **83** 不是「超過上限」,而是分母本身變了。**真正的不變量是「holdout 只有 2 個」(`norm`/P5、`tablet`/P7),不是那個絕對數字。** 依規則不改 P2 的量測,只更新 L1 的結論並在原處標示 | 2026-08-05 `npm run check:cssdiff` 印出 `build-css: compiled 83 file(s)` + `success: compiled 2 file(s)`;來源端 `find` 得 83 `.css` / 2 `.less` |
| S28 | 2026-08-05 | (新增,不是更正)本輪原本想順手把 A/B 覆蓋率從 S24 的 75/77 重算到 85 檔 | **量出 81/85,但那個數字是量測假影,不是覆蓋率 —— 已作廢,不採用。** 探針取每個檔服務出來的**尾端 120 字元**去彙整檔裡找,4 個「沒找到」的是 `js/zul/grid/css/grid`、`js/zul/wnd/css/window`、`js/zul/inp/css/slider`、`js/zkmax/layout/css/scrollview` —— 而這四個顯然都是有樣式的檔。直接改用選擇器反查,`.z-grid` **41**、`.z-window` **31**、`.z-slider` **90**、`.z-scrollview` **28** 次命中 ⇒ **它們都在彙整檔裡,壞的是探針**(尾端切片對經過 DSP 求值與 `zk.wcs` 串接的內容不穩定)。**所以本輪不報覆蓋率數字**:S24 的 **75/77** 仍是最後一個「方法本身也被驗過」的數字,要重算到 85 檔就得用 S24 那個標記探針(逐檔插一條唯一規則、重抓彙整檔、再逐 byte 還原並以 sha256 確認),不能用尾端切片。**紀錄 #42 的驗收沒有依賴這個數字** —— 它用的是 8 個目標元件的選擇器直接命中(正面證據)加上 `Unable to load` 歸零 | 2026-08-05 兩種探針對照:尾端 120 字元 containment vs `grep -oE '\.z-<comp>'` 計數 |
| S29 | 2026-08-05 | S26:「補完之後三個檔與 ZK 10.4 逐 byte 相同 ⇒ **『本主題落後 10.4』這件事在 token 層沒有第二處**」 | **前半段成立,後半段太強 —— 而且推翻它的方法正是我當時沒做的那一步。** 我只 `diff` 了那 3 個 token 檔;改成 `diff -rq` 整個 `zul/less/` 目錄之後,共 **5 處**差異,其中 **1 處是真缺口**:`_zkcssvariables.less` 在 ZK 10.4 是**兩行** import,本主題只有一行 —— 缺 `@import "colors/_@{themePalette}_css";`,連帶 `colors/` 底下也沒有 `_iceblue_css.less`。**對現狀零影響,可證**:`@themePalette` 是 `"iceblue"`,而 ZK 的 `colors/_iceblue_css.less` 只有 **34 B / 2 行註解**(`// Just leave it blank.`,因為 iceblue 是預設 palette、沒有東西要覆蓋)⇒ 少這一行不改任何輸出,閘門與畫面都看不到。**但換 palette 就會靜默失效** —— 對照 `zkthemebuilder/palettes/_amber_css.less` 是 **1114 B 的 `:root { --zk-* }` 覆蓋**,在本主題的 chain 裡會被**無聲丟掉**;而 `readme.md:50` 正是教使用者設 `@themePalette` 的那一行 ⇒ **照 readme 換非 iceblue palette 的人拿不到 palette 的自訂屬性覆蓋**(與 S23 查 `_css` 命名時撿到的是同一組事實)。**另外 3 處差異都判定為 P6 的合法後果**:`footer.less` 只在 ZK(已轉成 `zul/css/footer.css`)、`zul/less/font/` 只在 ZK(FA 改由 `gen-fa-css.js` 產生)、`norm.less` 少一行 `@import "~./zul/less/font/_variables.less"` —— **實測惰性**:ZK 的 `norm.less` 沒用到任何 `@fa*`,唯一像 icon 的 `@iconColor` 在兩邊都定義在 `_zkvariables.less:72` 且內容相同。**順帶一個好消息**:兩邊 `norm.less` 只差那一行(**721 vs 722**)⇒ **norm 完全沒有落後 10.4**,P5 面對的是同一份內容。**最小修法**:補 import + 補 `colors/_iceblue_css.less`,兩者不改輸出但**必須成對**(單獨補 import 會找不到檔而建置失敗)。~~**本輪未修** —— 與被指定的 8 個元件無關,屬 palette 覆蓋機制,獨立決定~~ **←2026-08-05 裁示:歸入 P7,計畫書 §P7 已收錄為交付項 + 一條驗收條件(override sheet 必須表達得出 palette 覆蓋,且要有一次非 iceblue palette 的實測)。理由是 P7 會把 `@themePalette` 的編譯期插值整個換掉,現在補等於補一個即將消失的 import 路徑。** | 2026-08-05 自我複核(**不是第 4 層**,見 `doc/self-verify-zk104-backfill.md`):`diff -rq` 整個 `zul/less/`、`wc -c` 讀 `_iceblue_css.less`、`/usr/bin/grep -rn '^\s*@iconColor\s*:'` 兩棵樹、`wc -l` 對 `norm.less`。**2026-08-05 第 4 層獨立重驗:同樣 5 處差異、同樣 1 處真缺口,並延伸掃 `zkmax/less/` 與 3 組 `js/**/less/`,沒有第二個同性質缺口**(見 `doc/l4-verify-zk104-backfill.md` §4) |
| S30 | 2026-08-05 | 紀錄 #42 與 S28 引用的「選擇器命中次數」(`.z-avatar` 28、`.z-grid` 41 …),當時沒有記下**用哪一種比對法**量的 | **數字本身沒有錯,但沒有寫下口徑 ⇒ 別人重跑會對不上,看起來像量測錯誤。** 第 4 層獨立覆核用 `grep -oE '\.z-<comp>\b'`(**加詞界**)重跑,#42 那 8 個數字裡有 3 個對不上:avatar **8**(記的是 28)、breadcrumb **7**(13)、carousel **30**(36);改成**不加詞界**的子字串比對(`grep -oE '\.z-<comp>'`)則 8 個數字**逐一精確重現**。成因是這 3 個元件在同一份彙整 CSS 裡各有一個**複合字首的姊妹類別**(`.z-avatargroup` / `.z-breadcrumbitem` / `.z-carouselitem` —— 字尾緊接字母、沒有連字號,所以加詞界會排除、不加詞界會一起算進去)。**S28 的 4 個數字也只有 1 個重現**:scrollview **28** 相同,而 grid **41 → 39**、window **31 → 25**、slider **90 → 85** —— 除了詞界之外還有第二個未記的口徑(對彙整 `zk.wcs` 計數 vs 對個別 `.css.dsp` 計數;`grid.css.dsp` 有 zul / zkmax / zkex **三份同名檔**會疊加)。**兩組數字的結論都不受影響** —— #42 與 S28 要的都只是「非零」,而兩種算法下 8 + 4 個元件全部非零。**依規則不改動 #42 與 S28 的既有數字**;這一列補的是它們缺的那個口徑,以及往後的紀律:**寫「選擇器命中次數」必須同時寫比對法**(有無詞界、對彙整檔還是對個別 `.css.dsp`、同名檔是否疊加),否則數字不可重現 | 2026-08-05 第 4 層獨立驗證(`doc/l4-verify-zk104-backfill.md` 發現 2):兩種 `grep -oE` 口徑各跑一次對照 |
| S31 | 2026-08-05 | (新增,不是更正)artifact 版號在 `pom.xml` / `config.xml` / `lang-addon.xml` / `Version.java` **四處只需彼此一致**,而 `pom.xml` 的註解自己就寫「沒有機制偵測任一處漂移」 | **第 4 層把這句自陳升級成一條待辦。** 覆核實測四處字串逐字相同(`10.4.0-jakarta-Eval`)、且與 `zk.version`(`10.4.0-jakarta.FL.20260713-Eval`)確實無耦合 ⇒ **本輪沒有漂移**。但 `package.json` 沒有對應版號欄位、repo 也沒有 `check:version` 一類腳本 ⇒ **下一次升版漏改其中一處不會被任何東西擋下來**,而這個專案其他每一個不變量都有腳本守著(`check:baseline`、`check:bytes`、`check:css-dsp`…)。**非本輪造成,本輪不修**(它與 8 個元件、與棄用 LESS 都無關);建議照既有腳本的模式補一支輕量檢查,**排在 P8 收尾**(那一階本來就要更新 readme 與 migration guide,版號的一致性檢查與它同一類工作) | 2026-08-05 第 4 層獨立驗證(`doc/l4-verify-zk104-backfill.md` 發現 3):四處逐檔 `grep` + `pom.xml:6-10` 註解原文 |
| S32 | 2026-08-05 | (新增,不是更正)L2.4 對視覺 A/B harness 只寫了「**先拿同一個 build 截兩次確認 diff 為零**」,沒有寫「零」在像素層是**達不到**的 | **那個「零」需要一條實測出來的噪音下限,否則 harness 永遠 FAIL。** 收斂過程 **14/115 → 0/116**,六項發現全部由量測逼出、不是先猜的:**(1)** 固定 settle 不夠 —— 14 頁差異多為非同步版面沉降(`navbar` 高度差 3px、`iframe` 一輪載到一輪沒載到)⇒ 改成「**拍到穩定為止**」(連續兩張到噪音層內才收,最多 8 輪 × 250ms;收不到就**不寫 PNG、讓該頁失敗**,`diff` 報 `missing`)。**(2)** 改成穩定判定後**反而有 6 頁永遠不穩**,連續兩張差到 **2.7%** 畫面、maxΔ 255 —— 根因是 **`.z-progressmeter` 的背景是動畫 GIF**(`prgmeter-anim.gif`);GIF 不是 CSS 動畫,`animation:none` 與 Playwright 的 `animations:'disabled'` **都關不掉**。全主題共 **5 個**動畫 GIF(另 4 個 `progress{,-dark}-{32,72}.gif`),另 2 個 `.gif` 是靜態的 colorbox 圖示。用 `page.route().abort()` 攔掉這 5 個 ⇒ 版面與背景色不變,只少了會動的紋理;**連帶把 `loading` / `loadingbar` 從 SKIP 放回來**(它們原本就是因為這個才不穩)。**(3)** 剩 5–7 頁差 2–51px,永遠落在**圓角弧線**上、單一 channel ±1 —— 跨 browser **process** 的光柵化量化差異(同一 process 內穩定,這正是「拍到穩定」會收斂的原因)。`--disable-lcd-text` / `--disable-font-subpixel-positioning` / `--font-render-hinting=none` / `--force-color-profile=srgb` / `--deterministic-mode` **全部試過都消不掉**;`--deterministic-mode` 還讓載入變不穩(每輪隨機 4 頁拍不到)且慢 4 倍 ⇒ 只留前四個字體旗標。**(4)** `timepicker` 的 maxΔ 一路到 **7**,超過原本設的 ±1 —— 那是**飽和紅色**錯誤邊框對灰底的圓角混色,**量化誤差的幅度與兩色對比成正比**,不是固定 ±1 ⇒ 下限改成兩個都要成立:`maxDelta ≤ 8`(實測最大 7)且 `diffPixels ≤ 64`(實測最大 42)。**(5)** `avatar` 差 218px / maxΔ 49 落在一個 22×12 小框 —— `avatar.zul:36` **故意**指向不存在的圖來示範 label fallback ⇒ 加「等 `document.images` 全部 `complete`」(失敗也算 complete,這正是重點)。**(6)** `preview.zul` 一張 **11MB / 174404px 高 / 載入 20s**,列入 SKIP:上面每個元件都有自己的頁,它加成本不加覆蓋,且**裡面的差異無法定位**。**為什麼不用比例容差**:Marble 自己的截圖套件用 `maxDiffPixelRatio: 0.01`(1% ≈ 11500px),在這個用途上太鬆 —— 一條 1px border 畫在 200px 寬的元件上只有 ~200px ≈ 0.017%,**任何鬆到能吸收噪音的比例也鬆到能吸收真正的邊框改動**。**噪音頁一律照樣列印**:下限只決定 verdict,不決定覆核者看得到什麼 | 2026-08-05 建 harness 時逐輪實測(紀錄 **#44**;規格 `doc/visual-ab-harness.md` §5)。判別式在 `scripts/png-compare.js`,兩個上限都寫了它們的量測來源 |
| S33 | 2026-08-06 | S32 與紀錄 #44:反向控制「最小 370px ⇒ 對噪音上限有 **≈6 倍**餘裕」 | **餘裕存在,但不能推廣 —— button 圓角恰好是對下限最有利的個案**(常見元件 × 大面積改動),拿它證明「下限有牙齒」等於挑了最容易過的樣本。第 4 層用**七輪由大到小**的注入逼近下限,結論是**餘裕依元件出現頻率二分**:對**常見**元件(button)幾乎沒有上限 —— 連 `border-color:rgba(0,0,0,0.004)`(人眼分辨不出)都在 **39/116** 頁被抓到、最小 424px;對**稀有/小面積**元件(checkbox-switch 縮圖陰影,只出現在 4 頁、各 1–4 個實例)餘裕**在兩輪之間就耗盡**:alpha `0.16→0.17` 在 `usecase/index` 只有 93px 但**抓到**,`0.16→0.165` 掉到 44px / 52px ⇒ **被歸類為 noise、真漏接**。那是**靜態、會實際畫在畫面上**的改動,不是 hover 那種已揭露的狀態閘門(第 7 輪 hover 注入確認 0/116,屬**已知且刻意**的漏報)。**判定:`8 / 64` 不是統一的「太鬆」或「剛好」,而是對低頻元件太鬆。** 所以 harness 的「0 差異」**只有在改動落在高頻元件時**才是強證據;P4 / P5 / P7 若動到只出現 1–2 個實例的元件,**不能單獨拿它收工**,要另外人工核對、或補一頁多實例的測試頁。**兩個附帶盲區**(同一輪查出,都非本輪造成):**(a) 結構性盲區** —— `camera` / `barcodescanner` / `video` 三頁是整個語料裡**唯一**會渲染 `camera.css.dsp` / `barcodescanner.css.dsp` / `video.css.dsp` 選擇器的頁面,而三頁都因硬體 / 解碼時序被 SKIP ⇒ **這三個輸出檔的視覺改動對本 harness 在結構上不可見**;S32 的「SKIP 沒有一條在遮蔽會差異的頁」要改成「**有三條在遮蔽,只是理由本身無法迴避**」。**(b)** 守門探針的第二判準(HTML 裡 `marble` 出現 0 次)在實測的洩漏情境裡**從未真正觸發** —— `MarbleThemeProvider` 不會把字面 "marble" 寫進頁面,真正擋下來的一直是第一判準(`_zkiju-iceblue_css` 缺席)⇒ 第二判準目前是裝飾性的,不是第二道防線 | 2026-08-06 第 4 層獨立驗證(`doc/l4-verify-visual-ab.md` §3 七輪注入表、§4 發現 2/3/4)。C4 的洩漏實測另給一個有用的數字:把 Marble `target/classes` 加進 classpath 後,彙整 `zk.wcs` 從 551518 → **375313** bytes(**−176205**),與 `font-awesome.css.dsp` 本身 175808 bytes 幾乎精確對上,`.z-icon-solid` 命中 **1 → 0** |
| S34 | 2026-08-06 | 紀錄 **#28**:「CRLF 來源會不會把 `\r` 漏進轉換後的 `.css`」→「**量過:不會(0 個)…… 不需要改腳本**」 | **量測沒錯,結論錯了 —— 而且錯在把「`\r` 沒出現在輸出」當成「沒有損害」。** `\r` 確實 0 個,因為 LESS 的 renderer 會正規化行尾;**但那個正規化就是損害本身** —— 被收進註解內容的 `\r` 變成 `\n`,於是 `// x` 產出的是**跨兩行的 `/* x\n */`**,`*/` 獨自落在第二行。#28 的探針只數了 `\r`,沒有看**形狀**,所以它問的問題(有沒有 `\r`)與該問的問題(註解有沒有被拆行)不是同一個。同一份文件裡其實已經有反證:紀錄 #32 手修掉的 **14 個斷行註解**明文標成「CRLF 來源的殘留」,亦即當時已經看見損害、卻沒有回頭推翻 #28 的「不需要改腳本」。**#28 的另一半仍然成立**:P3 期間確實不急著改,因為步 1 只吃 entry 檔而當時唯一的 CRLF entry 已轉完 ⇒ **它是「時機對、理由錯」**。已於紀錄 **#46** 修掉工具本身(掃到第一個行終止符),S16 到此結案。**留給下一個讀者的判準**:一個「量過,沒事」的結論,要能說出**量的量與怕的事是同一件**;`\r` 的個數與註解的行數不是同一件事 | 2026-08-06 紀錄 #46 的端對端實測(斷行註解 13 → 0、空白摺疊後兩份輸出相同);#28 與 #32 原文比對 |
| S35 | 2026-08-06 | 計畫書 §P5:「`browserDefault` 從 descendant selector 改成 **`@scope`**」,閘門因此定為 **G-delta** | **`@scope` 做不到那件事,而且不做才對。** 輸出端實測有**兩種**形狀:**90** 個 selector 前綴(`@scope` 表達得出來)+ **3 對整塊 `<c:if test="${empty …}">`**(**表達不出來**)。embed 模式下 `html` / `body` / `main` 不是要被 scope,是**必須不存在** —— CSS 沒有「不存在」這個運算子,**只有伺服器端條件式能刪掉一條規則**。所以 `@scope` **不會讓 DSP 消失**,卻會:把閘門從 G-zero 拉成 G-delta、要求 `browserDefault` 開/關兩組 computed-style A/B、並額外背上一個**未拍板的 L-2 相依**(`@scope` 需 Chrome/Edge 118+、Safari 17.4+、Firefox 128+)—— 而**這個相依從來沒有被寫進 §P5〈前置〉**,〈前置〉當時寫的是「兩項都已解除,P5 可開工」。**真正的障礙不是 DSP,是壓縮器**:CleanCSS 把 `${".z-page "}` 靜默改寫成 `${}".z-page "`(errors 0、warnings 0)。改用 `HOSTILE_CONSTRUCTS` 那條守衛**自己開的處方**(來源寫佔位符、minify 後還原),P5 收在 **G-zero**。**留給下一個讀者的判準**:一個「改用某個新 CSS 特性」的計畫條目,要先數清楚**它要取代的東西有幾種形狀**;90 和 3 不是同一件事 | 量測於 `baseline/zul/css/norm.css.dsp`(前綴 90、整塊 3 對、DSP tag 起始 186);決策 [browserdefault-masking.md](browserdefault-masking.md);選項評估 `tasks/p5-browserdefault-options.md` |
| S36 | 2026-08-06 | (新增,不是更正)compact profile 的切換方式 | **P5 把一個對外的 build 期旋鈕搬了位置,而且暫時變成兩個。** 舊做法是改 `_zkvariables.less` 的 `@themeProfile`(`readme.md` 明文教的),LESS 用 `@import "profiles/_@{themeProfile}"` 在編譯期選檔。純 CSS 沒有 import path 插值,所以 `norm.css` 直接 `@import "tokens/_default.css"`,換 profile = 改那一行。**但 `zkmax/less/tablet.less` 仍是 LESS,仍走 `@themeProfile`** ⇒ **在 P7 之前,compact build 必須同時設兩處**,只設 `@themeProfile` 的使用者會拿到「桌機 default + 平板 compact」的不一致主題,而且**閘門看不到**(閘門只建 default)。`readme.md` 已改成教兩處。**已拍板(2026-08-06,選項 A):接受到 P7 為止,不另外寫建置期檢查** —— 為一個 P7 即將刪掉的機制寫檢查不划算;P7 用 runtime override sheet 取代兩個旋鈕時連 `readme.md` 的兩處寫法一起收掉。已寫進計畫書 §P7。**第 4 層已把這一項從推理升級為實測**:只設 `@themeProfile` 時 `norm.css.dsp` 與 default 建置**逐 byte 相同**(仍是 16px)、`tablet.css.dsp` 卻真的切換了 ⇒ 分裂主題確實會發生,且**沒有任何檢查看得到** | `readme.md` 的 compact 章節;`src/main/resources/web/zul/css/norm.css` 檔頭 |
| S37 | 2026-08-06 | (新增,不是更正)`doc/migration/less-var-to-token.{md,json}` 裡的來源路徑 | **產生出來的遷移文件現在指向已刪除的路徑**(`zul/less/profiles/_default.less`、`_zkcssvariables.less`、`norm.less`)。**不能靠重跑產生器解決** —— `gen-var-table.js --check` 因為 **S14**(ZK 10.4 補齊帶進 +20 個 token,`EXPECTED` 沒跟上;且 liveness 只掃 `.less` 樹)本來就 exit 1,重新產生會把 S14 的漂移一起烘進文件。**是舊帳,但「逐項相同」是講過頭了 —— 12 條裡 10 條相同,**2 條**因 P5 而移動**:`rows whose LESS name is never referenced` **773 → 837**、`rows dead on both sides` **698 → 837**。根因是 `gen-var-table.js` 的 liveness **只掃 `.less` 樹**(`scanReferences(lessFiles, …)`),所以每刪一個 `.less` 就有更多變數名字失去最後一個 `.less` 引用點 —— 這是**每一次 P3 轉換都在發生的同一件事**,會一路惡化到 P8 收斂成「全部都死」,不是 P5 特有的。**原本我寫「逐項相同」是拿自己改過的腳本去跑舊樹**(只換了來源不換腳本),第 4 層用**舊腳本 + 舊樹**的真正 pre-P5 狀態重跑才逼出這 2 條(見 `doc/l4-verify-p5-norm.md` 發現 3)。P5 本身只修了輸入路徑(profiles 改從 `<pkg>/css/tokens/` 讀,否則會量到 **0** 個宣告而不是 862)。**已拍板(2026-08-06,選項 A):留到 P8 一次處理** —— P8 之後 `.less` 歸零,liveness 收斂成「全部都死」正是正確答案,屆時重定 `EXPECTED` + 重跑產生器 + 更新路徑是一次到位的;現在重跑只會把 S14 的漂移烘進文件。已寫進計畫書 §P8〈順手要收的既有欠帳〉 | `git show 5958d1b:scripts/gen-var-table.js` + `5958d1b` 來源快照 vs 現況,兩份失敗清單比對(10 / 12 相同) |
| S38 | 2026-08-07 | S24 的「A/B 覆蓋率 **74/77**」與紀錄 #38 的「**75/77**」 | **高報了 3 個;同期的正確值是 71/77 與 72/77。而且這件事本來就可以在文件內部被抓到 —— S18 與 S24 從 2026-08-05 起就一直互相矛盾,沒有人對過。** S18(以及 L2.5 第 2 項)說的是**宣告層**:`lang-addon.xml` 裡每個 `css-uri` 只有一個 `widget-package` 會要,**4 個舊路徑輸出從來沒有人要**。S24 說的是**位元組層**:沒到瀏覽器的是 3 個(font-awesome、tbeditor 舊路徑、tablet)。**「4 個沒人要」與「只有 1 個舊路徑沒到」不可能同時成立**,而兩句話一直並存。2026-08-07 的標記探針裁決給 **S18**:4 個舊路徑**全部** `MISS`,並用 `unzip -p zkmax-10.4.0-….jar metainfo/zk/lang-addon.xml` 的 `<widget-package>` 宣告獨立印證。**這 4 個檔與它們的宣告在 2026-08-05 之後沒有變動過**(ZK 10.4 補齊加的是 8 個**新**元件,P5 只動 `norm`)⇒ 當時的真值就是 74−3 = **71/77**、75−3 = **72/77**。**為什麼 S24 沒抓到,已無法從紀錄重建** —— 它自述是「逐檔加一條唯一規則」,若真的逐檔唯一就不該漏;最合理的候選是 goldenlayout / cropper / signature 三對輸出**逐 byte 相同**(15864=15864、4980=4980、2605=2605),任何退回內容比對的環節都會把命中同時算給兩份。**這一列不改 S24 與 #38 的既有數字**(附加式紀律),補的是「它們高報 3 個」與「往後量覆蓋率必須用逐檔唯一標記,不能用內容比對」。現行值見紀錄 **#51**:**80/85** | 2026-08-07 `npm run visual:coverage`(三個控制組全過,含負向 `--holdout`)+ `unzip -p` 讀 jar 內 `lang-addon.xml`,兩種獨立方法同一答案 |
| S39 | 2026-08-07 | 計畫書 §P4〈A 類也不能直接移除〉的「**合計 26 條**」無前綴同伴 —— 讀起來像是**全樹**的無同伴總數 | **全樹無同伴實際是 33 條。** 26 是 `user-select`(8)+ `appearance`(18)**這兩個屬性的小計**,原文只盤了這兩個;另有 `-ms-zoom` 3、`-ms-touch-action` 2、`-ms-flex-align` 1、`-webkit-text-size-adjust` 1 同樣無同伴。差別會影響 P4b 清單的完整性:漏掉的 7 條若照 A 群規則純移除,`-ms-touch-action` / `-ms-flex-align` 會**刪掉沒有東西接手的功能**(`-ms-zoom` 是例外 —— `zoom:1` 是 IE hasLayout hack,純移除才對)。**L-2 拍板選 C 之後,落在 P4b 範圍內的只有 15 條**(non-`-webkit-` 那一半)。**原文的 26 不是算錯,是口徑窄** —— 依附加式紀律不改寫既有敘述。**同一次量測把計畫書其餘 P4 數字全部重現**:前綴 **1132**、carve-out **44**、A 群 **945**(且「無同伴 0 條」成立)、C 群 **143**、declaration **14863** ⇒ 交叉確認 P0 的稽核無誤 | 2026-08-07 L-2 拍板前的分解量測(scratchpad `prefix-inventory.js`,直接 `require` `scripts/cssdiff.js` 的 `parse()` / `extractDsp()`,口徑與閘門的 14863 條相同);利弊分析 `tasks/l2-browser-support-analysis.md` |
| S40 | 2026-08-07 | L1〈總體進度〉的「輸出檔脫離 LESS **83 / 85 = 98%**」 | **實際是 84 / 85 = 99%,是 P5 收工時漏改的一格。** 同一份 L1 的〈現況〉內文早已寫「`build-css.js` 現在覆蓋 **84** 檔,`zklessc` 只剩 **1** 檔」,計畫書 L1 也早已是 84 / 85 ⇒ **這一格與自己上面三行互相矛盾**。實測來源樹:`*.css` entry(排除 `_` partial)**84**、非 partial `*.less` **1**(`zkmax/less/tablet.less`)。不影響任何結論或閘門,只是進度百分比 | 2026-08-07 `find src/main/resources/web -name '*.css' ! -name '_*'` 與 `-name '*.less'` 逐檔清點 |
| S41 | 2026-08-07 | (新增,不是更正)「閘門綠燈 = `npm run check:cssdiff` exit 0」這個一直以來的通過訊號 | **P4a 之後不再成立,而且是結構必然。** `cssdiff`、`check:bytes`、`check:build-css` 三支都在問同一個問題:「candidate 是不是**等於** `baseline/`?」而 G-delta 階段的正確答案就是「不等於」。實測 P4a 之後:`cssdiff` **45 檔 / 728 條差異**(exit 1)、`check:bytes` **FAIL — 45 file(s) need a human**、`check:build-css` **FAIL — build-css.js does NOT reproduce baseline/**。**三支報的都是同一組 45 個檔,數字彼此對得上,所以它們沒有壞** —— 是「有沒有差異」這個問題本身過期了。P4a 起的判準改為 `npm run check:p4a` exit 0(見紀錄 **#52**),它問的是**正確的下一個問題**:「差異是不是**恰好等於**已核准的 delta?」**未處理的部分**:`check:bytes`(第 2 層,位元組)與 `check:build-css`(第 1 層,builder 忠實度)目前**沒有** delta-aware 版本,所以它們會一路紅到有人處理。**不建議**放著紅燈不管 —— 這個專案其他每個不變量都有腳本守著,而長期紅燈等於把兩層複核靜音。**修法有現成的思路**:那 728 條移除是 `baseline/` 的**純函數**(「屬性帶可移除前綴、且同一 rule 有無前綴同伴」),所以兩支都可以在比對前先對 baseline 套同一條規則,不需要 manifest、不需要快照、也不必動 `baseline/`。**本輪不做,列為待決策** | 2026-08-07 P4a 收工後逐支重跑三個 checker(`check:cssdiff` / `check:bytes` / `check:build-css`),三組檔數互相對照 |
| S42 | 2026-08-07 | `-webkit-` 條數在相鄰文件裡一邊寫 **285**、一邊寫 **313**,兩處都沒標分母 | **兩個數字在各自口徑下都對,不是誰算錯。** 全樹 `-webkit-` 宣告 **313** 條;其中 **28** 條屬於 B 群 carve-out(`font-smoothing` 16 + `touch-callout` 6 + `tap-highlight-color` 4 + `user-drag` 1 + `user-modify` 1)⇒ **313 − 28 = 285** 是「真前綴」。**往後引用一律標分母**:講「L-2 選項 C 保留多少真前綴」用 **285**;講「`check:p4a` 兩側相等的那個不變量」用 **313**(該斷言故意含 carve-out,因為 carve-out 本來就不該動)。已在計畫書 §P4b 與紀錄 #52 標明各自口徑 | 2026-08-07 第 4 層獨立驗證(`doc/l4-verify-p4a.md` 衝突 A):自寫 parser 全樹統計 `^-webkit-`,並逐屬性列出 carve-out 的 28 條 |
| S43 | 2026-08-07 | 計畫書附錄同一節內,前綴宣告總數一處寫 **1127**、另一處寫 **1132** | **1132 是對的;1127 的那一處只列舉了 `-webkit-` 313 + `-moz-` 283 + `-ms-` 281 + `-o-` 250,漏掉 `-khtml-` 5 條。** 實測 baseline 為 **1132**。**既有不一致,非 P4a 引入**,也不觸及任何閘門 —— P4a 的上限來自 A/C 群分解(788 / 728),不是這個總數。依附加式紀律不改寫舊列 | 2026-08-07 第 4 層獨立驗證(`doc/l4-verify-p4a.md` 衝突 B):自寫 parser 對 `baseline/` 逐前綴清點 |
| S44 | 2026-08-07 | **S41 的結案**(S41 曾寫「本輪不做,列為待決策」) | **裁示為選項 A,同日做完。** 兩支複核改 delta-aware,比對目標從 `baseline/` 換成「`baseline/` + 重新推導出的 P4a delta」。**S41 當時只是「有現成思路」,這一輪把它量出來了**:來源端(逐行改 `.css`)與輸出端(讀壓縮後 `.css.dsp`)兩套獨立實作,對 728 / 45 與 14 項屬性直方圖**逐項相同** —— 這是 P4a 迄今**最強**的一條佐證,因為它是 byte 層級的,比 `cssdiff` 的宣告層級更嚴。**三支複核同時 exit 0**,第 1、2 層恢復守衛,P4b 與 P7 的兩段後續 delta 有東西擋著了。**S41 那一列不改寫**(附加式紀律),以本列結案 | 2026-08-07 實作 `scripts/p4a-delta.js` 後逐支重跑 `check:bytes` / `check:build-css` / `check:p4a` / `check:cssdiff`,並跑三個負向控制(未核准的移除、已移除的復活、推導規則被放寬) |
| S45 | 2026-08-07 | 計畫書 §「四層人工複核」規定第 4 層的唯讀證明是 **`git status --porcelain`**(自 P3 起每一輪委託書都照抄) | **這個證明對最重要的那個不變量結構上失明。** `baseline/` 被 `.gitignore` 忽略(`.gitignore:13`,理由是「可重建、不進版控就不會靜默漂移」),所以**不管基準有沒有被寫,`git status` 都是綠的**。歷來每一輪的唯讀證明都帶著這個盲點,覆核者只能各自臨時想辦法補(本輪用 mtime + 程式碼路徑分析)。**修法是現成的**:`npm run check:baseline`(`scripts/baseline-ab.js check`)逐檔比對 sha256,那才是在問這件事。**已改計畫書**:第 4 層那一列的唯讀證明改為 `git status --porcelain` **加** `npm run check:baseline`,並附註原因。實測本輪 `check:baseline` exit 0。**不改寫既有的唯讀性證明段落**(附加式紀律)—— 它們當時的結論仍成立,只是證據強度比字面上弱 | 2026-08-07 第 4 層獨立驗證(發現 F1):覆核者發現無法用指定的方式證明 `baseline/` 未被寫,改查 `.gitignore` 與 mtime |
| S46 | 2026-08-07 | commit `c88dc90` 與 `p4a-delta.js` 原 docstring 寫「728 由不同程式、不同輸入**到達**兩次」 | **講得太強,精確的說法是:728 這個常數被「斷言」兩次,不是被「導出」兩次。** 獨立的是它所比對的**兩個計數**(一個從 `baseline/` 重新推導,一個數 built tree 的 `cssdiff` 記錄);常數本身兩處都是硬編碼。所以這一對的作用是**防止規則被悄悄放寬的絆線**(第三個負向控制證明絆線有效:把 `-webkit-` 加進 `STRIP_PREFIX` → 推導變成 975/47 並失敗),而**不是**第二次獨立普查。真正的獨立普查來自第 4 層自己寫的第三套實作與來源端 `git diff --numstat`,兩者都得到 728/45。**是否影響最終結論:否** —— 真正承載效力的「兩套獨立推導實作」(C10)經五點論證確認成立。docstring **同日改寫**為精確版本 | 2026-08-07 第 4 層獨立驗證(發現 F3):逐字比對兩支腳本的常數宣告 |
| S47 | 2026-08-10 | `.gitignore` 的 `baseline/` 那一列:「**Rebuildable with `npm run baseline` —— never committed, so it cannot drift silently**」 | **決策反轉:`baseline/` 改為追蹤(暫時性,P8 收尾時移掉)。** 原本的理由在 S45 之後站不住 —— 不進版控的直接後果是 `git status` **看不見它**,而那正是第 4 層每一輪被要求拿來證明「我沒動基準」的指令。等於全案最重要的不變量,一直由一支**結構上不可能變紅**的檢查在回報。`doc/baseline-manifest.sha256` 釘得住位元組,但沒有任何東西讓一次**寫入**一眼可見。改為追蹤之後,任何寫入立刻出現在 `git status` / `git diff`,`npm run baseline` 也會產生工作樹差異而不是靜悄悄 —— **那正是要的效果**。**代價**:86 檔 / 832 KB 建置產物進歷史(`.css.dsp` 是壓縮的單行檔,86 檔只佔 137 行)。**入版前驗過三件事**:`npm run check:baseline` **86/86** 對得上 manifest;86 個 staged blob 與工作樹檔案逐一 sha256 比對 **0 不符**;`.gitattributes` 只對 `*.sh` 設 `eol=lf`,不會動到 `.css.dsp` 的位元組。**P8 待辦:把它移回 ignore**,理由與退場條件寫在 `.gitignore` 該段註解裡 | 2026-08-10 使用者裁示;入版前跑 `check:baseline` 與 `git cat-file -p :<path>` 對 86 檔逐檔 sha256 |
| S48 | 2026-08-10 | 全份文件裡「閘門指令 = `npm run check:cssdiff`,exit 0 才算過」 | **P4a 之後儀器與判準分家,閘門指令改為 `npm run check:gate`。** `check:cssdiff` 問「candidate 是否**等於** baseline」,而 G-delta 的正確答案是「不等於」⇒ 它**因構造 exit 1**(45 檔 / 728 條),那個紅燈**是對的**。但它同時是全份文件到處引用的那句「閘門指令」,於是 S41 想根治的病(長期紅燈被當成已知壞掉)換一支腳本原樣復發 —— 由第 4 層在 2026-08-07 指出(`doc/l4-verify-s41-delta-aware.md` §2.4),2026-08-10 裁示選項 A。**新指令** `check:gate` = `check:less-conventions` + `check:fa-css` + `build:tree` + `check:p4a`,實測 **exit 0**;`check:cssdiff` 保留為**儀器**(重構成共用 `build:tree`,行為未變 —— 重構後實測仍是 45 / 728 / exit 1)。**為什麼不讓 cssdiff 自己收斂**:P8 的 G-zero 核帳要把 P4 + P5 + P7 的 delta 加總對帳,那時需要的是**未經判斷的原始差異**,把判準塞進儀器就取不到了。**第 1、2 層刻意不放進 `check:gate`** —— 它們是複核不是閘門,且 `check:build-css` 要重編整棵 LESS 樹。**歷史紀錄不改寫**(附加式紀律):既有 L4 報告與閘門紀錄裡的 `check:cssdiff` 指的都是當時實際跑的那一支 | 2026-08-10 新增 `check:gate` 後兩支各跑一次:`check:gate` exit 0、`check:cssdiff` 45 / 728 / exit 1(與重構前逐字相同) |
| S49 | 2026-08-10 | `check:gate`(S48 剛落地時)= `check:less-conventions` + `check:fa-css` + `build:tree` + `check:p4a` —— **沒有驗基準本身** | **加上 `check:baseline`,而且排第一。** 閘門說的每一句話都是「相對於 `baseline/`」,基準若被污染,後面四步全部失去意義而且不一定會叫;`check:cssdiff` 從來也沒驗過這件事,所以這是**補一個一直都在的洞**,不是 S48 引入的。排最前面是為了在**編譯之前**就停,錯誤訊息直接指向真正的原因。**負向控制**:對 `baseline/js/zkex/menu/css/fisheye.css.dsp` 追加 5 個 byte → `check:gate` 在**第一步** exit 1(`CHANGED baseline/js/zkex/menu/css/fisheye.css.dsp` / `0 missing, 1 changed, 0 extra`),**完全沒有走到 `build:tree`**。**順帶收到 S47 的第一份紅利**:同一個突變在 `git status --porcelain baseline/` 也直接現形(`M baseline/js/zkex/menu/css/fisheye.css.dsp`)—— 這正是 S45 當初做不到的事。還原用 scratchpad 副本(**不是** `git checkout`),還原後三條路徑各自驗過:sha256 與突變前逐字相同、`git status baseline/` 空、`check:baseline` **86/86**。成本 < 1 秒 | 2026-08-10 使用者裁示;`check:gate` 正常路徑與負向控制各跑一次 |
| S50 | 2026-08-10 | P4b 開工時,`check:p4a` 的左側是**原始** `baseline/`。P4b 一落地,那六項斷言會全部誤報 —— 第 1 項(「只准移除」)會被 P4b 的 7 條成對新增直接打爆 | **不放寬任何斷言,改成兩支閘門互相抵銷對方的 delta**:`check:p4a` 的左側改為 `baseline + P4b`、`check:p4b` 的左側為 `baseline + P4a`。各自看到的樹就跟對方那一階從未發生過一樣,所以 **P4a 六項斷言逐字保持 2026-08-07 通過時的強度**,而整份 diff 剛好被兩支認領完、沒有灰色地帶。放寬斷言的那條路會**悄悄**讓 P4a 失去保證,而且不會有任何紅燈提醒。兩者順序可交換不是用講的,是 `p4b-delta.js` 逐檔**實測斷言**(`applyP4b(applyP4a(x)) === applyP4a(applyP4b(x))`)—— 因為三處用了三種不同順序(兩支 shape 閘門各一種、byte 層第三種),不可交換的話三者會對同一棵樹有不同看法而只有一個是對的。連帶把 block 走訪抽成共用的 `eachBlock()`:P4a 的母體與 P4b 的母體是**彼此的補集**,若兩階對「block 到哪裡為止」看法不同,同一條宣告可能同時落入兩邊或兩邊都不落入 | 2026-08-10 重構後 `p4a:delta` 立刻重現 728 / 45 與 14 項直方圖;`check:p4a` / `check:p4b` / `check:bytes` / `check:build-css` / `check:gate` 全部 exit 0;負向控制 (b) 證明兩支會從相反端各自抓到同一個錯誤 |
| S51 | 2026-08-10 | P4a/P4b 的普查是按「**屬性**帶不帶前綴」做的,所以有三類殘留它**結構上看不到**,容易被誤讀成「前綴已經清乾淨了」 | **據實記錄,本階明確不動**(動它們會讓 diff 超出已核准的 14 條,違反 G-delta):① 無前綴的 `zoom: 1` **22 條** —— 同樣是死掉的 IE hasLayout hack,只是沒有前綴,`-ms-zoom` 那三條其實是同一家族裡**唯一**被 mixin 加了前綴的;② 前綴在**值**上的 `display: -ms-flexbox` / `-webkit-box` / `-moz-box` / `-ms-inline-flexbox` 合計 **13 條**;③ 前綴 **pseudo selector** 約 **79 處**(`::-moz-placeholder`、`:-ms-input-placeholder`、`::-ms-check`、`::-moz-focus-inner` …)。第 ③ 類與 #55 已記載的「前綴選擇器與前綴屬性沒有被混為一談」是同一件事的另一面。列為後續議題 | 2026-08-10 自 `baseline/` 實測計數 |
| S52 | 2026-08-10 | P4b 決策書裡有兩處**理由寫得比證據強**、一處**史實錯誤**、一處**漏記的結構變化**(第 4 層覆核指出,四項都不影響任何一條決策的結論) | **四項全部改進 `tasks/p4b-decisions.md`,原文以刪除線保留**:(1) `.z-focus-a` 原本用「1px + `font-size:0` 所以不可觀察」當理由 —— **不成立**,`overflow:hidden` 裁的是**繪製**不是**選取**,帶文字節點的 1px 元素照樣能被拖選複製。真正成立的理由是 ZK 各 mold 產出的 `.z-focus-a` 是**沒有文字節點的空 `<div>`**,加上 `user-select: auto` 本來就計算成 `text`。**結論不變,理由換掉** —— 否則將來有人拿它當先例套到**有文字**的元素上;(2) 漏記:`tablet.css.dsp` 的 `${".z-page "}*{-webkit-user-select:none}` 特異性 (0,1,0),改動前 webkit 看不到 `.z-focus-a` 的 `-moz-`/`-khtml-` 宣告故**沒有競爭**,改動後 `user-select: text` 與它**打平**,勝負取決於樣式表順序 —— 因 (1) 實際不可觀察,但這是真的結構變化,**P7 處理 tablet 時會再遇到**;(3) `-ms-flex-align` 拿掉後同 block 仍留 `display: -ms-flexbox`,是**半套 IE10 fallback**,應與 S51 第 ② 類一起收而不是分兩次;(4) 「連 IE 都不吃 `-ms-zoom`」**是錯的** —— Microsoft 在 IE8 standards mode 確實出過它。判準問的是「**今天**的現代瀏覽器會不會變」,答案仍是不會,**決策不動** | 2026-08-10 第 4 層獨立驗證(紀錄 #57),報告 `doc/l4-verify-p4b.md` |
| S53 | 2026-08-10 | P4b 唯一有爭議的一條(`-ms-touch-action` ×2)雖已按判準選了純移除,但「cropper 該不該設 `touch-action`」本身仍懸著,未裁示 | **裁示選項 A:維持純移除,P4b 不動;該問題另開議題,交由 cropper 元件負責人判斷。** 理由是它是**元件行為問題**,不是主題轉換問題 —— `-ms-touch-action` 只有 IE10 吃,所以 `.z-cropper-holder` **今天在任何現代瀏覽器上根本沒套用 touch-action**;純移除行為不變,補 `touch-action: none` 則是**在觸控裝置上新增行為**。把後者塞進一顆「移除 LESS 前綴」的 commit,將來 bisect 的人找不到行為變更的出處。**這條隨時可逆且很便宜**:兩個 `cropper.css` 各加一行,本階 table 的 #4/#5 由 `remove` 改成 `rename → touch-action`,閘門數字變成 14 移除 / **9** 新增 —— 但那要走**它自己的 G-delta 核准**,不要回頭改這一階的帳。**尚未對 ZK 產品端開單**(對外動作,需另行確認) | 2026-08-10 使用者裁示 |
| S54 | 2026-08-12 | **主題改名(第二次):`iceblue_css` → `iceblue11`**。本表以上、以及所有 `doc/l4-verify-*.md`、`doc/self-verify-*.md`、`tasks/l4-*-brief.md` 與閘門紀錄 #35–#57 裡寫的 `iceblue_css`、`_zkiju-iceblue_css`、`target/classes/web/iceblue_css`、`IceblueCssThemeWebAppInit`,**在 2026-08-12 之後一律對應 `iceblue11` / `_zkiju-iceblue11` / `target/classes/web/iceblue11` / `Iceblue11ThemeWebAppInit`**。歷史敘述**刻意不改字** —— 那些是當時實際跑出來的紀錄,改字等於改寫「當時發生了什麼」 | **改名(user 決定),顯示名同步改為 `Iceblue 11`。** 通過 S23 記下的四條硬限制:非 `DEFAULT_NAME`、無連字號、非數字開頭、display 一併改。**時點是關鍵**:`org/zkoss/theme/iceblue_css/` 在 `maven2` 與 `eval` 皆 **404**,主題名的四個外洩面(`org.zkoss.theme.preferred` / `zktheme`、其他 addon 的 `<depends>`、瀏覽器實抓的 `_zkiju-<name>/…` URL、jar 檔名)都還沒有下游 ⇒ 現在改是零破壞,發行後改則是 breaking change。**順帶消掉 S23 記下的語意歧義**:`iceblue_css` 同時是 ZK core 已出貨的 palette 名(`zul/less/colors/_iceblue_css.less`,自 10.3.0.1 起打包進 `zul` jar),而 `readme.md` 正是教使用者設 `@themePalette` 的地方;`iceblue11` 與 palette 命名空間不再相撞。**注意 `_iceblue_css.less` 屬於 ZK core,不在改名範圍內** —— 執行時是逐檔判讀而非整批取代,正是為了不誤傷它(`doc/iceblue-drop-less-execution-plan.md:491,493`、`doc/self-verify-zk104-backfill.md:49,51,60`、本進度文件 L2 的兩處保持原字)。**S23 記的技術債仍在,而且正在長大**:輸出路徑硬寫在 **12 個站點**(7 支 script 各一個常數 + `package.json` 5 條 npm script;字面 15 次,另含 workflow mjs 的 3 處敘述),S23 當時記的是「8 個地方 / 9 次」—— 多出來的是 P4 之後才誕生的 `ab-visual.js`、`check-p4a-delta.js`、`check-p4b-delta.js`。這次同樣**刻意不重構**,只做改名(`scripts/baseline-ab.js:311` 已是從 pom 動態讀 `artifactId` 的寫法,可作為日後收債的範本) | 2026-08-12 `curl` 兩個 repo 皆 404;`git show fa7a51e4`(前次改名);紀錄 **#58**;評估文件 `tasks/theme-rename-iceblue11.md` |

</details>

---
