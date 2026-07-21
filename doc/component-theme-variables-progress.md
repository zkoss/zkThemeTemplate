# Component Theme Variables — 進度追蹤 (Progress Tracker)

> **這份文件追蹤「哪些元件已宣告可覆寫的 `--zk-<comp>-*` 變數、且滿足檢驗條件」。**
> 規範(功能定義、cascade 規則、CTV-1…9 檢驗條件、每元件變數清單)在
> [`spec/component-theme-variables.md`](spec/component-theme-variables.md);**本文件只記狀態,不定義規則。**
> 兩者不同步時以 spec 為準。首次建立:2026-07-21。

**功能目的(一句話)**:讓 adopter 只想改**某一個元件**時,**只覆寫該元件的 `--zk-<comp>-*` 變數**
(whole-app 或某個 region),**不必動到會波及全部元件的全域 token**,且**沒覆寫時零回歸**。

檢驗條件 CTV-1…9 全文見 spec 的〈Conformance criteria〉。摘要:

| ID | 重點 |
|----|------|
| CTV-1 | 零回歸預設(不覆寫 = 與加變數前逐像素相同) |
| CTV-2 | **與全域 token 隔離**(只覆寫 `--zk-<comp>-*` 即可改樣式,不必動全域 token)— 核心目的 |
| CTV-3 | region scoping(設在容器上只影響子樹,不影響外面的同類) |
| CTV-4 | whole-app 覆寫(`:root`,載於 `norm.css.dsp` 之後)勝出 |
| CTV-5 | 宣告於 `:root`(`_component-theme.css`),不宣告在元件本體上 |
| CTV-6 | 覆蓋有意義的外觀軸(fill/text/border/radius/state-accent) |
| CTV-7 | 狀態完整(disabled/readonly/selected/error 在覆寫下仍正確) |
| CTV-8 | 已文件化(spec 內有該 family 的變數表) |
| CTV-9 | 有回歸測試(`component-theming.zul` demo + `component-theming.spec.ts` 斷言) |

**圖例**:✅ 通過 · 🟡 通過但有已載明的例外 · ⬜ 未開始 · ➖ 刻意不納入(N/A)

> 表中 ✅ 的依據:CTV-1/2/5/6/7/8 = spec 的 Recipe 不變式 + build 驗證 + 已載明的判斷;
> CTV-3/4/9 = `component-theming.spec.ts` 綠燈斷言(見下方測試對照)。

> **完整性**:本表以 [`zk-edition-components.md`](zk-edition-components.md)(ZK 10.4 全元件清單,
> 依 jar 分 CE/PE/EE)為母體逐一盤點,確保**每個元件都被歸類**(A / A-涵蓋 / B / C / D)。見末〈完整性斷言〉。

---

## A. 已落地 / Conformant(shipped)

> 欄標頭 **1–9 = 上方〈檢驗條件〉的 CTV-1…CTV-9**(**6/7** 欄把 CTV-6 覆蓋 + CTV-7 狀態合併);
> **變數?** 欄 = 是否已宣告 `--zk-<comp>-*`。狀態圖例見本檔開頭。

| Family(tags) | 變數? | 1 | 2 | 3 | 4 | 5 | 6/7 | 8 | 9 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|
| **button**（button, uploadbutton） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | disabled + color/outlined/text/FAB 變體刻意不走變數(CTV-7);state 為 `::before` overlay |
| **input**（textbox/intbox/decimalbox/doublebox/longbox/passwordbox） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | readonly/disabled 用 muted outline,不走變數 |
| **window** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | elevation 由 mode 決定,刻意非變數(CTV-6 排除) |
| **grid** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | row-hover 保留 `rgba` 字面值;group/foot accent 留在 base token |
| **listbox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 含 selection 變數;foot/group、striping fallback 留 base token |
| **tree** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 同 listbox,無 striping |
| **panel** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 有 `--zk-panel-elevation`(與 window 不同) |
| **groupbox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| **combobox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | split-border DOM(input+button 各半);dropdown-input 家族之首 |
| **datebox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | wrapper-border(inset ring);含 calendar popup 變數 |
| **timebox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | wrapper-border;stepper,無 popup |
| **spinner**（+doublespinner 共用） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `.z-doublespinner` 讀同一組 `--zk-spinner-*` |
| **bandbox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | wrapper-border;含 band popup 變數 |
| **tab**（tabbox） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `--zk-tab-accent` 同時著色 state 層/選中標籤/底部指示條 |
| **menu**（menubar/menupopup/menuitem） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | menu/menuitem hover overlay 不走變數 |
| **avatar / avatargroup**（ZK-6097） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | base 已 hoist 到 `:root`;size 變體仍 per-variant |
| **chip**（ZK-6097） | ✅ | ✅ | ✅ | 🟡 | 🟡 | 🟡 | ✅ | ✅ | 🟡 | ZK 永遠掛 `z-chip-info`,severity 變體在**元件本體**釘變數 → region/whole-app 被遮蔽;只能 **per-severity / inline** 主題化。無專屬 region 測試(不可 region 展示) |
| **badge**（ZK-6097） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 預設(info)fill 走 base 變數 → **region/inline 可覆寫**;非預設 severity 各自釘色(刻意) |
| **rating** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 無 bg/border/radius(icon-only);只有 fg(resting)+ accent(selected/hover)兩個色彩軸;disabled/readonly 靠 opacity 淡化,非變數驅動 |
| **progressmeter** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 只有 track(`--zk-progressmeter-bg`)+ fill(`--zk-progressmeter-fill`)+ 共用 radius 三軸;color 變體(secondary/success/warning/error)沿用 button 變體模式,在元件本體以更高特異性規則釘自己的語意色,刻意不走變數 |
| **paging** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 按鈕 fg + 選中(目前頁)fill/text 為 defining state;jump-to-page input 另有自己的 bg/fg/border-color 三個變數;disabled 按鈕/input 刻意不走變數(同 button/input 慣例),input 的 hover/focus border 色、以及 input 的 `border-radius`(仍釘死 `--zk-shape-corner-extra-small`,未走變數)也留在 base token(未納入 curated surface)。數字按鈕(與 `.z-paging-selected`)只在 **`os` mold** 才會渲染 —— 預設 mold 只有 prev/next + jump-to-page input,沒有頁碼;`component-theming.zul` 的 demo 已改用 `mold="os"` 讓 CTV-3/CTV-9 的 region 斷言可以實際命中 `.z-paging-selected`(舊版斷言在預設 mold 下找不到該元素而逾時)。CTV-8:spec.md 已補上 `### Paging — shipped` 家族表格(與本列變數一致),並把 paging 從 Status 的「Not exposed」移到「Shipped」;CTV-4 補上 whole-app `:root` 覆寫測試(`--zk-paging-selected-bg`) |
| **combobutton** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | split button,沿用 button 家族的 overlay state 模型(bg/fg + radius + overlay 色/opacity 三態),另加內容區與箭頭區之間的分隔線 `--zk-combobutton-divider-color`(原字面 `rgba(255,255,255,0.3)`,原樣保留為預設值)。`toolbar` mold 是**色彩變體**(比照 button 的 outlined/text 變體),在元件本體以更高特異性規則釘自己的語意色;disabled 同樣刻意不走變數 —— 兩者皆沿用 button 慣例(CTV-6/7)。CTV-9 補上 region + whole-app `:root` 覆寫測試(`--zk-combobutton-bg`)。CTV-8:spec.md 已補上 `### Combobutton — shipped` 家族表格(8 個 knob,與本列變數一致) |
| **selectbox** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 原生 `<select>` 元素(Listbox `select` mold,`.z-select`;渲染時 class 直接掛在 `<select>` 本身,無 wrapper)。state 為 per-state border-color(同 input 模型,無 overlay):`--zk-selectbox-bg/-fg/-radius` + `-border-color/-hover/-focus` 六軸。disabled 僅靠 `opacity` 淡化(同 rating 慣例,非各自釘死語意色),border/bg 知面仍會透出(淡化後),但淡化本身足以維持可辨識的 disabled 狀態,故仍算 CTV-7 通過。下拉箭頭是烘焙在 `background-image` data URI 內的字面色(`#666`),CSS 變數無法內插進 `url()` 字串,故維持字面值,未列入變數(`.z-selectbox`〔獨立的原生 `<selectbox>` 元件,`wgt/css/selectbox.css`〕有相同的既有限制註記,但**不屬於本列**——本列只涵蓋 `.z-select`/Listbox select mold,`<selectbox>` widget 另計)。**CTV-2/3/4 修正**(前次被 checker 駁回的根因):demo/test 目標 `<listbox mold="select">`(`.z-select`)實際生效的樣式是 `js/zul/sel/css/listbox.css` 內**另一個獨立的** `.z-select` 區塊(`select.css.dsp` 未被任何 `css-uri` 請求,`check:css-dsp` 列為未引用的 "extra"——並非有效樣式表),先前只改了 `select.css`(未生效檔案),`listbox.css` 仍讀全域 token,故覆寫無效。已將 `listbox.css` 的 `.z-select` 區塊(bg/fg/radius/border-color/hover/focus 六處)改讀 `--zk-selectbox-*`,並在兩檔案頂部加註說明「`listbox.css` 為生效樣式表,`select.css` 為 dormant 重複覆蓋,兩者讀同一組變數以保持同步」。CTV-9:兩條 selectbox Playwright 測試(region + whole-app)已重跑並轉綠(`npx playwright test … -g selectbox` → 2 passed;全 component-theming 套件 29 passed)。CTV-8:spec.md 已補上 `### Selectbox — shipped` 家族表格,Status 的 Shipped 清單也已補上 `combobutton, selectbox`。 |
| **inputgroup** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 輸入群組容器(`.z-inputgroup` + 子項 `.z-inputgroup-text` addon + 群組內的 textbox/combobox)。邊框色與圓角是「共享」軸:`--zk-inputgroup-border-color` 同時上在 addon 的 `border` 與群組內 textbox/combobox 覆寫的 `border`(視覺上是同一條連續外框);`--zk-inputgroup-radius` 同時驅動水平/垂直兩種排列的頭尾圓角,以及 `:focus-within` 外框的圓角。addon 另有自己的 fill/text 一對:`--zk-inputgroup-text-bg`(預設 `surface-container-low`)/ `--zk-inputgroup-text-fg`(預設 `on-surface-variant`)。focus 沿用全域 `--zk-focus-ring`(同 button/window/grid 慣例),刻意不走變數。CTV-9:demo 加在 `component-theming.zul` 尾端(Default + regional override 兩列,addon 一起展示);Playwright 新增 region + whole-app `:root` 兩條測試(region 斷言 addon 的 radius/border-color/bg/color 四軸,scoped 命中、sibling default 不受影響;whole-app 斷言 `:root{--zk-inputgroup-radius:0px}` 命中預設 addon)。CTV-8:spec.md 已補上 `### Inputgroup — shipped` 家族表格(4 個 knob,與本列變數一致),Status 的 Shipped 清單也已補上 `inputgroup`。 |
| **calendar** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 自成一體的月曆網格 + 導覽 header(也是 datebox popup 內用的殼層;popup 情境早已被 datebox.css 攤平為 flat content,不受影響)。`--zk-calendar-accent` / `-accent-fg` 是單一 defining-state 配對 —— 同時上色 selected day 的 disc 填色(`::before`)+ 文字、today 外框,以及 Today-link 文字(四處今天都讀同一組 `--zk-color-primary`/`-on-primary`),與 tab 的 `--zk-tab-accent`「一個 knob、多個角色」前例相同。hover 狀態層(title/icon/day-cell 的 hover 色調、Today-link 的 hover 色調)維持 base token,刻意不走變數(同 menu 的 `::before` overlay 慣例)。disabled/outside/outrange 天、week-of-year 欄位色,以及 month/year/decade 檢視器的 pill 圓角(`--zk-shape-button`)也維持 base token —— 次要/未納入 curated surface 的例外(同 grid/listbox 慣例)。CTV-9:demo 加在 `component-theming.zul` 尾端(Default + regional override 兩列,以固定日期 2020-03-15 讓 selected day 可預測);Playwright 新增 region + whole-app `:root` 兩條測試(region 斷言殼層的 radius/border-color,以及 selected day 的 disc fill(`::before`)與文字色;whole-app 斷言 `:root{--zk-calendar-accent:…}` 命中預設 calendar 的 selected disc)。CTV-8:spec.md 已補上 `### Calendar — shipped` 家族表格(7 個 knob,與本列變數一致),Status 的 Shipped 清單也已補上 `calendar`。 |
| **toolbar** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 純色塊工具列(`.z-toolbar`),無 radius(全寬 chrome bar,同 menubar)。單一共用 border-color 變數驅動 bar 本身的邊(水平 mold 的 `border-bottom`、垂直 mold 的 `border-right`——這是唯一有真實 DOM 命中、也是 Playwright 唯一斷言的軸)以及 `.z-toolbarseparator`(水平/垂直兩種)的 `background-color`;惟如下述,後者選擇器目前無對應真實 DOM class,故「一個 knob、驅動整個家族每處邊線」的說法只在 CSS 層級成立,實際渲染覆蓋僅止於 bar 本身的邊。app-bar 情境變體(`.z-north .z-toolbar`,含其 toolbarseparator 的 color-mix 色調)是獨立的色彩 **VARIANT**(比照 combobutton 的 toolbar mold),在元件本體以更高特異性規則釘自己的語意色,刻意不走變數;tabs 內嵌變體(`.z-toolbar-tabs`,transparent/無邊框)與 overflow popup(`.z-toolbar-popup`,次要子功能)同樣維持 base token,不納入本次 curated surface。**注**:稽核過程中發現 `.z-toolbarseparator` 選擇器在目前 ZK 10 核心並無對應的真實 DOM class(`<separator bar="true">` 產生的是 `z-separator-horizontal-bar`/`z-separator-vertical-bar`,不是 `z-toolbarseparator`)——這是既有的、與本次 CTV 改動無關的 dead-code 選擇器(超出本次任務範圍,未修正,僅記錄);因此本列變數改動對它是零回歸(改前改後同樣不會被任何真實 DOM 命中)。toolbarbutton(icon/text 按鈕本體)**不在本列**,仍留在候選 B1(可併 button 詞彙,見下)。CTV-8:spec.md 已補上 `### Toolbar — shipped` 家族表格(2 個色彩/邊框 knob + height size 軸,與本列變數一致,並在段落中同步載明上述 dead-code 例外),Status 的 Shipped 清單也已補上 `toolbar`。CTV-9:demo 加在 `component-theming.zul` 尾端(Default + regional override 兩列,含 3 個 toolbarbutton);Playwright 新增 region + whole-app `:root` 兩條測試(斷言 `.z-toolbar` 的 `background-color`/`border-bottom-color`,scoped 命中、sibling default 不受影響)。 |
| **slider**（`zul/inp/slider.css`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | MD3 range input(track + fill + thumb),無 text/border,故知面軸為:靜止軌道色(`--zk-slider-track-bg`)、單一 defining accent(`--zk-slider-accent`,同時驅動 active fill 與 thumb——兩者原本都讀 `var(--zk-color-primary)`,故合併成一個共用 knob,與 tab/calendar 的 accent「一個 knob、多個角色」前例相同)、共用圓角(`--zk-slider-radius`,track/fill/thumb 三處皆同一 token)、thumb 靜止陰影(`--zk-slider-elevation`)。thumb 的 hover/focus/active state-layer ring(box-shadow color-mix)改讀同一顆 accent,故覆寫後 ring 色調隨之一致;knob mold(PE)的 SVG arc stroke(`.z-slider-knob-inner`/`-area`)本質上與 track/fill 是同一概念,也改讀相同的兩顆 knob。sphere mold 的 3D 漸層 thumb 是色彩 **VARIANT**(比照 button 的 outlined/text 變體),在元件本體以更高特異性規則釘自己的漸層色,刻意不走變數。數值輸入疊層(`.z-slider-input`)與數值提示 tooltip(`.z-slider-popup`)是次要子功能,維持 base token,不納入 curated surface(同 calendar 的 week-of-year 慣例)。disabled 僅靠 `opacity` 淡化,不走變數(同 button/input/rating 慣例)。**範圍外**:rangeslider(PE)/multislider(EE)是獨立樣式檔(`zkex/slider/css/rangeslider.css`,`zkmax/slider/css/multislider.css`),本次未一併改動,仍留在候選 B1。CTV-9:demo 加在 `component-theming.zul` 尾端(Default + regional override 兩列);Playwright 新增 region + whole-app `:root` 兩條測試(region 斷言 track 的 `background-color`/`border-radius`與 thumb 的 accent `background-color`,scoped 命中、sibling default 不受影響;whole-app 斷言 `:root{--zk-slider-accent:…}` 命中預設 slider 的 thumb)。CTV-8:spec.md 已補上 `### Slider — shipped` 家族表格(4 個 knob,與本列變數一致),Status 的 Shipped 清單也已補上 `slider`,並把 slider 從「Not exposed」段落移除(rangeslider/multislider 範圍外候選改於該段落另行提及)。 |

**測試對照**（`component-theming.spec.ts`,37 綠):button(regional/disabled/whole-app 共 3)、
input、window、grid、listbox、tree、panel、groupbox、combobox、datebox、timebox、spinner、
bandbox、tabbox、menubar、avatar、badge、rating(regional/whole-app 共 2)、progressmeter(regional/whole-app 共 2)、
paging(regional/whole-app 共 2)、combobutton(regional/whole-app 共 2)、selectbox(regional/whole-app 共 2)、inputgroup(regional/whole-app 共 2)、
calendar(regional/whole-app 共 2)、toolbar(regional/whole-app 共 2)、slider(regional/whole-app 共 2)。
**chip 無專屬斷言**(見上,region 不可展示;可日後補 inline 斷言)。

**A 家族涵蓋的子部件(sub-parts — 隨父家族一併主題化,不另計、也不算缺口)**:
grid ← column / columns / row / rows / foot / footer;listbox ← listitem / listcell / listhead / listheader / listfoot / listfooter;
tree ← treeitem / treecell / treecol / treecols / treerow / treechildren / treefoot / treefooter;
tabbox ← tab / tabs / tabpanel / tabpanels;combobox ← comboitem;menu ← menubar / menuitem / menupopup / menuseparator;
bandbox ← bandpopup;panel ← panelchildren;input ← textbox / intbox / decimalbox / doublebox / longbox / passwordbox;
spinner ← doublespinner;groupbox ← caption(+ window header)。

---

## B. 候選 / Candidate（有外觀、adopter-facing,尚未宣告變數)

> 依 `zk-edition-components.md` 全表盤點後,「有 theme CSS 但無 `--zk-<comp>-*`」的視覺元件遠多於原列 4 項。
> 依優先序分兩組。「CSS」欄 = 該元件在主題內的樣式檔(相對 `src/main/resources/web/js/`)。新增流程見
> spec〈Recipe — adding a component〉:Audit → `_component-theme.css` 宣告預設 → 元件 CSS 改讀變數 →
> build + `check:css-dsp` → `component-theming.zul` demo + `component-theming.spec.ts` 斷言 → 回填本表。

### B1 — 核心 / CE 高需求（優先)

| Family | 變數? | CSS | 備註 |
|---|---|---|---|
| **checkbox / radio / radiogroup** | ⬜ | `zul/wgt/checkbox.css` | selection control;~31 色彩參考 |
| **rangeslider**（PE）/ **multislider**（EE） | ⬜ | `zkex/slider/css/rangeslider.css`,`zkmax/slider/css/multislider.css` | 獨立樣式檔,未隨本次 slider 一起改;共用 slider 的 DOM/知面詞彙(track/thumb/fill),可直接沿用 `--zk-slider-*` 詞彙補上 |
| **toolbarbutton** | ⬜ | `zul/wgt/toolbarbutton.css` | icon/text 按鈕;可併 button 詞彙(toolbar 本體已於上方 A 落地,見 `--zk-toolbar-*`) |
| **popup / notification / toast** | ⬜ | `zul/wgt/popup.css`,`notification.css`,`toast.css` | 浮層 / 回饋面 |
| **messagebox** | ⬜ | `zul/wnd/messagebox.css` | 對話框(window-like,可沿用 window 詞彙) |
| **a**（anchor） | ⬜ | `zul/wgt/a.css` | 連結 / 類按鈕,低度外觀 |
| **breadcrumb / breadcrumbitem** | ⬜ | (無專屬 CSS) | 目前走 base token;要做需先補 CSS |
| **carousel / carouselitem** | ⬜ | (無專屬 CSS) | 同上 |

### B2 — 進階 / PE·EE（低優先,多為 niche)

| Family | CSS | 備註 |
|---|---|---|
| **daterangebox**（EE） | `zkmax/db/daterangebox.css` | dropdown-input 家族;最適合直接沿用 datebox 變數詞彙 |
| **timepicker**（EE） | `zkmax/inp/timepicker.css` | 輸入;近期已調樣式 |
| **chosenbox / cascader / searchbox**（EE） | `zkmax/inp/*.css` | 進階輸入 |
| **nav·navbar·navitem·navseparator / anchornav / drawer / coachmark**（EE） | `zkmax/nav/*.css`,`zkmax/wgt/drawer.css` | 導覽 / 浮層 |
| **step / stepbar**（EE） | `zkmax/wgt/stepbar.css` | 步驟器 |
| **colorbox / fisheye·fisheyebar / pdfviewer**（PE） | `zkex/*` | 取色器 / dock menu / 檢視器 |
| **tbeditor**（EE） | `zkmax/tbeditor/tbeditor.css` | 富文字工具列 |
| **signature / cropper / dropupload**（EE） | `zkmax/*` | 具 UI chrome 的功能元件 |
| **biglistbox**（EE） | `zkmax/big/biglistbox.css` | listbox 變體;可沿用 listbox 詞彙 |
| **organigram·orgchildren·orgitem·orgnode / goldenlayout·goldenpanel / portallayout·portalchildren**（EE） | `zkmax/layout/*`,`goldenlayout/*` | 圖 / 進階版面(純版面部分見 C) |

---

## C. 刻意不納入 / Excluded by design（➖,永久 N/A)

無「有意義的外觀變數」——結構/版面靠 flex + 全域 token;內容原子與非視覺元件無外觀面。單一 seed 換色即涵蓋。

| 類別 | 元件 |
|---|---|
| 結構 / 版面容器 | box, div, span, cell, separator, absolutelayout·absolutechildren, anchorlayout·anchorchildren, borderlayout(+ north/south/east/west/center), hlayout/vlayout, hbox/vbox(deprecated), splitter(deprecated — 另有 `_splitter.css` 變數), frozen, auxhead/auxheader, scrollview, columnlayout·columnchildren(PE), cardlayout·rowlayout·rowchildren·linelayout·lineitem·splitlayout·tablelayout·tablechildren(EE) |
| 內容原子 | label, image, imagemap, area, caption(併 groupbox/window), space |
| 非視覺 / 功能 / 巢狀資料 | script, style, timer, include, iframe, html, track, fragment, audio, video, camera, chart, fusionchart, barcode, barcodescanner, jasperreport;detail(grid 子)、group/groupfoot、listgroup/listgroupfoot(sel 子)、sliderbuttons(slider 子) |
| 工具 / 回饋 | scrollbar, loadingbar, errorbox, captcha, misc, fileupload(= button 變體) |

> A 家族的子部件(listcell / treecell / column / tab / comboitem…)已歸「A 涵蓋」,不在此重列。

---

## D. 未決 / Undecided（需一次歸類決定)

| 元件 | 現況 | 待決 |
|---|---|---|
| **confirmpopup**（CE 10.4 新原生,`zul/wgt/confirmpopup.css`,~26 色彩參考) | 走全域 token | 歸 B(dialog-like,補變數)或 C(視為 messagebox 類)?建議與 messagebox / popup 一併決定 |

---

## 完整性斷言 (Completeness)

本表以 [`zk-edition-components.md`](zk-edition-components.md)(ZK 10.4 全元件清單,依 jar 分 CE/PE/EE)為母體逐一盤點,
**共 172 個元件,已逐一核對全數歸類**(每個名稱都在本檔可搜到):
**每個元件都落在 A(已落地 27 家族)/ A-涵蓋(子部件)/ B(候選)/ C(刻意不納入,永久 N/A)/ D(未決)其中之一。**

- 「**所有元件完成**」的定義 = **B 清空 + D 歸類**(A 全綠、C 永久 N/A;完成 ≠ 每個元件都有變數)。
- 目前缺口:**B1(CE 核心)約 8 項**(toolbar 本體已移入 A,B1 剩餘的一項改為 toolbarbutton 單獨候選;slider 本體亦已移入 A,原列拆分後 rangeslider PE / multislider EE 改為獨立候選列,計入本項數)+ **B2(PE/EE 進階)約 20+ 項** 待評估補變數;**D** 1 項待歸類。
- 每完成一項 B,把它移入 A 表並補齊 CTV-1…9 + 測試。
