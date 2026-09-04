> **本檔語言為 zh-TW**,與 `doc/iceblue-drop-less-*.md`、`tasks/l4-density-mechanism.md` 一致。

# Theme Pack 後繼:palette 機制(評估 + 執行計畫)

> **這是一份獨立計畫,不屬於「IceBlue 棄用 LESS」那一案。**
>
> | | |
> |---|---|
> | **交付物歸屬** | **Theme Pack 後繼產品(付費)** —— **不是**本模板專案(`iceblue11`),**不是** Marble |
> | **本模板專案要為它做的事** | **零**(量出來的,見 [L1](#l1-執行摘要));本計畫**不會動本 worktree 的任何來源檔** |
> | **不進哪個閘門** | 不進 `npm run check:gate`、不算 P4/P5/P7 的 delta、不影響 `輸出檔脫離 LESS` 那個分母 |
> | **出身** | 由棄用 LESS 案的 **L-7** 拍板方向、**M-2** 裁示切出;變更紀錄見該案 [L3-G 的 C19](../doc/iceblue-drop-less-plan-appendix.md#l3-g-change-log--規範層的斷言變更) |
> | **為什麼切出去** | **產品邊界** —— palette 就是付費商品 Theme Pack 的內容,所以它的機制、Java API 與出貨物都不能放在免費的模板專案裡。這同時解除了該案 L3-A 的 **B4**(「23 套付費佈景是產品排程,不是工程排程」),用**切出去**而不是排進來 |
>
> 依 `.claude/skills/plan-spec/SKILL.md` 三層式架構:**L1** 一頁執行摘要 · **L2** 階段拆解 ·
> **L3** 技術附錄。**PA1–PA5 一步都還沒開工。**
>
> **本檔暫時放在這個 worktree 的 `tasks/` 下**,因為它是在這裡被規劃出來的,而 Theme Pack
> 後繼產品還沒有自己的 repo / 分支。**有了之後整份搬過去**,這一段就刪掉。
>
> 參考(都在別的專案,本檔只引註不連結):
> `../zkThemeTemplate/doc/spec/brand-override.md`(Marble 的 seed 衍生配方)·
> `../ZK10/zkcml/zkthemebuilder/`(現行 Theme Pack 的建置器與 27 個 palette 來源檔)

---

## 目錄

- **[L1 執行摘要](#l1-執行摘要)**
- **[L2 階段拆解](#l2-階段拆解)** — [PA1](#pa1-palette-資料層核心) · [PA2](#pa2-靜態選擇library-property--themeprovider) · [PA3](#pa3-java-api--zkmax-閘) · [PA4](#pa4-舊-theme-name-相容) · [PA5](#pa5-收尾與遷移)
- **[L3 技術附錄](#l3-技術附錄)** — [量測](#l31-量測數據與口徑) · [現代 CSS 的分工](#l32-現代-css-語法的分工這是本案的技術核心) · [相容性](#l33-與-zk-theme-切換的相容性評估) · [ZKMax 閘](#l34-zkmax-閘的實作與它證明不了的事) · [風險](#l35-風險) · [未決](#l36-未決事項需要裁示) · [Change Log](#l37-change-log)

---

## L1 執行摘要

### 核心結論

**可行,而且本模板專案不需要為它留下任何東西。** 四個量測決定這個結論:

1. **palette 的全部內容就是 token 覆寫,沒有別的。** ZK 出貨的 27 個 `_css` palette 檔:
   **623 條宣告 / 108 個 `--zk-*` 名稱 / 26 個非空 palette**,**0 個選擇器、0 條規則、0 個 `@media`**。
2. **本模板專案的交付是零。** 主題已出貨 **862** 個可覆寫的 `--zk-*`
   ⇒ 付費側只要**在主題之後載入自己的 sheet** 就成立,不需要主題提供 hook、API 或 DSP 條件。
3. **palette 已經穿透到 tablet 層。** `zkmax/css/tablet.css.dsp` 有
   **95 個 `var(--zk-*)` 引用、0 個 hex 字面值** ⇒ `:root` 覆寫自動到達平板樣式,
   **不需要密度軸(L-4 D4)那種「第二套規則」的工程**。
4. **palette ⟂ density。** 108 個 palette 名稱與密度的 350 條 closure **交集 0**
   ⇒ 兩個旋鈕不需要優先序,可以同時開。

### 方案:一個 palette 一張 sheet,兩個選擇路徑

| 需求 | 作法 | 生效範圍 | FOUC | 需要 reload |
|---|---|---|---|---|
| **靜態預設**(zk.xml) | library-property `org.zkoss.zul.theme.palette` = `<name>` → `ThemeProvider` 只載那一張 sheet,sheet 內的 DSP 條件補上 `:root,` | 全站 | **無** | 不需要 |
| **執行期切換**(Java API) | `ThemePalette.apply(Palette)` → `Clients.loadCSS` 該 sheet + 在 `<html>` 設 `data-palette` | 全站 | 有 | 不需要 |
| **舊版相容** | 沿用 theme name:`org.zkoss.theme.preferred` / cookie / `Themes.setTheme()` | 全站 / 單一 end user | 無 | **需要**(與今天完全相同) |

**每張 sheet 只有一個規則區塊**,形狀是(以 `amber` 為例):

```
<c:if test="${'EE' eq z:getEdition() and 'amber' eq c:property('org.zkoss.zul.theme.palette')}">:root,</c:if>html[data-palette="amber"]{ …22 條字面值… }
```

`html[data-palette]` 的 specificity 是 **(0,1,1)**,`:root` 是 **(0,1,0)** ⇒
**執行期呼叫永遠贏過靜態設定,而且與「哪張 sheet 先載」無關**。
論證見 [L3.2(c)](#c-兩個選擇路徑撞在一起時誰贏--選擇器形狀是被算出來的) —— 這是本案最容易寫錯的地方。

> **不提供區域級 palette。** `apply(Component, Palette)` 已於 2026-08-13 裁示**移除**
> (見 [L3.2(d)](#d-為什麼不提供區域級-palette)),所以 `[data-palette]` 只出現在 `html` 上,
> sheet 裡也**只有一個**選擇器。

**付費邊界有兩層,不要只講一層**:

| 層 | 擋住什麼 |
|---|---|
| **artifact**(主要) | palette 的**值**只在付費 artifact 裡 ⇒ 沒買就沒有 sheet 可載 |
| **ZKMax 閘**(次要,user 要求) | Java 用 `WebApps.getFeature("ee")`、DSP 用 **`z:getEdition()`**,底層同一支 `Classes.existsByThread("org.zkoss.zkmax.Version")`。沒有 zkmax ⇒ 兩條路徑各自 no-op 並留下一行 WARN |

### 現代 CSS 的分工 —— 本案的技術核心主張

> **出貨 palette 的衍生色在「產生器」算;只有客戶自帶的 seed 才在「瀏覽器」算。**

`_amber_css.less` 裡寫著 `--zk-color-primary-dark: #D08700; // darken(@colorPrimary, 20%)` ——
那個註解就是證據:**這些值本來就是機械推導,只是被凍結進 26 個檔案**。

| 路徑 | 誰算衍生色 | 語法 | 瀏覽器風險 |
|---|---|---|---|
| **出貨的 26 個 palette** | 產生器(建置期) | 字面值 | **零** |
| **客戶自帶 brand seed** | 瀏覽器(執行期) | `oklch(from var(--zk-color-primary) …)`,包在 `@supports` 裡 | 有,但只影響選用它的人 |

**理由不是保守,是因為 custom property 沒有 cascade fallback** —— 證明見
[L3.2(b)](#b-為什麼出貨-palette-用字面值客戶-seed-用-oklchfrom--是對的分法)。

### 里程碑

| 階段 | 內容 | 相依 | 狀態 |
|---|---|---|---|
| **PA1** | palette 資料層 —— 產生器 + 26 張 sheet + 4 個 image token | L3.6 第 1、2、3 項拍板 | TODO |
| **PA2** | 靜態選擇 —— library property + `ThemeProvider` + cache key | PA1;L3.6 第 4 項 | TODO |
| **PA3** | Java API —— `ThemePalette.apply(Palette)` + ZKMax 閘 | PA1;L3.6 第 5、6 項 | TODO |
| **PA4** | 舊 theme name 相容(26 個名字繼續可用) | PA2、PA3 | TODO |
| **PA5** | 收尾 —— migration guide + 「對模板專案零依賴」的聲明 | PA1–PA4 | TODO |

### 總體進度

**0 / 5**。本文件本身是 PA1 的前置(**要先拍板 [L3.6](#l36-未決事項需要裁示) 的 6 項**)。
**本案與棄用 LESS 案沒有任何相依**:那邊完不完工都不影響這邊開工,反之亦然。

### 一句話效益

> **每個使用者只下載自己那一張 sheet(8–51 條宣告,約 1–2 KB)**,換掉 **23 個付費 theme jar**
> —— 每一個都是預設主題的近乎逐 byte 複本(實測 `iceblue_c`:**81 個可比檔中 79 個逐 byte 相同**,
> 282.8 KB 裡 97.5% 是複本)。順帶讓 palette 從「換 jar + reload」變成「一個 library property,
> 或一次不用 reload 的 API 呼叫」,而且**第二份出貨物不存在,就不可能再發生版本漂移**。

---

## L2 階段拆解

### PA1 palette 資料層(核心)

| | |
|---|---|
| **目標** | 26 張 sheet,每張一個規則區塊,值與 ZK 出貨的 `_<name>_css.less` 相同 |
| **輸入 → 輸出** | `zkcml/zkthemebuilder/palettes/_*_css.less`(623 條)→ `palette/<name>.css.dsp` × 26 |
| **驗收** | **對 ZK 出貨的 palette theme jar 逐 token 比對**(見下方「oracle」);**不是**跑模板專案的 `check:gate` |
| **前置** | L3.6 第 1、2、3 項拍板 |

**要做的事**

1. **產生器(`gen-palette-css.js` 或併入 zkthemebuilder)** —— 從 `_*_css.less` 抽宣告,
   每個 palette 產一張 `.css.dsp`(含 taglib header,因為區塊前緣有 DSP 條件)。
   可重跑、冪等、自帶斷言、產物標明 GENERATED。**不手抄 623 條。**
2. **選擇器形狀**(最容易寫錯,論證見 [L3.2(c)](#c-兩個選擇路徑撞在一起時誰贏--選擇器形狀是被算出來的)):
   每張 sheet **只有一個**選擇器 `html[data-palette="<name>"]`,前面接 PA2 的 DSP 條件。
   **不要**加裸屬性選擇器 —— 那是區域級才需要的,而區域級已裁示不做。
3. **衍生色由產生器重算,不抄** —— `--zk-color-primary-{dark,light,lighter}` 在 26 個 palette 裡
   有 23–24 份,ZK 的來源檔用註解記著它們是 `darken()/lighten()` 的結果。
   產生器重算並**斷言等於 ZK 出貨的字面值**;對不上就停下來查(那代表某個 palette 被手動微調過,
   **那是要記錄的發現,不是要吸收的誤差**)。
4. **4 個 image 變數** —— `@loadingAnimationDefer`、`@loadingAnimationLoad`、`@sliderTicks`、
   `@progressmeterBackgroundImage` **不是 token**,路徑寫死在主題的 7 個消費點裡
   ⇒ **runtime palette 換不動它們**,而 **13 / 26 個暗色 palette 正是靠換這幾張圖存在的**。
   **這是本案唯一需要模板專案配合的地方**,處置在 [L3.6 第 3 項](#l36-未決事項需要裁示)。
5. **`check:palette` 五項斷言**,任一不成立 exit 1:
   - 26 張 sheet 的名稱集合恰好等於 palette 清單;
   - 每一條的值**逐字等於** `_<name>_css.less`;
   - 沒有任何一條落在主題 862 個 token 之外(**除了已核准的 6 個孤兒**,L3.6 第 2 項);
   - 與密度的 350 條 closure 交集 **0**;
   - 每張 sheet **恰好一個**規則區塊、**恰好一個**選擇器。
6. **負向控制**(三個,做完要證明它們真的 exit 1):刪一條 / 改一個值 / 塞一個未定義 token。

**驗收怎麼證明 —— ZK 出貨的 palette jar 是現成的 oracle**

取一個**暗色**與一個**淺色** palette 各一(建議 `amber` 與 `office`:一個換 text/background、
一個宣告數最多之一),對**同版**的 palette theme jar 比:

- **靜態層**:抽出 palette jar 的 `norm.css.dsp` 第一個 `:root{}`,與我們的區塊逐 token 比對
  ⇒ 名稱集合一致、值逐字相同,**不得有第 N+1 條**。
  **oracle 版本必須與目標 `zk.version` 同代**,否則量到的是版本落差疊在 palette 差異上
  (密度那案的第一版就是踩在這裡)。
- **執行層**:preview 語料在 `data-palette="amber"` 下的 computed style,必須等於同一頁在
  `amber` 主題 jar 下的 computed style。**比 computed style,不比 byte** —— 兩者的 CSS 文字本來就不同。
  跨主題跑同一組頁面的手法模板專案已經有(視覺 A/B harness 的 classpath 組法)。

> ⚠️ **視覺 A/B 的 `pages differing: 0` 不是這一階的通過訊號** —— 這一階本來就要變。
> 它在這裡的正確用法是**反向**的:確認 palette **沒選**時畫面 **0 差異**(證明 sheet 不會外洩)。

---

### PA2 靜態選擇(library property + ThemeProvider)

| | |
|---|---|
| **目標** | 全站 palette 可以只靠 zk.xml 決定,**零 FOUC**,而且**沒有 zkmax 時完全不生效** |
| **輸入 → 輸出** | PA1 的 26 張 sheet → 一個 `PaletteThemeProvider` + 每張 sheet 前緣的 DSP 條件 |
| **驗收** | 四態測試(見下)全部通過;`Aide.injectURI` 的 cache key 實測 |
| **前置** | PA1;L3.6 第 4 項拍板 |

**要做的事**

1. **DSP 條件**(兩個條件都要,`and` 不可省):
   ```
   <c:if test="${'EE' eq z:getEdition() and 'amber' eq c:property('org.zkoss.zul.theme.palette')}">:root,</c:if>
   ```
   **用相等而不是 `not empty`** —— zk.xml 打錯字必須表現得像沒設,不能靜默切換整個 app 的外觀。
2. **`PaletteThemeProvider`** —— 兩件事:
   - `getThemeURIs()` 讀 library property,**只追加被選中的那一張 sheet**
     (javadoc 明文允許 rename / **add** / remove);
   - `Aide.injectURI(uri, theme + "-" + palette)` 把 palette **併進 WCS 的 cache key** ——
     WCS 的 `getWCSCacheControl` 是 **8760 小時**,而 theme name 在 URL 裡、**library property 不在**
     ⇒ 不做這件事,改了 zk.xml 的人可能吃到最多一年的舊 CSS(L3.3(d))。
3. **四態測試**(沿用密度那案 `check-density-property.js` 的形狀):
   | 態 | 期望 |
   |---|---|
   | 未設 | 沒有任何 palette sheet 被載入 |
   | 設 `amber` | 只載 amber 的 sheet,且 `:root,` 前綴**在** |
   | 設無效值 | 與「未設」**逐 byte 相同** |
   | 設 `amber` 但 **CE** | 與「未設」**逐 byte 相同** |
4. **minifier 守衛** —— 若付費側沿用 CleanCSS:**選擇器位置的 DSP tag 會被它靜默改寫成
   `${}"…"`,而且 0 errors 0 warnings**。模板專案已經有現成處方(遮罩佔位符 → minify → 還原,
   `HOSTILE_CONSTRUCTS` 前置守衛)⇒ **照抄,不要重新發現這個坑。**

---

### PA3 Java API + ZKMax 閘

| | |
|---|---|
| **目標** | 讓 end user 在**不 reload、不重建 jar** 的前提下換 palette;沒有 zkmax 時**明確地什麼都不做並留下 log** |
| **輸入 → 輸出** | PA1 的 sheet → 付費 artifact 裡的一個 `ThemePalette` 類別(**不在 `org.zkoss.theme.iceblue11` 底下**) |
| **驗收** | 四項行為實測(見下);**不動任何 CSS** |
| **前置** | PA1;L3.6 第 5、6 項拍板 |

**API 形狀 —— 只有一個方法**

```java
ThemePalette.apply(Palette.AMBER);    // 全站:載入 sheet + 在 <html> 設 data-palette
ThemePalette.apply(Palette.DEFAULT);  // 回到「本 app 設定的」palette —— 不是回到 iceblue,見下
```

**實作兩步,順序不可換**:先 `Clients.loadCSS(<該 palette 的 sheet>)`,再
`Clients.evalJavaScript` 設 `document.documentElement.dataset.palette`。
反過來會有一瞬間屬性已設、sheet 還沒到。

**ZKMax 閘的四項行為必須實測,不是寫在 javadoc 就算**:

| 情境 | 期望 |
|---|---|
| zkmax 在 classpath | sheet 載入、屬性設上、畫面換色 |
| zkmax 不在 | **no-op**,不丟例外,**WARN 一行**(說明缺 zkmax,而不是「palette 不存在」) |
| zkmax 不在 + zk.xml 設了 property | 與完全沒設相同(PA2 第四態已涵蓋 CSS 側) |
| 判斷被快取 | `WebApps.getFeature("ee")` 是 `static final`,**一個 JVM 只算一次** —— 不要自己再包一層 |

> **為什麼是 no-op 而不是丟例外**:這條路徑會被寫在 end user 的偏好設定 UI 裡,
> 少一個 jar 就讓偏好按鈕丟例外,是把授權問題變成當機。
> **但也不能靜默** —— 靜默是這個題目反覆出現的失敗類型,所以 WARN 是必要的。

**三條必須寫進 javadoc 的限制**

1. **`apply()` 走 `Clients.evalJavaScript` / `loadCSS`,在第一次 paint 之後** ⇒
   頁面載入時呼叫會閃。**固定預設請用 PA2 的 library property。**
2. **`Palette.DEFAULT` 的語意是「移除屬性」,不是「回到 iceblue」** ——
   若 zk.xml 靜態設了 `amber`,`DEFAULT` 會回到 **amber**(那是 `:root` 上的值),不是預設外觀。
   要讓它真的回到預設外觀,需要一張**非空的 `iceblue` palette sheet**(ZK 現行那份是 34 B 的空註解)
   ⇒ L3.6 第 5 項。
3. **不支援區域級**(`apply(Component, …)` 不存在)—— 理由見 L3.2(d)。
   **不要因為密度那案有 `apply(Component, Density)` 就照著補一個。**

---

### PA4 舊 theme name 相容

| | |
|---|---|
| **目標** | 今天寫著 `org.zkoss.theme.preferred=deepsea` 的客戶升級之後**不會靜默拿到預設外觀** |
| **輸入 → 輸出** | PA2 的 provider → 26 個 theme name 的 alias 解析 |
| **驗收** | L3.3(b) 表格裡每一列的實測,**特別是那一列紅字** |
| **前置** | PA2、PA3 |

**這一階要回答的是「要不要 BC」,不是「怎麼寫程式」。**

26 個 palette 名今天是**主題名**。主題資源靠 `ServletFns.resolveThemeURL()` 對映到
`web/<themeName>/` 目錄 ⇒ **一個沒有資源目錄的主題名不會報錯,它會拿不到樣式**。
這就是靜默降級,而且**沒有任何錯誤訊息**。

可行的 BC 路徑(全部落在 provider 裡,ZK 的解析流程一個字都不用改):

```
Themes.register("deepsea", …)                   // 名字繼續存在 ⇒ 解析階段完全不變
provider.beforeWidgetCSS()                      // 解析到預設主題的目錄,而不是 deepsea 的
provider.getThemeURIs()                         // 追加 deepsea 的 palette sheet
Aide.injectURI(uri, theme + "-" + palette)      // 進 cache key
```

⇒ 客戶的 zk.xml **一個字都不用改**,cookie 切換也照舊(含 reload,與今天相同)。

---

### PA5 收尾與遷移

| | |
|---|---|
| **目標** | 讓「改 LESS 變數重編 jar」→「載入 override sheet」這個對外 API 變更有文件可循 |
| **輸入 → 輸出** | PA1–PA4 → migration guide + 對模板專案的零依賴聲明 |
| **前置** | PA1–PA4 |

**要收的四筆**

1. **migration guide** —— 舊 `@themePalette` 用法 → 新的兩條路徑;**逃生門**要寫:
   客戶可以把 palette 當普通 CSS 覆寫自己維護(見 L3.4(b) 第 3 點,這件事本來就是免費的)。
2. **「對模板專案零依賴」要寫成一句可驗證的話** ——
   「本產品不需要主題 jar 提供任何 hook;它依賴的唯一契約是**主題的 `--zk-*` 可在 `:root` 被覆寫**」。
   這句話值得寫下來,因為它同時是**版本相容性的邊界** ——
   主題改 token **名稱**才會破,改 token **值**不會破。
3. **模板專案那邊的 `readme.md` / migration guide 會提到 palette** ——
   棄用 LESS 案的 P8 要把 `@themePalette` 那一行換成「載入 override sheet」,
   **內容要與本案的 guide 對得上**。這是兩案之間**唯一的文字介面**。
4. **`doc/migration/less-var-to-token.md` 的 `@themePalette` 那一列現在寫著
   「No CSS mechanism can do this at runtime」** —— 本案推翻它。**那份是產生器的產物**,
   所以要改的是 `gen-var-table.js` 的分類散文,不是手改 md(改了下次重跑就沒了)。

---

## L3 技術附錄

### L3.1 量測數據與口徑

**全部是 2026-08-13 實測,不是估算。**

#### (a) palette 的規模

| 量 | 數字 | 怎麼量的 |
|---|---|---|
| palette 檔數 | **27**(`_*_css.less`) | `ls zkcml/zkthemebuilder/palettes/*_css.less` |
| **非空** palette | **26** | `_iceblue_css.less` = **0 條 / 34 B 純註解**(iceblue 是預設 palette,沒東西要覆蓋) |
| **宣告總條數** | **623** | `grep -hcE '^\s*--zk-' *_css.less` 求和 |
| **distinct token 名稱** | **108** | 同上 `-oE` 後 `sort -u` |
| 單檔最大 / 最小 / 中位 | **51**(`material`) / **8**(`poppy`、`olive`、`marigold`、`lavender`、`aurora`) / **22** | 逐檔 `grep -c` |
| **暗色 palette** | **13 / 26** | 覆寫 `--zk-text-color-default:` 的檔數 |
| 選擇器 / 規則 / `@media` | **0 / 0 / 0**(全部是 `:root{}` 一塊) | 逐檔讀 |
| 「核心 8 個」 token | `--zk-color-primary{,-dark,-light,-lighter}`、`--zk-color-accent`、`--zk-color-accent3`、`--zk-color-background1`、`--zk-text-color-active` —— 各出現在 **23–24 / 26** 個 palette | `uniq -c` 排序 |

#### (b) 「23 個付費佈景」與「26 個 palette」的口徑差(**對外講數量之前要確認**)

`build.palettes.yml` 的 `build_themes` 有 **27** 筆,扣掉 `iceblue`(預設)剩 **26**,
再扣掉 `wcag` / `wcag_purple` / `wcag_navy` 三個無障礙變體正好是 **23** ——
**這是「23」最可能的來源,但未證實**(沒找到把 wcag 三件排除在付費之外的明文)。
本文件一律用 **26 個 palette**(工程口徑)。

#### (c) 與主題 token 的交叉檢查 —— 6 個孤兒

主題定義 **862** 個 token;palette 的 108 個名稱裡,**6 個主題沒有定義**:

| 孤兒 token | 出現在 |
|---|---|
| `--zk-primary2`、`--zk-primary-light2`、`--zk-primary-dark2` | `cheeseandwine`、`material`、`winterspring` |
| `--zk-base-border-color-light`、`--zk-base-border-color-dark`、`--zk-biglistbox-scroll-bar-hover-border-color` | `wcag`、`wcag_navy`、`wcag_purple` |

**兩件事**:①這 6 條**今天就是死的**(沒有消費者)⇒ palette 檔已經漂移過,
正好是「第二份出貨物會落後」的**新證據**;②它們**成群出現**(3 + 3,各集中在同一組 palette)
⇒ 是兩次歷史事件,不是 6 次筆誤。處置在 [L3.6 第 2 項](#l36-未決事項需要裁示)。

#### (d) palette ⟂ density

密度 closure(`tokens/_density-compact.css`)的 **350** 個名稱 ∩ palette 的 **108** 個名稱 = **0**。
⇒ 兩個旋鈕不需要優先序。

#### (e) palette 到達得了 tablet(**本案比密度軸便宜的關鍵量測**)

| 輸出檔 | `var(--zk-*)` 引用 | distinct token | **hex 字面值** |
|---|---|---|---|
| `zkmax/css/tablet.css.dsp` | **95** | **27** | **0** |
| `zul/css/norm.css.dsp` | **654** | — | **0** |

⇒ `:root` 層換 palette **自動穿透平板樣式**,不需要密度軸 D4 那種「第二套規則加屬性前綴」。
**口徑注意**:`grep -c` 對 `.css.dsp` 會回 `1`(壓縮後整檔幾乎是一行),必須用 `grep -o | wc -l`。

#### (f) 4 個 image 變數(runtime palette 的真實缺口)

| LESS 變數 | 幾個 palette 覆寫它 | 目前的值 |
|---|---|---|
| `@loadingAnimationDefer` | **13** | `~./zul/img/misc/progress-32.gif` |
| `@loadingAnimationLoad` | **13** | `~./zul/img/misc/progress-72.gif` |
| `@sliderTicks` | **10** | `~./zul/img/slider/scale-ticks.png` |
| `@progressmeterBackgroundImage` | **3** | `~./zul/img/misc/prgmeter-anim.gif` |

**消費點共 7 處 / 6 個檔**,全部是 `background-image: url(${c:encodeThemeURL("…")})`:
`js/zul/inp/css/slider.css`、`js/zul/wgt/css/progressmeter.css`、`js/zul/sel/css/listbox.css`、
`js/zul/sel/css/tree.css`、`js/zul/grid/css/grid.css`、`zul/css/norm.css`(2 處)。

⇒ **不是 token,所以 runtime palette 換不動**,而 13 個暗色 palette 正是靠換這幾張圖
才不會在深色背景上出現亮色 spinner。**這是本案唯一需要模板專案配合的一項**(L3.6 第 3 項)。

#### (g) 現代 CSS 語法在主題樹的現況(決定哪些要先驗 minifier)

| 語法 | 主題來源檔 | 主題輸出檔 | 結論 |
|---|---|---|---|
| `@supports` | **2** | **2** | **已證明過 CleanCSS 5.3.3**,可以直接用 |
| `oklch` / `color-mix` / `light-dark(` / `color-scheme` / `accent-color` | **0** | **0** | **從未經過這條 minifier**,用之前要先 round-trip |
| `@property` | 0(`_zkmixins.less` 那 4 個命中是 **LESS mixin 參數名**,不是 CSS at-rule) | 0 | 同上,且風險較高 —— `@scope` 與裸 `@layer` 都是被 CleanCSS 清空且**只在 warnings 報** |

---

### L3.2 現代 CSS 語法的分工(這是本案的技術核心)

#### (a) LESS 在 palette 這件事上到底做了什麼

三件,而且只有一件需要新語法:

| LESS 做的事 | 現代 CSS 的對應 | 難度 |
|---|---|---|
| **選檔案**:`@import "colors/_@{themePalette}"` 編譯期插值 | **不需要語法** —— 改成「一個 palette 一張 sheet,載入時選」 | 低 |
| **算衍生色**:`darken(@colorPrimary, 20%)` | `oklch(from var(--zk-color-primary) calc(l - .2) c h)` | **中,而且是唯一真的需要新語法的地方** |
| **換圖檔路徑**:`@sliderTicks` | custom property 可以持有 `url()` ⇒ token 化即可 | 低(見 L3.1(f)) |

#### (b) 為什麼「出貨 palette 用字面值、客戶 seed 用 `oklch(from …)`」是對的分法

**不是保守,是因為 custom property 沒有 cascade fallback。** 一般 CSS 可以寫兩條、讓舊瀏覽器
吃前一條:

```css
color: #D08700;                     /* 舊瀏覽器 */
color: oklch(from … );              /* 新瀏覽器;舊的解析失敗 ⇒ 退回上一條 */
```

**custom property 不吃這一套**:`--x: <任何東西>` 在**解析期**幾乎永遠合法,所以第二條**一定**贏;
失敗發生在**使用點**(`var(--x)` 的 invalid at computed-value time),那時退回的是
**該屬性的 unset / 初始值,不是前一條宣告**。⇒ 對 palette 這種「整組值都是 custom property」的東西,
**兩行 fallback 是無效的**。用 `@property` 加型別也不救 —— 型別不符時退的是 `initial value`,
一樣不是前一條。

**唯一可靠的守法是 `@supports`**,而它在主題樹已經驗過(L3.1(g))。所以分工是:

- **26 個出貨 palette**:值在**產生器**算完 ⇒ 只有字面 hex ⇒ **不需要 `@supports`、
  不需要瀏覽器支援聲明**,而且條數數得出來 ⇒ **斷言管得住**。
  **「單一定義點」的好處一點都沒有少** —— 定義點從「26 個手改檔案」搬到「1 支產生器」。
- **客戶自帶 brand seed**:客戶的顏色**無法預先算**,這才是 `oklch(from …)` 真正無可取代的用途。
  作法沿用 Marble 已驗證過的 brand-override 配方(另一個 worktree:
  `../zkThemeTemplate/doc/spec/brand-override.md`;絕對 tone + `calc(c * k)` 保持色相),
  包在 `@supports` 裡,**且明文寫「這條路徑需要現代瀏覽器」**。

> **客戶 seed 路徑有一個 `:root` 限制要寫下來**:衍生 token 是在**宣告 seed 的那個元素**上
> 被代換完成的。只在某個容器上重新宣告 seed,衍生值仍是從 `:root` 繼承來的**已算好的結果**,
> 不會跟著重算 ⇒ **區域級 seed 覆寫必須連同衍生宣告一起寫**。
> Marble 那份配方講的是 `:root`,這一點在那裡是隱含的。

#### (c) 兩個選擇路徑撞在一起時誰贏 —— 選擇器形狀是被算出來的

假設 zk.xml 設 `palette=deepsea`(靜態,DSP 補上 `:root,`),使用者又呼叫
`apply(Palette.AMBER)`(執行期,載入 amber 的 sheet 並設 `<html data-palette="amber">`)。
若兩張 sheet 都寫成 `:root, [data-palette="X"]`:

| 選擇器 | specificity | 在 `<html data-palette="amber">` 上 |
|---|---|---|
| `:root`(deepsea sheet) | (0,1,0) | **匹配** |
| `[data-palette="amber"]` | (0,1,0) | 匹配 |

**平手 ⇒ 由來源順序決定**,而順序是「哪張 sheet 先被載入」——
靜態那張由 `getThemeURIs` 在**渲染時**加入,執行期那張由 `loadCSS` 在**之後**插入,
所以*這個組合*剛好會贏……**但那是巧合,不是保證**:換成先 `apply()` 再讓另一段程式碼
重新載入靜態 sheet,或未來把靜態 sheet 改成用 `loadCSS` 補,順序就反了,
而且**壞掉的方式是靜默的**。

**解法是不要依賴順序**:選擇器用 `html[data-palette="X"]`(0,1,1),它**贏過任何 `:root`**:

```
<c:if …>:root,</c:if>html[data-palette="amber"]{ … }
```

- 靜態路徑:條件成立 ⇒ `:root, html[data-palette="amber"]` ⇒ 全站生效。
- 執行期路徑:`html[data-palette=amber]`(0,1,1)> deepsea 的 `:root`(0,1,0)⇒ **amber 贏,
  與載入順序無關**。
- `data-palette` 沒設時:`html[data-palette="amber"]` 匹配不到任何東西 ⇒ 只有 `:root` 那半生效。

#### (d) 為什麼不提供區域級 palette

**2026-08-13 裁示移除 `apply(Component, Palette)`。** 三個理由,按重量排序:

1. **產品邊界** —— 本案是付費商品的機制,範圍應該是「整個 app 的外觀」。
   「一塊畫面一個品牌色」是**另一個題目**(多租戶),它需要的不只是 token 覆寫
   (還有 logo、密度、i18n),不該由 palette 這一個旋鈕順帶承擔。
2. **它會把 API 的語意變複雜,而複雜度沒有對應需求** —— 一旦支援區域,就要回答
   「區域內的 body-appended popup(menu、modal、notification)算誰的?」
   答案是**算不到區域的**,因為那些節點會被移到 `document.body`。
   ⇒ 區域級 palette 天生有一個**說不清楚的洞**,而全站級沒有。
3. **省掉的成本是真的** —— sheet 裡少一個選擇器、`check:palette` 少一條斷言、
   javadoc 少一整節、驗收少一組「區域 + popup」的 computed-style 實測。

> **不要從密度那案外推。** 那邊有 `apply(Component, Density)`,因為「一塊資料密集的 grid」
> 是明確且常見的需求;palette 沒有對應的既有需求。
> **兩案的 API 形狀不對稱是有意的,不是漏掉。**

#### (e) 順手可以拿到、但**不在本案範圍**的兩個現代化

1. **`color-scheme: dark`** —— 13 個暗色 palette 今天只換 `--zk-*`,
   原生 scrollbar、`<select>` 下拉、日期輸入的原生 UI **仍然是亮色**。
   一行 `color-scheme: dark` 就修好,而且它**只能**放在 palette 區塊裡(它是 palette 的性質)。
   **是行為變更 ⇒ 需要明文核准**(L3.6 第 6 項)。
2. **把 4 張圖換成 CSS** —— 兩個 spinner GIF 可以用 `currentColor` 的 CSS 動畫、
   `scale-ticks.png` 用 `repeating-linear-gradient`、`prgmeter-anim.gif` 用漸層 + animation。
   做了的話 **L3.1(f) 的整個缺口消失**,並順手解掉主題視覺 A/B harness 的一個已知噪音源
   (動畫 GIF 停不下來)。**但它改變畫面,而且要動模板專案的 CSS ⇒ 獨立分支,不在本案。**

---

### L3.3 與 ZK theme 切換的相容性評估

依 zkdoc `zk_dev_ref/theming_and_styling/switching_themes` 逐條對。

#### (a) 兩條軸,不要混用

| | **軸 A:theme name(既有)** | **軸 B:palette(本案)** |
|---|---|---|
| 決定什麼 | **哪一組 stylesheet** | 疊在其上的**一張 `--zk-*` 覆寫 sheet** |
| 解析順序 | cookie → library property → priority | library property → `data-palette` 屬性(API) |
| 設定點 | `org.zkoss.theme.preferred`、`Themes.setTheme()`、`ThemeResolver` | `org.zkoss.zul.theme.palette`、`ThemePalette.apply()` |
| 生效粒度 | 整站 / 每個 end user(cookie) | 整站 |
| 需要 reload | **需要**(`Executions.sendRedirect("")`) | **不需要** |
| 在 WCS cache key 裡 | **在**(`_zkiju-<theme>`) | **本案自己補進去**(PA2 的 `Aide.injectURI`) |

**結論:兩軸正交,不需要改 ZK 的解析流程。** 本案不動 `ThemeResolver`、不動 `Themes`、
不動 cookie 機制。

#### (b) 逐項相容性判定

| 既有用法 | 本案之後 | 判定 |
|---|---|---|
| `org.zkoss.theme.preferred=<預設主題>` | 不變 | ✅ 無影響 |
| `Themes.setTheme(exec, …)` + cookie | 不變 | ✅ 無影響 |
| 自訂 `ThemeResolver` | 不變(它回傳的是 theme name) | ✅ 無影響 |
| `Themes.register(…priority…)` | 不變 | ✅ 無影響 |
| **`org.zkoss.theme.preferred=deepsea`**(= 今天的 Theme Pack 用法) | `deepsea` 若不再是有資源的主題 ⇒ **拿不到樣式,不是報錯** | 🔴 **靜默降級,PA4 必須處理** |
| `tablet:<主題>`(EE 才註冊,ResponsiveThemeRegistry) | palette 自動穿透(L3.1(e)) | ✅ **比預期好** |
| 密度(`iceblue_c` / `data-density`) | 與 palette 交集 0 | ✅ 正交 |

#### (c) 一個能力落差,要誠實寫進文件

| 需求 | 軸 A(今天) | 軸 B(本案) |
|---|---|---|
| **每個 end user 不同 palette,且重新整理後還在** | ✅ cookie + reload | ⚠️ **要自己接** —— property 是全站的,`apply()` 是單一 desktop 的 |

軸 B 沒有持久化。要「每人一個 palette」有兩條路:
①**沿用軸 A**(cookie + reload,零 FOUC,與今天相同);
②在 `@Init` 讀使用者偏好後呼叫 `apply()` ⇒ **會閃**。
**不要假裝軸 B 全面取代軸 A** —— 它取代的是「為了換色而出貨第二個 jar」,不是「cookie 持久化」。

#### (d) cache 的問題

WCS 的 URL 形狀實測是 `/zkau/web/<stamp>/_zkiju-<theme>/zul/css/zk.wcs`,
而 `getWCSCacheControl` 回 **8760 小時**。theme name **在** key 裡,library property **不在**。
**`<stamp>` 在什麼條件下會轉,沒有量到,不要假設。**
⇒ PA2 用 `Aide.injectURI` 把 palette 併進 fragment,**把這個問題從「要不要擔心」變成「不存在」**
—— 這正是那支工具的用途(ZK javadoc:「a different URI represents a different theme」)。

> **同一個洞在密度軸的 `org.zkoss.zul.theme.density` 上也存在**,而那一案沒有處理。
> 那是別案的事,但**兩案共用一個修法**,值得互相知會。

---

### L3.4 ZKMax 閘的實作,與它證明不了的事

#### (a) 實作 —— 兩條路徑、一個判斷

| 路徑 | 怎麼問 | 底層 |
|---|---|---|
| **Java**(PA3) | `WebApps.getFeature("ee")` | `Classes.existsByThread("org.zkoss.zkmax.Version")`(`static final`,一個 JVM 算一次) |
| **CSS/DSP**(PA2) | `z:getEdition()` 比對 `'EE'` | `org.zkoss.zk.fn.ZkFns.getEdition()` → 同一個 `WebApps.getEdition()` |

**`z:` 已經在每個 `.css.dsp` 的 taglib header 裡**(`http://www.zkoss.org/dsp/zk/core`),
所以 DSP 側**零新增依賴**。模板主題的 `WebAppInit` 也早就在用 `WebApps.getEdition()` 判 EE
來註冊 tablet 主題 ⇒ **這個判斷在 ZK 生態裡是既有慣例,不是新引入的模式。**

順帶記一個**可用但本案不需要**的函式:`t:getCurrentTheme()`(`web/theme.dsp.tld` → `ThemeFns`)——
若日後選擇「用 theme name 選 palette」,它讓這件事可以純在 CSS 裡做。

**本案要用到的 API,已逐項對真實 jar 驗過**
(`zk-11.0.0-jakarta.FL.20260811-Eval.jar`,`javap` / `unzip -p` 讀 tld,不是查文件):

| API | 形式 | 用在 |
|---|---|---|
| `z:getEdition()` | `zk/core.dsp.tld` → `ZkFns.getEdition()` | PA2 的 DSP 條件 |
| `WebApps.getFeature(String)` / `getEdition()` | `public static` | PA3 的 Java 閘 |
| `ThemeProvider.Aide.injectURI(String,String)` | `public static` | PA2 的 cache key |
| `ThemeProvider.getThemeURIs(...)` | javadoc 明文允許 rename / **add** / remove | PA2 追加 sheet、PA4 的 alias |
| `Clients.loadCSS(String)` | `public static final`,**只有單參數版,沒有帶 `id` 的多載** | PA3 ⇒ **冪等要自己顧**(重複呼叫會重複插 `<link>`),或改走 `evalJavaScript` 呼叫帶 `id` 的 `zk.loadCSS` |

#### (b) 它證明不了什麼(**必須寫在決策紀錄裡,不要讓下一個人以為這是授權檢查**)

1. **`existsByThread` 檢查的是「jar 在不在 classpath」,不是「授權有效」。**
   ZKMax 自己會驗授權;本案的閘只是**跟著 EE 一起在**。⇒ 這是**產品邊界標記**,不是防拷。
   ZK core 自己也是這樣用的(`Configuration` 判 `crawlable` 就是同一支)。
2. **CSS 沒辦法被「保護」。** 只要 palette 的位元組進了 jar,打開 jar 就看得到 hex 值。
   ⇒ **真正的付費邊界是「值放在哪個 artifact」**,閘只是把「機制」關掉。
   這也是 M-2 把整件事切出模板專案的理由。
3. **客戶自己覆寫 `--zk-*` 是免費的,而且應該是免費的。** 那是 `--zk-*` 作為公開 API 的既有承諾
   (自 ZK 10.3.0 起已出貨 842 個),Marble 的 brand-override 也是這樣教的。
   ⇒ 本案**賣的不是「能不能換色」,是「26 組調校過的配色 + 切換機制 + 舊名相容」**。
   對外說法要用這個口徑,否則會被問「我自己寫 CSS 不就好了」而答不出來。

---

### L3.5 風險

| # | 風險 | 嚴重度 | 處置 |
|---|---|---|---|
| R1 | **靜態設定 + 執行期呼叫撞在一起,執行期靜默失效** | 🔴 高 | L3.2(c) 的 `html[data-palette]` 形狀;`check:palette` 斷言每張 sheet 恰好一個選擇器且是那個形狀 |
| R2 | **舊 `preferred=deepsea` 靜默降級** | 🔴 高 | PA4;若決定不做 BC,**必須**寫進 breaking change 清單 |
| R3 | **cache key 不含 palette ⇒ 吃到舊 CSS** | 🟠 中 | PA2 的 `Aide.injectURI`,**設計上就不留這個洞** |
| R4 | **4 張圖換不動 ⇒ 暗色 palette 出現亮色 spinner** | 🟠 中 | L3.6 第 3 項;**這一項需要模板專案配合**,是唯一的跨專案相依 |
| R5 | **選擇器位置的 DSP tag 被 minifier 靜默改寫** | 🟠 中 | 照抄模板專案的遮罩 + `HOSTILE_CONSTRUCTS` 守衛;**注意 CleanCSS 這一類問題是 0 errors 0 warnings** |
| R6 | 6 個孤兒 token 被原封不動搬進新機制,漂移繼續 | 🟡 低 | L3.6 第 2 項要拍板,**不要默默照抄** |
| R7 | `color-scheme` / `oklch` 等新語法被 minifier 破壞 | 🟠 中 | L3.1(g):進來之前先 round-trip |
| R8 | **產生器重算衍生色時對不上 ZK 的字面值** | 🟡 低但重要 | PA1 第 3 點:**停下來查,不要調整公式去符合量測** |
| R9 | **`Palette.DEFAULT` 的語意被誤解成「回到預設外觀」** | 🟡 低 | PA3 限制第 2 點 + L3.6 第 5 項(要不要出一張非空的 `iceblue` sheet) |

---

### L3.6 未決事項(需要裁示)

**PA1 開工前要拍 1、2、3;PA2 前要拍 4;PA3 前要拍 5、6。**

| # | 議題 | 選項 | 建議 |
|---|---|---|---|
| **1** | **付費 artifact 的形狀** | **A** 一個 artifact 內含 26 張 sheet,provider 只載選中的那張 · **B** 每個 palette 一個 artifact(= 今天的 23 個 jar,只是變小) | **A**。今天的 23 個 jar 之所以存在是因為「一個 palette = 一個完整主題」;現在一個 palette 只是 8–51 條宣告,拆成 26 個 artifact 只是把 26 份 pom 的維護成本留著 |
| **2** | **6 個孤兒 token** | **A** 請模板專案補進 token · **B** 從 palette 移除 · **C** 照搬 | **B + 記錄**。它們今天就沒有消費者,搬過去等於把漂移固化。移除要進核准清單(−N 條),不能悄悄少 |
| **3** | **4 個 image 變數(唯一的跨專案相依)** | **A** 請模板專案把它們 token 化(4 個 `--zk-image-*`,**G-zero,不改輸出**),palette 就能覆寫 · **B** 本案不管,暗色 palette 接受亮色 spinner · **C** 模板專案把 4 張圖換成 CSS(現代、順手解 A/B 噪音,但改畫面) | **A**。它對模板專案是 G-zero(只換誰持有那個字串),是**四個選項裡唯一既解決問題又不製造 delta** 的。**要跟棄用 LESS 案協調時點** —— 那案的 P8 會動同一批檔案 |
| **4** | **cache key 的實作位置** | **A** 本案的 provider 自己做 · **B** 提案讓 ZK core 的 `StandardThemeProvider` 一起做(density 也受惠) | **A 先做,B 另案提**。B 是對的方向但要動 core,不該擋住本案 |
| **5** | **要不要出一張非空的 `iceblue`(預設)palette sheet** | **A** 出 —— `Palette.DEFAULT` 就能真的回到預設外觀 · **B** 不出 —— `DEFAULT` = 移除屬性,回到「app 設定的 palette」 | **A**,成本是 108 條宣告的一張 sheet(約 2 KB,而且只有真的呼叫它的人會下載)。**B 的語意陷阱會變成客服問題** |
| **6** | **暗色 palette 要不要一併發 `color-scheme: dark`** | 要 / 不要 | **要**,但要**明列在核准清單裡**(+13 條)。它修的是今天就存在的缺陷(原生 UI 不跟著變暗) |

**另外三件不是裁示、但要在對外文件統一的口徑**:

- **「23」還是「26」**(L3.1(b))—— 講數量之前確認 wcag 三件的商業定位。
- **類別與 property 命名** —— 本文件用 `ThemePalette` + `org.zkoss.zul.theme.palette` +
  `Palette.DEFAULT`;**`org.zkoss.theme.iceblue11.IcebluePalette` 不可用**(那是免費模板專案的套件)。
  property 名刻意與密度軸的 `org.zkoss.zul.theme.density` 同命名空間。
- **`gen-var-table.js` 的 `@themePalette` 分類散文**寫著「No CSS mechanism can do this at runtime」
  —— 本案推翻它,PA5 第 4 點。

---

### L3.7 Change Log

| # | 日期 | 原本的敘述 | 更正 | 依據 |
|---|---|---|---|---|
| 1 | 2026-08-13 | (棄用 LESS 案 §P7)「`@themePalette` 改成 runtime override sheet」—— 只有方向,沒有形狀 | 形狀定為**一個 palette 一張 sheet**,選擇器 `html[data-palette="<name>"]`,靜態路徑由 DSP 在選擇器位置補 `:root,` | L1;L3.2(c) 算出 specificity 必須是 (0,1,1) 才不依賴載入順序 |
| 2 | 2026-08-13 | (`less-var-to-token.md`)「LESS resolves this at compile time to choose a FILE. **No CSS mechanism can do this at runtime.**」 | **不成立** —— 換檔案不需要在 runtime 做,把 26 份都出貨、載入時選即可。真正需要新語法的只有「算衍生色」 | L3.2(a) |
| 3 | 2026-08-13 | (口語推測)「palette 是顏色軸,tablet 是另一套規則,所以會像密度 D4 一樣卡住」 | **反了** —— `tablet.css.dsp` 有 95 個 `var(--zk-*)`、**0 個 hex** ⇒ palette 自動穿透,**沒有 D4 對應階段** | L3.1(e) |
| 4 | 2026-08-13 | (隱含假設)「palette 就是一組顏色,全部是 `--zk-*` 覆寫」 | **前半成立、後半有 4 個例外** —— 4 個**圖檔路徑**變數今天不是 token,13 個暗色 palette 依賴它們 | L3.1(f) |
| 5 | 2026-08-13 | (方法上的直覺)「衍生色用 `oklch(from …)` 在 runtime 算,並留一條 hex 當 fallback」 | **fallback 不成立** —— custom property 幾乎永遠解析成功,失敗在使用點,退的是 initial;`@property` 也不救 ⇒ 出貨 palette 走**產生器算字面值** | L3.2(b) |
| 6 | 2026-08-13 | palette 與 library property 的 cache 交互(未被提出過) | **新發現**:WCS cache 一年、theme name 在 key 裡、**library property 不在** ⇒ 用 `Aide.injectURI` 補;**密度軸也有同一個洞** | L3.3(d) |
| 7 | 2026-08-13 | **本計畫是棄用 LESS 案 P7 的一半**,交付物放在模板專案(`org.zkoss.theme.iceblue11.IcebluePalette`、palette 區塊併入 `norm.css`、`build-css.js` 加 26 個佔位符) | **整案移出模板專案**(**user 裁示**;該案的 **M-2** / **C19**)。連帶:①類別不能在 `org.zkoss.theme.iceblue11` 底下 ②palette 不併入 `norm.css`,改成**一個 palette 一張 sheet** ③`build-css.js` 一個字都不改 ④**模板專案的交付變成零**(只剩 L3.6 第 3 項那個 G-zero 的 token 化請求) | **產品邊界** —— palette 就是付費商品 Theme Pack 的內容。**副作用是好的**:每個使用者只下載自己那一張(1–2 KB),而不是全部 623 條 |
| 8 | 2026-08-13 | **提供 `apply(Component, Palette)`**,並主張「區域級 palette 比密度更可行,因為出貨 palette 是字面值、自我完備」 | **移除該 API,區域級不支援**(**user 裁示**)。技術主張本身沒有被推翻(字面值確實自我完備),但**產品範圍**決定了它不該存在;順帶消掉一個說不清楚的洞(body-appended popup 落在區域之外) | L3.2(d);**不要從密度案的 `apply(Component, Density)` 外推回來** |
