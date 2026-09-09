# 完全棄用 LESS,改用純現代 CSS —— 可行性評估

**日期**:2026-07-28
**問題**:能不能完全拿掉 `zkless-engine` / LESS,IceBlue(master)改成像 Marble 一樣的純 CSS?在「保持原有語意」的前提下。
**使用者假設**:根據 Marble 的專案經驗應該可行;唯一有問題的點是 `org.zkoss.zul.theme.browserDefault`。
**方法**:全部數據來自對 `master` 分支的實測(`git grep` 普查 + `clean-css` 實跑),不是推估。重現指令見附錄。

相關文件:[phase0-zkless-engine-spike.md](phase0-zkless-engine-spike.md)(LESS 3 靜默改壞的實測)、[iceblue-utility-port-and-token-naming.md](iceblue-utility-port-and-token-naming.md)(Utility/token 回移與命名對齊)。

---

## 結論摘要

**技術上可行,而且結論比「可行」更強:LESS 在 master 已經幾乎不做事了。**

決定性的一個數字:`_zkvariables.less` 有 **844 條 LESS 變數宣告,其中 838 條(99.3%)已經只是 `var(--zk-*)` 的直通轉發**。

```less
@colorPrimary:        var(--zk-color-primary);
@baseBorderRadius:    var(--zk-base-border-radius);
@hoverBackgroundColor: var(--zk-hover-background-color);
```

真正的值全部住在 `profiles/_default.less` 的 **842 個 `--zk-*` 自訂屬性**裡。也就是說,變數層早在 ZK 10.3.0 就已經是純 CSS 了,LESS 只是多墊了一層沒有作用的間接層。剩下 6 條非直通的變數,2 條是編譯期 profile/palette 選擇,4 條是餵給 DSP EL 的圖片路徑字串。

同時,三個最常被擔心的理論障礙**實測全部為零**:

| 理論障礙 | master 實際用量 |
|---|---|
| `@media` 條件式內用 LESS 變數(自訂屬性到不了的地方) | **0** |
| 顏色函式 `darken/lighten/fade/mix/spin/saturate` | **0**(已改用 `hsl(from …)` 相對顏色) |
| `:extend` / `@plugin` | **0** |

**但使用者的假設要修正一處:`browserDefault` 不是唯一的問題,是最難的那一個。**共有 5 個項目需要處理,其中只有 1 個是設計題:

| # | 項目 | 性質 | Marble 是否已有解 |
|---|---|---|---|
| 1 | `@{browserDefaultPrefix}`(91 處) | **設計題** —— 選擇器位置放 DSP tag,CSS 結構上不可能 | ✅ 已實作並文件化 |
| 2 | `each()` 迴圈 + 遞迴 mixin(8 處,Font Awesome 生成) | 需要 build-time 產生器 | ✅ 已有(Lucide 產生器) |
| 3 | 編譯期 `@themeProfile` / `@themePalette` | **改變已文件化的對外客製 API** | ✅ 已有(runtime density) |
| 4 | `@import`(148 處)+ 出貨的 `zkless-engine` CLI | **換掉客戶的建置流程** | ✅ 已有(`build-css.js`) |
| 5 | **Theme Pack 23 個付費主題以 `palettes/*.less` 出貨** | **產品/發布格式問題,不是技術問題** | ❌ 未涉及 |

**最大的成本不在技術,而在第 3、4、5 項 —— 它們都是對外承諾。**第 5 項(Theme Pack)使用者沒有提到,而它是這個決策裡唯一牽動付費產品發布格式的一項。

另外一個必須說清楚的發現:**純 CSS 路線並沒有消滅風險,只是把風險從 LESS 換到 minifier。**實測 CleanCSS 5.3.3 會摧毀 `@scope` 與裸 `@layer` 語句(其中兩種情形輸出全空)。Marble 兩者都已正確規避,但這證實 Phase 0 的教訓在這條路上同樣成立:**「編得過」不等於「輸出等價」。**

---

## 1. 實測:master 到底用 LESS 做什麼

153 個 `.less` 檔(77 個編譯入口 + 76 個 `_` partial)。逐項普查:

| LESS 能力 | master 用量 | 純 CSS 對策 | 難度 |
|---|---|---|---|
| 變數 `@x` | 844 條,**838 條已是 `var(--zk-*)` 直通** | 直接刪掉這一層 | **無** —— 它本來就是純 CSS |
| 顏色函式(darken/lighten/fade/mix/spin/saturate/desaturate) | **0** | 已用 `hsl(from var(--zk-color-primary) h s calc(l + 25))` | **無** |
| `@media` 內用 LESS 變數 | **0** | — | **無** —— 最大的理論障礙不存在 |
| `:extend()` | **0** | — | 無 |
| `@plugin` | **0** | — | 無 |
| `@arguments` | **0** | — | 無 |
| 內嵌 JS `` ~`…` `` | 5 處,全在 `_zkmixins.less` | **呼叫點 0 → 死碼,直接刪** | **無** |
| gradient mixin 家族(`.gradient()` / `.horGradient()` / `.verGradient()` / `.base64DataUriBackground()` / `.resetGradient()` / `.encodeURL-verGradient()`) | 6 個定義 | **呼叫點全部 0 → 死碼,直接刪** | **無** |
| vendor-prefix mixin(`.borderRadius` 103、`.boxShadow` 46、`.transform` 42、`.applyCSS3` 30、四角 borderRadius 24、`.opacity` 23、`.boxOrientHor(Flex)` 8、`.userSelectNone` 4) | ~280 呼叫點 | 展開成 1 條標準宣告 | **機械式**,且輸出大幅縮小(見 §2) |
| 純排版 mixin(`.size` 185、`.fontStyle` 48、`.iconFontStyle` 28、`.displaySize` 25、`.baseIconFont` 15) | ~301 呼叫點 | 就地展開,或改成 utility class | 機械式 |
| 字串插值 `@{}` | **1403 處** | 見下方拆解 | 依類型不同 |
| └ `@{zprefix}` | 740 | 常數,只在 2 個 vendored `tbeditor.less`(trumbowyg)裡 → 寫死 `z-tbeditor` | **sed** |
| └ `@{fa-css-prefix}` | 461 | 常數 `fa` → 寫死 | **sed** |
| └ `@{browserDefaultPrefix}` | **91** | **需要換機制**,見 §3 | **中** |
| └ mixin 參數插值(`@{url}` / `@{start}` / `@{value}` / `@{key}` / `@{svg*}` …) | ~111 | 隨 mixin 一起展開/刪除 | 機械式 |
| `.encodeThemeURL()` 25 + `.encodeURL()` 5 | 30 處 | **直接寫 DSP EL 字面值** | **已實測通過**(見下) |
| `each()` 迴圈 | 6 處 | build-time 產生器 | 小,但要決策(§4.2) |
| 遞迴 mixin(`.gen_fa6_style` / `.sizes-literal`) | 2 處 | build-time 產生器 | 小 |
| 編譯期 `@themeProfile` / `@themePalette` | 2 + 1 處 | runtime override sheet | 小,**但改變對外 API**(§4.1) |
| `@import` | 148 處 | 專案自有 bundler | 小,**但換掉出貨工具**(§4.3) |

### 1.1 死碼比想像的多

`_zkmixins.less` 是這次普查最意外的部分。整個 gradient/IE9 SVG 家族 —— 包含 5 段內嵌 JavaScript base64 編碼器 —— **呼叫點全部為 0**。它們是 IE8/IE9 時代的遺留物。

這有兩個直接影響:

1. 「棄用 LESS」在這一塊不是「移植」,是「刪除」。工作量比看起來小。
2. **對 Phase 0 的 `less ^4.x` 升版是好消息**:LESS 3.0 起 `javascriptEnabled` 預設為 `false`,那些 `` ~`…` `` 若真的被呼叫,升版路上會炸。因為呼叫點是 0,升版沒有這個風險。

### 1.2 DSP EL 直接寫進 `.css` —— 已實測

master 用 `.encodeThemeURL()` mixin 產生 DSP EL,是因為 LESS 的插值語法是 `@{}`,看到 `${` 會直接失敗(Phase 0 已證實)。**拿掉 LESS 就不需要這個 mixin,直接寫字面值即可。**

實跑 Marble 的 `clean-css`(`level: 1, rebase: false`,即 `build-css.js` 用的設定),三種形狀 **byte-exact 原樣通過**:

```
IN : .z-progressmeter-image{background-image:url(${c:encodeThemeURL("~./zul/img/misc/prgmeter.png")})}
OUT: .z-progressmeter-image{background-image:url(${c:encodeThemeURL("~./zul/img/misc/prgmeter.png")})}

IN : .a{background:url(${c:encodeThemeURL("~./zul/img/misc/prgmeter.png")}) repeat-x left top}
OUT: .a{background:url(${c:encodeThemeURL("~./zul/img/misc/prgmeter.png")}) repeat-x left top}

IN : @font-face{font-family:Inter;src:url(${c:encodeURL("~./marble/font/inter.woff2")}) format("woff2")}
OUT: @font-face{font-family:Inter;src:url(${c:encodeURL("~./marble/font/inter.woff2")}) format("woff2")}
```

嚴格說 `url()` 內含 `(` 和 `"` 不是合法的 unquoted url-token,但 CSS tokenizer 與 CleanCSS 都容得下,Marble 的 `_fonts.css` 已在生產路徑上跑了兩處。30 個 `encodeThemeURL` 站點是同一種形狀 → **低風險,不需要任何 escape 機制**。

這是純 CSS 路線相對於「LESS + 手動 escape」的一個乾淨勝利:Phase 0 需要 `~'…'` 包起來,純 CSS 什麼都不用做。

---

## 2. 「保持原有語意」—— 四個真實的語意差異

使用者的前提是「保持原有語意」。技術上可以,但有四處必須**明確決策**,不能默默處理:

### 2.1 Vendor prefix 政策(最大的一項)

vendor-prefix mixin 每次呼叫展開 5 條宣告(`-webkit-` / `-moz-` / `-o-` / `-ms-` / 標準)。以呼叫點計:

| mixin | 呼叫點 | 展開宣告 | 其中已無用 |
|---|---|---|---|
| `.borderRadius()` | 103 | 515 | 412 |
| `.boxShadow()` | 46 | 230 | 184 |
| `.transform()` | 42 | 210 | 168 |
| `.applyCSS3()` | 30 | 150 | 120 |
| 四角 borderRadius | 24 | 120 | 96 |
| **合計** | **245** | **1225** | **≈ 980** |

另外 `.less` 原始碼裡還手寫了 149 條 vendor-prefixed 宣告,以及 1 處 `progid:DXImageTransform` IE filter。

**約 980 條宣告是對現代瀏覽器完全無作用的死重量。**移除它們在現代瀏覽器上「語意完全相同」,但**輸出不同**。這是政策題:Marble 明文「modern browsers only」,IceBlue 目前的行為隱含更寬的支援範圍。要嘛正式縮小 IceBlue 的瀏覽器支援聲明,要嘛保留這些前綴(那就得手寫,而失去 mixin 的意義)。

**建議**:跟著 ZK 11 的瀏覽器支援聲明一起決定,並在 migration guide 明列。這是「語意保持」唯一真正有爭議的地方。

### 2.2 Minifier 換人 → 輸出必然不同

現在:`zklessc --compress`(LESS 內建壓縮)。之後:CleanCSS `level: 1`。兩者輸出不會逐字元相同(數值正規化、空白、簡寫合併)。Phase 0 已量到同類差異(`0.90`→`0.9`、`rgba(0,0,0,0.20)`→`rgba(0, 0, 0, 0.2)`)。

**建議**:沿用 Phase 0 的「來源↔輸出逐條 declaration diff」當驗收閘門,而不是比對檔案 bytes。

### 2.3 `.z-` 全域 `box-sizing` 規則

master `norm.less` 有:

```css
[class^="z-"], [class*=" z-"], … { box-sizing: border-box; }
```

Marble 用的是 `*, *::before, *::after { box-sizing: border-box }`(`_reset.css:15`)。兩者作用範圍不同 —— 這是 utility 回移案(`iceblue-utility-port-and-token-naming.md` A2/A6)已記錄的既有風險,與棄用 LESS 無關,但兩件事會在同一批改動裡碰頭,必須一起處理,不要各自假設。

### 2.4 LESS 變數覆寫的連動行為會消失

master `readme.md` 明文:

> CSS variables will not take effect if you override the corresponding LESS variables. For example, overriding `@colorPrimary` will cause the CSS variable `--zk-color-primary` to be overridden as well.

也就是說今天客戶覆寫 `@colorPrimary`,**會連帶改寫 `--zk-color-primary` 的預設值**。這正是那 838 條直通轉發的用途。棄用 LESS 之後這個連動不存在了 —— 但**取代它的東西更簡單**:客戶直接覆寫 `--zk-color-primary`,而那正是官方 `css_variables.md`(since 10.3.0)已經在推的路徑。

換句話說:**master 目前有兩套客製 API(LESS 變數 / CSS 變數),棄用 LESS 是把兩套收斂成一套。**這是這個決策最強的正面論據,值得在 migration guide 當賣點寫,而不是當 breaking change 道歉。

---

## 3. `browserDefault` —— 唯一真正的設計題

### 3.1 為什麼它特別難

master 的做法(`zul/less/_reset.less:7-8`):

```less
@browserDefault: "'org.zkoss.zul.theme.browserDefault'";
@browserDefaultPrefix: e('<c:if test="${not empty c:property(@{browserDefault})}">${".z-page "}</c:if>');

@{browserDefaultPrefix}h1 { font-size: 2em; margin: 0.67em 0; }
```

這是把一個 **JSP/DSP tag 放進選擇器位置**,讓 DSP 在 request time 決定要不要吐出 `.z-page ` 前綴。CSS 有兩層做不到:

1. 選擇器不能有條件式。
2. **連「把原文寫在 `.css` 檔裡」都不行。** `<c:if test="…">.z-page </c:if>h1 { }` 對 CSS parser 是**結構性壞掉** —— 這跟 `url()` 裡的 `${}` 完全不同(那個 parser 容得下,§1.2 已實測)。`<` 在選擇器位置沒有任何合法解讀。

而且不只選擇器。`_reset.less:16` 和 36 行用 `e('<c:if test="${empty …}">')` / `e('</c:if>')` **包住整個 rule block**(`html` / `body` / `main` 三條規則),同樣無法以合法 CSS 表達。

同一模式另外出現在 tablet 的兩個 `_norm.less`(compact/default profile),共 91 個插值站點。

### 3.2 解法:Marble 已實作並文件化

Marble 的作法(`doc/spec/reset-scoping.md`,`scripts/build-css.js:587-604`):**build 期從單一來源產出兩份,Java 端依 library property 選一份。**

```
單一來源: zul/css/base/_reset.css
   ├─→ zul/css/reset.css        全域版,選擇器不加前綴,page-frame 規則保留
   └─→ zul/css/reset-embed.css  host-safe 版,去掉 page-frame 規則後包 @scope (.z-page){…}

MarbleThemeProvider.getThemeURIs() 讀 org.zkoss.zul.theme.browserDefault 決定給哪一份
```

關鍵設計點:

- **來源只有一份**(`_reset.css`),第二份是 build 期衍生,不是複製維護。
- 兩份輸出都是 **100% 合法 CSS**,零 DSP EL,編輯器/linter/minifier 全部認得。
- 條件判斷從 request-time DSP 移到 **theme-provider 選檔**,語意等價(這個 property 是 application 層設定,不會 per-request 變動,所以不需要 request-time 判斷)。

**已知限制必須原樣繼承並寫進文件**(Marble 文件已記載):浮動元件(open floats)會被 ZK 移到 `document.body`,落在 `.z-page` 之外,因此不受 `@scope` 覆蓋。這是 `@scope` 方案的固有取捨,不是實作瑕疵 —— 但 master 目前的 descendant-selector 前綴做法有**同樣**的限制(`.z-page h1` 也管不到 body 下的 float),所以**不是回歸**。

### 3.3 其他方案(比較後不建議)

| 方案 | 做法 | 為什麼不選 |
|---|---|---|
| B. DSP wrapper 分流 | `.css.dsp` 變成薄殼,用 `<c:choose>` include 兩份純 CSS chunk | 與 A 結構相同,但把分支留在 DSP;需要手寫 wrapper dsp,build 不能全自動產生 |
| C. 無條件 `@scope (.z-page)` | 砍掉 property | 破壞「全域 reset」這個既有用途,是行為回歸 |
| D. 兩份規則都出貨,靠 `html` class 決定 | `:where(html:not(.z-embed)) h1` + `.z-page h1` | 輸出加倍(~4KB),而且要求 ZK core 新增 render 契約 |

**建議 A**,理由是它已經在 Marble 生產路徑上跑過、已有 spec 文件、且來源不重複。

---

## 4. 使用者沒點到的三件事(成本其實在這裡)

### 4.1 `@themeProfile` / `@themePalette` 是已文件化的對外客製 API

`readme.md` 明文教客戶:

```
## switch to compact profile (since 9.5.0)
1. Open src/main/resources/web/zul/less/_zkvariables.less
2. Modify @themeProfile to "compact"
```

這是**編譯期分支**:`@themeProfile: "compact"` 讓 `@import` 換讀 `profiles/_compact.less`。純 CSS 沒有編譯期條件式。

但**不需要**編譯期條件式 —— 因為兩個 profile 只是同一組 842 個 `--zk-*` 的不同數值。純 CSS 形式就是一份 runtime override sheet,也就是 Marble 已經在做的 `data-density="compact"` + `marble-compact.css`(`doc/spec/data-dense-mode.md`)。

**這是升級,不是降級**:從「改 LESS 變數 → 重新 build jar」變成「設一個 attribute」,而且可以**分區**套用(整站 or 單一區塊),編譯期方案做不到。

但它**是** breaking change:客戶現有的 compact 主題 jar 建置流程會失效。必須寫進 migration guide,而且應該和 `iceblue-utility-port-and-token-naming.md` Part C #6(density 機制統一)當成同一個決策,不要分兩次改客戶的流程。

### 4.2 Font Awesome 的迴圈生成 —— 但可能整塊消失

`each()` 6 處 + 遞迴 mixin 2 處,全部服務 Font Awesome:`_icons.less` 用 `each(.fa-icons(), {…})` 從一份 icon 清單生出數百條 `.fa-xxx::before { content: "\fNNN" }`,`_sizing.less` 用 `.sizes-literal()` 遞迴生尺寸階梯,`_shims.less:314` 用 `.gen_fa6_style()` 遞迴生 FA6 相容層。這 3 個檔加起來就是那 461 個 `@{fa-css-prefix}` 插值站點的來源。

純 CSS 不能迴圈 → 需要 build-time 產生器。**Marble 已經有這個形狀的東西**(`getLucideIcons()` 在 build 期產生 icon CSS 塞進 `norm.css.dsp`),所以不是新技術。

但更可能的答案是**這整塊會消失**:Marble 目前把 `font-awesome.css.dsp` 出貨成空 stub、改用自有 Lucide mask;而下一版 ZK 會廢棄 Font Awesome 改用原生 Lucide(見記憶 `project_fa_to_lucide_migration`)。

**建議**:先確認 ZK 11 的 icon 決策,再決定要不要為 FA 寫產生器。**不要假設**它會消失就跳過 —— 這需要一個明確的決策記錄。

### 4.3 `zkless-engine` 是出貨給客戶的工具,不只是內部建置腳本

`zkThemeTemplate` 的存在目的就是讓客戶 fork 來做自訂主題,而 `readme.md` 寫著:

> We assume you're already familiar with **Less**.
> install [zkless-engine](https://github.com/zkoss/zkless-engine). The LESS processor customized for ZK. `npm install`

棄用 LESS 表示:
- `npm run zklessc` 換成什麼?→ Marble 用的是專案自有的 `scripts/build-css.js`(700 行,含 dsp bundling 規則、layer guard、orphan 檢查)。這個腳本目前是 **Marble 專屬**,不是通用工具。
- 若要維持「客戶 fork 主題模板」這個產品,**必須把 `build-css.js` 產品化**(或發一個 `zkcssc` 取代 `zkless-engine`),否則客戶拿到的是一堆沒有 build 工具的 CSS。

**這是這個決策裡被低估最多的一項。**技術不難,但它是一個要維護、要出文件、要版本化的公開工具。

### 4.4 範圍不只一個 repo —— 但是「同步義務」,不是「建置義務」(實測,已修正)

**更正**:先前說「ZK core 自己也編 LESS」是錯的。`zk-parent/pom.xml` 的 `compile-less`
execution **位於 `<pluginManagement>` 內(dormant)**,而且沒有任何模組啟用它 ——
`zul/pom.xml` 完全沒有 `frontend-maven-plugin` 的引用,`src/archive/web` 目錄也不存在。
**ZK core 的 Maven build 不編 LESS。**

但 ZK core **確實攜帶** LESS,而且是**逐位元組相同的複本**:

```
js/zul/wgt/less/button.less     template=d43a6c07834c  zkcore=d43a6c07834c  SAME
zul/less/_reset.less            template=593ffe7c2f9a  zkcore=593ffe7c2f9a  SAME
js/zul/wgt/less/checkbox.less   template=7c8aea135970  zkcore=7c8aea135970  SAME
```

而且是**活的**:`zk/zul/**/less` 最後一次改動是 2026-05-13 的 ZK-6097(為 CE 新增
Avatar/Badge/Chip/Breadcrumb/Carousel…)。66 個 `.less` 檔。

所以真正的狀況是:**兩個 repo 維護逐位元組相同的 LESS 複本,而只有 zkThemeTemplate 這邊編譯它。**
這是同步義務,不是建置義務 —— 對棄用 LESS 是**好消息**(不需要改 ZK core 的 build),但留下一個
必須先回答的問題:**ZK core 為什麼要攜帶不編譯的複本?誰在同步?**

若 Marble 成為 ZK 11 預設主題,zk.jar 的預設主題 CSS 來自 Marble,則 **ZK core 這 66 個
IceBlue `.less` 複本就變成死檔,應該直接從 ZK core 刪除**。這正好支持「在 zkThemeTemplate
實作、不動 ZK repo」的判斷 —— 但那個刪除動作本身仍要在 ZK core 做一次。

- `zkless-engine` 是已發布的 npm 套件(v1.1.13),仍是對客戶出貨的工具(§4.3)。

所以牽動的面:(1) 這個 theme repo、(2) zk core、(3) zkex/zkmax EE 模組、(4) `zkless-engine` npm 套件、(5) 客戶 fork 的建置流程、(6) **Theme Pack**(下一節)。

### 4.5 Theme Pack:23 個付費主題以 `.less` 出貨

`readme.md`:

> ## Switch to a theme of Theme Pack
> The theme pack contains extra **23 themes** …(**Notice**: you need to purchase ZK EE or theme pack to access the theme pack source code.)
> 1. Download Theme Pack source jar …
> 2. Get theme color palette less at `source.jar/palettes/*.less`
> 3. Copy the theme less to `zkThemeTemplate/src/main/resources/web/zul/less/colors`
> 4. prepend `_` at the file name
> 5. Specify `@themePalette: "montana";`

**23 個付費主題的發布格式是 LESS palette 檔,而套用方式是編譯期 `@themePalette` 分支。**棄用 LESS 會讓這個流程整套失效。

好消息是內容層面幾乎無痛 —— palette 檔就是一份變數清單,轉成 `--zk-*` override sheet 是機械轉換,而且結果更好(runtime 可切換,不必重編 jar)。壞消息是這是**產品發布決策**:需要重新發行 23 個主題、決定舊版 jar 的相容期、更新購買者文件。

**這一項不是技術評估能決定的,必須拉產品端進來。**在整個 LESS 棄用案裡,這是唯一一個「技術上 5 分鐘,流程上一個 release cycle」的項目。

---

## 5. 新的風險來源:minifier 取代 LESS

Phase 0 的核心教訓是「LESS 3 會靜默改壞現代 CSS」。純 CSS 路線消滅了那個風險,但**沒有消滅這一類風險** —— 只是換了工具。實測 CleanCSS 5.3.3(Marble `build-css.js` 用的版本與設定):

| 輸入 | 輸出 | 判定 |
|---|---|---|
| `@scope (.z-page){h1{font-size:2em}:scope{color:red}}` | `:scope{color:red}` | ❌ **h1 規則被摧毀** |
| `@layer zk-base{@scope (.z-page){h1{margin:.67em 0}}}` | *(空)* | ❌ **輸出全空** |
| `@layer zk-base,zk-components;.a{color:red}` | *(空)* | ❌ **輸出全空** |
| `url(${c:encodeThemeURL("…")})` 三種形狀 | 原樣 | ✅ byte-exact |

前三項會發出 CleanCSS **warning**,但 `build-css.js` 只檢查 `output.errors`,不檢查 `warnings` → 若這些語法真的流進 minifier,失敗是**靜默的**。

**Marble 目前兩個坑都已正確規避:**

- 裸 `@layer` 語句:`minifyCss()` 先用 regex 抽出、minify 完再前置回去(`build-css.js:33-34`)。這個 workaround 是踩過生產 bug 才加的 —— 註解記載它曾讓 `*{box-sizing:border-box}` 整條消失,導致 window/panel/groupbox header 高度算錯。
- `@scope`:`toEmbedReset()` **先** minify 內層 body,**再**包 `@scope` 包裝(`build-css.js:587-593`),所以 `@scope` 從不進入 minifier。

**兩個建議**:

1. **把 `output.warnings` 也納入檢查**(至少 log 出來)。目前 `@scope` 只是恰好走不到 minifier;回移案會帶進更多現代語法,這個保護遲早要用到。
2. **沿用 Phase 0 的來源↔輸出逐條 declaration diff 當 CI 閘門。**同一個檢查同時擋 LESS 與 minifier 兩類靜默失敗,而這是唯一能擋住「exit 0 但輸出不等價」的手段。

---

## 6. 建議路徑:漸進,不要 big bang

一個關鍵的實作觀察讓漸進成為可能:**`zklessc` 是逐檔編譯的**(`src/index.js:compileFile`,`_` 前綴檔跳過,其餘 1:1 產生 `.css.dsp`)。也就是說 `.less` 之間沒有全域耦合,可以**一個元件一個元件換**。

過渡期唯一需要的新東西:一個**同時吃 `.less` 和 `.css` 兩種來源**的 build。今天 `zklessc` 只吃 `.less`,Marble 的 `build-css.js` 只吃 `.css`。

```
Phase L0  建過渡期 build:掃描來源樹,.less → zklessc,.css → 直通 bundler,
          兩邊輸出到同一個 target/classes/web/<theme>/
          驗收:全 .less 狀態下輸出與現況逐條 declaration 零差異
          ↓
Phase L1  先換「純值」檔:profiles/_default.less + _compact.less + colors/_iceblue.less
          → tokens/*.css(842 個 --zk-* 原樣搬,零轉換)
          同時刪掉 _zkvariables.less 的 838 條直通轉發
          驗收:declaration diff 零差異
          ↓
Phase L2  刪死碼:_zkmixins.less 的 gradient/IE9/內嵌 JS 家族(呼叫點 0)
          驗收:輸出零差異(死碼本來就不產生輸出)
          ↓
Phase L3  vendor-prefix 政策決策 → 展開 245 個 mixin 呼叫點
          驗收:輸出「僅少掉約 980 條已決策移除的 prefixed 宣告」
          ↓
Phase L4  browserDefault:移植 Marble 的 reset.css / reset-embed.css 雙檔機制
          驗收:browserDefault 開/關兩種設定下,JS-Embed host page 與獨立 page 的
                computed style 與現況一致
          ↓
Phase L5  逐元件 .less → .css(77 個入口),每檔一次 declaration diff
          ↓
Phase L6  FA icon 產生器(或確認 FA 整塊移除)+ themeProfile/themePalette
          改成 override sheet + Theme Pack 重新發行
          ↓
Phase L7  build 工具產品化(取代 zkless-engine 對客戶的角色)+ readme/migration guide
```

**這條路徑跟 Utility/token 回移案(`iceblue-utility-port-and-token-naming.md` Phase 1-5)應該合併執行,不是兩個專案。**理由:
- L1 搬的就是那 842 個 token,而回移案 Part B 要做的是它們的**命名對齊**。同一批檔案,搬一次就好。
- L4 的 reset 雙檔機制會碰到 A2 的 `@layer` 導入與 A6 的 `box-sizing` 範圍問題。
- L7 的 migration guide 和 Part C 的 token 改名說明是同一份文件。

**建議把「棄用 LESS」定位成回移案的一個工作流,而不是平行專案。**

### Phase 0(LESS 4 升版)還要不要做?

**要。**兩個理由:

1. 過渡期(L0–L5)會有現代 CSS 語法經過 `zklessc` —— 那正是 LESS 3.13.1 靜默改壞的東西。
   **但這個理由只在「棄用 LESS 與 utility 回移合併執行」的前提下成立**:現代 CSS 是回移案帶進來的,
   IceBlue 自己的 LESS 樹一條都沒用到那 9 種語法(實測 3.13.1 vs 4.8.1 在 77 檔上零差異)。
   若拆成純粹的「只移除 LESS、不引入現代 CSS」分支,升版就從正確性前提降級成過渡期保險 ——
   見 `doc/iceblue-drop-less-execution-plan.md` P1(在 `iceblue` 分支上;worktree:
   [../../zkThemeTemplate-iceblue/doc/iceblue-drop-less-execution-plan.md](../../zkThemeTemplate-iceblue/doc/iceblue-drop-less-execution-plan.md))。
2. ZK core 自己也編 LESS(§4.4),它的退役時程獨立,升版對它獨立有價值。
   **注意**:主題端 `package.json` 的 npm `overrides` **碰不到** ZK core 的 build,所以這個好處
   只有在 upstream 升 `zkless-engine` 自己的依賴時才拿得到 —— 它不是主題端做 Phase 0 的理由。

但它的**定位改變**:從「長期基礎建設」變成「過渡期止血」。這降低了在 `zkless-engine` upstream 改 `package.json` 的必要性 —— 主題端用 npm `overrides` 就夠(Phase 0 spike 即以此驗證)。

---

## 7. 決策清單

| # | 決策 | 建議 | 誰決定 |
|---|---|---|---|
| L-1 | 是否棄用 LESS | **是** —— 838/844 變數已是純 CSS 直通,LESS 是無作用的間接層;且它是 Phase 0 靜默改壞的根源 | 技術 |
| L-2 | vendor prefix 政策 | 跟 ZK 11 瀏覽器支援聲明一起定;移除約 980 條死宣告 | 技術 + 產品 |
| L-3 | `browserDefault` 機制 | 移植 Marble 雙檔 + ThemeProvider 選檔(方案 A) | 技術 |
| L-4 | `@themeProfile` compact 的替代 | 統一到 runtime density(與回移案 Part C #6 同一決策) | 技術 + 文件 |
| L-5 | Font Awesome 產生器 | **先確認 ZK 11 icon 決策**(FA→Lucide),再決定寫不寫 | 技術 |
| L-6 | build 工具產品化 | 需要 —— 否則客戶 fork 主題模板拿不到 build | **產品** |
| L-7 | **Theme Pack 23 主題重新發行** | 內容轉換機械式;發布時程與舊 jar 相容期需產品端定 | **產品** |
| L-8 | 漸進 vs big bang | **漸進**,且與 Utility/token 回移案合併為同一工作流 | 技術 |
| L-9 | CI 閘門 | 來源↔輸出逐條 declaration diff;`build-css.js` 補檢查 `output.warnings` | 技術 |

**L-6 與 L-7 是關鍵路徑上的產品決策,不是技術題。**建議在動任何程式碼之前先把這兩項拉出來確認 —— 技術部分(L-1~L-5、L-8、L-9)在它們確定之後都是可控的機械工作。

---

## 8. 實作環境:在哪裡動手

前提變更(2026-07-29 決策):**Marble 成為 ZK 11 預設主題,IceBlue 降為 add-on 主題**,
讓舊系統可以先升 ZK 11 而不必同時換外觀。因此 IceBlue 的棄用 LESS 工作可以在
zkThemeTemplate repo 內完成,不需要動 ZK core repo(§4.4 已驗證:ZK core 不編譯 LESS)。

### 8.1 先解決一個沒人回答的問題:master 不是 IceBlue,是「模板」

實測:

```
master           placeholders=8   <artifactId>___ARTIFACT_ID___</artifactId>
origin/10.3.0.1  placeholders=8   <artifactId>___ARTIFACT_ID___</artifactId>
mytheme          placeholders=1   <artifactId>mytheme</artifactId>      ← init.sh 的測試產物
```

`master` 帶著 8 個檔案的 `___THEME_NAME___` / `___ARTIFACT_ID___` 佔位符和一支互動式
`init.sh`。它的角色是**客戶 fork 用的主題模板**,內容恰好是 IceBlue 的 `.less`。
**整個 repo 沒有任何一個「已實體化的 IceBlue 專案」分支。**

所以「把 IceBlue 做成 add-on」隱含一個尚未決定的身分問題:

| 選項 | master 的角色 | IceBlue add-on 從哪來 | 評價 |
|---|---|---|---|
| (a) 維持現狀 | 仍是模板 | 新開一個 repo,由 `init.sh` 產生 | 佔位符要一路帶著,棄用 LESS 的改動要在模板上做、再套用到實體專案 —— 雙重維護 |
| (b) **master 實體化為 IceBlue add-on** | 不再是模板 | 就是 master 自己 | 乾淨;但「主題模板」這個產品要有去處 |
| (c) 模板角色移交 Marble | 模板 = Marble(純 CSS) | master 實體化 | **建議** |

**建議 (c)。**理由:若 Marble 是 ZK 11 預設主題,新客戶 fork 模板時**本來就該拿到新架構**
(純 CSS + `@layer` + token API),而不是拿到一份要棄用的 LESS 模板。模板角色一旦移交,
master 就自然騰出來變成 IceBlue add-on 的實體專案,佔位符和 `init.sh` 直接刪掉。

**這件事影響「在哪裡實作」的答案,而且現在決定幾乎免費、事後改要重命名 artifact 與 repo。**
它跟 §7 的 L-6(build 工具產品化)是同一個問題的兩面:模板要出貨,就要附一套 build 工具。

### 8.2 目錄策略:用 `git worktree`,不要切 branch,也不要重新 clone

現況:單一 worktree、branch `new_theme`(Marble)、工作區有未提交檔案。

| 做法 | 判定 |
|---|---|
| 同目錄切 branch | ❌ |
| `git worktree`(同 repo、多目錄) | ✅ **建議** |
| 另外 clone 一份 | ❌ |

**為什麼不要同目錄切 branch** —— 四個具體代價:

1. **`node_modules/` 依賴集完全不同。** master 只需 `zkless-engine`;`new_theme` 需要
   `clean-css` + Playwright 等。每次切換都要重跑 `npm install`,而殘留的舊模組會產生
   非常難追的失敗(「明明裝了卻找不到」)。
2. **`target/` 產物不同。** `target/classes/web/marble/` vs `___THEME_NAME___`。兩者都被
   `.gitignore` 忽略,所以切 branch **不會清掉**,只會混在一起。
3. **這項工作本質上需要同時讀 Marble、寫 IceBlue。** `build-css.js`(~700 行)、`_reset.css`、
   tokens、`reset-embed` 的產生邏輯、`doc/spec/*` —— 單一 checkout 只能靠
   `git show new_theme:<path>` 一個個撈,做不了 diff、grep 不到、也不能直接 copy 檔案。
   這是最實質的理由。
4. **會中斷 Marble 的 preview app / `npm run watch`。** Marble 仍在開發中,切 branch 等於
   每次都要重新啟動整套開發環境。

**為什麼不要另外 clone**:失去共用 object store。worktree 共用同一份 `.git`,兩邊可以直接
`git diff new_theme master -- <path>`、cherry-pick、共用 branch 與 stash;獨立 clone 每次都要
`git fetch` 對方。worktree 給你獨立 clone 的全部好處,沒有它的缺點。

### 8.3 建議的具體設置

```bash
cd /Users/hawk/Documents/workspace/zkThemeTemplate

# 1. 從 master 開一個新 branch,checkout 到平行目錄
git worktree add ../zkThemeTemplate-iceblue -b iceblue-pure-css master

# 2. 在新 worktree 安裝它自己的依賴(獨立 node_modules,與 Marble 互不干擾)
cd ../zkThemeTemplate-iceblue && npm install

# 3. 之後兩邊隨時可以互看/互抓,不需要切 branch
#    (從 iceblue worktree 讀 Marble 的檔案)
git diff master new_theme -- src/main/resources/web/zul/
git show new_theme:scripts/build-css.js > /tmp/marble-build-css.js
```

結果的目錄佈局:

```
workspace/
├── zkThemeTemplate/            branch new_theme  → Marble,維持可跑、不受干擾
└── zkThemeTemplate-iceblue/    branch iceblue-pure-css → 本專案的工作區
```

**兩個注意事項:**

- **preview app port 會衝突。** 兩邊都預設 8080 + live-reload 50000。若要同時跑,先把
  IceBlue worktree 的 preview app 改成 8081 / 50001。若不需要同時跑就不必動。
- **`tasks/` 在 `new_theme` 的 `.gitignore` 裡被整個忽略**(`.gitignore` 最後一行是裸的
  `tasks`),所以本專案的規劃文件目前都是 untracked。worktree 之間**不共用**未追蹤檔案 ——
  規劃文件要在新 worktree 看得到,得自己 copy 過去,或(更好)決定把它們納入版控。

### 8.4 branch 命名

不要叫 `iceblue`(容易和「IceBlue 這個主題」本身混淆)。建議 `iceblue-pure-css` 或
`iceblue-nolass`,做完再依 §8.1 的決策合併回 `master`(選項 b/c)或另開 repo(選項 a)。

**但先回答 §8.1。**若最終選 (a),這個 branch 的改動要能套用到一個尚不存在的實體專案上,
工作方式會完全不同 —— 那是決策問題,不是 git 問題。

---

## 附錄:重現指令

```bash
cd /Users/hawk/Documents/workspace/zkThemeTemplate

# .less 檔數 / 入口 vs partial
git ls-tree -r master --name-only | grep -cE '\.less$'                       # 153
git ls-tree -r master --name-only | grep -E '\.less$' | grep -vcE '/_[^/]+\.less$'  # 77

# 變數層:844 條宣告,838 條是 var(--zk-*) 直通
git show master:src/main/resources/web/zul/less/_zkvariables.less > /tmp/v.less
grep -cE '^\s*@[a-zA-Z][-a-zA-Z0-9]*\s*:' /tmp/v.less                        # 844
grep -cE '^\s*@[a-zA-Z][-a-zA-Z0-9]*\s*:\s*var\(--zk-' /tmp/v.less           # 838
grep -nE '^\s*@[a-zA-Z][-a-zA-Z0-9]*\s*:' /tmp/v.less | grep -vE ':\s*var\(--zk-'   # 那 6 條

# 842 個 --zk-* token 定義
git show master:src/main/resources/web/zul/less/profiles/_default.less | grep -cE '^\s*--zk-[a-z0-9-]+\s*:'

# LESS-only 構造普查(顏色函式 / :extend / @plugin 全為 0)
for p in 'when *\(' '@import' ':extend\(' 'darken\(' 'lighten\(' 'fade\(' 'mix\(' 'spin\(' '@plugin' 'each\(' '~`'; do
  n=$(git grep -E -c -- "$p" master -- '*.less' 2>/dev/null | awk -F: '{s+=$NF} END{print s+0}')
  printf '%-16s %s\n' "$p" "$n"
done

# @media 內是否用 LESS 變數(答案:0)
git grep -c -E '@media[^{]*@[a-zA-Z]' master -- '*.less' | awk -F: '{s+=$NF} END{print s+0}'

# 插值站點分佈
git grep -h -o -E '@\{[a-zA-Z][-a-zA-Z0-9]*\}' master -- '*.less' | sort | uniq -c | sort -rn | head

# mixin 呼叫點(gradient 家族全為 0 = 死碼)
for m in encodeThemeURL encodeURL gradient horGradient verGradient base64DataUriBackground \
         borderRadius boxShadow transform applyCSS3 size fontStyle opacity; do
  n=$(git grep -E -c -- "^[[:space:]]*\.${m}\(" master -- '*.less' 2>/dev/null \
      | grep -v '_zkmixins.less' | awk -F: '{s+=$NF} END{print s+0}')
  printf '%-26s %s\n' ".$m()" "$n"
done

# ZK core 攜帶但不編譯 LESS(compile-less 在 pluginManagement 內,dormant)
python3 -c "
import re; s=open('/Users/hawk/Documents/workspace/ZK10/zk/zk-parent/pom.xml').read()
i=s.find('compile-less'); pm=[m.start() for m in re.finditer(r'<pluginManagement>',s)]
pme=[m.start() for m in re.finditer(r'</pluginManagement>',s)]
print('inside pluginManagement:', any(a<i<b for a,b in zip(pm,pme)))"   # True → dormant
grep -c 'frontend-maven-plugin' /Users/hawk/Documents/workspace/ZK10/zk/zul/pom.xml   # 0
find /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web -name '*.less' | wc -l   # 66

# 但複本逐位元組相同(同步義務)
for f in js/zul/wgt/less/button.less zul/less/_reset.less; do
  a=$(git show master:src/main/resources/web/$f | shasum | cut -c1-12)
  b=$(shasum < /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/$f | cut -c1-12)
  echo "$f  $a  $b"
done

# 所有 branch 都是模板,沒有實體化的 IceBlue 專案
for b in master origin/10.3.0.1; do
  echo "$b placeholders=$(git grep -l '___THEME_NAME___' $b | wc -l)"
done

# CleanCSS 實測(DSP EL 通過 / @scope 與裸 @layer 被摧毀)
node -e "
const C=require('clean-css'); const c=new C({level:1,rebase:false});
for (const s of [
  '.a{background-image:url(\${c:encodeThemeURL(\"~./zul/img/misc/prgmeter.png\")})}',
  '@scope (.z-page){h1{font-size:2em}:scope{color:red}}',
  '@layer zk-base{@scope (.z-page){h1{margin:.67em 0}}}',
  '@layer zk-base,zk-components;.a{color:red}',
]) { const o=c.minify(s); console.log('IN :',s); console.log('OUT:',(o.styles||'(EMPTY)').trim(),'\n'); }
"
```
