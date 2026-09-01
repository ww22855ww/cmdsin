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

1. **目標網站**：PTT（例：`ptt.cc/bbs/marvel/`）自動抓取；Reddit 改為手動貼文字。
   - PTT：純 HTML，內容在 `div#main-content`，過濾 `.article-metaline` / `.push` 後取得乾淨內文，解析穩定可用。
   - Reddit：原計畫用官方 `.json` endpoint，但實測發現 Reddit 會直接擋非官方認證的伺服器流量（本機與 GCP asia-east1 皆回傳 403 Blocked），即使加了描述性 User-Agent 也一樣。要解決需改走 Reddit 官方 OAuth API（需註冊 app 拿 client_id/secret），評估後決定先不做，Reddit 內容維持手動貼上文字（Phase 1 功能已支援）。
2. **快速偽裝切換快捷鍵**：`Ctrl + \`` （反引號）。
3. **偽裝畫面內容**：假的 `npm run build` 滾動 log。
4. **GCP 專案**：另開新專案 `cmdsim`（project number `461815395402`），與其他資源/費用隔離。

## Roadmap

### Phase 1 — 終端外殼 + 靜態文字顯示（MVP 核心）
- [x] Vite 專案初始化
- [x] 終端機視覺外殼：深色背景、等寬字體、假 prompt、閃爍游標
- [x] 文字內容區塊：可貼上文字、上下捲動閱讀
- [x] 頁面 title / favicon 偽裝成程式碼編輯器圖示
- [x] 部署到 GitHub Pages，確認可正常存取（https://ww22855ww.github.io/cmdsin/）

### Phase 2 — 快速偽裝切換（防身核心功能）
- [x] 全域鍵盤監聽 `Ctrl + \`` + 切換動畫（越快越好，理想 <200ms）
- [x] 偽裝畫面：假的 `npm run build` 滾動 log
- [x] 切換後保留原本閱讀進度，再次切回能接續

### Phase 3 — 網址自動抓取
- [x] 建立新 GCP 專案（`cmdsim`）
- [x] 建立 GCP Cloud Function `fetchContent`（gen2, asia-east1）：接收網址 → 依網域分派 → 回傳純文字
  - [x] PTT 解析器（`div#main-content`，過濾 metaline/推文，正確取出標題與內文）
  - [x] ~~Reddit 解析器~~：Reddit 會擋非官方 API 流量（403），已改為明確錯誤訊息引導使用者手動貼文字
- [x] 前端串接：終端機指令列輸入 `fetch <網址>` → 呼叫 function → 寫入內容區並存 localStorage
- [x] 錯誤處理：不支援網域 / Reddit 網址 / 抓取失敗皆顯示紅字錯誤訊息，不影響既有內容
- [ ] （可選，之後有興趣再做）Reddit 改走官方 OAuth API 以支援自動抓取

**Cloud Function endpoint**：`https://asia-east1-cmdsim.cloudfunctions.net/fetchContent`（公開、無需驗證，僅接受 `ptt.cc` 網域，CORS 限制只允許 GitHub Pages 網域與本機開發伺服器呼叫）

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
