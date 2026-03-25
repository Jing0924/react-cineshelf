# CineShelf

A movie discovery web app built with React and Vite.  
Users can search movies from TMDb, sort and filter results, save favorites, and manage movie status (`watchlist` / `watched`) with persistent local storage.

## Demo

- Live Demo: [Netlify Deployment](https://react-cineshelf.netlify.app/)

## Features

- Search movies by keyword with debounce
- Pagination with "Load More"
- Sort by popularity, rating, and release date
- Filter search results by year
- Bilingual UI (`zh-TW` / `en-US`)
- Favorites list with status toggle (`watchlist` / `watched`)
- Search history (deduplicated and stored in localStorage)
- Movie details modal with overview and metadata

## Tech Stack

- React 19
- Vite 8
- JavaScript (ESM)
- ESLint 9
- TMDb API

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

Create a `.env` file in the project root:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

You can get your API key from [TMDb](https://www.themoviedb.org/settings/api).

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
  App.jsx
  App.css
  index.css
  main.jsx
```

## Engineering Notes

- UI language, favorites, and search history are persisted in localStorage.
- Search requests are debounced to reduce unnecessary API calls.
- `useMemo` is used for derived lists (sorting/filtering) to keep rendering efficient.

## Future Improvements

- Add unit tests for sorting/filtering/favorites logic
- Extract API layer into dedicated service modules
- Add request cancellation (`AbortController`) to avoid stale responses
- Migrate to TypeScript for stronger type safety

## License

This project is for learning and portfolio use.
