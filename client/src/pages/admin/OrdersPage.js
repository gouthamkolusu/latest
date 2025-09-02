// OrdersPage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./OrdersPage.css";

/**
 * Minimal in-page product catalog (replace with your Odoo/API later).
 * Use SKU for fast scanning and name for human search.
 */
const MOCK_PRODUCTS = [
  { id: "SKU-1001", name: "12oz Paper Cups - 1000ct", price: 38.5 },
  { id: "SKU-1002", name: "Lids - 12oz - 1000ct", price: 29.0 },
  { id: "SKU-2001", name: "Napkins - 5000ct", price: 21.75 },
  { id: "SKU-3001", name: "Plastic Spoons - 1000ct", price: 14.2 },
  { id: "SKU-4001", name: "Corrugated Boxes 12x12x12 - 25ct", price: 32.0 },
];

const DEFAULT_TAX_RATE = 0.0; // Set your local tax if needed (e.g., 0.0825)
const STORAGE_KEY = "pickup_order_draft_v1";

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
    orderNumber: "", // optional, can auto-assign server-side
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

export default function OrdersPage() {
  const [order, setOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : emptyOrder();
    } catch {
      return emptyOrder();
    }
  });
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Autosave draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {}
  }, [order]);

  // Simple product search
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter(
      p =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    );
  }, [search]);

  const totals = useMemo(() => {
    const subtotal = order.items.reduce((s, it) => s + it.qty * it.price, 0);
    const discount = Number(order.discount || 0);
    const taxedBase = Math.max(0, subtotal - discount);
    const tax = taxedBase * (Number(order.taxRate) || 0);
    const total = taxedBase + tax;
    return { subtotal, discount, tax, total };
  }, [order]);

  function addItem(product) {
    setOrder(prev => {
      const idx = prev.items.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const items = prev.items.slice();
        items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
        return { ...prev, items };
      }
      const newItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
    setSearchOpen(false);
    setSearch("");
    // refocus search for fast scanning
    setTimeout(() => searchBoxRef.current?.focus(), 0);
  }

  function updateItem(id, field, value) {
    setOrder(prev => {
      const items = prev.items.map(i =>
        i.id === id ? { ...i, [field]: field === "qty" || field === "price" ? Number(value) || 0 : value } : i
      );
      return { ...prev, items };
    });
  }

  function removeItem(id) {
    setOrder(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  }

  function clearOrder() {
    if (!confirm("Clear this draft order?")) return;
    setOrder(emptyOrder());
    setSearch("");
    setSearchOpen(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function printOrder() {
    window.print();
  }

  function fakePersist(status) {
    // Replace with real POST to your backend or Odoo endpoint
    setOrder(prev => ({ ...prev, status }));
    alert(`Order set to "${status}". Replace with real API call to persist.`);
  }

  const canSubmit = order.customer.name && order.items.length > 0;

  return (
    <div className="orders-wrapper">
      <header className="orders-header">
        <div className="orders-title">
          <h1>Create Pickup Order</h1>
          <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
        </div>
        <div className="orders-actions">
          <button className="btn secondary" onClick={clearOrder} title="Clear draft">Clear</button>
          <button className="btn secondary" onClick={printOrder} title="Print">Print</button>
          <button className="btn" disabled={!canSubmit} onClick={() => fakePersist("Ready")}>
            Mark Ready for Pickup
          </button>
          <button className="btn primary" disabled={!canSubmit} onClick={() => fakePersist("Completed")}>
            Complete Order
          </button>
        </div>
      </header>

      <section className="card grid-2">
        <div className="field">
          <label>Customer Name<span className="req">*</span></label>
          <input
            type="text"
            placeholder="Full name"
            value={order.customer.name}
            onChange={e => setOrder(o => ({ ...o, customer: { ...o.customer, name: e.target.value } }))}
          />
        </div>
        <div className="field">
          <label>Company</label>
          <input
            type="text"
            placeholder="Optional"
            value={order.customer.company}
            onChange={e => setOrder(o => ({ ...o, customer: { ...o.customer, company: e.target.value } }))}
          />
        </div>
        <div className="field">
          <label>Phone</label>
          <input
            type="tel"
            placeholder="(555) 555-5555"
            value={order.customer.phone}
            onChange={e => setOrder(o => ({ ...o, customer: { ...o.customer, phone: e.target.value } }))}
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="name@company.com"
            value={order.customer.email}
            onChange={e => setOrder(o => ({ ...o, customer: { ...o.customer, email: e.target.value } }))}
          />
        </div>
        <div className="field">
          <label>Pickup Date</label>
          <input
            type="date"
            value={order.pickupDate}
            onChange={e => setOrder(o => ({ ...o, pickupDate: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Pickup Time</label>
          <input
            type="time"
            value={order.pickupTime}
            onChange={e => setOrder(o => ({ ...o, pickupTime: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>PO #</label>
          <input
            type="text"
            placeholder="Optional purchase order"
            value={order.purchaseOrder}
            onChange={e => setOrder(o => ({ ...o, purchaseOrder: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Status</label>
          <select
            value={order.status}
            onChange={e => setOrder(o => ({ ...o, status: e.target.value }))}
          >
            <option>Draft</option>
            <option>Ready</option>
            <option>Completed</option>
            <option>Canceled</option>
          </select>
        </div>
        <div className="field field-notes">
          <label>Notes</label>
          <textarea
            rows={2}
            placeholder="Any special handling, pallet requirements, etc."
            value={order.notes}
            onChange={e => setOrder(o => ({ ...o, notes: e.target.value }))}
          />
        </div>
      </section>

      <section className="card">
        <div className="items-header">
          <div className="items-title">
            <h2>Items</h2>
            <div className="search">
              <input
                ref={searchBoxRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Scan or search by SKU / name"
                aria-label="Search products"
              />
              <button className="btn small" onClick={() => setSearchOpen((v) => !v)}>
                {searchOpen ? "Hide" : "Browse"}
              </button>
            </div>
          </div>
          {searchOpen && (
            <div className="results">
              {results.length === 0 && <div className="empty">No matches</div>}
              {results.map(p => (
                <button key={p.id} className="result" onClick={() => addItem(p)}>
                  <div>
                    <div className="sku">{p.id}</div>
                    <div className="name">{p.name}</div>
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
                <th style={{width:"18rem"}}>SKU</th>
                <th>Name</th>
                <th className="num">Price</th>
                <th className="num">Qty</th>
                <th className="num">Subtotal</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">No items yet — add from search above.</td>
                </tr>
              )}
              {order.items.map(it => (
                <tr key={it.id}>
                  <td className="sku-cell">{it.id}</td>
                  <td>{it.name}</td>
                  <td className="num">
                    <input
                      className="cell-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.price}
                      onChange={e => updateItem(it.id, "price", e.target.value)}
                    />
                  </td>
                  <td className="num">
                    <input
                      className="cell-input"
                      type="number"
                      min="0"
                      step="1"
                      value={it.qty}
                      onChange={e => updateItem(it.id, "qty", e.target.value)}
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

        <div className="totals">
          <div className="totals-left">
            <div className="field small">
              <label>Discount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={order.discount}
                onChange={e => setOrder(o => ({ ...o, discount: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="field small">
              <label>Tax Rate</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={order.taxRate}
                onChange={e => setOrder(o => ({ ...o, taxRate: Number(e.target.value) || 0 }))}
              />
              <span className="muted">% (e.g., 8.25 → 0.0825)</span>
            </div>
          </div>
          <div className="totals-right">
            <div className="row">
              <span>Subtotal</span>
              <strong>{currency(totals.subtotal)}</strong>
            </div>
            <div className="row">
              <span>Discount</span>
              <strong>- {currency(order.discount || 0)}</strong>
            </div>
            <div className="row">
              <span>Tax</span>
              <strong>{currency(totals.tax)}</strong>
            </div>
            <div className="row total">
              <span>Total</span>
              <strong>{currency(totals.total)}</strong>
            </div>
          </div>
        </div>
      </section>

      <footer className="orders-footer">
        <button
          className="btn"
          onClick={() => fakePersist("Draft")}
        >
          Save Draft
        </button>
        <button
          className="btn"
          disabled={!canSubmit}
          onClick={() => fakePersist("Ready")}
        >
          Mark Ready for Pickup
        </button>
        <button
          className="btn primary"
          disabled={!canSubmit}
          onClick={() => fakePersist("Completed")}
        >
          Complete Order
        </button>
      </footer>
    </div>
  );
}
