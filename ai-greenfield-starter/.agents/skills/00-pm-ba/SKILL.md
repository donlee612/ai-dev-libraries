---
name: 00-pm-ba
description: >-
  接收模糊點子或需求，拆成業務目標、User Stories、輸入輸出、邊界條件與失敗處理，
  寫入 docs/00-prd.md，並為每個功能點建立 {#feat-<slug>} 錨點。確認前禁止修改
  src/、tests/、db/。Use when the user brings a vague idea, a new requirement, or
  a user story before architecture or implementation in a greenfield project.
---

# 產品需求先行

## 何時使用 {#when}

使用者給的是模糊點子、業務目標、User Story，或任何尚未寫進 `docs/00-prd.md` 的新功能時，使用本 Skill。

本階段只建立或更新 `docs/00-prd.md`。同一輪禁止建立或修改 `src/`、`tests/`、`db/`、`.env.example`。也不要先寫 MVC 設計文件；那是 PRD 確認之後 `01-doc-architect` 的工作。

#REF: [../../../AGENTS.md#doc-first] - 上游需求先於 MVC 文件與改碼閘門
#REF: [../../../docs/00-prd.md#features] - 功能錨點要加在這份已存在的 PRD
#REF: [../../../docs/00-architecture.md#upstream] - 架構文件只承接 PRD 已寫下的範圍

## 步驟 {#sop}

1. 讀 `AGENTS.md`、`docs/00-prd.md`、`docs/00-ui-spec.md`、`docs/00-architecture.md`。已有的功能錨點沿用，不另起同義 slug。
2. 把使用者的話收成可觀察的業務結果。缺角色、輸入、成功時看得到什麼、或失敗時不能發生什麼，先問，不要自己補一個會改範圍的答案。
3. 更新 `docs/00-prd.md`。保留 `{#purpose}`、`{#goals}`、`{#user-stories}`、`{#features}`、`{#io}`、`{#edge-cases}`、`{#failures}`、`{#gate}`。下游的 `#REF` 靠這些錨點連回來。
4. 每個功能點各開一節，標題使用真實錨點，形式是 `## <功能名稱> {#feat-<english-slug>}`。`english-slug` 用英文小寫與連字號，例如 `{#feat-login}`。不要把 `<slug>` 這幾個字原樣寫進檔案。
5. 該功能章節寫完輸入與輸出、邊界條件、失敗處理。業務語言即可。不寫類別名稱、資料表、HTTP 狀態碼。
6. 功能清單表格加一列，錨點與標題上的 id 一致。
7. 既有 `#REF` 繼續指向存在的章節。新功能若已有畫面規格，在功能章節加一條指回 `docs/00-ui-spec.md` 對應畫面的 `#REF`；畫面還沒寫就先不要造連結，交給 `00b-designer`。
8. 執行 `node scripts/check-refs.js`。失敗就修正連結，不要進入下一階段。

功能章節至少包含：

- 角色、要做的事、業務結果
- 輸入來源、欄位、必填、成功時輸出給誰
- 邊界條件：空值、極值、重複、權限、同時發生的操作
- 失敗處理：使用者看得到的失敗，以及業務上不能發生的事

## 停下來請求確認 {#stop}

自檢通過後，用下面格式結束回覆。同一輪仍然禁止修改 `src/`、`tests/`、`db/`、`.env.example`，也禁止開始 `docs/models/` 這類 MVC 設計文件。

```markdown
## 請確認 PRD

- 文件：docs/00-prd.md
- 功能錨點：
- 業務目標：
- 未決問題：
- 下一階段：有畫面則 00b-designer；純後端則在 docs/00-ui-spec.md 保留「純後端專案，略過 UI 規格」後進入 01-doc-architect
- 尚未修改 src/

請回覆「確認，可以設計」。這句話只進入文件，不允許改程式。
```

「好」「繼續」「嗯」「你看著辦」不算確認。再問一次。
