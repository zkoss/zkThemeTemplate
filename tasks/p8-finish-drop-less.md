# P8 —— 收尾:刪 LESS partial、移除 zkless-engine、寫遷移指南

> 執行計畫。規範見 [計畫書 §P8](../doc/iceblue-drop-less-execution-plan.md#p8--收尾)
> 與 [附錄 L3-D §P8](../doc/iceblue-drop-less-plan-appendix.md#p8--收尾)。
> 狀態一律寫回 [進度文件](../doc/iceblue-drop-less-progress.md)。

---

## L1 執行摘要

### 這一階要做的事

**把 LESS 從樹上、從依賴裡、從文件裡全部移除,並交付遷移指南。**
輸出端**一條宣告都不能動** —— 全樹差異必須恰好等於
`P4a + P4b + D1/D2 + D4` 四段已核准的 delta(**C21**),不多不少。

### 開工前實測到的三件事(都與計畫書寫的不同)

| # | 計畫書怎麼寫 | 實測 | 影響 |
|---|---|---|---|
| 1 | 「`build-css.js` 長出 `.less` 分支接手引擎的工作」 | **不需要。** P7 之後 entry `.less` = **0**,`zklessc` 本次建置 `compiled 0 file(s)`。寫了那個分支就是**永遠沒有輸入的程式碼路徑** —— 正是計畫書 L2.0〈儀器證明〉在防的空轉 | 本階**不寫** `.less` 分支;三個地雷(header / 守衛 / `~./`)一併作廢。記為 **C26** |
| 2 | 「重定 `EXPECTED` + 重跑產生器 + 更新路徑是一次到位的」(S14 + S37) | **重跑會讓遷移表變差。** 實測 `--check`:資料 URI caveat 3→**0**、編譯期函式 caveat 1→**0**、list-fn 4→**0**、`import`-path 2→**1**、死名 42→**863**。原因是**消費站點在 `.less` 裡,而那些檔已經是 `.css`** | **不重跑,凍結兩張表**;兩支 `check:*` 依「儀器過期」處理 —— **退場**而不是重新校準。缺的 20 列以附錄補。記為 **C27** |
| 3 | 引擎的貢獻「其餘全是建置流程(⋯watch + live reload)」 | 引擎的 watcher `ignoreNonLessFiles` **只看 `.less`** ⇒ 每轉一個檔就少看一個檔,**P7 之後 `npm run zklessc-dev` 監看不到任何東西**。readme 第 2 行仍在對外宣傳這個能力 | 這**不是** P8 造成的回歸,是 P3–P7 已經造成、P8 才揭出。`--watch` 不在計畫書的接手清單內 ⇒ **本階不實作**,readme 改為實話,列入待裁示 |

### 凍結遷移表的理由(C27 的論證)

**遷移表描述的是「客戶要遷移離開的那棵樹」,不是轉換後的樹。**
那棵樹在本 repo 已經不存在,所以拿現在的樹重跑是**量錯對象** ——
它會刪掉表裡最有價值的東西(CAVEAT-2 / CAVEAT-3 的消費站點證據),
而那些證據**恢復不了**:`extract()` 站點在編譯期就被求值掉了。

實測缺口只有一處,而且**恰好可推導**:

| | 值 |
|---|---|
| committed 表的列數 | **846** = zul 844 + zkmax 2 |
| 現在樹上的 `_zkvariables.less` 宣告 | **864** |
| 表裡有、樹上沒有 | **2** —— `@iphone` / `@android`(D4 刪掉 `zkmax/less/`;表裡已標為死值) |
| 樹上有、表裡沒有 | **20** —— `@severity{Info,Success,Warning,Danger,Secondary}{Color,Bg,Border,Text}` |

那 20 列全部是 ZK 10.4 補齊(S26)帶進來的**乾淨 1:1** 改名,
所以**用手寫附錄補**在遷移指南裡,不動被產生的檔案。

---

## L2 執行步驟

每一步都要停下來看驗證結果;任何一步紅燈就停,不往下走。

| # | 動作 | 驗證 |
|---|---|---|
| **1** | 從 `_zkvariables.less` + `tokens/_default.css` 機械抽出那 20 列(名稱 / token / 值),存成遷移指南的附錄素材 | 20 列、每列都有 token 且 token 在 `_default.css` 裡宣告過 |
| **2** | 刪 `zul/less/` 整棵(`_header.less`、`_zkmixins.less`、`_zkvariables.less`、`colors/_iceblue.less`)| `find src -name '*.less'` = **0**;`check:gate` **exit 0**;差異仍是 48 檔 / 1104 筆 |
| **3** | 兩支過期儀器退場:`check:var-table` / `check:mixin-table` 從 `package.json` 移除;兩支產生器保留(fork 工具),但來源不存在時要**明確說出來**而不是丟 stack | 產生器在本樹 exit 2 且訊息指向 `--src`;`gen:*` 仍列在 `package.json` |
| **4** | 移除 `zkless-engine`:`pom.xml` 的 `compile-less` execution、`package.json` 的 `zklessc` / `zklessc-dev` / devDependency / `overrides`;`less` 改為直接 devDependency(`less2css.js` 要用);`build:tree` = `npm run build:css` | `npm ls zkless-engine` 找不到;`check:gate` exit 0 |
| **5** | 三支腳本的 zklessc 呼叫:`check-build-css.js` 刪掉 LESS 重建那兩步;`baseline.js` / `baseline-ab.js` 改用 `npx --yes zkless-engine@1.1.13`(歷史基準要能在**沒有依賴**時重建) | `rm -rf node_modules && npm install` 之後 `check:gate` / `check:bytes` / `check:build-css` 全 exit 0 |
| **6** | `check-less-conventions.js` 從 `check:gate` / `check:cssdiff` 拿掉(**0 個 `.less` = 沒有量測對象**,留著就是免費的綠燈);腳本本身保留為 fork 工具,並在無 `.less` 時說明自己為何無事可做 | `check:gate` 少一步仍 exit 0;腳本單跑會說出「本樹沒有 LESS」 |
| **7** | `baseline/` 移回 `.gitignore`(**S47 退場**);`doc/baseline-manifest.sha256` 繼續釘位元組 | `git ls-files baseline/` = 0;`check:baseline` 仍 exit 0;`check:doc-refs` exit 0 |
| **8** | `readme.md` 改寫:LESS 前提、`@themePalette` 教學、`_header.less` import 教學、`zklessc-dev`、第 2 行的 watch/live-reload 宣傳 | 全檔 `grep -i less` 只剩「歷史/逃生門」語境 |
| **9** | 寫 `doc/migration/less-to-css.md`:改名表入口 + 20 列附錄 + CAVEAT-1/2/3 + 前綴政策 + density + palette + **逃生門** + 第一期 won't-do 清單(A1/A2/A3、B1–B3、C1/C2)+ fork 工具箱 | `check:doc-refs` exit 0;won't-do 每一項都找得到 |
| **10** | 最終核帳:`cssdiff` 原始差異 = `P4a + P4b + D1/D2 + D4`,逐段對帳 | 48 檔 / 1104 筆;745 移除 = 731 + 14;359 新增 = 7 + 350 + 2;D4 618 新增在 `tablet.css.dsp` |
| **11** | 寫回進度文件(閘門紀錄 #63、P8 → DONE、M5 → DONE)+ 計畫書 Change Log(C26 / C27) | `check:doc-refs` exit 0 |

## L3 驗收證據

(執行時填;閘門紀錄以附加方式寫進進度附錄 L3-A。)
