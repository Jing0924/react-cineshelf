import React from "react";

export default function SearchBar({
  query,
  setQuery,
  placeholder,
  aiMode,
  onToggleAi,
  aiToggleLabel,
  aiProvider,
  onAiProviderChange,
  onAiSubmit,
  aiSubmitLabel,
  aiSubmitDisabled,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (aiMode && onAiSubmit) onAiSubmit();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar-row">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-bar-input"
          aria-label={placeholder}
        />
        <button
          type="button"
          className={`search-bar-ai-toggle ${aiMode ? "is-active" : ""}`}
          onClick={onToggleAi}
        >
          {aiToggleLabel}
        </button>
        {aiMode && (
          <div className="ai-provider-toggle" role="group" aria-label="AI Provider">
            <button
              type="button"
              className={`ai-provider-btn ${aiProvider === "ollama" ? "is-active" : ""}`}
              onClick={() => onAiProviderChange?.("ollama")}
            >
              Local
            </button>
            <button
              type="button"
              className={`ai-provider-btn ${aiProvider === "groq" ? "is-active" : ""}`}
              onClick={() => onAiProviderChange?.("groq")}
            >
              Groq
            </button>
          </div>
        )}
        {aiMode && (
          <button
            type="submit"
            className="search-bar-ai-submit"
            disabled={aiSubmitDisabled}
          >
            {aiSubmitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
