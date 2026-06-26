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
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 700, textTransform: "capitalize",
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
    <main style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Admin Orders</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {busy && (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading orders…</div>
      )}
      {!busy && error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: 16, borderRadius: 12 }}>{error}</div>
      )}
      {!busy && !error && orders.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>No orders yet.</div>
      )}

      {!busy && !error && orders.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Order ID", "Customer", "Items", "Total", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                      #{numericOrderId(o.id)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#374151" }}>
                      <div style={{ fontWeight: 600 }}>{o.email || "—"}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {Array.isArray(o.items) && o.items.map((it, idx) => {
                          const src = resolveImage(it);
                          return src ? (
                            <img key={idx} src={src} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                              onError={e => e.currentTarget.style.display = "none"} />
                          ) : null;
                        })}
                        <span style={{ alignSelf: "center", color: "#6b7280", fontSize: 13 }}>
                          {o.items?.length || 0} item{o.items?.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                      ${(o.amountTotal / 100).toFixed(2)} {(o.currency || "USD").toUpperCase()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={o.paymentStatus || o.status} />
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6b7280", whiteSpace: "nowrap" }}>
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