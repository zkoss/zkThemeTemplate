# IceBlue 棄用 LESS —— 執行計畫(規範)

**分支** `iceblue`(自 `master` 開出)· **工作目錄** `../zkThemeTemplate-iceblue`(git worktree)
**日期**:2026-07-29(背景章節補於 2026-07-31)· **最後結構調整** 2026-08-04(套用三層式架構;同日 L3 拆為獨立附錄檔)

> **本文件是規範** —— 階段定義、驗收閘門判準、範圍邊界、術語。
> **狀態**(現在做到哪、閘門跑過幾次、量測是多少)一律看
> [iceblue-drop-less-progress.md](iceblue-drop-less-progress.md)。
>
> 依 `.claude/skills/plan-spec/SKILL.md` 的三層式架構編排:
> **L1** 一頁執行摘要 · **L2** 階段規範(名詞統一)· **L3** 技術附錄(所有微觀細節與 Change Log)。
> **L1/L2 只寫當前結論;被推翻的敘述與更正過程一律在 L3-G Change Log。**
>
> **本檔只有 L1 + L2 + L3 索引。** 內文提到的 `L3-A`…`L3-H` 全部在
> [iceblue-drop-less-plan-appendix.md](iceblue-drop-less-plan-appendix.md);
> 執行一個階段只需要本檔,附錄按〈[L3 技術附錄](#l3-技術附錄獨立檔)〉的「何時要看」欄按需開啟。

**相關文件**:[task-doc-tracking-policy.md](task-doc-tracking-policy.md)(工作文件的版控政策 + `check:doc-refs`)·
[css-preprocessor-industry-direction.md](css-preprocessor-industry-direction.md)(業界方向佐證)·
[migration/less-var-to-token.md](migration/less-var-to-token.md) · [migration/mixin-to-css.md](migration/mixin-to-css.md)(P8 的兩張規則表)

---

## 目錄

- **[L1 執行摘要](#l1-執行摘要)** — 核心目標 · 五大里程碑 · 總體進度 · 三條判準
- **[L2 階段規範](#l2-階段規範)**
  - [L2.0 術語表](#l20-術語表--這些名詞不可混用) — **看不懂任何數字之前先看這裡**
  - [L2.1 範圍](#l21-範圍) — 做什麼 / 不做什麼
  - [L2.2 驗收閘門制度](#l22-驗收閘門制度) — G-zero / G-delta · 四層人工複核 · 步階與批次 · commit 粒度
  - [L2.3 各階段規範](#l23-各階段規範) — [P0](#p0--建立工作區與基準) · [P1](#p1--把-less-釘到-481s0--s1) · [P2](#p2--雙來源-build) · [P3](#p3--元件轉換-74-檔工作量主體) · [P4a](#p4a--vendor-prefix-純移除a-群) · [P4b](#p4b--vendor-prefix-逐條判斷c-群) · [P5](#p5--normcsstokens--reset--全域) · [P6](#p6--font-awesome-產生器) · [P7](#p7--tablet--themeprofile) · [P8](#p8--收尾)
  - [L2.4 前置工作項](#l24-前置工作項不是階段不產生-theme-輸出) — 不是階段,不產生 theme 輸出
  - [L2.5 執行機制](#l25-執行機制)
- **[L3 技術附錄](#l3-技術附錄獨立檔)** — 索引與〈何時要看〉在本檔;**內容在 [iceblue-drop-less-plan-appendix.md](iceblue-drop-less-plan-appendix.md)**
  - [L3-A 決策依據](iceblue-drop-less-plan-appendix.md#l3-a-決策依據為什麼要放棄-less) — 為什麼要放棄 LESS
  - [L3-B 已驗證的前提](iceblue-drop-less-plan-appendix.md#l3-b-已驗證的前提實測不是推論) — 22 項,實測不是推論
  - [L3-C 驗證策略與方法學](iceblue-drop-less-plan-appendix.md#l3-c-驗證策略與方法學) — 閘門設計 · 四層複核 · 5 類封閉清單
  - [L3-D 各階段的技術細節與論證](iceblue-drop-less-plan-appendix.md#l3-d-各階段的技術細節與論證p0-p8) — P0-P8
  - [L3-E 風險](iceblue-drop-less-plan-appendix.md#l3-e-風險)
  - [L3-F 決策紀錄](iceblue-drop-less-plan-appendix.md#l3-f-決策紀錄) — L-2 / L-4 / L-5 / L-7 / L-8 與五次追加拍板
  - [L3-G Change Log](iceblue-drop-less-plan-appendix.md#l3-g-change-log--規範層的斷言變更) — 18 條規範層更正
  - [L3-H 進度記錄制度](iceblue-drop-less-plan-appendix.md#l3-h-進度記錄制度)
- **[附:跨主題待辦裁示](#附跨主題待辦裁示不屬於本案任何階段)** — 由本案裁示產生、但要在別的地方執行的事(**M-1** Marble 密度字彙對齊 · **M-2** `@themePalette` 移出本案)

---

## L1 執行摘要

### 核心目標

把 IceBlue 的 **153 個 `.less` 換成純 CSS、移除 `zkless-engine` 依賴**,而且在過程中
**不改變瀏覽器實際收到的 CSS**(除了明確決策要改的部分)。

一句話:這個分支只證明一件事 —— **「IceBlue 不需要 LESS 也能產生一模一樣的 CSS」**。

決策窗口是 **ZK 11** —— 移除 LESS 變數這個客戶正在使用、readme 主動教學的客製 API,
只能在 major 版做。對外賣點是**收斂成單一 theming API**,**不是**「移除建置工具」:
DSP 層與 Font Awesome 的生成內容都還在,零 build step 兌現不了(L3-A · B1)。

### 五大里程碑

| 里程碑 | 涵蓋階段 | 狀態 |
|---|---|---|
| **M1** 基礎建設與閘門 | P0 基準 · P1 LESS 4.8.1 pin · P2 雙來源 build | **DONE** |
| **M2** 元件轉換(工作量主體) | P3 —— 74 個元件檔 `.less` → `.css` | **DONE** |
| **M3** vendor prefix 政策 | P4a 純移除 · P4b 逐條判斷 | **DONE**(P4a 2026-08-07 · P4b 2026-08-10) |
| **M4** 三個 holdout | P5 `norm` · P6 Font Awesome · P7 `tablet` | **P6、P5 已收工(P5 於 2026-08-06,收在 G-zero)**;P7 待前置 |
| **M5** 收尾與遷移指南 | P8 | TODO |

### 總體進度

| 量法 | 數字 | 定義 |
|---|---|---|
| **里程碑進度** | **2 / 5 = 40%** | M1、M2 完成 |
| **輸出檔脫離 LESS** | **84 / 85 = 99%** | 核心命題已零差異證明完畢;剩 **1** 個**刻意**保留的 holdout(`tablet`/P7)。~~74 / 77~~ 是 P3 收工時的數字,ZK 10.4 補齊把分母帶到 85、P5 與 P6 把分子帶到 84 |

兩個數字都要看:里程碑還剩三個,但**承重的命題已經證明完畢** —— 剩下的階段都是有意識的取捨
(前綴政策、reset 機制、profile API),不是「還不知道做不做得到」。
逐階段、逐閘門的權威狀態在進度文件 L1 / L2。

### 三條貫穿全案的判準

1. **先把所有能「零差異」驗證的事做完,再做會改變輸出的事**(G-zero 先於 G-delta)。
   否則出現差異時分不清是「轉換寫錯」還是「政策生效」。
2. **閘門過了,先問它走過什麼。** 沒有輸入時「差異 0」是免費的 —— P2 實測過。
3. **不改斷言去符合量測。** 對不上就停下來查;分歧本身就是發現。

---

## L2 階段規範

### L2.0 術語表 —— 這些名詞不可混用

這張表不是形式主義。下面每一組都**至少造成過一次錯誤結論**,更正紀錄在 L3-G。
進度文件沿用本表,不另立一份。

| 統一用語 | 定義 | 不可混用的近義說法 |
|---|---|---|
| **輸出端條數** | `.css.dsp` 裡的 declaration 條數。**閘門比的就是這個**;全樹 **14323** 條 | **來源端條數** —— `.less` / `.css` 來源檔裡的宣告數,小得多 |
| **輸出檔數 = 77** | `target/classes/web/iceblue/**/*.css.dsp` | — |
| **元件檔 = 74** | P3 的轉換標的(77 − 3 個 holdout) | — |
| **builder 覆蓋檔數 = 75** | `check:build-css` 真正經過 `build-css.js` 的檔(77 − `norm` − `tablet`,那兩檔是 passthrough、**不是證據**)。**2026-08-06 起是 84**:P5 讓 `norm` 從 passthrough 轉為真來源實測,只剩 `tablet` 一個 passthrough | — |
| **來源檔數** | P0 時 **153** 個 `.less` = **77 個進入點 + 76 個 `_*.less` partial**。partial 靠 `@import` 被內聯進進入點,**從來就沒有自己的輸出**;所以 1:1 的對象是進入點,不是總檔數。P3 收工後進入點是 **74 `.css` + 3 `.less` = 77** | 「153 個來源只剩 77 個輸出,少掉的去哪了」 —— **沒有少**,問錯了對象 |
| **holdout** | 刻意留在 LESS、不歸 P3 管的進入點。**P3 收工時是 3 檔**:`norm`(P5)、`font-awesome`(P6)、`tablet`(P7);**P6 收工後是 2 檔**(`norm`、`tablet`);**P5 收工後(2026-08-06)是 1 檔**(`tablet`)。**這是會隨階段遞減的數字,不是不變量** —— 引用時要標明是哪個時點 | 把 `3` 當常數;`元件檔 = 74` 那一列用的是 **P3 時點**的 3,那一列不會變 |
| **批次(批 1–3)** | **閘門與複審的分界**,以輸出端條數劃分 | 步階 |
| **步階(步 0–4)** | **一次做多少、什麼時候停** | 批次 |
| **第 1 層** | 位元組層複核。**對 P3 的定義是「逐 byte 相同 _or_ 差異落在 5 類封閉清單內」** | 「嚴格逐 byte 相同」那個窄義 —— 它只對 LESS→LESS 成立,**不要外推到 P3** |
| **mixin 30 名稱 / 38 定義列** | **必須成對引用**(差額是 LESS 的同名多載) | 各取一個湊成的 `24/38`、`30/32` —— 描述不了任何檔案 |
| **G-zero / G-delta** | 見 L2.2 | — |
| **儀器** | **我們自己寫來量東西的工具**,不是被量的東西:`cssdiff.js`、`check-bytes.js`、`check-build-css.js`、`p4a-delta.js`、規則表產生器的斷言、視覺 A/B harness 都是儀器 | **閘門** —— 閘門是**判準**(「`files differing: 0` 才算過」),儀器是**量出那個數字的工具**。同一個閘門可以換儀器;分不清就答不出「這次紅燈是產品壞了還是儀器過期了」 |
| **儀器證明** | **閘門走不到某段程式碼時,另外補的一次性實驗證據。** 作法是把**全樹**強制重導過那條路徑再量,並附負向控制 | 「閘門通過了」 —— 閘門**空轉**時的 PASS 不是證據,見下 |

> **「儀器證明」是哪來的、為什麼需要它。** P2 加了 `build-css.js` 這條新程式碼路徑,
> 但當時樹上有 **0 個 `.css`**,所以那支 builder **一行都沒跑**,閘門照樣印
> `files differing: 0` 並 exit 0 —— 這叫**空轉**。空轉有多徹底是實測過的(2026-07-31):
> 把 `minify()` 改成 `return ''`(每個產生的檔都是空的),閘門**仍然** exit 0。
> **一般規則:閘門能證明什麼,取決於受測的程式碼路徑有沒有被走到;沒有輸入時「差異 0」是免費的。**
>
> P2 的補法就是儀器證明,共六步,重點是這三個:**把全樹重導過 `build-css.js`**
> (12142 條 / 覆蓋 75 檔)、**兩檔 round-trip 逐 byte 相同**、
> **故意弄壞 header 的負向控制必須 exit 1**。
>
> 另外兩個由此衍生、文件裡會直接使用的說法:
> - **先證明儀器,再相信儀器** —— 拿同一個 build 截兩次、確認差異為零,才開始拿它比對兩個
>   不同的 build。`cssdiff`(P0)與視覺 A/B harness 都做過這一步。
> - **儀器過期** —— 斷言當初校準用的檔集已經不存在了,所以紅燈是量測對象沒了,不是產品錯了。
>   兩次實例:**S14**(P3 刪掉 74 個 entry ⇒ `check:var-table` / `check:mixin-table` 轉紅)、
>   **S27**(ZK 10.4 補齊讓分母變大 ⇒ 「builder 覆蓋率到頂」失效)。
>
> **儀器證明的弱點是它只做一次。** P2 那次是 scratchpad 裡的手動實驗,round-trip 的兩個檔事後
> 還被還原,所以 repo 裡沒有任何東西會重跑它 —— `build-css.js` 從那天起就是無人看守的程式碼。
> 2026-07-31 把它自動化成 `npm run check:build-css` 才補起來。
> **⇒ 一次性的儀器證明只夠當「開工前的證據」,不能當「持續的守衛」;要守衛就得落地成腳本。**

> **上表的示例數字停在 P3 時點,定義本身不變。** 現況(2026-08-06):輸出端條數 **14863**、
> 輸出檔數 **85**、builder 覆蓋 **84**、holdout **1**。分母是 ZK 10.4 補齊帶動的(+8 檔),
> 分子是 P6 與 P5。權威值一律看進度文件 L1 / L2,不要引用本表的數字當現況。

### L2.1 範圍

**做**:把 IceBlue 的 153 個 `.less` 換成純 CSS,移除 `zkless-engine` 依賴,在過程中不改變
瀏覽器實際收到的 CSS(除了明確決策要改的部分)。

**不做**(這個分支刻意排除,以免混淆驗證訊號):

| 排除項 | 理由 |
|---|---|
| 動 `master` | 佔位符 / 模板身分要跟 RD 討論後再定(評估文 §8.1) |
| 導入 `@layer` | 會改變 cascade 行為 → 無法用「零差異」驗證。獨立議題,獨立分支。**理由只是 cascade 語意,不是工具限制** —— LESS 4.8.1 編 `@layer` 是位元組正確的(前提 #21) |
| Marble token 改名 / 對齊 | 是另一份文件的 Part B,獨立決策 |
| 移植 Marble 的 utility classes | 獨立決策 |
| `--zk-*` token 增減 | 本分支只搬,不改名不增減 |

其他現代化留給後續分支,各自帶自己的驗證。

### L2.2 驗收閘門制度

#### 兩種閘門,不要混用

| 閘門 | 用在 | 判準 |
|---|---|---|
| **G-zero** | P0、P1、P2、P3、P6、P8 | `files differing: 0`。**任何差異都是 bug** |
| **G-delta** | P4a、P4b、~~P5~~、P7 | 差異必須**逐條對應到已決策的變更**,且總數符合預估。**每個階段只允許一種 diff 形狀** —— 這是 P4 拆成 P4a / P4b 的理由。**P5 實際收在 G-zero**:不採 `@scope`,runtime 行為沒動,沒有要對應的 delta(**S35**) |

**閘門指令是 `npm run check:gate`;判準就是它的 exit code。** 它 = **`check:baseline`** +
`check:less-conventions` + `check:fa-css` + `build:tree` + **`check:p4a`** + **`check:p4b`**。

> **為什麼 `check:baseline` 排第一。** 閘門說的每一句話都是「相對於 `baseline/`」,
> 所以基準本身若被污染,後面四步全部失去意義 —— 而且不一定會叫。把它排在最前面,
> 基準一有問題就**在編譯之前**停下來,錯誤訊息直接指向真正的原因。
> **負向控制(2026-08-10)**:對 `baseline/js/zkex/menu/css/fisheye.css.dsp` 追加 5 個 byte
> → `check:gate` 在**第一步** exit 1(`CHANGED … / 0 missing, 1 changed, 0 extra`),
> **完全沒有走到 `build:tree`**。以 scratchpad 副本還原,還原後 sha256、`git status`、
> manifest **三條路徑各自驗過**。

主閘門**儀器**是 `scripts/cssdiff.js` —— 把每個輸出檔攤平成**有序**的
`context || property:value` 記錄清單再逐筆比對。設計要點與踩過的坑見 L3-C。

> **儀器與判準在 P4a 之後分家了(2026-08-10)。** G-zero 階段兩者合一:「差異 0」既是
> cssdiff 的輸出也是判準,所以 `npm run check:cssdiff` 的 exit code 直接可用。G-delta 階段
> 不是 —— cssdiff 問「candidate 是否**等於** baseline」,而正確答案是「不等於」,
> 於是它**因構造而 exit 1**(P4a 之後 45 檔 / 728 條;**P4b 之後實測 48 檔 / 749 筆記錄**
> = 728 移除 + 14 移除 + 7 新增;48 = 45 + 9 − 6 檔重疊)。
> 判準改由 `check:p4a` **與 `check:p4b`** 回答「差異是否**恰好等於**已核准的 delta」——
> 兩支各自把對方的 delta 從 baseline 側抵銷掉,所以合起來剛好把整份 diff 認領完,沒有灰色地帶。
>
> **所以現在有兩支,用途不同,不要互相替代:**
>
> | 指令 | 是什麼 | 在 G-delta 階段的 exit code |
> |---|---|---|
> | **`npm run check:gate`** | **判準**。要回答「現在過了沒」就跑這支 | **0 才算過** |
> | `npm run check:cssdiff` | **儀器**。要看原始差異長什麼樣(核帳、debug)才跑這支 | **1,而且是對的** |
>
> 為什麼不讓 cssdiff 自己收斂:P8 的 G-zero 核帳要把 P4 + P5 + P7 的 delta 加總對帳,
> 那時需要的是**未經判斷的原始差異**。把判準塞進儀器就取不到它了。
>
> 第 1、2 層複核(`check:bytes`、`check:build-css`)刻意**不在** `check:gate` 裡 ——
> 它們是**複核**不是閘門(見下一節),而且 `check:build-css` 會重編整棵 LESS 樹,慢得多。

兩個附帶條件,兩種閘門都適用:

1. **被測的程式碼路徑必須真的被走到。** 沒有輸入時「差異 0」是免費的 —— P2 就是這樣通過的,
   P6 會再遇到一次。走不到就必須另外補儀器證明。
2. **視覺回歸是輔助,不是主閘門。** declaration diff 在「瀏覽器實際收到的 CSS」這一層是
   **完整的等價證明**(DSP 求值不變)⇒ **P0–P3、P6、P8 不需要截圖**,硬加只會製造假的安心感。
   視覺 A/B 只在有意改變輸出的階段是必要補充,而且價值差很多。~~**P5 最高**(`@scope` 改變
   「誰被選到」)~~ **←前提沒成真:P5 不採 `@scope`,選擇器一個都沒換(前綴 90 = 90),
   所以那一輪的角色是「確認沒動」而不是「判定改動對不對」(紀錄 #50:116 頁、0 差異、
   兩側指紋不同)。判準留著,結論改掉 —— 價值取決於該階段有沒有真的改選擇器,不取決於階段編號。**
   P7 中等(機制換了)、**P4 最低**(前綴死不死是瀏覽器支援政策問題,截圖答不出來)。

#### 四層人工複核 —— 讓「0 差異」變成看得見的東西

`files differing: 0` 是**一支我們自己寫的工具**給的判決。要**複核結果**而不是**相信工具**:

| 層 | 內容 | 由誰保證獨立性 | 何時必做 |
|---|---|---|---|
| **第 1 層** | 位元組層比對。**P3 的判準是「逐 byte 相同 _or_ 差異落在 5 類封閉清單內」**,清單外 0 檔才算過 | 工具(`npm run check:bytes`、`npm run check:build-css`) | P2 起 |
| **第 2 層** | 差異的那幾檔,按 CSS 宣告邊界切開**直接讀 byte** | 同上 | P2 起 |
| **第 3 層** | 逐檔複核包 —— 可讀性、`var(--zk-*)` 名稱是否仍清楚、mixin 展開有無重複宣告。**閘門看不到這些** | 人(**自評**) | P3 |
| **第 4 層** | **獨立驗證 agent**:唯讀、不給它實作者的複核包、自帶量測、回報格式固定、與計畫書衝突時兩個數字都報、事後用 `git status --porcelain` **加上 `npm run check:baseline`** 驗證它真的沒動 repo | 另一個人/agent | **P3 之後每一步收工** |

> **唯讀證明為什麼要兩支。** ~~`baseline/` 被 `.gitignore` 忽略,所以 `git status --porcelain`
> 對「基準有沒有被寫」**結構上永遠是綠的**~~ **←2026-08-10 已從源頭堵掉:`baseline/` 改為
> 追蹤**(**S47**,暫時性,P8 收尾時移掉),所以任何寫入現在都會直接出現在 `git status`
> 與 `git diff` 裡。**兩支還是都要跑**,因為它們問的不是同一件事:
> `git status` 問「這一輪有沒有動它」,`npm run check:baseline` 逐檔比對
> `doc/baseline-manifest.sha256`,問「它現在的位元組**還是不是**當初釘住的那一份」——
> 後者連「某次 commit 把它一起改掉了」都抓得到。
> **2026-08-07 由第 4 層自己揪出這個盲點**(**S45**);在那之前每一輪的唯讀證明都帶著它,
> 覆核者只好各自臨時想辦法(mtime、程式碼路徑分析)補。

**為什麼第 4 層只從 P3 之後開始**:第 1、2 層的獨立性來自**工具**(確定性腳本,換誰跑都同一組
數字),再派 agent 去跑不會多出資訊;**第 3 層是自評**,而 G-zero 把「行為有沒有變」這個問題
關掉之後,它是**唯一還會出錯的地方**。

**兩個序列化器的 5 類寫法差異是一份封閉清單**(空白、小數前導零、`;}` 的分號、零值的單位、
空規則),由 `check:build-css` 逐檔分類回報;**落在清單外就讓檢查失敗並列出檔名**。
清單是封閉的才有用 —— 新形狀會被擋下來讓人看,而不是被「反正閘門過了」吸收掉。細節見 L3-C。

**第 1、2 層在 G-delta 階段比對的是「調整後的基準」**(2026-08-07 起,S41 選項 A / S44):
比對目標從 `baseline/` 換成「`baseline/` + 該階段已核准的 delta」,而 delta 由
`scripts/p4a-delta.js` 從 `baseline/` **重新推導**,不是記在 manifest 裡。
兩層的問題因此完全沒有變弱 —— 仍然是「逐 byte 相同 _or_ 落在封閉清單內」,
只是「相同於什麼」的定義跟著階段走。`baseline/` 本身永遠不寫。

#### 步階與批次是兩件事

| | 是什麼 | 值 |
|---|---|---|
| **步階** | **一次做多少、什麼時候停**。每一步結束就停,等人工確認才進下一步 | 步 0–4 = `1 → 4 → 15 → 43 → 11` 檔 |
| **批次** | **閘門與複審的分界**,以輸出端條數劃分 | 批 1 ≤20 條(20 檔)、批 2 21–200 條(43 檔)、批 3 >200 條(11 檔) |

步 0 + 步 1 + 步 2 = 批 1;步 3 = 批 2;步 4 = 批 3。
**先做小的不是謹慎的姿態,是為了讓錯誤發生在便宜的地方** —— 步 0 失敗賠 1 個檔,步 3 賠 43 個。

#### commit 粒度:為了 fork-merge,不是為了 AI 考古

本模板的使用方式是 **fork + merge upstream**,所以 merge 衝突的品質**直接取決於 commit 粒度**。

| 階段 | 粒度 | 理由 |
|---|---|---|
| **P3** | **一檔一顆**(~74) | 變更是逐檔特有的;客戶 merge 時衝突被侷限在他真正改過的那一檔 |
| **P4a / P4b** | 各一顆 | 規則均勻,客戶可機械式重新套用 |
| **P5** | ~5 顆 | 每個拆出來的檔案都是一個獨立的結構決策 |
| **P7** | 1–2 顆 | 對外 API 變更,與 migration guide 的條目成對 |

批次仍是**複審與閘門**單位,但不是 commit 單位。完整論證(以及為什麼「留給 AI 看歷史」
是三種機制裡最弱的一種)見 L3-C。

### L2.3 各階段規範

欄位固定:**目標 / 輸入 → 輸出 / 驗收閘門 / 前置 / commit 粒度**。
論證、實作紀錄、踩過的坑一律在 L3-D;現在做到哪在進度文件。

#### P0 —— 建立工作區與基準

| | |
|---|---|
| **目標** | 建立**不可變**的基準與主閘門工具,並先證明工具鏈與比對器本身是確定性的,再拿它去驗證別的東西 |
| **輸入 → 輸出** | `master` 的 LESS 樹(153 來源檔)→ worktree + `iceblue` 分支、`scripts/cssdiff.js`、`baseline/`(77 輸出檔,gitignore 但可一鍵重建)、`npm run check:cssdiff`、進度文件、計畫書進被追蹤的樹 |
| **驗收閘門** | **G-zero** —— `files differing: 0`(77 輸出檔 / 14323 輸出端條數)。外加**突變測試**:注入 5 種已知缺陷,4 種必須被抓到、純格式改寫必須**不**被抓到 |
| **前置** | — |
| **commit 粒度** | — |

> **基準的不可變性是一條硬規則**:`scripts/baseline.js` 預設**拒絕覆寫**既有 `baseline/`,
> 並在來源樹 `.less` 檔數為 0 時直接拒絕執行。P3 之後重跑基準建置會讓 `cssdiff` 拿轉換結果
> 跟自己比 —— 回報 0 而且什麼都沒證明。

#### P1 —— 把 LESS 釘到 4.8.1(S0 + S1)

| | |
|---|---|
| **目標** | 消除 LESS 3 在 **exit 0** 之下靜默改寫現代 CSS 值的風險;並把「`~./` import 只能出現在 entry 檔」這條從 2013 年起就承重、**從未寫下來**的不變條件變成具名的 build error |
| **輸入 → 輸出** | `package.json` → `overrides.zkless-engine.less = 4.8.1`(**S0**)、`scripts/check-less-conventions.js`(**S1**,串在 `check:cssdiff` 最前面) |
| **驗收閘門** | **G-zero**,外加 **S1 的負向控制必須 exit 1**(抓不到失敗的閘門不是閘門) |
| **前置** | — |
| **commit 粒度** | **一顆**(S0 + S1 合併)—— 歸因要的是**分開跑**,不是分開 commit;S1 在構造上不可能影響輸出 |

> 這個 pin **不改變本分支的交付物**(兩版在本來源上輸出已證明等價),它是護欄;
> 但它**不是可選的** —— Theme Pack 要走的「runtime `--zk-*` sheet + 新 CSS 語法」正好落在
> LESS 3 會靜默改寫的語法區,所以它從過渡期護欄升級成**下一步的前提**。

#### P2 —— 雙來源 build

| | |
|---|---|
| **目標** | 交付一個**能力**:來源樹同時容納 `.less` 與 `.css`,輸出仍是同一棵可比對的樹。產出是**「可逆、可分割、可隨時停」的 P3** —— 逐檔閘門、逐檔 commit、隨時停手三件事都建立在它上面。`build-css.js` 是 **P8 之後留下來的最終 builder,不是鷹架** |
| **輸入 → 輸出** | 無(不改善任何輸出;跑完那一刻與 baseline 逐 byte 相同)→ `scripts/build-css.js`(taglib header 注入、CleanCSS **level 0**、`HOSTILE_CONSTRUCTS` 前置守衛)、pom 的 `compile-css` execution、`npm run check:build-css` |
| **驗收閘門** | **G-zero —— 但這一階的閘門是空轉的**(樹上 0 個 `.css`,新程式碼一行都沒跑)。真正的證據是六步儀器證明:全樹重導 **12142 條 / builder 覆蓋 75 檔**、兩檔 round-trip 逐 byte 相同、**故意破壞 header 的負向控制必須 exit 1** |
| **前置** | P0 |
| **commit 粒度** | 一顆 |

> **minifier 必須是 CleanCSS `level 0`**,不是 Marble 用的 level 1(實測 level 1 有 60 檔差異,
> 且會改寫值、刪掉 IE star hack、重排 selector list,`all:false` 關不掉)。
> level 0 不做的兩件事由 builder 自己做:`stripComments()`(留 `/*!` 授權註解)與
> `tidyMediaPreludes()`(`@supports` **故意不收緊**)。

#### P3 —— 元件轉換 74 檔(工作量主體)

| | |
|---|---|
| **目標** | 74 個元件檔 `.less` → `.css`。作法是**拿編譯輸出當新的原始碼** —— 值已是 `var(--zk-*)`、mixin 已展開、格式可讀,所以正確性是**構造上保證**的 |
| **輸入 → 輸出** | 74 個 entry `.less` → 74 個 `.css`(來源樹會長出 74 個新的 `css/` 目錄);來源端變成 **74 `.css` + 3 `.less` = 77** |
| **驗收閘門** | **G-zero** —— 每一檔、每一批、以及全樹。**閘門過了不等於這一步可以結束**:還要過四層人工複核,並等人工確認才進下一步 |
| **前置** | P2;全樹經 CSS 路徑的位元組相同率已量;`check:build-css` 綠燈(讓步 0 失敗只剩一個解釋);workflow 腳本能表達步階制 |
| **commit 粒度** | **一檔一顆**(~74);工具改動與轉換**分開 commit** |

轉換程序(`scripts/less2css.js`,六步):
複製 entry `.less` → 把 `//` 註解改寫成 `/* */` → 不壓縮編譯 → 去掉 taglib header →
寫成 `<pkg>/css/<name>.css`(縮排轉 **tab**)→ 刪除原 `.less` → 逐檔 `cssdiff` 必須 0。

> **註解改寫只能對「正在轉換的入口檔」做,不能對共用 partial 做** —— 對整棵樹套用會把
> 變數檔的 40 多條 section 註解灌進**每一個**元件輸出。這也是唯一能損壞「值」而不是「註解」
> 的一步,所以它有獨立的單元測試。

#### P4a —— vendor prefix 純移除(A 群)

| | |
|---|---|
| **目標** | 移除 A 群前綴宣告(`border-radius` 532 / `transform` 181 / `box-shadow` 168 / `box-sizing` 60,合計 945)裡的 **non-`-webkit-` 708 條**,加上 C 群裡**同樣有無前綴同伴**的 non-`-webkit-` **80 條** = **788**。逐 rule 實測:A 群 945 條**全部**有無前綴同伴,無同伴 0 條 → **零判斷成分** |
| **輸入 → 輸出** | P3 產出的 `.css` → 同一批檔,少 **788** 條宣告(L-2 選項 C:`-webkit-` 全數保留) |
| **驗收閘門** | **G-delta** —— **只允許 `- <prefixed>`**,且屬性必須在 A 群清單內、**前綴不得是 `-webkit-`**。出現任何 `+` 記錄就是 bug;上限 **788**(~~945~~,L-2 拍板後收斂) |
| **前置** | ~~**L-2**(瀏覽器支援聲明)~~ **←2026-08-07 已拍板(選項 C)**;視覺 A/B harness 已架好並自我驗證過 ⇒ **前置全部解除** |
| **commit 粒度** | 一顆 |

> **`tablet` 的 60 條刻意不在本階。** `zkmax/css/tablet.css.dsp` 仍由 `zklessc` 從
> `tablet.less` 編出來(P7 holdout),它的前綴是 mixin 展開的產物,不是來源檔裡的字面文字 ——
> 要在本階移除就得改 `_zkmixins.less` 的定義,而那正是本節下面明文否決過的變體。
> 因此 **P4a = 788 − 60 = 728**,那 60 條(`border-radius` 24 / `box-shadow` 12 /
> `box-orient` 12 / `box-flex` 9 / `background-size` 3)**隨 P7 一起處理**,
> 並計入 P7 的 delta。`check-p4a-delta.js` 用 `DEFERRED` 明文擋住 tablet 在本階被動到。

> **本階起,`cssdiff` 的 exit code 不再是通過訊號。** 它問「candidate 是否**等於**
> baseline」,而 G-delta 的正確答案就是「不等於」。判準改為 `npm run check:p4a`
> (`scripts/check-p4a-delta.js`)exit 0 —— 它問的是**正確的下一個問題**:
> 「差異是否**恰好等於**已核准的 delta?」同理 `check:bytes`(第 2 層)與
> `check:build-css`(第 1 層)在本階之後會轉紅,**這是結構必然,不是缺陷**;
> ~~兩者尚無 delta-aware 版本,列為待處理(**S41**)。~~
> **←2026-08-07 同日補上(S41 裁示選項 A,S44 結案)。** 那 728 條是 `baseline/` 的
> **純函數**(四個條件全部讀得出來),所以 `scripts/p4a-delta.js` 重新推導出來,
> 兩支複核改與**調整後的基準**比對:`baseline/` 不動、無 manifest、無快照。
> **P7 的第二段 delta 沿用同一個機制**:在 `p4a-delta.js` 解除 `DEFERRED` 並更新
> `EXPECTED_REMOVALS`,兩支複核自動跟上,不需要再改一次。

#### P4b —— vendor prefix 逐條判斷(C 群)

**DONE(2026-08-10)。** 決策清單:[tasks/p4b-decisions.md](../tasks/p4b-decisions.md)

| | |
|---|---|
| **目標** | C 群 143 條手寫前綴宣告裡,**L-2 拍板後真正需要判斷的只剩 15 條** —— non-`-webkit-` 且所在 rule 裡**沒有**標準宣告者:`-moz-appearance` 6 / `-ms-zoom` 3 / `-ms-touch-action` 2 / `-moz-user-select` 2 / `-ms-flex-align` 1 / `-khtml-user-select` 1。其餘 C 群 non-`-webkit-` 80 條有同伴 → 併入 P4a;`-webkit-` 48 條保留 |
| **輸入 → 輸出** | 同上 → ~~**15**~~ **14** 條(見下方 holdout)的移除與成對替換:**移除 14 條前綴宣告、新增 7 條標準宣告**,涉及 **9 個輸出檔** |
| **驗收閘門** | **G-delta** —— 允許 `- <prefixed>`,或**成對**的 `- <prefixed>` + `+ <standard>`;**落單即為 bug**。**B 群 44 條 carve-out 與 `-webkit-` 285 條真前綴都不得出現在 diff 裡**。實作為 `npm run check:p4b`(`scripts/check-p4b-delta.js`),八項斷言 |
| **前置** | 同 P4a。**carve-out 清單必須在動手前就存在**,否則這一階的閘門實際上失效 |
| **commit 粒度** | 一顆 |

> **實測 14 條,不是 15 條。** 那 15 條的第 15 條(`-moz-appearance: none`)落在
> **P7 holdout `zkmax/css/tablet.css.dsp`** —— 和 P4a 讓掉的 60 條同一個理由:它仍由
> `zklessc` 從 `tablet.less` 編出來。**P4b = 15 − 1 = 14**,那 1 條計入 P7 的 delta。
> 原本寫「15 條」時沒有把 holdout 拆出來。

> **判準是「選讓現代瀏覽器行為不變的那一邊」,而且雙向都會用到。**
> `-moz-appearance` / `-moz-user-select` 今天 Firefox **確實吃**,純移除會退化 ⇒ **改名成標準屬性**;
> `-ms-zoom` / `-ms-touch-action` / `-ms-flex-align` / `-khtml-user-select` 今天沒有任何現代瀏覽器吃,
> 純移除等於沒動,**補標準宣告反而是新增行為** ⇒ **純移除**。
> 兩個方向都收斂到「不改行為」,所以 **P4b 沒有夾帶任何功能變更**。
> `-ms-zoom` 三條各是其 block 的唯一宣告,連 selector 一起移除(`remove-rule`,並斷言 block 確實只有那一條)。

> **P4b 的 delta 不是 `baseline/` 的純函數,這是它與 P4a 的結構差異。** P4a 的母體是
> 「有無前綴同伴」,規則讀得出來;P4b 的母體**恰好是其補集**(孤兒),所以沒有規則能決定
> 每一條該怎麼辦 —— 那是判斷。核准清單因此是 `scripts/p4b-delta.js` 裡的**明文 table**
> (14 筆,每筆帶 `count`),理由逐條寫在 [tasks/p4b-decisions.md](../tasks/p4b-decisions.md)。
> **14 筆是人真的複核得完的量,這正是 P4 當初拆成「可推導的一半」與「要判斷的一半」的理由。**

> **兩支 shape 閘門互相把對方的 delta 從 baseline 側抵銷掉**,各自只看得到自己那一段:
> `check:p4a` 的左側是 `baseline + P4b`、`check:p4b` 的左側是 `baseline + P4a`。
> 這樣 **`check-p4a-delta.js` 的六項斷言一條都不必放寬** —— 它看到的樹就跟 P4b 從未發生過一樣。
> 兩者順序可交換,由 `p4b-delta.js` **實測斷言**(不是用講的)。
> 第 1、2 層(`check:bytes`、`check:build-css`)則與 `baseline + P4a + P4b` 逐 byte 比對;
> 這一層抓得到 shape 閘門看不到的東西 —— 例如改名後的宣告**落在什麼位置**。

> **本階順帶量到、但結構上不在母體裡的三類殘留(都不動,列為後續議題)** ——
> 普查是按「**屬性**帶不帶前綴」做的,所以以下三類它**看不到**:
> ① 無前綴的 `zoom: 1` **22 條**(同樣是死掉的 IE hasLayout hack,只是沒有前綴);
> ② 前綴在**值**上的 `display: -ms-flexbox` / `-webkit-box` / `-moz-box` / `-ms-inline-flexbox` **13 條**;
> ③ 前綴 **pseudo selector** 約 **79 處**(`::-moz-placeholder`、`:-ms-input-placeholder`、`::-ms-check` …)。
> 動它們會讓本階的 diff 超出已核准的 14 條,違反 G-delta,所以**明確不做**。

> **B 群 44 條不是死前綴,是唯一寫法** —— `-webkit-font-smoothing` 16、
> `-moz-osx-font-smoothing` 16、`-webkit-touch-callout` 6、`-webkit-tap-highlight-color` 4、
> `-webkit-user-drag` 1、`-webkit-user-modify` 1。它們**從來沒有標準化過**,移除等於刪功能,
> 而且長得跟可移除的**一模一樣**。分群按**屬性**而不是按「哪個 mixin 產生的」——
> `.userSelectNone()` 一個 mixin 裡就有三種命運。

#### P5 —— `norm.css`:tokens + reset + 全域

| | |
|---|---|
**DONE(2026-08-06,commit `fea5f32` + `a03edcf`)。**

| | |
|---|---|
| **目標** | 把 `norm.less`(輸出端 **1500** 條)拆成 tokens / palette / reset / 全域四類檔案,由 `build-css.js` 串接;~~`browserDefault` 從 descendant selector 改成 `@scope`~~ **←不採用,見下方** |
| **輸入 → 輸出** | `norm.less` → `zul/css/tokens/_default.css`、`_compact.css`、`_iceblue.css`、`base/_reset.css`、`norm.css` |
| **驗收閘門** | ~~G-delta~~ → **G-zero** —— **842**(現為 **862**)個 token 宣告零差異之外,**整份 `norm.css.dsp` 都零差異**:runtime 行為完全沒動,所以不需要 `browserDefault` 開/關兩種設定的 computed-style A/B |
| **前置** | **兩項都已解除,P5 可開工。** ~~視覺 A/B harness~~ **←已完成(2026-08-05,見 L2.4)**(**這一階價值最高** —— declaration diff 看不出「誰被選到」變了;但採信範圍受 **S33** 限制:低頻元件不能單獨拿它收工)。~~另一個前置:先修 `less2css.js` 的 CR 處理(S16)~~ **←已完成(2026-08-06,紀錄 #46)** —— `norm.less` 匯入的 `_reset.less` 431 個 CR / 13 個 `//` 註解,轉換器修好之前會產出 13 個 `/* x\n */` 畸形註解,現在是 **0**。**另有一項本階段才發現的隱藏前置**:原本的 `@scope` 寫法其實相依於未拍板的 **L-2**,選了遮罩法之後這個相依消失 |
| **commit 粒度** | ~~~5 顆~~ → **2 顆**(機制 `fea5f32` / 轉換 `a03edcf`)—— 拆出來的 5 個檔案不是 5 個獨立結構決策,而是**同一個決策的 5 個部位**:`norm.less` 存在或 `norm.css` 存在,中間沒有可交付的狀態 |

> **`browserDefault` 不改 `@scope`,改用 build 期遮罩** —— 決策記錄
> [browserdefault-masking.md](browserdefault-masking.md),被否決的選項見
> [tasks/p5-browserdefault-options.md](../tasks/p5-browserdefault-options.md)。
>
> 理由是實測出來的:輸出端有**兩種**形狀 —— **90** 個 selector 前綴,`@scope` 表達得出來;
> 但還有 **3 對整塊 `<c:if test="${empty …}">`**,`@scope` **表達不出來**。embed 模式下
> `html` / `body` / `main` 不是要被 scope,是**必須不存在**,而 CSS 沒有「不存在」這個運算子。
> **所以 `@scope` 不會讓 DSP 消失**,卻會把閘門從 G-zero 拉成 G-delta,再加上一個未拍板的
> **L-2** 相依(`@scope` 需要 Chrome/Edge 118+、Safari 17.4+、Firefox 128+)。
>
> 改用的做法是 `HOSTILE_CONSTRUCTS` 那條 DSP 守衛**自己開的處方**:來源檔寫合法 CSS 佔位符
> (`.ZKBD `、`/*!ZKBD-OFF-*/`),`build-css.js` 在 minify **之後**還原成 DSP。守衛沒有被放寬 ——
> `assertMinifierSafe()` 改成跑在去註解後的文字上(壓縮器真正看到的東西),來源檔裡出現真的
> DSP 標籤依舊 hard-fail。
>
> `@scope` 的守衛**保留**:成本為零,擋的是 CleanCSS 把 `@scope` 整份清空、且只在 warnings 報。
>
> 另須沿用 Marble 已記載的限制:open float 會被移到 `document.body`、落在 `.z-page` 之外 ——
> 現行 descendant-selector 做法有**同樣**限制,所以不是回歸,**已寫進
> [browserdefault-masking.md](browserdefault-masking.md) §5**。

#### P6 —— Font Awesome 產生器

| | |
|---|---|
| **目標** | 寫 `scripts/gen-fa-css.js`。**這一階是「產生器」而不是「轉換」** —— 照 P3 的做法會產出一個 **4545 條、沒有人維護得動**的檔案。驗收條件是:使用者必須能在**不手改 4545 條**的前提下加一個 icon |
| **輸入 → 輸出** | `font-awesome.less`(來源端 910 條)+ icon 清單 → 產生器 + `zul/font/font-awesome.css` |
| **驗收閘門** | **G-zero** —— **4545** 條零差異。**外加**:codepoint 抽驗,以及「加一個 icon → 重新產生 → 只多出預期的宣告 → 移除後回到 0」的往返實測 |
| **前置** | **P2**(產生的 `.css` 要靠 `build-css.js` 才會變成輸出檔;順序反了閘門會把該檔報成 missing,看起來像產生器寫錯) |
| **commit 粒度** | — |

> **閘門的盲點要另外補**:條數相符**不代表** codepoint 正確 —— 一個寫錯的 codepoint 條數照樣過關,
> 只是渲染出錯的字形。
>
> **只有 FA 需要產生器。** 全樹迴圈分佈在 3 個階段(前提 #22),但 P3 的 `combo` 與
> P7 的 `tablet/compact/_combo` 只是把名稱扇開到選擇器前綴,**原生選擇器清單就表達得出來**;
> FA 沒有這個出路,它是 ~700 組 name→codepoint 對應,**清單本身就是資料**。
> **不要日後把「迴圈」整體誤記成「產生器問題」。**

#### P7 —— `tablet` + `@themeProfile`

| | |
|---|---|
| **目標** | 轉換 `tablet.less`(輸出端 **681** 條);把 LESS 獨有的 import path 插值(`@import "profiles/_@{themeProfile}"`)改成 **runtime `--zk-*` override sheet** —— 兩個 profile 只是同一組 842 個 token 的不同數值 |
| **輸入 → 輸出** | `tablet.less` + `profiles/` → `.css` + runtime override sheet |
| **驗收閘門** | **G-delta** —— 這是刻意的**對外 API 變更**(「改 LESS 變數重編 jar」→「載入 override sheet」),必須寫進 migration guide |
| **前置** | **L-4 的 density 那一半**(colour 那一半已由 L-7 解除)。視覺 A/B 價值中等,但 tablet 需要 mobile UA 的 Playwright 專案 |
| **commit 粒度** | 1–2 顆,與 migration guide 的對應條目成對進版 |

> **`@themePalette` 已於 2026-08-13 移出本階、移出本案**(user 裁示)。理由是**產品邊界**:
> palette 就是付費商品 Theme Pack 的內容,所以它的機制、API 與出貨物**都不屬於本模板專案**,
> 必須獨立規劃、獨立排程 —— 這正是 L3-F 的 **B4**(「23 套付費佈景是產品排程,不是工程排程」)
> 一直沒解決的那一點,現在用「切出去」而不是「排進來」解決。
>
> 獨立計畫:**`tasks/theme-pack-palette-mechanism.md`**(**刻意不進本 repo 的版控**,見 M-2)
> —— 它**不是** P0–P8 的任何一階,不進 `check:gate`,也不會動本 worktree 的任何來源檔。
>
> **本階(以及整個本案)因此少一件事、不多一件事**:`@themeProfile` 是**密度**軸,仍在本階;
> `@themePalette` 是**顏色**軸,走了。兩者共用「runtime override sheet」這個形狀,
> 但**不共用交付物** —— 不要因為形狀像就把它搬回來。
>
> **本案為 palette 要留下的東西是「零」**,這一點是量出來的:palette 的內容全部是
> `:root{--zk-*}` 覆寫(623 條 / 108 個名稱),而本主題已經出貨 **862** 個可覆寫的 `--zk-*`
> ⇒ 付費側只要在主題之後載入自己的 sheet 就成立,**不需要本專案提供任何 hook**。

> `tablet/compact/_combo.less` 的兩個 `each()` **與 P3 的 `combo` 完全同形狀**,
> 歸在同一個拍板項 **L-8** 底下處理。**不要在 P7 重新爭論一次。**

> **P4a 移交過來的 60 條前綴(2026-08-07)。** L-2 選項 C 的移除範圍裡,`tablet.css.dsp`
> 佔 **60** 條(`border-radius` 24 / `box-shadow` 12 / `box-orient` 12 / `box-flex` 9 /
> `background-size` 3),因為本階之前它仍由 `zklessc` 從 mixin 展開,不是來源檔裡的字面文字。
> **本階轉成 `.css` 之後要一併移除**,並計入 P7 的 delta ——
> P8 的 G-zero 核帳是 P4 + P5 + P7 三段相加,這 60 條必須落在 P7 那一段,不能兩邊都不算。
> 驗收方式與 P4a 相同:移除後每一條在同一個 rule 裡都要有無前綴同伴,`-webkit-` 不動。

> ~~**P7 順手要補的既有缺口**(**S29**)~~ **←2026-08-13 改判:不補,隨 P8 消失。**
> 缺口本身的事實不變(見
> [進度文件附錄 L3-I](iceblue-drop-less-progress-appendix.md#l3-i-change-log--狀態層的敘述更正)):
> `zul/less/_zkcssvariables.less` 少了 `@import "colors/_@{themePalette}_css";`,連帶
> `zul/less/colors/` 底下沒有 `_iceblue_css.less`(ZK 10.4 兩者都有);對 `iceblue` 零影響
> (ZK 那份只有 34 B 註解),但換成別的 palette 會**靜默失效**。
>
> **改判的理由是「修的對象即將不存在」,而且現在比 2026-08-05 更確定**:
>
> - `@themePalette` 已移出本案(見上一則),所以本案**不會**再有「override sheet 要表達得出
>   palette 覆蓋」這條驗收 —— 那條驗收跟著 palette 一起走了。
> - 那條 import 只存在於 `.less`,而 **P8 讓 `.less` 歸零** ⇒ 缺口在 P8 自動消失,
>   補它等於**為一個要被刪掉的檔案寫一行,再刪掉**。
> - **殘留風險要寫下來,不要只說「不修」**:在 P8 之前,任何照 `readme.md` 設 `@themePalette`
>   的人拿不到 palette 的 `--zk-*` 覆蓋。**處置是文件而不是程式** ——
>   `readme.md` 教 `@themePalette` 的那一行本來就要在 P8 的 migration guide 一併換掉
>   (換成「載入 override sheet」),把這個殘留寫在那裡。
> - 若日後仍決定補:成本是**補 import + 補 34 B 的檔,必須成對**(只補 import 會找不到檔、
>   建置直接失敗),兩者都不改輸出 ⇒ **G-zero**,任何時點都做得,不擋任何階段。

> **P7 順手要收的第二個缺口**(**S36**,2026-08-06 裁示接受到本階為止):**P5 之後 compact
> profile 暫時要設兩處** —— `zul/css/norm.css` 的第一行 `@import`(桌機)與
> `_zkvariables.less` 的 `@themeProfile`(zkmax tablet,仍是 LESS)。
>
> - **只設後者會得到「桌機 default + 平板 compact」的分裂主題,而且沒有任何檢查看得到** ——
>   第 4 層已實測:`norm.css.dsp` 與 default 建置**逐 byte 相同**(仍是 16px),
>   `tablet.css.dsp` 卻真的切換了。目前只靠 `readme.md` 的文字擋著。
> - **不另外為此寫建置期檢查** —— 本階的 runtime override sheet 會把兩個旋鈕一起換掉,
>   為一個即將刪掉的機制寫檢查不划算。
> - **P7 驗收時要順便把 `readme.md` 的兩處寫法一起收掉。**

#### P8 —— 收尾

| | |
|---|---|
| **目標** | 刪除 LESS partial、移除 `zkless-engine` 依賴與 pom 的 `zklessc` execution、`build-css.js` 長出 `.less` 分支接手引擎的工作、更新 readme、寫 migration guide |
| **輸入 → 輸出** | 3 個 holdout + LESS partial → 全樹純 CSS 來源 + migration guide |
| **驗收閘門** | **G-zero** —— 全樹最終輸出 vs P0 baseline,差異必須**完全等於 P4 + P5 + P7 三階段已核准的 delta 總和,不多不少**。核帳資料來自進度文件 L3-A〈閘門紀錄〉,所以那份紀錄**不能事後補、不能改寫既有列** |
| **前置** | 兩張規則表必須在刪檔**之前**產生(**有期限,已完成**);工具要能在客戶自己的 fork 上跑 |
| **必做的退場動作** | **把 `baseline/` 移回 `.gitignore`(S47)。** 它在 2026-08-10 被**暫時**改為追蹤,理由是 S45 —— 不進版控就沒辦法用 `git status` 證明第 4 層沒動它。本階核帳完成、`baseline/` 不再是活躍的比對對象之後,恢復忽略,`doc/baseline-manifest.sha256` 繼續負責釘位元組。退場條件與理由寫在 `.gitignore` 該段註解裡 |
| **順手要收的既有欠帳** | **S14 + S37,2026-08-06 裁示留到本階一次處理。** `gen-var-table.js --check` 目前 exit 1,而且是**兩件事疊在一起**:①`EXPECTED` 停在 ZK 10.4 補齊之前(846/842,實測 866/862);②liveness **只掃 `.less` 樹**,所以每轉一個檔就有更多變數名字失去最後一個引用點(P5 這次 773 → 837)——**到本階會收斂成「全部都死」,而那正是正確答案**。連帶 `doc/migration/less-var-to-token.{md,json}` 現在指向已刪路徑,**不能靠現在重跑產生器解決**(會把 ①② 的漂移一起烘進文件)。**本階 `.less` 歸零之後,重定 `EXPECTED` + 重跑產生器 + 更新路徑是一次到位的** |
| **commit 粒度** | — |

> **`build-css.js` 接手 `zklessc` 的三個地雷**:(1) `.less` 路徑**不可以**前置 taglib header
> —— LESS 會自己吐,加了會變兩份;(2) `.less` 路徑**不可以**套 `HOSTILE_CONSTRUCTS` 守衛
> —— `norm` 與 `tablet` 本來就合法地帶著選擇器位置的 DSP tag,會被誤殺;(3) `~./` 改寫
> **必須**維持 entry-buffer-only,否則會無聲地合法化 S1 守衛存在的目的。
>
> **migration guide 必須寫明逃生門**:客戶可以把被刪掉的 partial vendor 進自己的 fork,繼續用 LESS。
> **「升級到 ZK 11」和「跟著棄用 LESS」是兩個可以分開的決定。**

### L2.4 前置工作項(不是階段,不產生 theme 輸出)

| 工作項 | 是誰的前置 | 內容 | 狀態 |
|---|---|---|---|
| **視覺 A/B harness** | P4 / P5 / P7 | **重用 Marble 既有的 preview 頁面與 Playwright,不搬語料進本分支**。只需讓 preview app 能載入本模板編出的 theme jar;A/B 兩邊是**同一分支的兩次 build**。**先拿同一個 build 截兩次確認 diff 為零**,才可以拿它比對不同 build | **DONE**(2026-08-05)—— 語料 **116 頁**、自我驗證 **0 差異**、反向控制 **36 頁**。規格 [visual-ab-harness.md](visual-ab-harness.md) |
| **規則表產生器** | P8(**有期限** —— 來源檔會被刪) | `scripts/gen-var-table.js` + `scripts/gen-mixin-table.js`,各自自帶斷言、輸出跨次執行 byte-identical、可在客戶 fork 上重跑 | **DONE** |

> **harness 的訊號品質限制要記住**:157/158 個 preview 頁面用到 IceBlue 沒有的 `z-*` utility
> class,塌掉的版面可能遮住 P4/P5 改到的 border / shadow / spacing。
> **看到乾淨的 diff 時,別把「沒看到差異」當成「沒有差異」。**

### L2.5 執行機制

`scripts/workflow/iceblue-drop-less.mjs` —— **一次跑一個階段**,用 `{phase:"…"}` 指定;
**P3 必須加 `{step:0|1|2|3|4}`**,一次只跑一步、跑完就回傳(沒有迴圈)。
被 gate 住的階段會回報 blocked 與原因,不會偷跑;已完成的階段回報 `done` 而不是 `blocked`
—— 呼叫端對這兩者的處置不同。

形狀是**序列轉換 → 並行複審 → 序列套用複審結果**:轉換不並行(整棵樹編譯只要 ~1.4 秒,
沒有時間可省,而共用來源樹與 git index 會互相踩);**真正該 fan-out 的是複審**,因為它是唯讀的。

**階段之間不串接** —— 每個階段邊界都是「閘門 + 人工複審」,一次跑完好幾階的背景執行
會在**跳過那些檢查點**的情況下回報成功,而檢查點正是讓結果可信的東西。

> **規格寫了工具做不到的事,實務上就是那條規格被無聲忽略。** 這是步階制必須進到工具裡
> (而不是只寫在文件上)的理由。

---

## L3 技術附錄(獨立檔)

L3 全部收在 **[iceblue-drop-less-plan-appendix.md](iceblue-drop-less-plan-appendix.md)** ——
原文保留的微觀細節:行號、commit hash、byte 差異、實測 log、變更歷史。
L1/L2 只寫當前結論;**要知道某個結論是怎麼來的、以及它推翻了什麼,去那裡。**

> **為什麼分檔**:執行期只需要 L1/L2(本檔 415 行),附錄是 1691 行 —— 佔原本單檔的 **83%**。
> 分檔讓執行子代理讀規範時不必連帶載入整份史料。量測與評估見
> [iceblue-drop-less-doc-split-evaluation.md](iceblue-drop-less-doc-split-evaluation.md)。
> **附錄不定義任何規範**;規範全部在本檔 L2。下表的〈何時要看〉就是判斷要不要打開附錄的依據。

| 節 | 內容 | 何時要看 |
|---|---|---|
| **[L3-A](iceblue-drop-less-plan-appendix.md#l3-a-決策依據為什麼要放棄-less)** | 決策依據:為什麼要放棄 LESS(A1–A8 贊成 / B1–B8 反對 / 淨判斷) | 有人問「為什麼要做這件事」、或要寫對外賣點時 |
| **[L3-B](iceblue-drop-less-plan-appendix.md#l3-b-已驗證的前提實測不是推論)** | 已驗證的前提 22 項 + `.css.dsp` 產出流程圖 | 每個階段的判斷都建立在這上面 |
| **[L3-C](iceblue-drop-less-plan-appendix.md#l3-c-驗證策略與方法學)** | 驗證方法學細節:`cssdiff` 設計、四層複核、5 類封閉清單、步階、commit 粒度論證 | 要複核閘門結果、或要改動閘門時 |
| **[L3-D](iceblue-drop-less-plan-appendix.md#l3-d-各階段的技術細節與論證p0-p8)** | 各階段的技術細節與論證(P0–P8 原文) | 實作某一階之前 |
| **[L3-E](iceblue-drop-less-plan-appendix.md#l3-e-風險)** | 風險表 | 開工前、以及每次覺得「這樣應該沒問題」時 |
| **[L3-F](iceblue-drop-less-plan-appendix.md#l3-f-決策紀錄)** | 決策紀錄(L-2 / L-4 / L-5 / L-7 / L-8 與六次追加拍板) | 要知道某個選擇是誰、何時、依據什麼拍的 |
| **[L3-G](iceblue-drop-less-plan-appendix.md#l3-g-change-log--規範層的斷言變更)** | **Change Log —— 被推翻的敘述與更正過程** | 看到兩個矛盾的數字時 |
| **[L3-H](iceblue-drop-less-plan-appendix.md#l3-h-進度記錄制度)** | 進度記錄制度:為什麼記在被追蹤的 `doc/`、規範與狀態為什麼分離 | 要改文件結構時 |

#### 舊章節編號對照(L3 內文與外部文件仍在用)

L3 各節是**原文保留**的,所以裡面的 `§0`、`§2.6`、`§P4` 這類指涉沿用舊編號。
外部文件(`scripts/`、`doc/migration/*.md`)引用的 `§P4` / `§P8` 也是舊編號,
而且它們連到的是**本檔** —— 所以這張對照表留在這裡,不搬進附錄。
下表凡標 **L3-x** 的都在 [iceblue-drop-less-plan-appendix.md](iceblue-drop-less-plan-appendix.md);
標 **L2.x** 的在本檔。對照如下:

| 舊編號 | 現在在哪 |
|---|---|
| `§0` 範圍 | **L2.1 範圍** |
| `§1`、`§1.1`–`§1.3` | **L3-B**(小節編號原樣保留) |
| `§2`、`§2.1`–`§2.6` | **L3-C**(小節編號原樣保留);判準的**規範版**在 L2.2 |
| `§3`、`§P0`–`§P8` | **L3-D**(階段標題原樣保留);**規範版**在 L2.3 |
| `§4` 風險 | **L3-E** |
| `§5` 進度記錄 | **L3-H** |
| `§6` 決策 | **L3-F** |
| `§4.4` / `§8.1` / 「評估文 §6」 | **懸空** —— 指向一份從未進版控的評估文,見 **L3-G**〈未修的已知問題〉 |

---

## 附:跨主題待辦裁示(不屬於本案任何階段)

> 記在本檔最後,是因為這些事**由本案的裁示產生、但要在本 worktree 之外執行**,
> 不屬於 P0–P8 任何一階,也不進任何閘門。
> **本案不會動 Marble 的任何檔案(M-1),也不會實作 palette 的任何一行(M-2)。**

### M-1 Marble 的 `Density.COMFORTABLE` 改名為 `DEFAULT`

| | |
|---|---|
| **裁示** | **要改,但不是現在**(2026-08-12) |
| **方向** | 由 **Marble 改成 `default`**,不是 iceblue11 改成 `comfortable` |
| **執行地點** | `../zkThemeTemplate`(`master` 系),**不是本 worktree** |
| **觸發時機** | 以下**任一**先發生:(a) [l4-density-mechanism.md L3.4 第 2 項](../tasks/l4-density-mechanism.md#l34-未決事項需要裁示)裁示把 density API 升格進 ZK core 成為跨主題契約;(b) Marble 首次公開發行前 |

**起因**:L-4 裁示 iceblue11 的密度屬性字彙為 `default` / `compact`
(`Density.DEFAULT("default")`),與 Marble 現行的 `COMFORTABLE("comfortable")` 分岔。

**為什麼方向是 Marble 改**:`default` / `compact` 與 ZK 既有語彙一致 ——
本主題的兩個 profile 檔就叫 `_default.css` / `_compact.css`,ZK 出貨的第二個 jar 叫 `iceblue_c`(= compact);
**`comfortable` 在 ZK 的語彙裡從未出現過**,它是 Marble 從 MD3 借來的字。
兩邊都尚未公開發行,對齊方向沒有相容性成本,所以由**語彙較外來的那一邊**改。

**為什麼不是現在**:
1. 兩主題目前各自獨立,**沒有共用 API**,分岔期間沒有任何實際影響;
2. 現在改要跨分支動另一個主題的來源檔,而那些改動與本案的閘門(G-zero / G-delta)無關 ——
   混進 P4–P8 的驗收窗口只會讓 `git log -S` 與閘門歸因變髒;
3. 真正需要統一的時點是「升格為跨主題公開 API」,而那件事本身還沒拍板。

**實測範圍(不是估的,2026-08-12 掃過 Marble 工作樹)**:

| 要改 | 位置 | 量 |
|---|---|---|
| 列舉常數 + token 字串 | `src/main/java/org/zkoss/theme/marble/MarbleDensity.java:42` | 1 |
| Javadoc 散文 | 同檔 `:32`、`:41`、`:77` | 3 |
| 屬性缺席時的 fallback 字面值 | `src/test/resources/web/usecase/report-issue.js:27` | 1 |
| 規格散文 | `doc/spec/data-dense-mode.md`(1)、`doc/spec/tablet-design-overview.md`(5)、`tasks/data-dense-mode.md`(1) | 7 |

**兩件容易改錯的事,先寫下來**:

- **CSS 一個字都不用改。** 實測 `data-density="comfortable"` 作為**選擇器**出現 **0 次** ——
  Marble 的 CSS 只認 `[data-density="compact"]`,comfortable 態 = **屬性缺席**。
  這也是為什麼這次改名的實際成本這麼小(先前口頭估的「規格與 `marble-compact.css` 都要一起改」是高估)。
- **`--zk-touch-target-comfortable` 不可跟著改**(`zkmax/css/tablet/_tokens.css`)——
  那是 MD3 觸控目標尺寸(48dp),與密度列舉**無關**,同名只是巧合。
  `zul/css/tokens/_sizing.css` 裡的 `comfortable` 也全是散文,不是屬性值。

---

### M-2 `@themePalette` 的機制與 API 移出本案

| | |
|---|---|
| **裁示** | **移出,而且是現在**(2026-08-13,user 裁示) |
| **理由** | **產品邊界** —— palette 就是付費商品 Theme Pack 的內容,所以它的機制、Java API 與出貨物**都不屬於本模板專案**,必須獨立規劃、獨立排程 |
| **執行地點** | Theme Pack 後繼產品(**不是**本 worktree、**也不是** Marble) |
| **獨立計畫** | `tasks/theme-pack-palette-mechanism.md` —— **不是** P0–P8 任何一階,不進 `check:gate` |
| **為什麼那份計畫不進本 repo 的版控** | **它不是本 repo 的檔** —— 交付物屬於 Theme Pack 後繼產品,計畫要隨產品搬到那邊的 repo。依 [task-doc-tracking-policy.md](task-doc-tracking-policy.md),這種檔在本 repo 只能用**引註**(行內 code)提及,不能用 markdown 連結 —— 所以本檔與附錄、進度文件裡的 7 處全部是引註。**代價要知道**:`check:doc-refs` 不會替它守著,本 repo 裡沒有任何東西保證那份計畫還在;產品那邊建好 repo 之後,這裡的引註要換成該 repo 的位址 |

**本案因此的變動,全部是「少做」**:

| 項目 | 原本 | 現在 |
|---|---|---|
| §P7 標題與交付項 | `tablet` + `@themeProfile` / **`@themePalette`** | `tablet` + `@themeProfile` |
| §P7 的 palette 驗收條(「override sheet 要表達得出 palette 覆蓋 + 一次非 iceblue 實測」) | 交付項 | **移除**(跟著 palette 走) |
| **S29**(`_zkcssvariables.less` 缺 palette import) | P7 交付項 | **不補**,隨 P8 的 `.less` 歸零消失;殘留風險寫進 migration guide |
| L3-F 的 **B4**(「23 套付費佈景是產品排程」) | 未解決、本案最可能被外力延遲的一點 | **解除** —— 用「切出去」而不是「排進來」 |

**本案為 palette 要留下的東西是「零」,這是量出來的**:palette 的內容全部是 `:root{--zk-*}`
覆寫(**623 條 / 108 個 token 名稱**,ZK 出貨的 26 個非空 palette),而本主題已經出貨
**862** 個可覆寫的 `--zk-*` ⇒ 付費側只要在主題之後載入自己的 sheet 就成立,
**本專案不需要提供任何 hook、任何 Java API、任何 DSP 條件**。

**兩件容易改錯的事,先寫下來**:

- **`@themeProfile` 沒有跟著走。** 它是**密度**軸(L-4),仍在 P7 / D4 / D5。
  兩軸共用「runtime override sheet」這個**形狀**,但**不共用交付物** ——
  不要因為形狀像就把 palette 搬回來,也不要因為 palette 走了就以為 density 也走了。
- **`colors/_iceblue.less` 與 `_header.less:7` 的 `@import "colors/_@{themePalette}"` 仍在樹上**,
  由 **P8** 隨其他 LESS partial 一起刪。**本裁示不是「現在動手刪 palette 相關來源檔」** ——
  現在刪會製造一個不屬於任何已核准 delta 的差異。
