# 工作文件的版控政策

> **裁示 2026-08-12(選項 A:按性質分流)。** 適用於 `tasks/` 與 `doc/` 底下的工作文件。
> 規則本身只有兩條,底下其餘篇幅是「為什麼」與「怎麼檢查」。

## 規則

1. **有人用 markdown 連結指向它,或它記著裁示／量測口徑／驗收條件 → 進版控。**
   被引用本身就是證據:引用方依賴它裝的東西。
2. **只用一次的隨手筆記 → 不要放 `tasks/`,放 session 的暫存目錄。**
   放進 `tasks/` 又不追蹤,是三種狀態裡最差的一種 —— 它看起來像專案資產,實際上隨時會消失。

**判準是連結,不是提及。** `[文字](../tasks/foo.md)` 是連結,必須解析得到已追蹤的檔;
散文裡的 `` `tasks/foo.md` `` 是引註,不受規範 —— 它可能指的是另一個 worktree 的檔,
或一段描述歷史的敘述。本樹 4 個「指向未追蹤檔」的引用**全部**屬於後者,一個真缺陷都沒有,
所以這條分界的誤報率實測是 0。

## 為什麼

「AI 讀不讀得到」不是理由 —— 追蹤與否都是從磁碟讀。**真正有差的是這四件事**:

| | |
|---|---|
| **出處與時效** | `git log` / `git show` 說得出某個結論是哪天、為什麼寫下的。未追蹤的檔是一份**沒有日期的斷言**,無從判斷它是現行裁示還是已被推翻的舊說法 —— 而本專案光是 2026-08 就更正過 `274/695`、`189`、`48` 這幾個數字 |
| **存活性** | 未追蹤的檔正是 `git clean -fd`、worktree 移除、誤下 checkout 會**無聲清掉**的東西 |
| **可追溯** | `git log -S` 是本專案追決策的標準手法(`iceblue_css` → `iceblue11` 改名就是這樣查的),而它**只看得到進版控的內容** |
| **跨 worktree** | 本 repo 有兩個工作樹,未追蹤的檔只存在其中一邊 |

**「做完就刪」不是不追蹤的理由,而是追蹤的理由。** `git rm` 之後檔案一樣從工作目錄消失,
但半年後有人問「當初為什麼這樣定」時查得回來;不進版控然後 `rm`,是真的沒了。

**「歷史會很吵」的解法不是不追蹤,是不要每次編輯都 commit** —— 在**裁示點**才 commit。
L-4 那一輪就是這樣:三顆 commit 對應三件已定案的事,中間的來回修改一次都沒進歷史。

## 檢查

```bash
npm run check:doc-refs             # 已追蹤的 .md 不得連結到未追蹤的目標
npm run check:doc-refs -- --selftest   # 8 個負向控制(記憶體內合成,不碰真檔)
```

**刻意不併進 `check:gate`。** gate 的數字是主題輸出的驗收,文件衛生混進去會讓
「閘門紅了」失去單一含義。

> 規範寫了工具做不到的事,實務上就是那條規範被無聲忽略
> ——這是[執行計畫 L2.5](iceblue-drop-less-execution-plan.md#l25-執行機制)已經記過的教訓,
> 所以這份政策從第一天就帶著檢查,而不是只有散文。

## 實測現況(2026-08-12)

| worktree | 分支 | `.md` | 連結 | 違規 |
|---|---|---|---|---|
| `zkThemeTemplate-iceblue` | `iceblue` | 36 | 128 | **0** |
| `zkThemeTemplate` | `new_theme` | 233 | 122 | **20** |

Marble 側的 20 條分成三類,**修法不同,不可一起處理**:

| 類 | 數量 | 內容 |
|---|---|---|
| **A 真的沒進版控** | 4 | `CLAUDE.md` → `doc/preview-deployment.md`、`doc/design-review-feedback.md`;`doc/spec/new-component-checklist.md` → `doc/spec/auto-contrast-text.md`、`tasks/harness-followups.md`。**這一類才是本政策要治的** |
| **B 相對路徑深度寫錯** | 9 | `doc/spec/data-dense-mode.md`(5)與 `doc/spec/reset-scoping.md`(4)從 `doc/spec/` 用 `../src/…`,應為 `../../src/…` |
| **C 目標已被刪除** | 7 | 檔案在 `21ec1db6`(dom structure 遷進 zk-component-rules)與 `9ffbe179`(delete some unused plans)被刪,**但引用方沒跟著更新** |

**C 類裡最嚴重的一條**:`CLAUDE.md` 是每個 session 自動載入的檔,它的
〈Documentation Index〉與〈Quick Start for New Session〉指向
`doc/component-dom-structures.md`、`doc/usecase-driven-iteration.md`、
`doc/preview-page-descriptions.md` —— **三個都已經不存在**。
也就是說每個新 session 一開場就被指去讀三份不在那裡的文件。
這一條說明了為什麼檢查要涵蓋「刪除後沒更新引用」,而不只是「有沒有進版控」。

> Marble 側的修正**必須在 Marble 的 session 做**(本 worktree 不編輯另一個工作樹),
> 且 B / C 兩類與本政策無關 —— 它們是連結腐化,順手一起修即可,不要混進同一顆 commit。
