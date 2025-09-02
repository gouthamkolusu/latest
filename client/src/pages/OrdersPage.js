import React, { useEffect, useMemo, useRef, useState } from "react";
import "./OrdersPage.css";

// Make Orders independent (no import from ProductsPage)
const API_BASE = "http://localhost:5000";
const PRODUCTS_ENDPOINT = `${API_BASE}/api/products`;

const DEFAULT_TAX_RATE = 0.0;
const STORAGE_KEY = "pickup_order_draft_v1";

/* -------------------- exact loader for your JSON -------------------- */
async function fetchProducts() {
  const res = await fetch(PRODUCTS_ENDPOINT, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${PRODUCTS_ENDPOINT} ${res.status}`);
  const data = await res.json();

  const list = Array.isArray(data) ? data : [];
  const normalized = list.map((p, idx) => ({
    id: String(p?.upc ?? p?.id ?? idx), // show UPC first so users can search by UPC
    name: p?.name ?? "Unnamed",
    brand: (p?.brand ?? "").trim(),
    price: typeof p?.price === "number" ? p.price : Number(p?.price) || 0,
    category: p?.category ?? "",
    upc: p?.upc ?? null,
    image: p?.image || (Array.isArray(p?.images) ? p.images[0] : ""),
    raw: p,
  }));

  console.log("[ORDERS] fetched products:", {
    endpoint: PRODUCTS_ENDPOINT,
    count: normalized.length,
    sample: normalized[0],
  });

  return normalized;
}

/* -------------------- utils -------------------- */
function currency(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function emptyOrder() {
  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return {
    orderNumber: "",
    status: "Draft",
    customer: { name: "", phone: "", company: "", email: "" },
    pickupDate: isoDate,
    pickupTime: `${hh}:${mm}`,
    purchaseOrder: "",
    notes: "",
    taxRate: DEFAULT_TAX_RATE,
    discount: 0,
    items: [],
  };
}

const askUser = (m) => (typeof window !== "undefined" && window.confirm ? window.confirm(m) : true);

export default function OrdersPage() {
  const [order, setOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : emptyOrder();
    } catch {
      return emptyOrder();
    }
  });

  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Load products
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingProducts(true);
      try {
        const list = await fetchProducts();
        if (alive) setAllProducts(list);
      } catch (err) {
        console.error("❌ Failed to load products for Orders:", err);
        setError(
          err?.message ||
            "Failed to load products. Is the server running and CORS enabled for http://localhost:3000?"
        );
      }
      if (alive) setLoadingProducts(false);
    })();
    return () => { alive = false; };
  }, []);

  // Autosave draft
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch {}
  }, [order]);

  // Search by id (UPC/ID), name, brand, category
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProducts.slice(0, 100);
    return allProducts
      .filter((p) => {
        const hay = `${p.id ?? ""} ${p.upc ?? ""} ${p.name ?? ""} ${p.brand ?? ""} ${p.category ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 100);
  }, [allProducts, search]);

  const totals = useMemo(() => {
    const subtotal = order.items.reduce((s, it) => s + it.qty * it.price, 0);
    const discount = Number(order.discount || 0);
    const taxedBase = Math.max(0, subtotal - discount);
    const tax = taxedBase * (Number(order.taxRate) || 0);
    const total = taxedBase + tax;
    return { subtotal, discount, tax, total };
  }, [order]);

  function addItem(product) {
    setOrder((prev) => {
      const idx = prev.items.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const items = prev.items.slice();
        items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
        return { ...prev, items };
      }
      const newItem = {
        id: product.id, // shows as “SKU / UPC” in the table
        name: product.name,
        price: Number(product.price) || 0,
        qty: 1,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
    setSearchOpen(false);
    setSearch("");
    setTimeout(() => searchBoxRef.current?.focus(), 0);
  }

  function updateItem(id, field, value) {
    setOrder((prev) => {
      const items = prev.items.map((i) =>
        i.id === id
          ? { ...i, [field]: field === "qty" || field === "price" ? Number(value) || 0 : value }
          : i
      );
      return { ...prev, items };
    });
  }

  function removeItem(id) { setOrder((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) })); }
  function clearOrder() {
    if (!askUser("Clear this draft order?")) return;
    setOrder(emptyOrder()); setSearch(""); setSearchOpen(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  function printOrder() { window.print(); }
  function fakePersist(status) { setOrder((prev) => ({ ...prev, status })); alert(`Order set to "${status}".`); }

  const canSubmit = order.customer.name && order.items.length > 0;

  return (
    <div className="orders-wrapper">
      <header className="orders-header">
        <div className="orders-title">
          <h1>Create Pickup Order</h1>
          <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
        </div>
        <div className="orders-actions">
          <button className="btn secondary" onClick={clearOrder}>Clear</button>
          <button className="btn secondary" onClick={printOrder}>Print</button>
          <button className="btn" disabled={!canSubmit} onClick={() => fakePersist("Ready")}>Mark Ready</button>
          <button className="btn primary" disabled={!canSubmit} onClick={() => fakePersist("Completed")}>Complete</button>
        </div>
      </header>

      <section className="card">
        <div className="items-header">
          <div className="items-title">
            <h2>Items</h2>
            <div className="search">
              <input
                ref={searchBoxRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder={loadingProducts ? "Loading products…" : "Search by name, brand, UPC/ID, category"}
                aria-label="Search products"
                disabled={loadingProducts}
              />
              <button className="btn small" onClick={() => setSearchOpen((v) => !v)} disabled={loadingProducts}>
                {searchOpen ? "Hide" : "Browse"}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="results">
              {error && <div className="empty" style={{ color: "crimson" }}>{error}</div>}
              {!error && results.length === 0 && <div className="empty">{loadingProducts ? "Loading…" : "No matches"}</div>}
              {!error && results.map((p) => (
                <button key={p.id} className="result" onClick={() => addItem(p)}>
                  <div>
                    <div className="sku">{p.upc || p.id}</div>
                    <div className="name">
                      {p.name} {p.brand ? <span style={{ color: "#6b7280" }}>• {p.brand}</span> : null}
                    </div>
                    {p.category ? <div className="muted">{p.category}</div> : null}
                  </div>
                  <div className="price">{currency(p.price)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="table-wrap">
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: "18rem" }}>SKU / UPC</th>
                <th>Name</th>
                <th className="num">Price</th>
                <th className="num">Qty</th>
                <th className="num">Subtotal</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 && (
                <tr><td colSpan={6} className="empty-row">No items yet — add from search above.</td></tr>
              )}
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="sku-cell">{it.id}</td>
                  <td>{it.name}</td>
                  <td className="num">
                    <input
                      className="cell-input" type="number" min="0" step="0.01"
                      value={it.price} onChange={(e) => updateItem(it.id, "price", e.target.value)}
                    />
                  </td>
                  <td className="num">
                    <input
                      className="cell-input" type="number" min="0" step="1"
                      value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)}
                    />
                  </td>
                  <td className="num">{currency(it.qty * it.price)}</td>
                  <td className="num">
                    <button className="icon-btn" title="Remove" onClick={() => removeItem(it.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="totals">
          <div className="totals-left">
            <div className="field small">
              <label>Discount</label>
              <input
                type="number" min="0" step="0.01"
                value={order.discount}
                onChange={(e) => setOrder((o) => ({ ...o, discount: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="field small">
              <label>Tax Rate</label>
              <input
                type="number" min="0" step="0.0001"
                value={order.taxRate}
                onChange={(e) => setOrder((o) => ({ ...o, taxRate: Number(e.target.value) || 0 }))}
              />
              <span className="muted">% (e.g., 8.25 → 0.0825)</span>
            </div>
          </div>
          <div className="totals-right">
            <div className="row"><span>Subtotal</span><strong>{currency(totals.subtotal)}</strong></div>
            <div className="row"><span>Discount</span><strong>- {currency(order.discount || 0)}</strong></div>
            <div className="row"><span>Tax</span><strong>{currency(totals.tax)}</strong></div>
            <div className="row total"><span>Total</span><strong>{currency(totals.total)}</strong></div>
          </div>
        </div>
      </section>

      <footer className="orders-footer">
        <button className="btn" onClick={() => fakePersist("Draft")}>Save Draft</button>
        <button className="btn" disabled={!canSubmit} onClick={() => fakePersist("Ready")}>Mark Ready</button>
        <button className="btn primary" disabled={!canSubmit} onClick={() => fakePersist("Completed")}>Complete</button>
      </footer>
    </div>
  );
}
