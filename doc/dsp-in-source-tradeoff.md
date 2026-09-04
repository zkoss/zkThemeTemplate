# 直接把 DSP 寫進 `.css` 來源：會壞在哪裡

**問題**：目前的做法（來源寫佔位符，`build-css.js` 在壓縮之後才換成 DSP）讓人無法在 `.css` 裡
直接看到 DSP 語法與它的結果。那麼直接把 DSP 寫進 `.css`，會出什麼問題？

**結論**：只有壓縮器是真正的技術障礙，而且只擋三種形式中的兩種。其餘的都是「今天的 build 主動
拒絕」而不是「會壞掉」。而且來源保持純 CSS 這個前提，今天已經有 12 個檔案不成立了。

---

## 五種 DSP 形式的實測結果

CleanCSS 5.3.3（本專案 pin 的版本，`level: 0, rebase: false`）、`build-css.js` 的 `minify()`、
以及一個嚴格 CSS 解析器（postcss 8）各自的反應：

| # | DSP 形式 | CleanCSS 的輸出 | 今天的 build | postcss |
|---|---|---|---|---|
| A | taglib 宣告放在檔首 | **完全不變**，0 errors 0 warnings | **失敗**（守門：header 由 build 自己前置，會變兩份） | 可解析（但當成垃圾宣告） |
| B | `<c:if>` 包住整個區塊 | **收尾標籤被吃掉**，只有 1 個 warning | **失敗**（守門：DSP tag） | 可解析但語意錯（算成 2 條宣告） |
| C | `<c:if>` 在選擇器位置 | `${".z-page "}` → `${}".z-page "`，**0 errors 0 warnings** | **失敗**（守門：DSP tag） | 解析錯誤 |
| D | `${...}` 在 `url()` 裡 | 完全不變 | **成功 —— 這種今天就直接寫在來源裡** | 解析錯誤 |
| E | `${...}` 當屬性值 | `${c:property("w")}` → `{$c:property("w")};`，**0 errors 0 warnings** | **成功，但輸出已被改壞** | 可解析但語意錯 |

重製方式：以 `clean-css` 與 `postcss` 對上表五個字串各跑一次 `minify()` / `parse()`。

### 讀法

* **B 與 C 是真的不能寫**。C 最惡劣：字串被搬出 EL 運算式，而壓縮器回報 0 errors 0 warnings ——
  只檢查 `errors` 的 builder 會在 exit 0 的情況下出貨壞掉的 CSS。這就是 `HOSTILE_CONSTRUCTS`
  存在的原因，也是它不該被放寬的原因。
* **A 其實壓縮器不會弄壞**。擋它的是 `build-css.js` 自己的規則（header 由它前置），不是 CleanCSS。
* **D 是既存的反例**：`url(${c:encodeThemeURL(...)})` 今天就寫在來源裡，原樣通過。所以「DSP 一律
  不能進來源」並不是現況，現況是「只有 `url()` 裡的 EL 可以」。
* **E 是守門的漏洞**，見下。

## 發現：值位置的 EL 會被無聲改壞，而守門抓不到（已修）

`HOSTILE_CONSTRUCTS` 的 DSP 規則是 `/<\/?[a-zA-Z][\w-]*:[\w-]+/`（配對 `<c:if>` 這類標籤）與
`/<%/`（taglib）。兩者都要求有角括號。`${c:property("w")}` 沒有角括號，所以：

    .z-x{width:${c:property("w")}}     →  .z-x{width:{$c:property("w")};}

`$` 與 `{` 被對調，CleanCSS 回報 0 errors 0 warnings，`minify()` 回傳成功。這正是這支腳本設計上
要防止的那種無聲損壞，只是走了守門沒有涵蓋的一條路。

現況不受影響：來源樹裡沒有任何值位置的 EL（`${` 一律出現在 `url()` 裡），master 出貨的
`baseline/` 也沒有。所以這是潛在缺口，不是現行 bug。但它是在「有人想多寫一點 DSP 進來源」的時候
第一個會踩到的坑 —— 也就是這份文件的情境。

**已修**：`HOSTILE_CONSTRUCTS` 多了一條 `EL expression outside url()`。難處在於同一個 `${...}`
在 `url()` 裡是對的、在別處是壞的，而單一 regex 分不出位置，所以新增 `blankUrlBodies()` 把
`url( … )` 的內容抹掉（括號配對、引號感知），該條規則只對抹掉後的文字斷言。未閉合的 `url(` 刻意
不抹 —— 否則它會把後面的內容一起吞掉，反而藏住真正的敵意構造。

這條規則**刻意比損壞範圍寬**：實測 `content:"${...}"`（引號值裡的 EL）在 level 0 下 byte-identical
存活，新規則照樣拒絕它。另兩個位置都真的會壞（值位置 `$`/`{` 對調；選擇器位置 `${...}` 後面的
後代空白被吃掉）。要放過那唯一安全的位置就得解析字串上下文才知道自己在哪 —— 而既有的 `<%` 規則也
早就比壓縮器嚴（見上表 A 列）。真有來源需要在引號值裡寫 EL，該做的是給它一個佔位符。

控制組（9 條）全數符合規格：值位置 / 選擇器位置 / 字串值裡 / 合法 `url()` 之後的 EL 都讓 build
失敗；`url()` 內的 EL（裸的、帶引號的、一條規則兩個、檔名含括號的）全部 byte-identical 通過。
`npm run check:build-css` 仍為 85 檔 / 15181 條宣告 / **0 differences**，`npm run check:gate`
exit 0。

## 「來源是純 CSS」這個前提，已經只有 87% 成立

以 postcss 8 解析全部 92 個來源 `.css`：**80 個乾淨，12 個解析失敗**，全部都是 `url()` 裡的 EL：

```
js/zkex/inp/css/colorbox.css        js/zul/sel/css/listbox.css
js/zkmax/layout/css/scrollview.css  js/zul/sel/css/tree.css
js/zul/grid/css/grid.css            js/zul/wgt/css/progressmeter.css
js/zul/inp/css/slider.css           js/zul/wnd/css/window.css
js/zul/mesh/css/frozen.css          zul/css/norm.css
zul/font/_font-awesome.css          zul/font/font-awesome.css
```

`build-css.js` 檔頭寫「the source stays valid CSS that an editor and a linter can read」，對 80 個
檔案為真，對這 12 個為偽。所以拿「保持工具可讀」來反對把 DSP 寫進來源，力道比註解宣稱的弱：那條線
已經被跨過了，只是跨得很小。

## 反向映射已經寫好了

`scripts/less2css.js:186` 的 `maskDsp()` 就是「真 DSP → 佔位符」的方向，而且它直接 import
`build-css.js` 的 `PLACEHOLDERS`。那是 `.less` 轉換期用的，但那張表是對稱的。

也就是說：若要允許作者在 `.css` 裡寫真的 `<c:if>`，缺的不是機制，而是把 `maskDsp()` 移進
`build-css.js` 的 pipeline、放在 `minify()` 之前。守門則要從「拒絕 DSP」改成「拒絕壓縮器看得到的
DSP」—— 也就是在 mask 之後才斷言。

## 曾實作、已撤回（2026-08-19）

2026-08-18 依「兩個關鍵字、不做位置推論、不提供 define／引用形式」的裁示，實作過一組公開 escape
（`/*!dsp …*/` 與 `/*!dsp-inline …*/`：payload 在守門之前抬出、壓縮之後原位放回），18 條控制組與端到端
皆通過、輸出逐 byte 未變。**2026-08-19 依指示撤回**，`build-css.js` 已回到只有內建 `PLACEHOLDERS`
表的狀態，來源 CSS 全程未被改動過。

那次實作留下三個仍然有效的量測結論，記在這裡以免重新發現：

1. **沒有任何單一 token 能在所有位置原地存活。** `/*!` 註解在選擇器清單裡被搬到最前面、在值中途被搬到
   最後；假 class 在成對包住規則時尾端那個被丟掉、當整個值時失去分隔。所以任何 escape 機制都必須讓
   「位置種類」被宣告出來。
2. **位置無法從文字推論。** `/*!dsp <c:if …>*/` 放在規則前面，與選擇器前綴，在文字上是同一個位置。
3. **可用的驗證不變量**：escape 的「前後非空白鄰居」在壓縮前後必須相同 —— 一條規則同時抓到選擇器
   清單位移（左鄰改變）與值中途位移（右鄰改變），而空白折疊兩者都不改變。

計畫書（含遷移範圍清單與分隔空白量測）留在 `tasks/migrate-placeholders-to-dsp-escape.md`。

## 選項

| 選項 | 作法 | 代價 |
|---|---|---|
| **1. 讓輸出可觀察**（改動最小） | 加一個 `npm run explain:dsp` / `build-css.js --show-dsp`，逐一印出「來源這一行 → 產出的 DSP」。產出本來就在 `target/classes/web/iceblue11/` 可以直接 grep | 約 30 行。來源不動，守門不動 |
| **2. 來源加註解** | 每個佔位符旁邊寫上它展開成什麼 | 會漂移（註解會過時），且 `norm.css` 檔頭已經集中寫了一份 |
| **3. 允許來源寫真 DSP** | 把 `maskDsp()` 接進 `build-css.js`，mask → minify → restore；守門改成 mask 之後才斷言 | 約 20 行 + 守門重寫。B/C 形式的來源會變成 postcss 解析不了（今天 12 檔已如此）。另有 16 支腳本讀來源 CSS 樹，其中解析宣告的（`gen-var-table.js` 1282 行、`gen-density-css.js`、`check-migration-tokens.js`、`p4a/p4b-delta.js`）需要逐一確認能容忍 DSP |
| **4. 不動** | 現況 | 使用者的原始抱怨仍在 |

E 的守門缺口與上面四個選項無關，已先獨立修掉（見上一節）。
