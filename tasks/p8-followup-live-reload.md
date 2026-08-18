# P8 後續 —— 補回檔案監看 + 瀏覽器自動刷新(裁示:選項 C)

> 來源:P8 報告〈議題一〉。使用者裁示 **C —— 重編與瀏覽器自動刷新都補**。
> 前情:引擎的 watcher `ignoreNonLessFiles` 只看 `.less`,P3 起逐檔失效,P7 後完全空轉;
> P8 把 readme 改成實話(「沒有檔案監看」)並列為待裁示。現在補回來。

---

## L1 執行摘要

### 要做的事

讓「改一個 `.css`,瀏覽器自己換上新樣式」重新成立,而且**比舊的更好**:
舊的只看 `.less`;新的看 `.css`(主題)、`.zul` / `.css` / `.js` / 圖檔(預覽頁)。

### 開工前實測到的兩件事(都讓成本低於當初報價)

| # | 報價時說 | 實測 | 影響 |
|---|---|---|---|
| 1 | 「要重新引入 socket.io 之類的依賴」 | **不用。** 自動刷新用 SSE(`EventSource`)即可,Node 內建 `http` 就夠 —— 姊妹專案 Marble 的 `live-reload-server.js` 已經是 **0 依賴**實作 | 刷新這一半 **0 新依賴** |
| 2 | 「Linux 的遞迴監看需 Node 20+,readme 承諾 ≥ 10.16,得一起改門檻」 | **不用改。** 那是 `fs.watch({recursive:true})` 的限制。改用 `chokidar`(engines: node ≥ 8.10)就沒有這個問題 | **readme 的 Node 門檻維持 ≥ 10.16**;代價是 1 個 dev 依賴 |

淨成本因此是:**1 個 dev 依賴(chokidar)**,而不是「socket.io + 抬高 Node 門檻」。

### 一個必須自己決定的設計問題:注入時機

自動刷新需要在頁面裡放一支客戶端腳本。這裡有 125 個預覽頁,逐頁加是錯的
(Marble 只有 2 頁所以逐頁加得起)。改用 ZK 的 `UiLifeCycle.afterPageAttached`,
一處註冊、每頁生效。

但**不能無條件注入**:視覺 A/B 與 Playwright 也會起同一個預覽程式,
那時 watcher 沒開,每頁都會多一個連不上的請求。
⇒ 以 library property `org.zkoss.zul.theme.liveReload` 當開關,**預設關閉**。
現有的自動化腳本一個都不用改,行為零變化。

---

## L2 執行步驟

| # | 動作 | 驗證 |
|---|---|---|
| **1** | `npm install --save-dev chokidar` | `package.json` 多一項;`npm ls chokidar` 找得到 |
| **2** | 新增 `scripts/live-reload-server.js` —— 0 依賴 SSE 伺服器,供應 `/zk-live-reload.js` 與 `/events`;預設埠 **50001**(Marble 佔 50000,兩個 repo 要能同時監看);埠被占用時**明確報錯退出**,不去殺別人的行程 | `curl :50001/zk-live-reload.js` 拿得到腳本 |
| **3** | 新增 `scripts/watch-css.js` —— chokidar 監看主題 `.css`(整棵重編,因為有 `@import` 展開)+ 預覽頁 `.zul`/`.css`/`.js`/圖檔(複製到 `target/test-classes`) | 改一個檔會看到重編訊息 |
| **4** | `package.json` 加 `"watch": "node scripts/watch-css.js"` | `npm run watch` 起得來 |
| **5** | 新增 `src/test/java/zk/example/LiveReloadInit.java` —— `UiLifeCycle`,依 property 決定是否在每頁插入 `<script src>` | 屬性沒設 ⇒ 頁面 HTML 沒有那支腳本 |
| **6** | `src/test/resources/metainfo/zk/config.xml` 註冊該 listener | 預覽程式起得來 |
| **7** | `readme.md`:把「**There is no file watcher.**」那段換成新的使用說明 | `check:doc-refs` exit 0 |
| **8** | 端到端實測 | 見下 |
| **9** | 寫回進度文件(裁示紀錄 + 議題一結案) | `check:doc-refs` exit 0 |

### 驗收條件(每一條都要實際跑出來)

1. **主題輸出一個位元組都沒動** —— 本次只碰 `scripts/`、`src/test/`、`readme.md`、`package.json`,
   `src/main/resources/web` 未觸及 ⇒ `check:bytes` 必須仍是 **UNEXPLAINED 0**,`check:gate` exit 0。
2. **監看真的會重編** —— 改一個 `.css`,輸出檔的 mtime 要變、內容要跟著變。
3. **事件真的送得出去** —— 一個 `curl` 掛在 `/events` 上,改檔後要收到 `event: reload-css`。
4. **預設關閉是真的關閉** —— 不設屬性起預覽程式,頁面 HTML 內找不到 `zk-live-reload`。
5. **打開就會注入** —— 設了屬性,頁面 HTML 內找得到。

## L3 驗收證據

**收工 2026-08-18。** 新增 3 個檔、改 4 個檔,`src/main/resources/web` **未觸及**。

| 檔案 | 角色 |
|---|---|
| `scripts/live-reload-server.js`(新) | 0 依賴 SSE 伺服器 + 客戶端腳本 |
| `scripts/watch-css.js`(新) | 輪詢式監看器,兩棵樹 468 檔 |
| `src/test/java/zk/example/LiveReloadInit.java`(新) | `UiLifeCycle`,依屬性注入 |
| `package.json` | 加 `"watch"`;**devDependencies 三項不變** |
| `src/test/resources/metainfo/zk/config.xml` | 註冊第二個 listener |
| `readme.md` | 「沒有檔案監看」→ 新用法 |

### 五條驗收條件,逐條實測

| 條件 | 結果 |
|---|---|
| 1 主題輸出未動 | `check:gate` **exit 0**、`check:bytes` **UNEXPLAINED 0**、`check:build-css` **files differing 0**(23/85 byte-identical,其餘 62 檔仍全落在封閉序列化類別內)、`check:doc-refs` **exit 0**(49 檔 / 184 連結) |
| 2 監看真的會重編 | `touch zul/css/norm.css` → `build-css: compiled 85 file(s)` |
| 3 事件真的送得出去 | 掛在 `/events` 的 `curl` 收到 `event: reload-css`;`touch button.zul` 再收到 `event: reload-page`,且檔案確實出現在 `target/test-classes/web/button.zul` |
| 4 預設關閉是真的關閉 | 不設屬性起預覽程式,`button.zul` 頁面內 `zul.utl.Script` **0**、`50001` **0** |
| 5 打開就會注入 | 設 `-Dorg.zkoss.zul.theme.liveReload=true`,頁面第 29 行 `['zul.utl.Script','dQIO0',{src:'http:\/\/localhost:50001\/zk\-live\-reload.js'},{},[]]`,**1** 處 |

### 過程中修掉的兩個自己的錯

1. **量測用錯樣式,差點誤判「注入失敗」。** 第 4/5 條原本用 `grep zk-live-reload` 量,兩邊都是 0。
   實際上 ZK 是**用 JS 建構元件**、不是輸出 HTML 標籤,URL 在 widget 載荷裡被轉義成
   `zk\-live\-reload` ⇒ 字面比對必然落空。改用 `50001` / `zul.utl.Script` 重量,兩條才成立。
   **「兩邊都是 0」看起來像乾淨的陰性結果,其實是儀器壞掉** —— 第 4 條的「通過」原本是空轉。
2. **第一次的「預設關閉」其實量到了舊行程。** `pkill -f zk.example.ThemePreviewApp` 沒殺掉
   (exec:java 跑在 Maven 的 JVM 裡,cmdline 不含那個字串),第二次啟動因 8080 被占而失敗,
   `curl` 打到的還是前一個沒設屬性的行程。改用 `kill -9 $(lsof -ti :8080)` 後重測才有效。

### 一個實作缺陷,在提交前修掉

第一版把 `startLiveReload()` 呼叫完就直接開始編譯。但 `server.listen` 是非同步的 ⇒
**埠衝突時 `process.exit(1)` 會砍在寫 85 個輸出檔的中途**,可能留下一個被截斷的 `.css.dsp`,
而下一次 `check:bytes` 會以一個完全無關的樣貌報錯。改成 `onReady` 綁定成功才開工;
重測確認第二個 watcher 現在**一個檔都不編**就退出。
