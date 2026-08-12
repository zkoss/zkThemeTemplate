# 專案進度與執行結果報告:L-4 density 機制 D1–D3

> 語彙與量測口徑沿用 [l4-density-mechanism.md](l4-density-mechanism.md)。
> **所有數字的完整證據在該文件的 [L3.5](l4-density-mechanism.md#l35-d1d3-的驗收證據)**,本報告不重複列表,只講「做了什麼、發現了什麼、還缺什麼」。

## 一、 執行總覽 (Executive Summary)

* **當前狀態:** **完成帶建議 (PASS-WITH-FINDINGS)** —— D1 / D2 / D3 三階完工並驗收,**3 / 5**;
  D4 / D5 **BLOCKED**(相依於 P7 的 tablet 轉 CSS,本輪不可能開工)。
* **核心結論:** 桌面 compact 已經從「第二個 282.8 KB 的 jar + 換主題重載頁面」變成
  **`norm.css.dsp` 尾端的一個 350 條 token 覆寫塊 + 一個屬性**,可靜態(library-property)、
  可執行期(Java API)、可只套一塊畫面、**不需要 reload**。
  對 ZK 出貨的 `iceblue_c 11.0.0` 逐 token 比對 **350 條值全同、缺 0 條**。
* **關鍵產出:**

  | Commit | 內容 |
  |---|---|
  | `63fb1d4e` | **D1** 產生器 + 350 條覆寫塊 + 三個閘門的 delta 感知 |
  | `0cc3334b` | **D2** `org.zkoss.zul.theme.density` library-property + 三態實測 |
  | `92fff6d4` | **D3** `IceblueDensity` + Playwright 執行期實測 + L3.5 證據章 |
  | `6f28116c` | 進度文件同步 |

---

## 二、 完成項目與當前狀態 (Completed Items)

### D1 桌面 token 層

* `scripts/gen-density-css.js` —— 從 `tokens/_default.css` 與 `tokens/_compact.css` 推導,
  產出 `tokens/_density-compact.css`(**333 種子 → 350 閉包,2 輪收斂,512 省略**),
  併入 `norm.css` **最尾端**(選擇器與 `:root` specificity 打平,來源順序是唯一裁判)。
* `scripts/density-delta.js` —— 讓 `check:p4a` / `check:p4b` / `check:bytes` / `check:build-css`
  把 D1 這個**第三個已核准 delta** 減掉。用的是 P4b 對 P4a 的既有技法(套到 baseline 側),
  **P4a 六項斷言一條未放寬**。
* 閘門:`check:gate` 全綠(**P4a 728、P4b 14**,與 D1 之前相同)、
  `check:bytes` **UNEXPLAINED 0**、`check:build-css` **14478 條 / files differing 0**。
* Oracle:`iceblue_c 11.0.0.FL.20260812-Eval` —— **862/862 名稱、333 值不同、
  我們 350 條值 ≠ oracle 的有 0 條、oracle 有差異但沒進覆寫塊的有 0 條**。
* 視覺 A/B **反向**控制:theme 指紋 DIFFERENT、**0 頁差異** ⇒ 覆寫塊不外洩到預設狀態。

### D2 靜態設定

* DSP 條件放在選擇器位置(與既有 `browserDefault` 同技法,`build-css.js` 第四個 placeholder)。
* 用 `eq` 而非 `not empty`:**zk.xml 打錯字不會整站變密**。
* `npm run check:density-property` —— 三次獨立啟停實測:
  未設 / 亂值皆 **0** 個 `:root,` 前綴,`compact` 為 **1**,兩者差 **6 B**(正好 `:root,`)。

### D3 Java API

* `IceblueDensity.apply(Density)` / `apply(Component, Density)`,字彙 `default` / `compact`。
* **不動任何 CSS ⇒ 閘門數字完全不變**(這本身就是 D3 的驗收條件之一,已確認)。
* `npm run check:density-runtime`(Playwright,49 個 `.z-button`):
  16px/38.0px → 12px/24.0px、**sentinel 存活(沒有 reload)**、`DEFAULT` 逐值還原、
  **區域內變密而區域外完全不動**、library-property 於載入時落在**同一組數字**。
* 探針執行的 JS 字串是**從 Java 原始碼解析出來**的,避免探針測到自己寫死的字串。

---

## 三、 例外情況、發現與數據修正 (Findings & Corrections)

### 1. `check:p4a` 有一條計畫書沒預料到的斷言,D1 一加區塊就踩到

* **現象與實測:** D1 第一次跑閘門,`check:p4a` 報
  `zul/css/norm.css.dsp: rule-block count changed 258 -> 259` 並**跳過整個檔**,
  728 條移除掉成 **666**。
* **根因分析:** P4a 的第 5 項斷言(「移除後同一個規則區塊裡仍有無前綴同伴」)靠
  **per-block-instance 索引**對齊兩側,前提是「移除永遠不會增減區塊」。D1 打破了那個前提。
* **影響範圍:** 無殘留影響。處置是沿用 P4b 對 P4a 的既有技法把 D1 套到 baseline 側,
  **沒有放寬任何斷言**,728 / 14 全部回復。

### 2. 計畫書列的四項斷言,對一個「被截成 333 條」的覆寫塊**全部通過**

* **現象與實測:** 負向控制刻意把閉包演算法截掉傳遞那一輪(只留 333 個種子),
  四項斷言**全綠**,產生器照樣寫檔。
* **根因分析:** 四項檢查的都是**塊內部自洽**(塊讀到的東西都有被重新宣告);
  真正讓「512 條可以安全省略」成立的是**反方向**的性質 ——
  **被省略的那 512 條,不能讀到塊有改的任何東西**。
* **影響範圍:** 已加第 5 項斷言並以負向控制證明會觸發
  (`--zk-container-body-text-size is omitted but reads --zk-font-size-medium…`)。
  **這一項若沒被抓到,會是一個「閘門全綠但 compact 下部分元件仍是預設尺寸」的靜默錯誤。**

### 3. `density-delta` 把 DSP 運算式裡的 `{` 當成第二個規則區塊

* **現象與實測:** D2 加上 `<c:if test="${'compact' eq …}">` 之後,
  `check:bytes` 進 **FAIL**(`D1: 2 rule block(s), expected 1`)。
* **根因分析:** 區塊計數直接數 `{`,而 EL 運算式本身帶著一組大括號。
* **影響範圍:** 已修(先剝 DSP 標籤再數),`check:bytes` 回到 UNEXPLAINED 0。
  **是誤報,不是真的多一個區塊。**

### 4. 數據更正(皆**不影響任何結論**)

| 項目 | 計畫書原記 | 本輪實測 | 說明 |
|---|---|---|---|
| 覆寫塊大小 | 14412 B | **14414 B**(D1)/ **14498 B**(含 D2 的 DSP 條件) | 序列化細節差 2 B;D2 的條件佔 84 B |
| 兩個 profile 的 token **順序** | 「名稱與順序相同」 | 名稱**集合**相同,但**順序在 index 621 起分歧** | 只影響敘述;閉包與輸出都不依賴順序 |

---

## 四、 ⚠️ 待決策與裁示事項 (Decisions Required)

### 議題一:要不要補 `[data-density="default"]` 區塊(擋著 D3 的巢狀驗收)

* **背景狀況:** 計畫書 D3 寫著 `Density.DEFAULT` 的「唯一用途是巢狀反向覆蓋」,
  但 D1 只出貨 `[data-density="compact"]` 一個區塊 ⇒
  「外層 compact、內層 `data-density="default"`」的內層 **match 不到任何規則**,
  直接繼承外層算好的 compact 值。
  **全站那一支是對的**(把 `<html>` 屬性設成 `default`,compact 選擇器就選不到)。
  CSS 沒有別的辦法(`revert-layer` 會落回繼承值,且本分支無 cascade layer)。
  完整例子見 [L3.1(g)](l4-density-mechanism.md#g-巢狀反向覆蓋d3-的-densitydefault-目前是一張空頭支票)。
* **影響與風險:** 不處理 ⇒ `apply(component, Density.DEFAULT)` 是個**靜默的 no-op**,
  API 存在但不做事,使用者只能從畫面猜。
* **方案選項:**
  * **【選項 A】補上 default 區塊(建議):** 產生器同時輸出 350 條 compact + 350 條 default。
    ｜ **代價:** `norm.css.dsp` **+15331 B raw / +1887 B gzip**
    (風險表第 2 項的「每人多付 14.4 KB」變成 **~29.7 KB**)。
  * **【選項 B】不補,縮小 `DEFAULT` 的語意:** Javadoc 與 D5 遷移指南明說
    「區域級反向覆蓋不支援」。｜ **代價:** 0 位元組,但 API 的表達力比計畫書承諾的小。

> **附帶發現(需另案處理):Marble 有完全一樣的洞。** 實測 Marble 全樹只有一個
> `[data-density="compact"]`、**沒有任何 `comfortable` 選擇器**,但
> `doc/spec/data-dense-mode.md` 明寫「a closer descendant can override it back to `comfortable`」,
> 且 `MarbleDensity.Density.COMFORTABLE` 存在。⇒ **Marble 的同一功能同樣是空頭支票。**
> 本輪**沒有動 Marble 的任何檔案**(L3.4 第 1 項已定調),建議另開一項回報。

### 議題二:P7 的 BLOCKED 是否正式解除

* **背景狀況:** P7 的解除條件是「知道 compact 走 runtime 屬性、而非 build 期換 jar」。
  D1–D3 完工之後,那件事**不只是提案,而是已實作、已對 oracle 驗證過的既成事實**。
* **影響與風險:** P7 不解除 ⇒ **D4 / D5 永遠開不了工**,L-4 停在 3/5,P8 也跟著停。
* **方案選項:**
  * **【選項 A】正式裁示解除(建議):** 把 L2.2 的 P7 那一列從 BLOCKED 轉 TODO。
    ｜ **代價:** 0,只是把既成事實寫成裁示。
  * **【選項 B】等 L-4 整體拍板再一起解:** ｜ **代價:** L-4 的最後兩階持續停擺。

> 本輪**沒有**擅自更動 P7 的狀態 —— 狀態變更是決策。進度文件已把「條件在事實層面已滿足」寫明。

---

## 五、 未完成與下一步工作 (Outstanding Tasks & Next Steps)

* [ ] **裁示議題一** ── *目的:決定 `Density.DEFAULT` 的語意,D3 才能真正結案。*
* [ ] **裁示議題二** ── *目的:解開 P7,否則 D4 / D5 沒有起點。*
* [ ] **D4 tablet 半**(等 P7 完工)── *目的:讓同一個屬性也管平板層,消滅 S36 的分裂主題。*
      **這一階仍是全案風險最高的**:67 條「只在 default」的規則必須**逐條中和**,
      且驗收不能用「有沒有變密」當訊號(平板 compact 有些地方本來就比 default 寬)。
* [ ] **D5 收尾**(等 D4)── *目的:移除 build 期旋鈕、改寫 `readme.md` 的遷移章、正式關閉 S36。*
* [ ] **回報 Marble 的巢狀反向覆蓋落差** ── *目的:規格書承諾了 CSS 沒實作的行為。*

> **本輪已先做的一件 D5 相關的事**:`readme.md` 的〈switch to compact profile〉章
> **加了一節**說明 library-property 與 Java API,並明說**平板層還沒涵蓋、compact 仍須設兩處**。
> 這**不是** D5 的整章改寫(那要等 D4 之後 build 期旋鈕真的消失),
> 只是避免「功能上線但使用者找不到」。
