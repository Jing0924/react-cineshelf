import React from "react";

export default function SearchHistory({
  history,
  onSelect,
  onClear,
  onRemove,
  t,
}) {
  if (!history || history.length === 0) return null;

  return (
    <section className="search-history">
      <div className="search-history-keywords">
        <strong className="search-history-label">{t.recentSearches}:</strong>
        {history.map((keyword) => (
          <div key={keyword} className="search-history-keyword-item">
            <button
              type="button"
              onClick={() => onSelect(keyword)}
              className="search-history-keyword-btn"
            >
              {keyword}
            </button>
            <button
              type="button"
              className="search-history-keyword-remove-btn"
              aria-label={t.remove}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 防止觸發外層 onSelect
                onRemove?.(keyword);
              }}
            >
              x
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="search-history-clear-btn"
      >
        {t.clearHistory}
      </button>
    </section>
  );
}
