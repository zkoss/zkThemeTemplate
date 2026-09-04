# CSS Preprocessor 棄用趨勢評估(2026-09 實查版)

> **這份文件是獨立的。** 讀它不需要先讀別的文件;它自己交代前提、資料來源與結論。
>
> **它取代了什麼:** 本檔 2026-07 的舊版(同檔名)。舊版有三項陳述經 2026-09 複查後**確認為錯**,
> 更正表在 [§3](#3-對-2026-07-舊版的更正)。舊版內容可用 `git log -- doc/css-preprocessor-industry-direction.md` 取回。
>
> **它不取代什麼:** 三份仍然有效的姊妹文件 —— 見 [附錄 A](#附錄-a本地既有文件索引)。
>
> **定位:這是外部佐證,不是決策依據。** IceBlue 棄用 LESS 的決定來自**內部實測**
> (變數層 838/844 已是 `var(--zk-*)` 直通、兩套衝突的 theming API、LESS 3 靜默改壞現代 CSS),
> 不依賴本文件。本文件回答的是另一個問題:**我們選的終點是不是業界收斂中的方向,還是孤例?**
>
> **資料日期:** 2026-09-03。所有數字皆為當日實查(GitHub API / npm registry API /
> `api.webstatus.dev` / 各專案 primary source),非二手轉述。未能證實的一律標記,見 [§9](#9-未證實與已證偽的流傳說法)。

---

## 目錄

- [一句話結論](#一句話結論)
- [§1 三件被混為一談的事](#1-三件被混為一談的事)
- [§2 各大 framework 現況總表(2026-09 實查)](#2-各大-framework-現況總表2026-09-實查)
- [§3 對 2026-07 舊版的更正](#3-對-2026-07-舊版的更正)
- [§4 Java / 企業框架對照組 —— 最貼近 ZK 的四個案例](#4-java--企業框架對照組--最貼近-zk-的四個案例)
- [§5 原生 CSS 補上了什麼 —— Baseline 時間軸](#5-原生-css-補上了什麼--baseline-時間軸)
- [§6 原生 CSS 還缺什麼 —— 誠實的天花板](#6-原生-css-還缺什麼--誠實的天花板)
- [§7 利與弊](#7-利與弊)
- [§8 採用數據 —— 兩個互相矛盾的指標](#8-採用數據--兩個互相矛盾的指標)
- [§9 未證實與已證偽的流傳說法](#9-未證實與已證偽的流傳說法)
- [§10 對 ZK 的意義](#10-對-zk-的意義)
- [§11 本次研究帶出的待決策事項](#11-本次研究帶出的待決策事項)
- [附錄 A:本地既有文件索引](#附錄-a本地既有文件索引)
- [附錄 B:術語表](#附錄-b術語表)
- [附錄 C:承重的引用來源](#附錄-c承重的引用來源)

---

## 一句話結論

**「業界在棄用 CSS preprocessor」這句話是錯的。真正發生的是:preprocessor 被降級 ——
從『對外的客製介面』降級成『build 期的產生器』,而對外介面一律換成 CSS custom properties。**

這個修正很重要,因為兩種說法會導向不同的對外論述,而錯的那個很容易被打臉:

| 說法 | 證據支持度 |
|---|---|
| 「主流 framework 正在整個拿掉 preprocessor」 | ❌ **實查 20+ 個專案,只有 Tailwind v4 一個做到,而且它自己就是 build tool** |
| 「主流 framework 不再把編譯期變數當作對外 theming API」 | ✅ **本次調查的每一個專案都符合,零例外** |

第二句才是我們該講的話,而且它比第一句強得多 —— 因為它**沒有反例**。

---

## §1 三件被混為一談的事

大部分「Sass 已死 / CSS-in-JS 已死」的文章,是把三個獨立、速度不同的遷移混在一起講。分開看才有用:

### 1.1 遷移 A:preprocessor 作為「對外 theming 介面」→ 已定案退場

**這一項沒有反例。**本次調查的每一個 library —— 不論它自己是用 Sass、CSS-in-JS 還是純 CSS 寫的 ——
對外暴露的 theming API 都是 `var(--prefix-*)`:

| Library | 對外 token 前綴 | 它自己用什麼寫 |
|---|---|---|
| IBM Carbon | `--cds-*` | **Sass** |
| Angular Material | `--mat-sys-*` | **Sass** |
| Bootstrap 6 | `--bs-*` | **Sass** |
| PrimeFaces (JSF) | `--p-*` | **Sass** |
| Adobe Spectrum | `--spectrum-*` / `--mod-*` | 純 CSS + PostCSS |
| Vaadin | `--lumo-*` | 純 CSS |
| Web Awesome | `--wa-*` | 純 CSS(Lit) |
| PrimeNG / PrimeVue / PrimeReact | `--p-*` | 純 CSS(tagged template) |
| Salesforce SLDS 2 | `--slds-g-*` | 未公開 |
| Microsoft Fluent v9 | `--colorNeutral*` … | TypeScript(Griffel) |
| MUI v9 | `--mui-*`(選用) | TypeScript(Emotion) |
| Mantine | `--mantine-*` | 純 CSS Modules |
| Ant Design v6 | CSS 變數模式**預設開啟** | TypeScript(CSS-in-JS) |

Fluent 的做法最直白:開發者 import 的那個 `tokens` 物件,原始碼裡**字面上就是一張 `var(--…)` 字串表**
(`packages/tokens/src/tokens.ts`):

```ts
export const tokens: Record<keyof Theme, string> = {
  colorNeutralForeground1: 'var(--colorNeutralForeground1)',
  colorNeutralForeground1Hover: 'var(--colorNeutralForeground1Hover)',
  …
```

### 1.2 遷移 B:preprocessor 作為「build 期產生器」→ 大部分專案留著

Carbon、Angular Material、Bootstrap 6、GOV.UK Frontend、PrimeFaces 全部保留 Sass,
而且是**刻意的、寫在文件裡的**。Bootstrap 6 開發分支的客製文件直接把分工寫死:

> "**Bootstrap is written in Sass.** Our source `.scss` files use Sass maps to define design tokens,
> mixins to generate repetitive CSS patterns, and the `@use`/`@forward` module system to organize
> everything. … If you don't need that level of control, you can skip Sass entirely and customize
> via CSS custom properties at runtime instead."
> — `twbs/bootstrap@v6-dev` › `site/src/content/docs/customize/sass.mdx`

> "**We consider CSS variables to be the first-class customization layer for our users.**"
> — 同分支 › `customize/overview.mdx`

**Sass 給作者、CSS 變數給使用者。**這就是遷移 A 與遷移 B 的分工。

### 1.3 遷移 C:runtime CSS-in-JS 退場 → 進行中,且**未完成**

這是另一條獨立的線,常被誤當成同一件事:

- **已完成**:Mantine v7(2023-09-18)脫離 Emotion 改用 CSS Modules;
  Primer React v38(2025-10-27)脫離 styled-components 改用 CSS Modules,並**移除 JS theming**;
  Fluent v9 用 Griffel 做 AOT 編譯。
- **未完成**:**MUI 的零 runtime 方案 Pigment CSS 官方暫停**,v9 仍出貨 Emotion;
  **Chakra UI v3 刻意保留 Emotion**。

> "Pigment CSS remains in alpha phase and is currently on hold." … "That prioritization led us to
> concentrate our efforts on Base UI."
> — [mui.com/blog/2026-and-beyond](https://mui.com/blog/2026-and-beyond/),2026-01-01

> "To reduce the breaking change surface, we've decided to keep emotion (and runtime css-in-js) to
> preserve the dynamic styling benefits."
> — [Chakra UI v3 公告](https://chakra-ui.com/blog/announcing-v3),2024-10-22

**對 ZK 的意義**:遷移 C 與我們無關(我們從來沒有 CSS-in-JS),但它是「業界在棄用 X」這類論述
最常被引用的證據。引用時要分清楚,否則會被指出「MUI 到現在還在用 Emotion」而失去可信度。

---

## §2 各大 framework 現況總表(2026-09 實查)

### 2.1 總表

| Framework | 自己用什麼寫 | 還有 preprocessor 嗎 | 對外 theming API | 從哪裡遷來 |
|---|---|---|---|---|
| **Tailwind CSS v4** | TypeScript + Rust;CSS 用 `@theme` | **無,而且明文禁止併用** | CSS custom properties | v3 的 PostCSS plugin 鏈 |
| **Bootstrap 6**(alpha) | **SCSS**(45 個 partial) | **有,刻意保留** | `--bs-*` | 未遷移;v5→v6 改的是 CSS 變數地位 |
| **Bulma 1.0** | **SCSS**(Dart Sass) | **有** | CSS 變數(輸出端) | v0 → v1 是**改寫成 Sass**,不是離開 |
| **Foundation** | SCSS | 有 | Sass 變數 | 停滯:最後 release 2024-09-27 |
| **Pico CSS** | **SCSS** | **有,且是官方推薦的客製路徑** | Sass `@use ... with (…)` | 未遷移 |
| **Open Props** | 純 CSS(Node 產生) | 無(僅 PostCSS) | CSS custom properties | 從未有過 |
| **UnoCSS / Panda / vanilla-extract / StyleX** | TypeScript | 無 | JS/TS token | 取代的是 runtime CSS-in-JS,**不是 Sass** |
| **MUI v9** | TypeScript(Emotion runtime) | 無 | JS theme 物件 + 選用 `--mui-*` | JSS → Emotion;Pigment CSS **暫停** |
| **IBM Carbon v11** | **SCSS**(Sass Modules) | **有,是產品介面的一部分** | Sass token → `var(--cds-*)` | node-sass → Dart Sass |
| **Angular Material 20** | **Sass(使用者也必須用)** | **有** | `mat.theme` mixin → `--mat-sys-*` | 未遷移 |
| **GOV.UK Frontend v6** | **SCSS** | **有,而且門檻提高** | Sass + 逐步外露 custom properties | v6.0.0(2026-02-09)起**要求 Dart Sass ≥ 1.79** |
| **Primer(`primer/css`)** | SCSS(經 PostCSS) | 有 | utility class | **凍結**(官方標記 KTLO) |
| **Primer React v38** | **CSS Modules(純 CSS)** | 無 | `@primer/primitives` custom properties | styled-components(2025-10) |
| **Adobe Spectrum** | **純 CSS + PostCSS** | 無 Sass/LESS | `--mod-*` → `--spectrum-*` 兩層 | 本代從未用過 Sass |
| **Salesforce SLDS 2** | 未公開(SLDS 1 是 Sass) | 未知 | styling hooks(`--slds-g-*`) | design tokens → styling hooks |
| **Fluent UI v9** | TypeScript(Griffel AOT) | 無 | JS theme → CSS 變數 | v8 / Northstar(2025-07 EOL) |
| **Ant Design v5 / v6** | TypeScript(CSS-in-JS) | **無 —— v5 移除 LESS** | JS token;**v6 預設 CSS 變數模式** | **LESS → CSS-in-JS** |
| **Chakra UI v3** | TypeScript(**仍是 Emotion**) | 無 | JS system config + CSS 變數 | 刻意不遷移 |
| **Mantine v7+** | **純 CSS / CSS Modules** | PostCSS | `--mantine-*` | **Emotion → 原生 CSS**(2023-09) |
| **Web Awesome v3**(Shoelace 後繼) | **純 CSS(Lit `css` 樣板)** | **無** | `--wa-*` + `::part()` | Shoelace **已 sunset**;從未有 preprocessor |
| **Vaadin** | **純 CSS** | **無** | `--lumo-*` | **Sass/Valo → CSS 變數**(V10,2018) |
| **PrimeNG / PrimeVue / PrimeReact 18+** | **純 CSS(tagged template)+ `dt()`** | **無** | 三層 token → `--p-*` | **SASS 主題 → token preset** |
| **PrimeFaces(JSF)** | **SCSS(dart-sass Maven plugin)** | **有** | SCSS **產生** `--p-*` | 未遷移 |

### 2.2 三種模式,不是一個趨勢

**模式 1 —— 真的整個拿掉(n = 1)。**只有 **Tailwind v4**,而且它做得到是因為**它自己就是 build tool**:
它把 `@import` bundling、nesting、vendor prefix 全部吸收進 Lightning CSS + Rust 引擎。它的態度是規範性的:

> "Tailwind CSS v4.0 is a full-featured CSS build tool … and is **not designed to be used with CSS
> preprocessors like Sass, Less, or Stylus**. **Think of Tailwind CSS itself as your preprocessor**"
> — [tailwindcss.com/docs/compatibility](https://tailwindcss.com/docs/compatibility)

> "Because of this it is **not possible** to use Sass, Less, or Stylus for your stylesheets"
> — [升級指南](https://tailwindcss.com/docs/upgrade-guide)

⚠️ **常見誤解**:Tailwind v4 並沒有丟掉 PostCSS,只是把它降級到獨立套件 `@tailwindcss/postcss`,
預設路徑改成 `@tailwindcss/vite` / `@tailwindcss/cli`。準確的說法是「丟掉 preprocessor 與
`postcss-import`/`autoprefixer` 鏈」,不是「丟掉 PostCSS」。

**模式 2 —— Sass 降級為產生器(主流)。**Bootstrap 6、Angular Material、Carbon、GOV.UK Frontend、
Bulma、PrimeFaces。Sass 留下來做 map、mixin、迴圈、module system;CSS 變數變成對外 API。

**模式 3 —— 本來就沒有。**Open Props、Adobe Spectrum、Web Awesome、Vaadin、Prime 的 JS 家族,
以及 TypeScript 陣營(UnoCSS/Panda/vanilla-extract/StyleX)。

> ⚠️ **TypeScript 陣營不是「棄用 Sass」的證據。**實查四個專案的官方說明:Panda CSS 講的是
> **React Server Components**,UnoCSS 講的是 Tailwind 的引擎架構,兩者**完全沒有提到 Sass 或 LESS**。
> 它們取代的是 **runtime CSS-in-JS**。唯一自比 Sass 的是 vanilla-extract 的 README:
> "All styles generated at build time — **just like Sass, Less, etc.**" —— 它主張的是繼承 Sass
> 在 build 裡的**位置**,而不是反對 Sass。

---

## §3 對 2026-07 舊版的更正

> **先講結論:四項更正都不改變最終結論,但有一項會改變「對外怎麼講」。**
> 更正 #2 拿掉了一條我們曾經用過的論據(「LESS 已死」),但那條論據從來不是決策依據 ——
> IceBlue 棄用 LESS 的兩條決定性理由是內部實測的(變數層名存實亡、兩套衝突的 theming API),
> 不受影響。**已完成的 IceBlue 遷移工作無需重新檢討。**

| # | 舊版寫的 | 2026-09 實查 | 影響 |
|---|---|---|---|
| 1 | 「mixin / function:規格已定案但尚未出貨,`@mixin --name{}` + `@apply --name` **預計 Chrome 146**」 | ❌ **錯,而且錯兩層。**(a) `@mixin`/`@apply` **至今沒有任何瀏覽器出貨**;chromestatus 的 "CSS mixins" 條目狀態是 **Proposed(not yet shipped)**,條目本身 2026-07-08 才建立,Firefox/Safari 皆為 *No signal*。Chrome 目前已到 **153**,146 早已過去。(b) 真正出貨的是**另一個東西** `@function`,Chrome/Edge **139**(2025-08-05),且**只有 Chromium** | **加重「迴圈/mixin 只能靠產生器」的判斷。**原本以為 2026 就有原生解,實際上沒有時程 |
| 2 | 「LESS 已進入維護模式,4.2 在 2025-11 發布,但沒有實質新功能」 | ❌ **錯。**LESS 2022–2024 確實近乎停擺(每年 9–11 個 commit),但 **2024-12 起復甦**:2025 年 24 個 commit、**2026 年至 9/3 已 81 個**;2026 內連續發布 4.5 → 4.9.1,並於 **2026-08-13 推出 `5.0.0-alpha.1`**(編譯器重寫,預設保留 CSS nesting、可輸出 `:is()`),**2026-09-02** 同日發 4.9.1 與 5.0.0-alpha.2。日期也錯:4.2.1 是 2024-12-08 | **對外論述必須改口。**不能再說「LESS 已死」。可以說的是「LESS 沒有旗艦使用者了」—— 這句仍成立(Bootstrap v4 走、Ant Design v5 走) |
| 3 | 「**Bootstrap 6 目標是『完全由 CSS 變數驅動』**」 | ⚠️ **誤導。**Bootstrap 6 開發分支 **明文保留 Sass**,`v6-dev` 有 45 個 `.scss` partial、`package.json` 版本 `6.0.0-alpha1`、devDep `sass ^1.103.1`。改變的是**分工宣告**:CSS 變數成為使用者的第一線客製層,Sass 仍是作者的產生器 | **這是本次最重要的更正。**原本被當成「連 Bootstrap 都要走了」的旗艦證據,實際上是**反面證據** |
| 4 | 「Ant Design v5 砍掉 LESS,改 CSS-in-JS」 | ✅ 正確,但**漏了一半**:v5 同時**移除了 v4 的 CSS 變數**(遷移文件:"Remove css variables and dynamic theme built on top of them"),整個押注 JS token;直到 v5.12 才把 `cssVar` 加回來 | 讓「繞路」這個教訓更完整:Ant 不只繞了 CSS-in-JS 的路,**還一度把 CSS 變數也丟掉** |
| 5 | 「MUI … 並發展 Pigment CSS(build 期抽取、零 runtime)」 | ⚠️ **過期。**Pigment CSS **官方暫停**(2026-01-01);MUI 版本是 **v7 → v9**(2026-04-08,**沒有 v8**),`@mui/material@9.4.0` 仍 peer-depend Emotion | 不要把 MUI 當成「零 runtime 已達成」的例子 |
| 6 | 「Fomantic-UI 仍是 LESS —— 主流專案裡幾乎唯一的 LESS 使用者」 | ⚠️ **本次未複查。**標為未證實 | 無 |

---

## §4 Java / 企業框架對照組 —— 最貼近 ZK 的四個案例

前面三十幾個專案大多是前端 JS 生態。這一節只看**跟 ZK 同一類**的:有 server 端、有企業客戶、
有付費主題目錄、客戶會 fork 主題的那種。

### 4.1 Vaadin —— 早在 2018 就走完,理由跟我們一模一樣

Vaadin 7/8 有 Sass 版的 Valo 主題與參數化客製,和 IceBlue 的 `@themePalette` 是同一個形狀。
官方 8 → 14 遷移指南寫得非常直白:

> "Vaadin 7 introduced the themes in Sass format and the parameterized Valo theme, which made it
> possible to customize the UI by tweaking the parameters."
> "Since we introduced Sass … browsers have started to support CSS Custom Properties, which brings
> the customizability gains from Sass to basic CSS, **without the overhead of needing to compile the
> Sass to CSS**."
> "**Thus, Vaadin 14 itself isn't using Sass**, but you can of course use it for your own application theming if you want to."

三個理由,我們全部命中:免編譯步驟、值可在 runtime 改、**CSS 變數能穿透 Shadow DOM 而 Sass 變數不能**。
代價他們也照付了:**"None of the old themes are available for Vaadin platform."** ——
Valo 沒有活下來。這正是我們 Theme Pack 23 套主題要面對的同一題。

### 4.2 PrimeFaces vs PrimeNG —— 同一家公司,兩條路,這是最有參考價值的一組

| | PrimeFaces(JSF / Java) | PrimeNG / PrimeVue / PrimeReact(JS) |
|---|---|---|
| 元件樣式怎麼寫 | **SCSS**,`mvn dart-sass:compile-sass` | **純 CSS 字串**(tagged template)+ `dt('token.path')` |
| 對外 API | SCSS **產生** `--p-*` custom properties | 三層 token(primitive → semantic → component)→ `--p-*` |
| 主題目錄 | ~40 套具名主題,由共用 `theme-base` partial 生成 | preset:Aura / Material / Lara / Nora |

PrimeNG 的元件樣式長這樣(`@primeuix/styles` › `packages/styles/src/button/index.ts`):

```ts
export const style = /*css*/ `
    .p-button {
        color: dt('button.primary.color');
        background: dt('button.primary.background');
        padding: dt('button.padding.y') dt('button.padding.x');
        border-radius: dt('button.border.radius');
```

`/*css*/` 只是給編輯器上色用的註解。**沒有 Sass、沒有 LESS。**

**為什麼 JSF 那邊留著 Sass?**最合理的解讀:~40 套主題是一個**build 期的乘法問題**
(同一份 `theme-base` × N 個色盤),Sass 的迴圈解得很便宜;而 JSF 的客群本來就接受 Maven 編譯步驟。
**這正是我們 Theme Pack 的處境。**但注意 PrimeFaces **仍然輸出 `--p-*` 給 runtime** ——
它同樣做了 §1 的分工:Sass 當色盤產生器,custom properties 當對外 API。

> ⚠️ **PrimeNG 家族 2026 起轉為商業授權。**`primefaces/primeuix` 已封存;PrimeNG 22 /
> PrimeReact 11 / PrimeVue 5 併入商業 "PrimeUI"(launch 價 $599/dev,2026 年底前),
> 不再以開源發布。這不影響它的 CSS 架構值得參考,但**它以後不能當成可自由引用的公開範例**。

### 4.3 Ant Design 的弧線 —— 對 ZK 最貼切的前車之鑑

Ant Design 的起點跟 IceBlue 幾乎一模一樣。完整弧線(含本次補上的一段):

```
v4:   LESS + 編譯期 modifyVars 換色盤          ← IceBlue 2026-07 之前的位置
       ↓ 動機:客戶要 runtime 換主題,編譯期變數做不到
v5:   砍掉 LESS,改 CSS-in-JS
       ↓ 而且「順手」把 v4 的 CSS 變數也一起移除 ← 繞路的第二段,舊版文件漏掉
v5.12: 把 cssVar 模式加回來(design token = CSS 變數)
v6:   cssVar 預設開啟、LESS 正式除名、放棄 IE
```

v5 遷移文件的原文,四句話講完整段歷史:

> "Remove less, adopt CSS-in-JS, for better support of dynamic themes."
> "All less files are removed, and less variables are no longer exported."
> "**Remove css variables and dynamic theme built on top of them.**"
> — `ant-design` › `docs/react/migration-v5.en-US.md`

**三個可以直接拿來用的教訓:**

1. **推動力跟我們一樣** —— 不是「LESS 語法不好」,而是**編譯期變數無法支援 runtime 換主題**。
   我們的 Theme Pack(23 套 `palettes/*.less`)是完全相同的問題。
2. **CSS-in-JS 那一段是繞路,終點是 CSS 變數。**我們直接跳到終點。
3. **繞路的代價是兩次 breaking change**,而且中間那次還拿走了客戶已經在用的 CSS 變數。
   我們只做一次。

### 4.4 GOV.UK Frontend —— 反方向的旗艦案例,必須誠實列出

政府級設計系統,**2026-02-09 發布 v6.0.0 這個 major**,而它的 breaking change 是**收緊** Sass 要求:

> "### Use Dart Sass v1.79.0 or later to compile your Sass stylesheets
> GOV.UK Frontend no longer supports Ruby Sass, LibSass or versions of Dart Sass older than v1.79.0."

同時它也在**增加** custom properties 的使用。**又是 §1 的同一種分工。**
把它列出來是因為:如果有人拿「政府/大型組織都在去 preprocessor」來論證,這是直接的反例。

---

## §5 原生 CSS 補上了什麼 —— Baseline 時間軸

資料來源:`api.webstatus.dev`(即 web.dev / MDN Baseline 徽章的同一份資料)。
「widely available」= 最後一個主流瀏覽器出貨後滿 30 個月。

| 能力 | Baseline 狀態 | 取代了 preprocessor 的什麼 |
|---|---|---|
| Custom properties `var()` | **Widely** — newly 2017-04-05,widely **2019-10-05** | 變數(而且**比 preprocessor 好**:runtime、可繼承、DevTools 看得到、客戶可覆寫) |
| Logical properties | **Widely** — widely **2024-03-20** | 整個「第二份 RTL stylesheet」問題 |
| `@layer` cascade layers | **Widely** — widely **2024-09-14** | **preprocessor 沒有對應物** |
| `@media` range `(width >= 48rem)` | **Widely** — widely **2025-09-27** | breakpoint mixin 的一半 |
| Container queries(size) | **Widely** — widely **2025-08-14** | **preprocessor 沒有對應物** |
| `color-mix()` | **Widely** — widely **2025-11-09** | `darken()` / `lighten()` / `mix()` |
| CSS nesting | **Widely** — newly 2023-12-11,**widely 2026-06-11** | 巢狀 |
| `light-dark()` | **Newly** — 2024-05-13 | 深淺色雙值 |
| `@property` | **Newly** — 2024-07-09 | 型別化的變數 |
| Relative color `oklch(from …)` | **Newly** — 2024-09-16 | 顏色運算 |
| `@scope` | **Newly** — **2026-03-24** | **preprocessor 沒有對應物** |
| Container **style** queries `@container style(--x: y)` | **Newly** — **2026-05-19** | 最接近「條件式 CSS」的原生機制 |
| `@function` | ❌ **Limited,非 Baseline** — 僅 Chrome/Edge 139(2025-08-05) | (見 §6) |
| `if()` | ❌ **Limited,非 Baseline** — 僅 Chrome 137 | (見 §6) |
| `@mixin` / `@apply` | ❌ **沒有任何瀏覽器出貨** | (見 §6) |

**兩個必須自己知道的時間點:**

- **CSS nesting 是 2026-06-11 才到 "widely available" 的** —— 也就是三個月前。
  在此之前用原生巢狀不是錯,但「原生巢狀已經很成熟」這句話在 2025 年講會太早。
- **`@scope`(2026-03)與 style query(2026-05)都非常新。**Marble 的 `reset-embed.css` 用了 `@scope`。
  這不是問題(它有明確的降級行為),但**不要把它們寫進對客戶的相容性承諾**,除非同時寫出瀏覽器下限。

**「我要支援舊瀏覽器」已經不再是留住 Sass 的理由。**Lightning CSS 可以把 nesting、`:is()`/`:not()`、
logical properties、`lab()`/`oklch()`、`light-dark()`、相對顏色、media query range 語法全部降級,
外加 autoprefix 與 minify。

---

## §6 原生 CSS 還缺什麼 —— 誠實的天花板

### 6.1 迴圈與 map —— **唯一沒有解、也沒有提案的缺口**

`@each` / `@for` / `map.get` 沒有原生對應物,**規格路線圖上也沒有**。

而且這不是邊緣需求。Web Almanac **2022** CSS 章(這是最後一份有 CSS 章的版本 ——
2024 與 2025 都沒有)量到:在使用 SCSS 的頁面中,**`@if` 65%、`@for` 60%、`@each` 60%**。
也就是**六成的真實 SCSS 專案在用迴圈**。

**最有力的一句話,來自最沒有立場護航 Sass 的人。**Miriam Suzanne 同時是 Sass 核心團隊成員、
CSSWG 受邀專家,而且**就是原生 `@mixin`/`@function` 提案的作者**。她在 CSS Day 2025 的講題
就叫〈CSS Functions & Mixins: Is Sass Dead Yet?〉,投影片寫著:

> "Sass provides… Loops, Lists, & Objects 🎉 — ***Very unlikely* to get loops in CSS**"
> "**Why make the browser Solve Server-side Problems?**"

在她的規格說明文件裡,理由是原則性的、不是時程問題:

> "I think it would be reasonable to draw a boundary here, since **CSS is a declarative language**.
> Adding imperative flows would likely cause confusion around the execution model."
> — [CSS Mixins & Functions Explainer](https://css.oddbird.net/sasslike/mixins-functions/)

**⇒ 這不是「還沒做」,是「大概不會做」。**規劃時應該假設迴圈永遠不會有原生解。

**連 Tailwind 也沒有反駁這一點 —— 它只是把迴圈搬到自己的引擎裡。**官方相容性文件原文:

> "In Tailwind, the sorts of classes you may have used **loops** for in the past (like `col-span-1`,
> `col-span-2`, etc.) are **generated for you on-demand by Tailwind**"

換句話說,唯一「整個拿掉 preprocessor」的專案,做法是**自己寫了一個 preprocessor 來做迴圈**。

對我們:這正是 Font Awesome 的 ~700 組 name→codepoint 對應(IceBlue 的 **P6**)。
清單本身就是資料,只能寫產生器 —— 而且這個結論不會因為等待瀏覽器而改變。

### 6.2 `@mixin` / `@apply` —— **沒有任何瀏覽器出貨**(舊版文件在此處出錯)

三重證據:

1. **MDN**:*"CSS mixins are **not currently supported in any browser**."*
2. **chromestatus** feature 5108022310469632("CSS mixins"):Chrome desktop 狀態
   **"Proposed (not yet shipped)"**,條目 **2026-07-08** 才建立,Firefox / Safari 皆 *No signal*。
3. Chrome 目前已到 **153**。若真如舊版所寫在 146 出貨,現在早該在 stable 了。

唯一存在的形態是實驗旗標(Canary + `--enable-features=CSSMixins`,2025-03 的原型連
「把巢狀內容傳進 mixin」都還做不到)。

### 6.3 `@function` —— 出貨了,但只在 Chromium,而且比 Sass 弱很多

- **能力上限**:只能**回傳一個值**,不能產生宣告、不能改屬性;
  MDN 明寫 *"There are no early returns in CSS functions like there are in JavaScript functions."*;
  無遞迴、無副作用。
- **跨瀏覽器現實**:Mozilla 與 WebKit 的 standards-positions issue **都在 2024-12-18 開立,
  至今(約 21 個月)兩邊都沒有給出正式立場**,零 / 一則留言。caniuse 全球支援度 **68.68%**
  (Chrome/Edge 139+、Opera 123+;Firefox 至 158 無、stable Safari 至 27 無)。
- **就算能用,DX 也還不行。**Jane Ori 2026-05-29 的實測評論:引數給太多或給太少而無預設值,
  結果都是靜默變成 `initial`;`integer` 型別的引數若不用 `calc()` 包住 `3.14`,
  會在 computed-value 之前就被拒絕。她的結論是
  *"the DX for CSS custom functions, as they are now, is … not good."*

**⇒ 這是 2026 年最鋒利的「留住 preprocessor」技術論據**:能取代 Sass 程序性核心的那幾個功能,
恰好就是不能跨瀏覽器用的那幾個。

### 6.4 `@use` / `@forward` 模組系統 —— 沒有原生對手

Sass 模組系統(2019-10-02)提供四件原生 CSS 完全沒有的東西:命名空間、私有成員
(`-`/`_` 開頭)、**`with` 子句的顯式設定**、以及「只執行一次」語意。

對於**需要下游在 build 期重新設定的多品牌 / 多租戶設計系統**,這是目前無可取代的。
Carbon 保留 Sass 的真正理由就是這個 —— `@use '@carbon/styles' with (…)` 是它的公開 API。

### 6.5 其餘缺口

| 缺口 | 說明 |
|---|---|
| Custom property 不能用在 `@media` 條件 | 原理性限制:media query 在**沒有元素脈絡**時求值,而 `var()` 在元素的 computed-value 階段才代換。**已有原生 workaround**(`@property` + `min()` + container style query),但 style query 是 **2026-05** 才 Baseline,可讀性也明顯較差。⚠️ **這條論據有保存期限**:CSSWG issue #8088 已**決議允許** `var()` 出現在 dimensional container query 內(實作進度未證實),而 `@custom-media` 也已在規格中(MDN 標示 Limited availability)。講的時候要說「目前」,不要說「本質上永遠不行」 |
| **原生巢狀與 Sass 巢狀語意不同** | Sass 作者 Natalie Weizenbaum 親自列出三項:原生巢狀會把父選擇器包進 `:is()`,而 **`:is()` 取的是最具體那一支的 specificity**;後代組合子展開結果不同(`.a :is(.b .c)` vs `.a .b .c`,匹配的元素不一樣);**`&-suffix` 沒有 CSS 對應物**(原生把 `&div` 讀成型別選擇器),Sass 明言會「無限期維持」這個功能。⇒ Sass→原生**不是**字串取代,是要重看選擇器 |
| 字串串接(BEM 的 `&__title`) | 原生巢狀的 `&` 是**選擇器參照**,不是字串,不能串接 |
| build 期錯誤 | Sass 有 `@error`/`@warn`/`@debug`;**CSS 的錯誤模型是靜默丟棄** —— 打錯的屬性名不會有任何診斷 |
| `//` 單行註解 | 無 |
| partial 與檔案合併 | 原生 `@import` 會 render-blocking 且串行化請求,實務上仍需 bundler |
| `@extend` | 無原生對應物 —— 但**Sass 官方文件自己勸退**("For non-semantic collections of styles, writing a mixin can avoid cascade headaches"),所以這不是強論據 |

---

## §7 利與弊

### 7.1 棄用 preprocessor 的好處

**真的好處:**

| 好處 | 憑據 |
|---|---|
| **收斂成一套客製 API** | 這是最強的一條。同時有 LESS 變數與 CSS 變數兩套,客戶會問「我該覆寫哪一個」;IceBlue 的實測是 **838/844 條 LESS 變數已經只是 `var(--zk-*)` 的直通轉發**,那一層純粹是無作用的間接 |
| **客戶不必重新 build jar** | 從「改 LESS 變數 → 重編」變成「覆寫一個 custom property」。Vaadin 2018 就是拿這個當理由 |
| **可分區、可 runtime 切換** | 編譯期變數做不到;`data-density` / `--zk-color-primary` 可以只套一個區塊 |
| **拿掉一整層靜默失敗的風險** | LESS 3.13.1 會**靜默改壞** `oklch(from … min(l, .54) …)`、`minmax(min(var(--x),100%),1fr)`、`grid-column: 1 / -1`,而 build 仍 exit 0 |
| **preprocessor 自己也在製造遷移債** | Sass 為了追上 CSS 一直在改自己:`@import` 棄用、`darken()`/`lighten()` 棄用、**保留 `--` 命名空間給未來的原生 `@mixin`/`@function`**、甚至**因為 CSS 出了 `if()` 而棄用自己 15 年的 `if()`**。約 25 條 breaking change 中,約 8 條是為了相容 CSS |
| **`@layer` / `@scope` / container query 只有原生有** | 在這一塊 preprocessor 是**負分**,不是中性 |

**常被誇大的好處(不要拿來當論據):**

- ❌ **「LESS/Sass 已死」** —— 見 §3 #2 與 §8.2。兩者都在活躍開發。
- ❌ **「效能會變好」/「custom property 有 runtime 成本」** —— **兩個方向都不成立,而且證據相當硬。**
  web.dev 量測:繼承型 unregistered custom property **256 runs/s**、registered **252 runs/s**、
  一般屬性 `accent-color` **163 runs/s** —— 也就是 custom property **比等價的一般屬性更快**,
  註冊的額外成本是 **+0.06ms**。GitLab Pajamas 設計系統的獨立 benchmark 同樣結論:
  *"There is **no significant performance impact**"*(539ms → 549ms,1.8%)。
  唯一站得住腳的版本是**很窄的那個**:不要在 `:root` 上放一個會在 runtime 被翻動、
  而底下有兩萬多個元素在繼承的變數(Lisi Linhart 實測:同一個變數改在 25,000 個子元素的父層 = **76ms**,
  改在單一子元素 = **1.9ms**)。⇒ **規則是「控制作用域」,不是「不要用變數」。**
- ❌ **「業界都這樣做了」** —— 只有 Tailwind v4。用這句話會被反例打臉。

### 7.2 棄用的代價

**真代價:**

| 代價 | 說明 | 我們的處境 |
|---|---|---|
| **迴圈必須自己寫產生器** | 沒有原生解、沒有提案(§6.1) | 已有 —— Marble 的 `build-css.js` 產生 Lucide icon CSS;IceBlue 的 FA 是 **P6** |
| **mixin(帶參數)拿不回來** | 沒有任何瀏覽器出貨(§6.2) | IceBlue 實測:vendor-prefix mixin 展開後約 **980 條**對現代瀏覽器是死重量,反而該刪 |
| **失去 build 期錯誤** | CSS 靜默丟棄 | 用 CI 的「來源↔輸出逐條 declaration diff」補 |
| **換掉客戶的建置流程** | `zkless-engine` 是**出貨給客戶的工具**,不只是內部腳本 | 需要把 build 工具產品化(既有決策 **L-6**) |
| **付費主題的發布格式要重做** | Theme Pack 23 套以 `palettes/*.less` 出貨 | 既有決策 **L-7**;Vaadin 的前例是 Valo **沒有活下來** |
| **風險換了地方,沒有消失** | 從 LESS 換到 **minifier** | 見 §11 D1 —— 這一項本次研究有新證據 |
| **手寫成本上升** | 前綴從「mixin 自動展開」變成「來源檔的字面文字」,每加一個圓角要手抄 5 行 | 已納入 L-2 瀏覽器支援聲明的決策(拍板:保留 `-webkit-`,只刪 `-moz-`/`-ms-`/`-o-`/`-khtml-`) |
| **巢狀不是字串取代** | `:is()` specificity 變化、後代組合子語意不同、`&-suffix` 無對應物(§6.5) | IceBlue 已照此處理 —— `&-input` 一律展開成明列選擇器清單,不靠字串串接 |
| **`//` 單行註解會消失** | 三份獨立的遷移實錄(2023 / 2024 / 2026)都提到這一項 | 機械式,但會出現在每一個檔案 |

**常被誇大的代價:**

- ❌ **「舊瀏覽器怎麼辦」** —— Lightning CSS 全部能降級(§5 結尾)。
- ❌ **「`@extend` 會不見」** —— Sass 官方自己勸退(§6.5)。

### 7.3 一個必須分開回答的問題:「離開 LESS」≠「離開 preprocessor」

這是本文件對 ZK 最實用的一句話。兩個決定的證據強度差很多:

| 問題 | 答案 | 強度 |
|---|---|---|
| 該不該離開 **preprocessor**? | 看情況。主流是「降級成產生器」,不是拿掉 | 中等 |
| 該不該離開 **LESS**? | **是。**旗艦使用者已全數離開:Bootstrap v4(2018)換 Sass、Ant Design v5(2022)直接移除 | **強** |
| 那要不要 LESS → Sass? | **不要。**只是換一個同樣要淘汰的中間層,而且要重寫全部語法 | 強 |

### 7.4 最誠實的一句話:分界線是「build 期 vs runtime」,不是「舊 vs 新」

如果整份文件只能留一句,應該是這句 —— 而且它同樣出自 Miriam Suzanne:

> "**If you don't need it anymore… Then Don't Use It**"

配上她的另一句 "Why make the browser Solve Server-side Problems?",完整的立場是:

| 領域 | 誰贏了 | 為什麼 |
|---|---|---|
| **runtime**(theming、cascade、依容器而變的值、深淺色、高對比) | **原生 CSS,決定性地** | 這些條件只有瀏覽器知道;preprocessor 在編譯時根本拿不到 |
| **build 期**(迴圈、map、模組系統、大聲失敗) | **preprocessor 仍然持有** | 這些本來就是 server-side / build-side 的問題,沒有理由要瀏覽器解 |

**所以「preprocessor 過時了」是錯的問法。**對的問法是:
**「我的專案在 build 期還有沒有真的需要它做的事?」**

對 IceBlue / Marble,這個問題的答案是明確的:
**有,但只剩一件 —— icon 清單的迴圈展開,而那已經由 `build-css.js` 承接。**
其餘全部(變數、巢狀、顏色運算、條件、分層、scoping)原生都做得到,或做得**更好**。

---

## §8 採用數據 —— 兩個互相矛盾的指標

### 8.1 State of CSS:三年單調下滑

問題是「你固定使用哪些前處理器/後處理器?」。官方公布的是原始人數,百分比是以「回答此題人數」換算:

| | **2024**(n=6,897) | **2025**(n=3,977) | **2026**(n=3,656) |
|---|---|---|---|
| Sass/SCSS | 4,652 — **67.4%** | 2,434 — **61.2%** | 2,032 — **55.6%** |
| PostCSS | 2,622 — 38.0% | 1,517 — 38.1% | 1,284 — 35.1% |
| Lightning CSS | — | 360 — 9.1% | 373 — **10.2%** |
| Less | 722 — 10.5% | 376 — 9.5% | 297 — **8.1%** |
| Stylus | 168 — 2.4% | 78 — 2.0% | 57 — 1.6% |
| **都不用** | 1,320 — **19.1%** | 838 — 21.1% | 912 — **24.9%** |

兩年之間 Sass **−11.8 個百分點**、「都不用」**+5.8 個百分點**,Lightning CSS 在 2026 首度超過 Less。
2026 版調查作者自己的評語:

> "Just like CSS-in-JS, pre-processor usage is declining and may soon be a thing of the past."

**讀這份數字要打的折扣:**樣本兩年內幾乎腰斬(6,897 → 3,656),而且填答者是**自我選擇**的、
偏向緊追 CSS 新功能的族群 —— 也正是最早採用原生功能的那群人。
**當成從業者情緒的領先指標,不要當成安裝基數的量測。**

### 8.2 npm 下載量:方向相反

2026-08-23 → 08-29 當週:

| 套件 | 週下載量 |
|---|---|
| `postcss` | 280,142,947 |
| `lightningcss` | 142,441,326 |
| `sass` | **32,361,372** |
| `less` | **11,769,050** |
| `node-sass`(2024-07 已 EOL) | 984,347 |

而且 `sass` 的月下載量在 18 個月內**成長約三倍**(2025-03 約 54.4M → 2026-08 約 163.5M)。

**怎麼解釋這個矛盾?**npm 下載量量的是 CI 次數、容器重建、鏡像與**轉移依賴**,不是開發者的選擇。
最好的證據就是 **`node-sass` 在 EOL 兩年後仍有每週約 98 萬次下載** —— 這個指標量的是**慣性**。

**誠實的讀法:調查佔比在跌、絕對安裝量在漲。這兩件事同時為真,而且互相一致 ——
新專案不再選它,舊專案會一直編下去。**

### 8.3 LESS 與 Sass 的專案活躍度(GitHub API,2026-09-03)

| 指標 | dart-sass | less.js |
|---|---|---|
| 近 52 週 commit | **137**(15 週為零) | **79**(**39 週為零**) |
| 2024 / 2025 / 2026-YTD commit | 231 / 143 / 91 | 9 / 24 / **81** |
| open issues | 75 | **181** |
| stars | 4,218 | 17,027 |
| 最新版本 | 1.103.1(2026-08-20) | 4.9.1 + **5.0.0-alpha.2**(皆 2026-09-02) |

**Sass 穩定但在減速;LESS 曾近乎停擺、2024-12 起復甦,但活動是爆發式的**
(近 52 週有 39 週為零,79 個 commit 中有 33 個集中在同一週)—— 是小團隊的復甦,不是生態系的回歸。

**另一個必須知道的事實:Dart Sass 的移除時鐘其實停著。**`@import` 與全域函式的移除目標是
**3.0.0**,而 GitHub 上**根本沒有 3.0.0 milestone**;2.0.0 milestone **2019-02-20 建立、至今仍開著、
12 開 12 關、沒有到期日**。所以那些棄用警告帶來的是**警告噪音**,不是「快要不能用了」的壓力。

---

## §9 未證實與已證偽的流傳說法

寫給未來的自己:這些是查證過程中撞到、但**不可引用**的東西。

| 說法 | 判定 |
|---|---|
| 「CSS mixins 將在 Chrome 146 出貨」 | ❌ **證偽**(MDN + chromestatus "Proposed" + Chrome 已到 153)。**我們 2026-07 的舊版文件寫過這句** |
| 「Bootstrap 6 將棄用 Sass」 | ❌ **證偽**(v6-dev 分支 45 個 `.scss` + 官方客製文件明文保留) |
| 「Sass 使用率從 78% 掉到 62%」 | ⚠️ 未證實 —— State of CSS 原始頁面查無此數字(見 §8.1 的實際數字) |
| 「原生巢狀採用率成長 276%」 | ⚠️ 未證實 —— 多個 SEO 站轉載,原始調查頁查無 |
| 「Lightning CSS 將成為 Vite 預設」 | ⚠️ 未證實 —— Vite 目前是 opt-in(`css.transformer`),預設仍是 PostCSS |
| 「Dart Sass 2.0.0 目標日 2026-04-01」 | ⚠️ 未證實,且顯然已滑動 |
| Fomantic-UI 是「唯一的 LESS 使用者」 | ⚠️ 本次未複查(2026-07 舊版的敘述) |
| Chrome issue 457696384「custom property 導致樣式重算極貴」 | ⚠️ **標題會誤導。**追查後(需登入,**未直接讀到**,以下為搜尋摘要)其症狀是 **DevTools 的 Styles 面板卡頓**,修法是讓該面板延遲繪製裝飾,2.5s → 數百毫秒。**不要拿它當 runtime 效能論據**,會被更正 |
| 「`oklch(from var(--x) …)` 需要先 `@property` 註冊才會正確」 | ⚠️ **查無憑據,且很可能為假。**跨 MDN / Chrome / Smashing 等來源查證:`@property` 註冊只有在**動畫**該通道時才必要,靜態使用不需要 |

**方法備註:**本次研究刻意排除了數個疑似 AI 生成的 SEO 內容站作為證據來源
(tech-insider.org、dev-school.net、deciphertech.io、byteiota、moldstud、csskey.com 等)。
上表前四項的錯誤說法主要就來自這類來源 —— 它們互相轉載,看起來像多方佐證,實際上是同一個錯誤。

---

## §10 對 ZK 的意義

### 10.1 我們現在站在哪裡(2026-09-03 實查)

| | IceBlue(`iceblue` 分支) | Marble(`new_theme` 分支) |
|---|---|---|
| `.less` 檔數 | **0**(本案 2026-08-17 收工) | 0(從未有過) |
| `zkless-engine` 依賴 | 已移除 | 從未有過 |
| 來源 | 85 個 `.css` entry + 6 partial | 純 CSS |
| `--zk-*` token 數 | **862** | **577** |
| build | `scripts/build-css.js`(Node) | 同左 |
| `@layer` | 已導入 | `zk-base < zk-components < zk-utilities` |

**IceBlue 的遷移已經完成,而且是零差異證明的** —— 85 個輸出一條宣告都沒變。
所以本文件對 IceBlue 不是決策輸入,是**事後的外部驗證**;對 Marble 則是**對外論述的素材**。

### 10.2 業界背書了我們哪幾件事

| 我們做的 | 業界對照 |
|---|---|
| `--zk-*` custom properties 當公開 theming API | ✅ **零例外**(§1.1) |
| 單一客製介面,不維持兩套 | ✅ Ant Design 花三年、兩次 breaking change 才走到 |
| runtime 可切換的密度 / 色盤,取代編譯期 profile | ✅ Vaadin 2018 的完整理由;Ant v4→v6 的推動力 |
| `@layer` 出貨到元件 CSS | ✅ Web Awesome 的元件寫在 `@layer wa-component` 內;PrimeNG 把 `cssLayer` 當成第一級主題選項 |
| 保留一個 build script 做 icon 產生 | ✅ 這正是主流保留 Sass 的**唯一**真正理由(§6.1) |
| 純 CSS 來源 | ⚠️ **少數派,但不是孤例** —— Spectrum、Web Awesome、Vaadin、Prime JS 家族同路 |

### 10.3 兩個可以直接抄的模式

**(a) Adobe Spectrum 的 `--mod-*` 覆寫層 —— 本次調查裡最有紀律的客製機制。**
每一條 token 驅動的宣告都寫成兩層:

```css
/* Spectrum 的形狀 */
color: var(--mod-button-text-color, var(--spectrum-button-text-color));
```

`--mod-*` 預設是空的,存在的唯一目的是**給客戶一個指定的覆寫槽**,
讓他們不必跟 specificity 打架、也不必覆寫我們的 token(那會連帶影響所有引用該 token 的地方)。
我們目前是讓客戶直接覆寫 `--zk-*`,語意是「改這個值」;Spectrum 的形狀語意是「只改這個用途」。
**兩者可以並存,而且解決的是不同的問題。**值得評估。

**(b) 把「文件化的瀏覽器下限」當成交付物,而不是內部共識。**
GOV.UK Frontend v6 把「需要 Dart Sass ≥ 1.79」寫成 breaking change 條目。
我們的 L-2 拍板(保留 `-webkit-`、刪其餘前綴)同樣**必須是明文可查、客戶可引用**的,
因為 P4 是全計畫唯一「安全性完全由一句政策聲明承擔」的階段。

### 10.4 對外統一口徑(規範 —— 2026-09-03 裁示,D2 選項 C)

> **這一節是規範,不是建議。**適用範圍:任何會離開團隊的文字 —— migration guide、
> release note、readme、官網、簡報、研討會投影片、對客戶的郵件。
> 內部計畫書與工作紀錄不受此規範拘束,但**不得**把左欄的說法當成論據
> (見 §3 與計畫附錄 Change Log **C29**)。

| ❌ 不要講 | ✅ 改講 | 為什麼左欄會被打臉 |
|---|---|---|
| 「業界正在棄用 CSS preprocessor」 | 「業界已經不再把編譯期變數當作對外的 theming API —— 這一點沒有反例」 | 實查 20+ 專案只有 Tailwind v4 做到;Bootstrap 6 / Angular Material / Carbon / GOV.UK / PrimeFaces 全部留著 Sass(§2.2) |
| 「LESS 已死 / 已進入維護模式」 | 「LESS 已經沒有旗艦使用者:Bootstrap 2018 換走、Ant Design 2022 移除」 | LESS 2026 年至 9/3 有 81 個 commit,並發布 `5.0.0-alpha`(§8.3) |
| 「連 Bootstrap 都要改成純 CSS 變數了」 | 「Bootstrap 6 把 CSS 變數定位成使用者的第一線客製層,Sass 退到作者端」 | `v6-dev` 有 45 個 `.scss` partial,官方文件明寫 "Bootstrap is written in Sass"(§1.2) |
| 「純 CSS 比較快 / 省效能」 | 「純 CSS 讓客戶不必重新 build,而且可以分區、可以在 runtime 切換」 | custom property 的實測成本是 **+0.06ms**,而且通常比等價的一般屬性更快(§7.1) |
| 「我們移除了建置工具」 | 「我們把兩套客製 API 收斂成一套」 | build script 還在(icon 產生、bundling、minify);真正的賣點是 A2 收斂,不是零 build |

**盤點結果(2026-09-03 實查):兩個 repo 的對外素材全部乾淨。**

| 素材 | 結果 |
|---|---|
| `readme.md` / `contributing.md`(兩個 repo) | ✅ 無風險措辭 |
| `doc/migration/*.md`(4 份,對客戶) | ✅ 完全不談業界趨勢,只談本主題自己的變更 |
| 內部 `doc/iceblue-drop-less-plan-appendix.md` | ⚠️ 曾有 2 處,**已於 2026-09-03 更正並記入 Change Log C29** |
| 簡報 / 官網 / 研討會素材 | ❓ **不在 repo 內,無法核對** —— 需要素材持有者自行對照本表 |

**回歸檢查(加新對外文字時跑一次):**

```bash
grep -rniE 'maintenance mode|less is dead|dying|industry (is|has) (moving|abandon)|業界.*棄用|已死|淘汰' \
     readme.md contributing.md doc/migration/
```

---

## §11 本次研究帶出的待決策事項

### 議題 D1(已決:選項 A):minifier 要不要從 CleanCSS 換成 Lightning CSS

> **執行結果(2026-09-03,Marble):完成,而且抓到一個正在出貨的靜默損壞。**
>
> 執行前先稽核現行 CleanCSS 的 warnings —— **3 個活的 warning**
> (`Invalid property name '.z-select' … Ignoring.` 等)。換成 Lightning CSS 後逐檔語意比對
> 221 個輸出:**4 檔有差異,新增 7 筆、消失 1 筆**,其中 **6 筆是被 CleanCSS 靜默丟掉、
> 現在救回來的規則**:
>
> ```
> .z-select:open::picker(select)            { opacity:0; transform:translateY(-4px) }
> .z-selectbox:open::picker(select)         { …同上 }
> .z-datebox-timezone>select:open::picker(select) { …同上 }
> ```
>
> 也就是說,可客製 `<select>` 的**開啟動畫在過去的打包版本裡是不存在的**,
> 而 build 一直是 exit 0。剩下 1 筆差異是 CleanCSS 把 `linear-gradient(red 0%…)` 改寫成
> `red 0`,Lightning CSS 保留作者原文 —— 語意相同,非回歸。
>
> 連帶移除了兩個因 CleanCSS 而存在的 workaround(裸 `@layer` 的 regex 抽取/回填),
> 並新增 DSP EL 的 placeholder 遮罩(Lightning CSS 的 parser 會直接拋例外,CleanCSS 只是容忍)。
> `npm run check:css-dsp` 與 `npm run check:forced-colors` 皆通過。
> **技術細節、參考實作與驗收工具全部保存在
> [`tasks/lightningcss-swap-deferred.md`](../tasks/lightningcss-swap-deferred.md)**
> (Marble 端的 `tasks/d1-lightningcss-swap.md` 在 `.gitignore` 內,不是持久紀錄)。
>
> **IceBlue 刻意不換(D3,已決:延後不排期),這是本議題執行時才查清楚的範圍修正:**
> IceBlue 的 `build-css.js` 是**另一支**實作(`level: 0` 純重新序列化 + `HOSTILE_CONSTRUCTS`
> 明確失敗),而且來源樹 `@layer` / `@scope` 用量**皆為 0**。它今天沒有暴露,
> 卻有一個 Marble 沒有的東西:**整個遷移是以「與 `zkless-engine --compress` 輸出零差異」驗證的**。
> 換 minifier 會破壞那個錨點而換不到當下的好處。**要不要換,建議等 IceBlue 真的引入
> `@layer`/`@scope` 時再決定** —— 屆時它的 `HOSTILE_CONSTRUCTS` 會讓 build 停下來,
> 不會靜默,所以這個延後是安全的。

**背景狀況。**我們已經自己實測過 CleanCSS 5.3.3 會**摧毀** `@scope` 與裸 `@layer` 語句
(其中兩種情形輸出全空),而且它只發 **warning**,`build-css.js` 目前只檢查 `errors`。
兩個主題都各自繞過了這兩個坑(`@layer` 先抽出後前置回去;`@scope` 在 minify 之後才包)。

**本次研究的新證據:Bootstrap 6 因為同一個原因換掉了 CleanCSS。**
`twbs/bootstrap@v6-dev` › `build/css-minify.mjs` 的檔頭註解:

> "CSS minification script using lightningcss / This replaces clean-css which **doesn't support
> modern CSS features like `light-dark()`, `color-mix()`, `@layer`**, etc."

這把我們原本的內部觀察從「我們踩到的坑」升級成「**已知的、別人也踩到並且已經處理掉的工具缺陷**」。

**影響與風險。**不換:繞過機制是隱性的 —— 它保護的是「今天剛好用到的語法」,
新語法進來時失敗是靜默的(warning 不檢查)。而我們正好在增加現代語法
(`@scope`、`@layer`、`color-mix()`、相對顏色、未來的 `light-dark()`)。
換:是 build 鏈的變動,輸出必然逐位元組不同,需要重跑逐條 declaration diff 當驗收。

**方案選項:**

- **【選項 A】換成 Lightning CSS(建議)**:與 Bootstrap 6 同一個選擇;同時獲得
  「可依 browserslist 目標降級」的能力,等於把 §5 結尾的降級方案內建。
  ｜ **代價**:一次 build 鏈變更 + 全樹 declaration diff 驗收;新增一個 Rust binary 依賴。
- **【選項 B】留在 CleanCSS,但補上 `output.warnings` 檢查**:最小改動,把靜默失敗變成可見失敗。
  ｜ **代價**:低(數行);但不解決「CleanCSS 不認識新語法」的根因,只是讓它出聲。
- **【選項 C】不動**:｜ **代價**:下一次引入 CleanCSS 不認識的語法時,靜默失敗,而且不會有人發現。

> 註:選項 B 是既有的 **L-9** 決議的一部分(「`build-css.js` 補檢查 `output.warnings`」),
> 尚未實作。若選 A,B 仍應先做 —— 它是換工具期間的安全網。

### 議題 D2(已決:選項 C):已證偽的論據要不要回頭修內部計畫附錄

**背景狀況。**我們 2026-07 的內部文件寫過「Bootstrap 6 目標是完全由 CSS 變數驅動」與
「LESS 已進入維護模式」,兩句都已證偽(§3)。這類說法一旦流進 migration guide、
release note 或對客戶的簡報,會被容易查證的事實打臉。

**影響與風險 —— 已實查,範圍比原本想的小。**2026-09-03 掃過對外交付物,結果是好消息:

| 位置 | 是否含已證偽的說法 |
|---|---|
| `doc/migration/*.md`(對客戶) | ✅ **沒有** —— 完全不談業界趨勢,只談這個主題自己的變更 |
| `doc/iceblue-drop-less-plan-appendix.md`(內部計畫附錄) | ❌ **有** —— 第 93、152 行寫「LESS 已進**維護模式**」 |

**⇒ 這不是對外風險,是內部文件一致性問題。**而且那兩處的上下文是在論證
「少一個維護模式的外部依賴」—— 這條論據隨著 §3 #2 的更正而**失效**,
但它從來不是決定性理由(決定性理由是變數層名存實亡與兩套 theming API),
所以**不影響已完成的遷移**。

**方案選項:**

- **【選項 A】只修內部附錄的那兩處,並保留更正紀錄(建議)**:把「維護模式」改成
  「沒有旗艦使用者」(這句仍成立),並在該檔的 Change Log 註記更正來源。
  ｜ **代價**:兩行文字 + 一條 Change Log。
- **【選項 B】不動內部附錄**:｜ **代價**:附錄與本文件互相矛盾;下一個讀計畫書的人
  會拿到已證偽的論據,而且不會知道它被推翻過。
- **【選項 C】連同對外簡報素材一起立規矩**:採用 §10.4 的措辭表作為對外統一口徑。
  ｜ **代價**:需要盤點簡報/官網素材,超出本文件已驗證的範圍。


### 議題 D3(已決:延後,不排期)/ D4(已決:延後,不排期)

* **D3 —— IceBlue 的 minifier 換裝。**理由見上。**觸發條件、可行性探測結果(92 檔中 84 檔
  可直接解析、8 個失敗分成 4 類且全部可修)、逐檔逐行的修法、IceBlue 特有的三個地雷**,
  全部記在 [`tasks/lightningcss-swap-deferred.md`](../tasks/lightningcss-swap-deferred.md) §3。
* **D4 —— Marble 的 `npm run minify` + `clean-css-cli` 清理。**既有死碼(輸入檔不存在、
  無人呼叫),不是換裝造成的,依規矩只回報未刪。同一份文件 §4。

> **附帶發現:換裝順手抓到一條正在出貨的無效 CSS。**Lightning CSS 在探測 IceBlue 來源時
> 攔下 `js/zkmax/inp/css/searchbox.css:36` 的 `.z-searchbox[disabled]-icon` ——
> 屬性選擇器後直接接 `-icon` 不是合法選擇器,**永遠匹配不到元素**,而 CleanCSS 一路放行。
> 它與下一條規則宣告完全相同,所以無視覺影響,但它示範了一件事:
> **`lightningcss.transform()` 本身就可以當「來源是否為合法 CSS」的 CI 守門**,
> 不需要另外引進 linter。這正是 industry-direction §6.5 記的 `&-suffix` 遷移陷阱的實例。

---

## 附錄 A:本地既有文件索引

本文件**合併並取代**了同檔名的 2026-07 版。以下三份仍然有效,各有不同用途,**不要跟本文件混用**:

| 文件 | 位置 | 它回答什麼 | 與本文件的關係 |
|---|---|---|---|
| [`iceblue-drop-less-execution-plan.md`](iceblue-drop-less-execution-plan.md) | 本 worktree | **決策依據**與階段定義、G-zero/G-delta 判準 | 本文件是它的外部佐證,不是它的輸入 |
| [`iceblue-drop-less-progress.md`](iceblue-drop-less-progress.md) | 本 worktree | 進度狀態(2026-08-17 收工) | 本文件是收工後的事後驗證 |
| [`migration/less-to-css.md`](migration/less-to-css.md) | 本 worktree | **對客戶的**遷移指南 | 見 §11 D2 —— 需檢查措辭 |
| `tasks/drop-less-pure-css-evaluation.md` | Marble worktree | 584 行的**可行性實測**(838/844 直通變數等) | 本文件引用它的數字,不重複它的分析 |
| `doc/conditional-css-without-preprocessor.md` | Marble worktree | **技術目錄**:沒有 preprocessor 時,條件式 CSS 的五種做法 | 互補 —— 那份講「怎麼做」,本份講「別人做了沒」 |
| `tasks/phase0-zkless-engine-spike.md` | Marble worktree | LESS 3 靜默改壞現代 CSS 的實測矩陣 | 本文件 §7.1 引用它 |
| `tasks/l2-browser-support-analysis.md` | Marble worktree | L-2 vendor prefix 政策的利弊分析與拍板 | 本文件 §10.3(b) 引用它 |

---

## 附錄 B:術語表

只列「非用不可、且不是一般常識」的詞。

- **Baseline**:web.dev / MDN 用來描述「一項瀏覽器功能能不能安心使用」的分級。
  *newly available* = 所有主流瀏覽器都出貨了;*widely available* = 最後一家出貨後又滿 30 個月。
  這裡非用不可,是因為「支援度」這種模糊講法無法拿來做相容性承諾。
- **preprocessor(前處理器)**:LESS / Sass 這類「自己的語言 → 編譯成 CSS」的工具。
- **postprocessor(後處理器)**:PostCSS / Lightning CSS 這類「輸入本身就是合法 CSS,
  只做轉換與壓縮」的工具。這個區分在本文件很關鍵 —— 「棄用 preprocessor」不等於「不用 build 工具」。
- **CSS custom property(自訂屬性)**:`--x: 1px` 與 `var(--x)`。俗稱「CSS 變數」。
  與 preprocessor 變數的根本差別是**它在瀏覽器裡活著**:可繼承、可在 runtime 改、
  DevTools 看得到、客戶可以覆寫。
- **KTLO**(Keep The Lights On):GitHub Primer 官方用來標示 `primer/css` 的狀態 ——
  「只維持運作、不再發展」。這裡用原詞是因為它是該專案的原文標示。
- **G-zero / G-delta**:本專案自訂的驗收閘門,定義在執行計畫書,本文件不重述。

---

## 附錄 C:承重的引用來源

只列本文件實際引用、且結論靠它成立的來源。完整清單(含被排除的來源)見本次研究的原始記錄。

**專案 primary source**
- Tailwind — [Compatibility](https://tailwindcss.com/docs/compatibility) · [v4.0 發布文](https://tailwindcss.com/blog/tailwindcss-v4)(2025-01-22) · [升級指南](https://tailwindcss.com/docs/upgrade-guide)
- Bootstrap — `twbs/bootstrap@v6-dev` › `site/src/content/docs/customize/sass.mdx`、`customize/overview.mdx`、`build/css-minify.mjs`、`package.json` · [Roadmap 2025-04](https://github.com/orgs/twbs/discussions/41370) · [Bootstrap 6 feedback](https://github.com/orgs/twbs/discussions/42090)
- Ant Design — `docs/react/migration-v5.en-US.md` · [6.0 公告](https://github.com/ant-design/ant-design/issues/55804)(2025-11-22)
- MUI — [2026 and beyond](https://mui.com/blog/2026-and-beyond/)(2026-01-01,Pigment CSS 暫停) · [MUI v9 公告](https://mui.com/blog/introducing-mui-v9/)(2026-04-08)
- Vaadin — [8→14 遷移指南 · theming](https://github.com/vaadin/flow-and-components-documentation/blob/master/documentation/migration/6-theming.asciidoc)
- Prime — [primeng.dev/theming](https://primeng.dev/theming) · `primefaces/primefaces` › `primefaces-themes/README.md` · [primeui.dev/nextchapter](https://primeui.dev/nextchapter)(授權變更)
- Angular Material — [guides/theming.md](https://github.com/angular/components/blob/main/guides/theming.md)
- Carbon — `packages/styles/README.md`、`packages/themes/docs/sass.md`、`packages/styles/scss/_feature-flags.scss`
- Primer — [React v38 公告](https://github.com/primer/react/discussions/7086)(2025-10-27)
- Web Awesome — [customizing 文件](https://webawesome.com/docs/customizing/) · `packages/webawesome/src/components/button/button.styles.ts`
- Chakra — [v3 公告](https://chakra-ui.com/blog/announcing-v3)(2024-10-22) · Mantine — [v7 changelog](https://mantine.dev/changelog/7-0-0/)(2023-09-18)
- GOV.UK Frontend — [v6.0.0 release](https://github.com/alphagov/govuk-frontend/releases/tag/v6.0.0)(2026-02-09)

**Sass / LESS 專案本身**
- [`@import` is Deprecated](https://sass-lang.com/blog/import-is-deprecated/)(2024-10-17) · [Breaking Changes 總表](https://sass-lang.com/documentation/breaking-changes/) · [Color Functions 棄用](https://sass-lang.com/documentation/breaking-changes/color-functions/) · [保留 `--` 命名空間給原生 mixin/function](https://sass-lang.com/documentation/breaking-changes/css-function-mixin/) · [因 CSS 出了 `if()` 而棄用 Sass 的 `if()`](https://sass-lang.com/documentation/breaking-changes/if-function/)
- [Sass and Native Nesting](https://sass-lang.com/blog/sass-and-native-nesting/)(2023-03-29,`&-suffix` 與 `:is()` specificity)
- [LibSass EOL](https://sass-lang.com/blog/libsass-is-end-of-life/)(2025-10-23) · [Node Sass EOL](https://sass-lang.com/blog/node-sass-is-end-of-life/)(2024-07-24)
- GitHub API:`sass/dart-sass` 與 `less/less.js` 的 commit / release / milestone(2026-09-03 實查)

**原生 CSS 能力與規格**
- `api.webstatus.dev`(Baseline 資料) · [MDN `@function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function) · [MDN Custom functions and mixins](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Custom_functions_and_mixins) · chromestatus feature 5108022310469632
- [Miriam Suzanne — CSS Functions & Mixins: Is Sass Dead Yet?(CSS Day 2025)](https://slides.oddbird.net/mixins/cssday/) · [Mixins & Functions Explainer](https://css.oddbird.net/sasslike/mixins-functions/)
- [Jane Ori — CSS `@function` 的 DX 實測](https://blog.master.dev/the-fundamentals-and-dev-experience-of-css-function/)(2026-05-29)
- [Matuzović — 用 custom property 做 media query 的 workaround](https://piccalil.li/blog/a-workaround-for-using-custom-properties-in-media-queries/)(2025-09-25) · [csswg-drafts#8088](https://github.com/w3c/csswg-drafts/issues/8088)
- [Bramus — `@property` 效能實測](https://web.dev/blog/at-property-performance)(2024-10-02) · [GitLab Pajamas benchmark #2344](https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/issues/2344)
- [Lightning CSS — Transpilation](https://lightningcss.dev/transpilation.html)

**數據**
- State of CSS [2024](https://2024.stateofcss.com/en-US/other-tools/) / [2025](https://2025.stateofcss.com/en-US/other-tools/) / [2026](https://2026.stateofcss.com/en-US/other-tools/) · [Web Almanac 2022 CSS 章](https://almanac.httparchive.org/en/2022/css) · `api.npmjs.org` 下載量
