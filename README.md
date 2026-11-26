# AI Agent 開發規範庫使用手冊

這個資料夾是兩套可複製的 AI 工作規範，不是一個會啟動的應用程式。一次只帶一套去用。

| | `ai-greenfield-starter/` | `ai-company-catchup/` |
| --- | --- | --- |
| 使用時機 | 自己從零開一個新專案 | 進公司接手已經存在的舊專案 |
| 怎麼放進去 | 在規範庫根目錄執行 `node init.js greenfield <路徑>` | 在規範庫根目錄執行 `node init.js catchup <路徑>` |
| 你複製什麼 | 整個資料夾，它就是新專案的根目錄 | `AGENTS.md`、`.agents/`、`.cursor/rules/core-gate.mdc`。公司已追蹤 `AGENTS.md` 時改放本機檔，不覆蓋公司檔 |
| 會不會改對方的架構 | 會。新專案從第一天就用 MVC、Doc-Driven、`#REF` | 不會。沿用公司既有目錄、命名與框架 |
| 筆記與規範進不進 Git | 進。這份新專案的文件與程式一起提交 | 不進公司遠端。用 `.git/info/exclude` 留在本機 |
| 改程式的閘門 | 你回覆「確認，可以實作」 | 你回覆「確認，可以改」 |
| 第一個 Skill | `00-pm-ba`，有畫面再接 `00b-designer` | `01-repo-onboarding` |
| 長對話紅線 | `.cursor/rules/core-gate.mdc`（`alwaysApply`） | 同左。公司已有 `AGENTS.md` 時改放 `.cursor/rules/catchup-local.mdc` |

```mermaid
flowchart TD
  Start[開始] --> Kind{專案從哪裡來}
  Kind -->|自己從零開發| A["情境 A：node init.js greenfield"]
  Kind -->|公司已經有程式| B["情境 B：node init.js catchup"]

  A --> A1[用新資料夾開 Cursor]
  A1 --> A2[貼開局 Prompt，觸發 00-pm-ba 寫 PRD]
  A2 --> A2b{有畫面嗎}
  A2b -->|有| A2c["00b-designer 寫 UI 規格，#REF 連回 PRD"]
  A2b -->|純後端| A2d[UI 規格標註略過]
  A2c --> A3{你回覆確認，可以設計}
  A2d --> A3
  A3 -->|是| A4["01-doc-architect 寫 MVC 文件並 #REF 回功能與畫面"]
  A3 -->|要改需求| A2
  A4 --> A5{你回覆確認，可以實作}
  A5 -->|是| A6[02-mvc-build-deliver 產程式、測試、Migration，並跑 check-refs.js]
  A5 -->|要改設計| A4
  A6 --> A7[之後每個新功能都從 PRD 錨點重跑]

  B --> B1["腳本判斷 AGENTS.md 有沒有被追蹤"]
  B1 --> B2[直接植入或安全合併，並寫入 exclude]
  B2 --> B3[貼對應情境的 Prompt]
  B3 --> B4[盤點與追蹤只寫 docs/catchup]
  B4 --> B5{要修 Bug 或加功能}
  B5 -->|要| B6[03-safe-feature-pr 先給計畫，確認後才改碼]
  B5 -->|先看懂| B4
```

下面的路徑以這台電腦的預設位置為例：

```text
C:\Users\user\Desktop\ai-dev-libraries
```

若規範庫不在這個路徑，只替換指令裡的來源路徑。

---

## 情境 A：從零開新專案

用 `ai-greenfield-starter/`。新專案會強制文件先行：先寫 `docs/`，你確認後才改 `src/`。

### Step 1：一鍵初始化

在規範庫根目錄執行。目標目錄請先不存在，或是空目錄。目錄裡已有檔案時，腳本會停止，避免蓋掉別的專案。

```powershell
node C:\Users\user\Desktop\ai-dev-libraries\init.js greenfield C:\Users\user\Desktop\my-new-app
```

```bash
node "$HOME/Desktop/ai-dev-libraries/init.js" greenfield "$HOME/Desktop/my-new-app"
```

這條指令會複製整個 `ai-greenfield-starter/`（含 `.agents`、`.cursor`、`.github`、`.env.example`），執行 `git init -b main`，再執行 `node scripts/check-refs.js`。結束碼應為 0。

接著用 Cursor 開啟新資料夾，不要開 `ai-dev-libraries` 本身。

#### 手動等價步驟

下面這組指令與 `init.js greenfield` 做同一件事。

Windows PowerShell：

```powershell
$src = "C:\Users\user\Desktop\ai-dev-libraries\ai-greenfield-starter"
$dst = "C:\Users\user\Desktop\my-new-app"
Copy-Item -Path $src -Destination $dst -Recurse
Set-Location $dst
git init -b main
node scripts/check-refs.js
```

Mac / Linux：

```bash
src="$HOME/Desktop/ai-dev-libraries/ai-greenfield-starter"
dst="$HOME/Desktop/my-new-app"
cp -R "$src" "$dst"
cd "$dst"
git init -b main
node scripts/check-refs.js
```

`node scripts/check-refs.js` 結束碼應為 0，並印出掃描檔案數與連結數。這一支腳本只掃描 `docs/` 與 `src/`。用 `init.js` 時，這一步已經跑過。

新專案第一天還有兩件要補，否則 `.github/workflows/ci.yml` 的 Lint 與 Unit test 會失敗：

- 在 `package.json` 提供 `scripts.lint` 與 `scripts.test`。測試失敗時指令必須回傳非 0。
- 把 `docs/00-architecture.md` 裡的 `<PROJECT_NAME>` 改成真實專案名稱。這件事交給 Step 2 的設計文件一起做。

`Check #REF links` 這個 job 不需要 `package.json`，現在就能過。

### Step 2：產品需求（PM / BA）

在新專案的 Cursor 對話貼上下面整段，或呼叫 `@pm-ba`。尖括號改成你的點子後再送出。

```text
請先讀 AGENTS.md 與 .cursor/rules/core-gate.mdc。
請依照 .agents/skills/00-pm-ba/SKILL.md 處理這個點子：<用三句話寫誰要做什麼、成功時看得到什麼、失敗時不能發生什麼>。
請更新 docs/00-prd.md。每個功能點使用 {#feat-<english-slug>} 錨點，並保留既有的 #REF。
我回覆「確認，可以設計」之前，不要修改 src/、tests/、db/，也不要寫 MVC 設計文件。
寫完後執行 node scripts/check-refs.js。
```

這一輪結束時，你應該看到功能錨點、業務目標、未決問題，以及一句「尚未修改 src/」。

「確認，可以設計」只進入下一份文件。它不允許改程式。

### Step 3：介面規格（Designer）

有畫面時貼下面這段，或呼叫 `@designer`。純後端就在回覆裡寫明，讓 `docs/00-ui-spec.md` 保留「純後端專案，略過 UI 規格」，並維持與 PRD 的 `#REF`。

```text
請依照 .agents/skills/00b-designer/SKILL.md，讀 docs/00-prd.md 已確認的功能錨點。
有畫面則更新 docs/00-ui-spec.md：畫面架構、元件階層、Loading / Empty / Error、Design Token。
每個畫面用 {#screen-<english-slug>}，並寫 #REF: [00-prd.md#feat-<slug>] 連回 PRD。PRD 的該功能也要指回這個畫面。
沒有前端則保留「純後端專案，略過 UI 規格」。
我回覆「確認，可以設計」之前，不要修改 src/。
寫完後執行 node scripts/check-refs.js。
```

### Step 4：啟動架構設計

PRD 與需要的 UI 規格都經過「確認，可以設計」之後，貼下面整段，或呼叫 `@architect`。尖括號改成你的技術棧。

```text
請先讀 AGENTS.md、docs/00-prd.md、docs/00-ui-spec.md 與 docs/00-architecture.md。
本專案技術棧：Node.js 20、TypeScript、Express、PostgreSQL。測試用 node:test。
請依照 .agents/skills/01-doc-architect/SKILL.md 處理已確認的功能錨點：<#feat-xxx>。
請把 <PROJECT_NAME> 寫進 docs/00-architecture.md，為每個 Model、Controller、Service、View 建立 1:1 的 docs 設計文件。
每份模組文件用 #REF 連回 PRD 的功能錨點；有畫面再連回 UI 規格的畫面錨點。上游章節要有指回的 #REF。
我回覆「確認，可以實作」之前，不要修改 src/、tests/、db/migrations/、.env.example。
寫完後執行 node scripts/check-refs.js，把結果與「請確認設計文件」區塊一起給我。
```

這一輪結束時，你應該看到設計文件路徑、影響範圍、上游錨點、Migration 檔名或「無」、環境變數或「無」，以及一句「尚未修改 src/」。

### Step 5：通關密語確認

只有下面三句會放行實作：

- `確認，可以實作`
- `同意這個設計`
- `按文件做`

`好`、`繼續`、`嗯`、`你看著辦` 不會放行。代理會再問一次。

你接受後，貼下面這段，或呼叫 `@programmer`：

```text
確認，可以實作。
請依照 .agents/skills/02-mvc-build-deliver/SKILL.md，只實作已確認的設計文件列出的路徑。
```

`02-mvc-build-deliver` 會依設計文件產出或更新這些位置：

| 位置 | 內容 |
| --- | --- |
| `docs/<layer>/<Name>.md` | 設計階段已寫好的文件；施工時若介面有差，會先改文件再停下來等你重新確認 |
| `docs/00-architecture.md` | 映射表補上新類別 |
| `src/models/`、`src/controllers/`、`src/services/`、`src/views/` | 對應類別。每個類別宣告前有 `#REF` 註解 |
| `tests/<layer>/<Name>.test.*` | 成功路徑、不變量被拒絕、Controller 只轉發 |
| `db/migrations/YYYYMMDDHHMMSS_<snake_name>.sql` | 只有設計文件寫了結構變更才會產生 |
| `.env.example` | 只有設計文件新增了環境變數才會補假值 |

施工結束前會在專案根目錄執行：

```bash
node scripts/check-refs.js
```

通過才輸出 Conventional Commit 與 PR 描述。你沒有在同一句話裡要求提交時，它不會執行 `git commit` 或 `git push`。

### Step 6：日常開發與新增功能循環

每一個新功能或會改行為的重構，都從 PRD 的功能錨點開始，再重跑 Step 2 到 Step 5。先更新 `docs/00-prd.md`，有畫面再更新 `docs/00-ui-spec.md`，確認可以設計後才改架構文件：

```text
請依照 .agents/skills/00-pm-ba/SKILL.md 新增功能：<功能名稱>。
在 docs/00-prd.md 建立 {#feat-<slug>}，有畫面則同步更新 docs/00-ui-spec.md 的 {#screen-<slug>}，雙向 #REF 都要連上。
我回覆「確認，可以設計」之前，不要改 src/，也不要先寫 MVC 文件。
```

確認可以設計後：

```text
請依照 .agents/skills/01-doc-architect/SKILL.md 為 <#feat-slug> 更新 docs/ 的設計文件與 docs/00-architecture.md 的映射表。
模組文件必須 #REF 回這個功能錨點與對應畫面錨點。
我回覆「確認，可以實作」之前，不要改 src/。
```

確認可以實作後：

```text
確認，可以實作。
請依照 .agents/skills/02-mvc-build-deliver/SKILL.md 實作，並執行 node scripts/check-refs.js。
```

只改註解錯字、不改變行為時，可以直說「這次只改註解，不要改設計文件」，並要求它在回報裡寫明原因。

功能做完、你要留版本時再自己提交，或明確告訴代理可以 commit。提交前看 `git status`，確認沒有 `.env`。

---

## 情境 B：進公司接手現有專案

用 `ai-company-catchup/`。規範與筆記留在你的電腦，公司 `git status` 不該看到它們。公司原本的寫法優先，不要把專案改成情境 A 的 MVC 骨架。

以下指令都在公司專案的根目錄執行。來源路徑維持這套武器庫的位置。

### Step 1：無痛植入與防污染設定

在規範庫根目錄執行。目標必須是公司專案的根目錄，而且已經是 Git 儲存庫。

```powershell
node C:\Users\user\Desktop\ai-dev-libraries\init.js catchup C:\path\to\company-repo
```

```bash
node "$HOME/Desktop/ai-dev-libraries/init.js" catchup /path/to/company-repo
```

腳本會執行 `git ls-files --error-unmatch AGENTS.md`：

- 沒有被追蹤：複製 `AGENTS.md`、`.agents/`、`.cursor/rules/core-gate.mdc`，建立 `docs/catchup/`。
- 已經被追蹤：不覆蓋公司的 `AGENTS.md`。規範存成 `docs/catchup/LOCAL_AGENTS.md`，Skill 合併進 `.agents/skills/`（已被追蹤的同名 Skill 略過），紅線存成 `.cursor/rules/catchup-local.mdc`。
- 兩種情況都會把實際植入的路徑寫進 `.git/info/exclude`。同一行已經在檔裡就不再寫一次。
- 最後執行 `git status --short`。植入檔案不該出現。公司原本就有的其他修改仍會列出來。

下面的手動指令與這支腳本做同一件事。需要對照路徑時再往下讀。

先看公司有沒有自己的 `AGENTS.md`，以及它有沒有被 Git 追蹤。

```powershell
git ls-files --error-unmatch AGENTS.md
```

```bash
git ls-files --error-unmatch AGENTS.md
```

結束碼 1 且訊息是路徑不符合，代表公司沒有追蹤這個檔，走「直接植入」。結束碼 0 代表公司已經追蹤它，走「安全合併」。

#### 直接植入

公司根目錄沒有 `AGENTS.md`，或有這個檔但尚未被追蹤，而且你確定可以把它留在本機。

Windows PowerShell：

```powershell
$lib = "C:\Users\user\Desktop\ai-dev-libraries\ai-company-catchup"
Copy-Item -Path (Join-Path $lib "AGENTS.md") -Destination ".\AGENTS.md"
Copy-Item -Path (Join-Path $lib ".agents") -Destination ".\.agents" -Recurse
New-Item -ItemType Directory -Force -Path ".\.cursor\rules" | Out-Null
Copy-Item -Path (Join-Path $lib ".cursor\rules\core-gate.mdc") -Destination ".\.cursor\rules\core-gate.mdc"
New-Item -ItemType Directory -Force -Path ".\docs\catchup" | Out-Null
$exclude = ".\.git\info\exclude"
$marker = "# local AI catchup, do not commit"
if (-not (Test-Path $exclude)) { New-Item -ItemType File -Force -Path $exclude | Out-Null }
$raw = Get-Content -Raw -Path $exclude -ErrorAction SilentlyContinue
if ($raw -notmatch [regex]::Escape($marker)) {
@"

# local AI catchup, do not commit
/AGENTS.md
/.agents/
/.cursor/rules/core-gate.mdc
/docs/catchup/
"@ | Add-Content -Path $exclude -Encoding utf8
}
git check-ignore -v --no-index AGENTS.md .agents/skills/01-repo-onboarding/SKILL.md .cursor/rules/core-gate.mdc docs/catchup
git status --short
```

Mac / Linux：

```bash
lib="$HOME/Desktop/ai-dev-libraries/ai-company-catchup"
cp "$lib/AGENTS.md" ./AGENTS.md
cp -R "$lib/.agents" ./.agents
mkdir -p ./.cursor/rules ./docs/catchup
cp "$lib/.cursor/rules/core-gate.mdc" ./.cursor/rules/core-gate.mdc
exclude=".git/info/exclude"
marker="# local AI catchup, do not commit"
touch "$exclude"
if ! grep -qF "$marker" "$exclude"; then
  cat >> "$exclude" <<'EOF'

# local AI catchup, do not commit
/AGENTS.md
/.agents/
/.cursor/rules/core-gate.mdc
/docs/catchup/
EOF
fi
git check-ignore -v --no-index AGENTS.md .agents/skills/01-repo-onboarding/SKILL.md .cursor/rules/core-gate.mdc docs/catchup
git status --short
```

成功時，`git check-ignore` 這四個路徑都指向 `.git/info/exclude`，`git status --short` 沒有 `AGENTS.md`、`.agents/`、`.cursor/rules/core-gate.mdc`、`docs/catchup/`。

不要把這些路徑寫進公司的 `.gitignore`。那個檔會被提交。

#### 若公司原本已有 `AGENTS.md`

被 Git 追蹤的 `AGENTS.md` 不要覆蓋，也不要把接手規則直接貼進去。那樣一改，`git status` 就會出現公司檔的修改。

安全作法是公司檔原封不動，接手憲法改放進已被排除的私人目錄。

Windows PowerShell：

```powershell
$lib = "C:\Users\user\Desktop\ai-dev-libraries\ai-company-catchup"
New-Item -ItemType Directory -Force -Path ".\docs\catchup" | Out-Null
Copy-Item -Path (Join-Path $lib "AGENTS.md") -Destination ".\docs\catchup\LOCAL_AGENTS.md"
if (Test-Path ".\.agents") {
  Copy-Item -Path (Join-Path $lib ".agents\skills\*") -Destination ".\.agents\skills\" -Recurse -Force
} else {
  Copy-Item -Path (Join-Path $lib ".agents") -Destination ".\.agents" -Recurse
}
New-Item -ItemType Directory -Force -Path ".\.cursor\rules" | Out-Null
Copy-Item -Path (Join-Path $lib ".cursor\rules\core-gate.mdc") -Destination ".\.cursor\rules\catchup-local.mdc"
$exclude = ".\.git\info\exclude"
$marker = "# local AI catchup, do not commit"
if (-not (Test-Path $exclude)) { New-Item -ItemType File -Force -Path $exclude | Out-Null }
$raw = Get-Content -Raw -Path $exclude -ErrorAction SilentlyContinue
if ($raw -notmatch [regex]::Escape($marker)) {
@"

# local AI catchup, do not commit
/docs/catchup/
/.agents/skills/01-repo-onboarding/
/.agents/skills/02-trace-and-doc/
/.agents/skills/03-safe-feature-pr/
/.cursor/rules/catchup-local.mdc
"@ | Add-Content -Path $exclude -Encoding utf8
}
git check-ignore -v --no-index docs/catchup/LOCAL_AGENTS.md .agents/skills/01-repo-onboarding/SKILL.md .cursor/rules/catchup-local.mdc
git status --short
git diff -- AGENTS.md
```

Mac / Linux：

```bash
lib="$HOME/Desktop/ai-dev-libraries/ai-company-catchup"
mkdir -p ./docs/catchup ./.agents/skills
cp "$lib/AGENTS.md" ./docs/catchup/LOCAL_AGENTS.md
cp -R "$lib/.agents/skills/." ./.agents/skills/
mkdir -p ./.cursor/rules
cp "$lib/.cursor/rules/core-gate.mdc" ./.cursor/rules/catchup-local.mdc
exclude=".git/info/exclude"
marker="# local AI catchup, do not commit"
touch "$exclude"
if ! grep -qF "$marker" "$exclude"; then
  cat >> "$exclude" <<'EOF'

# local AI catchup, do not commit
/docs/catchup/
/.agents/skills/01-repo-onboarding/
/.agents/skills/02-trace-and-doc/
/.agents/skills/03-safe-feature-pr/
/.cursor/rules/catchup-local.mdc
EOF
fi
git check-ignore -v --no-index docs/catchup/LOCAL_AGENTS.md .agents/skills/01-repo-onboarding/SKILL.md .cursor/rules/catchup-local.mdc
git status --short
git diff -- AGENTS.md
```

`git diff -- AGENTS.md` 應該沒有輸出。之後每一則 Prompt 的第一行改成：

```text
公司既有 AGENTS.md 優先。接手規則以 docs/catchup/LOCAL_AGENTS.md 為準。兩者衝突時聽從公司檔。
```

若 `.agents/skills/01-repo-onboarding` 這個名字公司已經有，而且被 Git 追蹤，不要覆蓋。`init.js` 會略過這種 Skill。手動複製前先停下來問人。

安全合併時，在 `catchup-local.mdc` 開頭註明：公司既有 `AGENTS.md` 優先。`init.js` 會自動加上這段。

### Step 2：三大情境開箱即用 Prompt 庫

在公司專案的 Cursor 對話貼。一次只做一件事。

#### 剛拿到專案權限

觸發 `01-repo-onboarding`。這一輪只畫地圖與找地雷，不改程式。

```text
請依照 .agents/skills/01-repo-onboarding/SKILL.md 接手這個儲存庫。
只允許寫入 docs/catchup/。不要修改應用程式碼、設定、lockfile、CI，不要 commit，不要 push。
請掃描實際存在的設定檔，盤點技術棧與 CI/CD，找出行程入口與核心路由。
追蹤 1 到 2 條核心業務資料流，各畫一張 Mermaid 架構圖與一張循序圖。參與者使用程式裡的真實名稱。
寫出 docs/catchup/00-overview.md、docs/catchup/01-tech-stack.md、docs/catchup/02-risks.md，以及每條流程一份 flow 筆記。
地雷清單每一列都要有檔案路徑。看到密碼、API Key、Token 時只寫路徑與變數名稱，不要複製值。
```

#### 追蹤複雜祖傳程式碼

觸發 `02-trace-and-doc`。把尖括號換成你點開的檔案與符號。

```text
請依照 .agents/skills/02-trace-and-doc/SKILL.md，從 <檔案路徑> 的 <符號名稱> 往上與往下追。
在 docs/catchup/module-<english-slug>.md 寫私人筆記，使用 #REF: [相對路徑#錨點] - 關聯說明 與 docs/catchup/00-overview.md 互連。
往下記到資料庫、外部服務或純計算為止。往上記到路由、排程或訊息處理器。同名符號超過一個時先列出候選，不要全部展開。
不要修改公司程式，不要在公司程式裡補註解，不要把秘密寫進筆記。
```

#### 修 Bug 或開發新功能

觸發 `03-safe-feature-pr`。先看到計畫，再決定要不要放行。

```text
請依照 .agents/skills/03-safe-feature-pr/SKILL.md 處理：<缺陷現象，或新功能的輸入與預期結果>。
先給修改計畫與影響範圍，並寫明你要模仿的既有檔案。
我回覆「確認，可以改」之前，不要修改程式。
確認後只改計畫裡的路徑，模仿周邊程式碼風格，補上同樣目錄與命名的測試，最後給 PR 描述。
PR 描述要包含變更摘要、影響評估、測試步驟。不要 commit，除非我另外要求。
```

放行時只貼：

```text
確認，可以改
```

同樣有效的另一句是 `按這個計畫改`。`好` 與 `繼續` 不會放行。

---

## 日常維護與升級指南

學到新規則，或 AI 又踩了同一次坑，就改對應的那一個檔，然後用一次真實任務試跑。不要同時改兩套庫來「保持對稱」，除非那個坑兩邊都會發生。

| 你要升級的行為 | 改這個檔 |
| --- | --- |
| 從零專案的語言、文件閘門、MVC、`#REF`、日誌、Commit、PR | `ai-greenfield-starter/AGENTS.md` |
| PRD 要寫哪些節、功能錨點、確認前禁止碰哪些路徑 | `ai-greenfield-starter/.agents/skills/00-pm-ba/SKILL.md` |
| 畫面、Loading / Empty / Error、Design Token、略過 UI | `ai-greenfield-starter/.agents/skills/00b-designer/SKILL.md` |
| 設計文件要多寫哪一節、如何 `#REF` 回 PRD 與畫面 | `ai-greenfield-starter/.agents/skills/01-doc-architect/SKILL.md` |
| 施工順序、測試要斷言什麼、交付報告欄位 | `ai-greenfield-starter/.agents/skills/02-mvc-build-deliver/SKILL.md` |
| 新專案的分層圖、例外表、環境變數表 | `ai-greenfield-starter/docs/00-architecture.md` |
| 斷鏈怎樣算失敗 | `ai-greenfield-starter/scripts/check-refs.js` |
| CI 要多一個 job，或換成別的語言的 lint/test | `ai-greenfield-starter/.github/workflows/ci.yml` |
| 可提交的環境變數名稱範本 | `ai-greenfield-starter/.env.example` |
| 接手時不准做的事、秘密與 Git 底線 | `ai-company-catchup/AGENTS.md` |
| 唯讀盤點要看哪些設定、筆記長什麼樣 | `ai-company-catchup/.agents/skills/01-repo-onboarding/SKILL.md` |
| 呼叫鏈要追到哪、`#REF` 怎麼寫進私人筆記 | `ai-company-catchup/.agents/skills/02-trace-and-doc/SKILL.md` |
| 修改計畫欄位、確認關鍵字、PR 描述 | `ai-company-catchup/.agents/skills/03-safe-feature-pr/SKILL.md` |
| 複製指令、exclude、開箱 Prompt | `ai-company-catchup/SETUP_GUIDE.md` 與本檔 `README.md` |
| 一鍵初始化做了什麼 | 根目錄 `init.js` |
| 長對話仍要套用的紅線 | 兩套庫的 `.cursor/rules/core-gate.mdc` |
| Cursor 裡的 `@pm-ba`、`@designer`、`@architect`、`@programmer` | `ai-greenfield-starter/.cursor/agents/` |
| Grok Bot 怎麼派工 | `GROK_ORCHESTRATOR.md` |

改完 Greenfield 的 `docs/` 或 `src/` 之後，在 `ai-greenfield-starter` 執行：

```bash
node scripts/check-refs.js
```

結束碼不是 0 就先修連結，再提交武器庫。改 Skill 或 `AGENTS.md` 時，用一則新對話貼對應的 Prompt，確認代理仍會停下來等你。

公司專案裡的副本不會自動更新。武器庫改完後，對該公司專案再執行一次 `node init.js catchup <公司專案路徑>`。腳本會更新未被 Git 追蹤的接手 Skill，並覆寫 `docs/catchup/LOCAL_AGENTS.md`。`docs/catchup/` 裡你自己的導讀不要刪。

---

## Grok Bot ＋ Cursor

兩套引擎分工。Grok 負責把點子問清楚並寫出派工 Prompt。Cursor 負責在目標儲存庫裡守規則、寫文件、寫程式。

1. 把根目錄 `GROK_ORCHESTRATOR.md` 設成 Grok Bot 的系統提示。跟它把業務目標、User Story、輸入輸出、邊界、失敗處理，以及這是 greenfield 還是 catchup 談完。它會交回一份設計簡報、一條 `node init.js` 指令，和一段 Cursor 啟動 Prompt。
2. 在規範庫根目錄執行那條 `init.js`。Greenfield 開新目錄；Catchup 進公司專案根目錄。
3. 用 Cursor 打開目標專案，貼上 Grok 產生的 Prompt。`.cursor/rules/core-gate.mdc` 會以 `alwaysApply: true` 套進之後每一則對話。Greenfield 也可以直接呼叫 `@pm-ba`、`@designer`、`@architect`、`@programmer`，它們分別指向對應的 Skill。
4. 通關密語由你自己打。「確認，可以設計」只進入文件。「確認，可以實作」或「確認，可以改」才允許改程式。Grok 不代替你說這幾句。

---

## 常見問題排解

### AI 忘記遵守規則怎麼辦

1. 新開一個對話。長對話裡的舊結論常常蓋過規範。`.cursor/rules/core-gate.mdc` 仍會套用，但 Skill 的步驟要在第一則訊息點名。
2. 第一則訊息就寫出 Skill 的路徑，例如 `.agents/skills/00-pm-ba/SKILL.md` 或 `.agents/skills/01-doc-architect/SKILL.md`，並寫「請先讀 AGENTS.md」。Greenfield 也可以直接 `@pm-ba` 或 `@architect`。
3. 在 Cursor 用 `@AGENTS.md` 把規範掛進這一次對話。
4. 它若已經改了 `src/` 而你還沒說確認關鍵字，回這句：

```text
停。還原你剛剛對 src/ 的修改。回到 .agents/skills/01-doc-architect/SKILL.md，先完成設計文件。我還沒說「確認，可以實作」。
```

5. 同一條規則連兩次都沒守住時，把該步驟寫進上表對應的 `SKILL.md`，用更短的禁止句放在該檔最上方的步驟裡，例如「同一輪禁止修改 src/」。

### `check-refs.js` 報錯怎麼修

在 `ai-greenfield-starter` 或你的新專案根目錄執行：

```bash
node scripts/check-refs.js
```

失敗時每一行是 `檔案:行號` 加原因。對著原因改，改完再跑，直到結束碼為 0。

| 訊息 | 原因 | 怎麼修 |
| --- | --- | --- |
| 目標檔案不存在 | `[...]` 裡的相對路徑從「寫下這一行的檔案所在目錄」算出去，找不到檔 | 修正路徑，或先建立目標檔與標題再寫 `#REF` |
| 找不到章節錨點 | 檔案在，但 `#` 後面的 id 對不到標題 | 在目標標題行尾加上 `{#那個id}`，或把 `#REF` 改成標題上已有的 id |
| 路徑超出儲存庫根目錄 | `..` 爬出專案根 | 改成專案內的相對路徑 |
| 禁止使用絕對路徑或 URL | 寫了 `C:\...` 或 `https://...` | 改成相對路徑 |
| 檔名大小寫不一致 | 路徑的大小寫和磁碟上的檔名不同 | 把 `#REF` 改成錯誤訊息裡「實際是」的那個名字 |
| 找不到掃描目錄 docs/ 或 src/ | 這兩個目錄被刪掉或沒有複製完整 | 從 `ai-greenfield-starter` 把缺的目錄補回來 |

`#REF` 寫在 `AGENTS.md` 或 `.agents/` 時，這支腳本不會掃到。`docs/` 與 `src/` 裡的程式碼區塊也算，所以範例連結也必須指向真的檔案。

同一檔案的章節可以寫成 `[#anchor-id]`，檔案部分留空。那是指這一行所在的檔，不是指 `docs/00-architecture.md`。

### Windows 與 Linux 路徑大小寫

Windows 預設不區分 `Order.md` 與 `order.md`，Linux 的 CI 會區分。`check-refs.js` 用目錄清單比對實際檔名字母，所以在 Windows 上也會把大小寫不同判成斷鏈。

請讓 `#REF`、檔名、`{#anchor-id}` 三者的大小寫完全一致。錨點用英文小寫與連字號，例如 `{#system-boundary}`。不要在 Windows 上只改大小寫來重新命名；Git 可能看不出差異。要改時分兩步提交：先改成暫時名稱，再改成正確名稱。
