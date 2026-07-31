# 各大 UI framework 對 CSS preprocessor 的方向(2026-07 現況)

> 起因:評估 IceBlue 是否該繼續依賴 LESS。這份文件回答「主流是不是在棄用 preprocessor」。
>
> **定位:這是外部佐證,不是決策依據。** 主計畫是
> [`iceblue-drop-less-execution-plan.md`](iceblue-drop-less-execution-plan.md),
> 決定放棄 LESS 的兩條決定性理由(A1 名存實亡、A2 兩套衝突的 theming API)都是**內部實測**,
> 不依賴本文件。本文件只用來確認我們選的終點(runtime CSS custom properties)
> 是收斂中的方向而非孤例 —— 見主計畫〈背景〉章節的 A5 與〈淨判斷〉。

## 一句話結論

**不是「棄用 preprocessor」,是「棄用 preprocessor 作為 theming 機制」。**

這兩件事必須分開看,因為它們的成熟度差非常多:

| 用途 | 業界方向 | 成熟度 |
|---|---|---|
| **變數 / 主題 / 調色盤** | 已經決定性地移到 CSS custom properties | ✅ 定案,幾乎沒有反例 |
| **巢狀、顏色運算、數學** | 原生 CSS 已經取代 | ✅ 全瀏覽器支援 |
| **`@layer` / `@scope` / container query** | 只有原生 CSS 有,preprocessor 根本沒有對應物 | ✅ preprocessor 反而是落後方 |
| **迴圈產生大量 class(utility、icon set)** | **仍然沒有原生解法** | ❌ 這是 preprocessor 唯一還活著的理由 |
| **mixin / function** | 原生規格已定案,但**尚未出貨** | ⏳ 預計 Chrome 146 |

所以主流做法是**把 preprocessor 縮小成一個「build 期的檔案組裝 + 迴圈產生器」**,
而不是整個拿掉。真正整個拿掉的,只有那些一開始就 CSS-first 設計的專案。

---

## A. 各大 framework 現況

| Framework | Preprocessor 現況 | Theming 機制 |
|---|---|---|
| **Ant Design** | **v5(2022)完全移除 LESS**;v6 進一步把 LESS 從一等公民除名 | v5 → CSS-in-JS(`@ant-design/cssinjs`);v5.12 起加上 `cssVar` 模式;v6 預設開啟 CSS 變數 + 擁抱 Tailwind v4 / CSS Modules |
| **Bootstrap** | 仍然是 Sass(5.3);**Bootstrap 6 目標是「完全由 CSS 變數驅動」**,同時把 `@import` 換成 `@use`/`@forward`。時程未定,維護者說「不會很快」 | Sass 編譯 + 逐步外露 `--bs-*` 變數。v5 的已知痛點正是「CSS 變數只做一半,深度客製仍需 Sass build」 |
| **Tailwind CSS** | **v4(2025-01)把設定檔從 JS 搬進 CSS**(`@theme`),引擎改寫,不再靠一堆 PostCSS plugin | 全部 token 就是 CSS custom properties;原生 `@layer`、`color-mix()`、`@property` |
| **MUI** | Emotion CSS-in-JS,但主推 `CssVarsProvider` / `extendTheme`,並發展 Pigment CSS(build 期抽取、零 runtime) | CSS 變數(為了 SSR 與 dark mode 不閃爍) |
| **Bulma** | v1.0(2024)仍用 Sass,但主題全面改走 CSS 變數 | CSS 變數 |
| **Open Props / Shoelace 等** | 沒有 preprocessor | 純 CSS custom properties |
| **Fomantic-UI** | **仍是 LESS** — 目前主流專案裡幾乎唯一的 LESS 使用者 | 編譯期 LESS 變數 |
| **Carbon (IBM)** | 仍重度使用 Sass modules | Sass + 同時外露 CSS 變數 |

**方向很一致:沒有任何一個主流 framework 還把「編譯期變數」當作對外的 theming API。**
差別只在走到哪一步 —— Tailwind/Ant 走完了,Bootstrap 走到一半。

## B. LESS 的處境比 Sass 差很多

這一點對 IceBlue 特別重要,因為我們用的不是 Sass。

- **LESS 已進入維護模式。** 4.2 在 2025-11 發布,但沒有實質新功能;社群共識是
  「2026 年不會有人用 LESS 開新專案」。
- **Sass 還在演進** —— Dart Sass 持續更新,`@use`/`@forward` module system 是真的好用,
  而且 Sass 明確表態:CSS 原生能做的,Sass 不再重複實作(例如已 deprecate 自家
  `darken()`/`lighten()`,引導改用 `color.adjust` 或原生 `color-mix()`)。
- **LESS 最大的生態系已經走了。** Bootstrap 早在 v4(2018)就從 LESS 換成 Sass;
  Ant Design v5(2022)直接移除 LESS。這兩件事之後,LESS 就沒有旗艦使用者了。

換句話說:**「留在 LESS」和「留在 preprocessor」不是同一個決定。**
即使我們認為 preprocessor 還有存在價值(見下一節),那個價值也不指向 LESS。

## C. 原生 CSS 補上了什麼、還缺什麼

| Preprocessor 功能 | 原生 CSS 現況 |
|---|---|
| 變數 | custom properties — **比 preprocessor 好**(runtime、可繼承、DevTools 可看、可被客戶覆寫) |
| 巢狀 | 原生,全瀏覽器約 2023 年底完成(含 relaxed syntax) |
| 顏色運算 | `color-mix()`(2023)、relative color `oklch(from …)`(2024) |
| 數學 | `calc()` / `min()` / `max()` / `clamp()` / `round()` / `mod()` |
| **mixin / function** | ⏳ **規格已定案但尚未出貨**;MDN 標示「目前無瀏覽器支援」,`@mixin --name{}` + `@apply --name` 預計 **Chrome 146** |
| **`@each` / `@for` 迴圈** | ❌ **完全沒有原生對應物,也沒有在規格路線圖上** |
| module system(`@use`/`@forward`) | ❌ 原生 `@import` 有效能問題,實務上靠 bundler |
| `@layer` / `@scope` / `@container` | ✅ 只有原生有 —— preprocessor 這邊是**負分** |

**唯一真正的缺口是迴圈。** 這正好命中 IceBlue:Font Awesome 的 `each()` 迴圈
(P5/P6 的範圍)是全專案裡最難用純 CSS 表達的部分。反過來說,
`@layer` / `@scope` / container query 這些我們想用的東西,preprocessor 一點忙都幫不上。

## D. Ant Design 的弧線 —— 對 ZK 最貼切的前車之鑑

Ant Design 的起點跟 IceBlue 幾乎一模一樣,值得完整看一遍:

```
v4:  LESS + 編譯期 modifyVars 換調色盤    ← IceBlue 現在的位置
      ↓ 動機:客戶要 runtime 換主題,編譯期變數做不到
v5:  砍掉 LESS,改 CSS-in-JS               ← 走了一段冤枉路
      ↓ 動機:CSS-in-JS 的 runtime 成本與序列化開銷太大
v5.12: 加上 cssVar 模式(design token = CSS 變數)
v6:  cssVar 預設開啟,LESS 正式除名
```

**兩個可以直接拿來用的教訓:**

1. **推動力跟我們一樣** —— 不是「LESS 語法不好」,而是**編譯期變數無法支援 runtime 換主題**。
   我們的 Theme Pack(23 套 `palettes/*.less`)是完全相同的問題。
2. **CSS-in-JS 那一段是繞路,終點是 CSS 變數。** 我們可以直接跳到終點。
   而這正是先前已經拍板的方向(「Theme Pack 用 CSS variables + 新 CSS 3 語法達成」),
   等於已經站在 Ant Design 花了三年才走到的位置上。

## E. 對 IceBlue 的意義

| 問題 | 答案 |
|---|---|
| 主流在棄用 preprocessor 嗎? | **部分是。** 棄用它當 theming 機制 = 是,已定案。整個拿掉 = 只有 CSS-first 專案做到 |
| 那我們該不該拿掉 LESS? | **「離開 LESS」的理由比「離開 preprocessor」強很多。** LESS 已無旗艦使用者、無新功能 |
| 現在拿掉會不會太早? | 唯一還需要 preprocessor 的是**迴圈**(Font Awesome `each()`)。
  mixin/function 要等 Chrome 146,但我們的 30 個 mixin call 幾乎都可以用 custom property 改寫 |
| 我們已經做對的事 | Marble 已經是純 CSS + custom properties;IceBlue master 已經外露 842 個 `--zk-*`
  作為公開 API(ZK 10.3 起)。**token API 這一層我們已經在終點了**,剩下的是 build pipeline |

**具體建議(不改變既有計畫,只是補上市場依據):**

- Theme Pack → CSS 變數的方向 **有明確的業界背書**(Ant v5.12/v6、Bootstrap 6 目標、Tailwind v4)。
  不是我們自己發明的路。
- 現在就可以在 `.less` 裡寫 `@layer` —— 已實測通過(見
  [iceblue-remove-zkless-engine.md](iceblue-remove-zkless-engine.md) §B2)。
  preprocessor 不擋這件事。
- 迴圈(`each()`)是 P5/P6 唯一真正需要「產生器」的地方。
  如果最後保留一個 build script,它存在的理由應該是**這個**,不是變數或巢狀。
- **不要考慮 LESS → Sass。** 那只是換一個同樣要淘汰的東西,而且要重寫全部語法。

---

## 參考來源

- [CSS custom functions and mixins — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Custom_functions_and_mixins)
- [Thoughts on Native CSS Mixins — Frontend Masters](https://frontendmasters.com/blog/thoughts-on-native-css-mixins/)
- [CSS Mixins & Functions Explainer — OddBird](https://css.oddbird.net/sasslike/mixins-functions/)
- [CSS in v6 — Ant Design](https://ant.design/docs/blog/css-tricks/)
- [Ant Design 6.0 is Here](https://github.com/ant-design/ant-design/issues/55804)
- [CSS Variables — Ant Design 5.x](https://5x.ant.design/docs/react/css-variables/)
- [Sass — Bootstrap v5.3](https://getbootstrap.com/docs/5.3/customize/sass/)
- [Bootstrap 6: Everything You Need to Know — CoreUI](https://coreui.io/blog/bootstrap-6/)
- [CSS Preprocessors in 2026: Sass vs Less vs Stylus](https://gabriel-rodrigues.com/en/blog/css-preprocessors-sass-less-stylus-then-vs-now/)
- [Less (style sheet language) — Wikipedia](https://en.wikipedia.org/wiki/Less_(style_sheet_language))
