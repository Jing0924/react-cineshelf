import React from "react";

export default function SearchBar({ query, setQuery, placeholder }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-bar-input"
      />
    </div>
  );
}
