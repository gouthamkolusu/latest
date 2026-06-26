// client/src/pages/admin/OrdersPage.js
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import { API_BASE } from "../../lib/apiBase";

function numericOrderId(id) {
  if (!id) return "0000000000";
  let h = 5381;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  const n = (h >>> 0) % 10000000000;
  return String(n).padStart(10, "0");
}

function generateTracking() {
  return String(Math.floor(Math.random() * 9000000000) + 1000000000);
}

function resolveImage(it) {
  if (!it) return null;
  return (
    it.image ||
    (Array.isArray(it.images) && it.images[0]) ||
    it.product?.image ||
    (Array.isArray(it.product?.images) && it.product.images[0]) ||
    null
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const colors = {
    paid: { bg: "#dcfce7", color: "#16a34a", label: "Paid" },
    processing: { bg: "#dbeafe", color: "#2563eb", label: "Processing" },
    shipped: { bg: "#f3e8ff", color: "#7c3aed", label: "Shipped" },
    delivered: { bg: "#d1fae5", color: "#059669", label: "Delivered" },
    pending: { bg: "#fef9c3", color: "#ca8a04", label: "Pending" },
    failed: { bg: "#fee2e2", color: "#dc2626", label: "Failed" },
    cancelled: { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
  };
  const c = colors[s] || { bg: "#f3f4f6", color: "#6b7280", label: status || "—" };
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "4px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 700, textTransform: "capitalize",
      whiteSpace: "nowrap",
    }}>
      {c.label}
    </span>
  );
}

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackingInputs, setTrackingInputs] = useState({});
  const [savingTracking, setSavingTracking] = useState({});

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    if (!user) { setBusy(false); setError("You must be signed in."); return; }

    (async () => {
      try {
        setBusy(true);
        const token = await getAuth().currentUser.getIdToken(true);
        const res = await fetch(`${API_BASE}/api/orders/all`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          const orders = Array.isArray(data.orders) ? data.orders : [];
          setOrders(orders);
          // Pre-fill tracking inputs
          const inputs = {};
          orders.forEach(o => { if (o.trackingNumber) inputs[o.id] = o.trackingNumber; });
          setTrackingInputs(inputs);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load orders.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loading, user]);

  // Revenue summary
  const summary = useMemo(() => {
    const total = orders.reduce((s, o) => s + (o.amountTotal || 0) / 100, 0);
    const paid = orders.filter(o => (o.paymentStatus || o.status || "").toLowerCase() === "paid").length;
    return { total, paid, count: orders.length };
  }, [orders]);

  // Filtered orders
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const s = (o.paymentStatus || o.status || "").toLowerCase();
      if (statusFilter !== "all" && s !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const email = (o.email || "").toLowerCase();
        const id = numericOrderId(o.id);
        const tracking = (o.trackingNumber || "").toLowerCase();
        if (!email.includes(q) && !id.includes(q) && !tracking.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  async function saveTracking(orderId) {
    const tracking = trackingInputs[orderId] || generateTracking();
    setTrackingInputs(prev => ({ ...prev, [orderId]: tracking }));
    setSavingTracking(prev => ({ ...prev, [orderId]: true }));
    try {
      const token = await getAuth().currentUser.getIdToken(true);
      await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trackingNumber: tracking }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, trackingNumber: tracking } : o));
    } catch {}
    setSavingTracking(prev => ({ ...prev, [orderId]: false }));
  }

  const TABS = ["all", "paid", "processing", "shipped", "delivered", "failed"];

  return (
    <main style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 20px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827" }}>Admin Orders</h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>{summary.count} orders total</p>
      </div>

      {/* Revenue Summary */}
      {!busy && !error && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total Orders", value: summary.count, color: "#2563eb" },
            { label: "Paid Orders", value: summary.paid, color: "#16a34a" },
            { label: "Total Revenue", value: `$${summary.total.toFixed(2)}`, color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, minWidth: 160, background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by email, order ID or tracking..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 240, height: 40, padding: "0 14px",
            border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14,
            outline: "none", background: "#fff",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setStatusFilter(tab)} style={{
              height: 36, padding: "0 14px", borderRadius: 8, cursor: "pointer",
              border: statusFilter === tab ? "none" : "1px solid #d1d5db",
              background: statusFilter === tab ? "#2563eb" : "#fff",
              color: statusFilter === tab ? "#fff" : "#374151",
              fontWeight: 600, fontSize: 13, textTransform: "capitalize",
            }}>
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {busy && <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>Loading orders…</div>}
      {!busy && error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: 16, borderRadius: 12 }}>{error}</div>}
      {!busy && !error && filtered.length === 0 && <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>No orders found.</div>}

      {/* Table */}
      {!busy && !error && filtered.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Order ID", "Customer", "Items", "Total", "Status", "Tracking", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                      #{numericOrderId(o.id)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#374151", maxWidth: 180 }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.email || "—"}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {Array.isArray(o.items) && o.items.slice(0, 4).map((it, idx) => {
                          const src = resolveImage(it);
                          return src ? (
                            <img key={idx} src={src} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                              onError={e => e.currentTarget.style.display = "none"} />
                          ) : null;
                        })}
                        {o.items?.length > 4 && (
                          <span style={{ fontSize: 12, color: "#6b7280" }}>+{o.items.length - 4} more</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                      ${(o.amountTotal / 100).toFixed(2)} {(o.currency || "USD").toUpperCase()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={o.paymentStatus || o.status} />
                    </td>
                    <td style={{ padding: "14px 16px", minWidth: 220 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          value={trackingInputs[o.id] || ""}
                          onChange={e => setTrackingInputs(prev => ({ ...prev, [o.id]: e.target.value }))}
                          placeholder="Tracking number"
                          style={{
                            width: 130, height: 32, padding: "0 8px",
                            border: "1px solid #d1d5db", borderRadius: 7,
                            fontSize: 12, fontFamily: "monospace",
                          }}
                        />
                        <button onClick={() => saveTracking(o.id)}
                          disabled={savingTracking[o.id]}
                          style={{
                            height: 32, padding: "0 10px", borderRadius: 7,
                            border: "none", background: "#2563eb", color: "#fff",
                            fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                          }}>
                          {savingTracking[o.id] ? "…" : trackingInputs[o.id] ? "Save" : "Generate"}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6b7280", whiteSpace: "nowrap", fontSize: 13 }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}