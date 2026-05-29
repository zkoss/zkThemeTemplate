# Typography Utility Class 命名：角色 vs 尺寸

## 1. 你的觀察是對的

目前 `_typography.css` 的 font-size utilities：

```
.z-fs-display-lg / -md / -sm
.z-fs-headline-lg / -md / -sm
.z-fs-title-lg / -md / -sm
.z-fs-body-lg / -md / -sm
.z-fs-label-lg / -md / -sm
```

15 個 class、命名偏長、而且帶有「**用途語意**」（display=超大標、headline=標題、title=次標題、body=內文、label=按鈕/小註）。如果單純從「我要這段文字用哪種大小」的角度看，這的確比 `text-sm / text-md / text-lg` 囉嗦很多。

## 2. 為什麼會長這樣 — 它是 MD3 Typescale Token 的 1:1 映射

`_typography.css` 不是憑空命名的，它直接對應 `tokens/_typography.css` 裡的 `--zk-typescale-{role}-{size}-*` token，而那組 token 又直接對應 Material Design 3 規範裡的 **Type Scale**。

MD3 typescale 有兩個軸：

| 軸 | 值 | 意義 |
|---|---|---|
| Role（角色） | display / headline / title / body / label | 文字在介面中的「功能」 |
| Size（尺寸） | large / medium / small | 同一角色內的層級 |

→ 5 × 3 = 15 種組合。**它故意不是純粹的尺寸階梯**，因為同一個「size」字眼在不同 role 底下，size、weight、line-height、letter-spacing 全部不同：

- `title-medium` = 16px / weight 500 / lh 24px
- `body-large`   = 16px / weight 400 / lh 24px

兩者 font-size 一樣，但 weight 不同 → 設計上是不同的東西。**所以 MD3 認為「光用 size 命名」是不夠的**，必須帶 role 才能完整描述一段文字的排版意圖。

目前 utility 1:1 鏡射 token，是「Token-Driven Utilities」典型寫法，好處是只要 token 改，utility 自動跟著改、不會出現第二套尺寸定義。

## 3. 各家框架的做法對比

| 框架 | 命名風格 | 範例 | 是否帶角色 |
|---|---|---|---|
| **Tailwind** | 純尺寸 + T-shirt scale | `text-xs / sm / base / lg / xl / 2xl … 9xl` | 否 |
| **Bootstrap 5** | 雙軌：heading + utility | `.h1`–`.h6`、`.fs-1`–`.fs-6`、`.small`、`.lead` | 半 |
| **Chakra UI** | 純尺寸 | `fontSize="xs|sm|md|lg|xl|2xl…"` | 否 |
| **MUI (Material UI)** | 角色 component prop | `<Typography variant="h1\|body1\|caption\|overline…">` | 是 |
| **MD3 Web Components** | 角色 class | `.md-typescale-headline-large` 等 | 是 |
| **Carbon (IBM)** | 雙軌：產品式 + 表達式 | `body-01`, `heading-04`, `display-01` | 是 |
| **Polaris (Shopify)** | 半角色 | `text-heading-lg`, `text-body-md` | 是 |
| **Fluent UI (Microsoft)** | 角色 ramp | `caption1`, `body1`, `subtitle2`, `title3`, `largeTitle` | 是 |

可以看到大致兩派：

- **A 派（純尺寸）**：Tailwind、Chakra — 「我不管你拿來幹嘛，給我一個大小就好」。容易記、組合自由、無語意門檻。
- **B 派（角色尺度）**：MD3、MUI、Carbon、Fluent、Polaris — 跟設計系統的 design token 對齊，名字本身就傳達「這是 heading 還是 body」。

Bootstrap 是混血：保留 `.h1`–`.h6` 給語意、加 `.fs-1`–`.fs-6` 給純尺寸需求。

## 4. 兩派各自的考量

### A 派（純尺寸）優點
- 命名短：`text-sm` vs `z-fs-body-small`
- 學習成本低：「小、中、大」誰都看得懂
- 組合自由：尺寸跟 weight、line-height 可以任意搭，不被綁死
- 對 utility-first（HTML 直接寫一堆 class）特別友善

### A 派缺點
- 設計師說「這段是 headline」、工程師看不出來該對應哪一級
- 同一個 size 可能在不同地方視覺一致、但語意混亂（例如 16px 在 MD3 是 title-md 也是 body-lg，純尺寸就分不出來）
- 排版層級容易漂移 — 沒有強制每個 heading 用同一組屬性

### B 派（角色尺度）優點
- **設計-開發共用詞彙**：設計稿說 "title large"，CSS 就有 `z-fs-title-lg`
- 一個 role 一次帶齊 size + weight + line-height + tracking（如果是「字級組合」而不是只有 size）
- 強制排版層級一致：所有 headline 永遠長一樣
- 設計系統 token 升級時，所有用 role class 的地方自動跟進

### B 派缺點
- 命名長、要記 5 × 3 = 15 個組合
- 只想「我要小一點」這種純尺寸需求得繞路
- 角色語意不熟的人會卡住（display 跟 headline 有什麼差？）

## 5. 那目前這套的問題在哪？

仔細看現在的 `_typography.css`：

```css
.z-fs-headline-lg { font-size: var(--zk-typescale-headline-large-size); }
```

它**只設了 `font-size`**，沒有同時帶 weight 跟 line-height。這就是「半套」的角色制：

- 角色命名（B 派）的成本付了 — 名字長、要記 15 個
- 角色命名的好處（一次套齊整組 type style）沒享到 — 想拿到完整 title-medium，還是要再加 `z-fw-medium z-lh-base`

所以你的直覺對：**現況既不夠精煉、也沒拿到 role-based 的真正紅利**。

## 6. 三種改法可以選

### 選項 A：保留 role-based，但讓它「真的成套」
把每個 `.z-fs-{role}-{size}` 變成完整的 type style，一次帶 size + weight + line-height：

```css
.z-text-title-md {
    font-size: var(--zk-typescale-title-medium-size);
    font-weight: var(--zk-typescale-title-medium-weight);
    line-height: var(--zk-typescale-title-medium-line-height);
}
```

順便把命名從 `z-fs-*`（font-size 含義）改成 `z-text-*` 或 `z-type-*`（type style 含義），因為它已經不只是 size 了。

**適合**：團隊已經買單 MD3 規範、設計稿都用 MD3 角色標註。
**代價**：class 名字還是長。

### 選項 B：純尺寸抽象 + 角色 alias
主軸用 Tailwind 風格的純尺寸 class，覆蓋專案實際需要的範圍：

```css
.z-text-xs   { font-size: 11px; }   /* = label-small */
.z-text-sm   { font-size: 12px; }   /* = body-small / label-medium */
.z-text-md   { font-size: 13px; }   /* = body-medium (default) */
.z-text-base { font-size: 14px; }   /* = title-small / label-large */
.z-text-lg   { font-size: 16px; }   /* = title-medium / body-large */
.z-text-xl   { font-size: 22px; }   /* = title-large */
.z-text-2xl  { font-size: 24px; }   /* = headline-small */
.z-text-3xl  { font-size: 28px; }   /* = headline-medium */
.z-text-4xl  { font-size: 32px; }   /* = headline-large */
.z-text-5xl  { font-size: 36px; }   /* = display-small */
…
```

如果還想保留 MD3 詞彙，再加少數 alias：

```css
.z-text-body    { font-size: var(--zk-typescale-body-medium-size); }
.z-text-title   { font-size: var(--zk-typescale-title-medium-size); }
.z-text-headline{ font-size: var(--zk-typescale-headline-medium-size); }
```

**適合**：你想要 utility 寫起來短、且 ZUL 頁很多直接拿 class 套。
**代價**：跟 MD3 token 不再 1:1，但 token 本身還在，元件 CSS 還是用 token 就好。

### 選項 C：雙軌（Bootstrap 風）
同時提供：
- `z-text-{xs|sm|md|lg|xl|2xl|3xl|4xl|5xl}` — 日常用
- `z-type-{display|headline|title|body|label}-{lg|md|sm}` — 完整 type style，給需要強制成套的地方

**適合**：團隊大、寫 ZUL 的人技能差異大，給「快上手」與「設計系統嚴格派」各一條路。
**代價**：兩套要維護、新人選哪個會有遲疑。

## 7. 我的傾向

依目前專案實況（utility-first 的 z-* 體系、ZUL 頁直接 sclass 組合），**選項 B 是 CP 值最高的**：

- 寫起來短，符合 utility-first 的精神
- token (`--zk-typescale-*-size`) 仍然存在，元件層（如 `.z-button`, `.z-label`）繼續用 token，不會失去 MD3 對齊
- 對 ZUL 頁作者來說，「我這段文字要多大」變成 1 個 class、不是 1 個 class + 1 個 weight + 1 個 line-height
- 真的需要成套 type style 的場景並不多 — 通常是元件 CSS 在處理，元件 CSS 不會走 utility，直接用 token

如果同時想留 MD3 詞彙給設計師對話，可以小量保留少數別名（`z-text-headline / title / body / label`），但不需要把 5×3 矩陣都展開。

