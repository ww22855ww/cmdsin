# cmdsim

一個偽裝成終端機（terminal/cmd 視窗）的網頁小說/文章閱讀器。外觀看起來像在寫程式、跑 build、看 log，實際上是在讀 PTT 文章或自己貼的文字。

**Demo**：https://ww22855ww.github.io/cmdsin/

## 功能

- **終端機外殼**：深色/淺色主題、假 prompt、閃爍游標，標題列可切換主題與字體大小
- **快速偽裝切換**：`Ctrl + \`` 一鍵切成假的 `npm run build` 滾動 log，再按一次切回閱讀畫面
- **PTT 自動抓取**：在指令列輸入 `fetch <PTT文章網址>` 自動抓取標題、內文、留言區塊
- **PTT 看板列表瀏覽**：`fetch <PTT看板網址>`（如 `ptt.cc/bbs/marvel/index.html`）會顯示可點擊的文章列表，支援上一頁/下一頁換頁，點文章自動抓取、可返回列表
- **語法高亮雜訊穿插**：抓取的文章內容會隨機穿插假的程式碼/log 片段（stack trace、SQL、git commit 等），並用 highlight.js 做真的語法高亮，模擬 IDE 內嵌程式碼區塊，讓內容不容易一眼看出是小說
- **手動貼上文字**：不想自動抓取時可以直接貼文字閱讀（例如 Reddit 內容，見下方限制）
- **右側監控面板**：模擬 CPU/MEM/NET 使用率與分級（OK/INFO/WARN/ERROR）活動 log，填補畫面空白、增加真實感，寬度可拖曳調整
- **段落快速跳轉**：`Alt + ↑ / ↓` 依段落邊界跳轉並捲動到可視範圍

## 技術棧

| 項目 | 選擇 |
|---|---|
| 前端 | Vanilla JS + Vite |
| 前端部署 | GitHub Pages |
| 內容抓取代理 | GCP Cloud Functions (2nd gen) |
| 語法高亮 | highlight.js（core + js/python/sql/bash/plaintext） |
| 資料持久化 | localStorage |

前端是純靜態網站，透過呼叫一個公開的 GCP Cloud Function 代為抓取 PTT 內容（處理 CORS）。詳細架構、決策紀錄與開發過程踩過的坑，見 [`roadmap.md`](./roadmap.md)。

## 本機開發

```bash
npm install
npm run dev       # 啟動開發伺服器
npm run build     # 打包正式版本到 dist/
npm run preview   # 預覽打包結果
```

## 部署

- **前端**：push 到 `main` branch 後，`.github/workflows/deploy.yml` 會自動 build 並部署到 GitHub Pages。
- **抓取用 Cloud Function**（`functions/fetch-content/`）：

  ```bash
  cd functions/fetch-content
  gcloud functions deploy fetchContent \
    --gen2 --runtime=nodejs20 --region=asia-east1 \
    --source=. --entry-point=fetchContent \
    --trigger-http --allow-unauthenticated \
    --memory=256Mi --timeout=30s --project=cmdsim
  ```

## 已知限制

- Reddit 會擋非官方 API 的伺服器流量（403），無法自動抓取，需手動貼上文字。
- 目前只支援 PTT 網域的自動抓取。

## 非目標

- 不做使用者帳號/登入系統
- 不做多人協作或雲端同步（僅單機 localStorage）
- 不追求騙過鑑識或 IT 監控軟體，僅應付日常辦公室視覺偽裝
