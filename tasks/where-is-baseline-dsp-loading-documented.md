# 視覺 A/B 時 preview app 怎麼載入 `baseline/` 的 DSP —— 文件在哪裡

> 問題(2026-08-13):`doc/iceblue-drop-less-execution-plan.md` 哪裡寫了視覺 A/B 測試時,
> preview app 如何載入 `baseline/` 目錄下的 `.css.dsp`?

## 結論:計畫書沒有寫

對計畫書全文 grep `baseline-ab` / `install a` / `.ab-side` / overlay / 疊上 / file swap
→ **0 命中**。

計畫書唯一談到 harness 的地方是 L2.4 的工作項表(`iceblue-drop-less-execution-plan.md:543`),
而它講的是**相反**的東西:

> 只需讓 preview app 能載入本模板編出的 theme jar;A/B 兩邊是**同一分支的兩次 build**。

也就是說,計畫書層級的 A/B 定義裡**根本沒有 `baseline/`**。

## 機制確實存在,但屬於另一支較早的工具

| 位置 | 內容 |
|---|---|
| `scripts/baseline-ab.js:1-56`(docblock) | **權威描述。** A 側 = **檔案交換,不是重編**:把 `baseline/` 的 77 個 `.css.dsp` 覆蓋到 preview app 本來就在服務的 theme 輸出目錄 `target/classes/web/iceblue11`。之所以合法,是因為 `.css.dsp` 是模板 —— runtime 的 DSP 直譯器才是把它變成瀏覽器 CSS 的東西 —— 所以同一顆 jar、同一個直譯器、同樣 29 個圖檔資產全部固定,**CSS 是唯一的變數**。比「兩個 worktree」乾淨,後者會讓整個 build 都變動。`install b` 重建轉換後的輸出 |
| 同一個 docblock + `doc/iceblue-drop-less-progress-appendix.md` S20 | **順序陷阱:先啟動 app、後交換。** 因為 `mvn … exec:java@preview-app` 會跑 `process-resources`,把 B 側重建到你剛蓋好的目錄上、無聲蓋掉 A 側。交換後**不必重啟**(`ThemePreviewApp.java:15` 的 `WCS.cache=false`,下一個 request 就生效) |
| `doc/iceblue-drop-less-progress.md:115`、`:239` + 附錄閘門紀錄 **#34** | 把側邊切換記成已驗證:**無損可逆**(`install a` → 77/77 逐 byte 等於 `baseline/`;`install b` → 77 檔逐 byte 回到切換前快照)+ **三個負向控制** |

指令:

```bash
node scripts/baseline-ab.js status      # 現在裝的是哪一側、baseline 完不完整
npm run check:baseline                  # 逐檔比對 doc/baseline-manifest.sha256
node scripts/baseline-ab.js install a   # 覆蓋 baseline/ 到 theme 輸出目錄(A 側)
node scripts/baseline-ab.js install b   # 重建轉換後的輸出(B 側)
```

## 值得知道的落差

現在實際在跑的 harness(`scripts/ab-visual.js`,規格 `doc/visual-ab-harness.md`)
**完全沒有用到 `baseline/`**:

- 它用 `java -cp`(或 `withjdk.sh 17 java`)**自己起 JVM**,classpath = Marble 的
  `target/test-classes` + 相依 jar + 本模板的 `target/classes`
  ⇒ **完全不經過 maven 的 `process-resources`**,所以 S20 的順序陷阱在這條路徑上不成立。
- 它對截圖當下 `target/classes/web/iceblue11` 底下的 `.css.dsp` 算指紋(§2.3),
  但那只是「兩側是不是同一批 byte」的空轉偵測,不是「A 側 = baseline」的斷言。
- §3 的用法從頭到尾是 **build vs build**:`build:css` → `capture before-p5` → 改 → 重編 →
  `capture after-p5` → `diff`。

要讓 A 側真的是 `baseline/`,得把兩支串起來:

```bash
node scripts/baseline-ab.js install a && npm run visual:capture -- baseline
node scripts/baseline-ab.js install b && npm run visual:capture -- converted
npm run visual:diff -- baseline converted
```

這個串法技術上成立(`ab-visual` 不重建輸出,`install a` 的覆蓋不會被蓋掉),
但**目前沒有任何文件寫過它** —— 計畫書、`visual-ab-harness.md`、`baseline-ab.js` 的
docblock 三邊都只講自己那一半。
