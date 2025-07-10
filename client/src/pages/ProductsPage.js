import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  // ✅ Fetch products on page load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        setProducts(data);
        setFiltered(data);
        const uniqueCats = ['All', ...new Set(data.map(p => p.category))];
        setCategories(uniqueCats);
      } catch (err) {
        console.error('❌ Failed to load products:', err);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Filtering & sorting logic
  const filterAndSort = (category, query, order) => {
    let updated = [...products];

    if (category !== 'All') {
      updated = updated.filter(p => p.category === category);
    }

    if (query.trim()) {
      updated = updated.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (order === 'low') {
      updated.sort((a, b) => a.price - b.price);
    } else if (order === 'high') {
      updated.sort((a, b) => b.price - a.price);
    }

    setFiltered(updated);
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    filterAndSort(cat, searchQuery, sortOrder);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterAndSort(selectedCategory, query, sortOrder);
  };

  const handleSortChange = (e) => {
    const order = e.target.value;
    setSortOrder(order);
    filterAndSort(selectedCategory, searchQuery, order);
  };

  return (
    <div className="products-page">
      <h2>Browse Our Products</h2>

      <div className="filter-bar">
        <label>Category:</label>
        <select value={selectedCategory} onChange={handleCategoryChange}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label>Search:</label>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <label>Sort:</label>
        <select value={sortOrder} onChange={handleSortChange}>
          <option value="default">Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>

      <div className="products-grid">
        {filtered.length > 0 ? (
          filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
