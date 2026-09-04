# Minifier 換 Lightning CSS —— 已完成的部分與延後的部分

> **狀態(2026-09-04)**
>
> | 項目 | 範圍 | 狀態 |
> |---|---|---|
> | **D1** | Marble(`zkThemeTemplate`,`new_theme`) | ✅ **已完成**,2026-09-03 |
> | **D3** | IceBlue(`zkThemeTemplate-iceblue`,`iceblue`) | ⏸ **延後,不排期** |
> | **D4** | Marble 的 CleanCSS 殘留清理 | ⏸ **延後,不排期** |
>
> **這份文件的用途:讓未來執行 D3 / D4 的人不必重做任何調查。**
> 所有數字都是實測(2026-09-03 / 09-04),不是推估;重現指令見 [§6](#6-重現指令)。
>
> 決策背景:[`doc/css-preprocessor-industry-direction.md` §11](../doc/css-preprocessor-industry-direction.md#11-本次研究帶出的待決策事項)。

---

## 目錄

- [§0 一頁摘要](#0-一頁摘要)
- [§1 為什麼要換](#1-為什麼要換)
- [§2 Marble 已完成的改動(IceBlue 的參考實作)](#2-marble-已完成的改動iceblue-的參考實作)
- [§3【延後】D3:IceBlue 的換裝評估](#3延後d3iceblue-的換裝評估)
- [§4【延後】D4:Marble 的 CleanCSS 殘留清理](#4延後d4marble-的-cleancss-殘留清理)
- [§5 驗收工具:語意 diff(完整腳本)](#5-驗收工具語意-diff完整腳本)
- [§6 重現指令](#6-重現指令)

---

## §0 一頁摘要

**問題**:CleanCSS 5.3.3 看不懂現代 CSS,而且**失敗是靜默的** —— 它把損壞寫進
`output.warnings`,從不寫進 `output.errors`。只檢查 `errors` 的 builder 會在 exit 0 的情況下
出貨壞掉的 CSS。

**Marble 已證實被咬到**:換裝時發現 CleanCSS 一直丟掉 3 個檔案裡的 6 條規則,
可客製 `<select>` 的開啟動畫**在過去的打包版本裡根本不存在**。

**IceBlue 沒有被咬到,但原因不是它比較安全,是它剛好沒踩到**:

| | Marble | IceBlue |
|---|---|---|
| CleanCSS 設定 | `level: 1` | `level: 0`(純重新序列化) |
| 來源用 `@layer` | **106 檔** | **0** |
| 來源用 `@scope` | **1 檔** | **0** |
| 壞掉時的行為 | regex workaround;只看 `errors`,出錯時寫回未壓縮 CSS | `HOSTILE_CONSTRUCTS` **明確中止 build** |
| 驗收錨點 | 視覺 A/B + 截圖 | **與 `zkless-engine --compress` 輸出逐位元組零差異** |

**⇒ 現在不換 IceBlue 的理由,不是「風險低」,是「換了會破壞它唯一的驗收錨點,而換不到當下的好處」。**
它的守門是**明確失敗**而不是靜默,所以延後是安全的 —— 這一點是延後決策成立的關鍵。

---

## §1 為什麼要換

### 1.1 CleanCSS 的失敗模式(2026-09-03 實測)

| 構造 | CleanCSS 5.3.3 (level 1) | Lightning CSS |
|---|---|---|
| `url(${c:encodeURL("…")})` | ✅ byte-exact | ❌ **THROW: Unexpected end of input** |
| 裸 `@layer a,b;` + 後續 rule | ❌ **輸出全空**(warning 1,error 0) | ✅ 正確 |
| `@layer x{…}` block | ✅ | ✅ |
| `@scope (.z-page){…}` | ❌ **吃掉第一條巢狀規則**(warning 3,error 0) | ✅ 正確 |
| `::picker(select)` / `appearance:base-select` | ❌ **整條規則丟棄**(warning,error 0) | ✅ 正確 |
| `oklch(from … min(l,.54) c h)` | ✅ | ✅(`0.54`→`.54`) |
| `minmax(min(var(…),100%),1fr)` | ✅ | ✅ |
| `color-mix(in oklch,red 40%,blue)` | ✅ 原樣 | ⚠️ **常數摺疊**成 `oklch(…)` |
| container style query | ✅ | ✅ |

**兩個必須知道的非對稱:**

1. **Lightning CSS 對 DSP EL 是硬錯誤,CleanCSS 是容忍。**這是換裝時唯一一定要寫新程式碼的地方
   (placeholder 遮罩)。硬錯誤比容忍好 —— 它不會靜默。
2. **`color-mix()` 常數摺疊**只在引數全為靜態顏色時發生。Marble 全部 94 處 `color-mix()`
   的引數都含 `var()`,**無法摺疊**,所以實際影響為零。IceBlue 執行前要重數一次。

### 1.2 業界佐證

Bootstrap 6 因為**完全相同的理由**換掉了 clean-css。`twbs/bootstrap@v6-dev` ›
`build/css-minify.mjs` 檔頭:

> "CSS minification script using lightningcss / This replaces clean-css which **doesn't support
> modern CSS features like `light-dark()`, `color-mix()`, `@layer`**, etc."

---

## §2 Marble 已完成的改動(IceBlue 的參考實作)

### 2.1 改了什麼

| 檔案 | 改動 |
|---|---|
| `scripts/build-css.js` | `require('clean-css')` → `require('lightningcss')`;重寫 `minifyCss()`;**刪除**裸 `@layer` 的 regex 抽取/回填 workaround;更新 3 處因此過期的註解 |
| `package.json` | 移除 `clean-css`;新增 `lightningcss ^1.30.2`。**`clean-css-cli` 刻意保留**(見 §4) |
| `tasks/d1-lightningcss-swap.md` | 執行計畫(⚠️ Marble 的 `tasks/` 在 `.gitignore` 內,**該檔未納版控**;本文件是它的持久版本) |

### 2.2 `minifyCss()` 的最終形狀

```js
const { transform: lightningTransform } = require('lightningcss');

// DSP EL (`${c:encodeURL("~./marble/font/x.woff2")}`) 不是合法 CSS。CleanCSS 只是容忍它;
// Lightning CSS 的 parser 會整檔拒絕("Unexpected end of input")。解析前把每個運算式
// 換成無害識別字,解析後還原。Marble 今天只有 2 處,都在 tokens/_fonts.css 的 url() 內。
const DSP_EL_RE = /\$\{[^}]*\}/g;
const DSP_EL_MASK_RE = /ZKDSPEL(\d+)ZZ/g;

function minifyCss(css) {
    if (isDev || !css) return css;
    const els = [];
    const masked = css.replace(DSP_EL_RE, (m) => `ZKDSPEL${els.push(m) - 1}ZZ`);
    let code;
    try {
        const res = lightningTransform({
            filename: 'theme.css',
            code: Buffer.from(masked),
            minify: true,
        });
        // 一定要把 warning 印出來。CleanCSS 的靜默 warning 正是這次換裝要終結的東西。
        for (const w of res.warnings || []) {
            console.warn(`  ⚠ minify warning: ${w.message || w}`);
        }
        code = res.code.toString();
    } catch (e) {
        console.warn(`  ⚠ minify failed, writing raw CSS: ${e.message}`);
        return css;
    }
    return code.replace(DSP_EL_MASK_RE, (_, i) => els[Number(i)]);
}
```

### 2.3 為什麼**不**設 `targets`

Lightning CSS 一旦給了 `targets`,就會依 browserslist 開始降級輸出(加前綴、改寫語法)。
Marble 明文 modern-browsers-only,不需要;而且那會讓輸出大量改變,
**是另一個決策**(對應 IceBlue 的 L-2 瀏覽器支援聲明),不該混在 minifier 換裝裡。

**IceBlue 執行時同樣不要設。**它的 L-2 已拍板「保留 `-webkit-` 285 條,只刪
`-moz-`/`-ms-`/`-o-`/`-khtml-`」,那是來源端的決策,不能讓 minifier 再插一手。

### 2.4 Marble 的驗收結果

* 基準:221 檔 / 2,418,439 bytes(CleanCSS 版)
* 語意 diff:**4 檔有差異,新增 7 筆、消失 1 筆**
* **新增的 6 筆是 CleanCSS 靜默丟掉、現在救回來的**:

  ```
  .z-select:open::picker(select)                  { opacity:0; transform:translateY(-4px) }
  .z-selectbox:open::picker(select)               { …同上 }
  .z-datebox-timezone>select:open::picker(select) { …同上 }
  ```

* 消失的 1 筆:CleanCSS 把 `linear-gradient(red 0%…)` 改寫成 `red 0`,
  Lightning CSS 保留作者原文 —— **語意相同,非回歸**
* `npm run check:css-dsp` ✓ / `npm run check:forced-colors` ✓

---

## §3【延後】D3:IceBlue 的換裝評估

### 3.1 觸發條件 —— 什麼時候該做

**任一條成立就該執行:**

1. **IceBlue 來源開始使用 `@layer`、`@scope`、`::picker()`、`light-dark()` 或任何
   CleanCSS 不認識的語法。**屆時 `HOSTILE_CONSTRUCTS` 會讓 build 中止(對 `@layer`/`@scope`),
   但**它的清單不是全集** —— `::picker(select)` 這一類就不在裡面,Marble 就是這樣被咬到的。
2. **兩支 `build-css.js` 決定要合併成一支共用工具**(呼應 L-6「build 工具產品化」)。
3. **決定要用 Lightning CSS 的 `targets` 做瀏覽器降級**(那會讓 L-2 的手工前綴決策失效,
   是好事,但要重做一次 L-2)。

**不成立時不要做。**IceBlue 今天 `@layer`/`@scope` 用量為 0,換裝只會破壞
「與 zklessc 零差異」這個錨點。

### 3.2 可行性探測結果(2026-09-04 實測)

把 IceBlue 的 92 個來源 `.css` 全部餵進 Lightning CSS(DSP EL 已遮罩):

```
source .css files : 92
parsed OK         : 84
FAILED            : 8
warnings          : 0
```

**8 個失敗分成 4 類,全部可修,而且其中 3 類本來就該修:**

| # | 類別 | 檔案 | 精確位置 | 判定與修法 |
|---|---|---|---|---|
| 1 | **IE7 星號 hack** `*zoom: 1` / `*z-index: 3` | `js/zkmax/layout/css/rowlayout.css`、`js/zkmax/layout/css/goldenlayout.css`、`js/zkmax/goldenlayout/css/goldenlayout.css` | rowlayout:3、goldenlayout:161 | **刪除。**全樹共 **3 處**。IE7 早已不在支援範圍,L-2 也已刪掉其他舊前綴 |
| 2 | **IE8/9 `\0` media hack** `@media screen and (min-width: 0 \0)` | `js/zkmax/tbeditor/css/tbeditor.css`、`js/zkmax/inp/css/tbeditor.css` | tbeditor:81 | **刪除整個 media block。**同一份內容出現在兩個路徑 |
| 3 | ⚠️ **無效選擇器(真實既存缺陷)** `.z-searchbox[disabled]-icon` | `js/zkmax/inp/css/searchbox.css` | 36:23 | **刪除該規則。**屬性選擇器後面直接接 `-icon` 不是合法 CSS,**永遠匹配不到任何元素**。緊接著的第 39 行 `.z-searchbox[disabled] .z-searchbox-icon` 宣告完全相同,所以**刪掉沒有視覺影響**。這是 LESS `&-suffix` 轉純 CSS 的典型陷阱(見 industry-direction §6.5),而 CleanCSS 一路放行 —— **這條無效規則目前正在出貨** |
| 4 | **`@import` 順序**(探測假象) | `zul/css/norm.css`、`zkmax/css/tablet.css` | — | **不是真問題。**`resolveImports()` 在 `minify()` **之前**執行(`build-css.js:560` vs `:568`),所以實際管線裡 minifier 從不會看到 `@import`。探測腳本是直接讀原始檔才撞到 |

**⇒ 真正要動的來源修改只有 3 個構造、5 個檔案,而且三者都是「本來就該刪」。**

### 3.3 執行步驟

1. **先修 §3.2 的 1–3 類**(可獨立於換裝進行,而且**建議先單獨做一次 commit**)
   ── *驗收:CleanCSS 版重建後語意 diff 只少掉那 3 個構造*
2. **擷取基準**:`npm run build:css` → 完整複製 `target/classes/web/<theme>/`
3. **加入 `lightningcss` devDependency**
4. **改寫 `minify()`**:照 §2.2,但**保留 IceBlue 既有的 placeholder 機制**(見 §3.4)
5. **重跑語意 diff**(§5 的腳本)
   ── *驗收:差異只落在「序列化」與「已知修正」兩類*
6. **重新宣告驗收錨點**:「與 zklessc 零差異」這個錨點在此之後**不再成立**,
   必須改成「與換裝前的 CleanCSS 版零語意差異」。**這一步是文件工作,不是程式工作,但不能跳過**
   —— 整個棄用 LESS 專案的可信度建立在那個錨點上
7. **移除 `clean-css`**,並清掉 `HOSTILE_CONSTRUCTS` 中已由 Lightning CSS 正確處理的項目
   ── *⚠️ 不要整個刪掉守門,見 §3.4 第 3 點*

### 3.4 IceBlue 特有的三個地雷

1. **placeholder 機制必須保留,而且順序不能動。**IceBlue 的 DSP 表面比 Marble 大得多:
   **120 個 `ZKBD` 類 placeholder + 58 處 `${…}` EL**(Marble 只有 2 處 EL、0 處選擇器位置 DSP)。
   現行流程是 `restorePlaceholders()` 在 **minify 之後**執行(`build-css.js:468`),
   也就是 minifier 看到的是合法 CSS —— **這個設計本來就是 Lightning CSS 需要的形狀**,
   不要「順手簡化」。要新增的只有 `${…}` EL 的遮罩。

2. **`level: 0` → Lightning CSS `minify: true` 是壓縮強度的躍升,不只是換工具。**
   IceBlue 現在是純重新序列化;Lightning CSS 會真的做最佳化。
   **語意 diff 會很大**,而且大部分是無害的。準備好 §5 腳本的正規化規則
   (選擇器排序、逗號空白、`/` 前後空白),否則會被雜訊淹沒。

3. **`HOSTILE_CONSTRUCTS` 不要整個拿掉。**Lightning CSS 解決的是
   「minifier 看不懂現代 CSS」;它**不**解決「DSP tag 出現在選擇器位置」
   或「EL 出現在 `url()` 之外」——那兩類仍然是必須被擋下來的。
   **只拿掉 `@scope` 與裸 `@layer` 兩條**,其餘保留。

### 3.5 附帶收穫:換裝等於一次來源合法性檢查

§3.2 第 3 類是這次探測最有價值的發現:**Lightning CSS 抓到了一條 CleanCSS 放行了、
而且正在出貨的無效選擇器。**未來若要在 CI 加一道「來源是否為合法 CSS」的守門,
`lightningcss.transform()` 本身就是現成的工具,不需要另外引進 linter。

---

## §4【延後】D4:Marble 的 CleanCSS 殘留清理

**現況**:`package.json` 仍有

```json
"scripts": { "minify": "cleancss -o target/classes/web/marble/css/marble.min.css target/classes/web/marble/css/marble.css" },
"devDependencies": { "clean-css-cli": "^5.6.0" }
```

**判定:既有死碼,不是這次換裝造成的。**

* 輸入檔 `target/classes/web/marble/css/marble.css` **不存在**
* 全 repo(`package.json` / `scripts/` / `pom.xml`)**沒有任何地方呼叫 `npm run minify`**
* `clean-css-cli` 是它唯一的使用者

**為什麼當時沒刪**:專案規矩是「注意到不相關的死碼就回報,不要順手刪」。
`clean-css`(函式庫)因為是本次改動造成的孤兒,已移除;`clean-css-cli` 不是。

**未來要做的話**:刪掉 `minify` script + `clean-css-cli` 兩行,CleanCSS 即完全離開 Marble。
零風險 —— 但**先確認沒有任何外部文件或 CI 教人跑 `npm run minify`**。

---

## §5 驗收工具:語意 diff(完整腳本)

換裝的驗收不能比對 bytes(換 minifier 必然逐位元組不同),必須比對**語意**。
做法:把新舊兩份輸出**用同一個 parser 正規化**,再逐條 declaration 比對;
剩下的差異就是真實的內容差異。

> 這支腳本在 Marble 的換裝中實際使用過,產出 §2.4 的結果。
> 用法:`NODE_PATH=<repo>/node_modules node cssdiff.js <baseline-dir> <new-dir>`

```js
// cssdiff.js — semantic diff between two built theme trees.
const fs = require('fs'), path = require('path');
const { transform } = require('lightningcss');
const A = process.argv[2], B = process.argv[3];
const TAGLIB = /<%@[^%]*%>/g, DSP_EL = /\$\{[^}]*\}/g;

function norm(txt) {
  const els = [];
  let s = txt.replace(TAGLIB, '').replace(/<c:[^>]*>|<\/c:[^>]*>/g, '');
  s = s.replace(DSP_EL, (m) => `ZKDSPEL${els.push(m) - 1}ZZ`);
  if (!s.trim()) return { ok: true, text: '' };
  try { return { ok: true, text: transform({ filename: 'n.css', code: Buffer.from(s), minify: true }).code.toString() }; }
  catch (e) { return { ok: false, err: e.message.split('\n')[0] }; }
}
// 消掉純序列化差異:選擇器清單排序、值內逗號空白、`/` 前後空白、outline:0<->none
function canonSel(sel) { return sel.split(',').map(x => x.trim().replace(/\s+/g, ' ')).sort().join(','); }
function canonDecl(d) {
  return d.trim().replace(/,\s+/g, ',').replace(/\s*\/\s*/g, '/')
          .replace(/\s+/g, ' ').replace(/^outline:0$/, 'outline:none');
}
function records(text) {
  const out = []; const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(text))) {
    const sel = canonSel(m[1]);
    for (const d of m[2].split(';')) { const t = canonDecl(d); if (t) out.push(sel + ' | ' + t); }
  }
  return out;
}
function walk(dir, base = dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    e.isDirectory() ? walk(p, base, acc) : acc.push(path.relative(base, p));
  } return acc;
}
const fa = new Set(walk(A)), fb = new Set(walk(B));
let differing = 0, rem = 0, add = 0; const pf = [], rep = [];
for (const f of [...fa].filter(x => fb.has(x)).sort()) {
  const na = norm(fs.readFileSync(path.join(A, f), 'utf8')), nb = norm(fs.readFileSync(path.join(B, f), 'utf8'));
  if (!na.ok || !nb.ok) { pf.push(`${f}  A=${na.err || 'ok'}  B=${nb.err || 'ok'}`); continue; }
  const sa = new Map(), sb = new Map();
  for (const r of records(na.text)) sa.set(r, (sa.get(r) || 0) + 1);
  for (const r of records(nb.text)) sb.set(r, (sb.get(r) || 0) + 1);
  const removed = [], added = [];
  for (const [k, v] of sa) { const d = v - (sb.get(k) || 0); for (let i = 0; i < d; i++) removed.push(k); }
  for (const [k, v] of sb) { const d = v - (sa.get(k) || 0); for (let i = 0; i < d; i++) added.push(k); }
  if (!removed.length && !added.length) continue;
  differing++; rem += removed.length; add += added.length;
  rep.push(`\n### ${f}   (-${removed.length} / +${added.length})`);
  removed.forEach(r => rep.push('  - ' + r));
  added.forEach(r => rep.push('  + ' + r));
}
console.log(rep.join('\n'));
console.log(`\n===== SUMMARY =====\nfiles compared : ${[...fa].filter(x => fb.has(x)).length}` +
            `\nfiles differing: ${differing}\nrecords ONLY in baseline: ${rem}\nrecords ONLY in new: ${add}`);
if (pf.length) { console.log(`\nPARSE FAILURES (${pf.length}):`); pf.forEach(x => console.log('  ' + x)); }
```

**已知的良性差異類別**(出現這些不算回歸):

| 類別 | 例 |
|---|---|
| 選擇器清單順序 | `*,:after,:before` ↔ `*,:before,:after` |
| 值內逗號後空白 | `"Inter",-apple-system` ↔ `"Inter", -apple-system` |
| `/` 前後空白 | `center/contain` ↔ `center / contain` |
| CleanCSS 的等價改寫 | `outline:none`→`outline:0`、`red 0%`→`red 0` |

**非 CSS 檔會 parse fail**(字型、LICENSE),忽略即可。

---

## §6 重現指令

```bash
# ── CleanCSS 現行 warning 稽核(換裝前一定要先跑,證明基準可信) ──
# 在 minify 呼叫之後暫時插入:
#   if (output.warnings?.length) console.warn('  [WARN] ' + output.warnings.join(' || '));
# Marble 2026-09-03 的結果是 3 個活的 warning。

# ── 三個構造的對照 spike ──
node -e "
const lc=require('lightningcss'), C=require('clean-css'); const cc=new C({level:1,rebase:false});
for (const s of [
  '@font-face{src:url(\${c:encodeURL(\"~./x.woff2\")}) format(\"woff2\")}',
  '@layer a,b;*{box-sizing:border-box}',
  '@scope (.z-page){h1{font-size:2em}}',
]) {
  const c=cc.minify(s);
  let l; try { l=lc.transform({filename:'x.css',code:Buffer.from(s),minify:true}).code.toString(); }
  catch(e){ l='THROW: '+e.message.split('\n')[0]; }
  console.log('IN   :',s,'\nCLEAN:',(c.styles||'(EMPTY)'),'\nLIGHT:',l,'\n');
}"

# ── IceBlue 來源可行性探測(§3.2 的數字) ──
# 把每個 src/main/resources/web/**/*.css 遮罩 ${...} 後餵給 lightningcss.transform,
# 統計 parsed / failed;失敗時印出 e.loc.line/column 與前後三行。

# ── IceBlue 的 DSP 表面 ──
cd /Users/hawk/Documents/workspace/zkThemeTemplate-iceblue
grep -rc 'ZKBD' src/main/resources/web --include=*.css | awk -F: '{s+=$2} END{print "placeholders:",s+0}'
grep -rho '\${[^}]*}' src/main/resources/web --include=*.css | wc -l   # EL 數

# ── IE hack 分佈 ──
grep -rn '^\s*\*[a-z-]*:' src/main/resources/web --include=*.css      # 星號 hack:3
grep -rn 'min-width: 0 ' src/main/resources/web --include=*.css        # \0 hack

# ── @layer / @scope 用量(觸發條件的判斷依據) ──
for d in ../zkThemeTemplate .; do
  echo -n "$d @layer: "; grep -rl '@layer' $d/src/main/resources/web --include=*.css | wc -l
  echo -n "$d @scope: "; grep -rl '@scope' $d/src/main/resources/web --include=*.css | wc -l
done
```
