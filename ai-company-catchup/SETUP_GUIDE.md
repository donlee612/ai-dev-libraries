# 進公司接手庫操作手冊

這份手冊說明如何把 `ai-company-catchup` 放進公司專案，並讓它只留在你的電腦上。公司遠端不應該出現這些檔案。

## 要放進去的檔案 {#copy}

只複製這三項到公司專案根目錄：

| 來源 | 公司專案中的位置 | 用途 |
| --- | --- | --- |
| `AGENTS.md` | `AGENTS.md` | 接手時的行為規範 |
| `.agents/` | `.agents/` | 三個 Skill |
| （之後由 Skill 產生） | `docs/catchup/` | 私人導讀、追蹤與修改設計 |

不要把整個 `ai-company-catchup` 目錄嵌進公司專案，也不要複製本手冊，除非你想把它放在專案外面自己留著。

公司專案裡如果已經有 `AGENTS.md` 或 `.agents/`，先停下來問使用者。不要覆蓋。可能的做法是改掛到別的檔名，或只摘需要的句子；那是使用者的決定。

在公司專案根目錄執行。把 `$lib` 換成這套檔案所在的路徑。

PowerShell：

```powershell
$lib = "C:\path\to\ai-company-catchup"
$repo = "C:\path\to\company-repo"
Copy-Item -Path (Join-Path $lib "AGENTS.md") -Destination (Join-Path $repo "AGENTS.md")
Copy-Item -Path (Join-Path $lib ".agents") -Destination (Join-Path $repo ".agents") -Recurse
New-Item -ItemType Directory -Force -Path (Join-Path $repo "docs\catchup") | Out-Null
```

bash：

```bash
lib=/path/to/ai-company-catchup
repo=/path/to/company-repo
cp "$lib/AGENTS.md" "$repo/AGENTS.md"
cp -R "$lib/.agents" "$repo/.agents"
mkdir -p "$repo/docs/catchup"
```

## 本機忽略，不改公司的 .gitignore {#exclude}

使用 `.git/info/exclude`。這個檔案只存在於你的 clone，不會被提交。不要把下面三條寫進公司的 `.gitignore`，那會變成一次對公司儲存庫的提交。

先確認這些路徑尚未被公司追蹤：

```bash
git ls-files --error-unmatch AGENTS.md .agents docs/catchup
```

若指令指出某個路徑已經在索引裡，不要把那個路徑放進 exclude。先問使用者。已被追蹤的檔案不會因為 exclude 而停止被追蹤。

未被追蹤時，把下面區塊加進 `.git/info/exclude` 一次。重複執行前先看檔案內容，避免同一段疊加。

```text
# local AI catchup, do not commit
/AGENTS.md
/.agents/
/docs/catchup/
```

PowerShell：

```powershell
$exclude = Join-Path $repo ".git\info\exclude"
@"

# local AI catchup, do not commit
/AGENTS.md
/.agents/
/docs/catchup/
"@ | Add-Content -Path $exclude -Encoding utf8
```

bash：

```bash
cat >> "$repo/.git/info/exclude" <<'EOF'

# local AI catchup, do not commit
/AGENTS.md
/.agents/
/docs/catchup/
EOF
```

確認忽略生效，而且工作區沒有把它們顯示成待提交：

```bash
git check-ignore -v --no-index AGENTS.md .agents/skills/01-repo-onboarding/SKILL.md docs/catchup
git status --short
```

`git check-ignore` 應該對三個路徑都印出 `.git/info/exclude` 的規則。`git status` 不應列出 `AGENTS.md`、`.agents/`、`docs/catchup/`。

## 開始用 {#prompts}

在公司專案的對話裡直接貼。每次只做一件事。

唯讀盤點：

```text
請依照 .agents/skills/01-repo-onboarding/SKILL.md 接手這個儲存庫。
只允許寫入 docs/catchup/。不要修改應用程式碼、設定、lockfile，不要 commit。
盤點技術棧與 CI，找出入口，追蹤 1 到 2 條核心業務資料流，畫 Mermaid 架構圖與循序圖，並寫出導讀與地雷清單。
```

追一條難懂的程式：

```text
請依照 .agents/skills/02-trace-and-doc/SKILL.md，從 <檔案路徑> 的 <符號名稱> 往上與往下追。
在 docs/catchup/ 寫私人筆記，使用 #REF 互相連結。不要改程式，不要把秘密寫進筆記。
```

修 Bug 或加功能：

```text
請依照 .agents/skills/03-safe-feature-pr/SKILL.md 處理：<缺陷或需求>。
先給修改計畫與影響範圍。我回覆「確認，可以改」之前，不要修改程式。
實作時模仿周邊既有寫法，補上同樣風格的測試，最後給 PR 描述。不要 commit，除非我另外要求。
```

## 離開或換電腦 {#leave}

私人筆記只在這個 clone 裡。換電腦前若要保留，自行把 `docs/catchup/` 拷到專案外面的私人位置。不要為了備份而推上公司遠端。

移除時刪除本機的 `AGENTS.md`、`.agents/`、`docs/catchup/`，並刪掉 `.git/info/exclude` 裡對應的三行。這只影響你的 clone。
