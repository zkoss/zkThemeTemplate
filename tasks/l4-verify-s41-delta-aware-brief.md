# 第 4 層獨立驗證委託書 —— S41 選項 A(第 1、2 層複核改為 delta-aware)

> 計畫書 `doc/iceblue-drop-less-execution-plan.md` §「四層人工複核」規定 **P3 之後每一步收工**
> 都要跑第 4 層:**唯讀、不給實作者的複核包、自帶量測、回報格式固定、與計畫書衝突時兩個數字
> 都報、事後用 `git status --porcelain` 驗證沒動 repo。**

## 你的身分與限制

- **工作目錄**:`/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`(branch `iceblue`)。
- **唯讀。** 不得修改任何檔案。`npm run build:css` / `npm run check:*` 會寫 `target/` 與系統
  temp dir(建置產物,不追蹤)—— 這是允許的;除此之外一個檔都不要動。
  要做自己的實驗請寫在 session scratchpad,不要寫進 repo。
- **絕對不要**碰 `/Users/hawk/Documents/workspace/zkThemeTemplate`(Marble,同一個 repo 的另一個
  worktree、另一個分支)。
- **絕對不要**跑 `npm run baseline`(會覆寫不可變基準)。
- **不要**先看實作者的結論再去湊 —— 先自己量,量完才對照。
- 多指令 Bash 用 `/usr/bin/grep`,不要用裸 `grep`(會 exec-replace shell)。
- 每個 Bash 呼叫都要自己 `cd`(cwd 每次會重置)。
- 不要為了讓某個斷言過而放寬它;不要把「預期值」改成你量到的值 —— **不一致本身就是發現**。

## 背景(只給到你需要的程度)

P4a(commit `41efc3a`)刻意移除了 728 條死的 vendor prefix 宣告,所以建置產物**不再等於**
`baseline/`,而且永遠不會再等於。兩支複核 —— `check:bytes`(第 2 層,位元組)與
`check:build-css`(第 1 層,builder 忠實度)—— 問的都是「candidate 是不是**等於**
`baseline/`?」,因此在 P4a 之後永久轉紅(記為 **S41**)。

本次(commit `c88dc90`)的作法是:**不把那 728 條記在 manifest 裡,而是重新推導**。
新檔 `scripts/p4a-delta.js` 宣稱那 728 條是 `baseline/` 的**純函數**,兩支複核改成
與「`baseline/` + 推導出的 delta」比對。

## 被驗證的宣稱(commit `c88dc90`)

| # | 宣稱 |
|---|---|
| C1 | `node scripts/p4a-delta.js` 只讀 `baseline/`,推導出 **728** 條移除、分布在 **45** 個輸出檔 |
| C2 | 推導出的前綴分布 `-ms-` 255 / `-moz-` 239 / `-o-` 230 / `-khtml-` 4,以及 14 項屬性直方圖(`border-radius` 378 / `transform` 135 / `box-shadow` 114 / `box-sizing` 45 / `user-select` 16 / `transition-duration` 9 / `flex-direction` 9 / `transform-origin` 6 / `transition-timing-function` 6 / `transition-delay` 3 / `transition-property` 3 / `outline` 2 / `flex` 1 / `appearance` 1),**與來源端 `p4a:strip` 當初回報的完全相同** |
| C3 | `npm run check:bytes` 現在 **exit 0**,`UNEXPLAINED 0`;byte 相同 **25**、以 5 類序列化解釋 **60** |
| C4 | `npm run check:build-css` 現在 **exit 0**;`85 檔 / 14135 條 / files differing: 0`;byte 相同 **24/84** |
| C5 | **14135 = 14863 − 728**(14863 是 P4a 之前的全樹宣告數) |
| C6 | 兩支複核**都沒有寫入 `baseline/`** —— 調整後的樹只存在於記憶體(check-bytes)或 temp dir(check-build-css),而且 temp dir 在 `finally` 裡被刪掉 |
| C7 | `zkmax/css/tablet.css.dsp` 在 `DEFERRED` 裡,**完全不被調整**(它的 60 條留給 P7) |
| C8 | `check:p4a`、`check:less-conventions`、`check:fa-css` 仍 exit 0;`check:cssdiff` 仍是 **45 檔 / 728 條**(刻意維持,判準仍是 `check:p4a`) |
| C9 | 三個負向控制都會觸發:(a) 刪掉一條 P4a **未**核准移除的 `-webkit-border-radius` → 兩支都紅;(b) 加回一條 P4a **已**移除的 `-moz-border-radius` → 兩支都紅;(c) 把 `p4a-delta.js` 的 `STRIP_PREFIX` 放寬到含 `-webkit-` → 尺寸斷言開火(`derived 975 removals, expected 728` / `derived 47 changed files, expected 45`) |
| C10 | `p4a-delta.js` 與 `p4a-strip-prefixes.js` 是**兩套獨立實作**(前者讀壓縮後的 `.css.dsp` 輸出、走括號/分號結構;後者逐行改來源 `.css`),不是同一段程式碼的複製 |
| C11 | 調整後的基準**沒有動到任何 DSP 指令**(`<%@ taglib %>`、`<c:if>`、`${…}`),也沒有被 `url(data:…;base64,…)` 裡的分號或註解裡的內容誤傷 |

## 要求你自己量,不要引用實作者的腳本結論

- **不要**只跑 `npm run check:bytes` / `check:build-css` 就當作驗證過 —— 那兩支正是被驗證的對象。
  請至少用**一種獨立方法**重新得到 728 / 45 這兩個數字,以及「調整後的基準與 candidate 之間
  沒有殘留的 P4a 形狀差異」這個結論。
- **C10 是最重要的一條。** 整個作法的效力完全建立在「兩套獨立實作」上;如果 `p4a-delta.js`
  其實是照著 `p4a-strip-prefixes.js` 的輸出（或它的中間結果）算的,那它就只是把答案抄一遍,
  什麼都沒證明。請**實際讀過兩支腳本**再判斷,並說明你判斷的依據。
- **C11 請自己找 counter-example**,不要只信 docstring。建議至少檢查:
  `zul/css/norm.css.dsp`(最大檔,含 3 個 taglib + 93 對 `<c:if>` + 一個 base64 的 `url()`)、
  `js/zul/wgt/css/selectbox.css.dsp`(`url()` 裡有分號)、
  `js/zul/inp/css/combo.css.dsp`(同一個 selector 重複 6 次 —— 「同 rule block 有無前綴同伴」
  這條規則最容易在這裡出錯)。
- **兩個口徑要分清楚**:`cssdiff` 的「宣告數」與磁碟上的「位元組」不是同一件事。
  若你量到的數字與上表不同,**兩個數字都報**,不要挑一個。

## 特別留意(這幾處最可能有問題)

1. **`@media` / `@supports` 巢狀**:`p4a-delta.js` 宣稱只把**最內層**的 `{}` 當宣告區塊。
   請確認 baseline 裡確實有巢狀 at-rule,而且裡面的前綴宣告有被正確處理(或正確地沒被處理)。
2. **每個檔的移除筆數**:請把「輸出端推導出的每檔筆數」與「來源端 `git show 41efc3a^:` 對
   `41efc3a:` 的每檔刪除行數」**逐檔**對照。整體 728 對得上不代表分佈對得上。
3. **孿生死複本**(兩份 `cropper` / 兩份 `goldenlayout` / 兩份 `signature`):兩邊應被一致處理。
4. **負向控制的還原**:控制組跑完是用 scratchpad 副本還原的,不是 `git checkout`。
   請確認 `src/main/resources/web/js/zkex/menu/css/fisheye.css` 與
   `scripts/p4a-delta.js` 在 `c88dc90` 裡是乾淨的(沒有殘留控制組的痕跡)。
5. **`check-build-css.js` 的 temp dir**:請確認失敗路徑也會清掉,而且 `expected/` 這個
   調整後的樹**不會**被誤認成真的 baseline(例如被寫到 repo 裡)。

## 回報格式(固定)

```
## 結論
<PASS | PASS-WITH-FINDINGS | FAIL>

## 逐條判定
| # | 宣稱 | 判定 | 我自己量到的值 | 用什麼方法量的 |
|---|---|---|---|---|
| C1 | … | CONFIRMED / REFUTED / UNVERIFIABLE | … | … |

## 發現
(每一條寫:現象 → 我怎麼確認的 → 影響)

## 與計畫書/commit 說法衝突的地方
(兩個數字都列出來,不要調整任何一邊)

## 唯讀性證明
`git status --porcelain` 的原始輸出
```
