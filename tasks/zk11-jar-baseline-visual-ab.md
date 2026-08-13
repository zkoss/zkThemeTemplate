# 用 ZK 11.0.0 jar 的 DSP 當 Baseline，做桌面 + Mobile 視覺 A/B

> 目標(2026-08-13):以 `zk 11.0.0-jakarta.FL.20260811-Eval` 三顆 jar(zul / zkmax / zkex)
> 內建的 `.css.dsp` 為 A 側,對比本分支目前的轉換輸出(B 側),桌面與 mobile 各一組,
> 兩組截圖全部保留供人工複核。

## 0. 可行性評估結論:可以做,沒有阻擋級問題

先講四個在動手前查證出來的事實,它們決定了這個做法成不成立。

### (1) ZK 10.4 jar 與 ZK 11 jar 的 theme DSP **逐 byte 相同**

```
j11=81  j104=81
diff -rq j104/web j11/web  →  (空)
```

這件事很重要,因為 **visual harness 實際跑的 ZK runtime 不是本分支的 11.0.0**:
`ab-visual.js` 的 classpath 來自 `MARBLE_HOME` 的 `mvn dependency:build-classpath`,
而 Marble 的 pom 是 `10.4.0-jakarta.FL.20260713`(app log 也印 `Starting ZK 10.4.0.FL.20260713 EE`)。
本分支 pom 的 `zk.version=11.0.0-…` 只用在編 theme 的 Java。

原本這會是個混淆源(拿 ZK 11 的 CSS 餵給 ZK 10.4 的 DOM)。既然兩版 DSP 完全同 byte,
**這個混淆源不存在**,不需要動 Marble 的 pom,也不需要換 runtime。

### (2) jar 的 81 個 DSP 是本 theme 85 個的**嚴格子集**

current 有而 jar 沒有的 4 個,正好是 `visual-ab-harness.md` §6.1 already 標定的
「never requested」重複路徑:

```
js/zkmax/inp/css/tbeditor.css.dsp
js/zkmax/layout/css/goldenlayout.css.dsp
js/zkmax/med/css/cropper.css.dsp
js/zkmax/wgt/css/signature.css.dsp
```

jar 把同樣的檔案放在 `js/zkmax/{tbeditor,goldenlayout,cropper,signature}/css/` 底下。
換句話說 **官方 jar 獨立佐證了 §6.1 的判定**:那 4 個是死路徑。
覆蓋時不刪它們(反正不會被要求),比 `baseline-ab.js install a` 的刪除行為更保守。

### (3) jar 的 DSP 與 `baseline/` **78/81 逐 byte 相同**

只有 3 個不同,而且**三個都是 upstream drift**(master 比本分支的 fork 點前進),
不是轉換造成的:

| 檔案 | jar | baseline | 差異內容 |
|---|---:|---:|---|
| `js/zkmax/grid/css/grid.css.dsp` | 4449 | 294 | jar 多出整段 `.z-grid--stacking` **響應式卡片重排**(含 `--zk-resp-cols`)。baseline 連 taglib prologue 都沒有 |
| `js/zul/db/css/calendar.css.dsp` | 6486 | 5791 | jar 多出 daterangebox 的區間選取樣式 `.z-cell-range-{begin,end,mid,preview-mid,preview-end}` |
| `zul/font/font-awesome.css.dsp` | 175801 | 175837 | FA 別名選擇器清單(`.fas/.fass/.far/.fab`)排列不同,36 B |

**這一條同時是好消息**:78/81 與已經被變異測試驗證過的 `baseline/` 同 byte,
表示「覆蓋到 `target/classes/web/iceblue11` 會被真的載入」這件事,對其中 78 個檔案
是**既有證據直接涵蓋**的(S24 的 marker 注入、#36 的 HTTP 層辨別)。

而且 jar 是 **ZK 官方 build 產出的**,不是本機這套 `zkless-engine` 跑出來的 ——
拿它當 baseline 比 `baseline/` 更有說服力,因為它獨立於我們正要汰換的那條工具鏈。

### (4) 那 3 個差異檔**沒有引入新的圖檔相依**

```
grid.css.dsp      encodeThemeURL:0  url(:0
calendar.css.dsp  encodeThemeURL:0  url(:0
font-awesome      encodeThemeURL:0  url(:14   ← webfont,兩側相同
```

所以覆蓋後不會出現「CSS 指向 theme 目錄沒有的圖」的破圖假差異。

## 1. 必須先知道的兩個限制

### A. 這三個差異一定會出現在結果裡,而且**不是轉換的錯**

尤其 `.z-grid--stacking` —— 它是**響應式重排**,設計上就是在窄視窗/mobile 才生效。
**mobile 那一輪最可能因為它而出現大面積差異**。看到 grid 類頁面在 mobile 差很多,
第一順位懷疑是這個,不是 P4/P5/P6 的轉換。

判讀規則:凡是差異只出現在 grid / calendar(datebox、daterangebox)/ 圖示字型 三類,
先對照上表確認是不是 upstream drift,再談是不是回歸。

### B. Mobile 這一半的 harness **原本不存在**,要現做

`src/test/playwright/playwright.config.ts` 只有一個 project(`ab-capture`,
Desktop Chrome 1280×900)。計畫書 P7 那行(`:476`)寫的「tablet 需要 mobile UA 的
Playwright 專案」就是指這個缺口,至今沒補。

Marble 那邊已經有一個能用的 tablet project 可以照抄
(`zkThemeTemplate/src/test/playwright/playwright.config.ts:112-125`):

```
iPad Air 直式 834×1112 + iPad mobile UA + hasTouch:true + isMobile:true
```

且其註解已確認機制:`TabletThemeURIHandler` 只在 request UA 是 mobile 時注入
`zkmax/css/tablet.css.dsp`;client 端 `zk.tabletUIEnabled = !!zk.mobile`,
在 DOMContentLoaded 把那個 `<link disabled>` 打開(ZK `index.ts:74-80`)。
EE 也確認開著(app log:`Starting ZK 10.4.0.FL.20260713 EE`),
所以 `Iceblue11ThemeWebAppInit` 的 `Themes.register("tablet:iceblue11", …)` 有生效。

**但 mobile 視窗下的截圖決定性是未證實的** —— §4/§5 那 8 條經驗修正全部是在
1280×900 下調出來的。所以要先跑 mobile 自我驗證(同一個 build 截兩次,期望 0 差異),
才可以拿 mobile 的數字說話。

## 2. 執行步驟

| # | 步驟 | 驗證 |
|---|---|---|
| 1 | `scripts/jar-baseline.js extract` — 從三顆 jar 抽 81 個 DSP 到 `target/zk11-baseline/` | 81 個檔、逐檔 sha256 記進 `target/zk11-baseline/manifest.json` |
| 2 | `playwright.config.ts` 加 `ab-capture-mobile` project;`ab-visual.js capture <label> [project]` 加 `--project` 傳遞,manifest 記 `project` | `diff` 在兩側 project 不同時警告 |
| 3 | 快篩:mobile UA 下 `zk.mobile === true` 且 tablet 樣式表 `disabled === false` | 直接在瀏覽器 probe,不通過就停 |
| 4 | 桌面自我驗證 `cur-desktop` vs `cur-desktop-b` | 期望 `pages differing: 0` |
| 5 | Mobile 自我驗證 `cur-mobile` vs `cur-mobile-b` | 期望 `pages differing: 0`;不為 0 就先修 harness |
| 6 | 快照現況 85 檔 → `jar-baseline.js install` 覆蓋 81 個 jar DSP | 覆蓋後逐 byte 回比 jar;HTTP 層 probe 確認 `z-grid--stacking` **出現**在服務出來的彙總 CSS(current 側為 0 檔,是乾淨的鑑別字串) |
| 7 | 截 `jar-desktop`、`jar-mobile` | manifest 的 theme fingerprint 必須與 current 側 DIFFERENT |
| 8 | `jar-baseline.js restore` 從快照還原 | 逐檔 sha256 等於步驟 6 的快照;HTTP probe 確認 `z-grid--stacking` **消失** |
| 9 | `visual:diff cur-desktop jar-desktop`、`visual:diff cur-mobile jar-mobile` | 產出兩份 HTML 對照報告 |

步驟 6 / 8 的 HTTP probe 就是這次的**變異測試**:`z-grid--stacking` 在 jar 有、
current 沒有,是一個乾淨的單向鑑別字串 —— 它出現代表 jar 的 DSP 真的被服務了,
不是快取、不是原本的檔案。

## 3. 產出物(全部保留)

```
target/ab-visual/shots/cur-desktop/      # B 側 桌面
target/ab-visual/shots/cur-mobile/       # B 側 mobile
target/ab-visual/shots/jar-desktop/      # A 側 桌面(ZK 11 jar)
target/ab-visual/shots/jar-mobile/       # A 側 mobile(ZK 11 jar)
target/ab-visual/report-cur-desktop-vs-jar-desktop.html
target/ab-visual/report-cur-mobile-vs-jar-mobile.html
```

每個 shots 目錄含 `manifest.json`(每頁 sha256 + theme fingerprint + project)。
自我驗證用的 `*-b` 目錄也留著,證明當次的決定性。

---

# 執行結果(2026-08-13)

## 4. 變異測試:覆蓋確實被服務了

`z-grid--stacking` / `--zk-resp-cols` / `z-cell-range-preview-end` 三個字串在 jar 有、
在轉換輸出 0 個檔案有,是乾淨的單向鑑別字串。對服務出來的彙總 CSS 直接數出現次數:

| 時機 | 彙總大小 | `z-grid--stacking` | `--zk-resp-cols` | `z-cell-range-preview-end` | 判定 |
|---|---:|---:|---:|---:|---|
| 覆蓋前 | 562834 B | 0 | 0 | 0 | CONVERTED |
| 覆蓋後 | 581039 B | **35** | **1** | **1** | **JAR** |
| 還原後 | 562834 B | 0 | 0 | 0 | CONVERTED |

還原後的彙總大小**逐 byte 回到覆蓋前的 562834 B**,`restore` 也逐檔 sha256 對過快照
(85/85),`npm run check:baseline` 仍 OK(86 檔)。
所以「不是快取、不是原本的檔案」這件事,這一輪是**直接量到的**,不是推論。

安裝時 `install` 自己回報:81 個檔中 **67 個與轉換輸出不同、14 個原本就相同**。

## 5. 決定性(自我驗證)

| project | 比較 | pages differing | 判定 |
|---|---|---:|---|
| 桌面 `ab-capture` | cur-desktop vs cur-desktop-b | **0** | PASS |
| Mobile `ab-capture-mobile` | cur-mobile vs cur-mobile-c | **0** | PASS |
| Mobile | cur-mobile vs cur-mobile-b | 1(`breadcrumb`) | 見下 |
| Mobile | cur-mobile-b vs cur-mobile-c | 1(`breadcrumb`) | 見下 |

### `breadcrumb` 是雙穩態,而且證實與 theme 無關

每次都是**同一個位置、同一個量**:`4px maxΔ 13 box 4,39,4,42` ——
x=4 是一個黑框元素(x≥5 為 `0,0,0`)左緣外的反鋸齒毛邊,兩種狀態是
`255,255,255` 與 `242,242,242`。mobile 的 `isMobile` + viewport meta 造成頁面縮放,
點陣化落在非整數位移上,毛邊比桌面強;而 §5 的 `maxDelta: 8` 是**只在 1280×900 量出來的**。

決定性證據 —— 四次擷取兩兩比對:

```
cur-mobile   vs cur-mobile-c   identical
cur-mobile-b vs jar-mobile     identical      ← 不同 theme bytes,卻完全相同
cur-mobile   vs cur-mobile-b   4px maxΔ 13
cur-mobile   vs jar-mobile     4px maxΔ 13
```

`cur-mobile-b` 與 `jar-mobile` 來自**不同的 theme bytes 卻逐 byte 相同**;
`cur-mobile` 與 `cur-mobile-b` 來自**相同的 theme bytes 卻不同**。
兩個狀態的分組是 `{cur-mobile, cur-mobile-c}` 與 `{cur-mobile-b, jar-mobile}`,
與 A/B 的側別**正交**。所以這 4px 在 mobile A/B 裡出現時是雜訊,不是主題差異。

尚未修:要嘛把 mobile 的 noise floor 依實測重新標定,要嘛給 `breadcrumb` 一條
帶實測理由的 per-project SKIP。在那之前,mobile 結果要人工排除這一頁。

## 6. A/B 結果

theme fingerprint `ff74ab9368d92231`(轉換輸出)vs `b1a18ca0a29aeebf`(ZK 11 jar),
DIFFERENT —— 兩側確實是不同 bytes,不是空轉。

| project | pages compared | pages differing | 實際內容 |
|---|---:|---:|---|
| 桌面 | 116 | **1** | `responsive-grid` size **1280×1283 → 1280×3300** |
| Mobile | 116 | **2** | `responsive-grid` size **834×1224 → 834×3172**;`breadcrumb`(上述雜訊) |

其餘 115 頁 × 兩個視窗全部落在既有雜訊帶內(maxΔ ≤ 3)。

### 唯一的真差異 = §0(3) 預測的 upstream drift,而且**只有 grid 這一條看得見**

三個 upstream drift 檔案的實際視覺後果:

| drift | 視覺後果 |
|---|---|
| `zkmax/grid` `.z-grid--stacking` | **看得見** —— `responsive-grid` 頁在 jar 側高度 2.6 倍(卡片重排生效),轉換側維持表格 |
| `calendar` `.z-cell-range-*` | 看不見 —— 樣式在,但語料沒有處於區間選取狀態的 daterangebox,無元素命中 |
| `font-awesome` 別名清單 | 看不見 —— 別名等價,36 B 差異無渲染後果 |

### 這一條是真的缺口,不只是「基準比較新」

```
grep -rl 'grid--stacking' src/main/resources/web/   →  0 個檔案
find src/main/resources/web/js/zkmax/grid -type f   →  只有 css/grid.css(less/ 是空的)
```

本分支的 `zkmax/grid` 來源**完全沒有**響應式卡片重排那段。ZK 11 出貨的有。
這不是轉換寫錯,是分支 fork 點落後 master;但既然這條分支的目的是**取代** master 的
LESS,合併前必須把這段補進 `js/zkmax/grid/css/grid.css`,否則 ZK 11 的響應式 grid
會在換成本主題後消失。

## 7. 結論

**除了一頁已知的 upstream drift,轉換輸出在 116 頁 × 桌面/mobile 兩個視窗下,
與 ZK 官方 11.0.0 jar 的算繪結果完全一致。**

而且這次的 A 側是 ZK 自己 build 出來的,不經過本機 `zkless-engine` ——
所以這個一致性不可能是「兩側共用同一個編譯器」造成的假象,
這是 `baseline/` 當 A 側時拿不到的性質。

附帶結果:mobile project 讓 `zkmax/css/tablet.css.dsp` **第一次真的被畫出來**
(mobile 下 `zk.mobile=1`、該 `<link>` `disabled=false`、**246 條 live 規則**;
桌面下 `disabled=true`、0 條)。`visual-ab-harness.md` §6.1 的覆蓋率上限
因此從 **80/85 提升到 81/85** —— 剩下 4 個是那 4 個死路徑重複檔。

---

# 與 ZK 11 對齊(2026-08-13,同日)

## 8. upstream drift 的完整集合 = 3 個檔

fork 點 = `a89d44e0`(正是 `baseline/.built-from` 記的那顆)。`origin/master` 領先 **6 個 commit**,
動到 16 個檔;但其中 9 個新增的 component `.less` 早在 2026-08-05 的 ZK 10.4 backfill 就進來了。

判準用的是使用者提的第二個方法(**拿 6 個 commit 改過的 less 去對 ZK 11 jar 的 DSP**),
而且直接做成全樹版本:`cssdiff jar baseline` → **7 檔差異,其中 4 個是死路徑重複檔(0 筆記錄)**,
真正的 drift 就是 3 個:

| 檔案 | 方向 | 內容 |
|---|---|---|
| `js/zkmax/grid/css/grid.css` | **落後** | `+.z-grid--stacking` 響應式卡片重排(ZK-5409,LESS 205 行) |
| `js/zul/db/css/calendar.css` | **落後** | `+.z-cell-range-*`(`Calendar.setRangeHighlight` 的公開 API 用) |
| `zul/font/_font-awesome.css` | **落後** | **`−`**`.fas/.fass/.far/.fab`:upstream 把這些裸別名**移除**了 |

第三條方向相反,只看「jar 比較新」會判反 —— 是 upstream 刪、本分支要跟著刪。

## 9. 三個連帶決策(都不是機械式編輯)

1. **`baseline/` 必須 backfill**,否則本分支永久跑不過自己的閘門。它**有進 git 追蹤**(86 檔,可回復),
   且 `.built-from` 記著 2026-08-05 完全相同的前例。已比照辦理並寫上出處,包含 jar 憑什麼當基準:
   **它的 81 個輸出裡有 78 個在 backfill 前就已經與 baseline 逐 byte 相同**,那 3 個就是全部的差異。
2. **`build-css.js` 的 `NO_HEADER` 過期了。** upstream 的 `grid.less` 現在開頭多了
   `@import "~./zul/less/_header.less"`,輸出因此帶 `<%@ taglib %>` prologue。移除 grid;
   並回頭對 jar 確認 listbox / tree 仍然沒有 prologue。
3. **P4a 的 728 → 731。** 兩處獨立宣告**各自**算出 731 —— calendar 新區塊的那一次
   `.borderRadius()` 展開,正好貢獻 3 條新符合資格的移除。這是 tripwire 正常運作,
   不是「改一邊去遷就另一邊」;理由寫在常數旁邊。檔案數維持 45(calendar 本來就在集合內)。

## 10. 驗證

`cssdiff jar baseline` → **diff records: 0**。grid 71↔71 條逐條相同;font-awesome 完全相同;
calendar 只剩 15 條 `-moz-/-o-/-ms-border-radius`,正是本分支的前綴政策。

閘門:`check:p4a` / `check:p4b` / `check:build-css` / `check:bytes` / `check:fa-css` /
`check:less-conventions` / `check:density-css` / `check:doc-refs` **全部 OK**。

**既有的兩個失敗與本次無關**,未觸碰:`check:var-table`(expected 846 rows、measured 866,
`zul/less/_zkvariables.less` 多 20 個 token)與 `check:mixin-table`。
以 `git stash` 把本次改動全部收起後重跑,兩者**仍然失敗**,且兩支生成器不讀本次改到的任何檔案。

### 視覺重跑:桌面與 mobile 都 **0 頁差異**

| project | pages differing | theme fingerprint |
|---|---:|---|
| 桌面 `sync-desktop` vs `jar-desktop` | **0** | DIFFERENT `475344f8…` / `b1a18ca0…` |
| Mobile `sync-mobile` vs `jar-mobile` | **0** | DIFFERENT `475344f8…` / `b1a18ca0…` |

fingerprint DIFFERENT 而頁數 0,代表這個零**不是空轉**:兩側 bytes 確實不同
(P4a/P4b/density 的核准差異),但沒有一頁畫出來不一樣。

**正向控制(避免「兩邊一樣壞」的假通過)**:`responsive-grid` 的高度

```
desktop  1280x1283  →  1280x3300   jar=1280x3300
mobile    834x1224  →   834x3172   jar= 834x3172
sync-mobile vs jar-mobile responsive-grid 逐 byte 相同: true
```

補進來之後頁面**變高 2.6 倍並且正好落在 jar 的尺寸上**,證明卡片重排是真的生效了,
不是兩側同樣沒有。

附帶:這一輪 mobile 的 `breadcrumb` **沒有出現在差異清單裡** —— 雙穩態這次剛好落同一邊,
再次佐證它是擲硬幣、不是主題差異。
