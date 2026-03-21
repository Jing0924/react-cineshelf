import React from "react";

export default function SearchHistory({ history, onSelect, onClear, t }) {
  if (!history || history.length === 0) return null;

  return (
    <section className="search-history">
      <div className="search-history-keywords">
        <strong className="search-history-label">{t.recentSearches}:</strong>
        {history.map((keyword) => (
          <button
            key={keyword}
            onClick={() => onSelect(keyword)}
            className="search-history-keyword-btn"
          >
            {keyword}
          </button>
        ))}
      </div>
      <button onClick={onClear} className="search-history-clear-btn">
        {t.clearHistory}
      </button>
    </section>
  );
}
