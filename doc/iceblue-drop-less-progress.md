# IceBlue 棄用 LESS —— 進度紀錄

**本文件只記狀態,不定義規則。** 階段定義、G-zero/G-delta 判準、範圍邊界一律看
[iceblue-drop-less-execution-plan.md](iceblue-drop-less-execution-plan.md)。

狀態詞彙沿用元件 harness 既有的:`TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`。

---

## 階段

| 階段 | 狀態 | 閘門 | 量測 | commit | 日期 |
|---|---|---|---|---|---|
| P0 建立工作區與基準 | DONE | G-zero | `files differing: 0`(77 檔 / 14323 條) | `ae4ca36` | 2026-07-29 |
| P1 LESS 釘到 4.x | BLOCKED | G-zero | — | — | — |
| P2 雙來源 build | TODO | G-zero | — | — | — |
| P3 元件掃描 74 檔 | TODO | G-zero | — | — | — |
| **視覺 A/B harness**(P4 前置) | TODO | 自我驗證須為 0 | — | — | — |
| P4 vendor prefix 政策 | BLOCKED | G-delta | 上限 1127 條移除 | — | — |
| P5 `norm.css` | TODO | G-delta | 842 token 須零差異 | — | — |
| P6 Font Awesome | TODO | G-zero | 4545 條 | — | — |
| P7 `tablet` + profile API | BLOCKED | G-delta | — | — | — |
| **規則表產生器**(P8 前置,有期限) | **DONE** | 846 列 / 834 語法 1:1 / **830** 行為 1:1 / 16 例外;**30** mixin / 38 定義列 | `c240e20` | 2026-07-30 |
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
| P1 | 計畫書 §P1 判定此階段**可選**,要不要留這個 pin 尚未拍板。不做也不影響 P2/P3。 |
| P4 | L-2 —— IceBlue 作為 add-on 的瀏覽器支援聲明未定 |
| P7 | L-4 —— compact profile 的替代機制未定 |

### 已解除的 BLOCKED

| 階段 | 原本卡在 | 決定 | 日期 |
|---|---|---|---|
| P6 | L-5 —— ZK 11 的 icon 方向(FA / Lucide) | **Font Awesome 保留**。走計畫書 §P6 的「若 FA 保留」分支:寫 `scripts/gen-fa-css.js`,G-zero 4545 條。**不是**刪除 + 空 stub 分支 | 2026-07-30 |

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

### CAVEAT-3:master 既有的潛在 bug(順手撿到的)

`js/zkmax/big/less/biglistbox.less:281,389` 的 `background: contrast(@baseBackgroundColor);`:

- 值是 `var()` → LESS 無法求值 → 原樣輸出 `contrast(var(--zk-base-background-color))`,而
  **CSS 沒有產生顏色的 `contrast()`**(只有 `filter: contrast()`)→ 宣告無效、被瀏覽器丟棄。
- 值是字面值(`#FFFFFF`,正是 `readme.md:69` 建議客戶做的事)→ 編譯期算成 `background: #000000`。

所以**照著 readme 客製的客戶會意外啟用一條目前失效的宣告**。這是既有 bug,不是轉換造成的,
而且它逐條原樣通過 → `cssdiff` 看不到 → 閘門不受影響。要寫進 migration guide。

---

## P3 批次

P3 尚未開工。批次已於 2026-07-30 用 `cssdiff --list` 實測分界(原本的 `~8 / ~55 / ~11` 是估計值,
**三個數字都不對**):

| 批 | 範圍 | 檔數 | 狀態 |
|---|---|---|---|
| 批 1 | 輸出端 ≤20 條 | **20**(原估 ~8) | TODO |
| 批 2 | 輸出端 21–200 條 | **43**(原估 ~55) | TODO |
| 批 3 | 輸出端 >200 條 | **11** | TODO |
| | | 20+43+11 = **74** ✓ | |

74 = 77 個輸出減掉三個留在 LESS 的:`norm`(P5)、`font-awesome`(P6)、`tablet`(P7)。

批 1 有 20 檔而非 8 檔,對「批 1 的目的是驗證腳本」這件事是**好事** —— 語料更大,但每檔仍
≤20 條、可逐檔人工看完。批 3 的 11 檔:`popup` 217、`menu` 218、`tabbox` 237、`colorbox` 246、
`listbox` 261、`biglistbox` 299、`tbeditor` 375 + 380、`goldenlayout` 413 + 413、`combo` 586。

---

## 執行機制:workflow

`scripts/workflow/iceblue-drop-less.mjs` —— 一次跑**一個階段**,用 `{phase:"…"}` 指定:

| `phase` | 做什麼 | 可跑? |
|---|---|---|
| `prereq` | P8 的兩張規則表(**有期限**) | ✅ 現在就該跑 |
| `P2` | `build-css.js` + round-trip 自我證明 | ✅ |
| `P3` | 元件轉換,可加 `{batch:1\|2\|3}` | ✅(需 P2) |
| `P6` | `gen-fa-css.js` | ✅(需 P2) |
| `P1`/`P4`/`P5`/`P7`/`P8` | 回報 blocked 與卡住的原因 | ❌ |

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
