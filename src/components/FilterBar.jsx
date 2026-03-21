import React from "react";

export default function FilterBar({
  t,
  sortBy,
  onSortChange,
  filterYear,
  onYearChange,
  yearOptions,
}) {
  return (
    <div className="filter-bar">
      <label className="filter-bar-item">
        <span>{t.sortBy}</span>
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          <option value="popularity">{t.sortPopularity}</option>
          <option value="rating">{t.sortRating}</option>
          <option value="releaseDate">{t.sortReleaseDate}</option>
        </select>
      </label>

      <label className="filter-bar-item">
        <span>{t.filterYear}</span>
        <select value={filterYear} onChange={(e) => onYearChange(e.target.value)}>
          <option value="all">{t.allYears}</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
