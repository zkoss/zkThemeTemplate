# 第 4 層獨立驗證 —— P4a(vendor prefix 純移除)

**日期**:2026-08-07 · **被驗證的 commit**:`41efc3a` · **委託書**:`tasks/l4-verify-p4a-brief.md`
**結論**:**PASS-WITH-FINDINGS** —— C1–C12 **全部 CONFIRMED**,無一被推翻。

> 計畫書 [§L3-C](iceblue-drop-less-execution-plan.md) 規定 P3 之後每一步收工都要跑第 4 層:
> 唯讀、不給實作者的複核包、自帶量測、回報格式固定、與計畫書衝突時兩個數字都報、
> 事後用 `git status --porcelain` 驗證沒動 repo。本輪全部滿足。

---

## 1. 逐條判定

| # | 宣稱 | 判定 | 覆核者自己量到的值 |
|---|---|---|---|
| C1 | 728 條 / 45 檔 | **CONFIRMED** | 來源端 `0 新增 / 728 刪除`、CSS 檔 45;輸出端 `14863 − 14135 = 728`,45 檔有差異 |
| C2 | `-ms-` 255 / `-moz-` 239 / `-o-` 230 / `-khtml-` 4 | **CONFIRMED** | 完全相同,合計 728 |
| C3 | 無 `-webkit-` 被移除,兩側 313 | **CONFIRMED** | 313 / 313;728 條刪除行中 `-webkit-` **0** 條 |
| C4 | 0 筆新增 | **CONFIRMED** | 新增行 0、多重集新增 0、**rule block 總數變化 0** |
| C5 | 每筆移除在同 rule 仍有無前綴同伴 | **CONFIRMED** | 違反 **0**,**全 728 條逐筆驗,非抽樣**(三條獨立路徑,見 §2.1) |
| C6 | carve-out 44 條沒動 | **CONFIRMED** | 兩側皆 44,六個屬性逐一相符 |
| C7 | `tablet.css.dsp` 一條沒動 | **CONFIRMED** | 兩側 **逐 byte 相同**(27638 B) |
| C8 | `p4a:strip --check` 報 0 | **CONFIRMED** | 實跑 exit 0;另以獨立方法佐證(見 §2.2) |
| C9 | 85 / 14863 / 45 檔差異 / 728 筆 | **CONFIRMED** | 四個數字先用自寫 parser 得到,**之後**才跑 `cssdiff.js` 對照 |
| C10 | `check:less-conventions`、`check:fa-css` 仍 exit 0 | **CONFIRMED** | 實跑 |
| C11 | `check:bytes`、`check:build-css` FAIL 且報同一組 45 檔 | **CONFIRMED** | 兩份清單與覆核者自己推導的 45 檔清單三方 `diff` 完全一致 |
| C12 | 728 = 788 − 60;tablet 60 條分佈 | **CONFIRMED** | 在 baseline 上獨立重實作 P4a 三條件重算,**沒有引用計畫書的 788** |

覆核者的量測方法刻意不經過被驗證的腳本:自寫 tokenizer 對 `baseline/` 與自行重建的
`target/…/iceblue_css` 做**多重集**差異(非 LCS)、`git show --numstat 41efc3a` 自行加總、
`git show 41efc3a^:<path>` 對照工作樹。

---

## 2. 發現

### 2.1 【已修正】`check-p4a-delta.js` 的第 5 項斷言比它的 docstring 弱

* **現象**:原實作把 candidate 的宣告以**正規化後的 selector 字串**為 key 建桶(`candByCtx`),
  所以**兩個不同的 rule block 只要 selector 相同就會被合併**。理論上會出現:
  block A 有 `-moz-border-radius` + `border-radius`,block B(同 selector)只有前綴版;
  兩者都被刪時,桶裡仍看得到 `border-radius`,斷言通過 —— 但 B 的移除其實沒有同伴接手。
* **覆核者怎麼確認的**:另寫一支 **per-block-instance** 檢查(每個 `{` 給獨立 id,不靠 selector
  字串),對 baseline 全樹重算 → 可移除資格仍是 788 / 728,且「自身 block 無同伴但同 selector
  他處有同伴」的**遮蔽案例 = 0**。
* **影響**:**本樹沒有實際缺陷,閘門這次的判定是對的**,但斷言強度不如字面。
  委託書點名的 `combo.css`(6 組重複 selector)正是這個弱點最可能發作的形狀。
* **處置(2026-08-07,同日修正)**:`check-p4a-delta.js` 改用 **per-block-instance**。
  block 由「record 串流中連續同 ctx 的一段」重建;移除永遠不會清空一個 block(留下的正是同伴)
  也不會重排,所以第 k 個 block 兩側是同一個 block,並額外斷言 **block 數與 ctx 序列兩側相同**。
  * **修正後仍 exit 0**(728 / 45 / 313 = 313)—— 印證覆核者「遮蔽案例 0」的結論。
  * **新斷言的負向控制**:在 `combo.css` 六個同 selector 區塊中的**一個**刪掉無前綴的
    `border-radius` → 精確報出 **3 條**
    `removal left no unprefixed twin in that same rule block -> .z-combobox-input || -moz-/-o-/-ms-border-radius`。
    **舊實作對這 3 條會放行**(其餘 5 個同名區塊還有 `border-radius` 兜著),
    ⇒ 強化不是形式上的。控制組以 scratchpad 副本還原,還原後閘門再次 exit 0。

### 2.2 比 C8 更強的完整性證據(完全不經過被驗證的腳本)

覆核者對 **candidate 輸出**重跑資格掃描:全樹只剩 **60** 條符合 P4a 三條件,**全部在
`tablet.css.dsp`**,其餘 84 檔皆 **0**。這一條同時關掉委託書點名的兩個疑慮 ——
`combo.css` 沒有「只改到其中幾組」,三組孿生檔也沒有只改一邊。

### 2.3 前綴總帳完整結清

baseline **1132** → candidate **404**。非 webkit 殘留 **91 = 16 carve-out + 60 tablet holdout
+ 15 P4b 孤兒**,分毫不差。覆核者獨立掃出的孤兒**正好 15 條**,與計畫書預測的 P4b 15 條一致。

### 2.4 兩個口徑這次剛好相等,原因查清楚了

來源端「刪掉幾行」與輸出端「少幾條 declaration」不必然相等(來源有 partial、有註解)。
實測都是 728,因為 **728 條刪除行每一條都完整匹配單行宣告形式(728/728)** ——
沒有 partial line、沒有註解被刪、沒有新增行。本階兩個口徑因此可互為佐證。

### 2.5 孿生檔沒有分裂

`cropper` / `goldenlayout` / `signature` 各兩份,`md5` 兩兩一致,移除數對稱(42/42、42/42、6/6)。
附錄 #33 記錄過的「孿生對分裂」失效模式**沒有重演**。

### 2.6 `norm.css` 的 DSP 佔位符一條沒動

兩側同為 3 個 taglib + 93 個 `<c:if>` + 93 個 `</c:if>`,**文字內容也逐字相同**;
全樹 85 檔的 DSP directive 差異 **0**。

### 2.7 負向控制的還原是乾淨的

`fisheye.css` 全檔無 `zoom`,2 條 `-webkit-` 都在,與 `41efc3a^` 的差異只有 6 條移除、0 新增。

---

## 3. 與既有說法衝突的地方(兩個數字都列,不調整任何一邊)

### A. `-webkit-` 條數:**285** vs **313**

* 計畫書 §P4b 與進度文件寫「`-webkit-` **285** 條真前綴」;commit 訊息與 C3 寫「**313** = 313」。
* 覆核者實測:全樹 `-webkit-` 宣告 **313** 條,其中屬於 carve-out 的有 **28** 條
  (`font-smoothing` 16 + `touch-callout` 6 + `tap-highlight-color` 4 + `user-drag` 1 + `user-modify` 1)
  ⇒ **313 − 28 = 285**。
* **兩個數字在各自口徑下都正確**(313 = 全部 `-webkit-`;285 = 扣掉 carve-out 的「真前綴」),
  問題只在於它們出現在相鄰文件裡而**沒有標註分母**。已記為 **S42**。

### B. 前綴宣告總數:附錄 L377 的 **1127** vs L442 的 **1132**

* 覆核者實測 baseline 為 **1132**(`-webkit-` 313 / `-moz-` 283 / `-ms-` 281 / `-o-` 250 / `-khtml-` **5**)。
* L377 的列舉只有前四項(合計 1127),**漏列 `-khtml-` 5 條**;L442 的 1132 是對的。
* **既有不一致,非 P4a 引入**,不觸及任何閘門。已記為 **S43**。

### C. 委託書自身寫錯了一個數字

委託書說 `fisheye.css` 應「只有那 **3** 條非 webkit 前綴被移除」,實測是 **6** 條
(2 個屬性 × 3 個前綴族)。若「3」指的是前綴族則成立,指宣告條數則少一半。
**是委託書的錯,不是實作的錯** —— 該檔在兩種讀法下都正確。

---

## 4. 唯讀性證明

```
$ git status --porcelain
?? tasks/l4-verify-p4a-brief.md      # 委託書本身,覆核者開工前就已存在

$ git rev-parse --short HEAD ; git branch --show-current
41efc3a
iceblue

$ git diff --stat          # (空)
$ git diff --cached --stat # (空)
$ git status --porcelain baseline/ | grep -c ""
0
```

無 tracked 檔案變更、無 staged 變更、`baseline/` 零異動、HEAD 仍在 `41efc3a`。
覆核者的寫入僅限 `target/`(不追蹤的建置產物)與 session scratchpad;
未執行 `npm run baseline`,未觸碰 Marble worktree。
