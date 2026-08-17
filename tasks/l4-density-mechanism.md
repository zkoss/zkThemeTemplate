# L-4 —— compact profile 的 density 機制(評估 + 執行計畫)

> 依 `.claude/skills/plan-spec/SKILL.md` 三層式架構:**L1** 一頁執行摘要 · **L2** 階段拆解 ·
> **L3** 技術附錄(量測、口徑、比較、風險)。
>
> 本文件原是 **L-4 的拍板材料**。~~L-4 是 P7 唯一還沒解除的 BLOCKED~~
> **←2026-08-14:L-4 已拍板採用,P7 的 BLOCKED 解除**
> (見 [iceblue-drop-less-progress.md L2.2](../doc/iceblue-drop-less-progress.md#l22-前置工作項與-blocked)
> 的〈已解除的 BLOCKED〉與計畫書附錄 L3-F)。
> **本文件自此是執行計畫與進度紀錄,不再是待裁材料** —— L3.4 五項子未決已於 2026-08-13 全數結案,
> 整體採納於 2026-08-14 拍板。**裁示同時確認的兩件對外事實**:`iceblue_c` 未來不出貨;
> 「改 LESS 變數重編 jar」→「設 library-property」是 breaking change,由 **D5** 寫進 migration guide。
>
> ~~**本文件只評估與規劃,沒有動任何 CSS 來源檔。** D1–D5 一步都還沒開工。~~
> **←2026-08-12:D1 / D2 / D3 已完工**(3 / 5),驗收證據見 [L3.5](#l35-d1d3-的驗收證據)。
> D4 仍卡在 P7 的 tablet 轉換,D5 相依於 D4。本文件從「拍板材料」轉為「拍板材料 + 進度紀錄」。
>
> 另一個已落地的改動是**版本升級**(`zk.version` → `11.0.0-jakarta.FL.20260811-Eval`、
> artifact 與三個 version-uid → `11.0.0-Eval`),那是為了讓 `iceblue_c` oracle 與本樹同代
> 才做的前置,**`check:gate` 前後數字完全相同**,見 [L3.6](#l36-change-log)。

---

## 目錄

- **[L1 執行摘要](#l1-執行摘要)**
- **[L2 階段拆解](#l2-階段拆解)** — [D1](#d1-桌面-token-層核心) · [D2](#d2-靜態設定zkxml) · [D3](#d3-java-api) · [D4](#d4-tablet-半風險最高) · [D5](#d5-收尾與遷移)
- **[L3 技術附錄](#l3-技術附錄)** — [量測](#l31-量測數據與口徑) · [機制比較](#l32-機制比較zk-10-vs-本案) · [風險](#l33-風險與已知限制) · [未決](#l34-未決事項需要裁示) · [驗收證據](#l35-d1d3-的驗收證據) · [Change Log](#l36-change-log)

---

## L1 執行摘要

### 核心結論

**建議採用**,而且證據比原本預期的強很多。三個量測決定了這個結論:

1. **桌面 compact 的全部內容就是 333 個 `:root` token 值。** 拿 `iceblue_c 11.0.0` 對
   **同一版**的 ZK 預設主題(`zul` + `zkmax` + `zkex` 11.0.0 的 `web/`)逐檔比:
   **81 個可比的 `.css.dsp` 裡 79 個逐 byte 相同**,只有 `norm.css.dsp` 與
   `zkmax/css/tablet.css.dsp` 不同;而 `norm.css.dsp` 的差異**完全關在第一個 `:root{}` 區塊裡**,
   區塊以外 **29052 = 29052 字元逐 byte 相同**。
   ⇒ ZK 為了改 333 個值,出貨了一個 **282792 B / 215 個檔**的 jar,其中 **97.5% 是逐 byte 複本**。

2. **改成 runtime 覆寫只需要 350 個 token,約 14.4 KB / gzip 2.7 KB。** 不是 862 個 ——
   只要重新宣告「值有變的 333 個」加上「透過 `var()` 相依於它們的 17 個」,其餘 **512 個可以安全省略**
   (推導與凍結問題見 [L3.1](#l31-量測數據與口徑))。這一塊直接併進 `norm.css.dsp`,
   走既有的單一 WCS,**不多一個 HTTP request**。

3. **palette 與 density 可證明正交。** 掃 ZK 出貨的 **26 個 palette 檔、623 條 token 宣告**,
   與 density 的 350 個 closure **重疊 0 條**。⇒ 兩個旋鈕不會互相打架,
   也不需要為它們定優先序 —— 這同時降低了 P7 palette 那一半的風險。

### 方案

沿用 Marble 已驗證的 **`data-density` 屬性**,但**數值全部取自本主題的 `tokens/_compact.css`**
(= ZK `iceblue_c` 的那 333 個值),不引入 Marble 的任何數字。

| 需求 | 作法 |
|---|---|
| **靜態(zk.xml)** | library-property `org.zkoss.zul.theme.density` = `compact`;由 DSP 條件在**選擇器位置**加上 `:root,`,與既有的 `browserDefault` 同技法。**零 FOUC、零額外請求** |
| **動態(Java API)** | `IceblueDensity.apply(Density)` 全站 / `IceblueDensity.apply(Component, Density)` 單一區域。**不需要 reload** |
| **值的來源** | `tokens/_compact.css` 的 333 條,由產生器抽出,**不手抄** |

### 里程碑

| 階段 | 內容 | 閘門 | 相依 | 狀態 |
|---|---|---|---|---|
| **D1** | 桌面 token 層 —— 產生器 + 350 條覆寫塊併入 `norm.css` | **G-delta**(`norm.css.dsp` +350 條) | 無 | **DONE** 2026-08-12 |
| **D2** | 靜態設定 —— library-property + DSP 選擇器條件 | G-delta(同 D1 的檔,+1 個 DSP 區塊) | D1 | **DONE** 2026-08-12 |
| **D3** | Java API —— `IceblueDensity` | 不動 CSS,**G 不變** | D1 | **DONE** 2026-08-12 |
| **D4** | tablet 半 —— 兩套規則同檔,~~compact 那套加屬性前綴~~ **←各包一個 `<c:if>`,由 library-property 二選一(C23)** | **G-delta**(`tablet.css.dsp`,1 檔 / 0 移除 / 618 新增) | P7 的 tablet 轉 CSS | **DONE(2026-08-17)** —— commit `238a3604`,紀錄 **#61**;執行細節見 [d4-tablet-density.md](d4-tablet-density.md) |
| **D5** | 收尾 —— 移除 build 期旋鈕、`readme.md`、遷移指南(**含 C24 的平板層規格**)、關掉 S36 | G 不變 | D1–D4 | **TODO** —— ~~等 D4~~ **←D4 已於 2026-08-17 完工,本階不再被擋著** |

### 總體進度

~~**3 / 5**(2026-08-12)~~ **4 / 5**(2026-08-17)。D1–D3 已完工並全部有實測證據(見 [L3.5](#l35-d1d3-的驗收證據));
~~**D4 仍卡在 P7 的 tablet 轉換**~~ **←D4 已於 2026-08-17 完工**(機制與驗收與本文原訂的不同,見 [D4](#d4-tablet-半風險最高) 與 C23),
只剩 **D5**。
D3 沒有未結案項目 —— 巢狀反向覆蓋已於 **2026-08-13 裁示不支援**
(見 [L3.1(g)](#g-巢狀反向覆蓋不支援已裁示) 與 [L3.4 第 5 項](#l34-未決事項需要裁示))。

### 一句話效益

> 用 **14.4 KB** 換掉 **282.8 KB 的第二個 jar**,順便讓 compact 從「換 jar + 重新載入頁面、
> 只能整站」變成「一個屬性、可以只套一塊畫面、不用 reload」,而且**結構上不可能再發生版本漂移**
> —— 而漂移的成本已經看得到:`iceblue_c` **整條 10.4.0 線都沒有出貨**
> (eval repo 從 `10.3.1-Eval` 直接跳到 `11.0.0.FL.20260812-Eval`),
> 而同期 ZK core 有 `10.4.0-jakarta.FL.20260713-Eval`。第二份出貨物就是會落後,見 [L3.1(a)](#a-iceblue_c-1100-對同版預設主題逐檔比)。

---

## L2 階段拆解

### D1 桌面 token 層(核心)

| | |
|---|---|
| **目標** | 讓 `[data-density="compact"]` 在**任何範圍**都能把桌面主題切成 compact,值與 `iceblue_c` 相同 |
| **輸入 → 輸出** | `tokens/_default.css` + `tokens/_compact.css` → `tokens/_density-compact.css`(產生物)→ 併入 `norm.css` 尾端 |
| **驗收閘門** | **G-delta**:`norm.css.dsp` 恰好 **+350 條** declaration、**+1 個規則區塊**,其餘輸出檔 **0 差異** |
| **前置** | 無 |

**要做的事**

1. **`scripts/gen-density-css.js`** —— 從兩個 token 檔推導,**產物不進 git 以外的手改路徑**
   (與 `gen-fa-css.js`、`p4a-strip-prefixes.js` 同模式:可重跑、冪等、自帶斷言)。
   閉包演算法見 [L3.1](#l31-量測數據與口徑)。
2. **併入 `norm.css` 的最尾端** —— 位置是有意義的:`[data-density="compact"]` 的
   specificity 是 `(0,1,0)`,與 `:root` **相同**,所以它必須**在來源順序上更後面**才會贏。
   本主題沒有 cascade layer,順序就是唯一的裁判(這正是 preview utility 層踩過的同一條規則)。
3. **`npm run check:density-css`** —— 四項斷言,任一不成立 exit 1:
   - 產生的 token 名稱集合 **恰好等於**重算的 closure(數量 + 逐名);
   - 每一條的值 **逐字等於** `tokens/_compact.css` 的對應值;
   - closure 之外的 512 個 token **一條都沒有**被寫進去;
   - 覆寫塊裡每一個 `var()` 指到的名字,**要嘛在 closure 裡、要嘛在兩個 profile 中同值**。
4. **負向控制**(三個,做完要證明它們真的會 exit 1):
   - 手動刪掉 closure 裡的一條 → 第 1 項斷言觸發;
   - 手動把一條的值改成 `_default.css` 的值 → 第 2 項觸發;
   - 手動塞一條 closure 外的 token → 第 3 項觸發。

**驗收怎麼證明(這一階最重要的設計)**

**`iceblue_c.jar` 是一個現成的 oracle。** 不要只比自己的輸出,要對 ZK 出貨的那一份比:

- **靜態層**:把 `iceblue_c 11.0.0` 的 `norm.css.dsp` 的 `:root` 抽出來,與我們覆寫塊逐 token 比對。
  **oracle 的版本必須與 `zk.version` 同代**,否則量到的是版本落差疊在 density 差異上
  (這正是本文件第一版踩到的坑,見 [L3.6](#l36-change-log))。同代之下預期
  **333 條同值、名稱集合完全一致(只在任一側 = 0)**,不得有第 334 條。
- **執行層**:preview 語料在 `data-density="compact"` 下的 computed style,
  必須等於同一頁在 `iceblue_c` 主題下的 computed style。
  **比 computed style,不比 byte** —— 兩者的 CSS 文字本來就不同,byte 比對沒有意義。
  跨主題跑同一組頁面的手法本專案已經有(視覺 A/B harness 的 classpath 組法)。

> ⚠️ **不要拿視覺 A/B 的 `pages differing: 0` 當這一階的通過訊號。**
> 那個 harness 比的是「同一個語料在兩次 build 下有沒有變」,而這一階**本來就要變**。
> 它在這裡的正確用法是**反向**的:確認 `data-density` **沒設**的時候,畫面 **0 差異**
> (證明覆寫塊不會外洩到預設狀態)。

---

### D2 靜態設定(zk.xml)

| | |
|---|---|
| **目標** | 不寫任何 ZUL/Java,只在 `zk.xml` 設一個 property 就讓整站是 compact,且**沒有 FOUC** |
| **輸入 → 輸出** | 同 D1 的檔,選擇器前面多一個 DSP 條件 |
| **驗收閘門** | G-delta(同 D1 的檔);另加**三態實測** |
| **前置** | D1 |

**機制**

```
<c:if test="${'compact' eq c:property('org.zkoss.zul.theme.density')}">:root,</c:if>[data-density="compact"]{ … }
```

**為什麼是這個技法**:`.css.dsp` 本來就會經過 DSP 求值,而本主題**已經**在選擇器位置用同一招做
`browserDefault`(`norm.css.dsp` 裡 90 個前綴)。所以這不是新發明的機制,是既有機制的第二個用例。

**為什麼不用別的**:
- 由 Java 在 render 時對 `<html>` 塞屬性 —— ZK 沒有給主題這個接縫,只能走 `Clients.evalJavaScript`,
  那是**首次繪製之後**才執行 ⇒ FOUC。這正是 Marble 文件裡建議靜態情境不要用 Java API 的原因。
- 另出一支 `:root{}` 版本的 sheet 由 `getThemeURIs()` 掛上 —— 內容重複一份 14.4 KB,而且多一個 request。

**三態實測(缺一不可)**

| property | 預期服務出來的 `norm.css.dsp` | 預期畫面 |
|---|---|---|
| 未設 | 選擇器是 `[data-density="compact"]` | 預設密度 |
| `compact` | 選擇器是 `:root,[data-density="compact"]` | 整站 compact |
| 亂值(`foo`) | 同「未設」 | 預設密度(**不得**當成 compact) |

> `.css.dsp` 的回應**有快取**,而 library property 是行程層級的 ⇒ 三態要分別重啟量,
> 不能在同一個行程裡改 property 再抓。這是 `ab-coverage.js` 已經踩過並寫下口徑的同一個坑。

---

### D3 Java API

| | |
|---|---|
| **目標** | 從 Java 動態切換,全站或單一區域,**不需要 reload** |
| **輸入 → 輸出** | 新檔 `src/main/java/org/zkoss/theme/iceblue11/IceblueDensity.java` |
| **驗收閘門** | **不動任何 CSS ⇒ 閘門數字必須完全不變**(這本身就是一項斷言) |
| **前置** | D1 |

**形狀**(移植 `MarbleDensity` 的介面,不移植它的數值):

```java
public final class IceblueDensity {
    public enum Density { DEFAULT("default"), COMPACT("compact"); … }
    public static void apply(Density d);              // 全站:documentElement 上的屬性
    public static void apply(Component scope, Density d);  // 區域:setClientDataAttribute("density", …)
}
```

> **字彙已裁示為 `default` / `compact`**(2026-08-12),不是原建議的 `comfortable`。
> 理由見 [L3.4 第 1 項](#l34-未決事項需要裁示)。
>
> ~~`DEFAULT` 這個列舉值**不是**「沒設屬性」的同義詞 —— 它是**顯式寫回預設密度**,
> 唯一的用途是巢狀反向覆蓋(外層 compact、內層 `data-density="default"`)。~~
> **←2026-08-13 裁示:巢狀反向覆蓋不支援**([L3.4 第 5 項](#l34-未決事項需要裁示))。
> `DEFAULT` 剩下**兩個**真實用途,都不需要第二個 CSS 區塊:
> (a) `apply(Density.DEFAULT)` **關掉全站 compact** —— 屬性一換,compact 選擇器就選不到 `<html>`;
> (b) `apply(component, Density.DEFAULT)` **收回同一個區域先前的 `COMPACT`** —— 前提是沒有
> compact 祖先。**在 compact 祖先底下對子區域設 `default` 是 no-op**,理由與量測見
> [L3.1(g)](#g-巢狀反向覆蓋不支援已裁示)。

- 全站那支走 `Clients.evalJavaScript`,因為 `<html>` 不是 ZK component。
- 區域那支走 ZK 原生的 `Component#setClientDataAttribute`,**沒有 JavaScript 字串**。
- Javadoc 必須寫明 **FOUC**:要固定預設值請用 D2 的 library-property,不要在頁面載入時呼叫 `apply()`。

**驗收**:Playwright 實測 —— 切換前後量同一個元素的 computed height,
必須**在同一個 desktop 生命週期內**改變(證明沒有 reload);
~~以及巢狀情境(外層 compact、內層 `default`)兩層各自正確~~
**←2026-08-13 裁示不支援,本條刪除**。改為驗收 `DEFAULT` 僅存的兩個用途:
全站關閉、以及**同一個區域的 `COMPACT` → `DEFAULT` 收回**(無 compact 祖先時)。

> **命名**:類別放在主題套件 `org.zkoss.theme.iceblue11` 底下。
> 「要不要升格進 ZK core(`org.zkoss.zul.theme`)成為跨主題的公開 API」是**產品面問題**,
> 歸 P8,見 [L3.4](#l34-未決事項需要裁示)。

---

### D4 tablet 半(風險最高)

| | |
|---|---|
| **目標** | 讓同一個 `data-density` 旋鈕也管平板層,**徹底消滅 S36 的分裂主題** |
| **輸入 → 輸出** | `zkmax/less/tablet/{default,compact}/**` → 單一 `tablet.css`,compact 那套加屬性前綴 |
| **驗收閘門** | **G-delta**,與 P7 的 tablet 轉換合併成同一段 delta |
| **前置** | **P7 的 tablet 轉 CSS**(本階不能先做) |

**為什麼這一階和 D1 不同性質 —— 這是本計畫最需要注意的一件事**

桌面層的 compact **是純 token 值替換**;**tablet 層完全不是**。實測:

| | default | compact |
|---|---|---|
| 規則區塊(純 CSS) | 260 | 217 |
| declaration | 681 | 628 |
| `var(--zk-` 出現次數 | **95** | **95** |
| 只在這一側的選擇器 | **67** | **27** |
| 共用但宣告不同 | **70** | ← |

`var()` 用量兩邊**一模一樣**,差異全是字面值與規則的增減(例:`.z-column-content` 在 default 是
`font-size:15px; padding:10px 12px`,在 compact **整條不存在**)。
⇒ **token 覆寫對 tablet 一點作用都沒有**,必須把兩套規則都出貨、用屬性把 compact 那套圈起來。

> ⚠️ **而且 compact 的平板規則不見得比較小。** `.z-colorpalette` 桌面 compact 是 260×226
> (default 340×300),**平板 compact 卻是 586×460**,比平板 default 的 `304px` 寬將近一倍。
> `tablet.css.dsp` 是**相對於各自桌面基準的觸控補償層**,不是一套更密的平板設計。
> 完整證據與三個後果見 [L3.1(e-2)](#e-2-compact-的-tablet-規則不是比較小的-tabletd4-的真正形狀)。

> ⚠️ **以下兩段是 2026-08-17 之前的作法,已被 C23 推翻,保留是因為它是那條裁示的依據。**
> 實際採用的是「兩張完整的表各包一個 `<c:if>`,由 library-property 二選一」,**中和一條都不做**;
> 驗收是三態全量比對。作法、量測與代價見 [d4-tablet-density.md](d4-tablet-density.md)。
>
> 被推翻的關鍵事實有兩個:**(1) 「67 條」的單位是錯的** —— 決定會不會漏的是 (單一選擇器, 屬性) 對,
> 真正的漏面是 **187 條宣告 / 113 個選擇器**;**(2) CSS 沒有「不存在」運算子** ——
> 那些規則在 compact 下要的是不存在而不是被蓋掉,而本案在 P5 處理 `browserDefault` 時就已經寫下
> 「只有伺服器端條件能刪掉一條規則」。

~~**因此多出一項在桌面層不存在的工作**:那 **67 條只在 default 的規則**,在 ZK 10 的 `iceblue_c`
裡是**整條不存在**;改成屬性覆寫之後它們會**繼續生效**。所以 compact 區塊必須**逐條中和**它們
(明確寫回非平板的值),否則 compact 下的平板畫面會與 `iceblue_c` 不一致。~~

~~**驗收**:對 `iceblue_c.jar` 的 `tablet.css.dsp` 做 **mobile UA 的 computed-style oracle 比對**,
逐一走過那 67 條所影響的選擇器。**不是抽驗,是全部 67 條** —— 這一階的通過條件就是這張清單全綠。~~

> tablet 是 **EE-only、且只在 mobile UA 注入**。~~加上 compact 那套之後 `tablet.css.dsp`
> 大約從 27638 B 成長到 ~53 KB,只有行動裝置付這個成本。~~
> **←2026-08-17 這個估算隨機制作廢**:兩段互斥,實測服務出去的是 `unset` **26207 B** /
> `compact` **24308 B**,兩者都與今天同級。成長的是 repo 裡的 `.css.dsp` 檔(53158 B),不是回應。
> **區域級 density 對 tablet 沒有意義**(它是整站的觸控層),文件要明說不支援,不要假裝支援。

---

### D5 收尾與遷移

| | |
|---|---|
| **目標** | 舊的 build 期旋鈕退場,一個機制取代兩個 |
| **驗收閘門** | 不動輸出 ⇒ G 不變 |
| **前置** | D1–D4 |

1. **移除 build 期旋鈕**:`norm.css` 不再需要「把第一個 `@import` 指向 `tokens/_compact.css`」
   這個用法;`_zkvariables.less` 的 `@themeProfile` 隨 P7 一併消失。
   `tokens/_compact.css` **保留**,它從「可切換的來源」變成「產生器的輸入」。
2. **這是對外的 breaking change**,必須進遷移指南:`readme.md:45` 的
   〈switch to compact profile (since 9.5.0)〉整章改寫 —— 從「改 LESS 變數重編 jar」
   變成「設一個 library-property」。
3. **正式關閉 S36** —— 分裂主題(桌機 default + 平板 compact)在新機制下**結構上不可能發生**,
   因為兩層讀的是同一個屬性。S36 當初裁示「接受到 P7 為止、不另外寫檢查」,
   到這裡是它被兌現而不是被繞過。
4. **更新進度文件**:L2.2 的 BLOCKED 表移除 P7 那一列;L1〈下一步〉第 5 項結案。

---

## L3 技術附錄

### L3.1 量測數據與口徑

**所有數字都是本輪實測,不是引用。** 量測日期 2026-08-12。

> **口徑修正(重要)**:本文件第一版用 `iceblue_c 10.3.0.1` 當 oracle,對本專案 10.4 期的
> `baseline/` 比 —— 那量到的是「版本落差 + density 差異」的疊加。已改用
> **`iceblue_c 11.0.0.FL.20260812-Eval`**,並同時把 `zk.version` 升到
> **`11.0.0-jakarta.FL.20260811-Eval`**,讓 oracle 與本樹同代。
> `iceblue_c` **沒有任何 10.4.0 版本**(eval repo:`10.3.1-Eval` → `11.0.0.FL.20260812-Eval`),
> 所以 10.4 期根本不存在同代 oracle,升版是唯一解。詳見 [L3.6](#l36-change-log)。

> **oracle jar 在哪(D1 與 D4 的驗收都要用它)**:已 `install:install-file` 進本機 repo,座標
> `org.zkoss.theme:iceblue_c:11.0.0.FL.20260812-Eval`,實體在
> `~/.m2/repository/org/zkoss/theme/iceblue_c/11.0.0.FL.20260812-Eval/`(**282792 B**,與
> [L3.1(a)](#a-iceblue_c-1100-對同版預設主題逐檔比) 記的大小一致 ⇒ 身分可驗)。
> 它**原本只存在於某次 session 的暫存目錄**,而 `~/.m2` 沒有任何 11.x 的 `iceblue_c`;
> 換一個 session 就會找不到,所以在這裡記下座標而不是路徑。



#### (a) `iceblue_c 11.0.0` 對同版預設主題逐檔比

**這是本計畫的關鍵量測:同一個 ZK 版本,唯一的變因就是 density。**

| 項目 | 值 |
|---|---|
| jar 大小 / 檔數 / 解壓後 | **282792 B** / **215** 檔 / **901530 B** |
| jar 內 `.css.dsp` | **85** |
| 預設主題(`zul`+`zkmax`+`zkex` 11.0.0 的 `web/`)`.css.dsp` | **81** |
| **可比檔中逐 byte 相同** | **79 / 81(97.5%)** |
| **不同** | **2** —— `zul/css/norm.css.dsp`(72837 → 71923)、`zkmax/css/tablet.css.dsp`(27638 → 25359) |
| 只在 `iceblue_c` | **4** —— `tbeditor` `goldenlayout` `cropper` `signature` 的**新路徑**副本;`iceblue_c` 新舊路徑都出貨,預設主題只出舊路徑。與 density 無關(`baseline/` 也是 85 = 81 + 這 4 個) |

**版本落差有多大(說明第一版為什麼會誤判)**:同一批檔,`baseline/`(10.4 期)對 **ZK 11.0.0 預設主題**
比 → **78 相同、3 不同**:`js/zkmax/grid/css/grid.css.dsp`(294 → 4449)、
`js/zul/db/css/calendar.css.dsp`(5791 → 6486)、`zul/font/font-awesome.css.dsp`(175837 → 175801)。
**這 3 個是上游 10.4→11.0 的演進,不是 density**;`norm.css.dsp` 反而**逐 byte 相同**
(本樹的 token 層已經就是 ZK 11 的 token 層)。第一版把這類落差算進了 density 帳上。

**先前那條「漂移已經發生」的結論作廢**:在同代之下,`iceblue_c` **一個元件 CSS 都不缺、
一個 token 都不缺**(見 (b))。真正成立的觀察改成:`iceblue_c` **整條 10.4.0 線沒有出貨**,
也就是第二份出貨物的釋出節奏會落後於預設主題。

#### (b) `norm.css.dsp` 的差異形狀(同代)

| 項目 | 值 |
|---|---|
| 預設主題 `:root` token 數 | **862** |
| `iceblue_c` `:root` token 數 | **862** |
| 只在預設 / 只在 `iceblue_c` | **0 / 0** |
| `--zk-severity-*` 兩側各有 | **20 / 20** |
| **值不同** | **333** |
| `:root{}` 區塊**以外**的內容 | **逐 byte 相同(29052 = 29052 字元)** |

**三重交叉驗證,`333` 在三個獨立來源下完全一致**:
(i) `iceblue_c 10.3.0.1` 對 10.4 期 `baseline/`、
(ii) `iceblue_c 11.0.0` 對 ZK 11.0.0 預設主題、
(iii) 本專案自己的 `tokens/_default.css` vs `tokens/_compact.css`(862 / 862、名稱與順序相同)。
版本換了、oracle 換了、來源換了,**333 沒有動** —— 這個數字可以當常數用。

#### (c) 凍結問題與 closure(這一段決定了要出貨幾個 token)

`var()` 的替換發生在**宣告它的那個元素**上,替換完就凍結後往下繼承。
所以只覆寫「值有變的 333 個」是**不夠**的:任何**透過 `var()` 相依於它們**的 token,
如果沒有被一起重新宣告,就會維持在 `:root` 上算好的**預設值**。

| 項目 | 值 |
|---|---|
| token 總數 | **862** |
| 預設值含 `var()` 的 | **472** |
| 指到 token 集合**外**的 `var()` 參照 | **0**(集合是封閉的) |
| 種子(值不同) | **333** |
| **傳遞閉包(必須重新宣告)** | **350**(2 輪收斂) |
| 可安全省略 | **512** |
| 閉包中字面值 / `var()` 衍生 | **288 / 62** |

**產出成本**

| | 原始 | gzip |
|---|---|---|
| 覆寫塊(350 條) | **14412 B** | **2731 B** |
| `norm.css.dsp` 現況 | 72837 B | 10297 B |
| `norm.css.dsp` 加上覆寫塊 | 87249 B | 12837 B |
| **淨增** | **+14412 B** | **+2540 B** |

對照:出貨 862 條的話原始約 43782 B ⇒ closure 分析省掉約 **67%** 的體積。

#### (d) palette × density 正交性

掃 `zkcml/zkthemebuilder/palettes/*_css.less`:**27 個檔、623 條 `--zk-*` 宣告、108 個相異 token**,
與 350 個 density closure **重疊 0 條**。
⇒ 兩個旋鈕作用在互斥的 token 集合上,**不需要定義優先序**。
產生器應把「重疊必須為 0」寫成一條斷言 —— 它同時是 P7 palette 那一半的保護欄。

#### (e) tablet 的差異形狀

| | default | compact |
|---|---|---|
| 規則區塊 | 274(含 14 個 DSP 區塊)/ **260**(純 CSS) | 227(含 10 個)/ **217** |
| declaration | 695 / **681** | 638 / **628** |
| 只在該側的選擇器 | **67** | **27** |
| 共用選擇器 | **188** | **188** |
| 共用但**宣告不同** | **70**(共用中的 37%) | ← |
| `var(--zk-` | **95** | **95** |

口徑:`zkmax/css/tablet.css.dsp`,`zk11` 預設主題(27638 B)vs `iceblue_c 11.0.0`(25359 B),同代。
「選擇器」= **逗號未拆的選擇器字串**;若拆成單一選擇器則為 only-default **90** / only-compact **33** /
共用 **248**(其中 70 條宣告不同、178 條完全相同)。
與第一版(10.3.0.1 oracle)量到的**每一個數字都相同** —— tablet 這一層在 10.3→11.0 之間沒有動過。

> **口徑補記**:第一版表中的 274 / 695 / 227 / 638 把 `browserDefault` 的 DSP 區塊
> (`<c:if …>.z-page </c:if>`,default 14 個、compact 10 個)算成了 CSS 規則;剝掉之後是
> 260 / 681 / 217 / 628。**67 與 27 不受影響**(那是 D4 驗收清單的長度,原數字正確)。
> 共用數第一版寫 189,實測 **188** —— 差的那 1 個也是 DSP 區塊。**不動任何結論。**

#### (e-2) compact 的 tablet 規則不是「比較小的 tablet」——D4 的真正形狀

「compact 有沒有自己的 tablet 專屬規則」的答案是**有,而且方向與直覺相反**。
那 27 條(拆開 33 條)是 default 的 `tablet.css.dsp` 裡**整條不存在**的,例如:

```
.z-calendar          {min-width:420px;padding:2px}       ← default tablet 沒有這條
.z-combobox-input    {line-height:14px;height:32px;padding:4px 5px}
.z-groupbox-header   {line-height:24px}
```

更關鍵的是共用選擇器裡那 **70 條宣告不同**的,**compact 的值經常比 default 大**:

| 選擇器 | 桌面 default | 桌面 compact | **tablet default** | **tablet compact** |
|---|---|---|---|---|
| `.z-colorpalette` | 340×300 | **260×226** | `304px` × auto | **586×460** |
| `.z-colorpalette-color` | 16×16 | **12×12** | 40×24 | **32×32** |

桌面層 compact 確實比較小(340→260、16→12,正是那 333 個 token 值在做的事);
**到了平板層,compact 反而把同一個元件放大到 default 的近兩倍寬**。

**成因**:`tablet.css.dsp` 不是一套獨立的平板設計,它是**相對於各自桌面基準的補償層** ——
目的是把觸控目標推到可點擊的尺寸。compact 的桌面基準比較小,所以補償層必須推得更用力。
兩套 sheet 追的是**大致相同的最終渲染尺寸**,只是起點不同。

**這對 D4 的三個直接後果**:

1. **token 覆寫在這一層完全無效** —— 已知(`var()` 95=95,差異全在字面值),此處只是給出了機制上的原因。
2. **驗收不能用「看起來有沒有變密」** —— 在平板上 compact 有些地方本來就比較寬。
   唯一可用的判準是 D4 已經訂的「對 `iceblue_c` 的 tablet.css.dsp 做 computed-style oracle 逐條比對」。
3. **文件用語要小心**:在平板層,`data-density="compact"` 選的是「**為 compact 桌面基準調校過的觸控層**」,
   不是「更密的平板」。遷移指南(D5)不要把它寫成密度。

#### (f) 主題的 token 化程度(說明為什麼桌面層這麼乾淨)

`target/classes/web/iceblue11` 的 85 個 `.css.dsp`:`var(--zk-` 出現 **3296** 次,
分佈在 **65** 個檔;字面 `NNpx` 出現 **2366** 次。
那 2366 個字面值**在兩個 profile 下相同**(由 (b) 的「`:root` 以外逐 byte 相同」證明),
所以它們不在 compact 的範圍內 —— **ZK 10 的 `iceblue_c` 也一樣不動它們**,這不是本案的縮水。

#### (g) 巢狀反向覆蓋:不支援(已裁示)

> **裁示(2026-08-13):不補 `[data-density="default"]` 區塊,巢狀反向覆蓋列為不支援。**
> 本節保留全部推導與量測,因為它是這條裁示的依據,也是日後有人問「為什麼不做」時的答案。
> API 與文件的處置見本節末〈裁示之後的處置〉。

計畫書原本寫著「`DEFAULT` 這個列舉值**不是**「沒設屬性」的同義詞 —— 它是**顯式寫回預設密度**,
唯一的用途是巢狀反向覆蓋」。**D1 做完之後這件事不成立**,原因很簡單:
出貨的樣式表只有 `[data-density="compact"]` 一個區塊,**沒有 `[data-density="default"]`**。

**「巢狀反向覆蓋」是什麼意思(具體例子)**

想像一個整站 compact 的後台,但其中一塊「設定表單」希望維持預設密度:

```html
<html data-density="compact">          <!-- 全站 compact -->
  …
  <div data-density="default">         <!-- 想讓這一塊回到預設 -->
    <button class="z-button">儲存</button>   <!-- 期望:預設高度 -->
  </div>
  <button class="z-button">匯出</button>     <!-- 期望:compact 高度 -->
</html>
```

對應到 Java 就是:

```java
IceblueDensity.apply(Density.COMPACT);              // <html>
IceblueDensity.apply(settingsForm, Density.DEFAULT); // 那個 <div>
```

**今天實際會發生什麼**:`<div data-density="default">` **match 不到任何規則**,
所以那 350 個 token 在這個 `<div>` 上**沒有被重新宣告**;它繼承 `<html>` 上算好的值,
而 `<html>` 上算好的是 compact。⇒ **「儲存」按鈕仍然是 compact**,屬性形同沒寫。

**為什麼「全站那一支」反而是好的**:`apply(Density.DEFAULT)` 把 `<html>` 的屬性設成
`default` 時,`[data-density="compact"]` **選不到** `<html>`,於是 `:root` 自己的值生效
—— 這條路徑是對的。所以現況精確地說是:
`DEFAULT` **可以關掉全站 compact,但不能在巢狀範圍反向覆蓋**。

**CSS 有沒有別的辦法?沒有。** `revert-layer` 是唯一形式上接近的工具,但它把該元素的階層
往回捲之後,若沒有更低階層的宣告 match 到這個元素,屬性就落回**繼承值** ——
也就是 compact 祖先的值,等於沒捲。而且本分支**沒有 cascade layer**(計畫書 §0 排除)。
⇒ 要支援反向覆蓋,只能**再出貨一個 `[data-density="default"]` 區塊**,
內容是同樣那 350 個 token 的 **default 值**。

**成本(2026-08-12 實測)**

| | raw | gzip |
|---|---|---|
| `norm.css.dsp`(D1+D2 後,只有 compact 區塊) | 84493 B | 12761 B |
| 再加上 `[data-density="default"]` 區塊 | **99824 B** | **14648 B** |
| **淨增** | **+15331 B** | **+1887 B** |

default 區塊比 compact 區塊**大** (15331 vs 14414),因為 default profile 的值帶著
`round(up, calc(var(--zk-base-font-size) * 1.25), 1px)` 這類運算式,而 compact 側多半是字面值。

**Marble 有這個功能嗎?沒有,而且它的規格書寫了但沒做。**
實測 Marble 全樹:`data-density` 只出現在 `zul/css/tokens/_sizing.css` 的
**唯一一個** `[data-density="compact"]` 區塊,**沒有任何 `[data-density="comfortable"]` 選擇器**
(`comfortable` 在 Marble 只以 `--zk-touch-target-comfortable` 出現,是平板觸控目標,無關)。
但 `doc/spec/data-dense-mode.md` 明寫「it nests and a closer descendant can override it back to
`comfortable`」,而 `MarbleDensity.Density.COMFORTABLE` 也存在。
⇒ **Marble 的巢狀反向覆蓋同樣是空頭支票**,只是還沒有人測到。
本專案不動 Marble 的檔案(L3.4 第 1 項已定調),但這件事應該回報給 Marble。

> **這不影響 D1/D2 已完成的任何結論。** 350 條 closure、333 個種子、oracle 逐值相同、
> 三態實測 —— 全部與這一項無關。受影響的只有 D3 驗收裡「巢狀情境兩層各自正確」那一條。

**裁示之後的處置(2026-08-13)**

不補區塊,所以要確保這個限制**是被寫下來的、而且不會有人以為它會動**:

1. **`Density.DEFAULT` 保留,但語意縮小成兩件它真的做得到的事**:
   (a) `apply(Density.DEFAULT)` —— **關掉全站 compact**;
   (b) `apply(component, Density.DEFAULT)` —— **收回同一個區域先前設過的 `COMPACT`**。
   (b) 常被誤以為等於巢狀反向覆蓋,其實不是:它有效的前提是**沒有 compact 祖先**。
   有 compact 祖先時它是 **no-op**。
2. **不讓 `apply(component, DEFAULT)` 丟例外。** 它在 (b) 的情境下是正確且有用的呼叫,
   丟例外會把一個合法用法擋掉,而真正該擋的情境(有沒有 compact 祖先)
   **只有客戶端知道**,伺服器端的 Java 無從判斷。⇒ 用文件處理,不用執行期檢查。
3. **`IceblueDensity` 的 Javadoc、`readme.md`、D5 的遷移指南都要明說不支援** ——
   計畫書原本承諾過這個能力,沒寫下來的話,讀舊版計畫書的人會以為它還在。
4. **`check-density-runtime.js` 增加一項正向驗收**:
   同一個區域 `COMPACT` → `DEFAULT` 必須逐值回到預設(見 [L3.5](#l35-d1d3-的驗收證據) 的 [5])。
   這一項守的是「(b) 真的有效」,而不是「(b) 在 compact 祖先下也有效」。
5. **風險表第 2 項的成本維持 14.4 KB**,沒有變成 ~29.7 KB。這是本裁示買到的東西。

---

### L3.2 機制比較(ZK 10 vs 本案)

| 面向 | **ZK 10:`iceblue_c` 獨立主題** | **本案:`data-density` 屬性** |
|---|---|---|
| 出貨物 | 第二個 jar,**282792 B / 215 檔 / 85 個 `.css.dsp`** | `norm.css.dsp` **+14412 B**(gzip +2540 B),**0 個新檔** |
| 其中重複內容 | **79 / 81 逐 byte 相同**(97.5%,同代比) | 無 |
| HTTP 請求 | 不變(換整個主題的 WCS) | **不變**(併進既有單一 WCS) |
| 靜態設定 | `org.zkoss.theme.preferred` = `iceblue_c` | `org.zkoss.zul.theme.density` = `compact` |
| 動態切換 | `Themes.setTheme()` 寫 cookie → **必須 `Executions.sendRedirect(null)` 重新載入整頁**(ZK 自己的 `zksandbox` / `zktest` 全部這樣寫) | 設一個屬性,**同一個 desktop 內生效,不 reload** |
| 切換粒度 | **整站**(cookie 綁瀏覽器) | **整站 或 單一區域**(可巢狀加密;**反向覆蓋不支援**,見 [L3.1(g)](#g-巢狀反向覆蓋不支援已裁示)) |
| 與 palette 組合 | **相乘**:N 個 palette × 2 個 density = 2N 份出貨物 | **正交**:palette 覆寫 sheet × density 屬性,重疊實測 0 |
| 版本漂移風險 | 兩份必須人工保持同步 | 結構上不可能(單一來源產生) |
| **內容是否已經漂移** | **否。** 同代比之下元件與 token 完全對齊(862/862、severity 20/20) | — |
| **釋出節奏是否已經落後** | **是。** `iceblue_c` **整條 10.4.0 線沒有出貨**(`10.3.1-Eval` → `11.0.0.FL.20260812-Eval`),而同期 ZK core 有 `10.4.0`。要用 compact 就得跟著跳版 | 沒有第二個出貨物,不存在這個問題 |
| 平板層 | 另一套規則,隨 jar 一起換 | 同一個屬性圈住(**D4**,需逐條中和 67 條) |
| 對既有使用者 | 換 jar | **breaking**:`readme.md` 教的 build 期改法失效,需遷移指南(**D5**) |

**兩個機制唯一各有勝負的地方**:ZK 10 的 cookie 會**跨 session 記住使用者選擇**(30 天),
屬性不會。若產品需要「記住偏好」,那是**應用層**的責任(存使用者設定後在 render 時套用),
不應該由主題承擔 —— 這也是 Marble 那份規格的立場:主題出**宣告式旋鈕**,怎麼設是應用的事。

---

### L3.3 風險與已知限制

| # | 風險 | 嚴重度 | 處置 |
|---|---|---|---|
| 1 | **D4 的 67 條中和** —— 只在 default 的規則在屬性機制下不會消失,漏一條就是平板 compact 與 `iceblue_c` 不一致 | **高** | 驗收條件訂為「67 條全部逐條對 oracle 比對」,不接受抽驗 |
| 2 | 每個使用者都多付 **14.4 KB / gzip 2.6 KB**,即使從不使用 compact | 中 | 已量化;若不可接受,退路是把覆寫塊拆成獨立 `.css.dsp` 由 `getThemeURIs()` 條件掛載 —— 代價是多一個 request,且 runtime 屬性切換會失效(只剩靜態)。**不建議** |
| 3 | Java API 全站那支有 **FOUC** | 中 | 與 Marble 相同的既知限制;Javadoc + 文件明寫「固定預設值請用 D2」 |
| 4 | DSP 標籤放在選擇器位置是既知的設計瑕疵 | 低 | 本主題**已經**這樣用(`browserDefault`,90 處),本案是第二個用例而非首例;P8 的產品面問題已收錄此議題 |
| 5 | `.css.dsp` 有快取,三態測試若在同一行程內改 property 會量到舊內容 | 低 | 已寫進 D2 的口徑:三態分別重啟 |
| 6 | 區域級 density 對 tablet 無意義 | 低 | 文件明說不支援,不假裝支援 |
| 7 | `iceblue_c` 這個主題名在 ZK dist 仍然存在 | — | 產品面問題,見 L3.4 |

---

### L3.4 未決事項(需要裁示)

> **五項全部已裁示**(第 1 項 2026-08-12;第 2、3、4、5 項 2026-08-13)。
> 本節自此只是紀錄,不再有待答項。

1. ~~**屬性值的字彙**~~ **【已裁示 2026-08-12:`default` / `compact`】**
   列舉為 `Density.DEFAULT("default")` / `Density.COMPACT("compact")`,與本主題 profile
   (`tokens/_default.css` / `tokens/_compact.css`)、與 `iceblue_c` 出貨物的既有語彙一致。

   <details><summary>原建議是 <code>comfortable</code>,以及它為什麼不成立</summary>

   原建議的唯一理由是「與 Marble 用同一組字彙」。**這個理由撐不住**:Marble **尚未公開發行**
   (CLAUDE.md 的專案狀態),所以兩邊要對齊的話,往哪個方向對齊的成本都是零 ——
   `comfortable` 並不因為 Marble 先寫了就取得優先權。反過來,`default` 有兩個本方的理由:
   (a) 本主題自己的兩個 profile 檔就叫 `_default` / `_compact`,ZK 出貨的第二個 jar 也叫
   `iceblue_c`(= compact),既有語彙裡從來沒有出現過 `comfortable`;
   (b) 屬性值要對應的是「**沒有加密的那一態**」,而那一態在本主題的名字就是 default。

   **代價(要記著)**:採用 `default` 之後,Marble 的 `MarbleDensity.Density.COMFORTABLE("comfortable")`
   就與本主題不同字彙。若 L3.4 第 2 項日後裁示把 API 升格進 ZK core 成為跨主題契約,
   **兩者必須先統一**,而該由 Marble 改過來(它未發行,且本裁示已定調)。
   這是**跨 worktree 的後續事項,本計畫不動 Marble 的任何檔案**。
   </details>
2. ~~**Java API 放哪**~~ **【已裁示 2026-08-13:放主題套件 `org.zkoss.theme.iceblue11`】**
   **不升格進 ZK core `org.zkoss.zul.theme`。** 與本文件原本的建議一致,現況即為裁示結果 ——
   `IceblueDensity` 已經在該套件底下(D3 完工)⇒ **這條裁示不產生任何實作工作**。
   理由:升格是產品決策,而且在只有一個實作者的時候定介面太早。
   **連帶效果**:M-1(Marble 的 `COMFORTABLE` → `DEFAULT` 改名)的觸發條件 (a)
   「density API 升格進 ZK core」**在本案內不會發生**,所以 M-1 只剩觸發條件 (b)
   「Marble 首次公開發行前」—— 見[執行計畫 M-1](../doc/iceblue-drop-less-execution-plan.md#m-1-marble-的-densitycomfortable-改名為-default)。
3. ~~**`iceblue_c` 這個獨立主題還要不要繼續出貨**~~ **【已裁示 2026-08-13:未來不出貨】**
   **推翻本文件原本的建議(「保留但凍結、標 deprecated」)** —— 直接不再出貨。
   本案讓它變成純粹的重複(**97.5% 是逐 byte 複本**,見 [L3.1(a)](#a-iceblue_c-1100-對同版預設主題逐檔比)),
   而重複出貨物**結構上就是會落後**(`iceblue_c` 整條 10.4.0 線都沒有出過)。
   **存量客戶的處置歸 P8 的 migration guide**:在 `zk.xml` 設 `preferred=iceblue_c` 的人,
   要改成 `preferred=iceblue11` + library-property `org.zkoss.zul.theme.density=compact`。
   **本 repo 不需要為此改任何來源檔** —— `iceblue_c` 是另一個出貨物,
   本模板從來沒有產生過它;這條裁示的交付物只有 migration guide 的一段文字。
4. ~~**`tokens/_compact.css` 的公開性**~~ **【已裁示 2026-08-13:公開,維持對外可覆寫】**
   原本建議「與 P7 的 palette override sheet 合併決定」,但 **palette 已於同日移出本案**
   (M-2)⇒ 本項獨立裁示。**公開**在本機制下有兩個面,兩個都成立,**D5 的 migration guide 要分開寫**:
   - **建置期(fork)**:`tokens/_compact.css` 仍是那 333 個值的正本。改它之後**必須重跑
     `npm run gen:density-css`**,否則 `npm run check:density-css` 會 exit 1(它已在 `check:gate` 裡)。
     注意 jar 只出 `.css.dsp`、**不出原始 `.css`**(P5 實測 85 / 0),所以這一面只對改來源的 fork 成立。
   - **執行期(不改來源)**:那 350 條落在 `norm.css.dsp` 的 `[data-density="compact"]` 區塊裡,
     在主題之後載入自己的 sheet 就蓋得掉 —— 與 M-2 對 palette 的結論同一個構造,
     **本專案不需要為此提供任何 hook**。
5. ~~**要不要補 `[data-density="default"]` 區塊**~~ **【已裁示 2026-08-13:不補,巢狀反向覆蓋列為不支援】**
   每個使用者多付 **+15331 B / gzip +1887 B**(風險表第 2 項從 14.4 KB 變成 ~29.7 KB)
   換一個**沒有已知需求**的能力,不划算 —— 而且要注意這個能力**從來沒有存在過**:
   它是計畫書寫下的意圖,不是既有行為,所以不支援不是功能倒退。
   `DEFAULT` 剩下的兩個用途(全站關閉、同區域收回 `COMPACT`)**不需要**第二個區塊。
   完整推導、例子、成本量測與 Marble 的現況見 [L3.1(g)](#g-巢狀反向覆蓋不支援已裁示),
   裁示之後的四項處置在同一節末尾。

---

### L3.5 D1–D3 的驗收證據

**全部為 2026-08-12 實測。** 每一項都是可重跑的指令,不是一次性的手工量測。

#### 建置期閘門(`npm run check:gate` 等)

| 檢查 | 結果 |
|---|---|
| `check:density-css`(新) | 333 seeds → **350** declarations(2 輪收斂)、512 省略 |
| `check:p4a` | **728** 條移除、45 檔 —— **與 D1 之前完全相同**(六項斷言一條未放寬) |
| `check:p4b` | 14 移除 / 7 新增 / 9 檔 —— 與 D1 之前完全相同 |
| `check:bytes` | **UNEXPLAINED 0**;`norm.css.dsp` 尾端 **14498 B**(D2 的 DSP 條件佔 84 B) |
| `check:build-css` | declarations **14478**(= 14128 + 350)、**files differing 0** |
| `check:baseline` / `check:doc-refs` | 86 檔相符 / 130 條連結全在版控裡 |

> **為什麼 `check:p4a` 需要 `density-delta.js`**:D1 是第三個已核准 delta,
> 而 P4a 的斷言之一是「規則區塊數不變」。第一次跑 D1 之後它報
> `rule-block count changed 258 -> 259` 並**跳過整個 `norm.css.dsp`**,728 掉成 **666**。
> 處置是沿用 P4b 對 P4a 的既有技法(把別階的 delta 先套到 baseline 側),
> **不是放寬斷言** —— 這一點在 `check-p4a-delta.js` 的檔頭已寫明。

#### 對 `iceblue_c 11.0.0` oracle 的靜態比對(D1 驗收的靜態層)

座標 `org.zkoss.theme:iceblue_c:11.0.0.FL.20260812-Eval`,實體 **282792 B**、
`norm.css.dsp` **71923 B**、`tablet.css.dsp` **25359 B** —— 三個數字都與
[L3.1(a)](#a-iceblue_c-1100-對同版預設主題逐檔比) 記的一致,身分可驗。

| 項目 | 結果 |
|---|---|
| oracle `:root` / 我們 `:root` token 數 | **862 / 862** |
| 只在任一側的名稱 | **0 / 0** |
| oracle 與我們 `:root` **值不同**的 | **333** |
| **我們覆寫塊的 350 條,值 ≠ oracle 的** | **0** |
| oracle 有差異但**沒進我們覆寫塊**的 | **0** |
| 我們覆寫塊裡 oracle 沒差異的 | **17**(= `var()` closure,正是預期的那 17 個) |

口徑:值比對前套用 `check-bytes.js` 的五個封閉序列化類別(前導零、零長度單位、
`;}`、空規則、空白),因為兩側分別由 `zklessc --compress` 與 CleanCSS level 0 產生。

#### 視覺 A/B 的**反向**控制(證明覆寫塊不外洩)

依 D1 的口徑,這裡要證明的是「沒設 `data-density` 時畫面 **0 差異**」:

```
A: d1-off (116 pages, 85 .css.dsp)   B: d1-on (116 pages, 85 .css.dsp)
theme finger: DIFFERENT  10ece0d16ed85599 / 425f4b21a78ec483
pages differing: 0      raster noise: 7 (全部 maxΔ 1,遠低於 ≤8 / ≤64px 的雜訊地板)
```

**theme finger DIFFERENT 是這一項成立的必要條件** —— 若兩側位元組相同,`0 差異`就是空轉。

#### D2 三態實測(`npm run check:density-property`,三次獨立啟停)

| `org.zkoss.zul.theme.density` | 服務出來的樣式表 | density 區塊 | `:root,` 前綴 |
|---|---|---|---|
| 未設 | 536718 B | 1 | **0** |
| `compact` | 536724 B | 1 | **1** |
| `foo`(亂值) | 536718 B | 1 | **0** |

`compact` 與另外兩態差 **6 B**,正好是 `:root,`。
亂值等同未設 ⇒ DSP 用的是 `eq` 而不是 `not empty`,zk.xml 打錯字不會整站變密。

#### D3 執行期實測(`npm run check:density-runtime`,Playwright)

語料 `/button.zul`,49 個 `.z-button`;`IceblueDensity` 送出的 JS 字串是**從 Java 原始碼解析出來**
再執行的(避免探針測到自己寫死的字串)。

| 步驟 | 量到 |
|---|---|
| [1] 預設 | `--zk-base-font-size=16px`,按鈕高 **38.0px** |
| [1] `apply(COMPACT)` | `12px`,按鈕高 **24.0px**;切換前設的 sentinel **仍在** ⇒ **沒有 reload** |
| [3] `apply(DEFAULT)` | 回到 `16px` / **38.0px**,**與初始逐值相同** |
| [2] 區域 `div.z-div` | 區域內 `16px→12px`、高 `38.0→24.0`;**區域外 `16px→16px`、高 `38.0→38.0`(沒有外洩)** |
| [5] 同區域收回 | 對同一個區域再設 `default`:`12px→16px`、高 `24.0→38.0`,**逐值回到 [2] 之前** |
| [4] library-property 於**載入時** | `12px` / **24.0px** —— **與 [1] 的執行期切換逐值相同** |

[4] 是兩個機制的交叉驗證:D2 的靜態路徑與 D3 的執行期路徑落在**同一組數字**上。
[5] 守的是 `DEFAULT` 在區域層**唯一有效**的用途(收回同一區域先前的 `COMPACT`);
**沒有**驗收「compact 祖先底下的 default 區域」,那已裁示不支援,見 [L3.1(g)](#g-巢狀反向覆蓋不支援已裁示)。

#### 負向控制(證明這些檢查看得見錯誤)

| 注入的錯誤 | 觸發的斷言 |
|---|---|
| 刪掉 closure 裡的一條 | `--zk-base-font-size is in the closure but not emitted` |
| 把一條的值改成 `_default.css` 的 | `--zk-font-size-large is "round(down, …)", _compact.css says "16px"` |
| 塞一條 closure 外的 token | `--zk-base-border-radius is emitted but not in the closure` |
| **把 closure 演算法截成只有種子(333)** | `--zk-container-body-text-size is omitted but reads --zk-font-size-medium, which the block re-declares` |

> **最後一項是本階最重要的發現**:計畫書列的四項斷言,對一個被截成 333 條的覆寫塊
> **全部通過**。四項檢查的是「塊內部自洽」(塊讀到的東西都有被重新宣告),
> 但真正讓「512 條可以安全省略」成立的是**反方向**的性質:
> **被省略的那 512 條,不能讀到塊有改的任何東西**。因此加了第 5 項斷言。

---

### L3.6 Change Log

| 日期 | 變更 |
|---|---|
| 2026-08-12 | 建檔。全部量測為本輪實測(`iceblue_c.jar` 對 `baseline/` 逐檔比、token closure 推導、palette 正交性、tablet 結構差異、gzip 成本),尚未動任何來源檔,閘門未跑 |
| 2026-08-12 | **口徑修正 + `zk.version` 升 11.0.0。** 建檔時的 oracle 是 `iceblue_c 10.3.0.1`,對 10.4 期的 `baseline/` 比 ⇒ 量到的是版本落差疊在 density 差異上。改用 `iceblue_c 11.0.0.FL.20260812-Eval` 對**同版**預設主題重量。**推翻**:「出貨中的 `iceblue_c` 少 8 個元件 CSS 與 20 個 severity token」是版本落差的假影,同代之下 **862/862、severity 20/20、缺 0 個元件**;L3.2 的〈漂移是否已經發生〉列改寫為〈釋出節奏是否已經落後〉。**未動搖**:333 / 350 / 512 closure、tablet 的 67+27 與 95=95、palette 重疊 0 —— 全部在新 oracle 下逐字重現。體積數字微調(14414→14412 B,gzip +2559→+2540 B)。連帶把 `zk.version` `10.4.0-jakarta.FL.20260713-Eval` → `11.0.0-jakarta.FL.20260811-Eval`,artifact 版本與三個 version-uid → `11.0.0-Eval`;**`check:gate` 前後數字完全相同**(313/313、P4a 60 deferred、P4b 9 檔/−14/+7),`visual:selftest` 116 頁 PASS |
| 2026-08-12 | **裁示 L3.4 第 1 項:屬性字彙為 `default` / `compact`**(列舉 `Density.DEFAULT("default")`),推翻本文件原本建議的 `comfortable`。原建議的唯一依據是「與 Marble 對齊」,但 Marble 尚未公開發行 ⇒ 對齊方向的成本為零,該理由不成立;而 `default` 與本主題的 `_default.css` / `_compact.css` 及 `iceblue_c` 的既有語彙一致。**代價已記錄**:Marble 的 `COMFORTABLE("comfortable")` 自此與本主題不同字彙,若 L3.4 第 2 項日後裁示升格為跨主題 API,須由 Marble 改過來(跨 worktree 後續事項,本計畫不動 Marble 任何檔案)。連帶更新 D3 的介面草圖與巢狀驗收敘述 |
| 2026-08-12 | **新增 L3.1(e-2):compact 的 tablet 規則不是「比較小的 tablet」。** 回答「compact 有沒有 tablet 專屬規則」時實測發現:除了 27 條只在 compact 的規則之外,共用選擇器裡有 **70 條宣告不同**,而且 **compact 的值經常比 default 大** —— `.z-colorpalette` 桌面 compact 260×226(default 340×300),平板 compact 卻是 **586×460**(平板 default 304px)。成因是 `tablet.css.dsp` 是**相對於各自桌面基準的觸控補償層**。**不動搖** D4 的作法與驗收(oracle 逐條比對本來就是唯一判準),但補上兩件事:驗收不得用「有沒有變密」當訊號、D5 遷移指南在平板層不要把它寫成密度。同時修正 (e) 的口徑:274/695/227/638 把 14 與 10 個 `browserDefault` DSP 區塊算成了 CSS 規則,純 CSS 是 260/681/217/628;共用數 189 → **188**。**67 與 27 未變**(D4 驗收清單長度正確) |
| 2026-08-12 | **artifact 版本拿掉 `jakarta` 標記**(`11.0.0-jakarta-Eval` → `11.0.0-Eval`,含三個 version-uid)。裁示:主題沒有用到 Java EE API,只有一個版本,不需要區分 javax/jakarta —— 實測佐證 `src/main/java` 只有 2 個檔、**0 個 `javax.`/`jakarta.` import**,編出來的 class 兩邊通用。`zk.version` 的 `-jakarta` **保留**(那是 ZK core,真的有 servlet API 分歧)。另裁示:`10.4.0` 從未公開發行,依公司政策一律標 `11.0`。重跑 `check:gate` 與 `visual:selftest` 皆 PASS |
| 2026-08-12 | **D1 / D2 / D3 完工(3 / 5)。** 新增 `scripts/gen-density-css.js`(產生 350 條覆寫塊)、`scripts/density-delta.js`(讓 P4a/P4b/byte 三個閘門把 D1 這第三個 delta 減掉)、`scripts/check-density-property.js`(D2 三態)、`scripts/check-density-runtime.js`(D3 Playwright)、`src/main/java/.../IceblueDensity.java`。全部驗收數字見 [L3.5](#l35-d1d3-的驗收證據)。**三個計畫書沒預料到的發現**:(1) `check:p4a` 有一條「規則區塊數不變」的斷言,D1 一加區塊就報 `258 -> 259` 並跳過整個 `norm.css.dsp`,728 掉成 **666** —— 用 P4b 既有的「把別階 delta 套到 baseline 側」技法解決,**沒有放寬任何斷言**;(2) 計畫書列的四項斷言,對一個**被截成 333 條**(只有種子、沒跑閉包)的覆寫塊**全部通過** —— 四項只檢查「塊內部自洽」,真正讓「512 條可安全省略」成立的是反方向的性質,因此加了第 5 項斷言,並以負向控制證明它會觸發;(3) `density-delta` 起初把 D2 那個 DSP 條件裡 `${…}` 的 `{` 當成第二個規則區塊,使 `check:bytes` 進 FAIL,已修正。體積實測 **14414 B**(D1)/ **14498 B**(含 D2 的 DSP 條件),與計畫書記的 14412 B 差 2 B,以實測為準 |
| 2026-08-12 | **新增 L3.1(g) + L3.4 第 5 項:巢狀反向覆蓋做不到,`Density.DEFAULT` 目前是空頭支票。** 做 D3 時發現:出貨的樣式表只有 `[data-density="compact"]` 一個區塊,所以「外層 compact、內層 `data-density="default"`」的內層**match 不到任何規則**,直接繼承外層算好的 compact 值。全站那一支(把 `<html>` 的屬性設成 `default`,讓 compact 選擇器選不到)是**對的**,所以精確的說法是「可以關掉全站 compact,不能在巢狀範圍反向覆蓋」。CSS 沒有別的辦法(`revert-layer` 會落回繼承值,而且本分支無 cascade layer)。補一個 `[data-density="default"]` 區塊的成本實測 **+15331 B raw / +1887 B gzip**(比 compact 區塊大,因為 default 側的值帶 `round()`/`calc()`)。**另實測 Marble 完全一樣**:全樹只有一個 `[data-density="compact"]`,沒有任何 `comfortable` 選擇器,但 `doc/spec/data-dense-mode.md` 明寫可以反向覆蓋、`MarbleDensity.Density.COMFORTABLE` 也存在 ⇒ Marble 的同一功能同樣是空頭支票,應回報(本計畫不動 Marble 的檔案)。D3 的巢狀驗收條列改標 OPEN,其餘 D3 驗收全部通過 |
| 2026-08-13 | **裁示 L3.4 第 5 項:不補 `[data-density="default"]` 區塊,巢狀反向覆蓋列為不支援。** 理由:+15331 B raw / +1887 B gzip(風險表第 2 項 14.4 KB → ~29.7 KB)換一個**沒有已知需求**的能力;而且這個能力**從來沒有存在過** —— 它是計畫書寫下的意圖而非既有行為,所以不支援不是功能倒退。`Density.DEFAULT` **保留**,語意縮小成它真的做得到的兩件事:(a) 關掉全站 compact、(b) 收回**同一個區域**先前設過的 `COMPACT`。**不讓 `apply(component, DEFAULT)` 丟例外** —— (b) 是合法呼叫,而「有沒有 compact 祖先」是客戶端狀態,伺服器端 Java 無從判斷,所以用文件處理而非執行期檢查。連帶:`IceblueDensity` 的 class javadoc 新增〈Compact nests; opting back out of it does not〉一節並建議「讓全站維持預設、只標記要變密的區域」,`Density.DEFAULT` 與 `apply(Component, Density)` 的 javadoc 改寫;`readme.md` 明寫不支援;`check-density-runtime.js` **新增第 [5] 項正向驗收**(同區域 `COMPACT` → `DEFAULT` 必須逐值還原,實測 `12px→16px` / `24.0→38.0` PASS),並在檔頭寫明**不驗收**不支援的那一半。D3 的巢狀驗收條列刪除,D3 狀態從「DONE(巢狀那一條 OPEN)」轉為 **DONE** |
| 2026-08-13 | **裁示 L3.4 第 2、3、4 項 —— L3.4 五項自此全部結案。** ①**第 2 項:Java API 放主題套件 `org.zkoss.theme.iceblue11`,不升格 ZK core**,與原建議一致 ⇒ **零實作工作**(`IceblueDensity` D3 完工時就在那裡);連帶把 **M-1** 的觸發條件 (a)「density API 升格為跨主題契約」在本案內排除,M-1 只剩 (b)「Marble 首次公開發行前」。②**第 3 項:`iceblue_c` 未來不出貨,推翻原建議的「保留但凍結、標 deprecated」。** 依據是本文件已量到的重複度(97.5% 逐 byte 複本)與釋出落後(整條 10.4.0 線未出貨);**本 repo 不改任何來源檔** —— `iceblue_c` 是另一個出貨物,本模板從未產生它,交付物只有 P8 migration guide 的一段:`preferred=iceblue_c` 的存量客戶改用 `preferred=iceblue11` + `org.zkoss.zul.theme.density=compact`。③**第 4 項:`tokens/_compact.css` 維持公開可覆寫。** 原建議「與 palette 合併決定」因 palette 同日移出本案(M-2)而失效,故獨立裁示;**公開有兩個面且都成立**,D5 要分開寫進 migration guide —— 建置期(fork 改 `_compact.css` 後**必須重跑 `npm run gen:density-css`**,否則 `check:density-css` 在 `check:gate` 裡 exit 1;jar 只出 `.css.dsp`,P5 實測 85/0)與執行期(那 350 條在 `norm.css.dsp` 的 `[data-density="compact"]` 區塊,後載入的 sheet 蓋得掉,構造與 M-2 對 palette 的結論相同,**不需要任何 hook**)。**三項都不動 CSS 來源檔,閘門未跑也不需要跑** |
| 2026-08-14 | **L-4 整體拍板:採用。P7 的 BLOCKED 解除,本案自此沒有任何階段被決策擋著。** 裁示內容:採用 `data-density` 屬性 + 350 條 runtime token 覆寫,取代 build 期 `@themeProfile` 換 jar;`iceblue_c` 未來不出貨。**這不是「決定要不要相信提案」,而是把已經量出來的事實寫成裁示** —— D1–D3 早已完工,對 `iceblue_c 11.0.0` oracle 逐 token 比對 **350 條值全同、缺 0 條**,視覺 A/B 反向控制 0 頁差異,L3.4 五項子未決亦於 2026-08-13 全數結案;缺的只是正式的狀態變更,而狀態變更是決策。**同時確認的兩件對外事實**:(a) 這是 **breaking change**(「改 LESS 變數重編 jar」→「設 library-property `org.zkoss.zul.theme.density=compact`」),存量 `preferred=iceblue_c` 客戶要遷移,交付物是 **D5** 的 migration guide;(b) **承接的風險是 D4 而不是 D1–D3** —— tablet 不是 token 值替換(`var()` 用量兩側 95 = 95),67 條只在 default 側的規則必須逐條中和,驗收是那 67 條**全部**對 oracle 做 mobile UA computed-style 比對全綠。**本次裁示不動任何 CSS 來源檔,閘門未跑也不需要跑**;文件更動見進度文件〈已解除的 BLOCKED〉、計畫書 §P7〈前置〉與附錄 L3-F,狀態層記為 **S57** |
| 2026-08-17 | **D4 完工,但機制與驗收都不是本文原訂的那一套(裁示 C23)。** 原訂「compact 加 `[data-density="compact"]` 前綴 + 67 條逐條中和」,實際採用「兩張完整的表各包一個 `<c:if>`,由 library-property 二選一,中和一條都不做」。**推翻的依據是量出來的兩件事**:① **那份 67 條清單的單位是錯的** —— 決定會不會漏的是 **(單一選擇器, 屬性)** 對而不是選擇器字串,逗號群組會把漏的藏起來(`.z-a,.z-b{x}` 對 `.z-a{x}` 算「共用」卻漏掉 `.z-b`);逐對重量得 default **895** / compact **869** / 兩側都有 **708**,⇒ **只在 default 的是 187 條宣告、113 個選擇器**,是被點名那份的近 3 倍,而沒被點名的部分**沒有任何東西看得見**。② **CSS 沒有「不存在」運算子** —— 那 187 條在 compact 下要的是不存在而不是被蓋掉,這正是 P5 處理 `browserDefault` 得到的結論。**同時發現 compact 那張表可以從本 repo 逐條重建**:編譯輸出對出貨中的 `iceblue_c 11.0.0` 是 **606 = 606 條宣告、缺 0 多 0 值異 0**,⇒ 驗收得以從「67 條瀏覽器比對」升級為**三態全量比對**(`unset`/`foo` 對 `baseline/` **895 = 895**、`compact` 對 jar **869 = 869**),並附 `ne`/`eq` 對調的負向控制。**付出的代價寫在明處**:執行期 `data-density` 屬性不驅動平板層(只有 library-property),`IceblueDensity` 的 Javadoc 已改寫;這一格今天本來就是壞的(D1–D3 之後 `apply(COMPACT)` 已經是桌面 compact + 平板 default),日後要補是純附加。**順帶更正 L3.1(e) 的口徑**(260/681/217/628 → **246/667/207/618**,差額是 DSP 區塊的 `${…}` 自帶的 `{}`,見 S61)。commit `238a3604`,閘門紀錄 **#61**,執行細節 [d4-tablet-density.md](d4-tablet-density.md) |
| 2026-08-17 | **規格裁示:平板層只支援 library-property 切換,Java API 不驅動它,且不列入待辦(C24)。** D4 收工時把這件事寫成「代價」與「日後純附加的待辦」,本裁示把它升格為**規格**。**理由是前一版本來就只有這個規格** —— `@themeProfile` 時代切 compact 要改 LESS 變數、重編 jar、換 jar,平板層從來沒有過任何執行期切換 ⇒ 本版是**同等能力、便宜非常多的機制**(一個 property 取代第二個出貨 jar),不是能力損失。唯一新增的不對稱是**桌面層多拿了**執行期切換,不是平板層少了一格。**連帶效果**:那 187 條寫回(含 60 條只能實測寫死的)全部不必做 —— 它們只在「要讓執行期屬性也驅動平板層」時才存在。評估過的三個作法與實測數字保留在 `tasks/d4-tablet-density.md` L2.3 與 `tasks/d4-tablet-runtime-explainer.html`,**留作日後若規格真的改變時的成本估算,不是路線圖**。**本裁示不動任何 CSS 或 Java 邏輯**(現行實作已經就是這個規格),閘門不需要重跑;`IceblueDensity` Javadoc 已改寫為規格語氣,**D5 的 migration guide 要正面寫這條規格** |
