# P4b —— vendor prefix 逐條判斷:14 條的決策清單

> 建立於 2026-08-10,**動手之前**寫成 —— 計畫書 §P4b〈前置〉明文要求
> 「清單必須在動手前就存在,否則這一階的閘門實際上失效」。
> 閘門要驗的是「差異**恰好等於**已核准的變更」,而這份文件就是「已核准的變更」本身。

---

## 1. 母體:15 條,其中 1 條屬於 P7

普查腳本自 `baseline/` 推導(與 P4a 同一支 parser,同一個「最內層 brace = 一個 rule block」定義)。
**孤兒 (orphan)** = 帶 `-moz-` / `-ms-` / `-o-` / `-khtml-` 前綴、不是 B 群 carve-out、
且**所在 block 裡沒有無前綴同伴**。有同伴的那 728 條是 P4a,已完成。

普查腳本自帶自檢:同一支 parser 必須先重現 P4a 的 **728 條 / 45 檔**,重現不了就中止 ——
重現不了的 parser,它數出來的孤兒也不可信。實測**通過**。

| 屬性 | 條數 | 檔 |
|---|---|---|
| `-moz-appearance` | 6 | slider ×2、pdfviewer ×2、norm ×1、**tablet ×1** |
| `-ms-zoom` | 3 | anchorlayout、columnlayout、portallayout |
| `-ms-touch-action` | 2 | cropper(新舊兩條路徑各一份) |
| `-moz-user-select` | 2 | norm |
| `-ms-flex-align` | 1 | inputgroup |
| `-khtml-user-select` | 1 | norm |
| **合計** | **15** | |

> **本階實際動 14 條,不是 15 條。** `zkmax/css/tablet.css.dsp` 裡那條 `-moz-appearance: none`
> 落在 **P7 holdout** —— 它仍由 `zklessc` 從 `tablet.less` 編出來,和 P4a 讓掉的 60 條同一個理由。
> **P4b = 15 − 1 = 14**,那 1 條計入 P7 的 delta。這是本階第一個實測發現:
> 計畫書寫「15 條」時沒有把 holdout 拆出來。

---

## 2. 判準:選「讓現代瀏覽器行為不變」的那一邊

P4b 唯一需要判斷的事,是每一條該**純移除**還是**成對替換**。用一條規則決定,不逐條憑感覺:

> **看哪一個選項讓現代瀏覽器的算繪結果不變,就選哪一個。**

這條規則是雙向的,兩個方向都會用到:

* `-moz-appearance` / `-moz-user-select` —— **純移除會讓 Firefox 退化**(它今天確實吃這兩個前綴),
  所以**成對替換**才是保持不變的那一邊。
* `-ms-zoom` / `-ms-touch-action` / `-ms-flex-align` —— 前綴今天在任何現代瀏覽器都**不生效**,
  純移除等於沒動;**補上標準宣告反而是新增行為**。所以**純移除**才是保持不變的那一邊。

這條規則也直接回答了「P4b 會不會偷渡功能修正」:不會,**兩個方向都收斂到「不改行為」**。

---

## 3. 逐條決策(14 條)

| # | 檔 | selector | 宣告 | 決策 | 理由 |
|---|---|---|---|---|---|
| 1 | `js/zul/layout/css/anchorlayout.css` | `.z-anchorlayout,.z-anchorchildren` | `-ms-zoom: 1` | **移除整條 rule** | 見 §3.1 |
| 2 | `js/zkex/layout/css/columnlayout.css` | `.z-columnlayout,.z-columnchildren` | `-ms-zoom: 1` | **移除整條 rule** | 同上 |
| 3 | `js/zkmax/layout/css/portallayout.css` | `.z-portallayout,.z-portalchildren` | `-ms-zoom: 1` | **移除整條 rule** | 同上 |
| 4 | `js/zkmax/med/css/cropper.css` | `.z-cropper-holder` | `-ms-touch-action: none` | **純移除** | 見 §3.2 |
| 5 | `js/zkmax/cropper/css/cropper.css` | `.z-cropper-holder` | `-ms-touch-action: none` | **純移除** | 同上(舊路徑死複本) |
| 6 | `js/zul/wgt/css/inputgroup.css` | `.z-inputgroup-text` | `-ms-flex-align: center` | **純移除** | 見 §3.3 |
| 7 | `js/zul/inp/css/slider.css` | `.z-slider-input` | `-moz-appearance: textfield` | **改名 → `appearance`** | 見 §3.4 |
| 8 | `js/zul/inp/css/slider.css` | `.z-slider-input:focus` | `-moz-appearance: textfield` | **改名 → `appearance`** | 同上 |
| 9 | `js/zkex/pdfviewer/css/pdfviewer.css` | `.z-pdfviewer-toolbar-page-active` | `-moz-appearance: textfield` | **改名 → `appearance`** | 同上 |
| 10 | `js/zkex/pdfviewer/css/pdfviewer.css` | `.z-pdfviewer-toolbar-page-active:focus` | `-moz-appearance: textfield` | **改名 → `appearance`** | 同上 |
| 11 | `zul/css/norm.css` | `.ZKBD input,…,textarea:focus` | `-moz-appearance: none` | **改名 → `appearance`** | 同上 |
| 12 | `zul/css/norm.css` | `.gecko .z-draggable-over > *` | `-moz-user-select: none` | **改名 → `user-select`** | 見 §3.5 |
| 13 | `zul/css/norm.css` | `.z-focus-a` | `-moz-user-select: text` | **改名 → `user-select`** | 見 §3.6 |
| 14 | `zul/css/norm.css` | `.z-focus-a` | `-khtml-user-select: text` | **純移除** | 同上(與 #13 併成一條) |

移除 **14** 條前綴宣告,新增 **7** 條標準宣告(5 條 `appearance` + 2 條 `user-select`)。

### 3.1 `-ms-zoom: 1` ×3 —— 純移除,而且整條 rule 一起走

**沒有任何現代瀏覽器認得 `-ms-zoom`。** `zoom` 本身是 IE 的 hasLayout hack,
標準化過程中從未採用這個前綴拼法,今天要嘛讀無前綴的 `zoom`、要嘛什麼都不做。

> ~~「連 IE 都不吃,它從寫下的第一天起就是死的」~~ —— **這句話是錯的,2026-08-10 第 4 層覆核指正**:
> Microsoft 確實在 IE8 standards mode 出過 `-ms-zoom`。**但這不影響本條決策** ——
> 判準問的是「**今天**的現代瀏覽器會不會變」,而答案仍是不會。

三條 rule 都**只有這一條宣告**,拿掉之後 block 是空的,所以連 selector 一起移除。

> **順帶量到的事(不在本階處理)**:主題裡還有 **22 條無前綴的 `zoom: 1`**
> (biglistbox、scrollview、groupbox、listbox、tree、tabbox …),同樣是死掉的 IE hasLayout hack。
> 它們**沒有前綴**,所以結構上不在 P4a/P4b 的母體裡。列為後續議題,本階不動。

### 3.2 `-ms-touch-action: none` ×2 —— 純移除(這條是本階唯一有爭議的判斷)

`-ms-touch-action` 只有 IE10 吃。現代瀏覽器讀的是 `touch-action`,而這個 block 裡**沒有**。
所以**今天**在任何現代瀏覽器上,`.z-cropper-holder` 根本沒有套用任何 touch-action。

* **純移除** ⇒ 現代瀏覽器行為**不變**(本來就沒生效)。
* **成對替換成 `touch-action: none`** ⇒ 觸控裝置上**新增**行為(拖曳裁切框時不再捲動頁面)。

依 §2 的判準選**純移除**。這麼選還有第二個理由:「cropper 該不該設 `touch-action`」是
**元件行為問題**,不是主題轉換問題 —— 把它塞進一顆「移除 LESS 前綴」的 commit 裡,
會讓將來 bisect 的人找不到行為變更的出處。

> **這條是可逆的,而且很便宜。** 若決定要補,就是在兩個 `cropper.css` 各加一行
> `touch-action: none;`,外加把本表 #4/#5 的 action 從 `remove` 改成 `rename`。
> 已列入進度報告的待決策區。

### 3.3 `-ms-flex-align: center` ×1 —— 純移除,標準宣告本來就在

```css
.z-inputgroup-text {
	display: -ms-flexbox;
	display: flex;
	…
	-ms-flex-align: center;
	align-items: center;   /* ← 標準宣告就在下一行 */
}
```

`-ms-flex-align` 是 2012 版 flexbox 語法,它的現代對應是 `align-items` —— **名字不一樣**,
所以「同 block 有無前綴同伴」那條機械規則看不到它(它會去找 `flex-align`,不存在),
才會落到 P4b。但語意上同伴確實在場,**純移除即可,不需要新增任何東西**。

> **同樣順帶量到(不在本階處理)**:`display: -ms-flexbox` / `-webkit-box` / `-moz-box` /
> `-ms-inline-flexbox` 合計 **13 條** —— 這些是**前綴在「值」上,不在「屬性」上**,
> 結構上是 P4a/P4b 的普查看不到的第三類。另有約 **79 處前綴 pseudo selector**
> (`::-moz-placeholder`、`:-ms-input-placeholder`、`::-ms-check` …)也同理。列為後續議題。
>
> **第 4 層覆核補充的一點**:那 13 條裡有一條(`display: -ms-flexbox`)就在
> **本條剛清掉一半的同一個 block 裡** —— 拿掉 `-ms-flex-align` 之後,
> `.z-inputgroup-text` 留下的是**半套 IE10 fallback**。行為零影響(IE10 不在支援範圍),
> 但「同一個 block 清一半」值得在後續議題裡一併收掉,而不是分兩次。

### 3.4 `-moz-appearance` ×5 —— 改名成標準 `appearance`

Firefox **今天確實吃** `-moz-appearance`。純移除 = Firefox 退化(數字輸入框的上下箭頭會跑回來)。
標準 `appearance` 在 Chrome 84+ / Firefox 80+ / Safari 15.4+ 全部支援,**在 L-2 選項 C 的支援範圍內**。
`-webkit-appearance` 依 L-2 選項 C **原地保留**。

三種瀏覽器的結果都與改動前相同:webkit 走 `-webkit-appearance`(沒動),Firefox 從
`-moz-appearance` 換成 `appearance`(同值),**零行為差異**。

> **標準宣告寫在原位**(前綴宣告原本在哪就在哪),不搬到 block 尾端 —— 這讓 delta
> 在位元組層級是「原地改屬性名」這一種形狀,閘門可以機械式驗證。
> 副作用:`pdfviewer` 那兩條原本 `-moz-` 就寫在 `-webkit-` **前面**,改完會變成
> 標準宣告在前、前綴在後。因為兩者**值相同**,串接順序不影響結果,不特別調整。

### 3.5 `-moz-user-select: none` ×1 —— 改名,且影響範圍被 selector 自己鎖死

```css
/* ZK-3195: only apply to the first layer of children */
.gecko .z-draggable-over > * { -moz-user-select: none; }
```

selector 帶 `.gecko`,**這條 rule 本來就只在 Firefox 生效**。改成 `user-select: none` 之後
依然只在 Firefox 生效(`.gecko` 沒動)。**任何瀏覽器的行為都不變**,且全樹只有這一處
`z-draggable-over` 的 user-select 規則,沒有需要一起看的姊妹 rule。

### 3.6 `.z-focus-a` 的兩條併成一條

```css
.z-focus-a {
	…
	-moz-user-select: text;
	-khtml-user-select: text;
	…
}
```

兩條的標準對應**都是** `user-select`,所以 #13 改名、#14 移除,結果是一條 `user-select: text`。
`-khtml-` 是 Konqueror / 舊 Safari,今天沒有任何瀏覽器吃。

* Firefox:`-moz-user-select` → `user-select`,同值,**不變**。
* webkit:此 block 原本**沒有** `-webkit-user-select`,所以現在多了一條會生效的 `user-select: text`。
  嚴格說這是 webkit 上的**新增行為**。

> ~~理由:`.z-focus-a` 是 `font-size:0; width:1px; height:1px` 的隱形焦點錨點,
> 「這 1px 能不能被選取」不可觀察。~~
> **2026-08-10 第 4 層覆核指正:這個理由不成立,結論才成立。**
> 「1px + `font-size:0`」**證明不了**不可觀察 —— `overflow:hidden` 裁掉的是**繪製**,不是**選取**;
> 一個帶文字節點的 1px 元素仍然可以被拖選、被複製。
>
> **真正成立的兩個理由**(原文沒寫出來,補上):
> ① ZK 各 mold 產生的 `.z-focus-a` 是**沒有文字節點的空 `<div>`**(覆核者在 ZK 原始碼的
> listbox / tree / Window / menupopup / calendar 逐一確認),沒有可選取的內容;
> ② `user-select` 的初始值 `auto` 本來就**計算成 `text`**,除非祖先是 `none`。
>
> **另一個原文漏掉的結構變化(覆核者發現)**:`tablet.css.dsp` 有
> `${".z-page "}*{-webkit-user-select:none}`,特異性 (0,1,0)。改動前 webkit **根本看不到**
> `.z-focus-a` 的 `-moz-`/`-khtml-` 宣告,**沒有競爭**;現在 `user-select: text` 與它
> **特異性打平**,結果取決於樣式表順序。因為 ①,實際不可觀察 ——
> 但這是真的結構變化,**且 P7 處理 tablet 時會再遇到一次**,先記在這裡。

---

## 4. 不動的東西(閘門要一起擋)

| | 條數 | 為什麼不動 |
|---|---|---|
| B 群 carve-out | 44 | 從未標準化,移除等於刪功能(`-moz-osx-font-smoothing` 16、`-webkit-font-smoothing` 16 …) |
| `-webkit-` 真前綴 | 285 | L-2 選項 C:全數保留 |
| P7 holdout `tablet.css.dsp` | 1(+P4a 讓掉的 60) | 仍由 `zklessc` 編譯,隨 P7 一起處理 |
| 無前綴 `zoom: 1` | 22 | 沒有前綴,不在母體;§3.1 已列為後續議題 |
| 前綴「值」`display: -ms-flexbox` 等 | 13 | 前綴不在屬性上,不在母體;§3.3 已列為後續議題 |
| 前綴 pseudo selector | ~79 | 同上 |

---

## 5. 閘門怎麼驗

P4a 的 delta 是 `baseline/` 的**純函數**(四個條件全部讀得出來)。
P4b **不是** —— 它有判斷成分,所以核准清單就是上面 §3 那張表,寫成
`scripts/p4b-delta.js` 裡的明文 table(14 筆,每筆帶 `count`,多一條少一條都會失敗)。

兩支 shape 閘門互相把對方的 delta 從 **baseline 側**抵銷掉,各自只看得到自己那一段:

| 閘門 | 左側 | 右側 | 斷言 |
|---|---|---|---|
| `check:p4a` | `baseline + P4b` | candidate | 剩下的差異恰好是 **728** 條 P4a 移除,且六條原有斷言原封不動 |
| `check:p4b` | `baseline + P4a` | candidate | 剩下的差異恰好是 §3 那 **14** 條,形狀符合各自的 action |
| `check:bytes` / `check:build-css` | `baseline + P4a + P4b` | candidate | **逐 byte 相同**(這層最強,兩段 delta 一起涵蓋) |

這樣改的好處是 `check-p4a-delta.js` 的六條斷言**一條都不用放寬** —— 它看到的樹,
就跟 P4b 從未發生過一樣。
