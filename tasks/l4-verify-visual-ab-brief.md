# 第 4 層獨立驗證委託書 —— 視覺 A/B harness(L2.4 前置項)

> **狀態:已執行完畢(2026-08-06)。報告 → `doc/l4-verify-visual-ab.md`,結果
> PASS-WITH-FINDINGS(9 CONFIRMED / 1 REFUTED / 3 PARTIAL)。** 本檔保留為委託當時的內容。
>
> **C1 那一節的要求(「不要照抄委託人的做法,自己造更小的改動逼近下限」)是這一輪最有價值的部分** ——
> 它直接推翻了「≈6 倍餘裕」可以推廣的說法。反過來,**C5 被推翻是委託書沒預料到的**:
> 委託書把 C5 當成「重跑一次確認」的例行條目排在第五順位,結果它是唯一被 REFUTED 的一條。
> 教訓:**「覆核者自己重跑一次」不是例行公事,它本身就是最容易抓到東西的手段之一。**
>
> 這份委託書是給**獨立覆核者**看的。委託內容全部落在磁碟上,重派時直接讀這一份即可
> (上一次派工在 Opus tier 連續五次死在 API 529、什麼都沒留下,這是落檔的直接原因)。
>
> **委託人已經自我驗證過一輪**(結論寫在 `doc/visual-ab-harness.md`)。
> 那一輪的結論**不得**當成起點 —— 覆核者要重新取證。自我驗證唯一該被當真的部分是它
> **自己承認的盲點**:噪音下限 `maxDelta ≤ 8 && diffPixels ≤ 64` 是委託人自己從自己的
> 量測校出來的,**沒有任何第三方檢驗過它是不是被調鬆到剛好會過**。

## 為什麼這一步特別值得驗

這個 harness **本身就是後面三個階段的量測工具**(P4 / P5 / P7 的 G-delta 判斷都靠它)。
工具錯了不會當場報錯,而是讓後面每一批判斷同時失真 —— 而且是往「看起來沒問題」的方向失真。
本專案已經吃過一次同型的虧:閘門紀錄 **#41** 的 `files differing: 0` 是**因構造成立**(兩側同 byte),
零是真的、意義是假的。這一輪要問的是同一個問題的像素版本:**這個零有沒有牙齒。**

## 驗收對象

1 顆 commit:**`196773e`** —— `feat(visual-ab): the harness — Marble's pages under our theme jar, 0 self-diff`。

工作目錄 **`/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`**,分支 `iceblue`
(**請自己用 `git branch --show-current` 確認**,上一份委託書就在這裡寫錯過)。

- 規格與自我驗證結論:`doc/visual-ab-harness.md`
- 實作:`scripts/ab-visual.js`、`scripts/png-compare.js`、`src/test/playwright/{ab-capture.spec.ts,playwright.config.ts}`
- 計畫書 `doc/iceblue-drop-less-execution-plan.md` §L2.4;進度 `doc/iceblue-drop-less-progress.md`(L1/L2)
  + `doc/iceblue-drop-less-progress-appendix.md`(L3,本輪新增第 **#44** 列與 **S32** note)

## 13 條斷言

| # | 斷言 | 自我驗證當時的狀態 |
|---|---|---|
| C1 | **噪音下限有牙齒** —— `maxDelta ≤ 8 && diffPixels ≤ 64` 不會把真實的樣式改動吞掉 | 只用「button 圓角」這**一種**改動證明過,而它很大(最小 370px) |
| C2 | 語料是**掃描**Marble 已編好的樹得到的 **116 頁**,不是寫死清單;SKIP 只有 7 條、**每條都有原因**,且沒有一條在遮蔽會差異的頁 | 委託人單方 |
| C3 | 守門探針**真的會擋** —— 主題沒載到時它會中止,而不是回報完美的零 | **從未反向測過**(只看過它通過) |
| C4 | 排除 `MARBLE/target/classes` 是必要的 —— 放進去 `font-awesome.css.dsp` 真的會被丟掉 | 只有讀 Java 原始碼的推論,**沒有實測過那個失敗模式** |
| C5 | 自我驗證 `pages differing: 0` 可由覆核者**自己重跑**重現 | 委託人跑過三輪 |
| C6 | theme 指紋涵蓋全部 **85** 個 `.css.dsp`,且**任何一個 byte 變了指紋就變** | 委託人單方 |
| C7 | 反向控制可重現:注入 `.z-button{border-radius:12px}` → 指紋 DIFFERENT + **36 頁**差異、最小 370px | 委託人單方 |
| C8 | 「拍到穩定為止」**不會**讓一頁悄悄通過 —— 收不到穩定就不寫 PNG、該頁失敗、`diff` 報 `missing` | 委託人單方 |
| C9 | 語料是空的 / 掃不到時**不會**被當成「0 差異」通過(`pages.length > 50` 的護欄) | 委託人單方 |
| C10 | `@playwright/test` **精確鎖版**(`1.62.1`,無 `^`),且兩側瀏覽器版本不同時 `diff` 會出 WARNING | 委託人單方 |
| C11 | 本輪**沒有動到任何主題來源檔**,主閘門仍是 **85 檔 / 14863 條 / differing 0** | 委託人單方 |
| C12 | L3-A 第 **1–43** 列與 **S1–S31** 未被改寫,只有附加(本輪 diff 應該只有 **1 個刪除行**:`<summary>` 的計數) | 委託人單方 |
| C13 | `npx playwright install chromium` 清掉了共用快取裡的其他瀏覽器(`chromium-1117`、`ffmpeg-1009`、`firefox-1449`、`webkit-2003`)—— **Marble 自己的 Playwright 套件是否還跑得動** | 已揭露、**未驗證** |

**優先序**:**C1 → C3 → C4** → C2 → C5 → C6 → C7 → C8 / C9 / C10 → C11 / C12 / C13。

C1 排第一,因為它是這整個 harness 唯一真正的風險:下限太鬆 ⇒ 後面每一階的「0 差異」都是假的,
而且**假在看不見的方向**。C3 / C4 排前面,是因為它們是唯二「反向」的斷言 —— 委託人全程只看過
它們成功,從沒看過它們該失敗時會不會失敗。

### C1 要怎麼驗(這一條請不要照抄委託人的做法)

委託人的反向控制只注入了**一種**改動,而且是大改動(button 圓角 12px,最小 370px ≈ 下限的 6 倍)。
「大改動抓得到」**不能**推論出「下限剛好」。請自己造**更小**的改動,由大而小逼近下限,例如:

- 單一 **1px border-color** 改一階(挑一個在多數頁面都出現、而且**不會**改變版面尺寸的元件)
- 單一 **color / background-color** 改一階(不動版面)
- 一個**只在 hover 才生效**的宣告(預期:抓不到 —— 截圖不觸發 hover。**這是預期的漏報,請寫進報告**)

回報三個數字:**抓得到的最小改動是什麼**、**抓不到的最大改動是什麼**、以及那個界線和噪音下限
(8 / 64)之間還剩多少餘裕。如果發現下限太鬆 —— **就照實寫,不要幫它找理由**。

**注入規則(硬性)**:只准改 **build 產出**(`target/classes/web/iceblue_css/**`),
**絕對不准改 `src/` 底下任何檔**;驗完用 `npm run build:css` 還原,並確認指紋回到
**`6e5a856e8a80ddf9`**。禁止用 `git checkout` 還原。

### C3 / C4 要怎麼驗

這兩條都是**反向**斷言,必須讓它「該失敗的時候真的失敗」:

- **C3**:把 `-Dorg.zkoss.theme.preferred=iceblue_css` 拿掉(或改成不存在的主題名)再起 app,
  斷言守門探針**中止**且不產生任何 PNG。如果它照樣跑完並回報 0 差異 —— 那是 HIGH 嚴重度的發現。
- **C4**:把 `MARBLE/target/classes` **加進** classpath 起 app,抓一頁 HTML,
  斷言 `font-awesome.css.dsp` 真的不見了(或 `marble` 出現次數 > 0 ⇒ 探針會擋)。
  這是在證明「那個排除不是迷信」。

兩條都是**臨時實驗**,不要留下任何被改過的檔;實驗腳本放 scratchpad。

## 追加委託:找委託人沒想到要檢查的東西

自我驗證的結構性盲點就是「我沒想到要檢查的東西查不到」。請至少想一想這幾個方向,
有結論就寫,沒有就寫「掃過、無發現」:

- `capture` 用同一個 label 跑兩次會怎樣?(悄悄覆蓋?還是擋下來?)
- 一頁只出現在其中一側(A 有 B 沒有)時,`diff` 是報 `missing` 還是**默默略過**?
- `diff` 的差異頁數是不是可能因為**兩側頁數不同**而被低估?
- `png-compare.js` 是自己寫的 PNG decoder —— 它對 Playwright 實際吐出來的 PNG(colour type 2、
  bit depth 8、非交錯)以外的輸入會怎樣?會不會**靜默給出錯的比較結果**?
- 8 輪 × 250ms 的穩定判定,對**慢頁**是不是太短?會不會把「還沒穩」當成「穩了」?

## 取證規則(硬規則)

1. **不得只讀文件下結論。** 每一條都要有可重跑的指令與它的輸出。文件本身就是被驗對象。
2. **數字不合就是發現。** 不准為了對上而放寬 assertion、不准改期望值 —— 這個專案的既有規則。
3. **禁止 `npm run baseline`。** 那會重建基準、毀掉整套驗證的地基。
4. **只准寫你自己的報告檔**(路徑見下)與 scratchpad。不得修改任何 source / LESS / CSS / 既有文件。
   臨時注入只准落在 `target/` 並還原。若發現該修的東西,寫進報告的〈建議〉,**不要動手**。
5. **`/Users/hawk/Documents/workspace/zkThemeTemplate`(Marble worktree)視為唯讀。**
   那是同一個 repo 另一個分支的 worktree。可以讀它的 `target/`,**不得修改它任何檔案**,
   也不要在那裡跑 build。所有指令都要顯式 `cd` 到 iceblue worktree 並用 `pwd` 確認
   (shell cwd 會在呼叫之間跳回去 —— 這個坑委託人踩過)。
6. **禁止 `git add -A` / `git add .`**;禁止 `git checkout <檔>` 清理探針(會連帶毀掉未提交的檔)。
7. 多指令的 Bash 呼叫裡用 **`/usr/bin/grep`**,不要用裸 `grep`(裸 `grep` 會 exec 取代 shell,
   後面的指令全部不執行)。`rg` 是 shell function shim,獨立 script 裡沒有這個東西。
8. 暫存檔放 session scratchpad,不要放 `/tmp`,也不要留在 repo 裡。
9. **報告用 zh-TW、半角標點**(比照專案其他文件)。

## 怎麼跑起來

```bash
cd /Users/hawk/Documents/workspace/zkThemeTemplate-iceblue && pwd
npm run check:cssdiff          # 主閘門:預期 85 檔 / 14863 條 / differing 0
npm run visual:selftest        # 同一個 build 截兩次,預期 pages differing: 0
npm run visual:capture -- <label>
npm run visual:diff -- <a> <b>
```

- `capture` **自己管 app 生命週期**(解析 classpath → 起 app 於 **8081** → 守門探針 → Playwright → 關 app)。
  **不要**事先手動起 preview app;port 被佔住時它會停下來並告訴你怎麼關。
- 跑一輪 116 頁大約要幾分鐘,`selftest` 是兩輪。請預留時間,不要中途 kill 到一半留下殘骸。
- 用 **`127.0.0.1`** 不要用 `localhost`(Chrome 走 IPv6、app 綁 IPv4 → ERR_CONNECTION_REFUSED)。
- 輸出在 `target/ab-visual/`(shots / manifest / report HTML),已在 `.gitignore` 內。
- 前置:Marble worktree 已編過(`target/test-classes` 有東西)。**若沒有,停下來回報,不要去那邊 build。**

## 報告

寫到 **`doc/l4-verify-visual-ab.md`**。

**先建檔再逐條填。** 上一次派工失敗五次都是「跑完才寫」所以什麼都沒留下。
請一開始就把 13 條的表格骨架寫進檔案(狀態全填 `PENDING`),每驗完一條就更新那一列 ——
**中途死掉也要留下進度**。

結構:

1. **結論** —— PASS / PASS-WITH-FINDINGS / FAIL,一句話。
2. **逐條結果表** —— `#` / 斷言 / 結果(CONFIRMED · REFUTED · PARTIAL · UNVERIFIED)/ 決定性證據
   (要有指令與數字,不要「已確認」這種詞)。
3. **C1 的靈敏度下界** —— 獨立一節。抓得到的最小改動、抓不到的最大改動、與下限之間的餘裕,
   以及你對 `8 / 64` 這組數字的判斷(太鬆 / 剛好 / 太嚴)。
4. **發現** —— 每條標嚴重度(HIGH / MEDIUM / LOW)、是否本輪造成、建議動作。
5. **追加委託的掃描結果**。
6. **我沒能驗證的,以及為什麼** —— 這一節不准空著。真的全驗完就寫「無」並說明判準。
