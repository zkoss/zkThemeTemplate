# 視覺 A/B harness

> **狀態**:已實作、**自我驗證通過**(2026-08-05)。這是 L2.4 的〈視覺 A/B harness〉工作項,
> P4 / P5 / P7 的前置。
> 計畫書的要求原文:**重用 Marble 既有的 preview 頁面與 Playwright,不搬語料進本分支**;
> 只需讓 preview app 能載入本模板編出的 theme jar;A/B 兩邊是**同一分支的兩次 build**;
> **先拿同一個 build 截兩次確認 diff 為零**,才可以拿它比對不同 build。
>
> **收工數字**:語料 **116 頁**、theme 指紋 `6e5a856e8a80ddf9`(85 個 `.css.dsp`)。
> 同一個 build 截兩次 → **pages differing: 0** 且 **pages missing: 0**(連續三輪),噪音 3–7 頁。
> **反向控制**:對輸出注入一行 `.z-button{border-radius:12px}` → **36 頁差異**,最小的一頁 370px。
>
> **⚠ 第 4 層獨立驗證(2026-08-06)修正了兩件事,兩件都在這份文件裡。**
> **(1)** 原本寫的「連續兩輪 0」**不可重現** —— 覆核者兩次重跑都拿到 `pages differing: 1`。
> 根因是 §5 #7 的子 frame,已修;上面的「連續三輪」是修完之後量的。
> **(2)** 原本寫的「對噪音上限有 **≈6 倍**餘裕」**不能推廣**:button 圓角是對下限**最有利**的個案。
> 七輪逼近實測顯示**餘裕依元件出現頻率二分**,稀有元件會**真漏接** —— 見 §5.1,那一節才是
> 讀這份文件的人該記住的部分。報告 `doc/l4-verify-visual-ab.md`。

## 1. 它證明什麼、不證明什麼

| | |
|---|---|
| **證明** | 同一組頁面、同一個瀏覽器、只換 theme 輸出,**畫面有沒有變、哪幾頁變了** |
| **不證明** | 變得對不對(那是人看);也不是覆蓋率 —— 頁面用的是 Marble 的語料,**不是**針對 85 個輸出檔設計的。**而且對稀有元件會漏接**,見 §5.1。覆蓋率的**上界**另外量,**80/85**,見 §6 |
| **結構上看不到** | `camera.css.dsp` / `barcodescanner.css.dsp` / `video.css.dsp` —— 整個語料裡**唯一**會渲染這三組選擇器的頁面,正好就是因硬體 / 解碼時序而被 SKIP 的那三頁。要改這三個檔**不能拿本 harness 收工** |
| **主閘門仍是 `check:cssdiff`** | declaration diff 在「瀏覽器實際收到的 CSS」那一層已經是完整的等價證明。**視覺 A/B 是輔助,不是主閘門**(L2.2) |

**訊號品質的已知限制**(照抄 L2.4 的警告,並補上實測):Marble 的頁面大量使用
IceBlue 沒有的 `z-*` utility class,版面會塌。塌掉的版面在 A/B 兩邊**是一樣的**,
所以**不影響 diff 的有效性**,只降低**敏感度** —— 一個被壓成 0 高度的區塊,
它的 border 改了也照不出來。**看到乾淨的 diff 時,別把「沒看到差異」當成「沒有差異」。**

額外的兩個盲點,是為了換取決定性而**刻意**接受的:

1. 截圖前注入 `transition:none / animation:none` ⇒ **過渡與動畫的改動照不出來**。
   這一類改動是 declaration 層的,由 `check:cssdiff` 覆蓋。
2. `fullPage` 截整頁 ⇒ 頁面高度會被內容推動,**一處改動可能讓整頁位移**、放大 diff。
   這是誤報方向(過度敏感),不是漏報方向,可接受。

## 2. 機制

```
Marble worktree(../zkThemeTemplate,分支 new_theme)         本 worktree(iceblue)
  target/test-classes/                                        target/classes/
    web/**/*.zul        ← 123 個頁面(語料,不搬進本分支)        web/iceblue11/**  ← 85 個 .css.dsp
    zk/example/*.class  ← 頁面用到的 composer / VM              metainfo/zk/config.xml
    zk/example/iceblue/ThemePreviewIceblueApp.class              org/zkoss/theme/iceblue11/*.class
                    │                                                    │
                    └────────────── 同一個 JVM classpath ────────────────┘
                                          │
                       java -Dorg.zkoss.theme.preferred=iceblue11
                                          │
                                   127.0.0.1:8081
                                          │
                            Playwright(本分支的 config + spec)
                                          │
                        target/ab-visual/shots/<label>/<page>.png
```

**三個讓它成立的事實**(全部實測,不是推論):

| 事實 | 為什麼載入得動 |
|---|---|
| `ThemePreviewIceblueApp` **故意不設** preferred theme(原本用來抓 ZK 內建 iceblue 的基準) | ZK `Library.getProperty` 在自己的 map 找不到時**會退回 `System.getProperty`**(`zcommon/…/lang/Library.java:77`)⇒ 命令列 `-Dorg.zkoss.theme.preferred=iceblue11` 就能選到本模板的 theme,**Marble worktree 一個檔都不用改** |
| 本模板的 theme 是靠 `metainfo/zk/config.xml` 的 `<listener>` 註冊 | 只要 `target/classes` 在 classpath 上,`Iceblue11ThemeWebAppInit` 就會跑、theme `iceblue11` 就註冊好 |
| ZK 沒有內建 `web/iceblue11/` 目錄(`zul-*.jar` 裡是**未加前綴**的 `web/zul/css/`) | 不存在「ZK 自己的複本遮蔽我們的」這種問題 —— 服務到的一定是本模板編出來的 |

### 2.1 為什麼要**排除** Marble 的 `target/classes`

classpath 只放 Marble 的 **`target/test-classes`** + 相依 jar + 本模板的 `target/classes`。
**`MARBLE/target/classes` 必須排除**,否則 `MarbleThemeWebAppInit` 會跑,而它做兩件事:

```java
config.setThemeProvider(new MarbleThemeProvider());
config.setCustomThemeProvider(true);      // 鎖住,後面誰都換不掉
```

`MarbleThemeProvider.beforeWidgetCSS()` 會把 `~./zul/font/font-awesome.css.dsp`
**整條丟掉**(Marble 用 Lucide mask,不要 FA)。本模板的 `font-awesome.css.dsp` 是
**P6 的全部交付、佔整棵樹 28%** —— 被丟掉的話 harness 就再也看不到它,
正是 L2.2 附帶條件 #1 說的「**被測的程式碼路徑必須真的被走到**」那個坑。
`mvn dependency:build-classpath` 只吐相依 jar、不含專案自己的 output,所以這個排除是自然成立的,
但**啟動後仍然要用探針證實**(見 §2.2)。

### 2.2 啟動守門探針(不可省)

app 起來之後、截圖之前,先抓 `/button.zul` 並斷言:

- `_zkiju-iceblue11` 出現 ⇒ 服務中的彙整 CSS 來自本模板的 theme
- `marble` 出現 **0 次** ⇒ Marble 的 provider 沒有介入

任何一條不成立就**中止**,不截圖。理由:一個「主題其實沒載到」的 harness 會給出
完美的零差異,而那個零是假的 —— 跟 #41 空轉閘門同一種錯誤。

**第二條目前是裝飾性的**(第 4 層實測):真的把 Marble 的 `target/classes` 混進 classpath 時,
`marble` 在 HTML 裡出現次數**仍然是 0** —— `MarbleThemeProvider` 不會把這個字面字串寫進頁面。
擋下那個情境的一直是第一條。要讓第二條成為真正的第二道防線,得改用一個 Marble provider
**真的會留下痕跡**的字串,而不是假設主題名會出現。

### 2.3 指紋:讓 A/B 不會空轉

`capture` 會把當下 `target/classes/web/iceblue11` 全部 `.css.dsp` 的
`(相對路徑, sha256)` 排序後再 hash 一次,寫進 `<label>/manifest.json`。
`diff` 同時報**兩件事**:

| 指紋 | 差異頁數 | 判讀 |
|---|---|---|
| 相同 | 0 | ✅ 自我驗證通過 —— harness 是決定性的 |
| 相同 | > 0 | ❌ **harness 自己在飄**,不是主題變了 —— 先修 harness |
| 不同 | > 0 | 有變化,逐頁人工判讀(G-delta) |
| 不同 | 0 | 沒有視覺效果 **或**語料照不到 —— **不可以**直接當成「沒有差異」 |

這是把 S26 的「#41 兩側同 byte ⇒ 那個 0 不算數」搬到視覺層:
**先證明兩側不是同一批 byte,再談差異數字。**

## 3. 用法

前置:Marble worktree 存在且已編過(`target/test-classes` 有東西)。
路徑可用 `MARBLE_HOME` 覆蓋,預設 `../zkThemeTemplate`。

```bash
npm run visual:selftest                       # 同一個 build 截兩次,期望 pages differing: 0
npm run build:css                             # (改動主題之後)
npm run visual:capture -- before-p5
#   … 做 P5 的改動、重新 build …
npm run visual:capture -- after-p5
npm run visual:diff -- before-p5 after-p5
```

`capture` 自己管 app 生命週期:解析 classpath → 起 app(8081)→ 守門探針 → Playwright → 關 app。
不需要事先手動起 preview app,**也不要**先起 —— port 被佔住時它會直接停下來並告訴你怎麼關。

輸出:

- `target/ab-visual/shots/<label>/<page>.png` + `manifest.json`
- `target/ab-visual/report-<a>-vs-<b>.html` —— 只列有差異的頁,左右並排

**不提交任何基準圖。** A/B 的兩側都是**同一分支的兩次 build**,基準圖沒有意義而且會腐爛
(Marble 那邊的 `doc/screenshots/` 是它自己主題的迴歸基準,兩件事不要混)。
`target/` 已在 `.gitignore` 內。

## 4. 決定性的處理

| 風險 | 處理 |
|---|---|
| `networkidle` 在 usecase SPA 上會**卡住**(ZK AU 長連線) | 用 `domcontentloaded` + 等 `zk.loading === 0` |
| Inter web font 載入競態(整頁垂直位移 ~7px) | 截圖前 `await document.fonts.ready` |
| 圖片載入競態(含**故意壞掉**的圖:`avatar.zul` 用它示範 label fallback) | 等 `document.images` 全部 `complete`(失敗也算 complete,這正是重點);best-effort 5s,不讓一張永不回應的圖卡死整輪 |
| 非同步版面沉降(ZK 在 client 端算尺寸) | **拍到穩定為止**:連續兩張到噪音層以內才收(最多 8 輪 × 250ms)。收不到就**不寫 PNG、讓該頁失敗** ⇒ `diff` 報 `missing`,看得見 |
| 過渡動畫 / 游標閃動 | 注入 `transition:none / animation:none`;`caret: 'hide'`;`animations: 'disabled'` |
| **動畫 GIF**(CSS 關不掉) | 攔**所有** `.gif`、抓 body、含 `NETSCAPE2.0` 才 `abort`,其餘原樣放行。**看內容不看路徑** —— 寫死清單漏過語料側的 `~./img/network.gif`。見 §5 #8 |
| **子 frame 裡的內容**(所有頁面層的等待都到不了) | `settleFrame()`:逐一等每個子 frame 的 `readyState` / `zk.loading` / 圖片,並注入同一份 no-motion CSS。見 §5 #7 |
| 跨 process 的光柵化噪音 | `png-compare.js` 的**實測噪音下限**(≤64px 且 maxΔ ≤8),噪音頁**照樣列出來** |
| 瀏覽器版本漂移(P5 的 before/after 可能隔好幾天) | `@playwright/test` **精確鎖版**;版本寫進 manifest,`diff` 兩側不同就出 WARNING |
| 硬體 / 媒體 / 隨機資料頁 | `SKIP` 清單,**每一條都要寫原因**。清單由 selftest 逼出來,不是先猜的 |

## 5. 建立過程的實測發現(這一節是給下一個人看的)

自我驗證從 **14/115 頁差異** 收斂到 **0/116**,中間每一步都是量測逼出來的,不是猜的。
**#1–#6 是建 harness 當時的;#7–#8 是第 4 層獨立驗證逼出來的** —— 也就是說,前六項收斂完之後
它看起來是綠的,而**那個綠不可重現**:

| # | 現象 | 根因 | 處置 |
|---|---|---|---|
| 1 | 14 頁差異,多數只差幾百 byte、尺寸相同 | 非同步版面沉降;`navbar` 高度差 3px;`iframe` 一輪載到一輪沒載到 | 改成「**拍到穩定為止**」 |
| 2 | 改成穩定判定後,**6 頁永遠不穩**,連續兩張差到 2.7% 畫面、maxΔ 255 | **`.z-progressmeter` 的背景是動畫 GIF**(`prgmeter-anim.gif`),GIF 不是 CSS 動畫 ⇒ `animation:none` 與 Playwright 的 `animations:'disabled'` 都關不掉。全主題共 5 個動畫 GIF,另 4 個是 `progress{,-dark}-{32,72}.gif` | `route().abort()` 攔掉這 5 個 ⇒ 版面與背景色不變,只少了會動的紋理。**連帶把 `loading` / `loadingbar` 從 SKIP 放回來**(它們原本就是因為這個才不穩) |
| 3 | 剩 5–7 頁差 2–51px,永遠落在**圓角弧線**上,單一 channel 差 ±1 | 跨 browser process 的光柵化量化差異(同一個 process 內是穩定的,這也是「拍到穩定」會收斂的原因) | 試過 `--disable-lcd-text` / `--disable-font-subpixel-positioning` / `--font-render-hinting=none` / `--force-color-profile=srgb` / `--deterministic-mode`,**都消不掉**;`--deterministic-mode` 反而讓載入變得不穩(每輪隨機 4 頁拍不到)且慢 4 倍 ⇒ **只留前四個字體旗標**,噪音改用下限處理 |
| 4 | `timepicker` 的 maxΔ 一路到 **7**,超過原本設的 ±1 | 那是**飽和紅色**錯誤邊框對灰底的圓角混色 —— 量化誤差的**幅度與兩色對比成正比**,不是固定 ±1 | 噪音下限改成**兩個都要成立**:`maxDelta ≤ 8`(實測最大 7)且 `diffPixels ≤ 64`(實測最大 42) |
| 5 | `avatar` 差 218px / maxΔ 49,落在一個 22×12 的小框 | `avatar.zul:36` **故意**指向不存在的圖來示範 label fallback ⇒ fallback 有沒有畫出來是競態 | 加「等 `document.images` 全部 complete」 |
| 6 | `preview.zul` 一張 11MB、174404px 高、載入 20s | 它是彙整總覽頁 | 列入 SKIP:上面每個元件都有自己的頁,它加成本不加覆蓋,而且**裡面的差異無法定位** |

| 7 | 自我驗證宣稱的 0 **重跑不出來**:`iframe` 6855px / maxΔ255,兩次獨立重跑幾乎同一個 box | **spec 的每一個等待(`waitForFunction` / `addStyleTag` / `fonts.ready`)都只作用在 main frame**,而 `iframe.zul` 用真正的 `<iframe>` 內嵌 `~./html.zul` ⇒ **內層頁面從來沒有被等過**。臨時探針量到:main frame 全部等待完成的當下,子 frame 是 `readyState=loading` 且 `zk` 尚未載入。全 116 頁只有這一個子 frame | 新增 `settleFrame()`,逐一等每個子 frame(`readyState==='complete'`、有 `zk` 才等 `zk.loading`、圖片 `complete`)並注入同一份 no-motion CSS |
| 8 | 修完 #7 之後 `toolbar` 開始**間歇**壞掉:5 次 capture 中 2 次(一次 255px / maxΔ 59,一次整頁拍不穩 ⇒ `MISSING`) | 與 #2 同型,但那份**寫死的清單漏了語料側**:`toolbar.zul` 用的是 ZK 自帶的 `~./img/network.gif`,**也是動畫 GIF**(NETSCAPE2.0、6011 bytes) | 改成**看內容**:攔所有 `.gif` → `route.fetch()` → 含 `NETSCAPE2.0` 才 abort。實測 ABORT `prgmeter-anim` / `progress-32` / `progress-72` / `network.gif`,keep `volumn` / `live` / `defender` / `battery`。**第一版正規表示式 `/\.gif(\?\|$)/` 是錯的** —— 漏掉 ZK 的 `;jsessionid=` **路徑參數**,`network.gif` 根本沒被攔到;是探針抓到的,不是推理出來的 |

### 5.1 靈敏度:「≈6 倍餘裕」只對常見元件成立

第 4 層用**七輪由大到小**的注入逼近下限(全部落在 build 產出,驗完 `npm run build:css` 還原):

| 輪 | 改動 | 元件出現頻率 | 抓到 | 最小 diffPixels |
|---|---|---|---|---|
| 1–2 | `.z-button{border-color:rgba(0,0,0,0.02)}` → `0.004` | 常見 | 37/116 → **39/116** | 364px → **424px** |
| 3–5 | switch 縮圖陰影 alpha `0.16` → `0.10` / `0.19` / **`0.17`** | 稀有(4 頁、各 1–4 實例) | 4/116 | 314px → 194px → **93px** |
| 6 | 同上 → **`0.165`**(比第 5 輪只小一半) | 稀有 | **2/116** | **44px / 52px ⇒ 被判為 noise、真漏接** |
| 7 | `.z-button:hover{box-shadow:…}` | 常見,但只在 `:hover` | 0/116(**預期內**,截圖不觸發 hover) | — |

**結論:`8 / 64` 不是統一的「太鬆」或「剛好」,而是依元件出現頻率二分。**
對**常見**元件幾乎沒有上限 —— 連 `rgba(0,0,0,0.004)` 這種人眼分辨不出的改動都在 39 頁被抓到。
對**稀有 / 小面積**元件,餘裕在第 5 輪與第 6 輪**之間就耗盡**:同一顆規則的同一種修改,
在多實例頁被抓到、在單實例頁被吞掉。那是**靜態、會實際畫在畫面上**的改動,
不是 hover 那種已揭露的狀態閘門。

**所以**:harness 的「0 差異」只有在改動落在**高頻元件**時才是強證據。
P4 / P5 / P7 若動到只出現 1–2 個實例的元件,**不能單獨拿它收工** —— 要另外人工核對,
或補一頁多實例的測試頁。

**為什麼不用比例容差**:Marble 自己的截圖套件用 `maxDiffPixelRatio: 0.01`(1% ≈ 11500px)。
在這個用途上太鬆 —— 一條 1px border 畫在 200px 寬的元件上只有約 200px ≈ 0.017%,
**任何鬆到能吸收噪音的比例,也鬆到能吸收真正的邊框改動**。所以下限用
「**最大單 channel 差**」為主、絕對像素數為輔,兩個都是量出來的。
反向控制證實這個下限**在常見元件上**有牙齒:注入一行 button 圓角 → 36 頁差異、最小 370px、maxΔ 255。
**這句話不能再往外推一步** —— 界線在 §5.1。

**噪音頁永遠會被列印出來。** 下限只決定 verdict,不決定覆核者看得到什麼。

### 5.2 「兩張圖肉眼看不出差別」時該怎麼讀報告(ZK 11 jar baseline A/B 逼出來的)

ZK 11 jar baseline 那一輪,mobile 只有 `breadcrumb` 被判 `differs`
(`4px maxΔ 13 box 4,39,4,42`),而**把兩張 PNG 並排看是真的看不出任何差別**。
這一節記錄那次追下去的結果,因為「報告說有差、眼睛說沒差」會反覆出現。

**先講單位 —— 這是最容易誤讀的一點。**

| 欄位 | 單位 | `breadcrumb` 的值 | 白話 |
|---|---|---|---|
| `diffPixels` | **像素個數** | `4` | 整張 834×1224(≈102 萬像素)裡,只有 **4 個**像素不一樣 |
| `maxDelta` | **8-bit 色階(0–255)**,**不是**像素距離 | `13` | 那 4 個像素裡,最嚴重的一個 **亮度差 13/255 ≈ 5%** |
| `box` | 像素座標 `x0,y0,x1,y1` | `4,39,4,42` | 差異全部落在 **x=4 這一條寬 1px、高 4px 的直線**上 |

所以 `maxDelta ≤ 8` 讀作「**任何像素的任何一個 channel,差不可以超過 8 階**」,
**不是**「不可以位移超過 8 個像素」。`breadcrumb` 這一筆的**位移**其實是 **2 列**,
**色階差**是 **13** —— 兩個不同的數字,混在一起看就會覺得報告在鬼扯。

**那 4 個像素到底是什麼:** 用 `node scripts/diff-viz.js <a.png> <b.png> <outDir> <tag>`
放大來看(它會產出 `-locator.png` 定位、`-zoom.png` 放大三連圖 A|B|放大後的差異,
並把逐像素數值印到 stdout):

```
  x     y     A(r,g,b)        B(r,g,b)        Δmax
  4     39    255,255,255     243,243,243     12
  4     40    255,255,255     251,251,251      4
  4     41    242,242,242     255,255,255     13
  4     42    251,251,251     255,255,255      4
```

那是頁面第二行文字 `Trail with 3 link items…` 開頭那個大寫 **`T`** 的
**最外側一欄抗鋸齒殘影**。A 把這團極淡的灰畫在 y=41–42,B 畫在 y=39–40 ——
**同一團墨往上跑了 2 列**。`T` 本體(x≥5 的黑色筆畫)兩邊**逐像素相同**。
灰階 242 / 251 對白底 255,本來就接近隱形,再加上只有 1px 寬 —— 看不出來是正常的。

**這也解釋了 Δ13 從哪來。** §5 #4 說「量化誤差的幅度與兩色對比成正比」,
那講的是**同一個位置的覆蓋率被量化到不同階**。這裡是另一種:**淡墨整團位移**,
於是差值等於**那團墨本身的振幅**(255−242=13),而振幅上限由邊緣對比決定 ——
黑字白底是滿量程,所以文字抗鋸齒的位移天生就會頂到比較大的 Δ。

**雙穩態(bistable)的意思:** 同一個輸入重跑,結果**不是散布在一個連續區間**,
而是**每次都落在兩個固定狀態的其中一個**,像擲硬幣。用 5 組 mobile capture
(3 種不同的 theme 指紋)實測:

| 頁面 | 相異的像素狀態數 | 狀態分組(括號為 theme 指紋前 6 碼) | 跨狀態簽章 |
|---|---|---|---|
| `breadcrumb` | **2** | ① `cur-mobile`(ff74ab)、`cur-mobile-c`(ff74ab)<br>② `cur-mobile-b`(**ff74ab**)、`jar-mobile`(b1a18c)、`sync-mobile`(475344) | `4px maxΔ13 box 4,39,4,42` |
| `organigram` | **2** | ① `cur-mobile`(ff74ab)、`jar-mobile`(b1a18c)、`sync-mobile`(475344)<br>② `cur-mobile-b`(**ff74ab**)、`cur-mobile-c`(**ff74ab**) | `2px maxΔ6 box 783,668,784,668` |
| `avatar` | **3**(→ **不是**雙穩態) | ① `cur-mobile` ② `cur-mobile-b`+`cur-mobile-c` ③ `jar-mobile`+`sync-mobile` | `12px maxΔ3` |

兩個關鍵:

1. **每一組跨狀態的比對都給出完全相同的簽章**,同組內則逐像素相同 ——
   這正是「兩個離散狀態」而不是「連續噪音」的定義。
2. **狀態分組與 theme 位元組無關。** `cur-mobile-b` 和 `cur-mobile` 用的是
   **同一份 theme**(指紋都是 ff74ab),卻落在不同狀態;而它和 `jar-mobile`
   **theme 不同**,像素卻完全相同。`organigram` 的分組方向甚至剛好相反。
   ⇒ 這個差異**不可能**是 CSS 造成的,否則同樣的 CSS 不會給出兩種結果。

`avatar` 是**三**個狀態,不算雙穩態 —— 它是 §5 #5 那個「故意壞掉的圖 fallback」競態,
機制不同,別混為一談。

**對噪音下限的意涵,以及一個要收回的說法。**
全語料(桌機 4 組 + mobile 5 組,所有配對)的 maxΔ 分布:

| maxΔ | 桌機出現次數 | mobile 出現次數 | 頁面 |
|---|---|---|---|
| 1 | 31 | 59 | 多數 |
| 3 | 4 | 6 | `avatar` |
| 6 | — | 6 | `organigram` |
| **13** | — | **6** | **`breadcrumb`** |

**我先前建議把 `maxDelta` 從 8 調到 16、並說那是「推導出來、不是配出來」的 —— 這句話要收回。**
Δ13 不是一階覆蓋率量化,而是位移淡墨的完整振幅(見上),
所以「一個 Skia 覆蓋率階距」那個推導**套不到這一筆**。16 這個數字是**照著這一筆配的**。

比較誠實的講法是:**對「文字抗鋸齒位移」這種噪音,`maxDelta` 本來就是個差的判別器** ——
位移使它直接跳到墨的振幅。真正在把關的是 `diffPixels`:`breadcrumb` 是 **4px**,
而下限是 **64px**,差 16 倍。

### 5.3 正確的判別器是「可重現性」,不是「幅度」——以及 mobile project 漏掉的前置條件

調閾值(不管往哪邊調)都在回答錯的問題。**幅度小不等於是噪音,幅度大也不等於是真的改動。**
§5.1 已經量到反面案例:一個**真的**會畫出來的改動只差 44px / 52px,**被下限吞掉**(第 6 輪)。
所以「放寬 `maxDelta` 以免誤判」和「收緊 `maxDelta` 以免漏接」是同一個旋鈕的兩端,兩邊都會輸。

**真正能分開兩者的性質是:同一份 build 重拍,真的改動一定重現,光柵化噪音不會。**
這正是 §2.3「theme 指紋相同 → 像素必須相同」那條判準,而 harness **早就內建**了 ——
`ab-visual.js selftest <project>` 就是拿同一份 build 拍兩次。

**而這一輪的 mobile 從來沒有跑過 selftest。** `target/ab-visual/shots/` 只有
`selftest-a` / `selftest-b`(桌機),沒有 `selftest-mobile-*`。
把手上兩組**同指紋**的 mobile capture 直接對比,harness 自己的警報就響了:

```
$ node scripts/ab-visual.js diff cur-mobile cur-mobile-b
theme finger:    SAME  ff74ab9368d92231 / ff74ab9368d92231
pages differing: 1
  differs  breadcrumb                 4px (0.000%) maxΔ 13 box 4,39,4,42
verdict:         HARNESS IS FLAKY — same theme bytes, different pixels. Fix the harness, not the theme.
```

⇒ `breadcrumb` 本來就該在**跑 A/B 之前**被歸類成 harness 噪音,而不是在 A/B 報告裡
變成一筆要人去追的「theme 差異」。`playwright.config.ts` 裡那段註解
(「determinism does not transfer…每一項 §5 的修正都是在 1280x900 量的」)寫對了,
但**新增 mobile project 時沒有照著做** —— 這是流程漏掉,不是下限設錯。

**所以未來要避免這種誤判,順序是:**

| # | 作法 | 成本 | 性質 |
|---|---|---|---|
| 1 | **新增任何 project 後,先跑 `selftest <project>` 並收斂到 0**,才可以讀該 project 的 A/B | 兩趟 capture | **前置條件**,不是選項。零新程式碼 |
| 2 | selftest 收不掉的頁面,登記成**已知不穩定**(頁名 + 精確簽章 `diffPixels/maxΔ/box`)。`diff` 只在簽章**完全吻合**時歸為 `unstable (known)`,照樣印出來但不計入 differing;**簽章一有偏差就算真的** | 小改 `diff` + 一個受版控的清單 | **精確比對**,不是放寬閾值。不影響其他頁面 —— **已於 2026-08-19 實作,見 §7.10**(含負向控制) |
| 3 | 追根因:桌機 6 組配對 maxΔ 最高只有 **3**,mobile 卻有 **6** 與 **13**。差別在 `isMobile: true` 開啟 Chromium 的 meta-viewport 縮放 ⇒ 版面落在非整數座標 ⇒ 字形光柵原點在兩個 subpixel bin 間跳。**可測**:保留 UA / viewport / `hasTouch`,只關掉 `isMobile` 再跑 selftest。ZK 的 tablet layer 是看**伺服器端 UA**(`zk.mobile`),不是看 `isMobile`,所以關掉不會失去 P7 覆蓋 | 兩趟 capture 驗證 | 若成立就**根除**,不必登記 |

第 2 項的附帶好處:一旦噪音改由「不可重現」認定,**下限就可以往下收**,
§5.1 那個被吞掉的 44px 真改動才有機會被抓回來。現在不敢收,是因為下限同時兼著兩個職責。

**以上都不影響閘門強度** —— 宣告層的 `check:cssdiff` 才是主閘,
任何宣告變動都會在下面一層被精確抓到;像素層只是第二道。

## 6. 覆蓋率:85 個輸出檔裡有幾個真的到瀏覽器

`npm run visual:coverage`(`scripts/ab-coverage.js`)。這是 §1「不證明覆蓋率」那一列的**上界**:
harness 看不到一個**根本沒被服務**的檔改了什麼。

### 6.1 實測(2026-08-07,85 檔,theme 指紋 `5c570ab19195cdc2`)

| 分類 | 檔數 | 說明 |
|---|---|---|
| **到彙整檔**(`zk.wcs`) | **80** | 瀏覽器真的套用 |
| 被連但**不生效** | **1** | `zkmax/css/tablet.css.dsp` —— HTTP 200 / 26145 B,但 `<link disabled>`(桌機 UA),P7 的檔 |
| **從來沒有人要** | **4** | 見下表 |

⇒ **A/B 覆蓋率上界 = 80/85**,未參與畫面的位元組 **39367 / 640189 = 6.1%**。

**4 個沒被要求的檔,全部是同一個原因** —— 同一個元件在來源樹裡有兩份輸出,而
`lang-addon.xml` 只指名其中一份(**S18**,這次第三度獨立印證):

| 元件 | 被要求的(`<widget-package>`) | 沒人要的 | 大小 |
|---|---|---|---|
| goldenlayout | `js/zkmax/goldenlayout/css/` ← `zkmax.goldenlayout` | `js/zkmax/layout/css/` | 15864 B |
| cropper | `js/zkmax/cropper/css/` ← `zkmax.cropper` | `js/zkmax/med/css/` | 4980 B |
| signature | `js/zkmax/signature/css/` ← `zkmax.signature` | `js/zkmax/wgt/css/` | 2605 B |
| tbeditor | `js/zkmax/tbeditor/css/` ← `zkmax.tbeditor` | `js/zkmax/inp/css/` | 15918 B |

**活的是「元件名資料夾」,死的是「分類資料夾」** —— 直覺容易反過來,寫下來免得下次又猜。
這四筆用**兩種獨立方法**得到同一個答案:標記探針(服務出來的位元組)與
`unzip -p zkmax-10.4.0-….jar metainfo/zk/lang-addon.xml`(宣告層)。

### 6.2 方法與口徑(S30:沒寫口徑的命中數不可重現)

| 項目 | 值 |
|---|---|
| 注入什麼 / 在哪 | `.zzcov-<nnnn>{--zzcov-<nnnn>:1}`,**檔尾**,逐檔唯一 |
| 為什麼不能用內容比對 | goldenlayout / cropper / signature 的兩份輸出**逐 byte 相同**,拿內容去彙整檔裡找**分不出是哪一份** ⇒ 兩份都會被判成到了 |
| 免疫於 S30 的兩個歧義 | 標記綁**相對路徑**:(a) 不受 `.z-avatar` / `.z-avatargroup` 這種姊妹字首影響;(b) `grid.css.dsp` 三份同名檔(zul / zkmax / zkex)各有各的標記,不會疊加 |
| 比對法 | **精確子字串、區分大小寫**,對服務出來的回應本文 |
| 抓了什麼 | 頁面 HTML 的全部 `<link href>`(**含 `disabled`**)+ 一層 `@import`;**桌機 UA** |
| 位元組口徑 | **磁碟上的 `.css.dsp` 大小**,不是服務出來的位元組(與 S24 的 35.4% 同口徑) |
| 為什麼一次注入全部 85 個 | `checkPeriod` 未設(= −1)時 `ExtendletLoader.getLastModified` 回傳常數,`ResourceCache` **不會**因檔案變動而失效 ⇒ 「邊跑邊改檔」的逐檔探針會靜默服務舊內容。一次注入 + 單一 JVM = 這個風險不存在 |
| 還原 | `finally` **與** `process.on('exit')` 兩道(`die()` 會直接 `process.exit`,跳過 `finally`);**85/85 sha256 等於注入前快照** |

### 6.3 三個控制組(缺一就不採信數字)

S28 的教訓是「臨時探針會產出看起來合理的假數字」(當時量到 81/85 後自行作廢),
所以這支腳本**自帶**控制組,失敗就 exit 1:

| 控制 | 做法 | 實測 |
|---|---|---|
| **正向** | `zul/css/norm.css.dsp` 必為 `AGG` | ✅ |
| **負向** | `--holdout <relpath>` 故意不注入某個已知 `AGG` 的檔 | ✅ 翻成 `MISS`,且彙整檔**正好少 29 B**(一個標記) |
| **跨頁** | 抓兩個不同頁面,命中集合必須相同 | ✅ `/button.zul` 與 `/usecase/inventory-table.zul` 一致 —— 「一頁就夠」這個假設至此才被驗過 |

**還有一個不用信任程式碼的算術核對**:未注入時服務出來的 `zk.wcs` 是 **551581 B**,
注入後 **553901 B**,差 **2320 B**;每個標記 29 B ⇒ **2320 / 29 = 80**,
與「80 個檔到彙整檔」逐一相符。負向控制那一輪是 553872 B(少一個標記)。

## 7. Pop-up:互動才會出現的那一層(2026-08-19 補上)

> **狀態**:已實作、兩個 project 的 selftest 都收斂到 **0**、反向控制有牙齒、
> 對 `baseline/`(原本的 IceBlue)的 A/B 已跑完。
> 檔案:`src/test/playwright/ab-popup.spec.ts`;`playwright.config.ts` 兩個 project 的
> `testMatch` 放寬為 `/ab-(capture|popup)\.spec\.ts/`。

### 7.1 §1「結構上看不到」原本漏了一整類

§1 的表格只列了三個因硬體/解碼被 SKIP 的檔。實際上還有一整類看不到的東西,
而且跟 SKIP 無關:**`ab-capture` 全程沒有任何一次 click / hover / 鍵盤 / widget API 呼叫**。
§5.1 第 7 輪其實已經寫出這件事(「截圖不觸發 hover」),但當時只當成 hover 的個案。

Pop-up 是同一個盲點更嚴重的一塊:**hover 至少是既有元素換樣式,pop-up 面板在關閉時
根本不在 DOM 裡**。對 `baseline/` 實際數出來,受影響的選擇器出現次數約 **180**:

| 選擇器族 | baseline 出現次數 |
|---|---|
| `.z-nav-popup` / `-open` / `.z-nav-text-popup` / `.z-navitem-text-popup` | 28 / 9 / 5 / 5 |
| `.z-menupopup*` / `.z-menu-content-popup` / `.z-menu-popup` | 25 / 2 / 1 |
| `.z-tbeditor-dropdown` / `-open-dropdown` | 18 / 8 |
| `.z-daterangebox-popup*`(panels/today/linked/times/footer/clear/cancel) | ≈25 |
| `.z-datebox-popup` / `.z-datebox-open` | 6 / 1 |
| `.z-combobox-popup` / `-bandbox-` / `-timebox-` / `-timepicker-` | 3 / 2 / 2 / 2 |
| `.z-chosenbox-popup*` / `-cascader-` / `-searchbox-` / `-colorbox-` / `-colorpalette-` | 各 2 |
| `.z-popup` / `.z-popup-content` / `.z-toolbar-popup*` / `.z-slider-popup` / `.z-drawer-open` | 1 / 2 / ≈3 / 1 / 5 |

**這跟 §6 的覆蓋率是兩個不同的問題,不要混。** §6 問「`.css.dsp` **有沒有被服務**」(80/85);
這一節問「**服務進來的規則有沒有任何元素去命中**」。一個檔可以 100% 被服務,
裡面卻有三分之一的選擇器從來沒碰到任何元素。

### 7.2 三個被迫與 `ab-capture` 不同的地方

| # | 差異 | 為什麼非這樣不可 |
|---|---|---|
| 1 | `NO_MOTION` 在**開啟之前**注入 | pop-up 開啟本身帶 transition;沿用「載入後才注入」會讓連續兩張永遠停在動畫中途 |
| 2 | 有 widget API 就**不要用 click** | click 會把游標留在觸發點,ZK 對游標底下的 item 加 `-hover`/`-seld`。主題一改動使面板位移幾個像素 ⇒ **被 hover 的 item 換人** ⇒ 報出一個與被改規則無關的巨大差異。沒有 API 的才 click,並在開啟後把游標停到 0,0 |
| 3 | 截圖**裁切到面板自己的 bbox + 24px**,不用 `fullPage` | 面板 detach 到 `<body>` 且絕對定位,開在下緣會把 document 撐高 ⇒ 整頁位移(§4 的 fullPage 過度敏感,但這裡是**必然**發生);而且 §5.1 已量到小面積改動攤在整頁裡會被噪音吞掉。**代價**:裁切框跟著面板跑,所以「只讓面板位移」的改動這裡照不出來 —— 定位靠的是 anchor 幾何,那個在 at-rest 截圖裡 |

還有一個**自帶的空轉閘門**:每個場景都要指名「**我要讓哪個選擇器被畫出來**」,
而且**必須恰好一個元素可見**。少了這條,一個觸發器悄悄失效的場景會拍到一張
「看起來很正常的、後面那一頁」的圖 —— 就是 §2.2 那種「什麼都沒量到卻回報一致」。

### 7.3 建立過程的實測發現(這一節才是給下一個人看的)

**五個問題,沒有一個是推理出來的,全部是跑出來被打臉才發現的。**

| # | 現象 | 根因 | 處置 |
|---|---|---|---|
| 1 | 第一次跑,28 個場景 **8 個失敗**,全部是「面板一直 hidden」 | `locator(sel).first()` **抓到隱藏的那一個**:很多頁面**每個 widget 都預先渲染一個隱藏面板**(`timepicker.zul` 有 **15** 個 `.z-timepicker-popup`,colorbox 5 個),`.first()` 是 DOM 順序,不是可見的那個 —— 於是它耗完 15s 等一個永遠不會顯示的元素,而真正開起來的面板就在旁邊 | 改成**數可見的個數必須等於 1**,而且**等待條件與裁切框用同一個函式**(`popupClip`)⇒ 拍到的那一格畫面,可證明就是滿足等待的那一格 |
| 2 | `combobox-description` 場景報 `no widget for .z-combobox #11 — 11 candidate(s)` | 用 DOM index 選實例。頁面上讀起來是第 12 個,但**disabled 的兩個先被濾掉**,後面每個 index 都位移了 | 改成**用它「是什麼」來選**:`where: '!!(w.firstChild && w.firstChild._description)'`。這種條件在語料被改順序之後仍然成立 |
| 3 | mobile 的 `nav-collapsed-popup` 完全開不起來(`.z-nav-popup` 0 in DOM) | `setOpen(true)` 在收合的 Nav 上是**就地展開**、不產生面板;**hover** 在桌機可以、在 touch 模擬下不行(ZK 由 UA 判定 `zk.mobile=1`,把 hover affordance 關掉);**click 兩邊都可以** | 統一改成 click。**但 click 開起來的面板在桌機仍然是「游標維持」的** —— 把游標停走之後它撐過了 `waitForPopup`、然後在拍攝中途關掉(`pop-up went away mid-capture`,兩趟都一樣)⇒ 需要 `holdCursor`,並記下為什麼安全:游標停在 x≈40 的側邊欄項目上,面板從 x=78 才開始 |
| 4 | mobile selftest 抓到 `popup__toolbar-overflow-popup` **4406px / maxΔ 145**(同一份 build 兩次) | 「觸發點在面板外」**不是每個幾何都成立**:mobile 幾何下 overflow 面板**開在 ellipsis 按鈕正上方**,面板裡有一顆按鈕被 hover ⇒ 一趟有淡藍底(122,200,255)、一趟是白底(255,255,255) | 觸發**之後**把游標停到 0,0(`drag` 例外 —— 它的鈕還按著,移動會拖到滑塊) |
| 5| 加了「觸發後停游標」之後,mobile selftest 換成 `popup__popup-basic` **13230px / 71.5%** | ZK 的 `<popup>` 是**開在游標位置**的,而且**很晚才讀游標** ⇒ 我自己的「停游標」跟它的定位在賽跑:面板多數落在 **0,0**、偶爾落在按鈕上。5 次量測:游標停走 = 4 次 (0,0) + 1 次 (69,57);**游標維持 = 5/5 穩定**(桌機 69,57 / mobile 66,54) | `popup-basic` 也標 `holdCursor`。**Confirmpopup 不需要** —— 它是對著 target 定位而不是游標,停游標下 0 差異 |

**第 3、4、5 項是同一個教訓的三種形狀**:游標位置是這一層的**主要**噪音來源,
而「該停還是該留」**沒有通則**,每個 pop-up 家族都得量。所以 `holdCursor` 的值是
**那次量測本身**,不是一個布林旗標 —— 一個沒有理由的例外,跟忘記處理無法區分。

### 7.4 照不到的(全部量過,不是猜的)

| 表面 | 為什麼 |
|---|---|
| `.z-selectbox` 展開的清單 | `zul.wgt.Selectbox` 渲染成原生 `<select>`,展開清單由**作業系統**畫,不在 DOM 裡,主題也管不到 ⇒ **不是漏測,是不存在的表面** |
| `.z-timebox-popup .z-timebox-wheel-body` | `zul.db.Timebox` 在桌機 client **沒有** open/setOpen,按鈕是上下 spinner;wheel 屬於 tablet mold。共用的 `.z-{combobox,bandbox,datebox,timebox}-popup` 主規則已由另外三個兄弟覆蓋 |
| `.z-treecols-menupopup` | **不存在**:`org.zkoss.zul.Treecols` 沒有 `setMenupopup`(硬寫上去頁面會 500),主題 CSS 也沒有 treecols 版本 —— 只有 columns 與 listhead。**不是缺口** |
| `.z-portallayout-popup*` | **找不到產生它的程式,但先不要刪 —— 未結案**。量到的:(a) `portallayout-popup` 這個字串在 zkmax-10.4.0 裡只出現在 `portallayout.css.dsp` 自己;(b) **瀏覽器實際收到**的 `zkmax/layout/index.js`(180038 B)裡,「popup」這個字**出現 0 次**(不分大小寫)—— 對照組:`zkmax/inp/index.js` 同樣測法可以抓到 `$s('popup')`,所以「執行期才組出 class」這條路也被排除了;(c) 本機 `~/.m2` 內**從 5.0 到 11.0 全部 200+ 個 zkmax 版本**,`layout/*.{js,ts}` 都沒有 popup。**但**使用者回報:focus 在 portal 裡的 Panel 上按**空白鍵**會跳出一個 pop-up。我照著試(programmatic focus `.z-panel-head` + Space、Tab 巡覽 + Space)**重現不出來**,`Portallayout.ts` / `Portalchildren.ts` 也沒有任何 `doKeyDown` / `keyCode`。⇒ 結論是「**我還沒找到那個 pop-up 是誰**」,不是「它不存在」。在確認之前**不刪**,見 §7.11 |
| `.z-tbeditor-dropdown`(**只有 mobile**) | touch 模擬下**打不開**:按鈕在(35×35 @138,37)、可點,但 click / tap / dblclick / 原始 mouse down-up **四種都讓兩個面板停在 `display:none`**。根因在編輯器函式庫,不在主題:`trumbowyg.js` 把按鈕綁在 **`mousedown`**(`mousedown: function(){ … execCmd("dropdown") }`),而整份檔案**沒有任何 touch 處理**,所以模擬的觸控序列根本到不了那個 handler。**用合成 mousedown 硬開的做法被否決,理由不是難而是沒意義**:`zkmax/css/tablet.css.dsp` 裡 tbeditor 規則 **0 條**,mobile 那張會跟桌機那張完全一樣 —— 這個 widget 沒有 tablet 層樣式可差 |

**三個「其實早就被 at-rest 照到」的,寫下來免得重複做白工**(這是實測結果,不是假設):

- `.z-confirmpopup-*`:`confirmpopup.zul` 用 `h:div` 畫了 **19 個靜態樣板、9 個可見** ⇒ 這 ≈40 個選擇器從來不在缺口裡。只有**真的 widget**(箭頭與 placement 是算出來的)另外拍一張。
- `.z-coachmark-open` / `-mask`:`coachmark.zul` 載入時就留一個開著的。
- `.z-toolbar-overflowpopup` / `-on`:這個 class 在 **toolbar 元素本身**,不在面板上。

### 7.5 驗證數字

順序照 §5.3 訂的前置條件走:**先 selftest 收斂到 0,才可以讀該 project 的 A/B。**

| 步驟 | 結果 |
|---|---|
| 場景數 | **31**(桌機 31,mobile 30 + 1 個具名 skip) |
| `visual:selftest`(桌機) | **149 頁比對、differing 0**;噪音只出現在 at-rest 頁 |
| `visual:selftest ab-capture-mobile` | **148 頁比對、differing 0**、missing 0 |
| **反向控制** | 對建置產物注入一行 `.z-combobox-popup{border-radius:12px;border-color:#e00}` → **3 頁差異,全部是 pop-up 場景**(1338/1424/1360 px,**3.4–4.4%** 的畫面,maxΔ 249–255),**原本的 116 頁 at-rest 一頁都沒動**。還原後 `combo.css.dsp` 與注入前 **byte 相同** |
| A/B vs `baseline/`(桌機) | 指紋 `df92b09541854f7d` → `7a447b74c81a24a0`(**72/85 檔 byte 不同**),**149 頁 differing 0** |
| A/B vs `baseline/`(mobile) | **148 頁 differing 0**、missing 0 |

**反向控制那一列是這一節唯一重要的數字**:同一個改動,新場景看到 **4.36% 的畫面**,
舊的 116 頁看到 **0**。這就是「新增的訊號是新的、不是既有訊號的重複」的直接證據 ——
也順便反證了「pop-up 選擇器在 at-rest 頁面上其實有被命中」這個可能的反駁。

**第一次跑 mobile 的 A/B 時,baseline 側曾報 4 個 pop-up 場景有差異(maxΔ 255)。那是假的**:
同一趟有 **8 頁 MISSING**,原因是 preview app 中途死掉(5 頁 `ERR_CONNECTION_REFUSED`
/ `ERR_EMPTY_RESPONSE`、`columnlayout` 逾時 60s)。重跑之後 143 頁 0 差異。
`diff` 的「**有 MISSING 就先修,下面的數字不要讀**」這條規則在這裡直接救了一次誤判 ——
如果當時照著那 4 筆去追主題,會白追。

### 7.6 附帶修掉的:`AB_PORT`

`ab-visual.js` 原本把 8081 寫死,port 被佔住就整個 harness 不能跑。
8081 是很熱門的 port(這次是**另一個專案**的 dev server 佔著),而
「把別人的 process 殺掉」不該是 harness 的決定。

`ThemePreviewIceblueApp.main` 是用 `app.setDefaultProperties` 設 8081 的,
那是 Spring Boot 的 **default**,**位階低於系統屬性** ⇒ `-Dserver.port` 蓋得過去(已實測)。
所以 `AB_PORT=8099 npm run visual:selftest` 這樣就能換 port,**Marble worktree 一個檔都不用改**。

### 7.7 本分支自己的語料頁:`abpopup/`(2026-08-19 追加,共 2 頁)

§7.4 原本把 column menu 列為「照不到」,理由是「要加一頁語料,而語料屬於 Marble worktree」。
**那個理由是錯的** —— 本 worktree 有自己的 `src/test/resources/web/`,加在這裡就好,
不必動 Marble。已補上 `src/test/resources/web/abpopup/column-menu.zul`。

**這頁一次補齊兩層,而且大部分收穫在 at-rest 那一層** —— 因為
`.z-columns-menupopup` / `.z-listhead-menupopup` **不是面板的 class,是「表頭上的修飾 class」**
(`ColumnMenuWidget.domClass_()`:`_menupopup != 'none'` 時加上 `$s('menupopup')`),
用途是把每個 `.z-column-content` 的 `padding-right` 撐開來讓出插入符的位置。
`menupopup` 一設好它就在,**不需要開任何東西**:

| 新覆蓋到的 | 何時出現 | 由誰拍 |
|---|---|---|
| `.z-columns-menupopup`(×2)、`.z-listhead-menupopup`(×1) | at rest | `ab-capture`(新頁自動納入) |
| `.z-column-button`、`.z-listheader-button`(各 5 個 CSS 出現次數) | at rest 在 DOM 裡(`display:none`,hover 才顯示) | 同上 |
| 自動建出來的 column menu 面板(sort / group / 欄位可見性 + `.z-menuseparator` + 勾選 menuitem) | 要開 | `ab-popup` 的 `grid-column-menu` / `listbox-column-menu` |

**兩個實作上的坑:**

1. **插入符在 hover 之前是 `display:none`**(實測 at rest 0×0、hover 後 34×48),
   所以直接 click 會耗完 timeout 等一個隱藏元素。新增 `reveal` 觸發類型
   (先 hover 表頭、再 click 插入符)。開起來的幾何 **3/3 完全一致**,兩個 project 都是,
   停不停游標都一樣穩。
2. **面板文字是 `Unknown message code: 271125xx`**。這是**既有現象、不是這頁造成的** ——
   `msgzul.GRID_ASC` 在**stock 的 `grid-header.zul` 與 `menubar.zul` 上讀到一樣的值**。
   對 A/B 無害(兩側完全相同),寫在這裡只是為了避免有人把這頁當成壞掉的頁去修。

### 7.8 為什麼不是把本 worktree 的 `src/test/resources` 直接放上 classpath

**因為本 worktree 帶著一份「漂移過的」語料複本**:150 頁 vs Marble 的 158 頁,
**約 149 個檔名相同**(本分支多 `density-probe.zul`,少 `icons-lucide.zul` 與 8 個 usecase 頁)。
`ClassLoader.getResource` 是 **first-match-wins**,所以把它當成 classpath root 一放上去,
`~./button.zul` 從哪一棵樹解析就變成「看 classpath 順序」—— 而且**沒有任何數字會動**:
頁數一樣、名稱一樣,只有內容悄悄換人。那正是 §2.2 那種「什麼都沒量到卻回報一致」。

所以 `ab-visual.js` 的 `stageExtraCorpus()` 把 `src/test/resources/web/abpopup/` **複製**到
`target/ab-visual/corpus/web/abpopup/`,只把**這個只含新頁的目錄**當 classpath root。
**碰撞在結構上不可能發生**,不必依賴 classpath 順序。每次 run 都重新複製 ——
這些頁是手改的,一份過期的複本會被靜靜地服務出去。

### 7.9 `abpopup/tab-overflow.zul`:goldenlayout 的 tab dropdown

§7.4 原本把它列為照不到,理由是「語料在兩種幾何下都不會溢出」—— 那是**語料的性質,不是元件的性質**,
所以補一頁就解決了。從 jar 裡的 `goldenlayout.src.js`(`lm.controls.Header._updateTabSizes`)讀到門檻:

```js
availableWidth = header.outerWidth() - controlsContainer.outerWidth() - 10   // _tabControlOffset
```

超出的 tab 會被搬進 `ul.z-goldenlayout-dropdown.lm_tabdropdown_list`,並把 `.lm_tabdropdown`
按鈕 un-hide。所以新頁就是**一個刻意做窄的 stack(360px)+ 五個長標題 tab**,全部同一個 area,
逼它溢出。實測:按鈕 `display:block`(22px),點開後面板 **3/3 完全一致**(226×148)。

### 7.10 `KNOWN_UNSTABLE`:§5.3 建議 #2 的實作

§5.3 說 `breadcrumb` 應該在跑 A/B **之前**就被歸類成 harness 噪音,並開出三條路。
這次它真的來了 —— 連續兩趟 mobile selftest 都拿到**同一個簽章** `4px maxΔ 13 box 4,39,4,42`,
於是把**建議 #2** 實作出來:`scripts/ab-visual.js` 的 `KNOWN_UNSTABLE`。

| | |
|---|---|
| **比對法** | `diffPixels`、`maxDelta`、**四個 box 座標全部**都要相同,且限定 project 與頁名。差一點就算真的 |
| **為什麼不是調閾值** | §5.1 量到一個**真的會畫出來**的改動只有 44px / 52px、**落在噪音下限之內** ⇒ 把下限放寬到能吞掉這一頁,也會吞掉真發現。§5.2 又量到 `maxDelta` 對「位移的抗鋸齒」本來就是差的判別器(墨一位移就直接跳到滿振幅)。真正能分開兩者的是**可重現性**,而那正是 selftest 在量的 |
| **負向控制**(必須做) | 把記錄的 `diffPixels` 從 4 改成 5 → 該頁立刻回到 `pages differing: 1`、verdict 變回 `HARNESS IS FLAKY`;改回來又變成 `known unstable: 1`。⇒ 這個機制**只**吸收登記過的那一個狀態 |
| **仍然會印出來** | 每一趟都印 `unstable <page> … (known, not counted)`。下限只決定 verdict,不決定覆核者看得到什麼 |

**這個機制是收窄、不是放寬**:在它之前,`breadcrumb` 這一頁在 mobile 上是**擲硬幣** ——
同一份 build 兩趟,有時 0 差異、有時 1 差異(這次第三趟又自己變回 0,再次印證雙穩態)。
之前 §5.2 那次「兩張圖肉眼看不出差別」的追查,就是這個硬幣造成的。

**建議 #3(根因)的前提已經被實測推翻,不要照原文去做。** §5.3 猜的是
「`isMobile: true` 開啟 meta-viewport 縮放 ⇒ 版面落在非整數座標 ⇒ 字形光柵原點在兩個
subpixel bin 之間跳」。在 `breadcrumb.zul` 上量三種設定:

| 設定 | devicePixelRatio | visualViewport.scale | 那段文字的 box | 有小數? | `zk.mobile` |
|---|---|---|---|---|---|
| 桌機 1280×900 | 1 | 1 | top 38 / left 5 / h 38 | 否 | false |
| mobile `isMobile: true` | 1 | 1 | top 36 / left 5 / h 37 | **否** | **1** |
| mobile `isMobile: false` | 1 | 1 | top 36 / left 5 / h 37 | **否** | **1** |

⇒ **沒有縮放(scale 都是 1)、也沒有小數座標**,而且開不開 `isMobile` 版面**完全一樣**。
所以關掉 `isMobile` 大概不會改變任何事,那個實驗照原樣做只會浪費兩趟 capture。
(順帶證實了 §5.3 的另一句:`zk.mobile` 兩種設定下都是 `1`,它看的確實是**伺服器端 UA**,
所以真要關 `isMobile` 也不會失去 tablet layer 覆蓋。)

剩下的嫌疑犯只能是**整數 box 之內的字形光柵化**(文字排版用的是小數 advance),
而不是 box 幾何。要再往下追得換工具(例如比對兩個狀態的 glyph raster),
成本遠高於 §7.10 那條登記,所以先維持登記。

### 7.11 未結案:`.z-portallayout-popup*` 到底是誰畫的

**現況**:量測說「ZK 10.4 的 layout 套件不可能產生它」,使用者的實機觀察說「按空白鍵會跳出來」。
兩邊都不該被忽略,所以這條**留著不刪**,並記下已經排除了什麼,免得下一個人重跑同樣的三件事。

**已排除**(每一項都有對照組或完整列舉):

| # | 做法 | 結果 |
|---|---|---|
| 1 | 在 zkmax-10.4.0 jar 內,對所有 `.js/.ts/.dsp/.wpd/.xml` 逐檔找字串 `portallayout-popup` / `popup-nav` | 只命中 `portallayout.css.dsp` **自己**;zul / zk / zkex 三個 jar 全部 0 |
| 2 | 抓**瀏覽器實際收到**的 `zkau/web/js/zkmax/layout/index.js`(180038 B),找 token `popup`(不分大小寫) | **0 次**。**對照組**:同樣測法對 `zkmax/inp/index.js` 會抓到 `$s('popup')` ⇒ 「執行期用 `$s('popup')` 組出 `z-portallayout-popup`」這條路**也**被排除,不是測法看不到 |
| 3 | `~/.m2` 內所有 zkmax 版本(5.0 → 11.0,200+ 個)的 `layout/*.{js,ts}` | 沒有一個含 popup |
| 4 | 實機重現:`portallayout.zul` 上 programmatic focus `.z-panel-head` 後按 Space;另外 Tab 巡覽 25 次、每次按 Space,監看所有 `position:absolute/fixed` 的可見元素 | 沒有任何新的浮動元素;`Portallayout.ts` / `Portalchildren.ts` 也沒有 `doKeyDown` / `keyCode`,拖曳是純滑鼠的 `_initDrag` |

**還沒排除的**:那個 pop-up 可能**根本不是** `.z-portallayout-popup` —— 例如是 `.z-popup`、某個
`menupopup`、或 Panel 自己的東西,只是位置看起來像。要定案只差一步:**在它跳出來的當下**,
在 devtools console 執行

```js
[...document.querySelectorAll('body *')]
  .filter(e => { const c = getComputedStyle(e), r = e.getBoundingClientRect();
    return (c.position === 'absolute' || c.position === 'fixed')
        && c.display !== 'none' && c.visibility !== 'hidden' && r.width > 2 && r.height > 2; })
  .map(e => e.className + '  ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
```

把印出來的 class 名貼回來,就知道要不要為它補一個場景、或者那四條規則是不是該改名。
另外也要問清楚:**哪一頁、哪一個 ZK 版本/產品**(這份 harness 跑的是 10.4.0-jakarta.FL.20260713)。
