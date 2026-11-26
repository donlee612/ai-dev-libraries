---
name: 00b-designer
description: >-
  讀取 docs/00-prd.md，規劃畫面架構、元件階層、Loading / Empty / Error 與 Design
  Token，寫入 docs/00-ui-spec.md，並用 #REF 連回 PRD 的功能錨點。沒有前端時標註
  純後端並略過 UI。Use when a greenfield PRD exists and the user needs screens,
  interaction states, or a note that the project has no UI.
---

# 介面規格

## 何時使用 {#when}

`docs/00-prd.md` 已有要做的功能，使用者要安排畫面，或要明確標成純後端時，使用本 Skill。

PRD 還沒寫時，先走 `.agents/skills/00-pm-ba/SKILL.md`。本階段禁止修改 `src/`、`tests/`、`db/`、`.env.example`，也不寫 MVC 設計文件。

#REF: [../../../docs/00-prd.md#features] - 畫面只對應已經存在的功能錨點
#REF: [../../../docs/00-ui-spec.md#screens] - 產出寫進這份 UI 規格
#REF: [../00-pm-ba/SKILL.md#stop] - PRD 未確認時不要先畫畫面範圍

## 步驟 {#sop}

1. 讀 `docs/00-prd.md` 的功能清單與每個 `{#feat-<slug>}` 章節。不在本檔擴大產品範圍。PRD 沒寫的功能，先回到 `00-pm-ba` 補錨點。
2. 判斷有沒有對人顯示的畫面。使用者已說純後端、或 PRD 的功能全部沒有畫面時，走「略過」。有 HTML、元件、流程畫面時，走「撰寫畫面」。
3. 更新 `docs/00-ui-spec.md`。保留 `{#purpose}`、`{#screens}`、`{#layout}`、`{#components}`、`{#states}`、`{#tokens}`、`{#gate}`。
4. 每一條新的 `#REF` 都要在 PRD 的對應功能章節加一條指回本檔的 `#REF`。相對路徑以寫下那一行的檔案所在目錄計算。
5. 執行 `node scripts/check-refs.js`。失敗就修正連結。

### 略過 {#skip}

沒有前端時，`docs/00-ui-spec.md` 的畫面清單保留這一句，不要改寫：

```text
純後端專案，略過 UI 規格。
```

並保留指回 `docs/00-prd.md#features` 的 `#REF`。不要為了湊雙向連結而發明 `{#screen-<slug>}`。

### 撰寫畫面 {#screens-authoring}

有畫面時，從畫面清單刪除「純後端專案，略過 UI 規格」，改列真實畫面。每個畫面：

- 標題形式是 `## <畫面名稱> {#screen-<english-slug>}`。slug 用英文小寫與連字號。不要把角括號範例原樣寫進檔案。
- 寫一條 `#REF: [00-prd.md#feat-<slug>] - 這個畫面對應的功能`。`feat-<slug>` 必須是 PRD 標題上已有的 id。
- 在 PRD 該功能章節加一條指回 `00-ui-spec.md#screen-<slug>` 的 `#REF`。
- 寫畫面架構：從哪裡進入、下一步到哪裡。
- 寫元件階層：由外而內，元件名稱用英文識別字。不寫程式路徑。
- 寫互動狀態：Loading、Empty、Error。每一態寫使用者看到什麼、怎樣離開。
- Design Token 只在有視覺規範時填寫顏色、間距、字級、圓角的名稱與值。沒有就保持「尚無」，不要預填一套視覺系統。

## 停下來請求確認 {#stop}

```markdown
## 請確認 UI 規格

- 文件：docs/00-ui-spec.md
- 畫面錨點：列出 {#screen-<slug>}，或「純後端專案，略過 UI 規格」
- 連回的 PRD 錨點：
- 未決問題：
- 尚未修改 src/

請回覆「確認，可以設計」進入架構設計。這句話不允許改程式。
```

「好」「繼續」「嗯」不算確認。再問一次。
