# CineShelf（繁體中文）

一個使用 React 與 Vite 的電影探索網站。
支援從 TMDb 搜尋電影、排序與篩選結果、收藏清單（`watchlist` / `watched`），並使用 `localStorage` 持久化保存。

## Demo
- Live Demo: [Netlify Deployment](https://react-cineshelf.netlify.app/)

## 功能特色
- 關鍵字搜尋（`debounce 500ms`，避免過度送出請求）
- 分頁：支援「Load More」
- 排序：依人氣、評分、上映日期排序
- 篩選：依年份篩選
- 雙語介面：`zh-TW` / `en-US`
- 收藏清單：可切換狀態（`watchlist` / `watched`）
- 搜尋紀錄：去重並存入 `localStorage`
- 電影細節 Modal：顯示海報、基本資訊與劇情簡介
- 選用 AI 搜尋（搭配 Ollama 或 Groq）：串流推薦、解析片名後到 TMDb 拉取對應資訊；若失敗會自動回退一般關鍵字搜尋

## 技術棧
- React 19
- Vite 8
- JavaScript (ESM)
- ESLint 9
- TMDb API
- Ollama / Groq（選用，僅用於 AI 搜尋）

## 快速開始
1. Clone 此專案
2. 安裝套件
3. 設定環境變數
4. 啟動開發伺服器

```bash
npm install
cp .env.example .env
npm run dev
```

## 環境變數
在專案根目錄建立 `.env`（參考 `.env.example`）。

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

你可以到 [TMDb](https://www.themoviedb.org/settings/api) 取得 API Key。

### Ollama（選用，啟用 AI 搜尋）
若要使用 **AI 智慧搜尋**，需要設定 Ollama 相關變數。

開發環境代理（避免 CORS）：
- 執行 `npm run dev` 時，程式會透過 `/ollama` 轉送到 Ollama
- 若未設定 `VITE_OLLAMA_URL`，預設代理目標為 `http://127.0.0.1:11434`

可用的環境變數：
```env
# 選填：若你不想使用預設 proxy target
# VITE_OLLAMA_URL=http://127.0.0.1:11434

# 可選：Ollama 模型名稱（預設：`llama3.2`）
VITE_OLLAMA_MODEL=llama3.2
```

### Groq（選用，啟用 AI 搜尋）
若要使用 **AI 智慧搜尋** 的 Groq provider，請設定：

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

注意：此版本為「前端直連」Groq；若遇到 CORS，可能需要改用 Vite proxy。

## 可用的指令
- `npm run dev`: 啟動本機開發伺服器
- `npm run build`: 建置生產環境
- `npm run preview`: 本機預覽生產環境
- `npm run lint`: 執行 ESLint 檢查

## 專案結構
```text
src/
  components/
    FilterBar.jsx
    MovieCard.jsx
    MovieModal.jsx
    SearchBar.jsx
    SearchHistory.jsx
  hooks/
    useAISearch.js
  App.jsx
  App.css
  index.css
  main.jsx
```

## 使用方式
### 1. 一般關鍵字搜尋
- 輸入關鍵字並開始搜尋
- 最短輸入長度為 **2 個字元**
- 請求會進行 `debounce (500ms)`
- 可搭配排序/篩選，並用 **Load More** 進行分頁

### 2. AI 搜尋（選用）
- 在搜尋列點選 **AI 智慧搜尋**
- 最短輸入長度為 **4 個字元**
- 程式會串流從所選 provider（Local Ollama 或 Groq）取得推薦清單，解析片名後再去 TMDb 拉取詳細資料
- 若所選 provider 不可用或 AI 回應無法解析，會自動回退成一般關鍵字搜尋

### 3. 收藏 / 已看狀態
- 在電影卡片上按收藏按鈕可新增或移除
- 收藏區塊可切換狀態：
  - `watchlist`（想看）
  - `watched`（已看）
- 收藏資料會持久化到 `localStorage`

### 4. 搜尋紀錄
- 最近搜尋會存到 `localStorage`
- 會去重，且最多保留最近 **8** 筆

### 5. 電影細節 Modal
- 點擊電影卡片可開啟 Modal，顯示海報、基本資訊與劇情簡介

## 工程備註
- 語系、收藏、搜尋紀錄與 AI provider 都會存到 `localStorage`：
  - `cineShelf_lang`
  - `cineShelf_favorites_tmdb`
  - `cineShelf_search_history`
  - `cineShelf_ai_provider`
- 關鍵字搜尋請求會 `debounce (500ms)`
- AI 建議會用 `sessionStorage` 依照 provider/model/prompt 快取，避免重複串流
- `useMemo` 用於排序/篩選等衍生資料，減少不必要的重新渲染

## 後續可改進
- 為排序/篩選/收藏邏輯加入單元測試
- 抽出 API 層成獨立 service 模組
- 加入 `AbortController` 取消關鍵字搜尋請求，避免快速輸入/切換時的舊回應覆蓋
- 使用 TypeScript 強化型別安全

## 授權
本專案用於學習與作品集展示用途。

