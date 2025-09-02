import React, { useEffect, useMemo, useState, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

export const API_BASE = 'http://localhost:5000';

/* -------------------- reusable loader -------------------- */
export async function fetchProducts(endpoint = `${API_BASE}/api/products`) {
  const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${endpoint} ${res.status}`);
  const data = await res.json();

  // Accept array or common shapes like {items: []} or {products: []}
  const list = Array.isArray(data) ? data : (data.items || data.products || []);

  // Normalize for downstream (OrdersPage etc.)
  // Put the spread FIRST so fields below override, and prefer SKU as the identifier.
  return list.map((p, idx) => ({
    ...p,
    id: String(p?.sku ?? p?.id ?? p?._id ?? idx),  // <- prefer SKU for search/display
    name: p?.name ?? 'Unnamed',
    brand: p?.brand ?? '',
    category: p?.category ?? '',
    price: typeof p?.price === 'number' ? p.price : 0,
    rating: typeof p?.rating === 'number' ? p.rating : 0,
    createdAt: p?.createdAt ?? null,
    sku: p?.sku ?? null,                             // keep original too
    tags: Array.isArray(p?.tags) ? p.tags : [],      // ensure tags exist
  }));
}

/* -------------------- fuzzy helpers -------------------- */
const normalize = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function levenshtein(a, b, max = 3) {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (!la || !lb) return Math.max(la, lb);
  if (Math.abs(la - lb) > max) return max + 1;
  const dp = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) dp[j] = j;
  for (let i = 1; i <= la; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j];
      if (a[i - 1] === b[j - 1]) dp[j] = prev;
      else dp[j] = 1 + Math.min(prev, dp[j - 1], dp[j]);
      prev = tmp;
    }
  }
  return dp[lb];
}

function relevanceScore(product, q) {
  if (!q) return 0;
  const name = normalize(product?.name);
  const brand = normalize(product?.brand);
  const category = normalize(product?.category);
  const hay = [name, brand, category].filter(Boolean).join(' ');

  if (name.startsWith(q)) return 1000 - (name.length - q.length);
  if (name.includes(q)) return 900 - name.indexOf(q);

  const tokens = name.split(/\s+/);
  let best = -Infinity;
  for (const t of tokens) {
    const d = levenshtein(t, q, 3);
    if (d <= 3) best = Math.max(best, 800 - d * 50 - Math.abs(t.length - q.length));
  }
  if (best < 0 && hay.includes(q)) best = 600;
  if (best < 0) {
    const d = levenshtein(name, q, 3);
    if (d <= 3) best = 500 - d * 80;
  }
  return best < 0 ? 0 : best;
}

/* -------------------- component -------------------- */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [deleteMode, setDeleteMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [sugIndex, setSugIndex] = useState(-1);

  const { user } = useContext(AuthContext);
  const searchBoxRef = useRef(null);
  const cardRefMap = useRef({});

  // Check admin role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().role === 'admin') setIsAdmin(true);
    };
    checkUserRole();
  }, [user]);

  // Fetch products
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchProducts();
        if (alive) setProducts(list);
      } catch (err) {
        console.error('❌ Failed to load products:', err);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // Filter + sort
  const computed = useMemo(() => {
    const q = normalize(searchQuery);
    const scored = products.map(p => ({
      item: p,
      id: p.id,
      score: q ? relevanceScore(p, q) : 0,
    }));

    const filtered = !q
      ? scored
      : scored.filter(({ item, score }) => {
          if (score > 0) return true;
          const name = normalize(item?.name);
          const brand = normalize(item?.brand);
          const category = normalize(item?.category);
          return name.includes(q) || brand.includes(q) || category.includes(q);
        });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':  return (a.item.price ?? Infinity) - (b.item.price ?? Infinity);
        case 'price_desc': return (b.item.price ?? -Infinity) - (a.item.price ?? -Infinity);
        case 'rating':     return (b.item.rating ?? 0) - (a.item.rating ?? 0);
        case 'newest': {
          const at = a.item.createdAt ?? a.item.id ?? 0;
          const bt = b.item.createdAt ?? b.item.id ?? 0;
          return bt - at;
        }
        default:
          return b.score - a.score;
      }
    });
    return sorted;
  }, [products, searchQuery, sortBy]);

  const filtered = computed.map(x => x.item);

  /* ---- brand autocomplete ---- */
  useEffect(() => {
    const q = normalize(searchQuery);
    if (!q) {
      setSuggestions([]);
      setSugIndex(-1);
      return;
    }
    const brands = new Map();
    for (const p of products) {
      const label = p?.brand?.trim?.();
      if (!label) continue;
      const key = normalize(label);
      if (!key) continue;
      const id = p.id;
      if (brands.has(key)) {
        const v = brands.get(key);
        v.count += 1;
        const tNew = p.createdAt ?? p.id ?? 0;
        if ((v.t ?? 0) < tNew) {
          v.t = tNew;
          v.firstId = id;
        }
      } else {
        brands.set(key, { label, count: 1, firstId: id, t: p.createdAt ?? p.id ?? 0 });
      }
    }
    const rankBrand = (key) => {
      if (key.startsWith(q)) return 1000 - (key.length - q.length);
      if (key.includes(q)) return 900 - key.indexOf(q);
      const d = levenshtein(key, q, 3);
      if (d <= 3) return 800 - d * 60 - Math.abs(key.length - q.length);
      return 0;
    };
    const arr = Array.from(brands.entries())
      .map(([key, v]) => ({
        id: v.firstId,
        label: v.label,
        sub: `${v.count} item${v.count > 1 ? 's' : ''}`,
        score: rankBrand(key),
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    setSuggestions(arr);
    setSugIndex(-1);
  }, [searchQuery, products]);

  useEffect(() => {
    const onClick = (e) => {
      const drop = document.querySelector('.autocomplete');
      if (!drop) return;
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target) &&
        !drop.contains(e.target)
      ) {
        setShowSug(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = products.filter(p => String(p.id) !== String(id));
        setProducts(updated);
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting product.');
    }
  };

  const chooseSuggestion = (s) => {
    if (!s) return;
    setSearchQuery(s.label);
    setShowSug(false);
    setTimeout(() => {
      const el = cardRefMap.current[s.id];
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const onSearchKeyDown = (e) => {
    if (!showSug && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowSug(true);
      return;
    }
    if (!showSug) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSugIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSugIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      chooseSuggestion(suggestions[sugIndex] || suggestions[0]);
    } else if (e.key === 'Escape') {
      setShowSug(false);
    }
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>Browse Products</h2>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        {isAdmin && (
          <div className="mode-options">
            <label>
              <input
                type="checkbox"
                checked={deleteMode}
                onChange={e => setDeleteMode(e.target.checked)}
              /> Delete
            </label>
          </div>
        )}

        {/* Search */}
        <div className="search-wrap" ref={searchBoxRef}>
          <input
            className="search-input small"
            type="text"
            placeholder="Search by brand or product…"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSug(true);
            }}
            onFocus={() => setShowSug(true)}
            onKeyDown={onSearchKeyDown}
            aria-autocomplete="list"
            aria-expanded={showSug}
            aria-controls="brand-suggestions"
          />
          <button
            className="search-btn"
            onClick={() => setShowSug(true)}
            aria-label="Search"
          >
            🔍
          </button>
          {showSug && suggestions.length > 0 && (
            <div className="autocomplete" id="brand-suggestions" role="listbox">
              {suggestions.map((s, idx) => (
                <div
                  key={s.id || s.label + idx}
                  role="option"
                  aria-selected={sugIndex === idx}
                  className={`autocomplete-item ${sugIndex === idx ? 'active' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); chooseSuggestion(s); }}
                  title={s.label}
                >
                  <div className="auto-title">{s.label}</div>
                  <div className="auto-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="spacer" />

        {/* Sort */}
        <div className="sort-wrap">
          <label className="sort-label" htmlFor="sortby">Sort</label>
          <select
            id="sortby"
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Products grid */}
      <div className="products-grid compact">
        {loading ? (
          [...Array(8)].map((_, i) => <div className="product-card skeleton" key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map(product => {
            const pid = product.id;
            return (
              <div
                key={pid}
                className="card-with-admin"
                ref={el => (cardRefMap.current[pid] = el)}
              >
                <ProductCard product={product} />
                {isAdmin && deleteMode && (
                  <button className="admin-btn danger" onClick={() => handleDelete(pid)}>
                    Delete
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p className="helper">No products match your search.</p>
        )}
      </div>
    </div>
  );
}
