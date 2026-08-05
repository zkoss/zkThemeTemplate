# IceBlue 棄用 LESS —— 進度紀錄(狀態)

> **本文件只記狀態,不定義規則。** 階段定義、G-zero / G-delta 判準、範圍邊界、**術語表**
> 一律看 [iceblue-drop-less-execution-plan.md](iceblue-drop-less-execution-plan.md)。
>
> 狀態詞彙沿用元件 harness 既有的:`TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`。
>
> 依 `.claude/skills/plan-spec/SKILL.md` 的三層式架構編排:
> **L1** 一頁執行摘要 · **L2** 階段進度 · **L3** 技術附錄(閘門紀錄、複核包、Change Log)。
> **L1/L2 只寫當前狀態;被推翻的敘述與更正過程一律在 L3-I Change Log。**
>
> **本檔只有 L1 + L2 + L3 索引。** 內文提到的 `L3-A`…`L3-I` 全部在
> [iceblue-drop-less-progress-appendix.md](iceblue-drop-less-progress-appendix.md);
> 執行一個階段只需要本檔,附錄按〈[L3 技術附錄](#l3-技術附錄獨立檔)〉的「何時要看」欄按需開啟。

---

## 目錄

- **[L1 執行摘要](#l1-執行摘要)** — 現況 · 里程碑 · 總體進度 · 下一步
- **[L2 階段進度](#l2-階段進度)**
  - [L2.1 階段狀態](#l21-階段狀態)
  - [L2.2 前置工作項與 BLOCKED](#l22-前置工作項與-blocked)
  - [L2.3 P3 批次與步階](#l23-p3-批次與步階已收工-7474) — 已收工 74/74
  - [L2.4 P3 來源清理待辦](#l24-p3-來源清理待辦7-項排在-p3-全部轉完之後) — 7 項,**1–4、6 已收工**,剩 5、7 等 P4
  - [L2.5 交給 P8 的產品面問題](#l25-交給-p8-的產品面問題2026-08-033-項不阻擋-p4-p7) — 3 項
- **[L3 技術附錄](#l3-技術附錄獨立檔)** — 索引在本檔;**內容在 [iceblue-drop-less-progress-appendix.md](iceblue-drop-less-progress-appendix.md)**
  - [階段與 commit 對照](iceblue-drop-less-progress-appendix.md#階段與-commit-對照)
  - [L3-A 閘門紀錄](iceblue-drop-less-progress-appendix.md#l3-a-閘門紀錄附加式不覆寫) — 35 列,附加式不覆寫
  - [L3-B Tier 1](iceblue-drop-less-progress-appendix.md#l3-b-tier-1p1--s0--s1) — P1 = S0 + S1
  - [L3-C P2 儀器證明](iceblue-drop-less-progress-appendix.md#l3-c-p2-儀器證明)
  - [L3-D P0 交付物、基準、突變測試](iceblue-drop-less-progress-appendix.md#l3-d-p0-交付物基準的不可變性突變測試)
  - [L3-E 前提的修正](iceblue-drop-less-progress-appendix.md#l3-e-前提的修正與順手撿到的發現)
  - [L3-F P3 逐檔複核包](iceblue-drop-less-progress-appendix.md#l3-f-p3-批次的檔案清單每一步可以自己檢查什麼步-0-4-的逐檔複核包) — [步 0](iceblue-drop-less-progress-appendix.md#步-0-的複核包2026-07-31) · [步 1](iceblue-drop-less-progress-appendix.md#步-1-的複核包2026-08-034-檔) · [步 2](iceblue-drop-less-progress-appendix.md#步-2-的複核包2026-08-0315-檔--批-1-收工-2020) · [步 3](iceblue-drop-less-progress-appendix.md#步-3-的複核包2026-08-0343-檔--批-2-收工-6374) · [步 4](iceblue-drop-less-progress-appendix.md#步-4-的複核包2026-08-0311-檔--批-3-收工p3-收工-7474)
  - [L3-G P3 收工複審](iceblue-drop-less-progress-appendix.md#l3-g-p3-收工複審74-檔獨立-fan-out2026-08-04計畫書-l3-c-26-第-4-層首次執行) — 74 檔獨立 fan-out
  - [L3-H 執行機制:workflow](iceblue-drop-less-progress-appendix.md#l3-h-執行機制workflow)
  - [L3-I Change Log](iceblue-drop-less-progress-appendix.md#l3-i-change-log--狀態層的敘述更正) — 22 條狀態層更正

---

## L1 執行摘要

**最後更新**:2026-08-04

### 現況

**核心命題已經證明完畢** —— IceBlue 的 **74 個元件輸出不需要 LESS,而且是零差異證明的**。
**P6 收工後**來源端是 **75 `.css` + 2 `.less` = 77 ✓**;剩下的 2 個 `.less` 是**刻意**保留的
holdout(`norm`/P5、`tablet`/P7)。全樹閘門 `files differing: 0`(77 輸出檔 / 14323 輸出端條數),
而 `build-css.js` 現在覆蓋 **75 檔 —— 正好是 P2 儀器預估的上限,builder 覆蓋率到頂**。

**來源端的清理也做完了** —— L2.4 第 1–4、6 項於 2026-08-04 收工:**空殼規則全樹歸零**
(15 → 0),`check:build-css` 的封閉清單從 **5 類降到 4 類**(「空規則」那一類整個消失),
註解位置錯誤 55 處 / 28 檔全部歸位。**閘門在整個過程中沒有動過一個數字。**

**剩下的階段都是有意識的取捨**(前綴政策、reset 機制、profile API),
不是「還不知道做不做得到」。

### 里程碑

| 里程碑 | 狀態 | 一句話 |
|---|---|---|
| **M1** 基礎建設與閘門(P0 · P1 · P2) | **DONE** | 基準不可變、LESS 釘到 4.8.1、來源樹可同時容納 `.less` 與 `.css` |
| **M2** 元件轉換 74 檔(P3) | **DONE** | 74/74 轉完,逐檔閘門全 0、無一次失敗;**0 檔無法解釋** |
| **M3** vendor prefix 政策(P4a · P4b) | **BLOCKED** | 等 **L-2** 瀏覽器支援聲明;另等視覺 A/B harness |
| **M4** 三個 holdout(P5 · P6 · P7) | **1 / 3 DONE** | **P6 DONE** —— FA 的 `each()` 迴圈換成 `gen-fa-css.js`;P5 等 harness、P7 等 **L-4** 的 density 那一半 |
| **M5** 收尾與遷移指南(P8) | TODO | 兩張規則表已產出,期限風險已解除 |

### 總體進度

| 量法 | 數字 |
|---|---|
| **里程碑進度** | **2 / 5 = 40%** |
| **輸出檔脫離 LESS** | **75 / 77 = 97%** |

### 下一步(依「不等任何人」排序)

1. **視覺 A/B harness** —— P4 / P5 / P7 的共同前置。**A 側(基準)這一半已經做完**(紀錄 #34):
   `npm run check:baseline` 讓 `baseline/` 的遺失與損毀**可偵測**(78 檔 sha256,`shasum -c` 也能單獨驗),
   `node scripts/baseline-ab.js install a|b` 把側邊切換變成一個會**自我驗證**的指令(覆蓋後立刻重算
   雜湊,不符就 exit 1),`npm run ab` 印出現在裝的是哪一側。已實測無損可逆與三個負向控制。
   **`init.sh` 已於 2026-08-05 執行(theme name = `iceblue`),四個名字現在一致**(紀錄 #35),
   但**主題仍然沒有被服務,原因換成了名字撞號**:`StandardTheme.DEFAULT_NAME` 字面上就是
   `"iceblue"`,而 `resolveThemeURL` 對預設主題名**不做 `~./` → `~./<theme>/` 改寫** ⇒ 服務的是
   ZK 自己 jar 裡那份 CSS,我們的 77 個檔沒有人要求。**而且頁面看起來完全正常**(它就是真的
   iceblue,只是 jar 那份),所以 A/B 會回報零差異卻什麼都沒測到 —— 比之前的無樣式更難察覺。
   **兩條出路(見 S21)**:(a) 主題名改成不是 `iceblue`;(b) 保留 `iceblue`,把輸出目錄改成
   `web/` 本身、靠 `target/classes` 先於 jar 來**遮蔽 ZK core 的路徑** —— (b) **已用探針實測可行**,
   而且更貼近本專案的真正歸宿(`baseline/` 的路徑形狀本來就是 core 的,不是主題子目錄的)。
   **選哪一條會改到 `package.json`、閘門 candidate 路徑,以及 `doc/*.md` 裡 35 處 `target/classes/web/iceblue`
   當中真正需要跟著改的 11 處**(另外 24 處落在附加式不覆寫的 L3-A 紀錄列,是歷史,不改)**,待決策。**
   其次才是缺頁面:此 worktree 只有 `preview.zul` 一頁,且沒有 playwright。
2. **L-2** 瀏覽器支援聲明 —— 解鎖 P4a / P4b。
3. **L-4 的 density 那一半** —— 解鎖 P7(colour 那一半已由 L-7 解除)。

> **不等任何人的工作已經做完了。** L2.4 清理待辦第 1–4、6 項已於 2026-08-04 收工(紀錄 #32、#33),
> 剩下三項全部是**別人的決定或還沒建的工具**,不是可以直接開工的實作。要繼續推進,
> ~~第 1 項是唯一自己動手就能解的 —— 而且它同時解鎖三個階段。~~
> **←第 1 項只有一半是自己動手就能解的(2026-08-05)。** A 側基準那一半已收工(紀錄 #34);
> 名字統一那一步也做完了(紀錄 #35),但**主題還是沒有被服務** —— 因為 `iceblue` 正好撞上
> `StandardTheme.DEFAULT_NAME`(**S21**)。剩下的是一個二選一,兩條路都會改到輸出路徑與
> 文件裡 11 處活引用(另 24 處在附加式不覆寫的紀錄列裡,不改),所以它跟第 2、3 項同類:**等決策,不是等實作**。
> 它仍然是最該先處理的,因為**不修它,之後每一次視覺 A/B 都會回報假的零差異**。

---

## L2 階段進度

> 術語(輸出端條數 / 輸出檔數 / 元件檔 / builder 覆蓋檔數 / 批次 vs 步階 / 第 1 層)
> 一律依計畫書 **L2.0 術語表**,本文件不另立一份。
> **commit hash 是微觀細節,收在 L3**(見附錄開頭的〈[階段與 commit 對照](iceblue-drop-less-progress-appendix.md#階段與-commit-對照)〉)。
> **唯一的例外**是 L2.4 待辦第 4 項的「發現於」欄留著 `13da402` —— 那顆 commit 是
> 「這 15 處**為什麼以前看不見**」的一部分,拿掉會讓那條待辦讀不懂。

### L2.1 階段狀態

| 階段 | 狀態 | 閘門 | 關鍵量測 | 日期 |
|---|---|---|---|---|
| P0 建立工作區與基準 | DONE | G-zero | `files differing: 0`(77 輸出檔 / 14323 輸出端條數) | 2026-07-29 |
| P1 LESS 釘到 4.8.1(S0 + S1) | **DONE** | G-zero | 同上;`less` 實際解析為 **4.8.1**、engine 1.1.13;S1 守衛有負向控制 | 2026-07-31 |
| P2 雙來源 build | DONE | G-zero(**空轉** —— 證據不在閘門上) | 同上;儀器證明:全樹重導 **12142** 條 / **builder 覆蓋 75 檔**(84.8%) | 2026-07-30 |
| **P3 元件轉換 74 檔** | **DONE** | G-zero + 逐步人工確認 | **74/74 轉完**;來源端 **74 `.css` + 3 `.less` = 77 ✓**;位元組層 **26/77 逐 byte 相同**,其餘 51 檔**全部落在 5 類封閉清單內**,**0 檔無法解釋** | 2026-08-03 |
| ↳ **P3 前置**:量全樹經 CSS 路徑的位元組相同率 | **DONE** | — | **24/75 逐 byte 相同**;其餘 51 檔全部分類到 5 類封閉清單,**0 檔無法分類** | 2026-07-31 |
| ↳ **P3 前置**:`build-css.js` 要有可重跑的檢查 | **DONE** | 自我證明 + 負向控制 | `npm run check:build-css` → 75 檔 / `files differing: 0` / exit 0;負向控制(`minify` 回傳空字串)→ exit 1 | 2026-07-31 |
| ↳ **P3 前置**:workflow 腳本加 `{step}` | **DONE** | 六條路徑實測 | `{step:0..4}` = **1 / 4 / 15 / 43 / 11**,一次只跑一步;`{batch:1}` 改成**拒絕並說明** | 2026-07-31 |
| **視覺 A/B harness**(P4 / P5 / P7 前置) | TODO | 自我驗證須為 0 | — | — |
| ↳ **A 側(基準)可用性 + 完整性** | **DONE** | 無損可逆 + 三個負向控制 | `install a` → **77/77 逐 byte 等於 `baseline/`**;`install b` → 77 檔**逐 byte 回到切換前快照**;`shasum -a 256 -c doc/baseline-manifest.sha256` → **78/78 OK**(可脫離腳本驗證);manifest 損毀 → `check:baseline` exit 1 且 `install a` 拒絕 | 2026-08-05 |
| ↳ **四個名字統一**(`init.sh` 已執行,theme name = `iceblue`) | **DONE** | 閘門不得動 | registered / preferred / maven `<artifactId>` / 腳本輸出目錄 **全部 = `iceblue`**;`npm run ab` 由 exit 1 轉 **exit 0**;`web/iceblue` 首次帶齊 **29 個資產**;閘門 **77 檔 / 14323 條 / 0**(紀錄 #35) | 2026-08-05 |
| ↳ **主題有沒有被服務**(A/B 能不能看見) | **BLOCKED** | 服務出來的 CSS 必須是本主題 | **仍然不是 —— 但原因換了:`iceblue` 恰好是唯一不能用的主題名。** `StandardTheme.DEFAULT_NAME` 字面上就是 `"iceblue"`,`resolveThemeURL` 對它**不做 `~./` 前綴改寫** ⇒ 服務的是 ZK **自己 jar 裡**那份(`/zul/css/norm.css.dsp` **15824 B**),我們那份(**63125 B**)在 `/iceblue/zul/css/…` 可服務但**沒人要求**。兩側服務出來的 byte **sha256 相同**(`95c350b0…`),而我們自己的 `input.css.dsp` **確實隨側邊變**(`c6beb62e` vs `dab86e19`)⇒ 切換有效、沒人在看。**且頁面看起來完全正常**,比 S20 的無樣式更難察覺。兩條出路見 **S21**(其中「遮蔽 core 路徑」已實測可行:探針讓 `/zul/css/norm.css.dsp` 回傳 63125 B) | 2026-08-05 |
| **P4a** 前綴純移除(A 群) | BLOCKED | G-delta | **945** 條,全部有無前綴同伴 → 只允許 `- <prefixed>`,任何 `+` 都是 bug | — |
| **P4b** 前綴逐條判斷(C 群) | BLOCKED | G-delta | **143** 條,含 **26** 條須成對替換;B 群 **44** 條 carve-out 不得出現在 diff | — |
| P5 `norm.css` | TODO | G-delta | **842** 個 token 須零差異 | — |
| **P6 Font Awesome** | **DONE** | G-zero | **4545** 條零差異;產生器輸出與被刪掉的 `.less` 經 `less.render()` **逐 byte 相同**(獨立複核:**3611** 個選擇器 0 增 0 減);codepoint 抽驗 + 「加一個 icon」往返實測;`build-css` 74 → **75** 檔 | 2026-08-04 |
| P7 `tablet` + profile API | BLOCKED | G-delta | — | — |
| **規則表產生器**(P8 前置,**有期限**) | **DONE** | 自帶斷言 | **846** 列 / **834** 語法 1:1 / **830** 行為 1:1 / **16** 例外;**30** mixin 名稱 / **38** 定義列 | 2026-07-30 |
| P8 收尾 | TODO | G-zero | 須等於 P4 + P5 + P7 已核准 delta 總和 | — |


### L2.2 前置工作項與 BLOCKED

#### 兩個前置項的說明

- **視覺 A/B harness** —— 重用 Marble 既有的 preview 頁面與 Playwright,不搬語料進本分支。
  只需讓 preview app 能載入本模板編出的 theme jar,A/B 兩邊是**同一分支的兩次 build**
  (P0 的 LESS build vs 轉換後的 CSS build)。**先拿同一個 build 截兩次確認 diff 為零**,
  才可以拿它比對不同 build。計畫書 §2.4。
- **規則表產生器** —— ✅ **已完成(2026-07-30),期限風險解除。**
  `scripts/gen-var-table.js` + `scripts/gen-mixin-table.js`,各自自帶斷言、輸出跨次執行
  byte-identical、可在客戶 fork 上重跑。四支 npm script:`gen:var-table` / `check:var-table` /
  `gen:mixin-table` / `check:mixin-table`。
  ⚠️ **其中兩支 `check:*` 現在 exit 1,而且不是 P6 造成的** —— 成因是 P3 刪掉 74 個 entry
  之後,「LESS 名稱有沒有被引用」這個量測失去了量測對象;見 L3-I 的 **S14**。
  兩張表的**產出內容不受影響**,是儀器過期而不是遷移表錯。
  產出:`doc/migration/less-var-to-token.{md,json}`、`doc/migration/mixin-to-css.md`。
  它解掉的風險是:這兩張表**只存在於即將被刪的檔案裡**,刪掉之後只能靠考古還原。

**BLOCKED 的原因**(都是等決策,不是等工作):

| 階段 | 卡在什麼 |
|---|---|
| P4a / P4b | L-2 —— IceBlue 作為 add-on 的瀏覽器支援聲明未定 |
| P7 | L-4 —— compact profile 的替代機制未定(**colour 那一半已解除**,density 那一半仍未定) |

#### 已解除的 BLOCKED

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

### L2.3 P3 批次與步階(已收工 74/74)

**P3 已收工 74/74。** 批次與步階的**定義**見計畫書 L2.2〈步階與批次是兩件事〉;
逐批的檔案清單、每一顆 commit、以及步 0–4 的複核包在 **L3-F**。

| 批 | 範圍(輸出端條數) | 檔數 | 對應步階 | 狀態 |
|---|---|---|---|---|
| 批 1 | ≤20 條 | **20**(原估 ~8) | 步 0 → 步 1 → 步 2 | **DONE(20/20)** |
| 批 2 | 21–200 條 | **43**(原估 ~55) | 步 3 | **DONE(43/43)** |
| 批 3 | >200 條 | **11** | 步 4 | **DONE(11/11)—— P3 收工 74/74** |
| | | 20+43+11 = **74** ✓ | | |

### L2.4 P3 來源清理待辦(7 項,排在 P3 全部轉完之後)


一律**改來源**,不在 `build-css.js` 加特例隱藏。P3 已收工,所以 7 項現在都可以開始 ——
但**它們的閘門形狀有三種,不可以當成一批處理**:

> **狀態(2026-08-04):第 1、2、3、4、6 項已收工**,一顆 commit,32 個 `.css` 檔,
> 閘門 `files differing: 0` / 14323 條不動,證據見〈L3-A 閘門紀錄〉**#32**,第 4 層獨立驗證見 **#33**。
> **第 5、7 項仍未動**,兩者都是 G-delta,等 P4。逐條發現原文(未套用的 54 條)已搬進
> [iceblue-p3-review-residual-findings.md](iceblue-p3-review-residual-findings.md) ——
> 原本只存在於一次性工作目錄裡。

| 閘門 | 哪幾項 | 為什麼 |
|---|---|---|
| **G-zero,且輸出逐 byte 相同** | **2、3、6** | 只動註解。`build-css.js` 在 minify **之前**就跑 `stripComments()`,所以註解搬到哪、寫錯什麼,輸出**根本看不到** |
| **G-zero,但輸出 byte 會變** | **1、4** | 刪掉的是註解空殼**產生的空規則**。空規則沒有 declaration,`cssdiff` 的 `files differing` 不動;而「空規則」本身就是 5 類封閉清單之一。方向是**往 baseline 靠**(baseline 沒有那些 `sel{}`,是 LESS 壓縮器刪掉的),所以預期 `check:build-css` 的「空規則」那一類檔數會**下降** —— 套用後跑一次就證明得出來 |
| **G-delta** | **5、7** | 這兩項**改變 declaration 數**(`combo` 586 → 191、刪掉 14 處重複/矛盾宣告),必須逐條對應到已核准的變更 |

排程結論:**1–4、6 共 5 項不必等 P4**,可以自成一顆可複審的 commit 並用閘門證明;
**只有第 5、7 項**要排進 P4 或自帶 G-delta 核准。

> **上表三個預測的實測結果(2026-08-04,套用後)。** 兩個成立、一個比預測更強:
>
> | 預測 | 實測 |
> |---|---|
> | 2、3、6 只動註解 → 輸出逐 byte 不變 | ✅ `check:bytes` 的 `byte-identical 26/77` 與 `UNEXPLAINED 0` **完全沒動** |
> | 1、4 刪空殼 → 「空規則」那一類檔數**下降** | ✅ **但比預測更強:整個類別消失** —— `check:build-css` 的封閉清單從 **5 類變 4 類**(`8 file(s) 空規則` → 不再出現) |
> | 1、4 不改 declaration 數 | ✅ 14323 條不動,`files differing: 0` |
>
> **一個預測沒說到、但實際發生了的事:** `unit on a zero length` 8 → 7、
> `whitespace around , and >` 49 → 48。**這不是 CSS 變了** —— `classify()`
> (`scripts/check-build-css.js:128-141`)是「**改到就算用到**」而且 `x === y` 就 `break`。
> `biglistbox` 原本的真差異只有 {leading zero, 空規則},空規則差異撐著讓迴圈跑過第 3、4 關,
> 那兩關**兩邊都改**(無害)卻被計入;空規則消失後它在第 2 關就相等、直接 `break`,
> 於是那兩筆順帶消失。實測:`biglistbox.css.dsp` 現在 `used = ["leading zero on decimals"]` 一類。
> 也就是說**那兩個數字本來就是虛胖的**,這次順便暴露了 `classify()` 會高報類別。

| # | 項目 | 檔案 | 發現於 |
|---|---|---|---|
| 1 | **[DONE 2026-08-04]** `&-editor` 的規則主體只剩一段區塊註解(`lset for resetCss option`)→ 輸出成 `sel{}`。**LESS 壓縮器會刪、CleanCSS level 0 不刪**。~~2 個空規則 `.sel{}`~~ —— `.sel{}` 是 `check:build-css` 類別說明裡的**示意**選擇器,被誤讀成字面值了;它也**不是**真的空規則,而是註解空殼(步 3 第 3 項改正) | 兩份 `tbeditor` | `check:build-css` 首跑(紀錄 #16),步 3 改正 |
| 2 | **[DONE 2026-08-04]** 授權標頭裡字面的 `@{zprefix}`,應還原為 `Trumbowyg` | 兩份 `tbeditor` | P3 步 2 |
| 3 | **[DONE 2026-08-04]** `/* For customized style */` 這段註解原本在說明 `#footer.append-style()` hook,hook 已隨轉換消失,註解留著會誤導 | `zul/css/footer.css` | P3 步 2 |
| 4 | **[DONE 2026-08-04]** **解巢造成的註解孤兒:~~9~~ → 15 個「主體只剩註解」的空殼規則**,註解要說明的子規則已被 LESS 提到殼外。處置是**把註解搬到它說明的規則上面、再刪掉空殼**,不是整段刪掉(內容有用:`/* ZK-2151: … */`、`/* Bug 2949287 */`) | `nav`(6)、`listbox`(2)、`biglistbox`(2)、`borderlayout`(1)、`paging`(1)、`tree`(1)、兩份 `tbeditor`(各 1) | P3 步 3(9 處)+ **步 4(+6 處)**,`13da402` 修好偵測器後才看得見 |
| 5 | **`combo` 的 6× 重複宣告併成原生選擇器清單**(586 → **191** 條實測,−67%;`~100` 是舊估計,見〈P3 收工複審〉)。**這是 L-8 的 B 案,已拍板為「先 A 後 B」的 B 那一半** —— 步 4 已按 A 案逐字轉完,所以現在的工作是「改一個已經產生好的檔」,而不是「決定它怎麼產生」。限制:`&` 不能字串串接,`&-input` 必須展開成 6 個選擇器的明列清單;來源順序會從 per-component 分組改掉,所以要**逐條對應 + 視覺 A/B**。**P7 的 `tablet/compact/_combo.less:27,36` 同形狀,歸在同一項**,不要在 P7 重新爭論 | `js/zul/inp/css/combo.css`(+ P7 的 `_combo`) | P3 步 4,L-8 拍板(2026-08-03) |
| 6 | **[DONE 2026-08-04]** **位置錯的註解 55 處、~~22~~ → 28 檔**(檔數更正見 S15;「55 處」未變) —— 與第 4 項不同類:這些註解所在的規則**仍有宣告**,所以空殼偵測器結構上看不到它們。最常見的形狀是解巢把子規則提走、留下一串區塊註解黏在父規則的**尾端**(`nav.css:9` 的 `/* overall style */ /* horizontal style */ /* vertical style */`)。**這一項是 G-zero** —— 只動註解,輸出 byte 不變,可用閘門證明 | 28 檔,最密的是 `goldenlayout` 6、`combo` 4、`borderlayout` 4、`tbeditor`(zkmax/inp) 4 | P3 收工複審(2026-08-04) |
| 7 | **重複/矛盾宣告 14 處** —— mixin 展開造成的同屬性重複(`.boxShadow()`/`.borderRadius()` 的舊瀏覽器前綴、圖示字型 mixin 的 `font-size: inherit`),以及**同一個選擇器被輸出兩次且值矛盾**:`tabbox.css` 的 `.z-tabbox-right > .z-tabs` 在 161 行 `float: left`、194 行 `float: right`(後者生效,前者是死碼)。**全部是來源既有的噪音,不是轉換造成的**(閘門證明輸出與 baseline 相同)。刪除**會改宣告數**,所以不能在零差異階段做 | `caption`、`fisheye`、`goldenlayout`(4)、`combo`(2)、`camera`、`searchbox`、`signature`、`popup`、`tabbox`、`nav` | P3 收工複審(2026-08-04) |

> **第 1 與第 4 項是同一個輸出現象、兩個不同來源。** P3 收工後全樹共 **8 個 empty-rule 輸出、
> 15 個空殼規則**:其中 **6 檔**(`nav` 6、`listbox` 2、`biglistbox` 2、`borderlayout` 1、
> `paging` 1、`tree` 1,共 13 處)是步 1 的 `//` → `/* */` 改寫**造成**的(第 4 項),
> **2 份 `tbeditor`**(各 1 處)是來源**本來就**有區塊註解(第 1 項)。
> 兩者都不是真正空的規則 —— **全樹一個真正空的規則都沒有**(`bare=0`,實測)。
> 這 8 檔與 `check:build-css` 的「empty rule」類別檔數**獨立對上**,兩個實作互為交叉檢查。

> **為什麼第 3 項不當場順手刪掉。** 目前每一個轉換後的 `.css` 都**恰好等於腳本會產生的內容** ——
> 這個性質讓任何人都能用 `less2css.js` 重跑一次來驗,不必信任我手改了什麼。手改一個註解就會
> 破壞它,而換來的只是少一行誤導。跟 `-ms-zoom: 1`(步 1 第 3 項)同一個判斷:**不要把來源
> 清理的 delta 混進零差異階段。**


### L2.5 交給 P8 的產品面問題(2026-08-03,3 項,不阻擋 P4-P7)


這三項**不是**工程未決,是 P3 途中撿到、但決定權不在本計畫的問題。集中在這裡,免得散在各步的
複核包裡被漏掉。**它們都不阻擋 P4–P7。**

| # | 問題 | P3 的處置 | 為什麼要問 |
|---|---|---|---|
| 1 | **別的主題會不會填 `#footer() { .append-style() {} }` 這個 hook?** | 照刪(`footer` 步 2)。它是空的,`append-style` 全 repo 只出現在這一個檔 | 純 CSS 表達不出 LESS namespace hook。IceBlue 自己沒用到,但這是**對外的擴充點**,別的主題或客戶 fork 可能有填 |
| 2 | ~~**`goldenlayout` / `cropper` / `signature` 三對來源要不要收斂成一份?**~~ → **四對(加 `tbeditor`)的舊路徑要不要直接刪掉?** | 不收斂,逐檔各自轉(前三對每對兩檔逐 byte 相同,md5 一致) | ~~純**去重**問題:內容相同,但**兩個輸出路徑都必須繼續存在**(元件會各自去要),所以收斂需要建置期複製或 import 機制~~ **←這個理由是錯的,見 S18。** 實測 `lang-addon.xml`:每個 `css-uri` 只有**一個** `widget-package` 會要,一律是**新路徑**(`zkmax.goldenlayout` / `.cropper` / `.signature` / `.tbeditor`);**4 個舊路徑輸出從來沒有人要**。所以不需要建置期複製,問題變成「刪掉 4 個死檔要不要走 G-delta」(**77 → 73** 輸出檔)。**上游也該報** —— 產品端 `zkmax/src` 只留新路徑,同時帶新舊兩份的是 `zkthemebuilder/template`,每個從樣板長出來的主題都繼承 |
| 3 | **兩份 `tbeditor` 版本落後,要不要對齊?** | 不動,兩個版本各自轉(375 / 380 條) | **與第 2 項不同,這不是去重** —— `js/zkmax/inp` 是上游 Trumbowyg **v2.7.2**、`js/zkmax/tbeditor` 是 **v2.31**,Potix 的改法也不同(v2.31 那份多了整組 `.z-tbeditor-editor-box` 與 flex 版面)。~~合併等於**挑一個版本**並可能改變其中一個元件的外觀~~ **←實測後這不是選擇,見 S18**:`<widget-package>zkmax.tbeditor</widget-package>` 只要新路徑,**v2.7.2 那份是死輸出**,所以「對齊」的答案就是第 2 項的答案(刪掉舊路徑),**不會改變任何元件的外觀**。仍留在 P8 的理由只剩相容性:舊 `widget-package` 可能還被更舊的 ZK 版本或客戶手寫的 `<?link?>` 指到 |


---

## L3 技術附錄(獨立檔)

L3 全部收在 **[iceblue-drop-less-progress-appendix.md](iceblue-drop-less-progress-appendix.md)** ——
原文保留的微觀細節:commit hash、byte 差異、實測 log、逐檔複核包、變更歷史。
L1/L2 只寫當前狀態;**要複核那些狀態是怎麼得出來的,去那裡。**

> **為什麼分檔**:執行期只需要 L1/L2(本檔 226 行),附錄是 986 行 —— 佔原本單檔的 **84%**。
> 分檔讓執行子代理讀狀態時不必連帶載入整份複核史料。量測與評估見
> [iceblue-drop-less-doc-split-evaluation.md](iceblue-drop-less-doc-split-evaluation.md)。
> **附錄一樣只記狀態,不定義規則。** 下表的〈何時要看〉就是判斷要不要打開附錄的依據。

| 節 | 內容 | 何時要看 |
|---|---|---|
| **[階段與 commit 對照](iceblue-drop-less-progress-appendix.md#階段與-commit-對照)** | 每一階對應哪些 commit | 要回溯某一階實際改了什麼 |
| **[L3-A](iceblue-drop-less-progress-appendix.md#l3-a-閘門紀錄附加式不覆寫)** | **閘門紀錄 33 列**(附加式,**不覆寫**) | P8 核帳、以及要確認某個數字是哪一次跑出來的 |
| **[L3-B](iceblue-drop-less-progress-appendix.md#l3-b-tier-1p1--s0--s1)** | Tier 1:P1 = S0 + S1 的實作與論證 | 要動 LESS 版本 pin 或 `check-less-conventions.js` 時 |
| **[L3-C](iceblue-drop-less-progress-appendix.md#l3-c-p2-儀器證明)** | P2 儀器證明(六步)+ 為什麼是 CleanCSS level 0 + 第三種靜默摧毀構造 | 要改 `build-css.js` 或 minifier 設定時 |
| **[L3-D](iceblue-drop-less-progress-appendix.md#l3-d-p0-交付物基準的不可變性突變測試)** | P0 交付物、基準的不可變性、突變測試、重建基準的方法 | 基準出問題時 |
| **[L3-E](iceblue-drop-less-progress-appendix.md#l3-e-前提的修正與順手撿到的發現)** | 前提的修正(P0 / prereq)、P4 拆分、carve-out、CAVEAT-3 | 要引用任何一個前提數字之前 |
| **[L3-F](iceblue-drop-less-progress-appendix.md#l3-f-p3-批次的檔案清單每一步可以自己檢查什麼步-0-4-的逐檔複核包)** | 每一步「你可以自己檢查什麼」+ **步 0–4 的逐檔複核包** | 複核 P3、或要照同樣方式做 P4–P7 時 |
| **[L3-G](iceblue-drop-less-progress-appendix.md#l3-g-p3-收工複審74-檔獨立-fan-out2026-08-04計畫書-l3-c-26-第-4-層首次執行)** | P3 收工複審:74 檔獨立 fan-out(第 4 層首次執行) | 要設計下一次獨立驗證時 |
| **[L3-H](iceblue-drop-less-progress-appendix.md#l3-h-執行機制workflow)** | 執行機制 workflow 的細節與三個設計決定 | 要跑 workflow 或改它時 |
| **[L3-I](iceblue-drop-less-progress-appendix.md#l3-i-change-log--狀態層的敘述更正)** | **Change Log —— 狀態層的敘述更正** | 看到兩個矛盾的說法時 |

> **另一份獨立檔:[iceblue-p3-review-residual-findings.md](iceblue-p3-review-residual-findings.md)**
> —— P3 收工複審 120 條發現裡**還沒套用的 54 條**原文(`duplicate-declaration` 14 = L2.4 第 7 項、
> `token-clarity` 5、`readability` 35)。已套用的 66 條見紀錄 **#32**、**#33**。
> 之所以存在:那份清單原本只在一次性工作目錄裡,消耗掉前半部時若不落地,後半部就找不回來。
