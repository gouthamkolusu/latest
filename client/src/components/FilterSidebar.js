import React from 'react';
import './FilterSidebar.css';

function FilterSidebar({ brands, tags, selectedBrands, selectedTags, toggleBrand, toggleTag }) {
  return (
    <div className="filter-sidebar">
      <div className="filter-group">
        <h4>Brands</h4>
        <div className="chip-container">
          {brands.map((brand) => (
            <button
              key={brand}
              className={`chip ${selectedBrands.includes(brand) ? 'active' : ''}`}
              onClick={() => toggleBrand(brand)}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>Tags</h4>
        <div className="chip-container">
          {tags.map((tag) => (
            <button
              key={tag}
              className={`chip ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;
