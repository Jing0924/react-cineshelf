import React from "react";

export default function MovieCard({
  movie,
  favorites,
  setFavorites,
  t,
  onSelect,
  imageBaseUrl,
}) {
  const isExist = favorites.some((fav) => fav.id === movie.id);

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (!isExist) {
      setFavorites([...favorites, { ...movie, status: "watchlist" }]);
    } else {
      setFavorites(favorites.filter((fav) => fav.id !== movie.id));
    }
  };

  return (
    <div className="movie-card" onClick={() => onSelect(movie)}>
      <img
        src={
          movie.poster_path
            ? `${imageBaseUrl}${movie.poster_path}`
            : "https://via.placeholder.com/300x450?text=No+Poster"
        }
        alt={movie.title}
        className="movie-card-poster"
      />
      <h4 className="movie-card-title">{movie.title || movie.name}</h4>
      <p className="movie-card-date">
        📅 {movie.release_date || movie.first_air_date || "---"}
      </p>
      <button
        onClick={handleToggleFavorite}
        className={`movie-card-favorite-btn ${isExist ? "is-favorite" : "not-favorite"}`}
      >
        {isExist ? t.removeFav : t.addFav}
      </button>
    </div>
  );
}
