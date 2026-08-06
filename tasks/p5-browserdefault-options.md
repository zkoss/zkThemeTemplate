# P5 的 `browserDefault` / reset:單一 WCS 還保得住嗎?

> 建立於 2026-08-06,回答「只有『把 reset 拆成獨立檔案載入』一種解法嗎?」
> **結論:不是。而且『單一 WCS』本來就是現況,不需要靠拆檔去換回來 —— 反而是拆檔會把它弄丟。**
>
> **✅ 已拍板並實作(2026-08-06,commit `fea5f32` + `a03edcf`):採 §3【A】。**
> §7 三個待決事項的結果:①走 **A**;②`@scope` 的 `HOSTILE_CONSTRUCTS` 守衛**保留**;
> ③§P5〈前置〉**不需要**補 L-2 —— 不採 `@scope`,那個相依自然消失。
> 落地後的決策記錄搬到 [doc/browserdefault-masking.md](../doc/browserdefault-masking.md);
> 這份文件保留為**評估過程與被否決選項**的存證(B / C / D 的代價分析仍然有效,
> 尤其 B 屬於「未來要不要拿掉 DSP 層」那個獨立問題)。

---

## 1. 先拆開三個都叫「拆」的東西

問題會混淆,是因為 P5 裡有三種「拆」,只有第三種會影響載入幾個檔案:

| | 拆什麼 | 影響輸出檔數? | 影響瀏覽器請求數? | P5 現在計畫要做嗎 |
|---|---|---|---|---|
| **拆-1 來源檔** | `norm.less` → `tokens/_default.css`、`_iceblue.css`、`base/_reset.css`、`norm.css` | **否** —— `_` 開頭是 partial,`build-css.js` 串接成同一個 `norm.css.dsp` | 否 | **是**(這是 P5 的主體) |
| **拆-2 輸出檔** | 產出 `norm.css.dsp` **與** `reset.css.dsp` 兩個檔 | 是 | 看誰去載它 | 否 |
| **拆-3 載入檔** | 讓瀏覽器多下載一個 stylesheet | 是 | **是,+1 request** | 否 |

Marble 的 `reset.css` / `reset-embed.css` 是 **拆-2 + 拆-3**。P5 計畫書寫的只有 **拆-1**。
**所以「必須拆成獨立檔案載入」從來不是 P5 的既定做法** —— 它是 Marble 的做法,而 Marble 之所以
非那樣不可,是因為 Marble **刻意不用 DSP**;本分支 §B1 明文保留 DSP 層。前提不同,結論不能照抄。

---

## 2. 機制事實(本次實地讀出來的,不是推論)

### 2.1 誰決定 WCS 裡有哪些檔

`zk.wcs` 是 **ZK core 的檔案**,不在主題裡:

```xml
<!-- zk/zul/src/main/resources/web/zul/css/zk.wcs -->
<css language="xul/html">
    <stylesheet href="~./zul/font/font-awesome.css.dsp"/>
    <stylesheet href="~./zul/css/norm.css.dsp"/>
</css>
```

`WcsExtendlet.service()` 依序把這兩個 + 各元件 lang.xml 的 `<css-uri>` + 寫死的
`footer.css.dsp`,全部 `_webctx.include(...)` 進**同一個 response**,最後 gzip 送出。
每一個 URI 送出前都會經過 `tp.beforeWidgetCSS(exec, uri)`。

關鍵在這個 hook 的能力邊界:

| Hook | 能改寫 URI | 能跳過(回 `null`) | **能新增** |
|---|---|---|---|
| `ThemeProvider.beforeWidgetCSS` | ✅ | ✅ | ❌ |
| `ThemeProvider.getThemeURIs` | ✅ | ✅ | ✅(Marble 用的就是這個) |

**所以:主題無法往 WCS 聚合裡「加」檔案。** 想加,只有兩條路 —— 改 ZK core 的 `zk.wcs`
(產品端變更),或用 `getThemeURIs` 掛在聚合**外面**(= 多一個 `<link>`,多一個 request)。

反過來,`beforeWidgetCSS` **能改寫**這件事,正是後面選項 B 的支點:同一個聚合槽位,換一個檔名。

### 2.2 現況:reset 的條件式長什麼樣、有幾個

`baseline/zul/css/norm.css.dsp`(72 645 bytes,扣掉 taglib header)實測:

| 形狀 | 數量 | 用途 |
|---|---|---|
| selector 位置的前綴 `<c:if …>${".z-page "}</c:if>` | **90** | 把規則限制在 ZK 子樹內 |
| 整塊包起來的 `<c:if test="${empty …}">` … `</c:if>` | **3 對** | 把 `html` / `body` / `main` 規則**整段拿掉** |
| DSP tag 起始總數 | **186** | = 90×2 + 3×2 |

這兩種形狀不是同一件事,而**第二種是 `@scope` 表達不出來的**:`html` / `body` 在 embed 模式下
不能被 scope 到 `.z-page`,只能**不存在**。CSS 沒有「不存在」這個運算子。

> **推論:「把 `browserDefault` 改成 `@scope`」最多解決 90 個位置中的 90 個前綴,
> 剩下 3 對整塊條件式仍然需要一個伺服器端開關 —— 不是 DSP,就是 build 期產生兩份檔案。
> `@scope` 本身不會讓 DSP 消失。** 這一點 P5 計畫書目前沒有寫。

### 2.3 現況的請求數

`getWCSCacheControl` 回 8760 小時(一年),WCS URL 帶 version uid。也就是說
`browserDefault` 是**部署期**屬性,條件式的求值結果會被烘進一份快取一年的回應裡。
DSP 的 `Interpretation` 本身也有快取。**per-request 成本實質為零。**

### 2.4 這個功能歸哪一階實作,以及「轉成 CSS 就不能用 DSP」是不是真的

`browserDefault` 現在只剩 **4 個 LESS 來源檔**帶著它,對應**兩階**:

| 來源檔 | 輸出 | 形狀與數量 | 歸哪一階 |
|---|---|---|---|
| `zul/less/_reset.less`、`zul/less/norm.less` | `zul/css/norm.css.dsp` | 90 個 selector 前綴 + **3 對整塊 `<c:if>`** | **P5** |
| `zkmax/less/tablet/{default,compact}/_norm.less` | `zkmax/css/tablet.css.dsp` | **14** 個 selector 前綴,**沒有**整塊形狀 | **P7** |

> P7 比 P5 單純:tablet 全部是 `${not empty …}` 前綴,一個 `${empty …}` 整塊條件式都沒有,
> 所以 §2.2 那個「`@scope` 表達不出來」的問題在 P7 不存在。

**「改成 CSS 之後就無法使用 `<c:if>`」這個前提要拆成兩半 —— 一半對,一半不對:**

| 東西 | 是什麼 | 轉純 CSS 之後 |
|---|---|---|
| `e('…')` | **LESS 的 escape 函式** | **死掉** —— 它是把字串偷渡過 LESS parser 的手段 |
| `@{browserDefault}` | **LESS 的變數插值** | **死掉** —— 同上 |
| `<c:if test="${…}">` 本身 | **DSP**,由 `DspExtendlet` / `Interpreter` 在 **runtime** 求值 | **活著** —— LESS 在 runtime 根本不在場 |

會覺得兩者一起死,是因為在 LESS 裡它們永遠綁在一起出現;但綁在一起的是**寫法**,不是**機制**。
`.css.dsp` 是一個**模板**,不是 CSS(計畫書 §B1);把 CSS 變成瀏覽器可用內容的是 DSP interpreter,
而**這條 runtime lane 本分支一個 byte 都不動**。

**這不是推論,是本分支現在就在跑的事實:**

```
已轉成純 CSS 的來源檔          84
其中已經帶著 DSP EL 的         11   ← ${c:encodeURL} ×32、${c:encodeThemeURL} ×22
                                     (listbox / tree / grid / window / slider / colorbox /
                                      frozen / progressmeter / scrollview / font-awesome ×2)
閘門                           85 檔 / 14 863 條 / 0 差異 —— 照過
```

**DSP 早就活在純 CSS 檔裡了。** `browserDefault` 唯一的不同不是「CSS 不能用 DSP」,
而是它的 DSP 落在 **selector 位置**,而 CleanCSS 會把 `${".z-page "}` 靜默改寫成 `${}".z-page "`
(把字串搬出 EL 運算式外,**errors 0、warnings 0**)。所以要處理的是**壓縮器**,不是 DSP ——
這正是 §3【A】遮罩法在做的事,也是 `build-css.js` 的 `HOSTILE_CONSTRUCTS` 守衛已經寫好的處方。

---

## 3. 選項

### 【A】DSP 留在檔內,build 時遮罩(**建議**)

來源 `.css` 用**合法 CSS 的佔位符**寫,`build-css.js` 在 minify 前後做代換:

```css
/* 來源檔:base/_reset.css —— 全檔都是合法 CSS,編輯器與 linter 不會叫 */
.ZKBD h1 { font-size: 2em; margin: .67em 0; }

/*!ZKBD-OFF-START*/
html { line-height: normal; -webkit-text-size-adjust: 100%; }
body { margin: 0; }
/*!ZKBD-OFF-END*/
```

build 時 `.ZKBD ` → `<c:if …>${".z-page "}</c:if>`,`/*!ZKBD-OFF-*/` → `<c:if>` / `</c:if>`。

* **輸出**:一個 `norm.css.dsp`,內容與今天**同形**;WCS 一個檔、一個 request,**零變更**。
* **閘門**:維持 **G-zero**(不需要 computed-style A/B,因為 runtime 行為沒動)。
* **相容性**:不需要任何瀏覽器支援聲明。
* **代價**:`build-css.js` 多一個遮罩/還原步驟(約 30 行)。
  這**正是** `HOSTILE_CONSTRUCTS` 守衛裡已經寫好的那句處方 ——
  *"substitute the tags for placeholders before minifying and restore them afterwards"*。
* **副作用(正面)**:`tablet.css` 目前是 level-0 量測中**唯一**還會差的檔,原因就是 DSP tag;
  同一個遮罩順手把 P7 的這個坑一起填掉。

### 【B】兩份 `norm.css.dsp`,由 ThemeProvider 換名 —— 仍然一個 request

build 產出 `norm.css.dsp` 與 `norm-embed.css.dsp`;主題自備 ThemeProvider,覆寫
`beforeWidgetCSS`,在 `browserDefault` 為真時把 `~./zul/css/norm.css.dsp` 改寫成
`~./iceblue_css/zul/css/norm-embed.css.dsp`。

* **這是 Marble 的變體,但不多一個 request** —— 因為換的是聚合槽位裡的**名字**,不是往外掛檔案。
* **好處**:輸出的 CSS **完全沒有 DSP**(未來若要拿掉 DSP 層,這條路已經走完一半)。
* **代價**:主題目前**沒有** ThemeProvider(只有 `IceblueCssThemeWebAppInit` 與 `Version`),
  要新增一支 + `config.xml` 註冊;`norm` 的內容出兩份(磁碟 +72 KB,無所謂);
  閘門從 G-zero 變 **G-delta**,要做 `browserDefault` 開/關兩種設定的 computed-style A/B;
  若 embed 那份用 `@scope`,還要吃下 §4 的瀏覽器支援問題。

### 【C】Marble 原樣:`getThemeURIs` 掛獨立檔案

* **代價**:**+1 HTTP request**,且 reset 離開 WCS 聚合(不再與其餘 CSS 共用那份快取一年的回應)。
* **本分支沒有理由付這個代價** —— 那是「不能用 DSP」的解法,而本分支能用 DSP。

### 【D】只做拆-1,`browserDefault` 這一題整個延後

P5 的職責是**把 LESS 拿掉**,不是**重新設計 reset 的 runtime 契約**。
「改 `@scope`」是後者,它把 P5 從 G-zero 拉成 G-delta,並額外背上瀏覽器支援風險。
D = 先用 A 的遮罩把 `norm.less` 機械式轉成 CSS,`browserDefault` 的形狀維持不動,
要不要改 `@scope` 另開一個決策項。

---

## 4. 一個沒被寫進計畫的相依:`@scope` 其實卡在 L-2

`@scope` 需要 Chrome/Edge 118+、Safari 17.4+、Firefox 128+ —— 這個門檻比 P4 要處理的
vendor prefix 還高。而 **L-2(瀏覽器支援聲明)目前仍未拍板**,M3 就是被它擋住的
(計畫書 line 64:`**BLOCKED** —— 等 L-2`)。

計畫書 §P5〈前置〉現在寫「**兩項都已解除,P5 可開工**」,但那兩項指的是視覺 A/B harness 與
S16;**`@scope` 這一句對 L-2 的相依沒有被列出來**。

> 也就是說:**選 A 或 D,P5 真的可以開工;選 B(用 `@scope` 那個變體)或原計畫的 `@scope`,
> P5 其實還卡在 L-2。** 這個相依要嘛補進 §P5〈前置〉,要嘛用「不選 `@scope`」讓它消失。

---

## 5. 實測:遮罩法在真檔上是否成立

探針拿 **`baseline/zul/css/norm.css.dsp` 本尊**做 mask → `build-css.js` 自己的 minify 路徑 → unmask
的往返,不是合成樣本。

| 量測 | 結果 |
|---|---|
| 遮罩後殘留的 DSP tag 起始 | **0**(90 + 3 對全部涵蓋,沒有漏網形狀) |
| minifier errors / warnings | **0 / 0** |
| 往返後 DSP tag 起始數 | **186**,與 baseline 相同 —— 沒有掉、沒有多 |
| 往返後是否出現 `${}` 腐化 | **否** |
| 規則區塊數(以 `}` 切) | baseline **357**,往返後 **357** |
| 逐區塊比對 | **9 / 357 有差** |
| **對照組:不遮罩直接 minify** | 產出 `${}` —— EL 字串被搬出運算式外,**errors 0、warnings 0**(靜默腐化,與 `build-css.js` 檔頭記載一致) |

那 9 個差異**全部與 DSP 無關**,是「拿已壓過的檔再壓一次」的值內空白慣例差:

```
font-family:"Helvetica Neue", Helvetica, Arial   →  "Helvetica Neue",Helvetica,Arial
font-family:monospace, monospace                 →  monospace,monospace
font-family:ZK85Icons, FontAwesome               →  ZK85Icons,FontAwesome
background-image: url(${c:encodeThemeURL(…)})    →  background-image:url(…)
```

真正的 P5 管線壓的是**未壓縮**來源,不會遇到這一類;這 9 筆是探針方法本身的產物,
**不是遮罩法的缺陷**。判準:遮罩要證明的是「DSP 不會被動到」,而 186 / 186、`${}` 不出現、
357 / 357 已經把那件事量到了。

> 探針已刪除(用完即丟,不進版)。要重跑:mask `<c:if …>${".z-page "}</c:if>` → `.ZKBD `、
> `<c:if test="${empty …}">` / `</c:if>` → `/*!ZKBD-OFF-START*/` / `/*!ZKBD-OFF-END*/`,
> 套 `build-css.js` 的 `stripComments` + CleanCSS level 0 + `tidyMediaPreludes`,再還原。

---

## 6. 建議

**採 A(必要時等同 D),不採 C。**

理由三句:

1. **單一 WCS 不是要爭取回來的東西,是現在就有的東西。** 唯一會弄丟它的是 C;A、B、D 都保得住。
2. **本分支保留 DSP(§B1),所以檔內就有伺服器端開關可用** —— Marble 拆檔是因為它沒有這個開關,
   照抄它的結論等於為一個本分支不存在的限制付代價。
3. **`@scope` 不會讓 DSP 消失**(§2.2 的 3 對整塊條件式),卻會讓 P5 從 G-zero 變 G-delta,
   再加上一個未拍板的 L-2 相依。**用一個換不到目的的代價去換 G-zero,划不來。**

B 是有價值的,但它的價值屬於「未來要不要拿掉 DSP 層」那個問題,不屬於「要不要拿掉 LESS」。
**建議留成一個獨立決策項,不要塞進 P5。**

---

## 7. 需要拍板的

| # | 問題 | 選項 | 若選它,P5 要跟著改什麼 |
|---|---|---|---|
| 1 | P5 的 `browserDefault` 走哪條 | **A / B / C / D** | A、D:§P5〈目標〉刪掉「改成 `@scope`」,閘門由 G-delta 回到 **G-zero**,〈驗收〉的 computed-style A/B 可省 |
| 2 | 若不選 `@scope`,`@scope` 的 `HOSTILE_CONSTRUCTS` 守衛要留嗎 | 留(建議) | 不改 —— 守衛的成本是零,而它擋的是未來某天有人引入時的靜默清空 |
| 3 | §P5〈前置〉要不要補上 L-2 | 補 / 靠選 A 使其消失 | 選 A 則 §4 的相依自然不存在,只需在 §P5 註明「不採 `@scope`,故不依賴 L-2」 |
