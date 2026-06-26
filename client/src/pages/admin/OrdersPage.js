// client/src/pages/admin/OrdersPage.js
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import { API_BASE } from "../../lib/apiBase";

/** Deterministic string -> 10-digit numeric ID for display */
function numericOrderId(id) {
  if (!id) return "0000000000";
  let h = 5381;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  const n = (h >>> 0) % 10000000000;
  return String(n).padStart(10, "0");
}

function resolveImage(it) {
  if (!it) return "/placeholder.png";
  return (
    it.image ||
    (Array.isArray(it.images) && it.images[0]) ||
    it.product?.image ||
    (Array.isArray(it.product?.images) && it.product.images[0]) ||
    "/placeholder.png"
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

    if (!user) {
      setBusy(false);
      setError("You must be signed in to view admin orders.");
      return;
    }

    (async () => {
      try {
        setBusy(true);
        const token = await getAuth().currentUser.getIdToken(true);

        const res = await fetch(`${API_BASE}/api/orders/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load admin orders.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  return (
    <main style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 16px" }}>
      <h1>Admin Orders</h1>
      {busy && <p>Loading…</p>}
      {!busy && error && <p style={{ color: "crimson" }}>{error}</p>}
      {!busy && !error && orders.length === 0 && <p>No orders yet.</p>}
      {!busy && !error && orders.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th align="left">Order ID</th>
                <th align="left">Email</th>
                <th align="left">Items</th>
                <th align="left">Total</th>
                <th align="left">Status</th>
                <th align="left">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{numericOrderId(o.id)}</td>
                  <td>{o.email || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {Array.isArray(o.items) &&
                        o.items.map((it, idx) => (
                          <img
                            key={idx}
                            src={resolveImage(it)}
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                        ))}
                    </div>
                  </td>
                  <td>
                    {(o.amountTotal / 100).toFixed(2)}{" "}
                    {(o.currency || "").toUpperCase()}
                  </td>
                  <td>{o.paymentStatus || o.status || "—"}</td>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
