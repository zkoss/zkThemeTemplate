# 重新評估:預設 rhythm margin(內建)vs 開發者自行加 class(opt-in)

2026-06-05,起因:splitlayout 12px 破洞 bug(`tasks/plan-splitlayout-pane-fill.md`)。
問題:`_rhythm.css` 給容器類 widget 預設 `margin-block-end: 12px`,但 stock ZK 完全沒有
這種設定 — 這些「theme 自創的 margin」會不會持續產生額外問題?

## 這次 bug 揭露的結構性矛盾

`doc/spacing-policy.md` 當初的分類假設:「block-level 容器(window/grid/panel…)
通常獨立佔一個區段,不會被嵌進 toolbar/cell」→ 所以加預設 margin 安全。

**這個假設漏掉了 ZK 最重要的使用情境**:企業應用裡 window、grid、listbox、tabbox
正是最常被放進 **layout 容器**(splitlayout cave、borderlayout region、hbox/vbox、
portallayout…)當 `hflex`/`vflex` 子元件的 widget。而 ZK 的 JS sizing 引擎
**會量測子元件的 margin 並從計算尺寸中扣掉**:

- `zk/flex.ts applyCSSFlex`(這次的 bug):row 模式寫
  `calc(100% - marginHeight)` 到**兩個軸** → 12px 破洞。
- 同類量測散佈在多個 code path(`setFlexSize_`、舊 flex、各 layout 的
  region sizing…)。stock ZK theme 的 widget **全部零 margin**,ZK 的 JS
  是在這個前提下寫的。

→ Theme 自創的預設 margin 不是單一 bug,是一個 **open-ended 的 bug 類別**:
每一個會量 margin 的 JS code path × 每一個 rhythm 清單裡的 widget 都是潛在地雷。

## 兩案比較

### 案 A:保留 rhythm,逐一加例外(原計畫)

| | |
|---|---|
| 優點 | 頁面不加任何 sclass 就有區塊間距(原始目標「looks good without sclass」);現有頁面外觀不變 |
| 缺點 | 例外清單**列不完**:splitlayout cave 之外還有 borderlayout region、goldenlayout、portallayout、hbox/vbox flex wrapper、tabpanel…每漏一個就是一個「12px 神秘破洞」;而且**最沒能力 debug 這種問題的正是 Java 工程師**(這次root cause 要讀 ZK flex.ts 才找得到) |
| 維護 | `_rhythm.css` 已經需要 unlayered 順序技巧 + `z-mb-0` 逃生口,再加例外塊,複雜度持續上升 |

### 案 B:移除預設 rhythm,間距全部 opt-in(`_stack.css` 模式)

| | |
|---|---|
| 優點 | **跟 stock ZK 一致**(widget 零 margin = ZK JS 的前提),整個 bug 類別從根消失;**跟 MUI/Bootstrap 實務一致**(兩者的 widget 都不帶 margin — Bootstrap reboot 只動 `<p>/<h1>` 等純 HTML,`.card`/`.btn` 全是零;MUI 靠 `<Stack spacing>`,這正是 `.z-vstack` 的對應);CSS 變簡單(刪掉 unlayered 技巧與例外) |
| 缺點 | 「不加 sclass 就好看」目標退讓:相鄰兩個 window/grid 會貼在一起,需要父層一個 `sclass="z-vstack"` 或單顆 `z-mb-3`;現有依賴 auto-rhythm 的頁面要 sweep |
| 對 Java 工程師 | 其實**更友善**(見下) |

## 「ZK 使用者是 Java 工程師」這點怎麼判?

這個論點兩面都用得上,但淨值偏向 **opt-in(案 B)**:

1. **ZK 本來就有 Java 工程師熟悉的間距機制** — `<vlayout spacing="...">`、
   `<hlayout spacing>`、`<separator>`、`<space>`。idiomatic ZK 頁面是用 layout
   元件組的,不是裸 div 流。rhythm 其實在重複 ZK 既有的功能。
2. **看不見的魔法 vs 看得見的一行**:rhythm 壞掉時的症狀(JS 算出
   `calc(100% - 12px)`、splitter 旁出現不對稱空洞)對非前端工程師是黑箱;
   而「容器加 `sclass="z-vstack"`」是文件寫得出來、照抄就對的一行,失敗模式
   只有「忘了加 → 元件貼在一起」— 一眼看懂、一行修好。
3. **實際依賴度低**:103 個 preview 頁有 102 個已在用顯式 spacing utility
   (`z-mb-*`/`z-vstack`…),auto-rhythm 的實際貢獻很小。

## 建議:案 B(移除 rhythm,opt-in)

1. 刪除 `_rhythm.css` 的預設 margin 規則(`z-mb-0` 逃生口一併退役 —
   `_spacing.css` 已有同名 utility 的話保留那份)。
2. `doc/spacing-policy.md` 改版:預設零 margin;垂直間距 = `.z-vstack`(或
   `<vlayout>`),水平 = `.z-hstack`(或 `<hlayout>`);說明「widget 不帶
   margin 是 ZK JS sizing 的前提」這條 ZK 事實。
3. Skill:`reference/css-flex-classes.md` 仍加「margin subtraction」一節
   (ZK 事實,任何未來 theme 都要知道:**不要給可能成為 flex 子元件的
   widget 預設 margin**)。
4. Contract:splitlayout M12(pane fill ±1px)照加 — 防止未來任何人重新
   引入 widget margin 時 harness 看得到。
5. Sweep:rhythm 移除後跑視覺檢查(window/panel/grid/usecase2 各頁),
   哪頁區塊貼在一起就補 `z-vstack`/`z-mb-*` — 這也順便把隱性依賴轉成
   顯式宣告。

附帶效果:splitlayout 破洞 bug 不需要任何例外規則就直接消失
(margin 沒了 → ZK 量到 0 → 寫 `100%`)。

## 決議

**2026-06-05 使用者裁示:案 B(移除 rhythm,全面 opt-in)。** 已執行:
`_rhythm.css` 刪除並從 `build-css.js` 解除掛載;portallayout 以 scoped 規則
保留 stacked-panel 12px gap;`doc/spacing-policy.md` 改版;contract M12
(pane fill)與 skill「Margin subtraction」一節落地;sweep 後唯一退化是
`cardlayout.zul`(cardlayout 與按鈕列貼齊 — 即 2026-05-28 原始抱怨的場景),
以 `z-vstack` opt-in 修復。驗證結果見 `doc/skill-gaps.md` 2026-06-05 列。
