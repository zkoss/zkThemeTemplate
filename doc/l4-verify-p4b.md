# 第 4 層獨立驗證 —— P4b(vendor prefix 逐條判斷)

**日期**:2026-08-10 · **被驗證的 commit**:`eab6fe60` · **委託書**:`tasks/l4-verify-p4b-brief.md`
**結論**:**PASS-WITH-FINDINGS** —— C1–C12 **全部 CONFIRMED**,無一被推翻;
四則發現全部落在 **C8 的「理由強度」與後續整理**,沒有一則指向行為變更或閘門漏洞。

> 唯讀完成:`git status --porcelain` 僅剩委託書本身,`check:baseline` **86/86**(§5)。
> 本輪量測程式一律用 **Python 自寫**(遞迴下降 CSS parser + `difflib` 序列比對),
> 不 `require` `p4a-delta.js` / `p4b-delta.js` 來證明它們自己。唯一例外是 §2.1 的
> **新舊實作 A/B**(拿 `eab6fe60^` 的 `applyP4a` 對打 `eab6fe60` 的),那不是套套邏輯,
> 那正是 C6 要問的問題本身。

---

## 1. 逐條判定

| # | 宣稱 | 判定 | 覆核者自己量到的值 |
|---|---|---|---|
| C1 | 孤兒 15 條,6/3/2/2/1/1 | **CONFIRMED** | 自寫 parser 掃 `baseline/` 85 檔:**15 條 / 10 檔**;`-moz-appearance` 6、`-ms-zoom` 3、`-moz-user-select` 2、`-ms-touch-action` 2、`-khtml-user-select` 1、`-ms-flex-align` 1 —— 逐項相同 |
| C2 | 其中 1 條在 `tablet.css.dsp`,本階做 14 | **CONFIRMED** | tablet 內恰 1 條(`-moz-appearance: none` on `${".z-page "}input,…,textarea:focus`);15 − 1 = 14 |
| C3 | 移除 14 / 新增 7 / 9 個輸出檔 | **CONFIRMED** | 自建 `HEAD~1` 輸出樹後比對:**9 檔 / −14 / +7**。第二支獨立儀器(`cssdiff` 跑在同一對樹上)得 **9 檔 / 21 筆** = 14 − + 7 + |
| C4 | 7 條新增全是同 rule 同值改名,無憑空新增 | **CONFIRMED**(措辭有小瑕疵) | 7 條新增逐條都在**同一 selector context** 找得到**同值**的被移除宣告;無新值、無新宣告。瑕疵見 §2.2 |
| C5 | `-webkit-` 兩側 313;carve-out 沒動 | **CONFIRMED**(比宣稱更強) | 兩側皆 **313**,而且 **21 個 `-webkit-` 屬性的直方圖逐項相同**;`-moz-osx-font-smoothing` 兩側皆 **16** |
| C6 | P4a 的 728/45 與 14 項直方圖沒變 | **CONFIRMED**(兩條獨立路徑) | (i) 自寫 parser 自 `baseline/` 推導:**728 / 45 檔**,by-prefix `-ms-`255/`-moz-`239/`-o-`230/`-khtml-`4,14 項屬性直方圖逐項相同;(ii) 新舊 `applyP4a` 對 85 檔 A/B:**文字相異 0 檔、移除清單相異 0 檔、788 = 788** |
| C7 | 三條 `-ms-zoom` 各是其 block 唯一宣告 | **CONFIRMED** | `baseline/` 原文三處都literally 是 `{-ms-zoom:1}`,block 宣告數 = 1 |
| C8 | 14 條全部行為不變 | **CONFIRMED**(結論成立;理由強度見 §2) | 逐條複驗,含 (a)(b)(c)(d)。無一條在現代瀏覽器上改變算繪結果。四則發現皆屬「理由該寫得更強」或「後續整理」,非行為問題 |
| C9 | 兩閘門互相抵銷;P4a 六條斷言未放寬 | **CONFIRMED** | `check-p4a-delta.js` 的非註解 diff **只有三處**:多一個 `require`、`load(file)`→`load(text)`、左側換成 `p4b.baselinePlusP4b(rel)`。12 處 `violations.push` 訊息逐字相同,無任何判斷條件被改動 |
| C10 | 三個負向控制會觸發 | **CONFIRMED**(自行重做,全部觸發) | (a) exit 1「rename left no matching "appearance:textfield"」;(b) **兩支閘門都抓到**(外加 `check:bytes`);(c) exit 1「remove-rule on a block with 2 declarations」且**沒有照刪**。詳見 §3 |
| C11 | 帳目結清,無無主殘留 | **CONFIRMED** | baseline 非 webkit 前綴(扣 carve-out)**803** → candidate **61**,**全部落在 tablet**;803 − 61 = **742 = 728 + 14**。742 + 61 + 16 = **819** = 舊帳 728+60+15+16 |
| C12 | 六支 exit 0、`check:cssdiff` exit 1 / 48 檔 749 筆;14128 = 14135 − 14 + 7 | **CONFIRMED** | 全部實跑,數字逐一相符;`14135` 由**實跑 `eab6fe60^` 版閘門**取得(§4) |

---

## 2. 發現

### 2.1 【方法學,先講】覆核者自己的 parser 一開始是錯的 —— 而它錯的地方值得記下來

* **現象與實測**:第一輪量測我得到 `-webkit-` **312**(宣稱 313)、P4a 母體 **725/45**(宣稱 728/45)。
  兩個都短少,且短少量都是 3 的倍數。
* **根因**:`js/zul/wgt/css/progressmeter.css.dsp` 有一條
  `background-image: url(${c:encodeThemeURL("~./zul/img/misc/progressbar.png")})`。
  我的 parser 把 `${` 後面那個 `{` 當成 **rule block 開頭**,於是該檔後半段的
  block 邊界整個位移,吞掉了 1 條 `-moz-/-ms-/-o-border-radius`(3 條合計)與 1 條 `-webkit-`。
* **修正與再驗**:加上 `${…}` 與括號深度兩道防護後,對 **13 個屬性 × 85 檔**做
  grep 對照,**0 處不符**;數字隨即變成 **313** 與 **728/45**,與被驗證方一致。
* **影響範圍**:被驗證方的數字是對的,**錯的是我**。之所以寫進報告,是因為委託書要求
  衝突時兩個數字都列(§4),而且這是任何人替這棵樹寫 checker 都會踩的坑:
  `.css.dsp` 的 DSP EL **同時出現在「值」裡(`url(${…})`)和「selector」裡
  (`${".z-page "}input`)**,純字元掃描的 CSS parser 必須兩處都防。

### 2.2 【低】C4 的「成對替換」對 `.z-focus-a` 那組不是字面成立

* **現象與實測**:14 條移除 → 7 條新增,其中 6 組是 1:1,**`.z-focus-a` 那組是 2:1** ——
  `-moz-user-select: text` 與 `-khtml-user-select: text` 兩條移除,合併成一條 `user-select: text`。
* **根因**:委託書 C4 寫「**成對**替換」;實際的模型是
  `tasks/p4b-decisions.md` #13 `rename` + #14 `remove`,那是對的。
* **影響範圍**:**只是措辭**。C4 的實質(沒有憑空新增、沒有改名偷改值)完全成立,
  `scripts/p4b-delta.js` 的 `EXPECTED_ADDITIONS = 7`(只數 `rename`)也正是照這個模型算的。

### 2.3 【中】C8(a) `.z-focus-a` —— 結論對,但寫下的理由撐不住那個結論

* **現象與實測**:`baseline/` 的 `.z-focus-a` block 確實**沒有** `-webkit-user-select`
  (16 條宣告,只有 `-moz-user-select: text` 與 `-khtml-user-select: text`)。
  改名後 webkit 引擎**確實多吃到**一條 `user-select: text`。被驗證方在
  `tasks/p4b-decisions.md` §3.6 誠實記下了這點,理由是
  「`font-size:0; width:1px; height:1px` 的隱形焦點錨點,能不能被選取**不可觀察**」。
* **根因(理由為何不夠)**:尺寸與 `font-size` **不足以**推出「不可觀察」。
  `user-select` 管的是**文字內容**能否被選取;一個 1px、`font-size:0` 的元素只要**含有文字**,
  仍然可以被拖曳選取、被複製進剪貼簿(`overflow:hidden` 只裁切**繪製**,不裁切選取)。
  照這個理由寫下去,將來有人把它當先例用在**有文字**的元素上,就會出事。
* **真正撐得住的兩個理由(文件沒寫,我自己去 ZK 原始碼查的)**:
  1. **`.z-focus-a` 永遠是空的 `<div>`,沒有任何文字節點。** 所有會吐出它的 mold 都是
     `…></div>`,多數還帶 `aria-hidden="true"`:
     `zul/sel/mold/listbox.js:83`、`zul/sel/mold/tree.js:80`、`zul/wnd/Window.ts:178`、
     `zul/menu/mold/menupopup.js:18`、`zul/db/mold/calendar.js:29`。**沒有東西可選**。
  2. **`user-select: auto` 本來就等於 `text`**,除非祖先的 used value 是 `none` / `all`。
     所以這條新宣告在絕大多數情況下**根本不是新增行為**,只有在 `user-select: none`
     的子樹裡才有差別 —— 我把整棵樹的 `user-select: none` 都列出來了(見 2.4),
     可能成為 `.z-focus-a` 祖先的只有 `.lm_dragging *`(goldenlayout 拖曳中)與 tablet 的那條。
* **影響範圍**:**結論維持 CONFIRMED**,不需要改 code。建議把 §3.6 的理由換成上面兩條,
  否則這段記錄的**強度**低於它所支撐的判斷,而這正是本層要抓的東西。

### 2.4 【低】改名在 tablet 上製造了一場**以前不存在**的 cascade 競爭 —— 文件沒提

* **現象與實測**:P7 holdout `zkmax/css/tablet.css.dsp`(本階未動)裡有
  `${".z-page "}*{-webkit-user-select:none}` —— 特異度 (0,1,0),**match 每一個元素**,
  當然包含 `.z-focus-a`。
  * **改動前**:`.z-focus-a` 只有 `-moz-` / `-khtml-`,webkit 引擎**完全看不到** →
    universal 的 `none` 直接套用,**沒有競爭**。
  * **改動後**:`.z-focus-a{user-select:text}` 也是 (0,1,0),而 Blink/WebKit 裡
    `-webkit-user-select` 就是 `user-select` 的別名 → **同特異度平手,改由樣式表順序決定**。
* **根因**:P4b 只看單一 block 內部(「同 block 有沒有無前綴同伴」),
  **看不到跨檔案的 universal selector**。這是這條規則的結構性盲點,不是疏忽。
* **影響範圍**:實際**不可觀察**(空 div,見 2.3),所以不推翻 C8。但它是
  「行為不變性」這句話底下**真的被改掉的結構**,值得在 §3.6 補一行;
  更重要的是 **P7 轉換 `tablet.css.dsp` 時會再遇到一次**(tablet 自己那條 `-moz-appearance` 孤兒),
  屆時應該一併把這個互動決定清楚,而不是重新推導一次。

### 2.5 【低】C8(c) 正確,但同一個 block 現在留著半套 IE10 flexbox fallback

* **現象與實測**:改動後 `.z-inputgroup-text` 是
  `display:-ms-flexbox; display:flex; …; align-items:center` ——
  `align-items: center` 確實在場,**C8(c) 成立**。
* **根因**:`-ms-flex-align`(屬性帶前綴)被移除,但 `display: -ms-flexbox`(**前綴在值上**)
  留著 —— 兩者是**同一套 IE10 舊規格 flexbox fallback 的兩半**,只因普查是 property-based
  才被拆開處理。
* **影響範圍**:**行為零影響**(兩者在任何支援中的瀏覽器都是死的)。
  `tasks/p4b-decisions.md` §3.3 已把 13 條「前綴值」列為後續議題,
  但沒點出**其中一條就在它剛清理過的那個 block 裡**。建議後續處理前綴值時從這個 block 開刀。

### 2.6 【低,史實】§3.1 對 `-ms-zoom` 的那句補述沒有經過查證,而且很可能不正確

* **現象**:`tasks/p4b-decisions.md` §3.1 寫「`-ms-zoom` **連 IE 都不吃** …
  從寫下的第一天起就是死的」。
* **根因**:Microsoft 在 IE8 standards mode 曾把一批專有屬性加上 `-ms-` 前綴發佈,
  `-ms-zoom` 一般被認為在其中。我**沒有**去查一手資料證實或推翻,所以只標記、不下定論。
* **影響範圍**:**不承重**。C8 要問的是「**今天**有沒有變」,而
  「沒有任何現代瀏覽器認得 `-ms-zoom`」是對的,純移除因此行為不變 —— 判定不受影響。
  只是提醒別把這句補述當成已確立的事實再引用。
* **順帶量到**:失去 `-ms-zoom` 的三個元件(anchorlayout / columnlayout / portallayout)
  **不在**那 22 條無前綴 `zoom: 1` 的名單裡(名單是 `.z-panel`、`.z-window`、`.z-listbox`…)。
  也就是說這三個元件的 hasLayout hack 從一開始就只被 mixin 寫成 `-ms-` 那一份。
  **這是 baseline 本來就有的不對稱,不是 P4b 造成的。**

### 2.7 逐條複驗 C8 的其餘部分(無發現,列出以示確實驗過)

| 條目 | 我獨立確認的事實 | 判定 |
|---|---|---|
| `-moz-appearance` ×5 改名 | **5 個 block 全部**已含 `-webkit-appearance` 且**值完全相同**(slider/pdfviewer `textfield`、norm `none`)。三個引擎裡 `appearance`/`-webkit-`/`-moz-` 互為別名,同值 ⇒ 串接結果不變。Safari < 15.4 不認 `appearance`,但 `-webkit-appearance` 依 L-2 選項 C **原地保留**,所以**連支援下限以下也安全** | 行為不變 |
| **C8(d)** pdfviewer 標準宣告排在 `-webkit-` **前面** | 屬實(`appearance: textfield` → `-webkit-appearance: textfield`);slider 則是相反順序。因為**同屬性別名 + 同值**,last-wins 兩邊都得 `textfield` | **主張正確** |
| **C8(b)** `-ms-touch-action` ×2 純移除 | `.z-cropper-holder` 在 built tree 裡**完全沒有** `touch-action`(全樹只有 carousel 兩條 `pan-x`/`pan-y`)。`-ms-touch-action` 只有 IE10/EdgeHTML 吃,兩者都在支援下限外 ⇒ **今天** `.z-cropper-holder` 的 used value 前後都是 `auto` | **今天沒有變**,判定成立。原作者的意圖**在改動前就已經沒被實現**,移除只是拿掉最後的文字痕跡;§3.2 已把「要不要補 `touch-action: none`」列為待決策,處理得當 |
| **C8(c)** `-ms-flex-align` | `align-items: center` 確實在同 block(見 2.5) | 行為不變 |
| §3.5 `.gecko .z-draggable-over > *` | ZK 只在 Gecko 上掛 `.gecko`(`zk/src/main/resources/web/js/zk/zk.ts:1638,1673`:`_zk.ff = _zk.gecko = browser.mozilla`;`bodycls = 'gecko gecko' + …`)⇒ 非 Firefox 永遠不 match;Firefox 上 `-moz-user-select` 與 `user-select` 同值等價 | 行為不變(**這條的理由是 14 條裡最紮實的**) |
| `-ms-zoom` ×3 連 selector 移除 | 三個 block 各只有 1 條宣告(C7),清空後的 rule 對算繪無貢獻,移除 selector 亦無影響 | 行為不變 |

---

## 3. 負向控制:我自己重做的三個(全部觸發)

改動一律不碰**任何被追蹤的檔案**:(a)(b) 只把動過手腳的 source 編進 `target/`
(build 產物,已被 `.gitignore`),事後 `npm run build:tree` 還原;
(c) 在 scratchpad 另建一個迷你 repo(複製 `scripts/p4a-delta.js`、`p4b-delta.js` 與整份 `baseline/`)。
**全程未使用 `git checkout` / `git restore`。**

| 控制 | 我做的手腳 | 結果 |
|---|---|---|
| **(a)** rename 偷改值 | `slider.css` `.z-slider-input` 的 `appearance: textfield` → `appearance: none` | `check:p4b` **exit 1**:<br>`rename left no matching "appearance:textfield" in .z-slider-input -> -moz-appearance`<br>`added "appearance" in .z-slider-input with no removal it replaces`<br>`expected 14 removals, measured 13` / `expected 7 additions, measured 6`<br>**額外**:`check:p4a` 也 exit 1 |
| **(b)** 漏做一條 | `slider.css` `.z-slider-input` 的 `appearance` 改回 `-moz-appearance` | **兩支閘門都抓到,而且是從相反兩端**:<br>`check:p4b` exit 1(`13 removals` / `6 additions`)<br>`check:p4a` exit 1(`ADDED record (P4a may only remove) -> .z-slider-input \|\| -moz-appearance:textfield`)<br>**額外**:`check:bytes` exit 1(`UNEXPLAINED 1`,`3155B vs 3160B`) |
| **(c)** `remove-rule` 遇到第二條宣告 | scratchpad 版 `baseline/…/anchorlayout.css.dsp` 改成 `{-ms-zoom:1;color:red}` | **exit 1**,且是**丟例外而非照刪**:<br>`js/zul/layout/css/anchorlayout.css.dsp: remove-rule on a block with 2 declarations (-ms-zoom)`<br>`13 removals, expected 14` / `8 files, expected 9`<br>(對照組:未動手腳的同一份副本 **exit 0**,14/7/9) |

> 三者都不是「跑一次看它紅」而已:(b) 的價值在於**兩支閘門從相反方向各自獨立抓到同一個漏做**,
> 這正是 C9「互相抵銷卻不互相依賴」要買的東西,實測買到了。

---

## 4. 衝突(兩個數字都列)

| 項目 | 被驗證方的數字 | 我量到的數字 | 結論 |
|---|---|---|---|
| `-webkit-` 宣告數 | 313 | **第一輪 312 / 修正後 313** | **我錯,對方對。** 根因見 §2.1 |
| P4a 母體 | 728 / 45 檔 | **第一輪 725 / 45 檔;修正後 728 / 45 檔** | 同上 |
| `check:build-css` 宣告數 | 14128,且 `= 14135 − 14 + 7` | **14128**;`14135` 由實跑 `eab6fe60^` 版閘門取得 | **一致。** 我另外證明 `cssdiff` 的 `declarations:` 是**左側**計數(把 `out-prev`/`out-cur` 對調,13454 ↔ 13447,Δ=7),所以這條等式讀法正確 |
| 「carve-out」條數 | 閘門說 **16**;`p4b-decisions.md` §4 說 **44** | 我量到 `-moz-osx-font-smoothing` = **16**;B 群 44 = 16 + webkit 那 28 條(`-webkit-font-smoothing` 16、`-webkit-touch-callout` 6、`-webkit-tap-highlight-color` 4、`-webkit-user-drag` 1、`-webkit-user-modify` 1),`285 = 313 − 28` | **不是衝突,是兩種切法**,兩邊都自洽。<br>**但值得知道**:閘門的 `CARVE_OUT` 集合**只有一個成員**(`-moz-osx-font-smoothing`);另外 28 條是靠 `-webkit-` 全數保留那條**通則**擋下的。目前沒有缺口(它們全都是 `-webkit-`),不需要改 |

其餘 C1–C12 的每一個數字,我量到的與宣稱**逐項相同**,無第二處分歧。

---

## 5. 唯讀證明(兩項)

### 5.1 `git status --porcelain`

```
?? tasks/l4-verify-p4b-brief.md
```

除委託書(本輪開工前就已存在)與本報告 `doc/l4-verify-p4b.md` 外,**無任何項目**。
`git diff --stat baseline/` **空**。

> 過程中**唯一**被寫過的 repo 內路徑是 `target/classes/web/iceblue_css`
> (build 產物,`.gitignore` 第 3 行),用於 §3 的 (a)(b) 兩個負向控制,
> 事後以 `npm run build:tree` 還原,並以 `check:p4b` exit 0 + `check:bytes` `UNEXPLAINED 0` 確認還原完成。

### 5.2 `npm run check:baseline`

```
check:baseline OK — 86 files match doc/baseline-manifest.sha256

commit:        a89d44e03ab732fb32aeb43f8e7e9ba29c701382
src dirty:     no
```

**86 / 86**,exit 0。

### 5.3 閘門實測總表(C12 的原始數字)

| 指令 | exit | 關鍵數字 |
|---|---|---|
| `check:baseline` | **0** | 86 files match |
| `check:gate` | **0** | 串起 baseline → less-conventions → fa-css → build:tree → p4a → p4b |
| `check:p4a` | **0** | 728 removed / 45 files;`-ms-`255 `-moz-`239 `-o-`230 `-khtml-`4;`-webkit-` **313 = 313**;deferred 60 |
| `check:p4b` | **0** | 9 files / **14** removed / **7** added;rename 7 / remove 4 / remove-rule 3;`-webkit-` **313 = 313**;deferred 1 orphan |
| `check:bytes` | **0** | **UNEXPLAINED 0** |
| `check:build-css` | **0** | 85 files / **14128** declarations / **files differing 0**;84 converted、1 passthrough |
| `check:cssdiff` | **1**(正確) | 85 compared / **48** differing / **749** records |
| `check-build-css.js` @ `eab6fe60^` | **0** | 85 files / **14135** declarations / 0 differing ⇒ `14135 − 14 + 7 = 14128` ✔ |

---

## 6. 覆核者用的量測方法(供重現)

1. **自寫 CSS parser**(Python,字元級遞迴下降):處理註解、字串、括號深度、
   `${…}` DSP EL(值與 selector 兩種位置)、`<%@ taglib %>`、`<c:if>`。
   以 **13 屬性 × 85 檔** 的 grep 對照校準,0 處不符。
2. **宣告級 diff**:把每個檔攤平成有序的 `(block 路徑, 屬性, 值)` 三元組,
   用 `difflib.SequenceMatcher` 比對 —— 刻意不用被驗證方的 index-walk / table lookup。
3. **`HEAD~1` 輸出樹**:`cp -R` 現行 source 到 scratchpad,再用
   `git show eab6fe60^:<path>` 覆蓋那 9 個檔,然後
   `node scripts/build-css.js -s <scratch> -o <scratch-out>`。
   同法建 `out-cur` 並與 `target/` 做 `diff -rq` 驗證無差異(確保比的是同一件事)。
4. **新舊實作 A/B**:`git show eab6fe60^:scripts/p4a-delta.js` 取出舊版,
   與現版同時 `require`,對 85 個 baseline 檔逐檔比 `applyP4a()` 的**輸出文字**與**移除清單**。
5. **ZK 原始碼查證**(§2.3、2.7):`/Users/hawk/Documents/workspace/ZK10/zk`,
   查 `.z-focus-a` 的 mold 產出與 `.gecko` 的掛載條件。
