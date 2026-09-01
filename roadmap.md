# cmdsim — Roadmap

娛樂性質 side project：偽裝成終端機（cmd/terminal）介面的網頁小說/文章閱讀器，方便在辦公室閱讀時外觀像是在寫程式。

## 技術棧

| 項目 | 選擇 | 備註 |
|---|---|---|
| 前端框架 | Vanilla JS + Vite | 無框架負擔，打包小、載入快 |
| 前端部署 | GitHub Pages | 純靜態託管，免費，網域本身看起來也像技術網站 |
| 內容抓取代理 | GCP Cloud Functions (2nd gen) | 處理 CORS，前端呼叫此 function 代抓網址內容再回傳 |
| 資料持久化 | localStorage | 閱讀進度、設定值，不需要資料庫 |
| 版本控制 | Git / GitHub | — |

### 架構示意

```
[GitHub Pages 前端 (靜態)] --呼叫--> [GCP Cloud Function (抓取代理)] --> [目標小說網站]
        |
        v
   [localStorage: 閱讀進度/設定]
```

## 決策事項（已確認）

1. **目標網站**：PTT（例：`ptt.cc/bbs/marvel/`）與 Reddit。
   - PTT：純 HTML，內容在 `div#main-content`，需濾掉推文/簽名檔，解析相對單純。
   - Reddit：不爬 HTML，改用官方 JSON endpoint（原網址後加 `.json`，例如 `reddit.com/r/xxx/comments/xxx.json`），資料結構穩定、不易因改版壞掉，比解析 HTML 可靠。
   - Cloud Function 需依網域判斷用哪種解析邏輯（PTT parser vs Reddit JSON parser）。
2. **快速偽裝切換快捷鍵**：`Ctrl + \`` （反引號）。
3. **偽裝畫面內容**：假的 `npm run build` 滾動 log。
4. **GCP 專案**：另開新專案，與其他資源/費用隔離。

## Roadmap

### Phase 1 — 終端外殼 + 靜態文字顯示（MVP 核心）
- [ ] Vite 專案初始化
- [ ] 終端機視覺外殼：深色背景、等寬字體、假 prompt、閃爍游標
- [ ] 文字內容區塊：可貼上文字、上下捲動閱讀
- [ ] 頁面 title / favicon 偽裝成程式碼編輯器圖示
- [ ] 部署到 GitHub Pages，確認可正常存取

### Phase 2 — 快速偽裝切換（防身核心功能）
- [ ] 全域鍵盤監聽 `Ctrl + \`` + 切換動畫（越快越好，理想 <200ms）
- [ ] 偽裝畫面：假的 `npm run build` 滾動 log
- [ ] 切換後保留原本閱讀進度，再次切回能接續

### Phase 3 — 網址自動抓取
- [ ] 建立新 GCP 專案
- [ ] 建立 GCP Cloud Function：接收網址 → 依網域分派解析器 → 回傳純文字
  - [ ] PTT 解析器（`div#main-content`，過濾推文/簽名檔）
  - [ ] Reddit 解析器（改用 `.json` endpoint，解析 title + selftext / 留言）
- [ ] 前端串接：貼網址 → 呼叫 function → 顯示內容
- [ ] 錯誤處理：網址無效、非支援網站、抓取失敗、內容格式跑掉時的降級顯示（提示改用貼文字）

### Phase 4 — 閱讀體驗優化
- [ ] localStorage 記憶閱讀進度（依文章/網址區分）
- [ ] 字體大小、行距可調
- [ ] 章節/段落快速跳轉
- [ ] （可選）打字機動畫效果，可開關

### Phase 5 — 細節打磨（可選，依興趣加）
- [ ] 隨機穿插假的 log/報錯文字增加真實感
- [ ] 多套偽裝畫面主題可切換
- [ ] 鍵盤音效（辦公室慎用，預設關閉）
- [ ] 深色/淺色多種 terminal 配色主題

## 非目標（Non-goals）

- 不做使用者帳號/登入系統
- 不做多人協作或雲端同步（僅單機 localStorage）
- 不追求騙過鑑識或 IT 監控軟體，僅應付日常辦公室視覺偽裝
