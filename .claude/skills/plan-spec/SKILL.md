---
name: plan-spec
description: 當需要撰寫或重構工程計畫書、技術規格書或進度報告時使用此 Skill。
---

# 計畫與進度文件寫作規範

當使用者要求規劃計畫或更新進度時，必須嚴格遵守以下「三層式架構 (3-Tier Structure)」：

## 1. 執行摘要 (Executive Summary)
- 限制長度在 1 頁 A4 內。
- 僅包含：核心目標、3~5 個大里程碑 (Phase)、現階段總體進度百分比。
- 嚴禁包含：行號 (Line numbers)、Commit Hash、位元組 (Byte) 差異、微觀腳本。

## 2. 階段進度 (Phase Breakdown)
- 拆解各 Phase 的目標、輸入/輸出、驗收標準 (Acceptance Gate)。
- 名詞必須統一（例如：統一使用「來源檔數」或「輸出檔數」，不可混用）。

## 3. 技術附錄 (Technical Appendix)
- 所有微觀細節（行號、Commit hash、Byte diff、Debug log、變動歷史）必須**全部收納於此處**或放在 `<details>` 摺疊區塊中。
- 禁止在 L1/L2 文章內文直接「打補丁」，若假設被推翻，直接更新 L1/L2 結論，變更過程記錄於 L3 的 Change Log。