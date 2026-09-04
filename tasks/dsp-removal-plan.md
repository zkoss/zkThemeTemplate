# DSP 移除計畫 —— 逐項對應現代替代技術

> 建立於 2026-08-19。回答的問題:**現有 DSP 想達成的效果,能不能一項一項換成現代技術?**
>
> 這份文件**只做分析與規劃,不動任何檔案**。它接手兩件已經被明確標為「以後再說」的事:
> 計畫書第一期 won't-do 清單的 **B1(拿掉 DSP 層)**,以及
> [tasks/p5-browserdefault-options.md](p5-browserdefault-options.md) §7 留下的
> 「選項 B 屬於『未來要不要拿掉 DSP 層』那個獨立問題」。
>
> 生態調查(其他 UI framework 怎麼在不用前處理器的情況下做條件式 CSS)寫在
> Marble 樹的 `doc/conditional-css-without-preprocessor.md`;本文件不重複那份調查,
> 只把它的結論套到本樹**實際存在**的 DSP 上。

---

## L1 執行摘要

### 核心目標

把本主題輸出的 85 個 `.css.dsp` 裡的 **DSP 語法**全部清空,讓 `.css.dsp` 只剩下
**副檔名**這一個角色(ZK core 的 `zk.wcs` 與各 `lang-addon.xml` 的 `<css-uri>` 要求這個副檔名,
主題端改不了),檔案內容則是純 CSS。

**不是**目標:改掉 `.css.dsp` 這個副檔名、動 `zk.wcs`、或改 ZK core。那些是產品端變更。

### 替代技術的優先序(本次裁定)

| 層級 | 手段 | 什麼時候用 |
|---|---|---|
| **Tier 1** | 現代 CSS 語法 | 只要 CSS 做得到就用 CSS |
| **Tier 2** | Build 程式(`scripts/build-css.js`) | CSS 做不到,但條件在**建置期**就已知 |
| **Tier 3** | Java(`ThemeProvider` / `WebAppInit`) | 條件在**部署期或執行期**才知道 |

### 現況實測:DSP 只剩四種用途

以 `npm run build:css` 產出的 `target/classes/web/iceblue11` 實測(2026-08-19):

| 用途 | 出現次數 | 出現在哪 |
|---|---|---|
| **A. `browserDefault` 選擇器前綴** `${".z-page "}` | **114** | `norm.css.dsp` 90 + `tablet.css.dsp` 24 |
| **B. `browserDefault` 整塊開關**(把規則**刪掉**) | **3** | `norm.css.dsp` |
| **C. `density` 整塊開關** | **3** | `norm.css.dsp` 1 + `tablet.css.dsp` 2 |
| **D. `url()` 裡的資產路徑 EL** | **44** | 12 個檔 |
| **E. taglib 宣告**(A–D 的前置,本身無效果) | 83 檔 × 3 行 | 85 個檔裡的 83 個 |

**條件式只存在於 2 個檔**(`zul/css/norm.css.dsp` 與 `zkmax/css/tablet.css.dsp`),
其餘 83 個檔的 DSP 成分只有「資產路徑」與「taglib 宣告」。

### 五個里程碑

| Phase | 做什麼 | 消滅 | 需要 Java? | 需要裁示? |
|---|---|---|---|---|
| **P-1** | 資產靜態化(圖片改 CSS / data URI) | D 的 30 處 | 否 | 是(§四 議題 2) |
| **P-2** | 雙變體檔 + ThemeProvider 選檔 | A、B、C 共 120 處 | **是** | 是(§四 議題 1、3) |
| **P-3** | 字型 `@font-face` 搬出 WCS 聚合 | D 的 14 處 | **是** | 是(§四 議題 4) |
| **P-4** | build 停止輸出 taglib header | E 全部 | 否 | 否 |
| **P-5** | 守衛反轉 + 文件收尾 | —— | 否 | 否 |

**P-4 必須排在最後**:只要還有一個檔含 EL,那個檔就需要 header。

### 一句話結論

**四種用途裡,只有一種(B:把規則刪掉)是 CSS 原理上做不到的**,
而它與 A、C 共用同一個解法(雙變體 + Java 選檔),所以 **DSP 可以全部移除,代價是
2 個檔要各出多份變體、外加約 60 行 Java**。真正的成本不在技術,在 §四 的四個裁示。

---

## L2 逐項分析:每個 DSP 用途 → 替代技術 → 驗證方法

> 每一項的格式固定:**想達成的效果 → Tier 1 能不能 → Tier 2 能不能 → Tier 3 能不能 → 採用 → 怎麼驗證**。

### D-1 `browserDefault` 選擇器前綴(114 處)

**想達成的效果**
`org.zkoss.zul.theme.browserDefault` 有設值時,把 reset 的每一條選擇器限制在 `.z-page` 子樹內
(JS-Embed 到別人的頁面時,不要污染宿主)。輸出形狀:
`<c:if test="${not empty …}">${".z-page "}</c:if>h1{…}`。

| 層級 | 可行性 |
|---|---|
| **Tier 1** | **可以。`@scope (.z-page) { … }`** 完整覆蓋這 114 處。代價:①需要新的瀏覽器支援聲明(Chrome/Edge 118+、Safari 17.4+、Firefox 128+,即計畫書的 **L-2** 相依);②CleanCSS 5.3.3 會把 `@scope` **整份清空**且只在 `warnings` 報告 —— 必須「先壓縮內層、再包 `@scope`」;③**解不掉 D-2**,所以 DSP 不會因此消失 |
| **Tier 2** | **可以。**build 直接產兩份:`norm.css.dsp`(無前綴)與 `norm-embed.css.dsp`(前綴已寫死在選擇器裡)。無新語法、無瀏覽器相依 |
| **Tier 3** | 選檔用。見下 |

**採用:Tier 2 + Tier 3。**
理由:`@scope` 換不到目的 —— 它解不掉 D-2,DSP 還是得留著;而雙變體一次解掉 D-1 + D-2,
且不吃 L-2 相依。這與 [doc/browserdefault-masking.md](../doc/browserdefault-masking.md) §2
當初否決 `@scope` 的理由一致,差別只在:當時的替代品是「來源寫佔位符、build 還原成 DSP」,
現在的替代品是「build 直接產兩個檔」。

**Tier 3 的具體做法(關鍵機制事實)**

`ThemeProvider` 兩個 hook 的能力邊界(實地讀 `WcsExtendlet` / `StandardThemeProvider` 得到):

| Hook | 改寫 URI | 跳過(回 `null`) | **新增** |
|---|---|---|---|
| `beforeWidgetCSS` | ✅ | ✅ | ❌ |
| `getThemeURIs` | ✅ | ✅ | ✅(但掛在聚合**外面** = +1 request) |

所以正解是 **`beforeWidgetCSS` 在同一個聚合槽位換檔名**:

```java
// IceblueThemeProvider.beforeWidgetCSS
if (uri.endsWith("/zul/css/norm.css.dsp") && embedSafe())
    uri = uri.replace("norm.css.dsp", "norm-embed.css.dsp");
```

**檔數不變、request 數不變、cache 行為不變** —— 這正是 p5 當時擔心會弄丟的「單一 WCS」,
用 `beforeWidgetCSS` 保住了(Marble 走的是 `getThemeURIs` 拆檔,那是因為 Marble 的 reset
本來就在聚合外面;本樹不需要照抄)。

**驗證方法**

| # | 手段 | 通過條件 |
|---|---|---|
| V1-1 | `npm run check:cssdiff` 對**預設變體** | 相對 `baseline/` 的宣告差異 = 已核准 delta,`norm.css.dsp` 這一段 **0 筆新增** |
| V1-2 | 文字斷言:`norm-embed.css.dsp` 內 `.z-page ` 出現 90 次、`norm.css.dsp` 內 **0 次** | 數字相符 |
| V1-3 | **computed-style A/B**:同一頁在 `-Dorg.zkoss.zul.theme.browserDefault=true` 與不設值兩次開機下截取 `getComputedStyle`,比對今日 DSP 版與新版 | 兩組四份輸出,**逐屬性相等** |
| V1-4 | 巢狀宿主測試:把一段 ZK 片段嵌進一個有自訂 `h1{}` 的宿主頁 | 開啟 embed 模式時宿主 `h1` 樣式未被改動 |

---

### D-2 `browserDefault` 整塊開關(3 處)

**想達成的效果**
embed 模式下,這三條規則必須**不存在**(不是被覆蓋、不是被 scope 住,是不存在):

```css
html{line-height:normal;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}
html,body{height:100%}
body{margin:0;padding:0 5px}
```

| 層級 | 可行性 |
|---|---|
| **Tier 1** | **做不到。CSS 沒有「這條規則不存在」這個運算子。** `@scope`、`@supports`、`@container style()`、`:where()` 全部只能改變**適用範圍或優先權**,不能讓一條宣告從串聯裡消失。宿主頁如果自己寫了 `body{margin:0}` 以外的值,任何「用更低優先權寫回瀏覽器預設值」的作法都會**覆蓋掉宿主**,語意就錯了 |
| **Tier 2** | **可以。**兩份變體,其中一份根本不含這三條規則 |
| **Tier 3** | 選檔用,與 D-1 同一個 `beforeWidgetCSS` 分支 |

**採用:Tier 2 + Tier 3(與 D-1 同一次改動)。**

> **這一項是整份計畫的樞紐。** 它是唯一一個「現代 CSS 原理上不可能」的項目,
> 也因此它決定了 D-1 與 D-3 的解法 —— 既然為了它一定要有雙變體機制,
> 那 D-1 / D-3 就沒有理由再各自發明第二套機制。

**驗證方法**

| # | 手段 | 通過條件 |
|---|---|---|
| V2-1 | embed 模式下 `document.styleSheets` 全掃 | 找不到任何 selectorText 為 `html`、`body`、`html,body`、`main` 的規則 |
| V2-2 | 瀏覽器預設值保留檢查:embed 模式下讀 `getComputedStyle(document.body).marginTop` | `8px`(瀏覽器預設)而非 `0px` |
| V2-3 | 預設模式(不設 property)同樣兩個檢查 | 三條規則都在;`marginTop` = `0px` |

---

### D-3 `density` 整塊開關(3 處)

**想達成的效果**
`org.zkoss.zul.theme.density=compact` 時才輸出那 350 個 compact token(來源
`tokens/_density-compact.css`,16,378 B),預設模式**一個 byte 都不送**。
這是 2026-08-17 的裁示 **C25 / D6**([tasks/d6-property-only-density.md](d6-property-only-density.md)),
而且那次裁示**刻意刪掉了 CSS 的 `[data-density="compact"]` 掛勾**,理由是「留半套 = 留一個已知的錯誤狀態」。

| 層級 | 可行性 |
|---|---|
| **Tier 1** | **技術上可以,但會推翻 C25。** `:root[data-density=compact]{…}` 或 `@container style(--zk-density: compact)` 都做得到切換,代價是那 14,498 B(gzip 2,403 B)**恆送**,而且屬性掛勾會重新打開 D4 當初要消滅的「桌面 compact + 平板 default」分裂狀態 |
| **Tier 2** | **可以。**build 產 default / compact 兩份 |
| **Tier 3** | 選檔:同一個 `beforeWidgetCSS`,條件換成 density property |

**採用:Tier 2 + Tier 3 —— 但先看 §四 議題 1。**
這個選法**完整保留 C25 的語意**(property 是唯一開關、桌面與平板同一套機制、預設模式 0 byte),
只是把「伺服器在同一個檔裡二選一段落」換成「伺服器在兩個檔裡二選一個檔」。
語意不變、DSP 消失。

**但它會讓變體數相乘** —— 見 §四 議題 3。

**驗證方法**

| # | 手段 | 通過條件 |
|---|---|---|
| V3-1 | `npm run check:density-css` | 仍 exit 0(產生器與 token 表的一致性不受影響) |
| V3-2 | Byte 斷言 | 預設變體含 0 個 compact token;compact 變體含 350 個 |
| V3-3 | computed-style A/B:grid row 高度、`--zk-base-font-size` | 開/關兩組與今日 DSP 版逐值相等 |
| V3-4 | 平板層一致性(D4 的 S36 防線) | 行動 UA + `density=compact` 下,桌面層與平板層**同時**是 compact |

---

### D-4 元件資產路徑 `encodeThemeURL`(25 處 / 18 個圖檔)

**想達成的效果**
把 `~./zul/img/x.png` 解析成**目前主題**的那一份拷貝
(`ServletFns.resolveThemeURL`:JAR 主題 → `~./<theme>/zul/img/x.png`;
資料夾主題 → `/<org.zkoss.theme.folder.root|theme>/<theme>/zul/img/x.png`),再補上 context path 與版本戳。

| 層級 | 可行性 |
|---|---|
| **Tier 1(甲):把圖片消滅掉** | **可以,而且是最乾淨的解。** 這 18 個圖檔全部是漸層、旋轉動畫、箭頭與小圖示 —— 現代 CSS 全部畫得出來。**實證:Marble 主題的圖檔數是 0**,`find src/main/resources/web -name '*.png' -o -name '*.gif'` 回傳 0,全部由 `linear-gradient` / `@keyframes` / inline SVG `data:` URI 取代 |
| **Tier 1(乙):相對路徑 `url(../…)`** | **不建議。**CSS 的 `url()` 以**樣式表自己的 URL** 為基準,而元件 CSS 是被合併進 `zk.wcs` 這**單一 response** 的,基準因此是 `zk.wcs` 的 URL。更糟的是 `StandardThemeProvider.getThemeURIs` 會用 `ThemeProvider.Aide.injectURI` 往 WCS URI 塞一段 **`_zkiju-<theme>/`**(`Attributes.INJECT_URI_PREFIX`),而**只有 `WcsExtendlet.getRealPath` 會把它剝掉** —— 一般的 ClassWebResource 請求不會。所以相對路徑要多爬一層,而「有沒有那一層」取決於 ThemeProvider 的實作。可行但**把 ZK core 的 URL 佈局寫死進 CSS 文字**,將來 core 一改就是無聲 404 |
| **Tier 2** | 只在採 Tier 1(乙) 時需要(build 計算相對深度)。採 (甲) 則不需要 |
| **Tier 3** | 不需要 |

**採用:Tier 1(甲) —— 逐檔改寫成 CSS 或 inline SVG data URI。**

逐資產對應表(檔案大小為本樹實測):

| 資產 | 大小 | 引用處 | 替代技術 |
|---|---|---|---|
| `zul/img/misc/progress-72.gif` | 42,104 B | grid / listbox / tree | `@keyframes` 旋轉 + `conic-gradient`(或 inline SVG) |
| `zul/img/misc/progress-32.gif` | 33,235 B | norm | 同上 |
| `zul/img/misc/prgmeter-anim.gif` | 1,498 B | progressmeter | `repeating-linear-gradient` + `@keyframes` |
| `zul/img/misc/prgmeter.png` | 168 B | norm | `linear-gradient` |
| `zul/img/grid/menu-{arrowup,arrowdown,group,ungroup}.png` | 219–1,032 B | grid / listbox | inline SVG `data:` URI(或既有 icon 機制) |
| `zul/img/msgbox/{info,question,stop,warning}-btn.png` | 341–924 B | window | inline SVG `data:` URI |
| `zul/img/slider/scale-ticks.png` | 237 B | slider | `repeating-linear-gradient` |
| `zul/img/common/bar-bg.png` | 159 B | frozen | `linear-gradient` |
| `zkmax/img/tablet/layout/load-{up,down,left,right}.png` | 498–533 B | scrollview | inline SVG `data:` URI |

> **大檔優先用 CSS 畫,不要用 data URI。** 42 KB 的 GIF 轉 base64 是 56 KB,而且會落進**每次都下載**
> 的 WCS 聚合裡。小於約 2 KB 的才適合 inline。

**驗證方法**

| # | 手段 | 通過條件 |
|---|---|---|
| V4-1 | `npm run visual:capture` + `npm run visual:diff`,逐元件(grid / listbox / tree / window / slider / frozen / progressmeter / scrollview) | 差異在 [doc/visual-ab-harness.md](../doc/visual-ab-harness.md) 已定的判定門檻內 |
| V4-2 | **404 掃描**:Playwright 攔 `response`,走完所有預覽頁 | 對 `zkau/web/**` 的請求 0 個非 2xx |
| V4-3 | 資產計數 | `find target -name '*.png' -o -name '*.gif'` 減少 18 個;jar 縮小約 120 KB |
| V4-4 | 動畫存在性(GIF → CSS 的回歸點) | `getAnimations()` 在 loading 狀態下回傳非空 |
| V4-5 | `prefers-reduced-motion` | 新的 `@keyframes` 在該 media 下停止(GIF 時代做不到,這是淨改善) |

---

### D-5 字型與 colorbox 資產 `encodeURL`(19 處)

拆成兩半,因為解法不同。

#### D-5a colorbox 的 4 個圖檔

| 資產 | 大小 | 替代技術 |
|---|---|---|
| `colorpicker_gradient.png` | **57,048 B** | 兩層 `linear-gradient` 疊加(飽和度 × 明度方塊本來就是兩個漸層) |
| `colorpicker_hue.png` | 222 B | `linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)` |
| `colorpicker_arrows.gif` | 81 B | inline SVG data URI |
| `colorpicker_select.gif` | 78 B | `border` + `border-radius` 畫的圓圈 |

**採用:Tier 1。** 這一項單獨就省下 57 KB。
**驗證**:V4-1 / V4-2 同法,外加**取色正確性測試** —— 在 colorbox 上以固定座標點擊,
斷言回傳的 hex 與今日版本一致(漸層與點陣圖的色彩內插不保證相同,這是**必測**項)。

#### D-5b Font Awesome / ZK85Icons 字型(14 處 / 9 個字型檔)

**想達成的效果**:`@font-face` 的 `src: url(…)` 要指到正確的實體路徑。

| 層級 | 可行性 |
|---|---|
| **Tier 1** | **做不到。**①字型是幾百 KB 的二進位,inline 成 data URI 不可行;②`@font-face` **不吃 `var()`**(自訂屬性不作用在 `@font-face` 描述子上),所以「用變數注入路徑」這條路是死的;③相對路徑受 D-4 Tier 1(乙) 的 `_zkiju-` 問題影響 |
| **Tier 2** | 半個。build 可以寫死相對路徑,但深度取決於執行期,見 D-4 |
| **Tier 3** | **可以,而且乾淨。**把 `@font-face` 從 WCS 聚合裡搬出來,做成一支獨立樣式表,由 `getThemeURIs` 加進去。獨立樣式表**有自己的 URL**,`url(../font/x.woff2)` 因此以它自己的位置為基準解析,`_zkiju-` 問題不存在。代價:**+1 個 HTTP request** |

**採用:Tier 3,但先看 §四 議題 4** —— 下一版 ZK 要把 Font Awesome 換成原生 Lucide,
屆時這 14 處會整批消失,現在做可能是白工。

**驗證方法**

| # | 手段 | 通過條件 |
|---|---|---|
| V5-1 | `document.fonts.check('16px "Font Awesome 6 Free"')` | `true` |
| V5-2 | 網路面板 | 每個 woff2 皆 200,無 404 |
| V5-3 | 圖示字形截圖 | 與今日版本逐圖示相同 |
| V5-4 | request 數 | 恰好 +1,不是 +N |

---

### D-6 被 `encodeURL` 包住的 `data:` URI(1 處)

**想達成的效果**:無。`${c:encodeURL("data:image/gif;base64,R0lGOD…")}` 把一個 data URI 丟進
URL 編碼函式,輸出就是輸入。這是 LESS 時代留下的無意義包裝。

**採用:Tier 1** —— 直接寫成字面 data URI。Marble 已經是這樣寫的。

**驗證**:`check:cssdiff` 顯示恰好 1 筆宣告變更,且變更後的值與變更前**執行期解析結果**相同(curl 出 `zk.wcs` 比對字串)。

---

### D-7 taglib 宣告(83 檔 × 3 行)

**想達成的效果**:讓 `<c:if>` / `${c:…}` 在 DSP 直譯器裡可用。**本身沒有樣式效果。**

D-1 ~ D-6 全部完成後,沒有任何檔還需要它。

| 層級 | 可行性 |
|---|---|
| **Tier 1** | 不適用 |
| **Tier 2** | **可以。**`build-css.js` 移除 `HEADER` 前置與 `TAGLIB_MARKER` |
| **Tier 3** | 不需要 |

**實證**:Marble 主題的 85 個 `.css.dsp` 裡有 **84 個完全沒有 taglib header**,
線上正常運作 —— 沒有 header 的 `.css.dsp` 是合法且被 `WcsExtendlet` 正確處理的。
(本樹自己也已經有 2 個檔沒有 header:`js/zkmax/sel/css/listbox.css.dsp`、`js/zkmax/sel/css/tree.css.dsp`。)

**驗證方法**

| # | 手段 | 通過條件 |
|---|---|---|
| V7-1 | `grep -rl '<%@' target/classes/web/iceblue11` | 0 個檔 |
| V7-2 | curl 執行中的 app 取 `zk.wcs` 全文 | 不含 `<%@`、`<c:`、`${`;且 CSS 內容與今日版本等價 |
| V7-3 | `npm run check:build-css` | `EXPECTED` 更新後 0 differences |
| V7-4 | 全預覽頁 smoke | 頁面渲染正常,console 無錯誤 |

---

### D-8 `.css.dsp` 這個副檔名本身

**想達成的效果**:讓 `WcsExtendlet` 把檔案當 DSP 模板來 include。

**結論:主題端動不了,也不需要動。**
`zul/css/zk.wcs` 是 **ZK core 的檔案**,裡面寫死 `~./zul/css/norm.css.dsp`;
各元件的路徑來自 `lang-addon.xml` 的 `<css-uri>`。`beforeWidgetCSS` **能改寫、能跳過,不能新增**,
所以主題無法把清單換成 `.css`。

**採用:不處理。** 讓 `.css.dsp` 退化成**純粹的傳遞容器** —— 副檔名是 DSP,內容 0 個 DSP 語法。
這正是 Marble 現在的狀態(85 個檔裡 84 個是純 CSS)。

**若未來要在產品端拿掉**:要同時改 `zk.wcs`、各 `lang-addon.xml`、以及 `WcsExtendlet` 的載入邏輯,
並保證舊主題 jar 仍能載入 —— 那是獨立的產品議題,不在本計畫範圍。

---

### 逐項總表

| # | DSP 用途 | 處數 | Tier 1 | Tier 2 | Tier 3 | **採用** |
|---|---|---|---|---|---|---|
| D-1 | browserDefault 選擇器前綴 | 114 | ⚠️ `@scope`(解不完) | ✅ 雙變體 | ✅ 選檔 | **T2+T3** |
| D-2 | browserDefault 整塊刪除 | 3 | ❌ **原理不可能** | ✅ 雙變體 | ✅ 選檔 | **T2+T3** |
| D-3 | density 整塊開關 | 3 | ⚠️ 推翻 C25 | ✅ 雙變體 | ✅ 選檔 | **T2+T3** |
| D-4 | 元件圖片路徑 | 25 | ✅ **消滅圖片** | —— | —— | **T1** |
| D-5a | colorbox 圖片 | 4 | ✅ 漸層 | —— | —— | **T1** |
| D-5b | 字型路徑 | 14 | ❌ | ⚠️ | ✅ 獨立樣式表 | **T3** |
| D-6 | data URI 包裝 | 1 | ✅ 直接寫 | —— | —— | **T1** |
| D-7 | taglib 宣告 | 83 檔 | —— | ✅ 停止輸出 | —— | **T2** |
| D-8 | `.css.dsp` 副檔名 | 85 檔 | —— | —— | —— | **不處理** |

**44 處 EL 裡有 30 處可用純 CSS 解決;120 個 `<c:if>` 全部走同一套雙變體機制。**

---

## L2.5 驗證策略(跨階段)

### 閘門要從 G-zero 改成 G-delta

今天的閘門是**位元組同一性**(`check:baseline` 對 `baseline/`),前提是「輸出一個 byte 都不能動」。
本計畫**每一項都是 delta**,所以閘門必須改成「差異恰好等於已核准清單」——
本樹已經有這個模式(`check:p4a --expect 731`、`check:p4b`),照抄即可,**不要**放寬 `check:baseline`。

### 每一階都要跑的四件事

| | 工具 | 抓什麼 |
|---|---|---|
| 1 | `npm run check:build-css` | 產生器可重現(85 檔 / 0 differences) |
| 2 | `npm run check:cssdiff` | 宣告層差異 = 已核准 delta |
| 3 | `npm run visual:capture` + `visual:diff` | 視覺回歸 |
| 4 | **新增 `npm run check:no-dsp`** | 產出樹裡 `<c:if` / `<%@` / `${` 的出現次數 **≤ 本階段允許值**,最終為 0 |

### 需要新建的驗證器

| 名稱 | 做什麼 | 為什麼非有不可 |
|---|---|---|
| `check:no-dsp` | 掃產出樹,斷言剩餘 DSP 語法數 | 今天的 `HOSTILE_CONSTRUCTS` 守的是「**來源**不得出現 DSP」;本計畫要的是「**產出**不得出現 DSP」。方向相反,兩個都要 |
| `check:404` | Playwright 走完所有預覽頁,攔 `response` | D-4 / D-5 動的是資產路徑,**路徑錯誤在視覺上可能看不出來**(圖沒載到就是沒背景),必須從網路層抓 |
| `check:property-ab` | 用兩組 library property 各開一次 app,比對 computed style | D-1 / D-2 / D-3 的正確性**只在 property 開啟時**才顯現,單跑預設模式是綠燈假象 |

> **「視覺沒變」不等於「沒壞」。** D-4 把圖片換成 CSS,如果路徑寫錯,舊版是「圖沒出現」、
> 新版是「漸層正常」—— 視覺 diff 反而可能變綠。所以 404 掃描是獨立必要條件,不能用視覺取代。

---

## ⚠️ 四、待決策與裁示事項

### 議題 1:density 要不要維持 C25(property-only)?

**背景**:C25 / D6 是 2026-08-17 的裁示,而且**刻意刪掉了 `[data-density]` CSS 掛勾**。
本計畫的 D-3 有兩條路,兩條都能移除 DSP,但語意不同。

| 選項 | 作法 | 代價 |
|---|---|---|
| **【A】維持 C25(建議)** | density 用雙變體檔,ThemeProvider 依 property 選檔 | 語意 100% 不變、預設仍 0 byte;但**變體數與 browserDefault 相乘**(見議題 3) |
| **【B】回到 CSS 選擇器** | `:root[data-density=compact]`,property 由 Java 轉成 `<html>` 上的屬性 | 變體數不相乘;但 14,498 B(gzip 2,403 B)**恆送**,且重新打開 D4 要消滅的桌面/平板分裂風險 —— **等於推翻兩天前的裁示** |

**建議 A。** 理由:C25 的論證(「留半套 = 留一個已知的錯誤狀態」)不會因為換掉 DSP 而失效。

### 議題 2:那 18 個圖檔是不是公開擴充點?

**背景**:`encodeThemeURL` 的語意是「**可被主題覆蓋**的資產」。今天有人只要在自己的主題 jar 裡
放一張同名 PNG,就能換掉 ZK 的 spinner。改成 CSS 畫之後,這條路消失。

| 選項 | 作法 | 代價 |
|---|---|---|
| **【A】直接拿掉(建議)** | 圖片改 CSS,不留覆蓋點 | 對「換過 PNG」的既有客戶是 **breaking change**,要寫進遷移指南 |
| **【B】留 token 覆蓋點** | CSS 畫的結果包成 `--zk-spinner-image` 之類的 token,預設值是 CSS 畫的,客戶可覆蓋成 `url(...)` | 多 18 個 token 要維護;但覆蓋能力**比今天更強**(不限於同名檔) |

**建議 A**,理由:主題已經全面轉向 token API,圖檔覆蓋是舊機制;但**若客服有實際案例**,改採 B。

### 議題 3:變體檔相乘的 jar 體積可不可以接受?

**背景**:兩個條件同時存在時,變體數是**乘法**不是加法:

| 檔 | 單份大小 | browserDefault × density | 總計 |
|---|---|---|---|
| `norm.css.dsp` | 72,837 B | 2 × 2 = **4 份** | 291 KB(今日 71 KB) |
| `tablet.css.dsp` | 27,638 B | 2 × 2 = **4 份** | 108 KB(今日 27 KB) |

**jar 增加約 +294 KB;送給瀏覽器的仍然只有 1 份,執行期 0 成本。**
但如果將來再加第三個 property,就是 8 份。

| 選項 | 作法 | 代價 |
|---|---|---|
| **【A】接受相乘(建議)** | 產 4 + 4 份 | +294 KB jar;新增條件時要重新檢視 |
| **【B】density 走 CSS** | 見議題 1【B】,變體降為 2 + 2 | 恆送 14.5 KB、推翻 C25 |
| **【C】只對 norm 相乘** | tablet 的 density 改 CSS | 桌面/平板機制又不一致 —— **正是 D4 要消滅的東西,不建議** |

### 議題 4:D-5b(字型)現在做還是等 Lucide?

**背景**:下一版 ZK 要把 Font Awesome 換成原生 Lucide 圖示,屆時這 14 處 EL 整批消失。

| 選項 | 作法 | 代價 |
|---|---|---|
| **【A】等 Lucide(建議)** | 本計畫先做 D-1~D-4、D-6、D-7,把 D-5b 留到圖示遷移時一起 | DSP 歸零的時間點被那次遷移綁住 |
| **【B】現在就搬** | 立刻做獨立 `@font-face` 樣式表 | +1 request,而且很可能幾個月後整份刪掉 —— 白工 |

---

## 五、未完成與下一步

- [ ] **取得四個裁示**(§四)── *目的:P-1 / P-2 的作法直接取決於議題 1~3*
- [ ] **P-1 資產靜態化**:D-4 + D-5a + D-6 ── *目的:先做完全不需要 Java、不需要瀏覽器支援聲明的 30 處,拿到早期成果*
- [ ] **建 `check:404` 與 `check:no-dsp`**,在 P-1 開工**之前** ── *目的:視覺 diff 抓不到路徑錯誤,守衛必須先於改動存在*
- [ ] **P-2 雙變體 + ThemeProvider**:D-1 + D-2 + D-3 ── *目的:一次消滅全部 120 個 `<c:if>`*
- [ ] **建 `check:property-ab`** ── *目的:P-2 的正確性只在 property 開啟時顯現*
- [ ] **P-3 字型**(若議題 4 選 B) ── *目的:把最後 14 處 EL 清掉*
- [ ] **P-4 停止輸出 taglib header** ── *目的:E 類歸零;必須排在最後*
- [ ] **P-5 守衛反轉 + 文件**:`HOSTILE_CONSTRUCTS` 的用途從「保護 DSP 不被壓縮器改壞」改成「禁止 DSP 出現」;更新 `doc/browserdefault-masking.md`、遷移指南 ── *目的:讓規範與工具一致,避免規範被無聲忽略*

---

## L3 技術附錄

### A. 實測數據(2026-08-19,`npm run build:css` 後的 `target/classes/web/iceblue11`)

```
.css.dsp 檔數                85
.css.dsp 總位元組            643,647
帶 taglib header 的檔        83   (缺的 2 個:js/zkmax/sel/css/{listbox,tree}.css.dsp)
含 <c:if> 的檔                2   (zul/css/norm.css.dsp 94 個、zkmax/css/tablet.css.dsp 26 個)
含 url() EL 的檔             12
EL 總處數                    44   (encodeThemeURL 25 + encodeURL 19)
```

`<c:if>` 明細:

| 條件 | norm | tablet | 合計 |
|---|---|---|---|
| `not empty c:property('org.zkoss.zul.theme.browserDefault')` | 90 | 24 | **114** |
| `empty c:property('org.zkoss.zul.theme.browserDefault')` | 3 | 0 | **3** |
| `'compact' eq c:property('org.zkoss.zul.theme.density')` | 1 | 1 | **2** |
| `'compact' ne c:property('org.zkoss.zul.theme.density')` | 0 | 1 | **1** |

重製指令:

```bash
cd /Users/hawk/Documents/workspace/zkThemeTemplate-iceblue
npm run build:css
O=target/classes/web/iceblue11
/usr/bin/grep -rhoE '<c:if test="[^"]*">' $O --include='*.dsp' | sort | uniq -c | sort -rn
/usr/bin/grep -rl 'c:encode' $O --include='*.dsp'
/usr/bin/grep -rl '<%@' $O --include='*.dsp' | wc -l
```

### B. ZK 機制事實(讀 ZK 10 原始碼得到,非推論)

| 事實 | 出處 |
|---|---|
| `zk.wcs` 是 ZK core 的檔,列出 `font-awesome.css.dsp` + `norm.css.dsp` | `zk/zul/src/main/resources/web/zul/css/zk.wcs` |
| `beforeWidgetCSS` 能改寫 / 回 `null` 跳過,**不能新增** | `WcsExtendlet.service()` |
| `getThemeURIs` 能新增,但掛在聚合外面 | `StandardThemeProvider.getThemeURIs` |
| `getThemeURIs` 預設會把 `_zkiju-<theme>/` 注入 WCS URI | `ThemeProvider.Aide.injectURI`,`Attributes.INJECT_URI_PREFIX = "_zkiju-"` |
| **只有** `WcsExtendlet` 的 loader 會剝掉那段 | `WcsExtendlet$…getRealPath()` |
| `resolveThemeURL`:JAR 主題 → `~./<theme>/…`;FOLDER 主題 → `/<prefix>/<theme>/…`,`prefix` 由 `org.zkoss.theme.folder.root` 決定(預設 `theme`) | `ServletFns.resolveThemeURL` |
| `encodeThemeURL(s)` = `encodeURL(resolveThemeURL(s))` | `ServletFns` |
| WCS 快取 `getWCSCacheControl` = 8760 小時 | `StandardThemeProvider` |

> **待實測(V0)**:上表推得的 WCS 實際 URL 形狀
> `/{ctx}/zkau/web/{uid}/_zkiju-{theme}/zul/css/zk.wcs`,尚未在執行中的 app 上以 curl 證實。
> 這一項只影響 D-4 Tier 1(乙)(已不採用),但 P-3 開工前必須先確認。

### C. Marble 主題的實證(同一組問題的另一個答案)

Marble 是本專案的姊妹主題,**刻意不用 DSP**,因此可以當作「這些替代技術行不行」的既存證據:

| 項目 | Marble 現況 |
|---|---|
| 圖檔數 | **0**(72 個 inline SVG data URI + 2 個 gif data URI) |
| 帶 taglib header 的 `.css.dsp` | **1 / 85**(只有 `norm.css.dsp`,為了字型 URL) |
| 含 `<c:if>` 的檔 | **0** |
| browserDefault | 在 Java 做:`getThemeURIs` 依 property 在 `reset.css` / `reset-embed.css` 之間二選一 |
| density | CSS 屬性 `data-density="compact"`(與本樹 C25 相反的選擇) |
| 剩餘 EL | 2 處,`@font-face` 的 Inter woff2 —— 與本計畫 D-5b 是同一個未解問題 |

**注意**:Marble 的 browserDefault 走 `getThemeURIs`(拆檔 + 多一個 request),
本計畫走 `beforeWidgetCSS`(同槽位換檔名,不多 request)—— 兩者前提不同,
Marble 的 reset 本來就在聚合外面。**不要照抄。**

### D. 與既有文件的關係

| 文件 | 關係 |
|---|---|
| [doc/browserdefault-masking.md](../doc/browserdefault-masking.md) | 記錄現行做法(來源佔位符 → build 還原 DSP)。本計畫 **P-2 完成後會取代它**,屆時要改寫,不是加註 |
| [tasks/p5-browserdefault-options.md](p5-browserdefault-options.md) | 當時的選項 B(同槽位換檔名)被標為「未來拿掉 DSP 層的獨立問題」—— **本計畫就是那個問題**,D-1/D-2 採的就是 B |
| [tasks/d6-property-only-density.md](d6-property-only-density.md) | C25 裁示。本計畫議題 1 **不推翻它**,只換實作 |
| [tasks/d4-tablet-density.md](d4-tablet-density.md) | C24(平板層只認 property)。議題 3【C】會違反它,故不建議 |
| [doc/iceblue-drop-less-execution-plan.md](../doc/iceblue-drop-less-execution-plan.md) | §B1「拿掉 DSP 層」列為第一期 won't-do。本計畫是那一項的解鎖提案 |
| [doc/css-preprocessor-industry-direction.md](../doc/css-preprocessor-industry-direction.md) | 產業方向調查 |
| `zkThemeTemplate/doc/conditional-css-without-preprocessor.md` | 生態調查(其他 framework 怎麼做條件式 CSS),在 Marble 樹,非本 repo |

### E. Change Log

| 日期 | 變更 |
|---|---|
| 2026-08-19 | 建立。DSP 用途盤點四類 / 逐項對應 Tier 1–3 / 四個待裁示議題 |
