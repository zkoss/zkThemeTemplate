# `install a` 的覆蓋真的被服務嗎?到了 P7 視覺 A/B 還準嗎?

> 提問(2026-08-13):
> 1. 這個複製覆蓋到 `target/` 的程序,有驗證過**確實會載入 baseline DSP** 嗎?
>    有做過類似**變異測試**確認不是載到暫存檔或原本的檔案嗎?
> 2. 目前已進行到 **P7**,這時候做視覺 A/B 還準嗎?
>
> 前一份紀錄:`tasks/where-is-baseline-dsp-loading-documented.md`(文件在哪裡)。
> 這一份回答的是**證據強度**與**現在適不適用**。

---

## Q1:有驗證過。而且其中一種就是字面意義上的變異測試

### 證據 1 —— 負向控制**真的燒起來過**(S20 / S21,最強的一種證據)

改名之前,`install a` 與 `install b` 兩側服務出來的 `zk.wcs`
**sha256 完全相同**(`0a1738c5…`)⇒ **A/B 截圖會逐像素相同**。

當時的實際狀態是:主題從來沒有被服務過,兩側拍到的都是 ZK 內建 CSS
(把服務出來的 `zk.wcs` 解析成 3639 條規則,其中 **元件規則 0 條**、
`--zk-` 自訂屬性 **0 個**,對照本主題 `norm.css.dsp` 單檔就有 1496 個)。

**這件事的意義**:「覆蓋是否真的被載入」這個問題不是事後補問的 ——
它被問過、答案曾經是**否**、而且是在拿 harness 去收工**之前**抓到的。
S20 原文把後果寫得很清楚:「這比『只有一頁 preview.zul』嚴重,
缺頁面會**明顯失敗**,這個**不會**。」

### 證據 2 —— HTTP 層的正向鑑別,而且鑑別到「不是哪一種錯」(紀錄 #36 e/f)

名字修好之後,同一個 `zk.wcs`:

| 側 | sha256 | 大小 |
|---|---|---|
| A(`install a`,baseline DSP) | `a56858a9…` | 530434 B |
| B(轉換後輸出) | `6f293b24…` | 531482 B |

**兩側不同** ⇒ 排除「其實服務的是同一批 byte」。

更關鍵的是 (f):把兩份**服務出來**的 CSS 套上 `check-bytes.js` 那 5 類封閉序列化正規化,
**兩邊都是 525145 B 且字串完全相同**。

這正是你問的鑑別力 —— A 側是「**byte 不同、語意相同**」,同時排除掉兩種假成功:

| 假成功情境 | 會量到什麼 | 實測 |
|---|---|---|
| 服務的是 B 的暫存/原檔 | 兩側 **byte 相同** | ✗ 不同(a568… vs 6f29…) |
| 服務的是 ZK jar 自己那份 | 兩側 **語意不同**(S20 量過:元件規則 0 條) | ✗ 正規化後逐 byte 相同 |
| 真的是 baseline | byte 不同、語意相同 | ✓ |

### 證據 3 —— 標記注入探針 = 變異測試,而且注入的就是同一個目錄(S24 → `scripts/ab-coverage.js`)

做法(`doc/visual-ab-harness.md` §6.2):在 **`target/classes/web/iceblue11`**
—— `install a` 寫入的**同一個目錄** —— 的 85 個 `.css.dsp` **檔尾**各注入一條唯一規則
`.zzcov-<nnnn>{--zzcov-<nnnn>:1}`,重抓彙整檔,做**精確、區分大小寫的子字串比對**。

腳本**自帶三個控制組**,任一失敗就 exit 1(§6.3):

| 控制 | 做法 | 實測 |
|---|---|---|
| 正向 | `zul/css/norm.css.dsp` 必為 `AGG` | ✅ |
| 負向 | `--holdout <relpath>` 故意不注入某個已知 `AGG` 的檔 | ✅ 翻成 `MISS`,彙整檔**正好少 29 B** |
| 跨頁 | 兩個不同頁面的命中集合必須相同 | ✅ `/button.zul` 與 `/usecase/inventory-table.zul` 一致 |

外加一個**不用信任程式碼的算術核對**:未注入 551581 B → 注入後 553901 B,
差 2320 B;每個標記 29 B ⇒ **2320 / 29 = 80**,與「80 個檔到彙整檔」逐一相符。
還原用 `finally` **與** `process.on('exit')` 兩道,**85/85 sha256 等於注入前快照**。

**為什麼不能用內容比對**:goldenlayout / cropper / signature 的兩份輸出**逐 byte 相同**,
拿內容去彙整檔裡找**分不出是哪一份** ⇒ 只有唯一標記能鑑別。這也是「變異測試」在這裡
不可被更弱的方法取代的原因。

⇒ 結論:**85 個檔裡有 80 個真的到瀏覽器**,這是任何視覺 A/B 的覆蓋率上界。

### 證據 4 —— `install a` 自己會證明磁碟側,而且不信任 marker

- 覆蓋後立刻 `inspectSide()` 從 **byte** 重新推導側邊,不是相信剛才做了什麼:
  回報 `A — verified (N/N byte-identical to baseline, no extra .css.dsp)`,不符就 exit 1。
- **假 marker 說 A、目錄其實是 B → `A — CORRUPT: 51 differ` exit 1**(#34 的第 4 層實測)
  ⇒ marker 沒有在危險方向被過度信任。
- **無損可逆**:`install a` → `install b` 之後全部檔案**逐 byte 回到切換前快照**。
- manifest 三個負向控制:改一個 hash 字元 / 加一列不存在的檔 → `check:baseline` 報
  `CHANGED` + `MISSING` 並 exit 1,`install a` **拒絕安裝**。
- manifest 可**脫離腳本**驗證:`shasum -a 256 -c doc/baseline-manifest.sha256`。

### 「載到暫存檔」這個風險:兩份文件講法不一致,但實務上被繞開了

| 出處 | 說法 |
|---|---|
| `baseline-ab.js` docblock(install 會印) | preview app **可以熱抽換**:`WCS.cache=false` ⇒ `DspExtendlet.service` 每個 request 清一次快取,下一個 request 就生效,只剩瀏覽器快取要 hard-reload。**其他場合相反**:`checkPeriod` 未設 = −1 ⇒ `ExtendletLoader.getLastModified` 回傳常數 ⇒ `ResourceCache` 永不失效,**必須重啟** |
| `visual-ab-harness.md` §6.2 | 同一個常數 mtime 事實,但結論是「**邊跑邊改檔會靜默服務舊內容**」⇒ 探針一次注入全部 85 個、單一 JVM |

兩邊講的是同一件事的不同面(前者靠 `WCS.cache=false` 例外,後者講通則),
但字面上容易讀成矛盾。**實務上這個問題對你是不存在的**:

- `ab-visual.js` 每次 `capture` 都**自己起一個 JVM、截完關掉**(`APP_MAIN =
  zk.example.iceblue.ThemePreviewIceblueApp`,該類別 `:28-32` 也把五個 cache 全關)。
- 它用 `java -cp` 起,**完全不經過 maven**,所以 S20 的
  「`process-resources` 把 B 側重建蓋掉 A 側」順序陷阱在這條路徑上不成立。

⇒ **只要在 `visual:capture` 之前 `install`,快取與順序兩個問題同時消失。**

### 誠實的缺口(這是唯一該補的)

證據 2 的端到端證明是 **2026-08-05** 量的,當時**77 檔、主題叫 `iceblue_css`**。之後發生了:

- ZK 10.4 backfill ⇒ **85 檔**(`baseline/.built-from` 記了這次變更)
- 主題二度改名 `iceblue_css` → **`iceblue11`**(紀錄 #58,2026-08-12)

紀錄 #58 **有**重新證明 wiring(守門探針兩輪 `_zkiju-iceblue11 present, marble refs 0`;
`baseline-ab.js status` 四名一致),但**沒有**重跑 `install a` 的端到端服務證明。
現在輸出目錄**沒有 `.ab-side` marker** ⇒ 樹在 B 側。

**補法只要一條指令的成本**,而且可以順便跟 Q2 的實驗合併(見下)。

---

## Q2:P7 這個時點,分成三個不同的問題,答案不一樣

### (a) 對 P7 **自己的交付物** `zkmax/css/tablet.css.dsp` —— **不準,而且是結構性的**

`doc/visual-ab-harness.md` §6.1 實測(2026-08-07):tablet 是那個唯一
「**被連但不生效**」的檔 —— HTTP 200 / 26145 B,但桌機 UA 下 `<link disabled>`。

⇒ **改 tablet.css.dsp 的任何內容,現行 harness 都會回報 0 差異,而那個 0 是結構上保證的、
毫無資訊量的。** 這正是 S24 警告的誤讀:「把『沒有差異』誤讀成『這個檔沒問題』」。

計畫書自己也寫了(`iceblue-drop-less-execution-plan.md:476`):
「視覺 A/B 價值中等,但 **tablet 需要 mobile UA 的 Playwright 專案**」——
**那個專案還不存在**。

**所以 P7 開工前二選一**:建 mobile UA 的 Playwright 專案,
或明確接受「P7 的 tablet 這一半只由 `check:cssdiff` 在宣告層收工」並寫進閘門紀錄。

### (b) 對 P7 的**另一半**(`@themePalette` 編譯期插值 → runtime override sheet)—— **可用,但有靈敏度下限**

這一半是桌機可見的 CSS,而且是刻意的 **G-delta 對外 API 變更**,視覺 A/B 在這裡有真價值。

但 §5.1 的實測界線要記住:**餘裕依元件出現頻率二分**。第 6 輪注入
(switch 縮圖陰影 alpha `0.16` → `0.165`)只有 2/116 頁、44px / 52px
⇒ **被判為 noise、真漏接**。override sheet 若動到只出現 1–2 個實例的元件,
**不能單獨拿 A/B 收工**。

### (c) **不要拿 `baseline/` 當 P7 驗收的 A 側**

`baseline/` 現在已經落後**三個已核准的 delta**(P4a 728 條、P4b 14 移除/7 新增、
P5 與 P6 是 G-zero)。而 **S41 的 delta-aware 只做在宣告層**
(`check:p4a` 的左側是 `baseline + P4b`,反之亦然)—— **視覺層沒有 delta-aware 基準**。

⇒ 驗 P7 本身,就照計畫書規定的 **build vs build**:改動前截一次、改完重編再截一次。
`baseline/` 在這裡不但沒用,還會把 P4b 的差異混進 P7 的判讀裡。

### 但是 —— 現在**有一個值得跑的 `install a` 實驗**,它不是 P7 的閘門

實測現況:**85 檔對 baseline 有 70 檔 byte 不同**(15 檔逐 byte 相同)。
而 P4a 是純移除死前綴(Chromium 上應該惰性)、P5 / P6 是 G-zero
⇒ **baseline vs 現在的預期答案是「0 頁差異,或一小撮可由 P4b 那 7 條新增標準宣告解釋的頁」**。

這是**整條轉換累積 delta 唯一一次在像素層被檢查**的機會,而且**順便補掉 Q1 的缺口**
(在 85 檔 / `iceblue11` 的現況上重新錨定 #36 的證明)。任何其他結果都是 finding。

```bash
node scripts/baseline-ab.js check                     # 先確認 baseline 完整
node scripts/baseline-ab.js install a && npm run visual:capture -- baseline
node scripts/baseline-ab.js install b && npm run visual:capture -- p6-end
npm run visual:diff -- baseline p6-end
```

**判讀前先看指紋**(§2.3):兩側 theme fingerprint 必須是 **DIFFERENT**,
否則這一輪作廢 —— 指紋相同而差異 0,是 harness 在空轉,不是「沒有差異」。

> ⚠ 這個串法**目前沒有任何文件寫過**,是從兩支腳本的性質推出來的(`ab-visual` 不重建輸出、
> 每次 capture 自己起 JVM),**第一次跑要當成未驗證路徑**:先確認
> `baseline-ab.js status` 在 capture 當下仍回報 A,再相信截圖。

---

## 收尾:現行 harness 的盲區清單(拿它收工前要對照)

| 盲區 | 範圍 | 出處 |
|---|---|---|
| `zkmax/css/tablet.css.dsp` 桌機 UA 下 `disabled` | **P7 的檔** | §6.1 |
| 4 個「從來沒有人要」的死路徑複本(goldenlayout / cropper / signature / tbeditor 的分類資料夾版) | 39367 B | §6.1 |
| `camera` / `barcodescanner` / `video` —— 唯一會渲染它們的頁面正好被 SKIP | 3 檔 | §1 |
| 稀有 / 小面積元件(1–2 實例)的真改動會被判成 noise | 全樹 | §5.1 第 6 輪 |
| 過渡與動畫(截圖前注入 `transition:none / animation:none`) | 全樹 | §1 |
| `:hover` 等未觸發狀態 | 全樹 | §5.1 第 7 輪 |
| Marble 語料用了 IceBlue 沒有的 `z-*` utility,版面塌掉會遮住 border / shadow / spacing | 157/158 頁 | L2.4 警告 |
