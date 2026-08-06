# 第 4 層獨立驗證報告 —— 視覺 A/B harness(commit `196773e`)

> 覆核者:第 4 層獨立覆核(本輪)。委託書:`tasks/l4-verify-visual-ab-brief.md`。
> 工作目錄:`/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`,分支 `iceblue`
> (`git branch --show-current` 確認)。
> 取證方式:全部指令實際重跑,沒有只讀文件下結論。所有臨時注入都落在
> `target/classes/web/iceblue_css/**`,每次驗完立刻 `npm run build:css` 還原並用獨立腳本
> (`scratchpad/fingerprint.js`,自行重寫 `themeFingerprint()` 演算法)核對指紋回到
> `6e5a856e8a80ddf9`。全程未用 `git checkout`,也沒有修改任何 `src/` 底下的檔案
> (`git diff --stat` 全程為空,只新增本報告與委託書兩個未追蹤檔)。

## 1. 結論

**PASS-WITH-FINDINGS。** harness 的骨架機制(指紋、守門探針、classpath 排除、版本鎖定、
語料護欄、反向控制的量級)全部通過獨立重跑驗證,但發現兩個實質缺陷:
**(1)** 自我驗證宣稱的「連續三輪 pages differing: 0」**在本次獨立重跑中沒有重現**——
`iframe` 頁在冷快取狀態下會穩定收斂到錯誤的畫面,是可重現的系統性瑕疵,不是隨機噪音
(C5 REFUTED);**(2)** C1 的噪音下限對「常見/大面積元件」的改動有巨大餘裕,但對
「稀有/小面積元件」的改動餘裕會**趨近於零甚至真的漏接**——委託人用來證明「下限有牙齒」
的反向控制(button 圓角)恰好是對下限最有利的個案,不能代表全部。細節見下。

## 2. 逐條結果表

| # | 斷言 | 結果 | 決定性證據 |
|---|---|---|---|
| C1 | 噪音下限有牙齒(`maxDelta≤8 && diffPixels≤64` 不會吞掉真實改動) | **PARTIAL** | 對常見元件(button,116 頁多次出現)餘裕巨大:0.4% alpha 的 border-color 都在 39 頁被抓到,最小 diffPixels 424px(見 §3)。對稀有元件(checkbox-switch 縮圖陰影,僅 4 頁各 1–4 個實例):alpha 改動 `0.16→0.165`(+0.005,一個很小的真實設計改動)在 `usecase/brand-switcher`(52px)與 `usecase/index`(44px)被**歸類為 noise、真正漏接**,同一改動在 `checkbox`(150px)與 `usecase/account-settings`(96px)則被抓到。指令:見 §3 全部 7 輪注入 |
| C2 | 語料是掃描 116 頁,SKIP 只有 7 條且都有理由,沒有一條在遮蔽會差異的頁 | **PARTIAL** | 頁數精確重現:`find target/test-classes/web -maxdepth 1 -iname "*.zul" \| wc -l` = 114,`usecase/` 下 9 個,114+9−7(SKIP)=116。SKIP 的 7 條理由各自成立(webcam/隨機圖/媒體解碼時序/檔案對話框/彙整頁)。**但** `camera.css.dsp`、`barcodescanner.css.dsp`、`video.css.dsp` 三個主題 CSS 檔的 `.z-camera`/`.z-barcodescanner`/`.z-video` 選擇器,**只在被 SKIP 的那三頁被渲染**(`grep -oE '<[a-zA-Z][a-zA-Z0-9]*' camera.zul` 等,widget 標籤除了通用 button/div/label 外只有元件自身),corpus 裡沒有第二個頁面用到它們 ⇒ 這三個檔的視覺改動對這個 harness **structurally 不可見**,不是「沒發現差異」而是「看不到」 |
| C3 | 守門探針真的會擋(主題沒載到時中止,不回報假的零) | **CONFIRMED** | 手動起 app(排除 Marble `target/classes` 的正確 classpath,但**拿掉** `-Dorg.zkoss.theme.preferred=iceblue_css`)→ `/button.zul` 的 HTML **沒有任何 `_zkiju-` 識別碼**,`href` 是裸的 `zul/css/zk.wcs`(無主題前綴段)⇒ 重播 `guardProbe()` 的判斷邏輯,`_zkiju-iceblue_css` 存在檢查會 FAIL,harness 會 `die()`。腳本:`scratchpad/c3-no-preferred-theme.sh`,輸出見 `scratchpad/c3-button.html` |
| C4 | 排除 `MARBLE/target/classes` 是必要的(放進去 FA css 真的被丟) | **CONFIRMED**(附帶發現) | 對照組(正確排除)`zk.wcs` 551518 bytes,含真實 `.z-icon-font-awesome` 系列選擇器,`.z-icon-solid` 命中 1 次。實驗組(**加入** Marble `target/classes`)`zk.wcs` 375313 bytes(**少 176205 bytes**,與來源 `font-awesome.css.dsp` 本身 175808 bytes 幾乎精確對上),`.z-icon-solid` 命中 **0** 次 ⇒ font-awesome 整條真的消失,不是猜的。腳本:`scratchpad/c4-control-normal.sh` / `scratchpad/c4-marble-classes-leak.sh`。**附帶發現**:同一次實驗中 `marble` 字串在 HTML 裡出現次數同樣是 **0**(`MarbleThemeProvider` 不會把字面 "marble" 寫進頁面),表示 `guardProbe()` 的第二個判準(`marble` 出現 0 次)在這個情境下**從未真正發揮作用**——真正擋下這個案例的完全是第一個判準(`_zkiju-iceblue_css` 缺席),見 §4 發現 4 |
| C5 | 自我驗證 `pages differing: 0` 可由覆核者自己重跑重現 | **REFUTED** | 獨立重跑 `npm run visual:selftest` **兩次**,兩次都不是 0:第一次 `pages differing: 1`(`iframe` 6855px maxΔ255 box `10,60,304,274`);第二次同樣 `pages differing: 1`,**同一頁、幾乎同一個 box**(`iframe` 6855px maxΔ255 box `10,60,304,274`)。這不是隨機噪音(噪音頁的 maxΔ 從沒超過 6),是可重現的系統性錯誤分類。根因定位:額外跑 `capture warm-check` 後 diff `selftest-b` vs `warm-check`(兩者都不是一次 selftest 裡的「第一張」)→ **`pages differing: 0`**,證實只有「本次 session 冷啟動後的第一次 capture」會踩到這個問題(見 §4 發現 1,與追加委託第 5 點是同一根因) |
| C6 | 指紋涵蓋全部 85 個 `.css.dsp`,任何一 byte 變指紋就變 | **CONFIRMED** | 獨立重寫 `themeFingerprint()` 演算法為 `scratchpad/fingerprint.js`,在未注入狀態量到 `85 files / 6e5a856e8a80ddf9`,與 doc 記載一致。本輪 7 次不同的一行 CSS 注入(見 §3、§2 C7)**每一次都得到不同的指紋雜湊**,每次 `build:css` 還原後都精確回到 `6e5a856e8a80ddf9` |
| C7 | 反向控制可重現(注入 `.z-button{border-radius:12px}` → 指紋 DIFFERENT + 36 頁差異、最小 370px) | **CONFIRMED** | 獨立重跑同一注入:`theme finger: DIFFERENT`,`pages differing: 36`,最小 `usecase__sign-in 370px` ——**與 commit message 逐字對上**(36 頁、370px) |
| C8 | 「拍到穩定為止」不會讓一頁悄悄通過(收不到穩定就不寫 PNG、該頁失敗、`diff` 報 `missing`) | **PARTIAL(推理,非直接觸發)** | 讀 `ab-capture.spec.ts:88-106` 的 `shootStable()`:8 輪都不穩定會 `throw`,沒有 catch,該 test 會 fail、不寫 PNG ⇒ `diff` 會報 `missing`。**本輪沒有人工構造出一個真的「永遠不穩」的頁面去直接觸發這條路徑**,這一條是程式碼推理,不是執行證據。**更重要的是它沒有防到的鄰接風險**:C5 找到的 `iframe` 問題不是「永遠不穩」,是「在預算內穩定收斂到錯誤畫面」——這種情況**不會**被 C8 的機制擋下來,PNG 照樣寫出、`diff` 也不會報 `missing`,而是報一個看起來合理但其實是 race 產物的 `differs` |
| C9 | 語料空/掃不到時不會被當成 0 差異通過(`pages.length>50` 護欄) | **CONFIRMED**(機制比文件描述的多一層) | 兩種邊界都測了:**(a)** 語料目錄完全空 → Playwright 直接報 `Error: No tests found`(exit 1),**`pages.length>50` 這條斷言根本沒有機會執行**(0 個動態產生的 test,`beforeAll` 不會跑)——擋下它的是 Playwright 自己的行為,不是寫的護欄;**(b)** 語料目錄有 10 頁(0 與 50 之間)→ 護欄斷言**正確觸發**:`Expected: > 50, Received: 10`,4 個 test 明確 fail、6 個 not run。兩條路徑合起來確實不會讓空/小語料悄悄通過,但保護機制不是單一的,委託書與 doc 都只提到斷言那一層 |
| C10 | `@playwright/test` 精確鎖版,版本不同時 `diff` 出 WARNING | **CONFIRMED** | `package.json`:`"@playwright/test": "1.62.1"`(無 `^`);`node_modules` 解析結果同版。捏造一份 manifest 把 `playwright` 欄位改成 `"1.59.1"`(只改這一個 JSON 欄位,頁面 sha256 不動)後跑 `diff` → 印出 `WARNING: renderer differs (@playwright/test 1.62.1 vs 1.59.1). Pixel differences below may be the browser, not the theme. Re-capture both sides.` |
| C11 | 本輪沒動主題來源檔,主閘門仍 85 檔/14863 條/differing 0 | **CONFIRMED** | 本輪結束前重跑 `npm run check:cssdiff`:`files compared: 85 / declarations: 14863 / files differing: 0`。`git diff --stat` 全程為空,`git status --short` 只有本報告與委託書兩個新檔 |
| C12 | L3-A 第 1–43 列與 S1–S31 未被改寫,只有附加(diff 應只有 1 個刪除行) | **CONFIRMED** | `git diff --numstat 196773e~1 196773e -- doc/iceblue-drop-less-progress-appendix.md` → `3 insertions, 1 deletion`。逐行核對:刪除的那一行正是 `<summary>` 的計數(`31 條` → `32 條`),其餘兩處新增分別是第 44 列與 S32 列,原有第 1–43 列與 S1–S31 的文字逐行未變 |
| C13 | `playwright install chromium` 清掉共用快取其他瀏覽器後,Marble 自己的 Playwright 套件還跑得動 | **CONFIRMED(風險未發生)** | Marble 目前解析到的 `@playwright/test` 是 `1.59.1`,其 `playwright-core/browsers.json` 要求 `chromium-1217`;該版本資料夾在共用快取裡**還在**,且直接 `chromium.launch()` 成功(`browser.version() = 147.0.7727.15`)。額外核對 Marble 的 `playwright.config.ts` 全部 project 都只用 `devices['Desktop Chrome']`(`grep -n "devices\[" src/test/playwright/playwright.config.ts` 12 處全是同一個),**從不啟動 firefox/webkit**,所以快取裡缺少 Marble 對應的 `firefox-1511`/`webkit-2272` 版本(目前只有不吃緊的 `firefox-1449`/`webkit-2003`,兩個專案都用不到)不影響任何實際測試 |

## 3. C1 的靈敏度下界

七輪注入,由大到小(全部落在 `target/classes/web/iceblue_css/**`,驗完都以
`npm run build:css` 還原並核對指紋回到 `6e5a856e8a80ddf9`):

| 輪 | 改動 | 元件出現頻率 | 抓到的頁數 | 最小 diffPixels(排除 iframe 雜訊) | maxΔ |
|---|---|---|---|---|---|
| 1 | `.z-button{border-color:rgba(0,0,0,0.02)}` | 常見(多頁多實例) | 37/116 | 364px(inputgroup) | 5–6 |
| 2 | `.z-button{border-color:rgba(0,0,0,0.004)}` | 常見 | 39/116 | 424px(usecase/ticket-inbox) | 2 |
| 3 | switch 縮圖陰影 `0.16→0.10`(Δ−0.06) | 稀有(4 頁,各 1–4 實例) | 4/116 | 314px(usecase/index) | 3–11 |
| 4 | 同上 `0.16→0.19`(Δ+0.03) | 稀有 | 4/116 | 194px(usecase/index) | 3–5 |
| 5 | 同上 `0.16→0.17`(Δ+0.01) | 稀有 | 4/116 | 93px(usecase/index) | 2 |
| 6 | 同上 `0.16→0.165`(Δ+0.005) | 稀有 | **2/116**(另 2 頁降到 noise) | **44px(usecase/index)、52px(usecase/brand-switcher)——兩者都被歸類為 noise,即漏接** | 1 |
| 7 | `.z-button:hover{box-shadow:0 0 0 8px rgba(255,0,0,.95)}` | 常見,但只在 `:hover` | 0/116(預期) | — | — |
| (對照) | 官方反向控制 `.z-button{border-radius:12px}` | 常見 | 36/116 | 370px(usecase/sign-in) | 255 |

**抓得到的最小改動**:輪 5(alpha +0.01,一個 checkbox-switch 縮圖陰影的微調)在
`usecase/index` 上只有 93px 也被抓到——比官方反向控制的 370px 小了 4 倍。
**抓不到的最大改動**:輪 6(alpha +0.005,比輪 5 只小一半)在 `usecase/brand-switcher`
(52px)與 `usecase/index`(44px)**被 noise 過濾器吃掉**——這是**同一顆 CSS 規則的同一次修改**,
只是恰好落在只有 1 個實例的頁面上,渲染出來的受影響面積比多實例頁面小。
**餘裕**:對「常見元件」(button)幾乎沒有上限——0.4% alpha 這種人眼幾乎分辨不出的改動都在
39 頁被抓到,餘裕遠遠超過官方宣稱的 ≈6 倍;對「稀有/小面積元件」,餘裕**在輪 5→輪 6 之間就耗盡歸零**
(93px → 44px,一步跨過 64px 那條線),而且輪 6 的改動**不是 hover-only、不是任何已揭露的狀態閘門**,
是一個會實際渲染在畫面上的靜態改動。

**對 `8 / 64` 這組數字的判斷**:**不是統一的「太鬆」或「剛好」,而是依元件出現頻率二分**。
對出現在多頁、多實例的元件(button、textbox 之類),這組下限**保守到近乎沒有實際上限**——
任何非零的靜態改動幾乎必然被抓到。對只出現 1–4 次、渲染面積本來就小的元件
(checkbox-switch、可能還有其它稀有元件),**這組下限確實太鬆**——一個幅度不算誇張
(相對變化 3%,`0.16→0.165`)的真實 CSS 改動可以在單實例頁面上完全消失,而委託人的自我驗證
只用了一種「常見元件、大面積改動」的個案去證明「下限有牙齒」,那個個案本身就是對下限**最不利**
(最容易被抓到)的情況,不能代表 harness 對稀有元件改動的實際偵測力。**這一點照實寫,不做辯護**。

## 4. 發現

| # | 嚴重度 | 內容 | 本輪造成? | 建議動作 |
|---|---|---|---|---|
| 1 | **HIGH** | `iframe.zul`(內嵌 `~./html.zul` 的巢狀 ZK 頁)在「本次 session 冷啟動後的第一次 capture」會穩定收斂到未完全載入的畫面,導致同一 build 兩次 capture 出現 6855px / maxΔ255 的假差異,兩次獨立重跑皆重現、數字幾乎一致。第三次實驗(比較兩個「非冷啟動」capture)顯示 0 差異,確認根因是冷/熱快取狀態,不是隨機噪音。**這直接推翻 C5(自我驗證的 `pages differing: 0` 三輪皆過)在獨立環境下的可重現性**,也是 P4/P5/P7 若在機器重啟或长时间閒置後第一次跑 selftest 時會踩到的真實風險 | 否(既有邏輯的既有缺口,不是本輪引入) | 8 輪 × 250ms 的穩定判定加一個「頁面所含 iframe 的巢狀 `zk.loading` 也要等」的檢查,或把 `iframe` 加進 SKIP(附理由),或在 `selftest` 前提示「請先跑過一次暖機 capture」。三者選一,不建議不處理 |
| 2 | **HIGH** | C1 的噪音下限對稀有/小面積元件的改動,實測餘裕會歸零甚至出現真漏接(見 §3 輪 6)。委託人的反向控制(button 圓角)是對下限最有利的個案,官方文件「≈6 倍餘裕」的說法**不能推廣到所有元件**,對低頻元件的靜態改動可能被誤判為 0 差異 | 否(下限本身就是這樣設計的,是既有限制被本輪首次量出邊界) | 文件補一句「餘裕依元件出現頻率而異,對僅 1–2 實例的稀有元件不提供保證」;若 P4/P5/P7 要改動的正好是稀有元件,harness 的「0 差異」不能單獨當作證據,需要額外的人工核對或針對該元件加測頁 |
| 3 | **MEDIUM** | SKIP 清單裡的 `camera`/`barcodescanner`/`video` 三頁是 corpus 裡唯一渲染 `camera.css.dsp`/`barcodescanner.css.dsp`/`video.css.dsp` 選擇器的頁面,對這三個檔案的視覺改動 structurally 不可見於這個 harness | 否 | 文件補記這個已知盲區(不是「沒有一條在遮蔽會差異的頁」,是「有三條在遮蔽,只是理由本身無法避免」);若之後要改這三個元件的 CSS,不能靠這個 harness 驗收 |
| 4 | **LOW–MEDIUM** | `guardProbe()` 的第二個判準(HTML 裡 `marble` 出現 0 次)在實測的「Marble target/classes 洩漏」情境裡從未真正觸發過(該情境下 `marble` 一律是 0 次,`MarbleThemeProvider` 不會把字面字串寫進頁面)。目前是靠第一個判準(`_zkiju-iceblue_css` 缺席)單獨擋下,第二個判準是裝飾性的,不是真正的第二道防線 | 否 | 不急,備註即可;若要讓第二判準真正有意義,需要找一個 Marble provider 會留下痕跡的字串(例如某個 Marble 專屬的 CSS class 或 URI 片段),而不是假設 "marble" 這個字面字串會出現 |
| 5 | **LOW** | `capture` 用同一個 label 跑兩次會**靜默覆蓋**,沒有任何警告或版本化(`mtime` 證實覆蓋發生)。若使用者不小心對 `before-p5` 跑了兩次,第一次的結果會無聲丟失 | 否 | 低優先;如果在意,可以加一個「label 已存在,要覆蓋嗎」的提示,但不是阻擋性缺陷 |
| 6 | **LOW** | `diff` 在有 `missing` 頁面時,`verdict` 那行文字仍可能印出「harness is deterministic」(因為判讀邏輯只看 fingerprint + differing,沒把 missing 併入文字判讀),雖然回傳碼正確是 1,但只看最後一行文字容易誤讀 | 否 | 低優先;把 verdict 的判讀邏輯也把 `missing.length` 納入措辭 |

## 5. 追加委託的掃描結果

- **`capture` 同 label 跑兩次**:靜默覆蓋,無錯誤無警告(`scratchpad` 實測,manifest.json 的 mtime 從
  `1785984944` 變成 `1785986203`,PNG 數量不變仍 116 張)。見發現 5。
- **一頁只出現在單側時,`diff` 是 `missing` 還是默默略過**:是明確的 `missing`,不會被略過
  (捏造缺一頁的 manifest 實測:`pages missing: 1 / MISSING button (missing in one-page-missing)`,
  回傳碼為 1)。但發現 6 提到 verdict 文字仍可能誤讀,一併記錄。
- **差異頁數是否因兩側頁數不同而被低估**:沒有低估——`missing` 走獨立分支,不併入 `differing`
  也不併入 `noise`,兩者互不干擾。差異頁數本身沒有被稀釋。
- **`png-compare.js` 對非標準 PNG 輸入的行為**:用手寫的合成 PNG(colour type 0/灰階,
  Playwright 從不產出但驗證了「非典型輸入」的路徑)餵給 `decode()`,結果是**明確拋錯**
  (`unsupported PNG (bitDepth 8, colorType 0, interlace 0)`),不會靜默給出錯的比較結果。
  唯一的小備註:`diff()` 呼叫 `compare()` 沒有包 try/catch,若真的遇到一張壞掉的 PNG,
  整個 `diff` 指令會直接拋出未捕捉例外中止,而不是把那一頁標成錯誤後繼續比對其他頁——
  但因為 Playwright 是唯一、受控的 PNG 產生來源,這個路徑在正常使用下不會被觸發,列為極低風險備註,
  不列入發現表。
- **8 輪 × 250ms 對慢頁是不是太短**:**是,已由發現 1(iframe)實測證實**,兩者是同一個根因,
  不重複列為獨立發現。

## 6. 我沒能驗證的,以及為什麼

- **C8 的「永遠不穩定 ⇒ missing」路徑沒有直接觸發**,只做了程式碼推理(§2 C8 已註明)。
  原因:要人工構造一個「連續 8 輪都無法收斂」的頁面,需要在 `target/` 輸出裡注入一個會持續變動的
  渲染效果(例如強制某元素在每次 reflow 時輪替顏色),這已經超出「改一行靜態 CSS 值」的注入範圍,
  風險與工程量都明顯偏高,而且發現 1(iframe)已經提供了一個**更真實、更有代表性**的「穩定判定
  不夠可靠」案例,對判斷 harness 的實際風險已經足夠,所以沒有再另外構造這個純理論案例。
- **C4 只驗證了 font-awesome 的消失與 `_zkiju-`/`marble` 兩個字串判準,沒有逐一核對其他 8 個
  L2.4 之前補齊的 backfill 元件(avatar/badge/breadcrumb/…)是否也在 Marble provider 介入時
  受影響**——因為 C4 這條斷言本身只針對 font-awesome 這一個案例(委託書原文如此),其他元件的
  行為推論上應該相同(都是 `beforeWidgetCSS()` 的清單過濾),但沒有逐一實測,誠實列出。
- **C13 裡快取中出現的 `chromium-1117`/`firefox-1449`/`webkit-2003` 三個版本資料夾,不對應
  iceblue(1234/1538/2336)或 Marble(1217/1511/2272)任一專案目前釘住的版本號,來源不明**——
  沒有繼續追查,因為它們的存在與缺失都不影響兩個專案目前各自能不能啟動瀏覽器(已用執行驗證確認),
  純屬未解的環境History,不影響本次驗收結論。
