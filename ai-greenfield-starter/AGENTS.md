# AGENTS.md — Greenfield 新專案開發規範

本檔是從零建立新專案時的最高優先規範。代理在這個儲存庫工作時，先讀本檔，再讀 [docs/00-architecture.md](docs/00-architecture.md)，然後只載入與當前任務對應的 Skill。

#REF: [docs/00-architecture.md#system-boundary] - 系統邊界與預設分層的總覽
#REF: [.agents/skills/01-doc-architect/SKILL.md#stop] - 設計文件寫完後必須停下等待確認
#REF: [.agents/skills/02-mvc-build-deliver/SKILL.md#checks] - 確認後才按文件施工並做交付檢查

## 語言規範 {#language}

- 對使用者的回覆、設計文件、PR 描述、Commit 正文，一律使用繁體中文。
- 程式碼識別字、檔名、框架、協定、指令、型別名稱、Log level 維持英文。
- 變數、函式、類別、資料庫欄位不使用中文命名。
- 文件第一次出現縮寫時寫出英文全名，例如 Dependency Injection（DI）、Continuous Integration（CI）。
- 使用者用其他語言提問時，仍然用繁體中文回答，專有名詞維持英文。

## 核心鐵律（文件先行） {#doc-first}

任何新功能或重構，在修改 `src/` 之前，必須先在 `docs/` 建立或更新對應的 `.md` 設計文件，並得到使用者對該份文件的確認。

以下變更算重構或行為變更，一律先改文件：

- 新增、刪除、重新命名類別、公開方法、路由、資料表欄位或環境變數。
- 改變驗證規則、錯誤語意、狀態流轉、交易邊界或對外回應格式。
- 搬移職責，例如把邏輯從 Controller 移到 Service。

只改空白、註解錯字，且不改變行為時，可以不先改設計文件。回報裡要寫明「未改 `docs/`」以及原因。

文件閘門：

1. 盤點影響範圍，寫入或更新 `docs/`。主要模組與設計文件 1:1 同名。
2. 檔名主體必須一致，副檔名依語言可換。一個檔案一個主要類別。

| 程式 | 設計文件 |
| --- | --- |
| `src/models/<Name>.*` | `docs/models/<Name>.md` |
| `src/controllers/<Name>.*` | `docs/controllers/<Name>.md` |
| `src/services/<Name>.*` | `docs/services/<Name>.md` |
| `src/views/<Name>.*` | `docs/views/<Name>.md` |

3. 寫完後停止。把文件路徑、影響範圍與未決問題交給使用者。
4. 只有使用者明確接受該份文件之後，才能修改 `src/`。接受語句包含「確認，可以實作」「同意這個設計」「按文件做」。
5. 「好」「繼續」「嗯」不算確認。要再問一次，請對方接受文件或指出要改的章節。
6. 施工時只改該份文件列出的檔案。文件沒寫到的檔案要先回到文件補影響範圍，再請使用者確認。

#REF: [docs/00-architecture.md#mapping] - 目錄與 1:1 文件映射的落地位置

## OOP 與 MVC 規範 {#mvc-oop}

遵守 SOLID：Single Responsibility、Open/Closed、Liskov Substitution、Interface Segregation、Dependency Inversion。公開行為要小而完整，呼叫端能替換實作且不需要知道內部狀態。

封裝與 Dependency Injection（DI）：

- 不變量放在物件內部。呼叫端不得直接改可以破壞不變量的欄位。
- 依賴由建構式注入。業務類別的建構參數使用契約（interface、protocol 或 abstract class），不使用呼叫端臨時拼出來的具體型別。
- 業務類別內部不 `new` 基礎設施具體類別，也不讀取全域單例來取得 Logger、資料庫或時鐘。
- 組合根（composition root）是唯一組裝具體實作的地方，放在啟動檔。啟動檔建立時同步新增 `docs/` 下的同名設計文件。

分層：

| 層 | 允許 | 禁止 |
| --- | --- | --- |
| Model | 資料形狀、不變量、核心商業驗證、參數化的資料存取 | import HTTP 框架、讀寫 request/response、格式化給人看的輸出 |
| Controller | 解析請求、呼叫輸入驗證、呼叫一個 Service 方法、把結果交給 View | 價格、庫存、狀態機、權限規則等業務分支；串接多段使用案例 |
| Service | 編排一個使用案例、畫定交易邊界、呼叫 Model | 直接讀 HTTP；在交易外先提交再補做無法回滾的寫入 |
| View | 狀態碼、JSON 或 HTML 等輸出格式 | 重新計算業務結果、自行決定授權、把 stack 或秘密寫進回應 |

Controller 保持輕量化（Thin Controller）。一個動作對應一個 Service 方法。輸入驗證在進入 Service 之前完成；商業不變量在 Model 內再檢查一次，因為同一 Model 可能被別的使用案例呼叫。

持久化若拆出 Repository，仍屬於 Model 層：檔案放在 `src/models/`，並有同名 `docs/models/` 文件。不另開未經本檔與 `docs/00-architecture.md` 記載的頂層目錄。

#REF: [docs/00-architecture.md#layers] - 架構總覽裡的分層圖與資料流

## #REF 互連標準 {#ref-standard}

`docs/` 與 `src/` 裡每一條關聯都用同一行格式，雙向都要有：

```text
#REF: [相對路徑#章節錨點] - 關聯說明
```

規則：

- 相對路徑以「寫下這一行的檔案所在目錄」為基準。禁止絕對路徑、URL、以及超出儲存庫根目錄的 `..`。
- 同一檔案的章節可寫成 `[#章節錨點]`，檔案部分留空。
- 章節錨點優先使用標題尾端的明確標記：`## 標題 {#anchor-id}`。`anchor-id` 使用英文小寫與連字號。
- 沒有 `{#id}` 時，檢查器會用 ATX 標題（`#` 到 `######`）產生 slug：轉小寫、去掉標點、空白改為 `-`。
- 關聯說明用繁體中文寫這條連結為什麼存在。說明給人讀；檢查器不驗證說明文字。
- 文件 A 指向文件 B 的章節時，文件 B 必須有一條指回 A 的 `#REF`。
- 類別宣告前、import 之後，每個類別至少一條單行註解。JavaScript / Java / Go 使用 `//`，Python / Ruby 使用 `#`，內容仍然是同一格式。
- 修改標題錨點、搬移檔案或重新命名時，先更新雙方 `#REF`，再執行 `node scripts/check-refs.js`。檢查失敗就停止交付。
- HTML 註解與 Markdown 程式碼區塊裡的 `#REF` 也算數。禁止把斷鏈藏進註解。
- `.agents/` 的 Skill 不在掃描範圍。Skill 可以示範尚未建立的模組路徑；`docs/` 與 `src/` 不行，範例也必須指向真實檔案。

類別註解格式（檔案位於 `src/models/` 時，相對路徑要先離開 `src/models/`）：

```javascript
// #REF: [../../docs/models/Order.md#invariants] - 訂單不變量與建立規則
// #REF: [../../docs/00-architecture.md#layers] - Model 只負責資料與不變量
class Order {
}
```

```python
# #REF: [../../docs/models/Order.md#invariants] - 訂單不變量與建立規則
class Order:
    pass
```

上面兩段是格式範例，目標 `docs/models/Order.md` 要等該模組的設計文件建立後才存在。現在的總覽連結使用已經存在的檔案。

#REF: [docs/00-architecture.md#ref-examples] - 總覽裡已通過檢查的雙向連結範例
#REF: [scripts/check-refs.js] - 斷鏈檢查腳本：目標檔必須存在，Markdown 還要對得上章節錨點

## 資安、日誌與 Git 交付 {#security-log-git}

秘密：

- 禁止把 API Key、密碼、Token、連線字串裡的真實密碼寫進程式、測試、文件或 Commit。
- 一律從環境變數讀取。新增變數時，同一變更必須更新 `.env.example`（只放假值）與設計文件的環境變數表。
- `.env` 只留在本機，不進版本庫。

日誌：

- `src/` 禁止留下 `console.log`、`console.debug`、`console.info`、`print(`、`pprint(`。
- 應用程式碼使用注入的 Logger，只允許三個等級：`INFO`、`WARN`、`ERROR`。對應方法是 `logger.info`、`logger.warn`、`logger.error`。
- 輸入驗證失敗與可預期的業務拒絕記 `WARN`。未處理例外、資料完整性破壞、外部依賴失敗記 `ERROR`。
- 日誌與錯誤回應可以帶 request id 與失敗類別。禁止寫入秘密、完整連線字串、stack（對客戶端）、SQL 原文。
- `scripts/` 的命令列工具可以把結果寫到 stdout / stderr。應用程式碼不援用這個例外。

輸入與資料庫：

- 外部輸入包含 HTTP body、query、header、路徑參數、佇列訊息與檔案內容。進入 Service 前要驗證型別、必填、長度、列舉與未知欄位。
- 資料庫查詢使用參數化語句。禁止把輸入串進 SQL 字串。
- 會改變資料庫結構或既有資料語意的變更，必須在同一變更產生 Migration：`db/migrations/YYYYMMDDHHMMSS_<snake_name>.sql`。設計文件寫明向前與回滾方式。禁止只手動改正式環境。

Git：

- Commit 使用 Conventional Commits。`type` 與 `scope` 用英文，主旨與正文用繁體中文、祈使句、主旨不加句號。
- 允許的 `type`：`feat`、`fix`、`refactor`、`docs`、`test`、`chore`、`ci`。
- 一個 Commit 對應一個可回滾的意圖。不要把無關格式化混進功能 Commit。

```text
feat(order): 建立訂單時拒絕超過可用數量

同一筆交易內由 Model 檢查不變量，避免超賣後才補寫庫存。

Refs: docs/services/OrderService.md#create
```

PR 描述使用以下標題，沒有發生的項目寫「無」並附原因：

```markdown
## 變更摘要

## 設計文件

## 影響範圍

## 資料庫 Migration

## 環境變數

## 資安與日誌自檢

## 測試

## 斷鏈檢查

## 回滾方式
```

預設只輸出 Commit 訊息與 PR 描述。使用者沒有在該次對話明確要求時，不執行 `git commit` 或 `git push`。

#REF: [docs/00-architecture.md#exceptions] - 例外在哪一層拋出、哪一層轉成對外回應
#REF: [.env.example] - 目前允許出現在範本中的環境變數

## 目錄契約 {#layout}

```text
AGENTS.md
.env.example
.agents/skills/01-doc-architect/SKILL.md
.agents/skills/02-mvc-build-deliver/SKILL.md
.github/workflows/ci.yml
docs/00-architecture.md
docs/models|controllers|services|views/<Name>.md
scripts/check-refs.js
src/models|controllers|services|views/
db/migrations/
tests/<layer>/<Name>.test.*
```

`src/` 下目前只有層級骨架。第一個功能必須先補 `docs/00-architecture.md` 的專案名稱與該功能的設計文件。`db/migrations/` 與 `tests/` 在第一次需要時建立，路徑沿用本節，不另起名稱。

## 交付前檢查清單 {#checklist}

- [ ] 行為變更都有先更新的 `docs/` 文件，且使用者已明確接受。
- [ ] Model、Controller、Service、View 都是 1:1 同名文件；類別頂部有 `// #REF` 或同等單行註解。
- [ ] 雙向 `#REF` 已互指，`node scripts/check-refs.js` 結束碼為 0。
- [ ] Controller 沒有業務分支；Model 沒有 HTTP；View 沒有重新計算業務結果。
- [ ] 依賴由建構式注入，業務類別沒有自行 `new` Logger 或資料庫連線。
- [ ] 新環境變數已寫入 `.env.example`；工作區沒有真實秘密。
- [ ] `src/` 沒有 `console.log` / `print(`；日誌只有 `INFO`、`WARN`、`ERROR`。
- [ ] 外部輸入有驗證；SQL 有參數化；結構變更有 Migration。
- [ ] 單元測試涵蓋成功路徑、不變量被拒絕、Controller 只轉發。測試失敗時指令回傳非 0。
- [ ] Commit 訊息與 PR 描述已依本檔格式輸出。

## 技能對照 {#skills}

| 時機 | Skill |
| --- | --- |
| 新功能、重構、或任何想改 `src/` 的請求，文件尚未確認 | `.agents/skills/01-doc-architect/SKILL.md` |
| 使用者已明確接受對應設計文件，要按文件實作並交付 | `.agents/skills/02-mvc-build-deliver/SKILL.md` |
