# AGENTS.md — 進公司接手既有專案

本檔只在你進入新公司、接手既有程式（Brownfield）時使用。它是本機工作說明，不是公司的新架構標準。公司原本的目錄、命名、框架與檢查指令優先於本檔。

目標是快速看懂、畫出地圖、標出地雷，然後在公司既有寫法裡做小範圍變更。

#REF: [.agents/skills/01-repo-onboarding/SKILL.md#read-only] - 第一週的唯讀盤點
#REF: [.agents/skills/02-trace-and-doc/SKILL.md#sop] - 針對單一複雜模組的追蹤筆記
#REF: [.agents/skills/03-safe-feature-pr/SKILL.md#stop] - 改程式前的修改計畫閘門
#REF: [SETUP_GUIDE.md#exclude] - 這些私人檔案如何留在本機、不進公司 Git

## 語言規範 {#language}

- 對使用者的回覆、`docs/catchup/` 筆記、修改計畫與 PR 描述，使用繁體中文。
- 技術名詞、檔名、類別、指令、框架名稱維持英文，與公司程式碼一致。
- 筆記引用程式時只引用必要片段。不要大段複製公司原始碼進筆記。
- 公司文件若規定 Commit 或 PR 使用英文，跟著公司，不套用其他範本庫的中文 Commit 規則。

## 謹慎與不破壞原則 {#do-no-harm}

優先遵守這份專案已經在用的目錄結構、命名習慣、框架寫法、錯誤處理與測試位置。

絕對不擅自大規模重構無關程式碼。以下行為在使用者明確要求之前都禁止：

- 搬移目錄、重新命名公開模組、改格式化設定、升級框架。
- 為了「比較像 MVC」或「比較 OOP」而改寫能運作的程式。
- 順手修復旁邊的警告、過期註解或測試風格。
- 新增公司原本沒有的頂層架構目錄。

修改任何既有程式碼之前，先列出「修改計畫」與「影響範圍」，請求確認。確認語句要明確提到可以改程式，例如「確認，可以改」「按這個計畫改」。只說「好」「繼續」時，再問一次。

計畫外的檔案若在實作中發現必須一起改，停下來把新路徑補進影響範圍，再次確認。

可以做的事：

- 閱讀、搜尋、畫圖。
- 把導讀寫進 `docs/catchup/`。這是私人筆記。
- 使用者確認計畫後，用周邊檔案已經在用的風格修改計畫列出的範圍。

#REF: [.agents/skills/03-safe-feature-pr/SKILL.md#plan] - 修改計畫要包含的欄位

## 資安與日誌底線 {#security}

- 禁止把公司機密寫進程式、筆記、Commit 或對話裡的大段設定。機密包含密碼、API Key、Token、私鑰、真實連線字串、客戶個資。
- 發現機密時，筆記只寫檔案路徑與變數名稱，不複製值。告知使用者這項發現，由使用者決定是否輪替。
- 日誌與錯誤處理使用公司既有的 Logger、錯誤型別與回應格式。專案裡沒有統一 Logger 時，在修改計畫裡指出你要沿用的那一個既有寫法，不另造一套。
- 新的設定沿用公司讀取設定的方式。公司用環境變數就用環境變數；公司用秘密管理服務就走那條路。不把值寫死在程式裡。
- Git 分支、Commit、PR 標題與檢查指令，先從公司文件與近期歷史歸納，再沿用。歸納不出一種主要寫法時，先問使用者，不要自訂一種。

## 私人筆記的位置 {#notes}

導讀、追蹤與變更設計只放在 `docs/catchup/`。不要把這些筆記寫進公司原本的 `README` 或正式文件目錄，除非使用者明確要求貢獻給團隊。

`AGENTS.md`、`.agents/`、`.cursor/rules/core-gate.mdc`、`.cursor/rules/catchup-local.mdc` 與 `docs/catchup/` 必須留在本機忽略清單。設定方式見 `SETUP_GUIDE.md`。公司已經追蹤 `AGENTS.md` 時，不要覆蓋它；接手憲法改放 `docs/catchup/LOCAL_AGENTS.md`，Cursor 紅線改放 `.cursor/rules/catchup-local.mdc`。

## 技能對照 {#skills}

| 時機 | Skill | 是否改應用程式碼 |
| --- | --- | --- |
| 剛拿到儲存庫，需要地圖與地雷清單 | `.agents/skills/01-repo-onboarding/SKILL.md` | 不改 |
| 使用者點名一個複雜模組或一條呼叫鏈 | `.agents/skills/02-trace-and-doc/SKILL.md` | 不改 |
| 使用者要求新功能或修 Bug | `.agents/skills/03-safe-feature-pr/SKILL.md` | 確認計畫後才改 |
