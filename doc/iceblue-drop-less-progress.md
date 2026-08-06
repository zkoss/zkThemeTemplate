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
  - [L3-A 閘門紀錄](iceblue-drop-less-progress-appendix.md#l3-a-閘門紀錄附加式不覆寫) — 46 列,附加式不覆寫
  - [L3-B Tier 1](iceblue-drop-less-progress-appendix.md#l3-b-tier-1p1--s0--s1) — P1 = S0 + S1
  - [L3-C P2 儀器證明](iceblue-drop-less-progress-appendix.md#l3-c-p2-儀器證明)
  - [L3-D P0 交付物、基準、突變測試](iceblue-drop-less-progress-appendix.md#l3-d-p0-交付物基準的不可變性突變測試)
  - [L3-E 前提的修正](iceblue-drop-less-progress-appendix.md#l3-e-前提的修正與順手撿到的發現)
  - [L3-F P3 逐檔複核包](iceblue-drop-less-progress-appendix.md#l3-f-p3-批次的檔案清單每一步可以自己檢查什麼步-0-4-的逐檔複核包) — [步 0](iceblue-drop-less-progress-appendix.md#步-0-的複核包2026-07-31) · [步 1](iceblue-drop-less-progress-appendix.md#步-1-的複核包2026-08-034-檔) · [步 2](iceblue-drop-less-progress-appendix.md#步-2-的複核包2026-08-0315-檔--批-1-收工-2020) · [步 3](iceblue-drop-less-progress-appendix.md#步-3-的複核包2026-08-0343-檔--批-2-收工-6374) · [步 4](iceblue-drop-less-progress-appendix.md#步-4-的複核包2026-08-0311-檔--批-3-收工p3-收工-7474)
  - [L3-G P3 收工複審](iceblue-drop-less-progress-appendix.md#l3-g-p3-收工複審74-檔獨立-fan-out2026-08-04計畫書-l3-c-26-第-4-層首次執行) — 74 檔獨立 fan-out
  - [L3-H 執行機制:workflow](iceblue-drop-less-progress-appendix.md#l3-h-執行機制workflow)
  - [L3-I Change Log](iceblue-drop-less-progress-appendix.md#l3-i-change-log--狀態層的敘述更正) — 34 條狀態層更正

---

## L1 執行摘要

**最後更新**:2026-08-06

### 現況

**核心命題已經證明完畢** —— IceBlue 的 **82 個元件輸出不需要 LESS,而且是零差異證明的**。
**P5 收工後**來源端是 **84 `.css` entry + 5 `.css` partial + 1 `.less` = 85 輸出 ✓**;
最後 1 個 `.less` 是**刻意**保留的 holdout(`tablet`/P7)。全樹閘門 `files differing: 0`
(85 輸出檔 / 14863 輸出端條數),而 `build-css.js` 現在覆蓋 **84 檔**,`zklessc` 只剩 **1** 檔。

> **P5 同時回答了一個一直沒問對的問題**:「reset 一定要拆成獨立檔案載入嗎?」——
> 不但不必,而且**拆檔是唯一會弄丟單一 WCS 的做法**。`zk.wcs` 是 **ZK core** 的檔案,主題
> **無法**往那個聚合裡加檔案(`beforeWidgetCSS` 能改寫、能跳過,**不能新增**),能新增的
> `getThemeURIs` 會掛在聚合**外面** = 多一個 request。詳見 `tasks/p5-browserdefault-options.md`。

> **~~75 檔正好是 P2 儀器預估的上限,builder 覆蓋率到頂~~ ←這個結論在 2026-08-05 失效,見 S27。**
> P2 的儀器是對「當時樹上有的 76 個 entry」做的預估,上限 75 在那個檔集裡成立;ZK 10.4 補齊帶進
> 8 個 P2 從未看過的檔,所以 83 不是「突破上限」,而是**檔集本身變大了**。真正的不變量是
> 「holdout 剩幾個」,不是那個絕對數字 —— **2026-08-06 P5 收工後剩 1 個(`tablet`/P7)。**

**來源端的清理也做完了** —— L2.4 第 1–4、6 項於 2026-08-04 收工:**空殼規則全樹歸零**
(15 → 0),`check:build-css` 的封閉清單從 **5 類降到 4 類**(「空規則」那一類整個消失),
註解位置錯誤 55 處 / 28 檔全部歸位。**閘門在整個過程中沒有動過一個數字。**

**剩下的階段都是有意識的取捨**(前綴政策、reset 機制、profile API),
不是「還不知道做不做得到」。

### 里程碑

| 里程碑 | 狀態 | 一句話 |
|---|---|---|
| **M1** 基礎建設與閘門(P0 · P1 · P2) | **DONE** | 基準不可變、LESS 釘到 4.8.1、來源樹可同時容納 `.less` 與 `.css` |
| **M2** 元件轉換 82 檔(P3) | **DONE** | 74/74 轉完,逐檔閘門全 0、無一次失敗;**0 檔無法解釋**。2026-08-05 追加 ZK 10.4 補齊的 8 檔,同樣逐檔閘門全 0(S26) |
| **M3** vendor prefix 政策(P4a · P4b) | **BLOCKED** | 只等 **L-2** 瀏覽器支援聲明(視覺 A/B harness 已於 2026-08-05 完成) |
| **M4** 三個 holdout(P5 · P6 · P7) | **2 / 3 DONE** | **P6 DONE** —— FA 的 `each()` 迴圈換成 `gen-fa-css.js`;**P5 DONE(2026-08-06)** —— `norm` 轉純 CSS,`browserDefault` 用 build 期遮罩而**不是** `@scope`,閘門由 G-delta 收在 **G-zero**;P7 等 **L-4** 的 density 那一半 |
| **M5** 收尾與遷移指南(P8) | TODO | 兩張規則表已產出,期限風險已解除 |

### 總體進度

| 量法 | 數字 |
|---|---|
| **里程碑進度** | **2 / 5 = 40%** |
| **輸出檔脫離 LESS** | **83 / 85 = 98%** |

### 下一步(依「不等任何人」排序)

1. **視覺 A/B harness** —— P4 / P5 / P7 的共同前置。**A 側(基準)這一半已經做完**(紀錄 #34):
   `npm run check:baseline` 讓 `baseline/` 的遺失與損毀**可偵測**(78 檔 sha256,`shasum -c` 也能單獨驗),
   `node scripts/baseline-ab.js install a|b` 把側邊切換變成一個會**自我驗證**的指令(覆蓋後立刻重算
   雜湊,不符就 exit 1),`npm run ab` 印出現在裝的是哪一側。已實測無損可逆與三個負向控制。
   **接線那一半也做完了**:`init.sh` 已執行(紀錄 #35),而主題名撞上 `StandardTheme.DEFAULT_NAME`
   的問題(**S21**)已由**改名 `iceblue` → `iceblue_css`** 解除(**S23** 決策、紀錄 #36)。
   **A/B 現在真的量得到東西**:同一個 `zk.wcs`,A 側 530434 B / B 側 531482 B、sha256 不同,
   而兩者經 5 類序列化正規化後**完全相同(525145 B)** —— 「byte 不同、語意相同」第一次在
   **HTTP 層**被證明,不再只是磁碟上的比對。
   ~~**剩下的就只有缺頁面與缺工具**:此 worktree 只有 `preview.zul` 一頁,`package.json` 裡沒有
   playwright。這是純實作,**不等任何人** —— 也是目前唯一還擋著 P4 / P5 / P7 的東西。~~
   **←2026-08-05 已完成,P4 / P5 / P7 的這道前置解除。** 頁面**不搬進本分支**:直接讀 Marble
   worktree 已編好的測試資源(**116 頁**),theme 由命令列 `-Dorg.zkoss.theme.preferred=iceblue_css`
   選定 —— ZK 的 `Library.getProperty` 會退回 `System.getProperty`,而 Marble 的
   `ThemePreviewIceblueApp` 本來就故意不設 preferred theme,所以**Marble worktree 一個檔都不用改**。
   自我驗證 **pages differing: 0**;反向控制(對輸出注入一行 button 圓角)**36 頁差異**,最小 370px。
   **第 4 層獨立驗證(2026-08-06)推翻了原本「連續兩輪 0」的宣稱、並修掉兩個真缺陷**
   (子 frame 從來沒被等過;動畫 GIF 的清單漏了語料側),修完後**連續三輪 0 差異 + 0 缺頁**。
   反向控制的餘裕**只對常見元件成立** —— 對只出現 1–2 個實例的稀有元件實測會**真漏接**(**S33**)。
   規格與實測發現見 [visual-ab-harness.md](visual-ab-harness.md),閘門紀錄 **#44 / #45**,
   方法學發現 **S32 / S33**。
   **`zk.version` 已升到 `10.4.0-jakarta.FL.20260713-Eval`**(紀錄 #38,S24 的修法):
   A/B 覆蓋率 **74/77 → 75/77**、未參與畫面的位元組 **35.4% → 7.0%**,`font-awesome`
   (P6 交付物、全樹最大檔)**現在真的是我們那一份**在服務。剩下 2 個沒到的是舊路徑死複本(S18)
   與桌機 UA 下 `disabled` 的 tablet(P7),都是預期的。
   **升版揭出的那筆欠債(S25)已經補完**:本主題原本比 10.4 少 **8 個元件的 CSS**
   (avatar / avatargroup / badge / breadcrumb / carousel / chip / confirmpopup / daterangebox
   —— 全部是 10.2.1 之後才加的元件),而且**沒有 fallback**,所以它們在本主題下**一條 CSS 都沒有**。
   ~~補齊會讓輸出 77 → 85,直接動到閘門地基 ⇒ G-delta 級決定,待拍板。~~
   **←2026-08-05 拍板補齊(選項 B),已收工,見 S26 與紀錄 #39–#42。** 從 `zk` / `zkcml` 的 `10.4`
   分支逐 byte 取原始 LESS 匯入,先補 20 個 `--zk-severity-*` token(缺它們 LESS 連編譯都不過),
   再逐檔轉成 CSS。輸出 **77 → 85**、declaration **14323 → 14863**、來源端 **83 `.css` + 2 `.less`**。
   實測驗收:8 個元件的選擇器全部進到瀏覽器實收的 CSS、20 個 token 全部被服務、
   `Unable to load` **歸零**。**artifact 自己的版號也一併跟上** `10.4.0-jakarta-Eval`(4 處)。
2. ~~**補齊的第 4 層獨立驗證仍然欠著**~~ **←2026-08-05 已完成,見
   `doc/l4-verify-zk104-backfill.md` 與紀錄 #43。** 結果 **PASS-WITH-FINDINGS**:12 條斷言
   **11 條 CONFIRMED**,唯一 REFUTED 的是 C2 後半段 —— 而那正是自我複核**自己已經承認**的推翻
   (S29),覆核者獨立重跑 `diff -rq` 得到**相同的 5 處差異、相同的 1 處真缺口**,沒有新增判定分歧。
   **原本只有實作者單方量測的 C3 / C7 / C8 / C9 / C10 現在都有第三方證據**(C3 用 sha256 對
   `git show 0fede67:` 的 8 個檔;C7 起 app 直接 `curl` 瀏覽器實收的 `zk.wcs`;C9 查到本主題的
   `lang-addon.xml` 根本沒有 `<component>` 區塊、`zk.xml` 在此 repo **不存在**)。
   **這一輪的委託書留在 repo 裡**(`tasks/l4-verify-zk104-backfill-brief.md`),因為前後
   **五次**派工死在 API 529、每次都要從對話重建委託。**追加的目錄掃描沒有找到第二個 S29
   同性質缺口**;順手撿到兩件事:選擇器命中數的口徑沒記(**S30**)、版號四處一致性沒有腳本守著
   (**S31**,建議排 P8)。
3. **palette 的 `_css` 覆蓋機制是斷的**(S29,**既有缺口、非本輪造成**)—— `_zkcssvariables.less`
   少了 `@import "colors/_@{themePalette}_css";`,連帶沒有 `colors/_iceblue_css.less`。
   對現狀**零影響**(iceblue 那份是空的),但**換 palette 就靜默失效**,而 `readme.md:50` 正是教
   使用者設 `@themePalette` 的那一行。修法是補 import + 補檔,**必須成對**(單獨補 import 會建置
   失敗),兩者都不改輸出 ⇒ ~~**待決定要不要納入本分支**。~~
   **←2026-08-05 裁示:本輪不做,歸入 P7 的待辦**(計畫書 §P7 已收錄為交付項與驗收條件)。
   理由不只是「同一個機制」:P7 要把 `@themePalette` 的**編譯期插值**整個換成 runtime
   `--zk-*` override sheet,`_@{themePalette}_css` 這條 import 路徑到那時可能已經不存在
   ⇒ **現在補等於補一個即將被換掉的東西**。P7 的驗收因此多一條:override sheet 必須表達得出
   palette 覆蓋,且要有一次**非 iceblue** palette 的實測 —— 現況下這條路徑從來沒被走過。
4. **L-2** 瀏覽器支援聲明 —— 解鎖 P4a / P4b。
5. **L-4 的 density 那一半** —— 解鎖 P7(colour 那一半已由 L-7 解除)。

> ~~**不等任何人的工作已經做完了。**~~ **←2026-08-05 補齊收工後不再成立:上面 5 項裡有 ~~3 項~~
> ~~2 項~~ ~~1 項~~ 0 項不等任何人**(~~只剩第 1 項的頁面與 playwright~~ **←已完成**;
> ~~第 2 項重跑第 4 層驗證~~ **←已完成**;
> ~~第 3 項只差一個要不要做的決定~~ **←已裁示歸 P7,不再是可以現在開工的項目**)。
> ~~**⇒ 這句話又成立了,而且比原本更窄**:唯一不等任何人的實作就是第 1 項,它同時解鎖 P4 / P5 / P7。~~
> **←2026-08-05 傍晚:第 1 項也收工了(#44)⇒ 原句第三次成立,而且這次是完整成立**:
> **五項全部不是「可以現在自己動手」的實作**。P4a / P4b 等 **L-2**、P7 等 **L-4 的 density 那一半**,
> ~~**而 P5 的兩個前置(視覺 A/B harness、`less2css.js` 的 CR 處理 S16)只剩後者** ——
> ⇒ **下一個可以自己動手的實作是 S16,它是 P5 唯一還缺的前置。**~~
> **←2026-08-06:S16 也收工了(紀錄 #46,順帶推翻紀錄 #28 的「不需要改腳本」,見 S34)⇒
> P5 的兩個前置全部解除,`P5` 本身成為下一個可以自己動手的階段。**
> L2.4 清理待辦第 1–4、6 項已於 2026-08-04 收工(紀錄 #32、#33),
> 剩下的 L2.4 兩項是**別人的決定或還沒建的工具**,不是可以直接開工的實作。要繼續推進,
> ~~第 1 項是唯一自己動手就能解的 —— 而且它同時解鎖三個階段。~~
> **←第 1 項在 2026-08-05 一天之內從「等決策」變回「純實作」。** A 側基準收工(#34)、名字統一
> (#35)、撞號解除(改名 `iceblue_css`,S23 / #36)。**現在它是三項裡唯一不等任何人的**:
> 缺的只有被截圖的頁面與 playwright,而且**harness 已經證明自己量得到訊號**,不會再回報假的零差異。

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
| ↳ **ZK 10.4 補齊 8 檔**(S25 的欠債 → 議題 A 選項 B) | **DONE** | **G-delta**(輸出 77 → 85) | 三層各自可驗:token 層 **+20 條、1 檔差異、全部 `+`**(ZK 10.4 定義 **862** 個 `--zk-*`、主題原有 **842**,差的就是這組);匯入層 **85 檔 / 8 檔 `ONLY IN CANDIDATE`**,且 8 這個數字用**來源樹逐檔對**獨立確認(ZK 81 entry vs 主題 77)而非信 app log;轉換層 **8/8 逐檔閘門全 0、520 條**,`check:bytes` 全樹 UNEXPLAINED **0**。三個 token 檔與 8 個元件 LESS 匯入後**與 ZK 10.4 逐 byte 相同**。既有 baseline 未被動到是量出來的:**1 changed / 0 missing / 0 extra** 與 manifest hash 行 **0 刪 / 8 增**。**⚠ 匯入那一步的閘門是因構造成立的,不是證據 —— 見 S26**(紀錄 #40–#42) | 2026-08-05 |
| ↳ **ZK 10.4 補齊 8 檔的第 4 層獨立驗證** | **DONE** | 覆核者重跑閘門須重現三個數字 | **PASS-WITH-FINDINGS** —— 12 條斷言 **11 CONFIRMED / 1 REFUTED**,而 REFUTED 的那條(C2 後半段)正是自我複核**自己已承認**的 S29,獨立重跑得到**相同的 5 處差異、相同的 1 處真缺口**,無新增分歧。閘門由第三方重現 **85 / 14863 / 0**(紀錄 #43)、`check:bytes` UNEXPLAINED **0**。原本單方量測的 5 條全部補上第三方證據:C3 用 `shasum` 對 `git show 0fede67:` 的 8 個檔(8/8 相同)、C7 起 app 直接 `curl` 瀏覽器實收的 `zk.wcs`(**551518 B**;8 個元件選擇器命中 + 20 個 severity token + `Unable to load` **0**)、C9 查出本主題 `lang-addon.xml` **沒有** `<component>` 區塊且 `zk.xml` **不存在於此 repo**、C10 四處版號逐字相同、C11 整份附錄 diff **只有 1 個 `-` 行**(計數標籤 25→29)。**追加的目錄掃描沒有第二個 S29 同性質缺口**:`zkmax/less/` 與 ZK 10.4 逐 byte 相同,3 組 `js/**/less/` 兩側皆空。順手撿到 **S30**(選擇器命中數缺口徑)與 **S31**(版號四處一致性無腳本守著)。報告 `doc/l4-verify-zk104-backfill.md`;委託書 `tasks/l4-verify-zk104-backfill-brief.md`(派工五次死於 API 529,故落地成檔) | 2026-08-05 |
| **視覺 A/B harness**(P4 / P5 / P7 前置) | **DONE** | 自我驗證須為 0 | **0 差異,連續三輪(修完第 4 層找到的兩個缺陷之後)** —— 語料 **116 頁**(Marble 的頁面,**不搬進本分支**:直接讀它已編好的 `target/test-classes/web`),theme 指紋 `6e5a856e8a80ddf9` / 85 檔。**反向控制證明它看得見**:對輸出注入一行 `.z-button{border-radius:12px}` → **36 頁差異**(全部有 button 的頁)、最小 370px,對噪音上限 64px 有 **≈6 倍**餘裕 —— **但那個餘裕只對常見元件成立,對稀有元件實測會真漏接,見 S33**。**啟動守門探針**證明服務中的 CSS 真的是本主題(`_zkiju-iceblue_css` 在、`marble` 0 次)—— 沒有它,一個「主題沒載到」的 harness 會回報完美的零,就是 #41 那種空轉。收斂過程 **14/115 → 0/116**,每一步都是量測逼出來的(**S32**);規格 [visual-ab-harness.md](visual-ab-harness.md);紀錄 **#44** | 2026-08-05 |
| ↳ **視覺 A/B harness 的第 4 層獨立驗證** | **DONE** | 覆核者須自己重跑 selftest 並自造更小的改動逼近下限 | **PASS-WITH-FINDINGS** —— 13 條斷言 **9 CONFIRMED / 1 REFUTED / 3 PARTIAL**,並修掉**兩個真缺陷**。**REFUTED 的是 C5(自我驗證的 0 可重現)**:覆核者獨立重跑兩次都得到 `pages differing: 1`(`iframe` 6855px / maxΔ255,兩次幾乎同一個 box)⇒ 原本的「連續兩輪 0」只在暖 session 成立。追下去根因**與冷熱無關**:spec 的每一個等待都只作用在 **main frame**,而 `iframe.zul` 用真 `<iframe>` 內嵌 `~./html.zul` ⇒ **內層頁面從來沒被等過**(臨時探針量到:main frame 等待完成當下,子 frame 仍 `readyState=loading` 且 `zk` 未載入)。修完 iframe 後 `toolbar` 開始間歇壞掉(5 次 capture 中 2 次),原因是**動畫 GIF 的清單漏了語料側** —— `toolbar.zul` 用的 ZK 自帶 `~./img/network.gif` 也是動畫 GIF;已改成**看內容不看路徑**(攔所有 `.gif`、含 `NETSCAPE2.0` 才 abort)。**兩個修正都由探針而非推理確認**,其中第一版正規表示式漏掉 ZK 的 `;jsessionid=` 路徑參數,是探針抓出來的。**收工:`visual:selftest` 連續 3 輪 `pages differing: 0` 且 `pages missing: 0`**;主閘門不動 **85 / 14863 / 0**。C1 的七輪注入逼出**敏感度依元件出現頻率二分**(**S33**),並揭露 `camera` / `barcodescanner` / `video` 三個輸出檔的**結構性盲區**。報告 `doc/l4-verify-visual-ab.md`;委託書 `tasks/l4-verify-visual-ab-brief.md`;紀錄 **#45** | 2026-08-06 |
| ↳ **A 側(基準)可用性 + 完整性** | **DONE** | 無損可逆 + 三個負向控制 | `install a` → **77/77 逐 byte 等於 `baseline/`**;`install b` → 77 檔**逐 byte 回到切換前快照**;`shasum -a 256 -c doc/baseline-manifest.sha256` → **78/78 OK**(可脫離腳本驗證);manifest 損毀 → `check:baseline` exit 1 且 `install a` 拒絕 | 2026-08-05 |
| ↳ **四個名字統一**(`init.sh` 已執行 → 之後改名為 `iceblue_css`,見 #36) | **DONE** | 閘門不得動 | registered / preferred / maven `<artifactId>` / 腳本輸出目錄 **當時全部 = `iceblue`,現為 `iceblue_css`**;`npm run ab` 由 exit 1 轉 **exit 0**;`web/iceblue` 首次帶齊 **29 個資產**;閘門 **77 檔 / 14323 條 / 0**(紀錄 #35) | 2026-08-05 |
| ↳ **主題有沒有被服務**(A/B 能不能看見) | **DONE** | 服務出來的 CSS 必須是本主題 | **是 —— 改名 `iceblue` → `iceblue_css` 之後解除**(S23 決策、紀錄 #36)。主題段回到 URL(`_zkiju-iceblue_css/zul/css/zk.wcs`);服務出來的 `zk.wcs` **415355 → 531482 B**、`--zk-` 出現次數 **0 → 4171**(其中真正的自訂屬性宣告 **842** 條);`iceblue_css/zul/css/norm.css.dsp` → 200 / **63161 B**(這次**是被要求的**,標記探針證實)。**覆蓋率 75/77**(`zk.version` 升到 10.4.0 FL 後由 74/77 提升 —— 紀錄 #38;`font-awesome` 現在服務的是我們那一份),未參與畫面位元組 **7.0%**;剩下 2 個是舊路徑死複本(S18)與桌機 UA 下 `disabled` 的 tablet(P7),見 **S24**。~~另有 8 個元件本主題完全沒有 CSS,見 S25~~ **←已補齊(2026-08-05,S26);8 個元件的選擇器現在全部進到瀏覽器實收的 CSS、`Unable to load` 歸零。** 注意 **75/77 是 2026-08-05 升版當時的量測**,輸出檔數已變成 85,而本輪**沒有**產出可信的新覆蓋率數字(探針壞了,**見 S28**)—— 要重算得用 S24 那個標記探針 | 2026-08-05 |
| ↳ **A/B 有沒有訊號**(harness 的自我驗證) | **DONE** | 兩側服務出來的 byte 必須不同 | **有。** 同一個 `zk.wcs`:A 側 `a56858a9…` / **530434 B**,B 側 `6f293b24…` / **531482 B**(對照 S21 當時兩側 sha256 完全相同)。**而且差異性質也證明了**:套上 `check-bytes.js` 那 5 類封閉序列化正規化後,兩邊都是 **525145 B 且字串完全相同** ⇒ 瀏覽器收到的是**「byte 不同、語意相同」**的 CSS —— 核心主張第一次在 **HTTP 層**被證明 | 2026-08-05 |
| **P4a** 前綴純移除(A 群) | BLOCKED | G-delta | **945** 條,全部有無前綴同伴 → 只允許 `- <prefixed>`,任何 `+` 都是 bug | — |
| **P4b** 前綴逐條判斷(C 群) | BLOCKED | G-delta | **143** 條,含 **26** 條須成對替換;B 群 **44** 條 carve-out 不得出現在 diff | — |
| **P5 `norm.css`** | **DONE** | ~~G-delta~~ → **G-zero** | **整份 `norm.css.dsp` 零差異**,不只 token 那 **862** 條 —— 因為 `browserDefault` **不改 `@scope`**,runtime 行為一個 byte 都沒動。輸出端 DSP 逐項對齊 baseline:selector 前綴 **90 = 90**、`<c:if>` 開/關 **93 / 93**、`${}` 腐化 **0**、taglib 三條指令仍在 tokens/reset 接縫(**不在 offset 0**)、規則區塊 **357 = 357**。`build-css.js` 覆蓋 83 → **84** 檔,`zklessc` 只剩 **1** 檔。`check:build-css` 的 `norm` 從 passthrough 轉為**真來源實測**(84 檔全部來自真來源、0 未分類);`check:bytes` UNEXPLAINED **0**;`mvn package` 出來的 jar **85 個 `.css.dsp` / 0 個原始 `.css`/`.less`**。決策 [browserdefault-masking.md](browserdefault-masking.md),被否決的選項 `tasks/p5-browserdefault-options.md`(紀錄 **#47**、**#48**) | 2026-08-06 |
| **P6 Font Awesome** | **DONE** | G-zero | **4545** 條零差異;產生器輸出與被刪掉的 `.less` 經 `less.render()` **逐 byte 相同**(獨立複核:**3611** 個選擇器 0 增 0 減);codepoint 抽驗 + 「加一個 icon」往返實測;`build-css` 74 → **75** 檔 | 2026-08-04 |
| P7 `tablet` + profile API | BLOCKED | G-delta | **多一個交付項**:補 `_zkcssvariables.less` 缺的 `@import "colors/_@{themePalette}_css";` + `colors/_iceblue_css.less`(**見 S29**,2026-08-05 裁示歸入本階);驗收多一條 —— runtime override sheet 必須表達得出 palette 覆蓋,且要有一次**非 iceblue** palette 的實測 | — |
| **規則表產生器**(P8 前置,**有期限**) | **DONE** | 自帶斷言 | **846** 列 / **834** 語法 1:1 / **830** 行為 1:1 / **16** 例外;**30** mixin 名稱 / **38** 定義列 | 2026-07-30 |
| P8 收尾 | TODO | G-zero | 須等於 P4 + P5 + P7 已核准 delta 總和 | — |


### L2.2 前置工作項與 BLOCKED

#### 兩個前置項的說明

- **視覺 A/B harness** —— ✅ **已完成(2026-08-05)。** 重用 Marble 既有的 preview 頁面與
  Playwright,不搬語料進本分支:頁面由 Marble worktree 已編好的測試資源**掃描**取得(116 頁),
  本分支只放 harness 本身(`scripts/ab-visual.js`、`scripts/png-compare.js`、
  `src/test/playwright/`)。A/B 兩邊是**同一分支的兩次 build**。
  **自我驗證 0 差異(連續三輪)+ 反向控制 36 頁。**
  第 4 層獨立驗證(2026-08-06)修掉兩個真缺陷後才是這個狀態,並且劃清了它的界線:
  **對常見元件不會假陽性也幾乎不漏報,但對只出現 1–2 個實例的稀有元件實測會漏接**(**S33**),
  另有三個輸出檔因語料只在被 SKIP 的頁面出現而**結構上看不到**。
  三支指令:`visual:selftest` / `visual:capture` / `visual:diff`。
  規格 [visual-ab-harness.md](visual-ab-harness.md),計畫書 §2.4。
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
| **[L3-A](iceblue-drop-less-progress-appendix.md#l3-a-閘門紀錄附加式不覆寫)** | **閘門紀錄 46 列**(附加式,**不覆寫**) | P8 核帳、以及要確認某個數字是哪一次跑出來的 |
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
