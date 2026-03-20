import React, { useState, useEffect } from "react";

// --- 填入你剛拿到的 API Key ---
const TMDB_API_KEY = "20dad5e77d795a42415b0c27d1587115";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

/**
 * 子組件：搜尋列 (SearchBar)
 */
function SearchBar({ query, setQuery }) {
  return (
    <div style={{ marginBottom: "30px", textAlign: "center" }}>
      <input
        type="text"
        placeholder="請輸入電影名稱 (例如: 蝙蝠俠)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "12px 20px",
          width: "90%", // 手機版佔滿 90%
          maxWidth: "600px", // 電腦版最大不超過 600px
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
 * 已重構為 RWD 佈局，並對應 TMDb 資料結構
 */
function MovieCard({ movie, favorites, setFavorites }) {
  const isExist = favorites.some((fav) => fav.id === movie.id);

  const handleToggleFavorite = () => {
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
        flexDirection: "column", // 垂直排列
        backgroundColor: "#fff",
        transition: "transform 0.2s",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        height: "100%", // 確保同列卡片高度一致
      }}
    >
      <img
        src={
          movie.poster_path
            ? `${TMDB_IMAGE_URL}${movie.poster_path}` // TMDb 需要組合完整的圖片網址
            : "https://via.placeholder.com/300x450?text=無海報"
        }
        alt={movie.title}
        style={{
          width: "100%",
          height: "300px",
          objectFit: "cover", // 確保圖片不變形
          borderRadius: "8px",
          marginBottom: "12px",
        }}
      />
      <h4 style={{ fontSize: "16px", margin: "0 0 8px 0", flexGrow: 1 }}>
        {movie.title || movie.name}
      </h4>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "12px" }}>
        📅 {movie.release_date || movie.first_air_date || "未知"}
      </p>
      <button
        onClick={handleToggleFavorite}
        style={{
          cursor: "pointer",
          width: "100%",
          padding: "10px",
          backgroundColor: isExist ? "#ff4d4f" : "#f0c14b",
          color: isExist ? "#fff" : "#333",
          border: isExist ? "1px solid #ff4d4f" : "1px solid #a88734",
          borderRadius: "4px",
          fontWeight: "bold",
          marginTop: "auto", // 將按鈕推至卡片最底部對齊
        }}
      >
        {isExist ? "🗑️ 移除收藏" : "⭐ 收藏"}
      </button>
    </div>
  );
}

/**
 * 主組件：CineShelf App (TMDb 版)
 */
export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. 初始化狀態：直接嘗試從 localStorage 讀取 (保持紀錄功能)
  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFavorites = localStorage.getItem("cineShelf_favorites_tmdb");
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error("無法解析 localStorage 內容:", error);
      return [];
    }
  });

  // 2. 監聽 favorites 的變化：每當收藏清單更新，就存入 localStorage
  useEffect(() => {
    localStorage.setItem("cineShelf_favorites_tmdb", JSON.stringify(favorites));
  }, [favorites]);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter((movie) => movie.id !== id));
  };

  // 3. 核心功能：串接 TMDb API 搜尋電影
  useEffect(() => {
    if (query.length < 2) {
      // TMDb 2個字就可以搜尋
      setMovies([]);
      setError("");
      return;
    }

    const fetchMovies = async () => {
      if (!TMDB_API_KEY || TMDB_API_KEY === "你的_TMDB_API_KEY") {
        setError("請在 App.js 中設定您的 TMDb API Key！");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            query,
          )}&language=zh-TW&include_adult=false`,
        );
        if (!response.ok) throw new Error("網路連線發生問題");
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          setMovies(data.results);
        } else {
          setMovies([]);
          setError("找不到這部電影，試試別的關鍵字？");
        }
      } catch (err) {
        setError("無法連線至伺服器，請檢查網路。");
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchMovies();
    }, 500); // 防抖，避免輸入每個字都發請求

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#fcfcfc",
        minHeight: "100vh",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", color: "#333" }}>🎬 CineShelf</h1>
        <p style={{ color: "#666" }}>探索繁體中文電影，打造專屬收藏庫</p>
      </header>

      <SearchBar query={query} setQuery={setQuery} />

      {/* --- 狀態顯示區 --- */}
      <div style={{ textAlign: "center", minHeight: "50px" }}>
        {loading && <p>⏳ 正在搜尋中...</p>}
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
          <p style={{ color: "#999" }}>請輸入至少 2 個字來開始探索...</p>
        )}
      </div>

      {/* --- 電影結果 Grid 區域 --- */}
      {!loading && movies.length > 0 && (
        <div
          style={{
            display: "grid",
            // RWD 核心：自動計算欄數，每欄最小 220px
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
            />
          ))}
        </div>
      )}

      {/* --- 收藏清單區域 --- */}
      <section
        style={{
          marginTop: "60px",
          borderTop: "2px solid #eee",
          paddingTop: "40px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          💛 我的收藏清單 ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            目前還沒有收藏任何電影。
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "15px",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            {favorites.map((fav) => (
              <div key={fav.id} style={{ width: "100px", textAlign: "center" }}>
                <img
                  src={
                    fav.poster_path
                      ? `${TMDB_IMAGE_URL}${fav.poster_path}`
                      : "https://via.placeholder.com/100x150?text=無海報"
                  }
                  alt={fav.title}
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
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
                  onClick={() => removeFavorite(fav.id)}
                  style={{
                    color: "#ff4d4f",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "0",
                  }}
                >
                  [移除]
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}