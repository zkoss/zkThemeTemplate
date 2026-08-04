# 評估:L3 技術附錄是否該拆成獨立檔案

> 對象:`doc/iceblue-drop-less-execution-plan.md`、`doc/iceblue-drop-less-progress.md`
> 日期:2026-08-04 · 結論:**建議拆**,但拆法要挑,理由與代價如下。

---

## 結論(先講)

**建議拆,一份文件配一個附錄檔,共 4 個檔。**

| 檔 | 內容 | 誰會讀 |
|---|---|---|
| `iceblue-drop-less-execution-plan.md` | L1 + L2 + **L3 索引表** | 每一次執行都讀 |
| `iceblue-drop-less-plan-appendix.md` | L3-A ~ L3-H | 有疑問時才讀 |
| `iceblue-drop-less-progress.md` | L1 + L2 + L3 索引表 | 每一次執行都讀 |
| `iceblue-drop-less-progress-appendix.md` | L3-A ~ L3-I | 有疑問時才讀 |

理由不是「感覺很長」,是三個實測到的事實:**L3 佔 83%**、**主檔已經超過 Read 的 2000 行預設上限而被靜默截斷**、**L2→L3 的耦合只有 8 條而且沒有一條是執行的必要輸入**。

---

## 1. 成本:L3 佔多少

| 文件 | L1+L2 | L3 | L3 佔比 |
|---|---|---|---|
| 計畫書 | 371 行 / ~8.0k tok | 1692 行 / ~38.7k tok | **83%** |
| 進度書 | 198 行 / ~5.0k tok | 986 行 / ~26.6k tok | **84%** |
| 合計 | ~13k tok | ~65k tok | — |

> token 估法:逐字元分類,CJK 記 1.0、其餘記 0.28。是量級估計,不是精確 tokenizer 輸出。

`scripts/workflow/iceblue-drop-less.mjs:84-86` 對每個子代理下的指令是:

```
READ THESE FIRST — they are the spec; this prompt is only a task order and may be less precise:
  .../doc/iceblue-drop-less-execution-plan.md
  .../doc/iceblue-drop-less-progress.md
```

代理用 Read 讀整檔 → **每個代理光讀文件就是 ~78k token**。拆完是 **~13k**,約 **6×**。
P3 收工複審那種 74 檔 fan-out 再發生一次(P4b 就會),差額是百萬級的。

## 2. 已經在發生的問題:主檔超過 2000 行

計畫書現在 **2063 行**。Read 工具預設只讀 2000 行 —— 也就是**今天用預設參數讀這個檔,尾巴的 L3-H〈進度記錄制度〉(2005–2063)就已經拿不到了,而且不會報錯**。

這不是「將來會變糟」,是現況。拆完主檔 ~380 行,一次讀得完。

## 3. 耦合度:拆得乾淨嗎

計畫書 L1/L2 內文指向 L3 的引用(扣掉目錄與索引表)只有 **8 條**,而且全部是「細節/論證見 L3-x」的形態:

| 位置 | 引用 | 是執行的必要輸入嗎 |
|---|---|---|
| L1 開場 | `L3-A · B1` | 否(決策背景) |
| L2.0 表頭 | 更正紀錄在 `L3-G` | 否 |
| L2.2 ×3 | 設計要點/坑/最弱機制見 `L3-C` | 否(判準本身已寫在 L2.2) |
| L2.3 前言 | 論證與踩過的坑在 `L3-D` | 否(各階固定欄位已在 L2.3) |
| L2.4 | `L3-A` | 否 |
| L2.3 P8 | 核帳資料來自進度書 `L3-A`〈閘門紀錄〉 | **P8 執行時是** |

進度書 L1/L2 指向自己 L3 的只有 **1 條**。

**關鍵驗證:L2 對執行是自足的。** 例如第 1 層的 5 類封閉清單,判準寫在 L2.2(第 102、150 行)並指名工具 `npm run check:build-css` 逐檔分類回報;L3-C 只是那 5 類的**文字列舉**。代理跑工具就拿得到分類,不需要讀 L3-C 的散文。這正是三層式架構的設計意圖 —— L1/L2 可執行,L3 是「為什麼」。

三層重構已經把這條縫切好了,拆檔只是把縫變成檔案邊界。

## 4. 為什麼 `<details>` 摺疊解決不了這件事

摺疊是**人眼渲染**的手段:它讓瀏覽器少畫幾千行,但 Read / grep / 任何程式讀取都拿到完整內容。之前那個「L3 收在同檔 + `<details>`」的決定處理的是可讀性,和 token 成本是兩件正交的事,它沒有、也不可能省下 token。

## 5. 考慮過但不採用的更細拆法

**「熱/冷再分一層」** —— 把 L3-C(方法學)+ L3-D(各階細節)另立一個「執行參考」檔,其餘(A/B/E/F/G/H)進「史料」檔。

實測:熱 = 6.3k + 14.4k = **20.7k**;冷 = 3.5+4.4+1.0+4.5+1.9+1.2 = **16.5k**。
只省下 43%,卻多一個檔、多一個「這節算熱還冷」的判斷題,而且 L3-D 是**逐階**的 —— 跑 P6 的代理只需要 P6 那 757 token,把整個 L3-D 留在熱區等於還是讀 14k。**投入產出不划算,不做。**

真要壓 L3-D,正確作法是代理用 grep 定位再帶 offset 讀,不是再切檔。

## 6. 規範相容性

`plan-spec` 的 L3 條文是:

> 所有微觀細節…必須**全部收納於此處**或放在 `<details>` 摺疊區塊中。

約束的是**分層**(細節不准散進 L1/L2),不是**檔案數**。附錄檔仍然是「L3」這一層,拆檔不違反規範。

---

## 要付的代價(4 項,都不大)

1. **錨點連結跨檔** —— 索引表與目錄的 `](#l3-c-…)` 要改成 `](iceblue-drop-less-plan-appendix.md#l3-c-…)`。GitHub 與 VS Code 都支援跨檔錨點。驗收腳本 `check-toc.js` 目前只解析同檔 `](#slug)`,要加跨檔解析(約 15 行)。**這是唯一需要動工具的地方。**

2. **workflow 提示要更新** —— `scripts/workflow/iceblue-drop-less.mjs:84-86` 的 READ THESE FIRST 維持指向兩個主檔,另加一行「附錄按需求讀,索引表的〈何時要看〉欄告訴你什麼時候需要」。這一步做了才拿得到 token 節省;不做的話代理照樣可能兩個檔都讀。

3. **附錄檔要有防腐宣告** —— 每個附錄檔開頭寫「本檔只有史料與論證,**不定義任何規範**,規範在 `…-execution-plan.md` L2」,對應進度書既有的「本文件只記狀態,不定義規則」。沒有這一句,附錄遲早長出第二套規範。

4. **外部引用** —— `scripts/gen-mixin-table.js`(3 處)、`doc/migration/mixin-to-css.md`(10 處)用 `§P4` / `§P8` 指向計畫書。這些指的是**規範定義**,而規範定義留在 L2.3,**檔名與落點都不變 → 不需要改**。若日後希望它們落在 L3-D 的細節,改 `gen-mixin-table.js` 一行再重新產生即可。

`scripts/build-css.js`、`scripts/gen-var-table.js`、`scripts/cssdiff.js`、`doc/iceblue-remove-zkless-engine.md`、`doc/css-preprocessor-industry-direction.md` 引用的都是檔名,主檔名不變 → 全部不受影響。

---

## 執行步驟(若採納)

1. 快照兩份原檔到 scratchpad(零遺失比對基準)→ verify:`md5` 已存檔
2. 切出 4 個檔,L3 內容**原文搬移不改字**;主檔保留 L3 索引表當地圖 → verify:`cat 主檔 附錄 | md5` 對得上原檔的內容集合
3. 索引表/目錄連結改跨檔;`check-toc.js` 加跨檔解析 → verify:`68 links checked, 0 broken` 維持
4. 附錄檔加防腐宣告;workflow 提示加一行 → verify:`grep -c 'READ THESE FIRST' `
5. 外部引用重掃 → verify:`grep -rn "iceblue-drop-less"` 的引用者全部仍解析得到
6. 只 stage 這幾個檔 → verify:`git diff --cached --name-only` 沒有多餘項(**絕不 `git add -A`**)
