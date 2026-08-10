# 第 4 層獨立驗證委託書 —— P4b(vendor prefix 逐條判斷)

> 對象 commit:`eab6fe60`(worktree `/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`,branch `iceblue`)
> 日期:2026-08-10

## 你的角色

**獨立覆核者。** 你**不是**來確認我做對了,是來找出我哪裡錯了、哪裡講得比證據強。

規則(違反其一,這份驗證就不算數):

1. **唯讀。** 不得修改 repo 內任何檔案。臨時檔一律寫到 scratchpad。
2. **不得引用我的說法當證據。** commit message、`tasks/p4b-decisions.md`、
   `doc/**` 裡的數字都是**待驗證的主張**,不是事實。每個數字你要**自己量**。
3. **自己寫量測程式。** 不要 `require` 我寫的 `scripts/p4a-delta.js` / `p4b-delta.js`
   來證明它們自己是對的 —— 那是套套邏輯。用不同語言 / 不同演算法重寫。
4. **衝突時兩個數字都寫出來**,不要挑一個。分歧本身就是發現。
5. **絕對不要跑 `npm run baseline`**(會覆寫基準)。
6. **不要為了讓斷言通過而放寬它**;也不要把預期值改成你量到的值。

## 背景(只給脈絡,不是證據)

這是「把 iceblue 主題的 LESS 換成 CSS」計畫的 P4b 階段。P4 拆成兩半:

* **P4a**(已完成,2026-08-07):移除**有無前綴同伴**的前綴宣告 —— 規則讀得出來,
  所以是 `baseline/` 的純函數,728 條 / 45 檔。
* **P4b**(本次):處理**孤兒** —— 帶前綴、但所在 rule block 裡**沒有**無前綴同伴的宣告。
  沒有規則能決定每一條該怎麼辦,所以是逐條判斷。

`baseline/` 是轉換前的原始輸出(85 個 `.css.dsp`),**永不修改**,是所有比對的左側。

## 要驗的主張(逐條給 CONFIRMED / REFUTED / UNVERIFIABLE)

**C1** 孤兒母體恰好 **15 條**,分佈為 `-moz-appearance` 6 / `-ms-zoom` 3 /
`-ms-touch-action` 2 / `-moz-user-select` 2 / `-ms-flex-align` 1 / `-khtml-user-select` 1。
(孤兒定義:屬性帶 `-moz-`/`-ms-`/`-o-`/`-khtml-`、**不是** `-moz-osx-font-smoothing`、
且**同一個最內層 block** 裡沒有把前綴拿掉後的同名屬性。)

**C2** 那 15 條裡**恰好 1 條**位於 `zkmax/css/tablet.css.dsp`,因此本階實際處理 **14** 條。

**C3** 本階實際的 delta 是 **移除 14 條前綴宣告 + 新增 7 條標準宣告,涉及 9 個輸出檔**。
請直接對 `baseline/` 與 `target/classes/web/iceblue_css` 做你自己的 declaration diff。
(先 `npm run build:tree` 重建;若你不信任它,`npm run check:build-css` 會從零重編一次。)

**C4** 那 7 條新增**全部**是「同一個 rule、同一個值、只有屬性名改變」的成對替換,
沒有任何一條新增是憑空出現的新宣告,也沒有任何一條改名偷改了值。

**C5** `-webkit-` 宣告數量兩側相同(主張:313 = 313),且 B 群 carve-out
(`-moz-osx-font-smoothing` 等)一條都沒被動到。

**C6** P4a 的 728 條 / 45 檔在本次改動後**完全沒變**,14 項屬性直方圖逐項相同。
(我把 block 走訪重構成共用的 `eachBlock()`,這條是在驗那次重構沒有改變行為。)

**C7** `-ms-zoom` 那三條各是其 block 的**唯一**宣告,所以連 selector 一起移除是安全的 ——
請自己去 `baseline/` 確認那三個 block 除了 `-ms-zoom` 以外真的沒有別的宣告。

**C8**(**這條最需要你獨立判斷,不要只看我怎麼寫**)**行為不變性**。
我宣稱判準是「選讓現代瀏覽器行為不變的那一邊」,而且 14 條**全部**滿足它:

* `rename`(7 條:`-moz-appearance` ×5、`-moz-user-select` ×2)—— Firefox 今天確實吃這兩個
  前綴,純移除會退化,所以改名成標準屬性才是「不變」的那一邊。
* `remove`/`remove-rule`(7 條)—— `-ms-zoom`/`-ms-touch-action`/`-ms-flex-align`/
  `-khtml-user-select` 今天沒有任何現代瀏覽器吃,純移除等於沒動。

**請逐條檢查這個宣稱**,特別是:
(a) `.z-focus-a` 那條 —— 該 block 原本**沒有** `-webkit-user-select`,所以改名後
webkit 瀏覽器會**多**吃到一條 `user-select: text`。我在文件裡承認了這點並主張
「`.z-focus-a` 是 1px 隱形元素,不可觀察」。**這個主張站得住嗎?**
(b) `-ms-touch-action` 那兩條 —— 我選了純移除而不是補 `touch-action: none`。
**這個選擇有沒有讓 cropper 在觸控裝置上失去原作者想要的行為?**(注意:重點是
「**今天**有沒有變」,不是「本來就該不該有」。)
(c) `-ms-flex-align: center` —— 我主張同 block 已有 `align-items: center`,所以純移除即可。
(d) `pdfviewer` 那兩條改名後,標準宣告排在 `-webkit-appearance` **前面**。我主張因為
兩者值相同所以無影響。**對嗎?**

**C9** 兩支 shape 閘門(`check:p4a` / `check:p4b`)確實「互相抵銷對方的 delta」,
且 **P4a 那六項斷言一條都沒有被放寬**。請自己 `git show eab6fe60 -- scripts/check-p4a-delta.js`
看 diff,確認斷言邏輯本身沒有被改弱(只有左側資料來源變了)。

**C10** 三個負向控制真的會觸發。**請自己重做**(改動一律在 scratchpad 副本或用你自己的
合成輸入;**若你必須改 repo 內的來源檔,務必先 `cp` 一份到 scratchpad,事後 `cp` 回去,
不要用 `git checkout`**):
(a) 把一條 `rename` 的值偷改掉 → `check:p4b` 必須報 rename 找不到對應值;
(b) 漏做一條(把 `appearance` 改回 `-moz-appearance`)→ **兩支閘門都要抓到**;
(c) `remove-rule` 遇到還有第二條宣告的 block → 必須丟例外而不是照刪。

**C11** 帳目結清。P4a 之後曾有一本帳:`728 + 60(tablet 待 P7)+ 15(P4b 孤兒)+ 16(carve-out)`。
P4b 之後這本帳應該變成什麼?請自己重算 candidate 裡**還剩下**多少條可移除前綴,
並確認每一條都有歸屬(P7 holdout / carve-out),**沒有無主的殘留**。

**C12** 閘門實測。自己跑並記下 exit code 與關鍵數字:
`check:baseline` / `check:gate` / `check:p4a` / `check:p4b` / `check:bytes` /
`check:build-css`(主張全部 exit 0)、`check:cssdiff`(主張 exit 1 且 48 檔 / 749 筆)。
`check:build-css` 的宣告數主張是 **14128**,且 `14128 = 14135 − 14 + 7`。

## 唯讀證明(必做,兩項都要)

1. `git status --porcelain` —— 除了你自己的報告檔以外不得有任何項目。
2. `npm run check:baseline` —— 必須 **86/86**。

> 這兩項問的是**不同**的問題,兩項都要跑。歷史教訓:`baseline/` 曾經被 `.gitignore` 忽略,
> 那段期間 `git status` 對「基準有沒有被寫」**結構上永遠是綠的**(S45)。現在它已納入追蹤(S47),
> 但仍然兩項都要。

## 報告格式

寫成 `doc/l4-verify-p4b.md`(**這是你唯一可以新增的檔案**):

1. **結論**:PASS / PASS-WITH-FINDINGS / FAIL
2. **C1–C12 表格**:每條給 CONFIRMED / REFUTED / UNVERIFIABLE + 你**自己量到的數字** +
   你用什麼方法量的
3. **發現**:每一條分「現象與實測 / 根因 / 影響範圍」
4. **衝突**:我的數字 vs 你的數字,兩個都列
5. **唯讀證明**:上面兩項的原始輸出
