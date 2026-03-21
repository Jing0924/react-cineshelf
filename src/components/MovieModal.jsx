import React from "react";

export default function MovieModal({ movie, onClose, t, imageBaseUrl }) {
  if (!movie) return null;

  return (
    <div className="movie-modal-overlay" onClick={onClose}>
      <div className="movie-modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="movie-modal-close-btn">
          &times;
        </button>

        <img
          src={
            movie.poster_path
              ? `${imageBaseUrl}${movie.poster_path}`
              : "https://via.placeholder.com/300x450"
          }
          alt={movie.title}
          className="movie-modal-poster"
        />

        <div className="movie-modal-info">
          <h2 className="movie-modal-title">{movie.title || movie.name}</h2>
          <p className="movie-modal-meta">
            📅 {movie.release_date || movie.first_air_date} | ⭐ {movie.vote_average}
            /10
          </p>
          <h3 className="movie-modal-overview-title">{t.overviewTitle}</h3>
          <p className="movie-modal-overview">{movie.overview || t.noOverview}</p>
        </div>
      </div>
    </div>
  );
}
