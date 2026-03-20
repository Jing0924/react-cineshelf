import React, { useState, useEffect } from "react";

// --- TMDb API 設定 ---
const TMDB_API_KEY = "20dad5e77d795a42415b0c27d1587115";
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
  },
};

/**
 * 子組件：搜尋列 (SearchBar)
 */
function SearchBar({ query, setQuery, placeholder }) {
  return (
    <div style={{ marginBottom: "30px", textAlign: "center" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "12px 20px",
          width: "90%",
          maxWidth: "600px",
          borderRadius: "25px",
          border: "1px solid #ccc",
          fontSize: "16px",
          outline: "none",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

/**
 * 子組件：電影卡片 (MovieCard)
 */
function MovieCard({ movie, favorites, setFavorites, t, onSelect }) {
  const isExist = favorites.some((fav) => fav.id === movie.id);

  const handleToggleFavorite = (e) => {
    e.stopPropagation(); // 重點：防止點擊按鈕時也開啟 Modal
    if (!isExist) {
      setFavorites([...favorites, movie]);
    } else {
      setFavorites(favorites.filter((fav) => fav.id !== movie.id));
    }
  };

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: "12px",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        height: "100%",
        cursor: "pointer",
      }}
      onClick={() => onSelect(movie)}
    >
      <img
        src={
          movie.poster_path
            ? `${TMDB_IMAGE_URL}${movie.poster_path}`
            : "https://via.placeholder.com/300x450?text=No+Poster"
        }
        alt={movie.title}
        style={{
          width: "100%",
          height: "300px",
          objectFit: "cover",
          borderRadius: "8px",
          marginBottom: "12px",
        }}
      />
      <h4 style={{ fontSize: "16px", margin: "0 0 8px 0", flexGrow: 1 }}>
        {movie.title || movie.name}
      </h4>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "12px" }}>
        📅 {movie.release_date || movie.first_air_date || "---"}
      </p>
      <button
        onClick={handleToggleFavorite}
        style={{
          cursor: "pointer",
          width: "100%",
          padding: "10px",
          borderRadius: "4px",
          fontWeight: "bold",
          marginTop: "auto",
          backgroundColor: isExist ? "#ff4d4f" : "#f0c14b",
          color: isExist ? "#fff" : "#333",
          border: isExist ? "1px solid #ff4d4f" : "1px solid #a88734",
        }}
      >
        {isExist ? t.removeFav : t.addFav}
      </button>
    </div>
  );
}

function MovieModal({ movie, onClose, t }) {
  if (!movie) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose} // 點擊背景關閉
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "15px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          display: "flex",
          flexDirection: window.innerWidth > 600 ? "row" : "column",
        }}
        onClick={(e) => e.stopPropagation()} // 防止點擊視窗內部也關閉
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            fontSize: "24px",
            border: "none",
            background: "none",
            cursor: "pointer",
          }}
        >
          &times;
        </button>

        <img
          src={
            movie.poster_path
              ? `${TMDB_IMAGE_URL}${movie.poster_path}`
              : "https://via.placeholder.com/300x450"
          }
          alt={movie.title}
          style={{
            width: window.innerWidth > 600 ? "40%" : "100%",
            objectFit: "cover",
          }}
        />

        <div style={{ padding: "30px", flex: 1 }}>
          <h2 style={{ marginBottom: "10px" }}>{movie.title || movie.name}</h2>
          <p style={{ color: "#888", marginBottom: "20px" }}>
            📅 {movie.release_date || movie.first_air_date} | ⭐{" "}
            {movie.vote_average}/10
          </p>
          <h3>{t.overviewTitle}</h3>
          <p style={{ lineHeight: "1.6", color: "#444" }}>
            {movie.overview || t.noOverview}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 主組件：CineShelf App
 */
export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);

  // 1. 語系狀態 (預設從 localStorage 讀取，若無則預設中文)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("cineShelf_lang") || "zh-TW";
  });

  const t = i18n[language]; // 取得當前翻譯物件

  // 2. 收藏清單狀態
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("cineShelf_favorites_tmdb");
    return saved ? JSON.parse(saved) : [];
  });

  // 3. 監聽狀態變化並存入 localStorage
  useEffect(() => {
    localStorage.setItem("cineShelf_favorites_tmdb", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("cineShelf_lang", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "zh-TW" ? "en-US" : "zh-TW"));
  };

  // 4. API 搜尋邏輯 (連動 query 與 language)
  useEffect(() => {
    if (query.length < 2) {
      setMovies([]);
      setError("");
      return;
    }

    const fetchMovies = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${language}&include_adult=false`,
        );
        if (!response.ok) throw new Error();
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          setMovies(data.results);
        } else {
          setMovies([]);
          setError(t.noResults);
        }
      } catch (err) {
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchMovies, 500);
    return () => clearTimeout(debounceTimer);
  }, [query, language]);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "sans-serif",
        backgroundColor: "#fcfcfc",
        minHeight: "100vh",
      }}
    >
      {/* 語系切換按鈕固定在右上角 */}
      <button
        onClick={toggleLanguage}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "8px 15px",
          borderRadius: "20px",
          border: "1px solid #ddd",
          backgroundColor: "#fff",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          zIndex: 100,
        }}
      >
        🌐 {t.switchBtn}
      </button>

      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", color: "#333" }}>{t.title}</h1>
        <p style={{ color: "#666" }}>{t.subtitle}</p>
      </header>

      <SearchBar
        query={query}
        setQuery={setQuery}
        placeholder={t.placeholder}
      />

      <div style={{ textAlign: "center", minHeight: "50px" }}>
        {loading && <p>{t.loading}</p>}
        {!loading && error && (
          <p
            style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "10px",
              borderRadius: "8px",
              display: "inline-block",
            }}
          >
            ⚠️ {error}
          </p>
        )}
        {!loading && !error && query.length > 0 && query.length < 2 && (
          <p style={{ color: "#999" }}>{t.minChars}</p>
        )}
      </div>

      {!loading && movies.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "25px",
            marginTop: "20px",
          }}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              favorites={favorites}
              setFavorites={setFavorites}
              t={t}
              onSelect={setSelectedMovie} // 重點：把設定 state 的函式傳下去
            />
          ))}
        </div>
      )}

      <section
        style={{
          marginTop: "60px",
          borderTop: "2px solid #eee",
          paddingTop: "40px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          {t.myFavorites} ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>{t.emptyFav}</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "15px",
            }}
          >
            {favorites.map((fav) => (
              <div key={fav.id} style={{ width: "100px", textAlign: "center" }}>
                <img
                  src={
                    fav.poster_path
                      ? `${TMDB_IMAGE_URL}${fav.poster_path}`
                      : "https://via.placeholder.com/100x150"
                  }
                  alt={fav.title}
                  style={{ width: "100%", borderRadius: "6px" }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    margin: "5px 0",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {fav.title || fav.name}
                </p>
                <button
                  onClick={() =>
                    setFavorites(favorites.filter((f) => f.id !== fav.id))
                  }
                  style={{
                    color: "#ff4d4f",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
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
      />
    </div>
  );
}
