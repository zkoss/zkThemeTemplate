# 計畫:補齊 8 個元件(議題 A)+ artifact 版號跟上(議題 B)

裁示日期 2026-08-05。議題 A 取**選項 B(本輪就補到 85)**,並指定來源為 `zk` / `zkcml` 的 LESS
原始檔;議題 B 取**選項 A(跟上 ZK 版號)**。

## 0. 探勘結論(全部本輪實測,非沿用)

| 事實 | 證據 |
|---|---|
| `zk` 與 `zkcml` 兩棵樹都在 `10.4` 分支 | `git branch --show-current` |
| 7 個元件 LESS 在 `zk/zul/src/main/resources/web/js/zul/wgt/less/` | `find`;`bin/main/` 是 gradle 產物,不用 |
| `daterangebox.less` 在 `zkcml/zkmax/src/main/resources/web/js/zkmax/db/less/` | 同上;主題樹**沒有** `js/zkmax/db/` 這層,需新建 |
| 缺口確實是 **8**,不是 log 講的 8 | 用來源樹逐檔對(ZK 80 entry vs 主題 76,均漏算 `zul/font/font-awesome` 這個不在 `less/` 底下的 entry ⇒ 81 vs 77)。兩條獨立方法同一答案 |
| 8 個檔只 `@import "~./zul/less/_header.less"`,無其他 partial 依賴 | `grep -oE '@import[^;]*'` |
| `_header.less` 與 63 個 partial 仍在主題樹 ⇒ 匯入的 LESS **可編譯** | `ls src/main/resources/web/zul/less/` |
| 但 8 個檔引用 20 個 `@severity*` 變數,主題**沒有** | 逐變數 grep;`@cp-*` 是檔內自定義,不算缺 |
| `@severity*` 在 10.4 是純 `var(--zk-severity-*)` 直通,值在 `profiles/_default.less` | `_zkvariables.less:567-586`、`profiles/_default.less:543-562` |
| **ZK 10.4 與主題之間全部的 `--zk-*` 差異就是這 20 個** | `grep -cE '^\s*--zk-'`:ZK 862、主題 842 |
| `norm.less` 尚未轉換(P5 未做)⇒ token 走 LESS lane 進 `norm.css.dsp` | `ls`;P5 待辦 |
| `zul/font/font-awesome` 兩邊都有,不是第 9 個缺口 | ZK 有 `.less`、主題有已轉好的 `.css` |
| 順帶浮出 4 個「主題有、ZK 沒有」= 舊路徑死複本 | tbeditor / goldenlayout / cropper / signature —— 已記於 L2.5,**不在本輪範圍** |

## 1. 這件事為什麼是三層,不是「新增 8 個檔」

| 層 | 改什麼 | 對輸出的影響 |
|---|---|---|
| L-a token 值 | `zul/less/profiles/_default.less` 增 20 個 `--zk-severity-*` | **動到既有檔** `norm.css.dsp`,+20 declaration |
| L-b LESS 直通 | `zul/less/_zkvariables.less` 增 20 個 `@severity*` | 無 —— partial 自己不產出 |
| L-c 元件 | 8 個 entry LESS | 輸出 **77 → 85** |

只做 L-c 會編譯失敗;只做 L-b + L-c 會編譯成功但 badge/chip 等元件的顏色解析為空 —— 那是
「悄悄把範圍縮小」,不做。

## 2. ⚠ 閘門在這裡有一個會誤判的性質(必須先寫下來)

既有 74 個檔的 G-zero 證明力來自:**baseline 來自 master 的 LESS 輸出、候選來自轉換後的 CSS**,
兩者不同源,所以「逐檔 declaration 相同」是有內容的陳述。

新匯入的 LESS 不是這樣。匯入當下來源仍是 LESS ⇒ baseline 與候選由**同一次編譯**產生 ⇒
`files differing: 0` **因構造成立,證明不了任何事**。

因此:
- **步 A2 / A1 的閘門通過,不得當成正確性證據**,只能當成「基準已建立、且沒有波及其他檔」。
- 真正的證明落在**步 A3**(把 8 個 LESS 轉成 CSS):那時 baseline 是 LESS 導出的、候選是 CSS
  導出的,兩者不同源,`differing: 0` 才恢復意義。
- L-a 那 20 行的實際檢查手段不是 cssdiff,而是「`norm.css.dsp` 的 diff 恰好是預期的 20 條、
  其餘 76 檔位元組不動」。

## 3. 步驟(每步一個 commit,每步都有可驗收的檢查)

### 步 B —— artifact 版號跟上(先做,獨立且最小)

`10.2.1-jakarta-Eval` → `10.4.0-jakarta-Eval`,4 處:
`pom.xml` 的 `<version>`、`metainfo/zk/config.xml` 的 `<version-uid>`、
`metainfo/zk/lang-addon.xml` 的 `<version-uid>`、`Version.java` 的 `UID`。

不取 `10.4.0-jakarta.FL.20260713-Eval`:FL 日期描述的是**依賴**,不是本 artifact;且 FL 是移動
標的。發佈時應改為對應的正式 ZK 版號。

→ 驗:`xmllint --noout` 兩個 XML;四處字串一致;`check:cssdiff` **不動**(77 / 14323 / 0);
`git diff --stat -- src/main/resources/web` 為空。

### 步 A1 —— token 層(L-a + L-b)

1. `profiles/_default.less` 增 20 個 `--zk-severity-*`(值逐字取自 ZK 10.4 `543-562`)。
2. `_zkvariables.less` 增 20 個 `@severity*: var(--zk-severity-*)`(逐字取自 ZK 10.4 `567-586`)。
3. 順手確認 `_compact.less` 在 10.4 是否也有 severity(預期沒有,compact 只管尺寸)。
4. 建置 → `norm.css.dsp` 應**恰好** +20 declaration。
5. 更新 `baseline/zul/css/norm.css.dsp`(**唯一一個被改的既有 baseline 檔**)。

→ 驗:`check:cssdiff` 77 檔 / **14343** / 0;`git diff` 讀 `norm.css.dsp` 的 diff 確認就是那 20 條;
`check:bytes` 顯示只有 norm 一個檔名。

### 步 A2 —— 匯入 8 個元件 LESS

1. 逐字複製(不改一個 byte):7 檔 → `src/main/resources/web/js/zul/wgt/less/`、
   1 檔 → `src/main/resources/web/js/zkmax/db/less/`(新建目錄)。
2. 建置 → 輸出 **85**。
3. `baseline/` **只新增這 8 個** `.css.dsp`,既有 77 檔逐一 hash 比對 manifest 確認未被動到。
4. 重生 `doc/baseline-manifest.sha256`(78 → 86 行 hash),更新 `baseline/.built-from` 出處說明:
   基準自此是「master 的輸出 **+** 從 ZK 10.4 自身 LESS 編出的 8 檔 backfill」。

→ 驗:`shasum -a 256 -c` 全綠;既有 77 檔的 hash 與前一版 manifest **逐字相同**;
`check:cssdiff` 85 檔 / 14343+N / 0(**依 §2,此處不作為正確性證據**)。

### 步 A3 —— 把 8 個 LESS 轉成 CSS(P3 紀律,一次一個檔)

每個檔:轉換 → 建置 → 閘門 85 / 14343+N / 0 → 讀 diff。這一步才是真正的證明。
`js/zul/wgt/less/` 與 `js/zkmax/db/less/` 轉完後應為空(交給 L2.4 的來源清理)。

### 步 A4 —— 文件

L3-A 閘門紀錄逐步附加(#39 起);S-note 記 §2 那個「因構造成立」的性質與 862−842=20 的收斂;
L1/L2 的輸出檔數 77 → 85、declaration 14323 → 新值;S25 標記為已處理。

### 步 A5 —— 第 4 層獨立驗證

依常規:P3 之後每步收工都要獨立 agent 覆核。重點攻擊面在 §2 的誤判性質、20 這個數字的完整性、
以及既有 77 檔 baseline 是否真的沒被動到。

## 4. 刻意不做

- **不碰那 4 個舊路徑死複本** —— 屬 L2.5 產品面問題,與本輪無關。
- **不補 10.4 的其他差異** —— 已實測差異就是 20 個 severity token,沒有其他;若日後發現,另開。
- **不動既有 77 檔的 baseline**(norm 除外,且那是 L-a 的必然結果並逐條檢查)。
