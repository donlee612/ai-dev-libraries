---
name: 02-mvc-build-deliver
description: >-
  在使用者確認 docs/ 設計文件之後，按 MVC 與 OOP 契約實作 src/、在類別頂部寫入
  #REF、補齊單元測試、執行資安與斷鏈檢查，並輸出 Conventional Commits 與 PR
  描述。Use when a greenfield design document was explicitly accepted and the
  user asks to implement, build, or open a PR from that document.
---

# 按文件施工與交付

## 何時使用 {#when}

使用者已經對具體的 `docs/` 檔案說出「確認，可以實作」「同意這個設計」或「按文件做」之後，使用本 Skill。

還沒有這句話時，停止施工，改走 `.agents/skills/01-doc-architect/SKILL.md`。不要把「好」「繼續」當成確認。

#REF: [../../../AGENTS.md#doc-first] - 確認語句與 1:1 映射
#REF: [../../../AGENTS.md#security-log-git] - 日誌、秘密、Commit 與 PR 格式
#REF: [../../../docs/00-architecture.md#layers] - 施工時不得跨越的分層邊界

## 施工步驟 {#sop}

1. 重讀使用者接受的那幾份設計文件，以及 `docs/00-architecture.md` 被那些文件指向的章節。
2. 列出將要改的路徑。這份清單必須是設計文件影響範圍的子集。多出來的路徑先回到設計文件，重新請求確認。
3. 依文件實作，順序為 Model、Service、Controller、View。先讓不變量在 Model 內失敗，再讓 Service 編排，最後才接請求。
4. 每個主要類別在 import 之後、類別宣告之前寫入 `#REF` 註解。
5. 補單元測試。
6. 做本 Skill 的資安、日誌與斷鏈檢查。任一項失敗就修正後重跑，不輸出「已完成」。
7. 輸出 Conventional Commit 與 PR 描述。使用者沒有明確要求提交時，不執行 `git commit`、`git push`。

實作時遵守：

- 建構式注入設計文件列出的契約。測試傳入 test double，不連真實資料庫，除非文件寫明這是整合測試。
- Controller 方法內只有：讀輸入、呼叫文件指定的驗證、呼叫一個 Service 方法、把結果交給 View。
- SQL 使用參數化。結構變更依文件檔名產生 `db/migrations/YYYYMMDDHHMMSS_<snake_name>.sql`。
- 新的環境變數寫入 `.env.example`，值使用假值，並與文件的環境變數表一致。

## 類別頂部註解 {#class-ref}

以該原始檔所在目錄計算相對路徑。JavaScript、Java、Go 使用 `//`。Python、Ruby 使用 `#`。每一條一行。

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

上面的 `Order` 路徑是日後模組的格式。寫進 `src/` 之前，目標文件與錨點必須已經存在。註解至少指向該類別自己的設計文件，以及它依賴的另一份文件；對方文件要有指回這個類別的 `#REF`。

## 單元測試

測試放在 `tests/<layer>/<Name>.test.*`，檔名主體與類別相同。至少包含：

| 層 | 必須有的斷言 |
| --- | --- |
| Model | 合法資料可建立；違反不變量時拒絕且不寫入 |
| Service | 成功時提交；Model 拒絕時回滾，且沒有半套副作用 |
| Controller | 不合法輸入不會呼叫 Service；合法輸入只轉發文件指定的那一個方法 |
| View | 給定結果物件時輸出文件指定的欄位；輸出不含 stack 與秘密 |

測試名稱使用英文。失敗訊息可讀，不用空的 `assert true` 充數。

## 資安與斷鏈檢查 {#checks}

在交付前執行。工作目錄是專案根目錄。

1. 斷鏈檢查必須通過：

```bash
node scripts/check-refs.js
```

結束碼不是 0 就修正 `#REF` 後重跑。

2. 搜尋應用程式碼。`src/` 不得命中。規範文件裡用來禁止這些寫法的例句不算缺陷：

```text
console.log
console.debug
console.info
print(
pprint(
```

3. 搜尋寫死的秘密。命中真實密碼、API Key、Token 就改為環境變數，並同步 `.env.example`。`.env.example` 裡的 `USER`、`PASSWORD`、`DB_NAME` 這類假值可以保留。

4. 對照設計文件確認：

- 每個外部輸入都有驗證。
- 每條 SQL 都是參數化。
- 有結構變更就有 Migration 檔，且文件寫了回滾。
- Logger 只有 `info`、`warn`、`error`，等級語意是 `INFO`、`WARN`、`ERROR`。
- 業務類別沒有在方法內 `new` 具體的 Logger 或資料庫連線。

5. 執行專案的 linter 與 `npm test`（或其他語言在 CI 裡對等的測試指令）。失敗就修正。還沒有 `package.json` 時，先依 `.github/workflows/ci.yml` 補上 `scripts.lint` 與 `scripts.test`，再讓 CI 的三個 job 有機會通過。禁止用永遠成功的指令充當測試。

## 交付報告 {#delivery}

檢查都通過後，在回覆貼上以下兩份文字。`type` 從 `feat`、`fix`、`refactor`、`docs`、`test`、`chore`、`ci` 選擇。`scope` 用英文模組名。主旨用繁體中文祈使句，不加句號。

```text
<type>(<scope>): <主旨>

<為什麼需要這個變更，一行到三行>

Refs: docs/<layer>/<Name>.md#<anchor>
```

```markdown
## 變更摘要

## 設計文件

- docs/...（已於對話中確認）

## 影響範圍

- 新增：
- 修改：

## 資料庫 Migration

## 環境變數

## 資安與日誌自檢

- src/ 沒有 console.log / print(
- 秘密改由環境變數讀取
- 外部輸入已驗證；SQL 已參數化

## 測試

- 指令：
- 結果：

## 斷鏈檢查

- 指令：`node scripts/check-refs.js`
- 結果：

## 回滾方式
```

沒有發生的項目寫「無」，並用一句話說明原因。回滾方式要具體到可以操作：還原哪個 Commit、哪一份 Migration 如何往回、要不要改環境變數。

交付報告不取代文件。施工中若介面與已確認的文件不同，先更新文件並說明差異，等待使用者再次接受後才保留這段程式。
