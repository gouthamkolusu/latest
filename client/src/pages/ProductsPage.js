import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './ProductsPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [mode, setMode] = useState('view');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');

  const location = useLocation();
  const navigate = useNavigate();
  const categoryParam = new URLSearchParams(location.search).get('category');
  const { user } = useContext(AuthContext);

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().role === 'admin') {
        setIsAdmin(true);
      }
    };
    checkUserRole();
  }, [user]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        setProducts(data);

        const uniqueCats = ['All', ...new Set(data.map(p => p.category))];
        setCategories(uniqueCats);

        const uniqueBrands = [...new Set(data.map(p => p.brand).filter(Boolean))];
        setBrands(uniqueBrands);

        const initialCategory = categoryParam && uniqueCats.includes(categoryParam)
          ? categoryParam : 'All';
        setSelectedCategory(initialCategory);

        filterAndSort(data, initialCategory, [], '', 'default');
      } catch (err) {
        console.error('❌ Failed to load products:', err);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [categoryParam]);

  // Filtering & sorting logic
  const filterAndSort = (allProducts, category, brands, query, order) => {
    let updated = [...allProducts];

    if (category !== 'All') {
      updated = updated.filter(p => p.category === category);
    }
    if (brands.length > 0) {
      updated = updated.filter(p => brands.includes(p.brand));
    }
    if (query.trim()) {
      updated = updated.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    }

    if (order === 'low') updated.sort((a, b) => a.price - b.price);
    else if (order === 'high') updated.sort((a, b) => b.price - a.price);

    setFiltered(updated);
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = products.filter(p => p.id !== id);
        setProducts(updated);
        filterAndSort(updated, selectedCategory, selectedBrands, searchQuery, sortOrder);
      } else alert('Failed to delete product.');
    } catch (err) {
      console.error(err);
      alert('Error deleting product.');
    }
  };

  // Handle mode like radio buttons but visually checkboxes
  const handleModeChange = (newMode) => {
    setMode(prev => (prev === newMode ? 'view' : newMode));
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>Browse Products {selectedCategory !== 'All' && `› ${selectedCategory}`}</h2>
      </div>

      {/* Single-line filter bar */}
      <div className="filter-bar">
        {isAdmin && (
          <div className="mode-options">
            <label>
              <input
                type="checkbox"
                checked={mode === 'view'}
                onChange={() => handleModeChange('view')}
              /> View
            </label>
            <label>
              <input
                type="checkbox"
                checked={mode === 'edit'}
                onChange={() => handleModeChange('edit')}
              /> Edit
            </label>
            <label>
              <input
                type="checkbox"
                checked={mode === 'delete'}
                onChange={() => handleModeChange('delete')}
              /> Delete
            </label>
          </div>
        )}

        <select
          value={selectedCategory}
          onChange={e => {
            setSelectedCategory(e.target.value);
            filterAndSort(products, e.target.value, selectedBrands, searchQuery, sortOrder);
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            filterAndSort(products, selectedCategory, selectedBrands, e.target.value, sortOrder);
          }}
        />

        <select
          value={sortOrder}
          onChange={e => {
            setSortOrder(e.target.value);
            filterAndSort(products, selectedCategory, selectedBrands, searchQuery, e.target.value);
          }}
        >
          <option value="default">Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>

        <select value={view} onChange={e => setView(e.target.value)}>
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </div>

      {/* Brand filter chips */}
      <div className="brand-chips">
        {brands.map(b => (
          <span
            key={b}
            className={`chip ${selectedBrands.includes(b) ? 'selected' : ''}`}
            onClick={() => {
              const newSelected = selectedBrands.includes(b)
                ? selectedBrands.filter(x => x !== b)
                : [...selectedBrands, b];
              setSelectedBrands(newSelected);
              filterAndSort(products, selectedCategory, newSelected, searchQuery, sortOrder);
            }}
          >
            {b}
          </span>
        ))}
      </div>

      {/* Products list */}
      <div className={`products-grid ${view}`}>
        {loading ? (
          [...Array(8)].map((_, i) => <div className="product-card skeleton" key={i}></div>)
        ) : filtered.length > 0 ? (
          filtered.map(product => (
            <div
              key={product.id}
              className={`product-card ${view}`}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <img src={product.image} alt={product.name} loading="lazy" />
              <h4>{product.name}</h4>
              <p>${Number(product.price || 0).toFixed(2)}</p>

              {isAdmin && mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/edit/${product.id}`);
                  }}
                >
                  Edit
                </button>
              )}

              {isAdmin && mode === 'delete' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(product.id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
