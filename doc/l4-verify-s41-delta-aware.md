# 第 4 層獨立驗證 —— S41 選項 A(第 1、2 層複核改為 delta-aware)

**日期**:2026-08-07 · **被驗證的 commit**:`c88dc90` · **委託書**:`tasks/l4-verify-s41-delta-aware-brief.md`
**結論**:**PASS-WITH-FINDINGS** —— C1–C11 **全部 CONFIRMED**,無一被推翻。

> 計畫書 [§四層人工複核](iceblue-drop-less-execution-plan.md) 規定 P3 之後每一步收工都要跑第 4 層:
> 唯讀、不給實作者的複核包、自帶量測、回報格式固定、與計畫書衝突時兩個數字都報、
> 事後驗證沒動 repo。本輪全部滿足 —— 並且**這一輪把最後那一項的漏洞補起來了**(見 §2.1)。

---

## 1. 逐條判定

| # | 宣稱 | 判定 | 覆核者自己量到的值 |
|---|---|---|---|
| C1 | 只讀 `baseline/` 推導出 728 條 / 45 檔 | **CONFIRMED** | **728 / 45**(掃 85 檔)。自寫 Python 解析器(**堆疊式**葉節點判定,與被驗證程式的「最後一個 `{` 勝出」不同演算法、不同語言);另用 `git diff --numstat 41efc3a^ 41efc3a` 得 45 檔 / 728 刪除 / 0 新增 |
| C2 | 前綴分布與 14 項屬性直方圖與來源端相同 | **CONFIRMED** | `-ms-` 255 / `-moz-` 239 / `-o-` 230 / `-khtml-` 4;14 項屬性逐項相同。**直方圖不是引用 `p4a:strip` 的報告**,是從 P4a commit 的 `-` 行重建的 |
| C3 | `check:bytes` exit 0、UNEXPLAINED 0 | **CONFIRMED** | exit 0;byte 相同 **25/85**、以 5 類解釋 **60**、UNEXPLAINED **0**。先自己移植 `normalize()` 五類、用**自己的** adjusted tree 算出 0,之後才跑腳本核對 |
| C4 | `check:build-css` exit 0、85 / 14135 / 0 | **CONFIRMED** | exit 0;85 檔、**14135** 條、files differing **0**、byte 相同 **24/84** |
| C5 | 14135 = 14863 − 728 | **CONFIRMED** | 兩端皆實測 |
| C6 | 兩支都沒寫 `baseline/`,temp dir 有清 | **CONFIRMED** | `baseline/` 最新 mtime 比本輪跑 check **早 2.09 天**;`BASELINE` 只出現在讀取 API;`finally` 的 `rmSync(force)` 在 `return 2` 的失敗路徑也會過;`ls $TMPDIR/check-build-css-*` → none |
| C7 | `tablet.css.dsp` 完全不被調整 | **CONFIRMED** | 調整後與 `baseline/` **逐 byte 相同**(`cmp`);其內合格條數獨立算得 **60** |
| C8 | 另三支仍 exit 0;`cssdiff` 仍 45/728 | **CONFIRMED** | `check:p4a` / `check:less-conventions` / `check:fa-css` 皆 0;`cssdiff` 45 / 728(exit 1,依設計 —— 另見 §2.4) |
| C9 | 三個負向控制都觸發 | **CONFIRMED** | (a) UNEXPLAINED 0→1;(b) 0→1;(c) 放寬規則後推導出 **975 / 47**。**完全沒動 repo** —— 對 scratchpad 副本突變 |
| C10 | 兩套獨立實作,非複製 | **CONFIRMED** | 五點論證,見 §1.1;另以兩者物化出的 adjusted tree `diff -r` 交叉驗證 **85 檔逐 byte 相同** |
| C11 | 未動任何 DSP 指令,未被 `url()` 分號或註解誤傷 | **CONFIRMED** | 728 條被刪切片**全部**符合前綴宣告形狀;含大括號/DSP 標籤 **0**、含 `url(` **0**;全樹 taglib / `<c:if>` / `${` / `url(` / `<%` 計數變化 **0**;norm 的 base64 payload 逐字相同 |

### 1.1 C10 的判斷依據(整份變更的效力都掛在這一條上)

1. **輸入語料不同** —— 前者走 `src/main/resources/web/**/*.css`(89 檔,展開、無 DSP);後者走
   `baseline/**/*.css.dsp`(85 檔,壓縮、含 taglib 與 `<c:if>`)。
2. **演算法不同** —— 前者**行導向**(`DECL_LINE` 要求「一整行剛好一條宣告」+ 行→區塊 owner 表);
   後者**字元偏移導向**(遮罩 → 取最內層 `{}` → 頂層 `;` 切分 → 第一個 `:`)。
3. **失敗模式互不適用** —— 前者的 `SKIPPED`(跨行、同行多宣告)在壓縮輸出裡無意義;
   後者的括號/字串遮罩在展開來源裡無意義。
4. **無程式相依** —— 後者不 `require` 前者,也不讀前者的任何中間產物;它唯一的輸入是
   P4a **之前**就凍結的 `baseline/`。
5. **細節各自為政** —— 前者把屬性名 `toLowerCase()`,後者不做(實測 baseline 無大寫屬性,
   故未分歧 —— 這正是「各自實作」的痕跡)。

---

## 2. 發現

### 2.1 【已修正】驗證協定自己的盲點:`git status` 證明不了 `baseline/` 沒被寫

* **現象**:`.gitignore:13` 就是 `baseline/`,`git ls-files baseline/` 回傳 0。
  委託書(以及 P3 以來每一輪)指定的唯讀證明 `git status --porcelain`,
  對「基準有沒有被改」**結構上永遠是綠的**。
* **覆核者怎麼確認的**:查 `.gitignore` 與 `git ls-files`,改用 mtime(基準最新 mtime
  比本輪跑 check 早 **2.09 天**)加程式碼路徑分析(`BASELINE` 只出現在讀取 API)補證。
* **影響**:協定層面,**不只這一輪** —— 歷來每一輪的唯讀證明都帶著這個盲點。
* **處置(同日)**:計畫書第 4 層那一列的唯讀證明改為
  `git status --porcelain` **加** `npm run check:baseline`(逐檔 sha256)。已記為 **S45**。
  實測本輪 `check:baseline` exit 0。

### 2.2 【已修正】「728 宣告兩次」講得太強

* **現象**:commit 訊息與原 docstring 寫「728 由不同程式、不同輸入**到達**兩次」。
* **精確的說法**:728 這個常數被**斷言**兩次,不是被**導出**兩次。獨立的是它所比對的
  兩個**計數**;常數本身兩處都是硬編碼。這一對的作用是**防止規則被悄悄放寬的絆線**
  (第三個負向控制證明絆線有效),不是第二次獨立普查。
* **真正的獨立普查**來自覆核者自己寫的第三套實作與來源端 `git diff --numstat`,兩者都得到 728/45。
* **是否影響最終結論:否** —— 真正承載效力的 C10 經五點論證確認成立。已記為 **S46**,docstring 同日改寫。

### 2.3 巢狀 at-rule 路徑正確,但**完全沒有資料在實測它**

* 10 個 baseline 檔有 depth ≥ 2 的區塊,但**巢狀區塊內的前綴宣告 = 0 條**;728 條全在 depth 1。
  `tablet.css.dsp` 也一樣(max depth 1、`@` 規則 0 個、60 條全在 depth 1),所以 P7 解禁後也踩不到。
* **影響**:低,但要點明 —— 「兩套實作一致」**不能**當成這條路徑的證據,因為兩邊都沒有輸入去走它。
  若日後 `baseline/` 出現 `@media` 內的前綴宣告,兩套實作可能同時失效而不被任何斷言攔下。

### 2.4 `check:cssdiff` 仍是 exit 1 —— S41 想根治的風險換了一支腳本承載

* 七支實跑中唯一非 0 的就是它(45 檔 / 728 條)。commit 已明說這是刻意的、判準轉給
  `check:p4a`(實測 exit 0),所以 C8 成立。
* 但 S41 的立論是「紅燈久了會被當成已知壞掉而失去資訊」,而那個風險現在原樣留在
  `check:cssdiff` 上。**屬設計取捨,不是錯誤** —— 列為待決策,見進度文件。

### 2.5 完整帳目結清(本輪最強的旁證)

candidate 殘留 **75 條可剝除前綴 + 16 carve-out**;其中「合格但未移除」的**只有
`tablet.css.dsp` 的 60 條**,其餘 15 條全是無同伴的 P4b orphan。
⇒ **728 移除 + 60 P7 遞延 + 15 P4b orphan + 16 carve-out** 是一本沒有缺口的帳。
這獨立佐證了 P4a 對規則的覆蓋是完整的,也佐證 C7 的遞延範圍恰好是 60。

### 2.6 逐檔比對零不符,孿生死複本處理一致

不只是總數 728 對得上 —— **45 檔的逐檔筆數全部相符**。
兩份 `cropper` 各 42、兩份 `goldenlayout` 各 42、兩份 `signature` 各 6。

### 2.7 前綴**選擇器**沒有被誤當成前綴**屬性**

`combo.css.dsp` 的 `::-webkit-input-placeholder` 6 / `::-moz-placeholder` 6 /
`:-ms-input-placeholder` 6 在調整前後**數量不變**;該檔推導出 **51** 條移除,與來源端 51 相符。

---

## 3. 與既有說法衝突的地方(兩個數字都列,不調整任何一邊)

### A. `p4a-delta.js` 註解對 data URI 的舉例

* 原註解:``url(data:image/png;base64,…)`` is real — **norm and selectbox**。
* 實測:`norm.css.dsp` 有 **1** 個 base64,是 **gif**,而且包在
  `url(${c:encodeURL("data:image/gif;base64,…"))` 這個 **DSP EL 運算式**裡;
  `selectbox.css.dsp` 有 **0** 個 base64,它的 3 個是 `url("data:image/svg+xml;charset=utf8,…")`。
* **兩種形狀都真實存在,保護行為在兩種情況下都成立且已驗證有效**(norm 的 base64 payload
  調整前後逐字相同,selectbox 的 3 個 url 完好)。**屬註解舉例失準,非行為缺陷**,同日修正。

### B. 委託書對 `combo.css.dsp`「同一個 selector 重複 6 次」的指涉對象

* 委託書的說法:`.z-combobox-input` 重複 6 次。
* 實測:`.z-combobox-input` 作為**裸 selector** 出現 **2** 次;重複 **6** 次的是 placeholder
  偽選擇器的各個變體。
* **是委託書的措辭不精確,不是實作的錯** —— 要驗的那條規則(同 rule block 有無前綴同伴)
  覆核者已直接測過,該檔 51 條與來源端相符。

---

## 4. 唯讀性證明

```
$ git status --porcelain
?? tasks/l4-verify-s41-delta-aware-brief.md      # 委託書本身,覆核者開工前就已存在

$ git rev-parse HEAD
c88dc908ec41b0230979817d52bfc12d99735f0f

$ git worktree list
…/zkThemeTemplate          08ca487 [new_theme]   # Marble,未被觸碰
…/zkThemeTemplate-iceblue  c88dc90 [iceblue]

$ npm run check:baseline
exit 0
```

補充(因 §2.1:`git status` 對 `baseline/` 結構性失明):基準最新 mtime 比本輪跑 check
早約 **2.09 天**;所有實驗檔寫在 session scratchpad;三個負向控制**完全沒有動 repo**
(對 scratchpad 副本突變),因此不存在還原殘留;未執行 `npm run baseline`;
未進入 Marble worktree(仍停在 `08ca487`);temp dir 已由 `finally` 清除。
