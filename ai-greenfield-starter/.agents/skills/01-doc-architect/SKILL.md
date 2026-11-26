---
name: 01-doc-architect
description: >-
  在修改 src/ 之前盤點影響範圍，撰寫 docs/ 的 1:1 設計文件，內容包含模組職責、雙向
  #REF、OOP 介面、資料流與例外處理，並在 PRD 或 UI 規格存在時連回功能與畫面錨點。
  寫完即暫停等待使用者確認。Use when the user requests a new feature, refactor,
  API, model change, or any src/ edit in a Doc-Driven greenfield project before
  the design document is accepted, and the upstream PRD is ready to design.
---

# 設計文件先行

## 何時使用 {#when}

使用者要求新功能、重構、改行為、改資料形狀或改對外介面，而且對應的 `docs/` 設計文件尚未被使用者明確接受時，使用本 Skill。不要同時改 `src/`。

需求仍是模糊點子，或 `docs/00-prd.md` 尚未被「確認，可以設計」接受時，不要使用本 Skill，改走 `.agents/skills/00-pm-ba/SKILL.md`。有畫面而 `docs/00-ui-spec.md` 尚未確認時，改走 `.agents/skills/00b-designer/SKILL.md`。「確認，可以設計」只進入文件，不允許修改 `src/`。

已接受架構文件的語句只有：「確認，可以實作」「同意這個設計」「按文件做」。使用者若說「好」「繼續」「嗯」，先停在本 Skill，請對方接受文件或指出章節。

#REF: [../../../AGENTS.md#doc-first] - 文件閘門與 1:1 路徑表
#REF: [../../../docs/00-architecture.md#mapping] - 新模組要加進總覽映射表
#REF: [../../../docs/00-architecture.md#upstream] - 模組文件要連回的上游錨點
#REF: [../00-pm-ba/SKILL.md#stop] - PRD 未確認時回到上游
#REF: [../00b-designer/SKILL.md#stop] - 有畫面時先確認 UI 規格

## 步驟

### 1. 盤點影響範圍 {#inventory}

讀 `AGENTS.md`、`docs/00-prd.md`、`docs/00-ui-spec.md` 與 `docs/00-architecture.md`。依使用者要求列出會碰到的檔案，分成新增與修改。這次要做的功能若在 PRD 找不到 `{#feat-<slug>}`，先停止，回到 `00-pm-ba` 補上標題錨點，不要在架構文件裡自造一個沒有 PRD 的功能。範圍至少檢查這些位置：

| 檢查項 | 要回答的問題 |
| --- | --- |
| Model | 哪個不變量會變？資料存在哪裡？ |
| Controller | 哪個請求進入？輸入契約是什麼？ |
| Service | 使用案例的交易從哪裡開始、失敗如何回滾？ |
| View | 成功與失敗的輸出格式是什麼？ |
| Migration | 結構或既有資料語意是否改變？ |
| 環境變數 | 是否需要新的設定名稱？ |
| 測試 | 成功、拒絕、轉發三類案例各在哪一支測試？ |
| 既有 `#REF` | 哪些文件的錨點或職責描述會過期？ |
| PRD | `docs/00-prd.md` 的哪個 `{#feat-<slug>}` 被這次實作？檔案不存在就先補上游 |
| UI | `docs/00-ui-spec.md` 的哪個 `{#screen-<slug>}`？純後端則註明略過 |

影響範圍之外的檔案不改。若發現必須連帶修改，把該檔案加進表格後再寫文件，不在文件外順手改。

盤點表寫進設計文件：

```markdown
| 項目 | 路徑 | 變更 | 原因 |
| --- | --- | --- | --- |
| Model | src/models/Order.js | 新增 | 保住可用數量不變量 |
| 設計文件 | docs/models/Order.md | 新增 | 與 Model 1:1 |
| Migration | db/migrations/YYYYMMDDHHMMSS_create_orders.sql | 新增 | 新增資料表 |
| 環境變數 | .env.example | 修改 | 無。沿用 DB_URL |
```

沒有變更的列保留，變更欄寫「無」，並在原因說明為什麼看過。

### 2. 撰寫設計文件 {#doc-template}

每個新增或修改的 Model、Controller、Service、View 各寫一份 `docs/<layer>/<Name>.md`，檔名主體與類別檔一致。跨模組的流程同時更新 `docs/00-architecture.md` 的映射表；若資料流與總覽不同，在該使用案例文件補圖，並 `#REF` 回 `docs/00-architecture.md#data-flow`。

每份模組文件使用以下結構，章節錨點沿用大括號裡的 id，不要改名：

```markdown
# <Name> {#purpose}

## 模組職責 {#responsibility}

- 層級：Model | Controller | Service | View
- 這份模組負責：
- 這份模組不負責：

## 關聯 {#refs}

#REF: [相對路徑#錨點] - 為什麼連到那裡
#REF: [../../00-architecture.md#layers] - 本模組所屬層級的系統契約
#REF: [../../00-prd.md#feat-<slug>] - 本模組實作的 PRD 功能錨點；id 必須已存在
#REF: [../../00-ui-spec.md#screen-<slug>] - 有對應畫面時才寫；純後端改指 #screens

## OOP 介面設計 {#interface}

- 類別名稱：
- 建構式注入的契約：
- 公開方法：名稱、輸入、輸出
- 前置條件：
- 後置條件：
- 不變量：
- 不公開的狀態：

## 資料流 {#data-flow}

用一段 sequence diagram 畫這個模組參與的路徑。參與者使用真實類別名稱。

## 例外處理 {#exceptions}

| 條件 | 錯誤型別 | 誰捕捉 | 日誌等級 | 客戶端看到什麼 |
| --- | --- | --- | --- | --- |

## 資料與 Migration {#persistence}

- 資料表 / 集合：
- Migration 檔名：`db/migrations/YYYYMMDDHHMMSS_<snake_name>.sql`，或「無」
- 回滾：

## 環境變數 {#env}

| 名稱 | 新增或既有 | .env.example 假值 | 缺少時的行為 |
| --- | --- | --- | --- |

## 測試計畫 {#tests}

| 案例 | 測試檔 | 斷言 |
| --- | --- | --- |
| 成功路徑 | tests/<layer>/<Name>.test.* | |
| 不變量或輸入被拒絕 | 同上 | |
| Controller 只轉發 | 同上 | 僅 Controller 需要 |

## 未決問題 {#open}

- 沒有就寫「無」。有就停在這裡，不要自己選一個會改資料語意的答案。
```

OOP 介面要寫到可以照著實作。方法簽章使用程式語言的英文識別字。關聯一節的每一條 `#REF` 都要在目標文件加一條指回本檔的連結。相對路徑以該份 `.md` 所在目錄計算。

`docs/` 內禁止寫尚不存在的 `#REF` 目標。要引用新文件時，先建立對方檔案與錨點，再寫連結。模板裡的 `<slug>` 是格式說明，禁止原樣寫進 `docs/`。

### 連回上游 {#upstream}

`docs/00-prd.md` 存在時，每一份本次新增或修改的模組文件都要 `#REF` 到它實作的 `{#feat-<slug>}`，並在該功能章節加一條指回模組文件的 `#REF`。

`docs/00-ui-spec.md` 存在時，View 與會產生畫面的流程要再 `#REF` 到 `{#screen-<slug>}`。該檔寫著「純後端專案，略過 UI 規格」，而且這次功能沒有畫面時，不要製造假畫面錨點；在影響範圍註明略過原因，並保留一條指向 `docs/00-ui-spec.md#screens` 的 `#REF`。

兩份上游檔案都不存在時，先停止，改走 `00-pm-ba`。不要在架構文件裡寫尚不存在的上游路徑。

### 3. 自檢

- 職責可以用一句話說完；第二個理由出現時，拆成另一個類別與另一份文件。
- Model 的介面沒有 HTTP 型別。Controller 的介面沒有金額、庫存、狀態機計算。
- View 的介面只接收已經完成的結果。
- 會改資料庫結構時，Migration 檔名與回滾已寫在文件裡。尚未建立 `.sql` 檔，那是施工階段的事。
- 新環境變數已出現在文件表格。尚未改 `.env.example`，除非使用者接受的是「連範本一起先改」；預設範本與程式都等確認後再改。
- 上游檔案存在時，模組文件已連到真實的功能錨點；有畫面時連到真實的畫面錨點；純後端則連到 `docs/00-ui-spec.md#screens` 並註明略過。對方文件有指回本檔的 `#REF`。
- 執行 `node scripts/check-refs.js`。失敗就修正連結，不要進入施工。

## 停下來請求確認 {#stop}

自檢通過後，同一輪禁止建立或修改 `src/`、`tests/`、`db/migrations/`、`.env.example`。用下面格式結束回覆：

```markdown
## 請確認設計文件

- 文件：
  - docs/<layer>/<Name>.md
- 影響範圍：新增 N 個檔、修改 N 個檔（列出路徑）
- 資料庫 Migration：有檔名，或無
- 環境變數：列出名稱，或無
- 上游：PRD 錨點、畫面錨點，或「純後端專案，略過 UI 規格」
- 未決問題：
- 尚未修改 src/

請回覆「確認，可以實作」，或指出要改的章節。確認前不會改程式。
```

使用者只接受其中一份文件時，只允許之後實作那一份列出的檔案。其餘文件維持未確認。
