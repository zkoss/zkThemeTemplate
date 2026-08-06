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
| **不證明** | 變得對不對(那是人看);也不是覆蓋率 —— 頁面用的是 Marble 的語料,**不是**針對 85 個輸出檔設計的。**而且對稀有元件會漏接**,見 §5.1 |
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
    web/**/*.zul        ← 123 個頁面(語料,不搬進本分支)        web/iceblue_css/**  ← 85 個 .css.dsp
    zk/example/*.class  ← 頁面用到的 composer / VM              metainfo/zk/config.xml
    zk/example/iceblue/ThemePreviewIceblueApp.class              org/zkoss/theme/iceblue_css/*.class
                    │                                                    │
                    └────────────── 同一個 JVM classpath ────────────────┘
                                          │
                       java -Dorg.zkoss.theme.preferred=iceblue_css
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
| `ThemePreviewIceblueApp` **故意不設** preferred theme(原本用來抓 ZK 內建 iceblue 的基準) | ZK `Library.getProperty` 在自己的 map 找不到時**會退回 `System.getProperty`**(`zcommon/…/lang/Library.java:77`)⇒ 命令列 `-Dorg.zkoss.theme.preferred=iceblue_css` 就能選到本模板的 theme,**Marble worktree 一個檔都不用改** |
| 本模板的 theme 是靠 `metainfo/zk/config.xml` 的 `<listener>` 註冊 | 只要 `target/classes` 在 classpath 上,`IceblueCssThemeWebAppInit` 就會跑、theme `iceblue_css` 就註冊好 |
| ZK 沒有內建 `web/iceblue_css/` 目錄(`zul-*.jar` 裡是**未加前綴**的 `web/zul/css/`) | 不存在「ZK 自己的複本遮蔽我們的」這種問題 —— 服務到的一定是本模板編出來的 |

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

- `_zkiju-iceblue_css` 出現 ⇒ 服務中的彙整 CSS 來自本模板的 theme
- `marble` 出現 **0 次** ⇒ Marble 的 provider 沒有介入

任何一條不成立就**中止**,不截圖。理由:一個「主題其實沒載到」的 harness 會給出
完美的零差異,而那個零是假的 —— 跟 #41 空轉閘門同一種錯誤。

**第二條目前是裝飾性的**(第 4 層實測):真的把 Marble 的 `target/classes` 混進 classpath 時,
`marble` 在 HTML 裡出現次數**仍然是 0** —— `MarbleThemeProvider` 不會把這個字面字串寫進頁面。
擋下那個情境的一直是第一條。要讓第二條成為真正的第二道防線,得改用一個 Marble provider
**真的會留下痕跡**的字串,而不是假設主題名會出現。

### 2.3 指紋:讓 A/B 不會空轉

`capture` 會把當下 `target/classes/web/iceblue_css` 全部 `.css.dsp` 的
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
