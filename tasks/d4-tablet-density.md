# D4 —— tablet 密度層(執行計畫)

> 本檔是 [`l4-density-mechanism.md` §D4](l4-density-mechanism.md#d4-tablet-半風險最高) 的執行細節,
> 也是 **P7 第二段**([計畫書 §P7](../doc/iceblue-drop-less-execution-plan.md#p7--tablet--themeprofile))。
> §D4 訂的機制在本輪實測後**改了一半**,理由與證據見 L2;裁示記為 **C23**。

---

## L1 執行摘要

### 核心結論

**compact 的平板樣式表可以從本 repo 的來源逐條重建出來 —— 而且它就是出貨中的 `iceblue_c 11.0.0`。**
量到的結果是 **606 條宣告全同、缺 0、多 0、值不同 0**。

這一條事實把 D4 從「改寫 + 逐條人工比對」變成「**兩張完整的表,由伺服器端條件二選一**」:

| | §D4 原訂 | 本計畫 |
|---|---|---|
| 機制 | compact 那套加 `[data-density="compact"]` 前綴 | 兩套各自包在 `<c:if>` 裡,依 library-property 二選一 |
| 只在 default 側的規則 | **逐條中和**(明確寫回非平板的值) | **不需要** —— 整段不輸出 |
| 中和清單長度 | 67 條規則 | 實測應為 **113 個選擇器 / 187 條宣告**(§D4 的 67 是錯的口徑) |
| default 模式的輸出 | 會變(多前綴) | **逐 byte 不變** |
| compact 模式的輸出 | 需在瀏覽器逐條驗 | **逐 byte 等於 `iceblue_c` 出貨檔**(序列化類別除外) |
| 驗收 | 67 條 mobile UA computed-style 比對 | **靜態、全量**:895 + 869 條宣告全部進帳 |
| 代價 | —— | 執行期 `data-density` 屬性**不驅動平板層**(見 L2.3) |

### 交付物

| 檔 | 動作 |
|---|---|
| `src/main/resources/web/zkmax/css/_tablet-compact.css` | 新增(採用編譯輸出,與 P3/P7 同一套做法) |
| `src/main/resources/web/zkmax/css/tablet.css` | 頭尾各加一個條件標記 + 末尾 `@import` |
| `src/main/resources/web/zkmax/less/` | **整棵刪除**(26 個 compact partial)⇒ zkmax 側 LESS 歸零 |
| `scripts/build-css.js` | 4 個新 placeholder |
| `scripts/tablet-delta.js` | 新增 —— D4 的已核准 delta,推導而非快照 |
| `scripts/check-{p4a,p4b,bytes,build-css}*.js` | 各接上第四段 delta |
| `scripts/check-tablet-density.js` | 新增 —— 三態實測(DSP 求值只有跑起來才問得到) |

### 閘門

**G-delta**:`zkmax/css/tablet.css.dsp` **1 檔,0 移除,606 新增**。
形狀與 D1 完全一樣(1 檔 / 0 移除 / 350 新增),這不是巧合 —— 兩者都是「整段附加,不動既有宣告」。

---

## L2 為什麼機制要改

### L2.1 §D4 的「67 條」是錯的口徑,而且錯得會漏

§D4 的中和清單長度取自「**只在 default 側出現的選擇器字串**」= 67(本輪重量為 66,差異見 L3.1)。
但決定「compact 模式下會不會漏」的單位不是選擇器字串,是 **(單一選擇器, 屬性) 對**:

- `.z-a,.z-b{font-size:15px}`(default)對 `.z-a{font-size:14px}`(compact)是「**共用**選擇器」,
  不進那 67 條 —— 但 `.z-b` 的 `font-size` 照樣漏過去。
- 共用選擇器裡「default 有宣告、compact 沒有」的另有 **10 條規則 / 14 條宣告**。

逐 (選擇器, 屬性) 重量的結果:

| | 條數 |
|---|---|
| default 側宣告總數 | **895** |
| compact 側宣告總數 | **869** |
| 兩側都有 | **708**(值相同 633 / 值不同 75) |
| **只在 default(屬性機制下會漏)** | **187**,散在 **113** 個單一選擇器 |
| 只在 compact(新增,無害) | 161 |

⇒ 照 §D4 執行,會有 **187 條**要人工寫回,而計畫只點名了其中一部分;
**漏掉的那些沒有任何東西看得見**,因為驗收清單本身就是那份不完整的名單。

### L2.2 CSS 沒有「這條規則不存在」這個運算子 —— 本案早就裁示過

P5 處理 `browserDefault` 時已經寫下同一句話(`build-css.js` 檔頭):

> `html` / `body` / `main` 在內嵌情境下**不能被 scope,必須不存在**,而 CSS 沒有「不存在」運算子。
> **只有伺服器端條件能刪掉一條規則。**

那 187 條在 compact 模式下要的正是「不存在」。「寫回非平板的值」是對「不存在」的**近似**:
它要從其他 84 個樣式表的層疊裡推導出 187 個值,推完之後**沒有任何自動化盯著它們**,
上游任何一次改動都會讓它靜默失準。本案已經有一項(A3)是「只靠文字擋著」,不該再加一項大 3 倍的。

### L2.3 換來的代價,以及為什麼付得起

**執行期 `IceblueDensity.apply(COMPACT)` 不會切換平板層。** 平板層只認 library-property。

付得起的三個理由:

1. **區域級 density 對平板本來就已裁示不支援**(§D4 自己寫的),所以少掉的只有「整站、執行期」這一格。
2. **要保住那一格的兩種寫法都要對 default 模式動刀**,而 default 模式是 100% 現有使用者所在的路徑:
   - `:where(html:not([data-density="compact"]))` 前綴 —— 零特異性,但 `:where()` 等於把主題的
     瀏覽器下限拉到 Safari 14 / Chrome 88,而 **L-2 拍板的是選項 C:不收窄 ZK 本體的支援範圍**。
     選擇器語法不被認得時是**整條規則被丟棄**,不是優雅降級 —— 舊 iOS 會整層觸控補償消失。
   - `html:not([data-density="compact"])` 前綴 —— 沒有語法問題,但 246 條規則各加 (0,1,1) 特異性,
     可能讓現在**輸給**桌面表的平板規則翻盤。`.z-column-content` 一族 5 分鐘內就找得到疑似案例,
     ⇒ 這條路要靠瀏覽器實測才能宣告中性,而那正是本方案不必做的事。
3. **這一格今天本來就是壞的,而且本方案是嚴格改善**:D1–D3 收工後,`apply(COMPACT)` 已經是
   「桌面 compact + 平板 default」。本方案把 library-property 那條路修好,沒有把任何一條路弄壞。
   日後要補執行期那一格,是**純附加**(再加一段屬性前綴的規則),不擋任何事。

### L2.4 機制

```
<%@ taglib … %>                                     ← build-css.js 注入,位置不變
<c:if test="${'compact' ne c:property('org.zkoss.zul.theme.density')}">
  … 現行 246 條 default 規則,一個字元都不動 …
</c:if>
<c:if test="${'compact' eq c:property('org.zkoss.zul.theme.density')}">
  … 207 條 compact 規則,逐字採用編譯輸出 …
</c:if>
```

- **`ne` / `eq` 成對,不用 `not empty`** —— 與 D2 同一個理由:`zk.xml` 打錯字必須表現得像沒設,
  不能靜默切成 compact。三態實測(unset / compact / foo)是這句話的證據。
- **兩段互斥** ⇒ 任一模式下服務出去的位元組量與今天同級(~27 KB),不是 53 KB。
  **原估的 ~53 KB 是「兩套都輸出」的估法**,本方案不適用(§D4 的成長估算隨機制一起作廢)。

---

## L3 執行步驟與驗收

### L3.1 已完成的量測(2026-08-17)

| 量測 | 結果 |
|---|---|
| compact profile 編譯輸出 vs `iceblue_c 11.0.0` 的 `tablet.css.dsp` | **606 = 606 條宣告,缺 0 / 多 0 / 值不同 0** |
| 位元組 | 25258 vs 25359(差 101 = taglib header 192 B - 序列化差 91 B);差異全落在既有的封閉序列化類別 |
| default 側 vs compact 側,規則區塊 | 246 / 207(§D4 記 260 / 217,差額 = 14 / 10 個 `browserDefault` DSP 區塊,見下) |
| default 側 vs compact 側,宣告 | 667 / 618(§D4 記 681 / 628,同樣差 14 / 10) |
| 只在 default 的選擇器字串 | **66**(§D4 記 67) |
| 只在 default 的 (選擇器, 屬性) 對 | **187 / 113 個選擇器** |
| 能命中 `<html>` 的 default 規則 | **2 條,且兩側逐字相同** ⇒ 任何前綴方案都要特判,本方案不必 |
| CleanCSS level 0 對 `:where()` / 屬性選擇器 | 0 error / 0 warning,原樣輸出(備查,本方案未採用) |

> **口徑更正**:§D4 / L3.1(e) 的 260 / 681 / 217 / 628 是把 `browserDefault` 的 DSP 前綴
> 當成獨立規則區塊算出來的。純 CSS 的真值是 **246 / 667 / 207 / 618**。
> **不動任何結論** —— 差額正好等於該節自己記的 14 與 10 個 DSP 區塊。

### L3.2 步驟

1. `_tablet-compact.css` —— 由 compact profile 編譯輸出採用;`//` 註解先轉 CSS 註解再編譯(P7 第一段的做法),`.ZKBD ` 遮罩,不留空殼規則。
2. `tablet.css` —— 頭尾加 `/*!ZKDENSITY-DEFAULT-START*/` / `END`,末尾加 compact 段與 `@import`。
3. `build-css.js` —— 4 個 placeholder;`tablet.css` 已在 `PLACEHOLDER_SOURCES` 內。
4. 刪 `zkmax/less/`。
5. `tablet-delta.js` + 四個 checker 接線。
6. `check-tablet-density.js` —— 三態,mobile UA。

### L3.3 驗收(全部要綠)

| 項 | 判準 |
|---|---|
| `check:gate` | exit 0 |
| `check:bytes` | `UNEXPLAINED: 0` |
| `check:build-css` | 85/85 真實來源,passthrough 0 |
| **D4 delta 形狀** | `zkmax/css/tablet.css.dsp` **1 檔 / 0 移除 / 606 新增**,不多不少 |
| **default 路徑 G-zero** | 三態的 unset 與 foo,服務出去的位元組**逐 byte 等於 `baseline/`** |
| **compact 路徑對 oracle** | 三態的 compact,對 `iceblue_c 11.0.0` 的 `tablet.css.dsp` 逐條 **0 差異**(全量,非抽驗) |
| `zklessc` | `compiled 0 file(s)`,且 `zkmax/less/` 不存在 |

### L3.4 隨本階一起收的

- **S36** —— compact 從此只有一個旋鈕(library-property),分裂主題在結構上不可能發生。
  `readme.md` 的兩處寫法在 **D5** 一併改寫。
- `IceblueDensity` 的 Javadoc 要加一句:**平板層只認 library-property**。
