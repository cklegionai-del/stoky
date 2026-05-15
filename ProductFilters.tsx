'use client';

import { useState } from 'react';

export default function ProductFilters({ onFilterChange }) {
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    onFilterChange({ category: value });
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setPriceRange(value);
    onFilterChange({ priceRange: value });
  };

  return (
    <div className="product-filters">
      <select value={category} onChange={handleCategoryChange}>
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="books">Books</option>
      </select>
      
      <select value={priceRange} onChange={handlePriceChange}>
        <option value="">All Prices</option>
        <option value="0-50">Under $50</option>
        <option value="50-100">$50 - $100</option>
        <option value="100+">Over $100</option>
      </select>
    </div>
  );
}
