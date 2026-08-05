# 第 4 層獨立驗證委託書 —— ZK 10.4 補齊 8 個元件 + artifact 版號

> 這份委託書是給**獨立覆核者**看的。前三次派工都死在 API 529、沒有留下任何產出,
> 所以本檔把全部委託內容落在磁碟上,重派時直接讀這一份即可。
>
> **委託人自己已經做過一輪自我複核**(`doc/self-verify-zk104-backfill.md`)。那一輪的結論
> **不得**當成起點 —— 覆核者要重新取證。自我複核唯一該被當真的部分是它**自己承認的盲點**:
> C3 / C7 / C8 / C9 / C10 只有委託人單方量測,而「我沒想到要檢查的東西」查不到。

## 驗收對象

13 顆 commit,`4aac5e5`(artifact 版號)→ `c89e4b2`(自我複核文件)。
工作目錄 **`/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`**(分支 `drop-less`)。
計畫書 `tasks/backfill-8-components-and-version.md`;進度文件
`doc/iceblue-drop-less-progress.md`(L1/L2)+ `doc/iceblue-drop-less-progress-appendix.md`(L3)。

## 12 條斷言

| # | 斷言 | 自我複核當時的狀態 |
|---|---|---|
| C1 | 相對於 ZK 10.4,本主題原本缺的元件輸出**恰好 8 個**,現已歸零 | CONFIRMED |
| C2 | token 缺口恰好 20 個 `--zk-severity-*`,**且 `zul/less/` 沒有其他該補的漂移** | 後半段 **REFUTED**(見 S29) |
| C3 | 8 個元件的 LESS 是**逐字**取自 ZK 10.4 / zkcml,沒有本地改寫 | 未獨立複驗 |
| C4 | `baseline/` 只有加法:1 個檔更新(`norm.css.dsp`)+ 8 個新增,既有 77 檔未被動到 | CONFIRMED |
| C5 | 閘門紀錄 #41 的 `files differing: 0` 是**因構造成立**(空轉),#42 才是真比較 | CONFIRMED |
| C6 | 收工數字:輸出 **85** 檔 / **14863** 條 declaration / differing **0**;來源端 83 `.css` + 2 `.less` | CONFIRMED |
| C7 | 執行層驗收:8 個元件的選擇器真的進到瀏覽器實收的彙整 CSS、20 個 severity token 被服務、`Unable to load` 歸零 | 未獨立複驗 |
| C8 | 「覆蓋率 81/85」那個數字**作廢**(探針壞了,不是覆蓋率掉了) | 未獨立複驗 |
| C9 | 這 8 個元件**不需要**在本主題做任何註冊(`config.xml` / `lang-addon.xml` / `zk.xml` 都不必動) | 未獨立複驗 |
| C10 | artifact 版號 `10.4.0-jakarta-Eval` 在 4 處一致,且與 `zk.version` 無耦合 | 未獨立複驗 |
| C11 | L3-A 第 1–38 列與 S1–S25 **未被改寫**,只有附加 | CONFIRMED |
| C12 | 補齊**沒有悄悄動到**既有 77 個輸出 | CONFIRMED |

**優先序**:C7 → C3 → C9 → C10 → C8,再回頭獨立重驗 C5 / C12 / C1 / C2 / C4 / C11 / C6。
C7 排第一是因為它最容易「看起來對」,而且它是唯一能證明使用者真的拿到樣式的一條。

## 追加委託:掃 S29 同性質的缺口

S29 是「`zul/less/_zkcssvariables.less` 少一行 `@import "colors/_@{themePalette}_css";`,
連帶少 `colors/_iceblue_css.less`」。它是靠 `diff -rq` 整個 `zul/less/` 才浮出來的,而
**其他目錄本輪沒有掃**:`zkmax/less/`、`js/zkex/**/less/`、`js/zkmax/**/less/`、`js/zul/**/less/`。

請對整個 `src/main/resources/web` 與 ZK 10.4 對應樹做一次目錄級 diff,回報**同性質**的缺口
(缺 import、缺 partial、缺 profile / palette 檔)。**只回報,不要修。**

ZK 10.4 來源樹的位置由你自己找(委託人用的是解開的 jar 與 `zk` / `zkcml` 產品樹;
`tasks/backfill-8-components-and-version.md` §0 記了當時用的路徑)。**找到的路徑要寫進報告**,
因為「兩邊到底在比什麼」是這類結論最常出錯的地方。

## 取證規則(硬規則)

1. **不得只讀文件下結論。** 每一條都要有可重跑的指令與它的輸出。文件本身就是被驗對象。
2. **數字不合就是發現。** 不准為了對上而放寬 assertion、不准改期望值 —— 這個專案的既有規則。
3. **禁止 `npm run baseline`。** 那會重建基準、毀掉整套驗證的地基。
4. **只准寫你自己的報告檔**(路徑見下)。不得修改任何 source / LESS / CSS / 既有文件。
   若發現該修的東西,寫進報告的〈建議〉,不要動手。
5. **禁止碰 `/Users/hawk/Documents/workspace/zkThemeTemplate`** —— 那是同一個 repo 的另一個
   分支的 worktree。所有指令都要顯式 `cd` 到 iceblue worktree 並用 `pwd` 確認
   (shell cwd 會在呼叫之間跳回去)。
6. **禁止 `git add -A` / `git add .`**;禁止 `git checkout <檔>` 清理探針(會連帶毀掉未提交的檔)。
7. 多指令的 Bash 呼叫裡用 **`/usr/bin/grep`**,不要用裸 `grep`(裸 `grep` 會 exec 取代 shell,
   後面的指令全部不執行)。`rg` 是 shell function shim,獨立 script 裡沒有這個東西。
8. 暫存檔放 session scratchpad,不要放 `/tmp`,也不要留在 repo 裡。
9. **報告用 zh-TW、半角標點**(比照專案其他文件)。

## 怎麼跑起來(C7 需要)

```bash
cd /Users/hawk/Documents/workspace/zkThemeTemplate-iceblue
npm run check:cssdiff                       # 閘門:預期 85 檔 / 14863 條 / differing 0
withjdk.sh 17 mvn test exec:java@preview-app   # preview app
```

- 這個 worktree 的 preview app **只設了 `zk.homepage`,沒有 `*.zul` catch-all**
  ⇒ 頁面在 **`/`**,不是 `/preview.zul`。打錯路徑會拿到 404,然後量到「0 個 CSS URL、
  8 個元件全部不存在」—— 委託人第一次就是這樣誤判的。
- 用 **`127.0.0.1`** 不要用 `localhost`(Chrome 走 IPv6、app 綁 IPv4 → ERR_CONNECTION_REFUSED)。
- 收工要停掉:`kill $(lsof -nP -iTCP:8080 -sTCP:LISTEN -t)`。
- 8 個元件:`avatar` `avatargroup` `badge` `breadcrumb` `carousel` `chip` `confirmpopup`
  (在 `js/zul/wgt/css/`)+ `daterangebox`(在 `js/zkmax/db/css/`)。
- **注意 C8 的教訓**:用選擇器命中(`.z-avatar` 等)做正面證據,不要用「檔案尾端 N 字元包含」
  這種切片比對 —— 那個探針已經證實會產生假 miss。

## 報告

寫到 **`doc/l4-verify-zk104-backfill.md`**。

**先建檔再逐條填。** 前三次失敗都是「跑完才寫」所以什麼都沒留下。請一開始就把
12 條的表格骨架寫進檔案(狀態全填 `PENDING`),每驗完一條就更新那一列 —— 中途死掉也要留下進度。

結構:

1. **結論** —— PASS / PASS-WITH-FINDINGS / FAIL,一句話。
2. **逐條結果表** —— `#` / 斷言 / 結果(CONFIRMED · REFUTED · PARTIAL · UNVERIFIED)/ 決定性證據
   (要有指令與數字,不要「已確認」這種詞)。
3. **發現** —— 每條標嚴重度(HIGH / MEDIUM / LOW)、是否本輪造成、建議動作。
4. **S29 同性質缺口的掃描結果** —— 含你比對的兩邊路徑。
5. **我沒能驗證的,以及為什麼** —— 這一節不准空著。真的全驗完就寫「無」並說明判準。
