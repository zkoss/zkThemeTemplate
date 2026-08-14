# iceblue 與 master 重新對齊 —— 決策紀錄

**日期**:2026-08-14
**問題**:`iceblue` 分支 fork 自 `a89d44e0`,`origin/master` 已前進 6 個 commit 到 `5af06b1a`。
要怎麼把這 6 個 commit 追回來?

**結論**:**兩個提案都不要做。** 改用 `git merge -s ours` 只記錄 ancestry,不動樹。
理由:這 6 個 commit 的內容,`iceblue` **已經全部有了或全部已列管**,沒有任何一項是新資訊。

> **裁示(2026-08-14):先不動,本輪不執行 `-s ours`。**
> 本檔的稽核與建議**維持有效**,只是不現在做 —— 上面第 2 節逐項證明的「沒有可採用的內容」
> 是對 `a89d44e0..5af06b1a` 這 6 個 commit 說的,**只要 `origin/master` 再前進就要重新稽核**。
> **不做的代價**(寫下來,免得日後以為是遺漏):`git branch -vv` 會持續顯示分歧、
> 每次要判斷與 upstream 的關係都得重跑一次這輪稽核、
> 而且 `git merge origin/master` 日後仍會是**髒的**(6 個 conflict + 靜默加回 15 個 `.less`)。
> **本裁示與 L-4 無關,兩者獨立**;要改主意隨時可做,照第 5 節的指令即可。

---

## 1. 先釐清一件事:落後的是 local `master`,不是 `iceblue`

```
git merge-base HEAD master  →  a89d44e0   (= local master 的 tip)
git log HEAD..master        →  (空)
```

local `master` 已經**完全包含**在 `iceblue` 裡。`git branch -vv` 顯示的
`master ... [origin/master: behind 6]` 指的是 **local master 落後 origin/master**。

所以真正的差距是 `a89d44e0..origin/master` 這 6 個 commit,而 `iceblue` 在其上
另有 **168** 個 commit。

---

## 2. 這 6 個 commit 是什麼

淨差異 16 個檔案、+1286/−10 行,**全部是 `.less`**:

| upstream 變更 | iceblue 現況 |
|---|---|
| 20 個 `--zk-severity-*` token(`_zkvariables` / `_default` / `_compact`) | **已有** —— `ab994ed3` 從 ZK 10.4 backfill,hex 逐字相同;`_zkvariables.less:567+` 也已有 `@severity*` |
| 8 個新元件(avatar / avatargroup / badge / breadcrumb / carousel / chip / confirmpopup / daterangebox) | **已有** —— `0fede678` backfill 後由 P3 轉成 `.css` |
| `grid.less` +206、`calendar.less` +26 | **已有** —— `9e8f9648 fix(theme): sync grid/calendar/font-awesome with ZK 11.0.0` |
| `_zkcssvariables.less` 補 `@import "colors/_@{themePalette}_css"` + 新增 `colors/_iceblue_css.less` | **沒有,但已列管** —— 即 S29,`668c3e70` 已 rule 進 P7(改成 runtime override sheet) |
| `font/_core.less` 移除 `.fas` / `.fass` / `.far` / `.fab` 裸別名 | **沒有,但已列管** —— `tasks/zk11-jar-baseline-visual-ab.md:255` 明寫「**落後**:upstream 把這些裸別名移除了」;`doc/baseline-manifest.sha256:31` 亦有註記 |

> 注意 `5af06b1a` 與 `206058cd` 互為反向 commit(一個 +300、一個 −300),
> 所以 6 個 commit 的**淨**內容比看起來少。

**16 個檔案中有 15 個在 `iceblue` 上已被刪除**(轉成 `.css`),只有 `_zkvariables.less` 還在。

---

## 3. 為什麼提案 1(直接 rebase)不划算

實測 dry-run(`git merge-tree --write-tree origin/master HEAD`,未動工作區):

- **6 個 conflict**,型別全部相同:`CONFLICT (modify/delete) — deleted in HEAD and modified in origin/master`
- 更麻煩的是**沒有 conflict 的那 9 個**:upstream 新增的檔案在 merge base 不存在,
  git 會**靜默把 15 個 `.less` 全部加回來**(已列出實測清單)。

這對本分支不是外觀問題:`build:tree` 仍會跑 `zklessc`(還有 58 個 `.less` 未轉換),
被加回來的 `.less` 會與已轉換的 `.css` **產出同一個 `.css.dsp`**,互相覆蓋——
正是 `check:build-css` / `check:bytes` / `cssdiff` 這組 gate 存在的理由。

而 rebase 是把 168 個 commit 重播到一個「帶著 15 個不要的 `.less`」的新 base 上,
凡是碰到這些路徑的 commit 都會再撞一次,而且 `baseline/` 是逐 byte 比對的凍結參考,
重播後還得重新 freeze。**代價極高,換到的實質內容是 0。**

## 4. 為什麼提案 2(先 squash 再 rebase)更糟

被追蹤的文件**直接引用了本分支的 commit SHA**,實測可解析為真 commit 的至少有:

```
0cc3334b  feat(density): D2 — org.zkoss.zul.theme.density …
63fb1d4e  feat(density): D1 — compact as a 350-token runtime …
92fff6d4  feat(density): D3 — IceblueDensity, runtime switch …
eab6fe60  feat(p4b): resolve the 14 vendor-prefix orphans …
fa7a51e4  feat(theme): rename iceblue -> iceblue_css …
a89d44e0  sync changes in 1 file(s)
```

squash 會把這些 SHA 全部改寫,**靜默切斷 doc↔commit 的驗證軌跡**——
而這條軌跡(L2/L3/L4 逐層複核)正是這個分支的主要價值。
本分支還有 `check:doc-refs` 與 `doc/task-doc-tracking-policy.md` 在管這件事。

而且 squash **並不會減少 conflict 類別**:conflict 來自檔案層級的 delete-vs-modify,
跟 commit 顆粒度無關。

---

## 5. 建議做法

```bash
cd /Users/hawk/Documents/workspace/zkThemeTemplate-iceblue

# 0) 保險絲(這個分支已有 backup/ 的習慣)
git branch backup/pre-master-sync-2026-08-14 iceblue

# 1) 把 local master 追平(它只是落後,沒有分岔)
git fetch origin
git branch -f master origin/master

# 2) 只記錄 ancestry,不採用 upstream 的樹
git merge -s ours origin/master
#    → commit message 要寫清楚「已逐項稽核,內容已存在或已列管」,見下方範本

# 3) 證明沒動到任何東西
git diff HEAD~1 HEAD --stat     # 期望:空
npm run check:gate
```

`-s ours` 之後 `origin/master` 成為 ancestor,**日後 `git merge origin/master` 就會是乾淨的**,
不必每次都重打這一輪稽核。

### 為什麼 `-s ours` 是誠實的

它宣稱「upstream 的樹沒有可採用的內容」。上面第 2 節逐項證明了這點:
3 項已存在(逐字相同),2 項不存在但**已在本分支的文件裡列管為已知缺口**,
且都已排入既有的 P6/P7 工作,不是被這次 merge 吃掉的。

若走一般 `git merge` 再手動刪掉 15 個 `.less`,最終樹**與 `-s ours` 完全相同**
(那 2 項真差異所在的檔案在本分支已刪除,resolve 時一樣是丟棄)——
`-s ours` 只是省掉 15 個檔案的來回churn 與 6 次 conflict。

### commit message 範本

```
chore(sync): record origin/master as merged — audited, nothing to take

The 6 upstream commits (a89d44e0..5af06b1a) are all .less. Audited one
by one against this branch:

  already present (verbatim):
    - 20 --zk-severity-* tokens        <- ab994ed3 (backfilled from ZK 10.4)
    - 8 new components as .css         <- 0fede678 + P3 conversions
    - grid.less / calendar.less sync   <- 9e8f9648 (ZK 11.0.0)

  absent but already tracked as known gaps:
    - @themePalette import + colors/_iceblue_css.less
        = S29, ruled into P7 by 668c3e70
    - font/_core.less dropping .fas/.fass/.far/.fab
        = tasks/zk11-jar-baseline-visual-ab.md:255,
          doc/baseline-manifest.sha256:31

Taking upstream's tree would reintroduce 15 .less files this branch
deleted; zklessc would then emit .css.dsp colliding with the converted
.css. Hence -s ours: ancestry only, tree unchanged.
```

---

## 6. `-s ours` 到底做了什麼(實測,已在拋棄式分支上驗證後刪除)

**它不是「讓 Git 判定我這邊是對的」。Git 完全不做任何判定,
它連對方的內容都不會去看。**

`-s ours` 的定義只有一句:
**產生一個 merge commit,其 tree 完全等於「我方」的 tree,並把對方記成第二個 parent。**

實測(`tmp/demo-ours`,merge 後已刪除):

```
1. 兩個 parent
   commit  4b5383cc
   parents 19d45549 5af06b1a          <- iceblue tip + origin/master tip

2. tree 逐 byte 相同 —— upstream 一個 byte 都沒進來
   tree of HEAD^1 : b1bb584f43ecd163b2a22acc63dced88981db35a
   tree of HEAD   : b1bb584f43ecd163b2a22acc63dced88981db35a
   git diff HEAD^1 HEAD --stat  ->  0 行

3. merge 後維護者可以驗證的事實
   git merge-base --is-ancestor origin/master HEAD  ->  YES  (merge 前是 NO)
   git log --oneline HEAD..origin/master            ->  0 commits
   git branch --contains 5af06b1a                   ->  列出本分支
```

### parent 關係:5af06b1a 會變成「第二個 parent」,但 fork 點不會移動

嚴格講,**branch 沒有 parent**——branch 只是一個指標。
有 parent 的是「`iceblue` 指到的那個 commit」。

merge 之後,`iceblue` 指到新的 merge commit,它有**兩個** parent:

```
HEAD^1  19d45549   <- 原本的 iceblue tip           (第一個 parent)
HEAD^2  5af06b1a   <- origin/master tip            (第二個 parent)  ★ 你問的這個
```

所以 5af06b1a **會**成為直接 parent,但**不是唯一的、也不是第一個**。

而 **fork 點完全不動**。168 個既有 commit 的 SHA 與 parent 全部原封不動,
沒有任何改寫。graph 長這樣:

```
                    ┌── (168 個 iceblue commits) ── 19d45549 ──┐
                    │                                           │
a89d44e0 ───────────┤                                           ├── merge commit  <- iceblue
(原始 fork 點)       │                                           │
                    └── (6 個 master commits) ──── 5af06b1a ────┘
```

**這正是這個做法誠實的地方**:graph 說的是
「在 a89d44e0 分出去,後來把 master 到 5af06b1a 為止都交代掉了」——這是事實。

反之 rebase 會**改寫**成「這 168 個 commit 是在 5af06b1a 之上寫的」,
那是假的(它們寫的時候 5af06b1a 還不存在),而且會把所有 SHA 換掉
(見 §4:被追蹤文件正在引用這些 SHA)。

### 陷阱:`-X ours` 不是 `-s ours`

只差一個字母,行為完全不同,**在本案會造成實害**:

| | 做什麼 | 本案結果 tree | 加回幾個 `.less` |
|---|---|---|---|
| `-s ours` | 策略。直接採用我方整棵 tree,不看對方 | `b1bb584f` | **0** |
| `-X ours` | 選項。**照常做真正的 merge**,只在「有衝突的 hunk」偏向我方 | `11855e84` | **15** |

`-X ours` 得到的 tree(`11855e84`)**與普通 `git merge` 完全相同**——
因為那 15 個檔案是「乾淨新增」,根本不構成衝突,`ours` 偏好輪不到它們。
**本案要的是 `-s ours`,不是 `-X ours`。**

### 誠實範圍:它在 diff 上是隱形的

`git show <merge>` 印出來是**空的 diff**。只看 diff 的維護者什麼都看不到。
證據只存在於兩個地方:

1. **拓撲** —— merge 在 graph 上,`--contains` / `--is-ancestor` 查得到
2. **commit message** —— 逐項稽核的說明

所以 §5 的 commit message 範本不是裝飾,**它是這次操作唯一的可讀證據**,
建議在裡面直接指向本檔(`tasks/iceblue-resync-with-master.md`),
讓未來維護者有一份逐 commit 的對照表可看。

---

## 7. 兩個真差異怎麼處理(與本次 merge 無關)

兩項都**已經列管**,建議維持現行排程、不要塞進這次 sync:

1. **`@themePalette`(S29)** —— 已 rule 進 P7,形狀已定為
   「一個 palette 一張 sheet,`html[data-palette="<name>"]`」
   (見 `tasks/theme-pack-palette-mechanism.md`)。P7 做完即自然涵蓋。
2. **FA 裸別名 `.fas/.fass/.far/.fab`** —— 目前 `baseline/`、ZK 11.0.0 jar baseline、
   `target/classes/.../font-awesome.css.dsp` 三者**都還有**這些選擇器,
   代表 upstream 是在 ZK 11.0.0 jar 之後才移除的。
   要跟進的話是改 `scripts/gen-fa-css.js`,**並同步重新 freeze `baseline/`**
   ——因為它會改變 byte gate 的期望值。這是獨立的一次變更,自己走 gate。
