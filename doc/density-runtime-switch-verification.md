# Density 執行期切換：機制驗證記錄與快取鍵修復

> 2026-08-17。**規格未變。** C25 仍然成立:
> `org.zkoss.zul.theme.density` 是切換 density 的唯一方式。
> 本文回答一個更小的問題(**那個 property 一定要在啟動時就設好嗎?**),
> 並記錄由此追出來的一個**現行缺陷及其修復**:density 不在 WCS 的 cache key 裡。
>
> **交付的程式碼變更**:`Iceblue11ThemeProvider`(新)+ 在 `Iceblue11ThemeWebAppInit` 註冊
> + `check:density-property` 新增 cache-key 斷言。user 於 2026-08-17 裁示選項 B(本案獨立先補)。

---

## L1 執行摘要

### 問題

D6/C25 收斂之後,readme 教的審查方式是「用 `-Dorg.zkoss.zul.theme.density=compact` 重啟」。
但 library property 並不是啟動時的常數 —— 那麼:**在執行期改掉那個 property、再重新載入頁面,
會不會就換到 compact 的樣式表?** 若會,「一定要重啟」這句話就是過度保守的。

### 結論

**會。伺服器端完全動態,不需要重啟 JVM。** 三段證據都通:

| 觀測點 | default | compact |
|---|---|---|
| `zk.wcs` 送出的位元數 | 525096 | 539491(+14395) |
| bundle 內的 compact 區塊 | **0** | **1** |
| `--zk-base-font-size`(瀏覽器實測) | 16px | 12px |
| `--zk-input-height`(瀏覽器實測) | 34px | 24px |
| textbox 實際高度 | 34px | 24px |

切回去之後位元數回到 **525096**(與初始逐位元相同),所以這是可逆的、不是單向汙染。

### 但這只證明了伺服器端

**預覽程式把快取關掉了**(`ThemePreviewApp` 的 `org.zkoss.web.classWebResource.cache=false`),
出貨的 app 不會這樣做。實測到的兩件事讓這件事不能直接外推:

1. **預設設定下,`zk.wcs` 帶的是 `Cache-Control: public, max-age=31536000`**(一年)。
2. **density 不在那個 URL 裡。** 兩種密度的路徑逐字元相同:
   `/zkau/web/df097106/_zkiju-iceblue11/zul/css/zk.wcs`
   —— 主題名 (`_zkiju-iceblue11`) **在** cache key 裡,density **不在**。

### 快取確實會吐出過期的樣式表(已重現)

**同一個 context、同一個 URL、同一個時刻,兩種 fetch 模式拿到不同的檔:**

| fetch 模式 | 位元數 | compact 區塊 |
|---|---|---|
| 預設(允許快取) | 539491 | **1** |
| `cache: no-store`(強制走網路) | 525096 | **0** |

⇒ **瀏覽器正在拿快取裡的舊樣式表。** 只要 cache 是暖的,
`Library.setProperty()` + `sendRedirect()` 在出貨設定下**換不到 compact** ——
正常導覽與 reload(也就是 `sendRedirect(null)` 實際做的事)兩種都實測為 stale。

### 而且這個洞不只咬執行期切換,它也咬「現在出貨的規格」

兩份 app、一份以 default 開機、一份以 `-Dorg.zkoss.zul.theme.density=compact` 開機:

| | 8082(default 開機) | 8084(compact 開機) |
|---|---|---|
| `--zk-base-font-size` | 16px | 12px |
| WCS 路徑 | `/zkau/web/df097106/_zkiju-iceblue11/zul/css/zk.wcs` | **逐字元相同** |

stamp `df097106` 不變 —— 因為它由 `WebManager.getCWRURLPrefix()` 在 init 以
version ⊕ build ⊕ edition ⊕ JS 模組雜湊算出,**library property 不是輸入**。

⇒ 客戶照 C25 的規格改 `zk.xml` 再重啟,**回訪使用者的瀏覽器最長一年都還會用舊密度的樣式表**。
這不是「未來若要做執行期切換才需要解」的問題,是**現行規格就已經存在的缺陷**。

這正是 `tasks/theme-pack-palette-mechanism.md` L3.3(d) 記下的那個洞
(「密度軸也有同一個洞,而那一案沒有處理」),本次把它量出來並確認了它的射程。

### 修復:density 進入 cache key(已完成、已驗證)

`Iceblue11ThemeProvider` 把 density 併進 ZK 既有的注入片段,所以兩種密度是兩個 URL:

| property | WCS cache key | bundle |
|---|---|---|
| 未設 | `…/_zkiju-iceblue11/zul/css/zk.wcs` | 526988 B,無 compact 區塊 |
| `compact` | `…/_zkiju-iceblue11-compact/zul/css/zk.wcs` | 541383 B,1 個區塊 |
| `foo` | `…/_zkiju-iceblue11/…`(**與未設共用**) | 526988 B,無 |

修復後重跑同一個 stale 測試:暖機 default → 翻成 compact → 正常導覽與 reload
**兩者都拿到 12px**(修復前兩者都是 16px)。

**預設密度的 URL 一個字元都沒變** —— 這是刻意的:加入 density 不該無故失效
所有既有 app 的快取。三態的 `foo` 與未設共用一個鍵,也是刻意的:它們送出相同的位元。

### 這個修復差點變成一個更大的破壞(必讀)

第一版把它寫成 `extends org.zkoss.zul.theme.StandardThemeProvider` —— **編得過、跑得動、
閘門也有一項是綠的,但它靜默拿掉了主題的 zkex/zkmax 元件 CSS**。
ZK 的 provider 是一條 **edition 鏈**(`zkmax` → `zkex` → `zul`),
只有 zkmax 那一節會把 `~./js/zkex/`、`~./js/zkmax/` 改寫到主題;
繼承最底層那一節、再用 `setCustomThemeProvider(true)` 鎖住,就等於把 zkmax 那一節擋掉。
實測 bundle 差 **10646 B**,`.z-colorbox` 長回 `-moz-`/`-o-` 前綴(migration 已經清掉的東西)。

⇒ 正解是**委派而不是繼承**,而且**必須延遲解析**:`WebAppInit` 跑在各 jar 的 `zk.xml`
之前(這正是 `setCustomThemeProvider(true)` 能壓住它們的原因,ZK-1671),
所以註冊當下還讀不到 zkmax 的 provider。詳見 L3.7。

### 交付物

| 檔 | 內容 |
|---|---|
| `src/test/resources/web/density-probe.zul` | 探針頁:`checkbox mold="switch"` + 證據面板 + 受影響的元件 |
| `src/test/java/zk/example/DensityProbeVM.java` | `Library.setProperty()` + `Executions.sendRedirect(null)` |
| `usecase/index.zul`、`UseCaseVM.java` | 側邊欄 Overview 群組多一個「Density Probe」入口 |

**這是實驗,不是把 D3 加回來。** D3 是 `IceblueDensity.apply()` —— 一個出貨的公開 API,
靠 `data-density` 屬性;本頁動的是 C25 保留下來的那個唯一旋鈕,而且只在預覽程式裡。

---

## L2 驗證步驟與判準

### L2.1 伺服器端是否動態(通過)

| # | 步驟 | 判準 | 結果 |
|---|---|---|---|
| 1 | 起預覽程式,載入探針頁 | property 未設 ⇒ 伺服器回報 `default` | ✅ |
| 2 | 量 bundle 位元數與 compact 區塊數 | 525096 B / **0** 個區塊 | ✅ |
| 3 | 撥動 switch(觸發 `setProperty` + `sendRedirect`) | 伺服器回報 `compact` | ✅ |
| 4 | 重量 | 539491 B / **1** 個區塊 | ✅ |
| 5 | 量瀏覽器 computed 的 4 個 token | 全部等於 compact 側的值 | ✅ |
| 6 | 量 textbox 實際高度 | 34px → 24px | ✅ |
| 7 | 撥回去 | 位元數回到 525096(逐位元相同) | ✅ |

判準的重點在第 2/4 列:**量的是伺服器送出的 bundle**,不只是「CSS 有沒有生效」。
若只量 computed style,無法區分「伺服器重繪了」與「瀏覽器早就有兩套、只是換選擇器」。

### L2.2 快取風險是否真實(確認:真實)

| # | 步驟 | 判準 | 結果 |
|---|---|---|---|
| 1 | 用出貨設定(不關 `classWebResource.cache`)起一份 | 回應帶 `max-age=31536000` | ✅ |
| 2 | 比對執行期兩種密度的 WCS URL | 路徑相同 | ✅ **相同** |
| 3 | 比對**開機時**兩種密度的 WCS URL(8082 vs 8084) | 路徑相同 ⇒ 洞也咬現行規格 | ✅ **相同**,stamp 皆 `df097106` |
| 4 | 暖機**兩次**(第二次是裸 URL)→ 翻 property → 正常導覽 | 應 painted 舊值 | ✅ **stale** |
| 5 | 同上,改用 reload(`sendRedirect(null)` 實際行為) | 應 painted 舊值 | ✅ **stale** |
| 6 | 同 context 同 URL,預設 fetch vs `no-store` | 兩者應不同 | ✅ 539491/1 vs 525096/0 |

**第 4/5 列是本節的關鍵,而它前三次沒能重現 —— 原因是測試無效,不是結論**:
暖機若落在 session 的第一個 request,寫進快取的鍵會帶 jsessionid,
與後續要求的裸 URL 不同鍵 ⇒ 必然 miss。改成暖機兩次之後立刻重現(L3.3)。

### L2.3 沒有被破壞的東西

| 檢查 | 理由 |
|---|---|
| `xmllint` 兩個 ZUL | 新頁與改過的 sidebar 都要能解析 |
| `mvn test-compile` | 新 VM 要編得過 |
| 探針頁 HTTP 200 | xmllint 過 ≠ 會 render(第一版就因 `Script` 沒有 `setType` 吃了 500) |
| CSS 閘門 | 本次**一個 CSS 檔都沒動**,`src/main` 零改動 |

---

## L3 技術附錄

### L3.1 為什麼伺服器端是動態的 —— 逐層拆解

四層都不快取「算好的結果」,只快取「解析後的形狀」:

| 層 | 檔案 | 快取什麼 | 是否阻擋 |
|---|---|---|---|
| DSP 函式 | `zweb/.../tld/web/core.dsp.tld:227-229` | 無 —— `c:property` 的 `function-class` 直接就是 `org.zkoss.lang.Library`、`function-signature` 是 `getProperty(String)` | 否 |
| property 儲存 | `zcommon/.../lang/Library.java:45` | `static final Map` = `ConcurrentHashMap`,每次 `getProperty` 現查 | 否 |
| DSP extendlet | `zweb/.../resource/DspExtendlet.java:60,81,93` | `ResourceCache<String, Interpretation>` —— 快取**解析後的頁**,`cnt.interpret(...)` 每個 request 跑一次 | 否 |
| WCS extendlet | `zk/.../http/WcsExtendlet.java:67,103-118` | `WcsInfo` = 解析後的 `zk.wcs` XML(一串 href),每個 request 逐一 `_webctx.include(...)` | 否 |

再加上預覽程式的 `org.zkoss.zk.WCS.cache=false`
(`ThemePreviewApp.java:21`),`DspExtendlet.service` / `WcsExtendlet.service` 開頭會
`_cache.clear()`,連「解析後的形狀」都不留。

### L3.2 快取層的兩個數字來源

- **一年**:`WcsExtendlet.java:96` 取 `tp.getWCSCacheControl(exec, p)`;
  本樹沒有自訂 ThemeProvider,走 `zul/.../theme/StandardThemeProvider.java:73`,
  `return 8760;`。`JspFns.setCacheControl`(`zk/.../fn/JspFns.java:186-207`)
  把它寫成 `max-age = 8760 * 3600 = 31536000`,而且只有在
  `Library.getProperty("org.zkoss.web.classWebResource.cache")` **等於字串 `"false"`** 時
  才整段跳過 —— 這就是預覽程式免疫的原因。
- **density 不在 URL 裡**:URL 前綴由 `WebManager.getCWRURLPrefix()`
  (`zk/.../http/WebManager.java:322-341`)在 **init 時算一次**,
  輸入是 version ⊕ build ⊕ edition ⊕ 各 langdef 的 JS 模組雜湊 —— **沒有 library property**。
  主題名那一段是另一條路進來的:`StandardThemeProvider.bypassURI` 呼叫
  `ThemeProvider.Aide.injectURI`(`zk/.../util/ThemeProvider.java:163`),
  把主題名塞成 `~./_zkiju-<theme>/…`。

  `ThemeProvider` 的 javadoc 把這件事講得很直接:
  > To allow the client to cache the WCS file, you can inject a special fragment into the URI of
  > the WCS file such that a different URI represents a different theme.

  ⇒ **修法已經在框架裡,只是 density 沒有用它。**

### L3.3 前三次重現失敗的根因,以及修正後的重現

**失敗的三次:**

| 嘗試 | 做法 | 結果 |
|---|---|---|
| 1 | 出貨快取設定 + `location.reload()` | 回網路拿,CSS 跟著換 |
| 2 | 兩個 context:A 暖機一次、B 翻 property、A 正常導覽 | A 回網路拿 |
| 3 | **persistent profile**(真磁碟快取)+ 正常導覽到沒去過的頁 | 仍然回網路拿 |

**根因實測:**

```
load 1 (fresh session) : …/zul/css/zk.wcs;jsessionid=D14F25947B263334D75BDC88DD1DA533
load 2 (has cookie)    : …/zul/css/zk.wcs
load 3 (has cookie)    : …/zul/css/zk.wcs
```

一個 session 的第一個 request 會被 URL-rewrite 塞進 jsessionid,之後不會。
三次嘗試的「暖機」都落在 session 的第一次載入 ⇒ 寫進快取的鍵帶 jsessionid、
後續要求的鍵不帶 ⇒ **必然 miss,與 `max-age` 無關**。

**修正:暖機兩次(第二次以裸 URL 進快取)後立刻重現:**

```
A warm load 1 : font=16px  url=…/zk.wcs;jsessionid=2C502A93…
A warm load 2 : font=16px  url=…/zk.wcs          <-- 裸 URL 進快取
B flipped     : font=12px                        <-- 伺服器已切 compact
A after nav   : font=16px                        <-- STALE
A after reload: font=16px                        <-- STALE
```

最強的一項(同 context、同 URL、同時刻、兩種 fetch 模式):

```
default cache mode : 539491 bytes, compact blocks = 1
cache: no-store    : 525096 bytes, compact blocks = 0
```

> **一個量測陷阱:** Playwright 的 `request.timing().responseStart < 0` 判「是否來自快取」
> **不可靠** —— 上面 stale 的那幾次它全部回報 `200 NETWORK`。
> 判準要用「畫出來的值」或「fetch 兩種模式的位元數差」,不要用 timing 推論。

### L3.3b 開機期也中招 —— stamp 不含 density 的實測

| | 8082(default 開機) | 8084(`-D…density=compact` 開機) |
|---|---|---|
| `--zk-base-font-size` | 16px | 12px |
| WCS 路徑 | `/zkau/web/df097106/_zkiju-iceblue11/zul/css/zk.wcs` | **逐字元相同** |

兩份 app 送出**內容不同**的樣式表,卻共用**同一個** cache key。
⇒ C25 現行的「改 `zk.xml` + 重啟」路徑,對回訪使用者同樣不保證生效。

### L3.4 探針頁的兩個實作決定

1. **`<script>` 不能有 `type` 屬性。** 第一版寫 `type="text/javascript"`,
   `org.zkoss.zul.Script` 沒有 `setType`,ZK 直接讓整頁 500:
   `Method setType not found for class org.zkoss.zul.Script`。
   xmllint 是綠的 —— 這是「解析過 ≠ render 得出來」的又一例。
2. **switch 的「關」值用 `"default"`,不是 `null`。**
   `Library.setProperty(key, null)` 會存進一個 null,而 `getProperty` 在拿到 null 時
   會**往下掉到 `System.getProperty`**(`Library.java:70-76`)⇒ 若 app 是用
   `-Dorg.zkoss.zul.theme.density=compact` 起的,switch 就再也關不掉。
   任何非 `compact` 的值都等於 default,這與 `scripts/check-density-property.js`
   的 `foo` 那一態同義。

### L3.5 這個做法為什麼還不能當出貨 API

| 性質 | 後果 |
|---|---|
| `Library` 是 **JVM 全域 static** | 一個 user 撥動 switch,**全站所有 session** 的密度都變。不是 per-user。 |
| 只在記憶體 | 重啟後回到 `-D` / `zk.xml` 的值 |
| 快取鍵沒有 density | L1 的第二節;要出貨得先補 `Aide.injectURI` |

前兩項對單人審查的預覽程式無害,對出貨的 API 是硬傷。

### L3.7 修復的實作決定,與那個差點出貨的錯誤版本

#### (a) 為什麼是委派,不是繼承

| | 第一版(錯) | 定案 |
|---|---|---|
| 形狀 | `extends org.zkoss.zul.theme.StandardThemeProvider`,覆寫 `getThemeURIs` | `implements ThemeProvider`,持有一個 delegate,只在 `getThemeURIs` 加工 |
| zkex/zkmax 元件 CSS | **靜默換成 jar 裡未套主題的版本**(bundle 差 10646 B) | 不動 |
| 症狀 | `.z-colorbox` 長回 `-moz-`/`-o-` 前綴;`check:bytes` 仍綠(它比的是磁碟輸出,不是服務出來的 bundle) | — |
| 抓到的方式 | `check:density-property` 印的 `bytes:` 從 526988 變 537634 | — |

**根因**:ZK 的 provider 是 edition 鏈,`javap` 可證:

```
org.zkoss.zkmax.theme.StandardThemeProvider
  extends org.zkoss.zkex.theme.StandardThemeProvider
    extends org.zkoss.zul.theme.StandardThemeProvider
```

每一節加寬 `beforeWidgetCSS` 一個 widget namespace,`~./js/zkex/` 與 `~./js/zkmax/`
只有最上面那一節處理。zkmax 在自己的 `metainfo/zk/zk.xml` 宣告
`<theme-provider-class>org.zkoss.zkmax.theme.StandardThemeProvider</theme-provider-class>`,
而 `setCustomThemeProvider(true)` 會讓 `ConfigParser` 跳過那一行(`ConfigParser.java:570`)。
⇒ 繼承最底層 + 上鎖 = 把 EE 的那一節擋掉。

#### (b) 為什麼 delegate 必須延遲解析

`WebAppInit` 跑在各 jar 的 `zk.xml` 解析**之前** —— 這一點不是推論,是被上面那個 bug
反向證明的:如果順序相反,`setCustomThemeProvider(true)` 就壓不住 zkmax 的宣告,也就不會有回歸。
⇒ 註冊當下 `config.getThemeProvider()` 還拿不到 zkmax 的那一個,
所以 delegate 在**第一次呼叫時**才建,按 `zkmax → zkex → zul` 取第一個載得起來的。
用 `Class.forName` 而不是直接 import,是為了 CE 部署(沒有 zkmax jar)不會 `NoClassDefFoundError`。

#### (c) 為什麼用 `Aide.decodeURI` 再 `injectURI`,而不是自己拼字串

delegate 已經注入了主題名(`~./_zkiju-iceblue11/zul/css/zk.wcs`)。
`Aide.decodeURI` 把它拆回 `["~./zul/css/zk.wcs", "iceblue11"]`,加上密度再 `injectURI`。
兩支都是 ZK 為此提供的公開 API,不需要知道 `_zkiju-` 這個字面值。

#### (d) 閘門與負向控制

`check:density-property` 除了原本的「區塊在不在」,新增跨狀態的 cache-key 斷言:
`compact` 的鍵必須與未設**不同**、`foo` 的鍵必須與未設**相同**。

負向控制實測:在 `getThemeURIs` 開頭插一行 `if (true) return themed;` ⇒ 閘門 **exit 1**,
並指名「compact shares its cache key with unset」。

### L3.6 Change Log

| # | 日期 | 原本的敘述 | 更正 | 依據 |
|---|---|---|---|---|
| 1 | 2026-08-17 | (readme / D6 敘述)審查 compact **要重啟** app | **伺服器端不需要重啟** —— property 執行期改掉 + reload 就會換表,四層都不快取算好的結果。「要重啟」在出貨情境仍是安全的建議,理由從「機制做不到」改成「快取鍵沒有 density」 | L3.1、L2.1 七列全綠 |
| 2 | 2026-08-17 | (`theme-pack-palette-mechanism.md` L3.3(d))「密度軸也有同一個洞」,但 `<stamp>` 在什麼條件下會轉**沒有量到** | **量到了**:`<stamp>` = `df097106`,由 `WebManager.getCWRURLPrefix()` 在 init 算一次,輸入不含 library property;兩種密度的完整路徑逐字元相同 | L3.2 |
| 3 | 2026-08-17 | (本次的工作假設)出貨設定下瀏覽器**會**吐出過期樣式表,可以直接示範 | **一度沒能重現,原因是測試無效**(jsessionid 改寫讓暖機與查驗用不同的 cache key)。**修正後已重現**:暖機兩次讓裸 URL 進快取,正常導覽與 reload 兩者皆 stale;同 context 同 URL 的 `default` vs `no-store` fetch 差 14395 B | L3.3 |
| 4 | 2026-08-17 | (本文第一版)快取鍵的洞是「若日後要做執行期切換才需要解」的**未來問題**,而且風險只是「未被否證」 | **兩點都要更正。**(a)風險**已證實**;(b)射程比原本寫的大 —— **現行 C25 的「改 `zk.xml` + 重啟」路徑同樣中招**:兩份以不同密度開機的 app 送出不同的樣式表卻共用同一個 cache key(stamp 皆 `df097106`)⇒ 這是現行規格就存在的缺陷,不是未來功能的前置條件 | L3.3b;**user 於 2026-08-17 指出「不把 density 放進快取鍵就根本切不過去」,循此追測而得** |
| 5 | 2026-08-17 | (第 4 列的推論)這個洞要等 palette 案一起補 | **本案獨立先補**(user 裁示選項 B)。`Iceblue11ThemeProvider` 已交付並驗證,`check:density-property` 加上跨狀態 cache-key 斷言 + 負向控制 | L1〈修復〉;L3.7 |
| 6 | 2026-08-17 | (修復的第一版實作)provider 可以直接 `extends org.zkoss.zul.theme.StandardThemeProvider` | **不行,而且會靜默破壞。** ZK 的 provider 是 edition 鏈,只有 zkmax 那一節改寫 `~./js/zkex/` 與 `~./js/zkmax/`;繼承最底層再 `setCustomThemeProvider(true)` 會把 EE 那一節擋掉 ⇒ 主題的 zkex/zkmax 元件 CSS 換成 jar 裡未套主題的版本,bundle 差 **10646 B**、`.z-colorbox` 長回 `-moz-`/`-o-`。改為**委派 + 延遲解析** | L3.7(a)(b);`javap` 證鏈;`ConfigParser.java:570` |
