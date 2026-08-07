# 第 4 層獨立驗證委託書 —— P4a(vendor prefix 純移除)

> 計畫書 `doc/iceblue-drop-less-execution-plan.md` 規定 **P3 之後每一步收工**都要跑第 4 層:
> **唯讀、不給實作者的複核包、自帶量測、回報格式固定、與計畫書衝突時兩個數字都報、
> 事後用 `git status --porcelain` 驗證沒動 repo。**

## 你的身分與限制

- **工作目錄**:`/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue`(branch `iceblue`)。
- **唯讀。** 不得修改任何檔案。`npm run build:css` 會寫 `target/`(建置產物,不追蹤)——
  這是允許的;除此之外一個檔都不要動。
- **絕對不要**碰 `/Users/hawk/Documents/workspace/zkThemeTemplate`(Marble,另一個 worktree)。
- **絕對不要**跑 `npm run baseline`(會覆寫不可變基準)。
- **不要**看實作者寫的結論再去湊 —— 先自己量,量完才對照。
- 多指令 Bash 用 `/usr/bin/grep`,不要用裸 `grep`(會 exec-replace shell)。
- 每個 Bash 呼叫都要自己 `cd`(cwd 每次會重置)。

## 被驗證的宣稱(commit `41efc3a`)

| # | 宣稱 |
|---|---|
| C1 | 移除了 **728** 條宣告,分布在 **45** 個來源 `.css` 檔 |
| C2 | 前綴分布:`-ms-` 255、`-moz-` 239、`-o-` 230、`-khtml-` 4 |
| C3 | **沒有任何 `-webkit-` 宣告被移除** —— baseline 與 candidate 兩側都是 **313** 條 |
| C4 | **沒有任何新增** —— `cssdiff` 的 728 筆差異全部是移除,0 筆 `+` |
| C5 | 每一筆移除,candidate 在**同一個 rule** 裡仍宣告了無前綴版本 |
| C6 | B 群 carve-out **44** 條完全沒動(其中非 webkit 的只有 `-moz-osx-font-smoothing` 16 條) |
| C7 | `zkmax/css/tablet.css.dsp` **一條都沒動**(P7 holdout) |
| C8 | `npm run p4a:strip -- --check` 現在報 **0**(冪等) |
| C9 | 全樹 `cssdiff` 現在是 **85 檔 / 14863 條 / 45 檔差異 / 728 筆差異記錄** |
| C10 | `check:less-conventions` 與 `check:fa-css` 仍 exit 0 |
| C11 | `check:bytes` 與 `check:build-css` 現在 FAIL,且**報的是同一組 45 個檔** |
| C12 | 728 = 788 − 60,其中 60 是 tablet 的份;tablet 那 60 條的屬性分布是 `border-radius` 24 / `box-shadow` 12 / `box-orient` 12 / `box-flex` 9 / `background-size` 3 |

## 要求你自己量,不要引用實作者的腳本結論

- **不要**只跑 `npm run check:p4a` 就當作驗證過 —— 那是被驗證的對象之一。
  請至少用**一種獨立方法**重新得到 728 / 45 / 313 這三個數字
  (例如:直接對 `baseline/` 與 `target/classes/web/iceblue_css` 用你自己的解析,
  或用 `git show 41efc3a^:<file>` 與工作樹逐檔比對來源端的刪除行數)。
- **兩個口徑要分清楚**:來源端「刪掉幾行」與輸出端「少幾條 declaration」不必然相等
  (來源有 partial、有註解)。若兩者不同,**兩個數字都報**,不要挑一個。
- C5 是最重要的一條 —— 它是「安全」而非「形狀正確」的證據。請獨立驗證,
  至少抽驗到你有把握的程度,並說明你抽了幾條、怎麼抽的。

## 特別留意(這幾處最可能有問題)

1. **`js/zkex/menu/css/fisheye.css`** 曾被拿來做負向控制(刪一條 `-webkit-border-radius`、
   加一條 `zoom:1`),事後以 Edit 還原。**請確認它真的還原乾淨** ——
   與 `git show 41efc3a^:src/main/resources/web/js/zkex/menu/css/fisheye.css` 對照,
   差異應**只有**那 3 條非 webkit 前綴被移除,不多不少。
2. **`js/zul/inp/css/combo.css`** 有 6 組重複區塊(L2.4 第 5 項),
   最容易發生「只改到其中幾組」。
3. **兩份 `cropper` / 兩份 `goldenlayout` / 兩份 `signature`** 是舊路徑死複本,
   兩邊都應該被一致地處理。
4. **`zul/css/norm.css`** 是最大的一檔(62 條),而且含 DSP 佔位符 ——
   請確認 `<c:if>` / taglib 指令一條都沒動。

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
