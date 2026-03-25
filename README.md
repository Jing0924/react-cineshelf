# CineShelf

中文版：[`README.zh-TW.md`](./README.zh-TW.md)

A movie discovery web app built with React and Vite.  
Users can search movies from TMDb, sort and filter results, save favorites, and manage movie status (`watchlist` / `watched`) with persistent local storage.

## Demo

- Live Demo: [Netlify Deployment](https://react-cineshelf.netlify.app/)

## Features

- Search movies by keyword with debounce (500ms)
- Pagination with "Load More"
- Sort by popularity, rating, and release date
- Filter search results by year
- Bilingual UI (`zh-TW` / `en-US`)
- Favorites list with status toggle (`watchlist` / `watched`)
- Search history (deduplicated and stored in localStorage)
- Movie details modal with overview and metadata
- Optional AI search (Ollama or Groq): streams recommendations, resolves titles via TMDb (with fallback to keyword search)

## Tech Stack

- React 19
- Vite 8
- JavaScript (ESM)
- ESLint 9
- TMDb API
- Ollama / Groq (optional, for AI search)

## Quick Start

1. Clone this repository
2. Install dependencies
3. Create environment variables
4. Start development server

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

You can get your API key from [TMDb](https://www.themoviedb.org/settings/api).

### Ollama (Optional)
If you want to enable **AI search**, you can set Ollama-related variables.

Dev proxy note:
- During `npm run dev`, the app can forward requests to Ollama through `/ollama` (avoids CORS).
- If `VITE_OLLAMA_URL` is not set, the proxy targets `http://127.0.0.1:11434`.

Available env vars:
```env
# Optional: only needed if you don't want to use the default proxy target
# VITE_OLLAMA_URL=http://127.0.0.1:11434

# Optional: Ollama model name (default: `llama3.2`)
VITE_OLLAMA_MODEL=llama3.2
```

### Groq (Optional)
If you want to use **AI search** with Groq (provider = `groq`), set:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

Note: Groq is called directly from the browser in this setup, so if you hit a CORS error you may need a Vite proxy.

## Available Scripts

- `npm run dev`: start local dev server
- `npm run build`: build production bundle
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint checks

## Project Structure

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

## How to Use
### 1. General (keyword) search
- Type a keyword and search normally.
- Minimum keyword length is **2 characters**.
- Requests are debounced (500ms).
- Sort/filter results and use **Load More** for pagination.

### 2. AI search (optional)
- Toggle on **AI 智慧搜尋** in the search bar.
- Minimum prompt length is **4 characters**.
- The app streams recommendations from the selected provider (Local Ollama or Groq), parses titles, then fetches matching details from TMDb.
- If the selected AI provider is unavailable or the AI output cannot be parsed, the app falls back to normal keyword search.

### 3. Favorites / Watch status
- Click the favorite button on a movie card to add/remove it.
- In the favorites section, toggle status between `watchlist` (想看) and `watched` (已看).
- Favorites are persisted in `localStorage`.

### 4. Search history
- Recent searches are saved in `localStorage`.
- History is deduplicated and limited to the latest **8** entries.

### 5. Movie details modal
- Click a movie card to open a modal with poster, metadata, and overview.

## Engineering Notes

- UI language, favorites, search history, and AI provider are persisted in `localStorage` (`cineShelf_lang`, `cineShelf_favorites_tmdb`, `cineShelf_search_history`, `cineShelf_ai_provider`).
- Search requests are debounced (500ms) to reduce unnecessary API calls.
- AI suggestions are cached in `sessionStorage` by provider/model/prompt to avoid repeated streaming.
- `useMemo` is used for derived lists (sorting/filtering) to keep rendering efficient.

## Future Improvements

- Add unit tests for sorting/filtering/favorites logic
- Extract API layer into dedicated service modules
- Add request cancellation (`AbortController`) for keyword search too (to avoid stale results during rapid input/filter changes)
- Migrate to TypeScript for stronger type safety

## License

This project is for learning and portfolio use.
