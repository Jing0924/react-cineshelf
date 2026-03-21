import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import SearchBar from "./components/SearchBar";
import MovieCard from "./components/MovieCard";
import MovieModal from "./components/MovieModal";
import SearchHistory from "./components/SearchHistory";
import FilterBar from "./components/FilterBar";

// --- TMDb API 設定 ---
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// --- 1. 語系文字對照表 (i18n Config) ---
const i18n = {
  "zh-TW": {
    title: "🎬 CineShelf",
    subtitle: "探索你喜愛的電影，打造專屬收藏庫",
    placeholder: "請輸入電影名稱 (例如: 蝙蝠俠)",
    loading: "⏳ 正在搜尋中...",
    minChars: "請輸入至少 2 個字來開始探索...",
    noResults: "找不到這部電影，試試別的關鍵字？",
    myFavorites: "💛 我的收藏清單",
    emptyFav: "目前還沒有收藏任何電影。",
    remove: "[移除]",
    addFav: "⭐ 收藏",
    removeFav: "🗑️ 移除收藏",
    switchBtn: "English",
    error: "網路連線發生問題，請檢查 API Key 或網路。",
    overviewTitle: "劇情簡介",
    noOverview: "暫無劇情簡介。",
    recentSearches: "最近搜尋",
    clearHistory: "清除紀錄",
    sortBy: "排序",
    sortPopularity: "熱門度（高到低）",
    sortRating: "評分（高到低）",
    sortReleaseDate: "上映日期（新到舊）",
    filterYear: "年份",
    allYears: "全部",
    loadMore: "載入更多",
    loadingMore: "載入中...",
    watchlist: "想看",
    watched: "已看",
    markAsWatched: "標記已看",
    markAsWatchlist: "標記想看",
  },
  "en-US": {
    title: "🎬 CineShelf",
    subtitle: "Explore your favorite movies and build your collection",
    placeholder: "Enter movie title (e.g., Batman)",
    loading: "⏳ Searching...",
    minChars: "Enter at least 2 characters to start exploring...",
    noResults: "No movies found. Try another keyword?",
    myFavorites: "💛 My Favorites",
    emptyFav: "No movies in your collection yet.",
    remove: "[Remove]",
    addFav: "⭐ Favorite",
    removeFav: "🗑️ Remove",
    switchBtn: "繁體中文",
    error: "Connection error. Please check your API Key or network.",
    overviewTitle: "Overview",
    noOverview: "No overview available.",
    recentSearches: "Recent Searches",
    clearHistory: "Clear",
    sortBy: "Sort by",
    sortPopularity: "Popularity (desc)",
    sortRating: "Rating (desc)",
    sortReleaseDate: "Release date (newest)",
    filterYear: "Year",
    allYears: "All",
    loadMore: "Load More",
    loadingMore: "Loading...",
    watchlist: "Watchlist",
    watched: "Watched",
    markAsWatched: "Mark Watched",
    markAsWatchlist: "Mark Watchlist",
  },
};

/**
 * 主組件：CineShelf App
 */
export default function App() {
  const MAX_HISTORY_ITEMS = 8;
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("popularity");
  const [filterYear, setFilterYear] = useState("all");

  // 1. 語系狀態 (預設從 localStorage 讀取，若無則預設中文)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("cineShelf_lang") || "zh-TW";
  });

  const t = i18n[language]; // 取得當前翻譯物件

  // 2. 收藏清單狀態
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("cineShelf_favorites_tmdb");
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return parsed.map((item) => ({
      ...item,
      status: item.status === "watched" ? "watched" : "watchlist",
    }));
  });
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem("cineShelf_search_history");
    return saved ? JSON.parse(saved) : [];
  });

  // 3. 監聽狀態變化並存入 localStorage
  useEffect(() => {
    localStorage.setItem("cineShelf_favorites_tmdb", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("cineShelf_lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("cineShelf_search_history", JSON.stringify(searchHistory));
  }, [searchHistory]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "zh-TW" ? "en-US" : "zh-TW"));
  };

  const addSearchHistory = (keyword) => {
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword.length < 2) return;

    setSearchHistory((prev) => {
      const withoutDuplicate = prev.filter((item) => item !== normalizedKeyword);
      return [normalizedKeyword, ...withoutDuplicate].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 20 }, (_, index) => String(currentYear - index));
  }, []);

  const displayedMovies = useMemo(() => {
    const filteredMovies =
      filterYear === "all"
        ? movies
        : movies.filter((movie) => {
          const dateValue = movie.release_date || movie.first_air_date || "";
          return dateValue.startsWith(filterYear);
        });

    return [...filteredMovies].sort((a, b) => {
      if (sortBy === "rating") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }

      if (sortBy === "releaseDate") {
        return new Date(b.release_date || b.first_air_date || 0) - new Date(a.release_date || a.first_air_date || 0);
      }

      return (b.popularity || 0) - (a.popularity || 0);
    });
  }, [movies, filterYear, sortBy]);

  const toggleFavoriteStatus = (id) => {
    setFavorites((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "watched" ? "watchlist" : "watched" }
          : item,
      ),
    );
  };

  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
  }, [query, language]);

  // 4. API 搜尋邏輯 (連動 query / language / page)
  useEffect(() => {
    if (query.length < 2) {
      setMovies([]);
      setError("");
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }

    const fetchMovies = async () => {
      if (currentPage === 1) {
        addSearchHistory(query);
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError("");
      try {
        const response = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${language}&include_adult=false&page=${currentPage}`,
        );
        if (!response.ok) throw new Error();
        const data = await response.json();
        const nextResults = data.results || [];
        setTotalPages(data.total_pages || 1);

        if (nextResults.length > 0) {
          if (currentPage === 1) {
            setMovies(nextResults);
          } else {
            setMovies((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const uniqueResults = nextResults.filter((item) => !existingIds.has(item.id));
              return [...prev, ...uniqueResults];
            });
          }
        } else {
          if (currentPage === 1) {
            setMovies([]);
            setError(t.noResults);
          }
        }
      } catch {
        setError(t.error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    const debounceTimer = setTimeout(fetchMovies, 500);
    return () => clearTimeout(debounceTimer);
  }, [query, language, currentPage, t.error, t.noResults]);

  return (
    <div className="app-container">
      {/* 語系切換按鈕固定在右上角 */}
      <button onClick={toggleLanguage} className="language-switch-btn">
        🌐 {t.switchBtn}
      </button>

      <header className="app-header">
        <h1 className="app-title">{t.title}</h1>
        <p className="app-subtitle">{t.subtitle}</p>
      </header>

      <SearchBar
        query={query}
        setQuery={setQuery}
        placeholder={t.placeholder}
      />
      <SearchHistory
        history={searchHistory}
        onSelect={setQuery}
        onClear={() => setSearchHistory([])}
        t={t}
      />

      {!loading && movies.length > 0 && (
        <FilterBar
          t={t}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterYear={filterYear}
          onYearChange={setFilterYear}
          yearOptions={yearOptions}
        />
      )}

      <div className="status-message-container">
        {loading && <p>{t.loading}</p>}
        {!loading && error && (
          <p className="status-error-message">
            ⚠️ {error}
          </p>
        )}
        {!loading && !error && query.length > 0 && query.length < 2 && (
          <p className="status-min-chars-message">{t.minChars}</p>
        )}
      </div>

      {!loading && displayedMovies.length > 0 && (
        <div className="movie-grid">
          {displayedMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              favorites={favorites}
              setFavorites={setFavorites}
              t={t}
              onSelect={setSelectedMovie}
              imageBaseUrl={TMDB_IMAGE_URL}
            />
          ))}
        </div>
      )}

      {!loading && movies.length > 0 && currentPage < totalPages && (
        <div className="load-more-container">
          <button
            className="load-more-btn"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={loadingMore}
          >
            {loadingMore ? t.loadingMore : t.loadMore}
          </button>
        </div>
      )}

      <section className="favorites-section">
        <h2 className="favorites-title">
          {t.myFavorites} ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p className="favorites-empty-message">{t.emptyFav}</p>
        ) : (
          <div className="favorites-list">
            {favorites.map((fav) => (
              <div key={fav.id} className="favorite-item">
                <img
                  src={
                    fav.poster_path
                      ? `${TMDB_IMAGE_URL}${fav.poster_path}`
                      : "https://via.placeholder.com/100x150"
                  }
                  alt={fav.title}
                  className="favorite-item-poster"
                />
                <p className="favorite-item-title">
                  {fav.title || fav.name}
                </p>
                <p className={`favorite-item-status ${fav.status === "watched" ? "is-watched" : "is-watchlist"}`}>
                  {fav.status === "watched" ? t.watched : t.watchlist}
                </p>
                <button
                  onClick={() => toggleFavoriteStatus(fav.id)}
                  className="favorite-item-status-btn"
                >
                  {fav.status === "watched" ? t.markAsWatchlist : t.markAsWatched}
                </button>
                <button
                  onClick={() =>
                    setFavorites(favorites.filter((f) => f.id !== fav.id))
                  }
                  className="favorite-item-remove-btn"
                >
                  {t.remove}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        t={t}
        imageBaseUrl={TMDB_IMAGE_URL}
      />
    </div>
  );
}
