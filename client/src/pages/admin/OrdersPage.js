// client/src/pages/admin/OrdersPage.js
import { useEffect, useState } from "react";
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
    pending: { bg: "#fef9c3", color: "#ca8a04", label: "Pending" },
    failed: { bg: "#fee2e2", color: "#dc2626", label: "Failed" },
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
        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (e) {
        if (!cancelled) setError("Failed to load orders.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loading, user]);

  return (
    <main style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827" }}>Admin Orders</h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
          {orders.length} order{orders.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {busy && (
        <div style={{ textAlign: "center", padding: 80, color: "#6b7280", fontSize: 15 }}>Loading orders…</div>
      )}
      {!busy && error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: 16, borderRadius: 12 }}>{error}</div>
      )}
      {!busy && !error && orders.length === 0 && (
        <div style={{ textAlign: "center", padding: 80, color: "#6b7280", fontSize: 15 }}>No orders yet.</div>
      )}

      {!busy && !error && orders.length > 0 && (
        <div style={{ display: "grid", gap: 16 }}>
          {orders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const total = `$${(o.amountTotal / 100).toFixed(2)} ${(o.currency || "USD").toUpperCase()}`;
            const date = o.createdAt ? new Date(o.createdAt).toLocaleString() : "—";

            return (
              <div key={o.id} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                overflow: "hidden",
              }}>
                {/* Order Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
                  flexWrap: "wrap", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 15, color: "#111827" }}>
                      #{numericOrderId(o.id)}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 13 }}>{date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>{total}</span>
                    <StatusBadge status={o.paymentStatus || o.status} />
                  </div>
                </div>

                {/* Customer */}
                <div style={{ padding: "10px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 13, color: "#374151" }}>
                  <span style={{ color: "#9ca3af", marginRight: 8 }}>Customer:</span>
                  <span style={{ fontWeight: 600 }}>{o.email || "—"}</span>
                </div>

                {/* Items */}
                <div style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {items.map((it, idx) => {
                    const src = resolveImage(it);
                    const name = it.name || it.title || it.description || "Item";
                    const qty = it.quantity || 1;
                    return (
                      <div key={idx} style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 6, width: 90,
                      }}>
                        {src ? (
                          <img src={src} alt={name} style={{
                            width: 80, height: 80, objectFit: "cover",
                            borderRadius: 10, border: "1px solid #e5e7eb",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                          }}
                            onError={e => e.currentTarget.style.display = "none"} />
                        ) : (
                          <div style={{
                            width: 80, height: 80, background: "#f3f4f6",
                            borderRadius: 10, border: "1px solid #e5e7eb",
                          }} />
                        )}
                        <div style={{
                          fontSize: 11, color: "#374151", textAlign: "center",
                          lineHeight: 1.3, maxWidth: 88,
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {name}
                        </div>
                        {qty > 1 && (
                          <span style={{ fontSize: 11, color: "#6b7280" }}>×{qty}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}