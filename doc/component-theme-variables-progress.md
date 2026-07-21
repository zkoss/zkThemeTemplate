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

**測試對照**（`component-theming.spec.ts`,25 綠):button(regional/disabled/whole-app 共 3)、
input、window、grid、listbox、tree、panel、groupbox、combobox、datebox、timebox、spinner、
bandbox、tabbox、menubar、avatar、badge、rating(regional/whole-app 共 2)、progressmeter(regional/whole-app 共 2)、
paging(regional/whole-app 共 2)。
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
| **slider**（+ rangeslider PE / multislider EE） | ⬜ | `zul/inp/slider.css`(+`zkex`,`zkmax`) | track / thumb / fill |
| **combobutton** | ⬜ | `zul/wgt/combobutton.css` | split button(可沿用 button 詞彙) |
| **selectbox** | ⬜ | `zul/sel/select.css` | 原生 `<select>` 樣式 |
| **inputgroup** | ⬜ | `zul/wgt/inputgroup.css` | 輸入群組容器 |
| **toolbar / toolbarbutton** | ⬜ | `zul/wgt/toolbar.css`,`toolbarbutton.css` | 工具列;toolbarbutton 可併 button 詞彙 |
| **calendar** | ⬜ | `zul/db/calendar.css` | 獨立月曆(亦用於 datebox popup) |
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
**每個元件都落在 A(已落地 21 家族)/ A-涵蓋(子部件)/ B(候選)/ C(刻意不納入,永久 N/A)/ D(未決)其中之一。**

- 「**所有元件完成**」的定義 = **B 清空 + D 歸類**(A 全綠、C 永久 N/A;完成 ≠ 每個元件都有變數)。
- 目前缺口:**B1(CE 核心)約 12 項** + **B2(PE/EE 進階)約 20+ 項** 待評估補變數;**D** 1 項待歸類。
- 每完成一項 B,把它移入 A 表並補齊 CTV-1…9 + 測試。
