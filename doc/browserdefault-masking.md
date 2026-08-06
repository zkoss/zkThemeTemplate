# `browserDefault` 在純 CSS 底下怎麼活下來

> 對象:`org.zkoss.zul.theme.browserDefault`(zk.xml 的 `<library-property>`,預設 `false`,since 3.6.0)。
> 決定於 2026-08-06,P5 落地。評估過程與被否決的選項見
> [tasks/p5-browserdefault-options.md](../tasks/p5-browserdefault-options.md)。

## 1. 這個屬性做什麼

| 設定 | 語意 | 對 CSS 的要求 |
|---|---|---|
| 未設(預設) | 由主題覆蓋瀏覽器預設值 | `html` / `body` / `main` 的 normalize 規則**要在**;其餘規則不加前綴 |
| 有設 | 保留瀏覽器預設值(JS-Embed 到別人的頁面時用) | `html` / `body` / `main` 的規則**必須不存在**;其餘規則限制在 `.z-page ` 子樹內 |

輸出端只有兩種形狀,數量實測自 `baseline/zul/css/norm.css.dsp`:

| 形狀 | 數量 | 位置 |
|---|---|---|
| selector 前綴 `<c:if …>${".z-page "}</c:if>` | **90** | `base/_reset.css` 56 + `norm.css` 34 |
| 整塊 `<c:if test="${empty …}">` … `</c:if>` | **3 對** | `base/_reset.css` 1 + `norm.css` 2 |

## 2. 為什麼不是 `@scope`

計畫書 §P5 原本寫「`browserDefault` 從 descendant selector 改成 `@scope`」。實際只做得到一半:

* `@scope (.z-page) { … }` 可以取代那 **90** 個前綴。
* **取代不了那 3 對整塊條件式** —— `html` / `body` 在 embed 模式下不能被 scope 到 `.z-page`,
  它們必須**不存在**,而 CSS 沒有「不存在」這個運算子。**只有伺服器端條件式能刪掉一條規則。**

所以 `@scope` 不會讓 DSP 消失,卻會:把 P5 的閘門從 **G-zero** 拉成 **G-delta**、要求
`browserDefault` 開/關兩組 computed-style A/B、並且吃下一個尚未拍板的相依(**L-2 瀏覽器支援聲明**;
`@scope` 需要 Chrome/Edge 118+、Safari 17.4+、Firefox 128+)。**用換不到目的的代價去換,不划算。**

`build-css.js` 的 `HOSTILE_CONSTRUCTS` 仍然保留 `@scope` 這一條守衛 —— 成本為零,而它擋的是
CleanCSS 5.3.3 把 `@scope` 整份**清空**、且只在 `warnings` 報告的靜默腐化。

## 3. 實際做法:來源寫佔位符,build 時還原

`.css.dsp` 是**模板**不是 CSS(計畫書 §B1),DSP 那條 runtime lane 本分支一個 byte 都不動。
真正的障礙不是 DSP,是**壓縮器**:CleanCSS 會把 `${".z-page "}` 靜默改寫成 `${}".z-page "`
—— 把字串搬出 EL 運算式外,而且 **errors 0、warnings 0**。

所以來源檔全程是**合法 CSS**,DSP 只在壓縮之後才出現:

| 來源寫什麼 | 輸出變成什麼 |
|---|---|
| `.ZKBD h1 { … }` | `<c:if test="${not empty c:property('org.zkoss.zul.theme.browserDefault')}">${".z-page "}</c:if>h1{…}` |
| `/*!ZKBD-OFF-START*/` | `<c:if test="${empty c:property('org.zkoss.zul.theme.browserDefault')}">` |
| `/*!ZKBD-OFF-END*/` | `</c:if>` |
| `/*!ZK-TAGLIB-HEADER*/` | 三行 taglib directive(合成一行,無分隔) |

對應表在 `scripts/build-css.js` 的 `PLACEHOLDERS`,是唯一知道 DSP 拼法的地方。

幾個要點:

* **`.ZKBD ` 的尾隨空格是佔位符的一部分** —— `${".z-page "}` 自帶分隔空格,所以
  `.ZKBD h1` 還原後是 `…</c:if>h1`,不是 `…</c:if> h1`。
* **遮罩方向有順序**:前綴標籤本身以 `</c:if>` 結尾,所以轉換時必須先換前綴、再換整塊的收尾標籤。
  還原方向沒有這個問題(三個佔位符互不重疊)。
* **守衛沒有被放寬,反而更嚴** —— 來源檔裡出現真的 DSP 標籤依舊 hard-fail;
  `assertMinifierSafe()` 現在跑在**去註解後**的文字上,也就是壓縮器真正會看到的東西。
* `/*!` 開頭的註解會通過 `stripComments()` 與 CleanCSS level 0,**位置也會保留** ——
  taglib header 落在 tokens/reset 接縫(byte 43785)靠的就是這件事。

## 4. 這個做法保住了什麼

* **一個輸出檔、一個 request。** `zk.wcs` 是 **ZK core** 的檔案,主題**無法**往 WCS 聚合裡加檔案
  (`beforeWidgetCSS` 能改寫、能跳過,**不能新增**;能新增的只有 `getThemeURIs`,而那會掛在聚合
  **外面**,多一個 `<link>`)。所以「把 reset 拆成獨立檔案載入」是唯一會弄丟單一 WCS 的選項。
* **閘門維持 G-zero** —— runtime 行為沒有任何改變,不需要 computed-style A/B。
* **不需要瀏覽器支援聲明** —— 不依賴 L-2。

## 5. 沿用的既有限制(不是本次引入的)

open float(popup、dropdown 等)會被移到 `document.body`,**落在 `.z-page` 之外**。
`browserDefault` 開啟時,那些節點拿不到 `.z-page ` 前綴的規則。

這**不是回歸** —— 現行 descendant-selector 做法有完全相同的限制,`@scope` 也一樣(scope root 之外
就是之外)。Marble 已記載同一件事(`Marble 的 doc/spec/reset-scoping.md`)。寫在這裡是為了不再被重新發現一次。

## 6. 還沒收的

`zkmax/css/tablet.css.dsp` 有 **14** 個同形狀的 selector 前綴(**沒有**整塊形狀),仍是 LESS,
歸 **P7**。轉換時直接沿用同一組佔位符即可 —— 它目前是 level-0 量測中唯一還會差的檔,原因就是
DSP tag;遮罩一併把這個坑填掉。
