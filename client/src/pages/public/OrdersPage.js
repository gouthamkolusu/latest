// client/src/pages/public/OrdersPage.js
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, API_BASE } from "../../lib/apiClient";
import "./OrdersPage.css";

/* Stable 10-digit numeric order id for display */
function numericOrderId(id) {
  if (!id) return "0000000000";
  let h = 5381;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  const n = (h >>> 0) % 10000000000;
  return String(n).padStart(10, "0");
}

const STATUS_TEXT = {
  paid: "Processing in the warehouse",
  processing: "Processing in the warehouse",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PLACEHOLDER = "/placeholder.png";

function usd(cents = 0) {
  const v = Number(cents || 0) / 100;
  try { return v.toLocaleString(undefined, { style: "currency", currency: "USD" }); }
  catch { return `$${v.toFixed(2)}`; }
}

function resolveImageUrl(raw) {
  if (!raw) return null;
  const u = String(raw).trim();
  if (/^(https?:)?\/\//i.test(u) || u.startsWith("data:")) return u;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  if (u.startsWith("uploads/")) return `${API_BASE}/${u}`;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return `${API_BASE}/uploads/${u}`;
}

function resolveName(it = {}) {
  return (
    it.name || it.title || it.description ||
    it.product?.name || it.product?.title ||
    it.price?.product?.name || it.price?.product?.title ||
    it.metadata?.name || "Item"
  );
}
function shortName(name = "", max = 52) {
  const s = String(name).trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Extract a human SKU from text like "15-293 ..." or "ABC-1234" */
function extractSkuFromText(text = "") {
  const t = String(text || "");
  // 1) Most common: purely numeric two/three + three/four digits (e.g., 15-293, 120-4500)
  const m1 = t.match(/\b(\d{2,3}-\d{3,4})\b/);
  if (m1) return m1[1];
  // 2) Alpha-numeric patterns: AA-123, ABC-1234, 12-ABC34, etc. (keep it short/human)
  const m2 = t.match(/\b([A-Za-z0-9]{2,4}-[A-Za-z0-9]{3,5})\b/);
  if (m2) return m2[1];
  return null;
}

function normalizeItem(it = {}) {
  const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
  const unit =
    it.unit_amount ??
    it.price?.unit_amount ??
    (it.amount_subtotal && qty ? Math.round(it.amount_subtotal / qty) : undefined) ??
    (it.amount_total && qty ? Math.round(it.amount_total / qty) : undefined);

  const imgCandidate =
    it.image || it.imageUrl || it.image_url || it.thumbnail ||
    (Array.isArray(it.images) && it.images[0]) ||
    it.product?.image ||
    (Array.isArray(it.product?.images) && it.product.images[0]) ||
    it.price?.product?.image ||
    (Array.isArray(it.price?.product?.images) && it.price.product.images[0]) ||
    it.metadata?.image;

  const nameResolved = resolveName(it);
  // Prefer explicit sku from backend → else parse it from name/title → else fall back to Stripe id
  const parsedSku = extractSkuFromText(nameResolved);
  const sku =
    it.sku ||
    it.product?.id ||
    it.price?.product ||
    parsedSku ||
    it.id ||
    null;

  return {
    id: it.id || sku || String(Math.random()),
    sku: parsedSku || sku,         // display the human SKU if we parsed one
    name: shortName(nameResolved),
    image: resolveImageUrl(imgCandidate) || PLACEHOLDER,
    quantity: qty,
    unit_amount: Number(unit || 0),
  };
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const authedEmail = user?.email || "";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError("");
        let data = { orders: [] };

        // 1) Authorized first (Bearer token → server verifies & finds by uid/email)
        try {
          const byAuth = await apiGet("/api/orders");
          if (Array.isArray(byAuth.orders) && byAuth.orders.length) data = byAuth;
        } catch {}

        // 2) Fallback by uid
        if ((!Array.isArray(data.orders) || data.orders.length === 0) && user?.uid) {
          try {
            const q2 = new URLSearchParams({ userId: user.uid }).toString();
            const byUid = await apiGet(`/api/orders?${q2}`);
            if (Array.isArray(byUid.orders) && byUid.orders.length) data = byUid;
          } catch {}
        }

        // 3) Fallback by email
        if ((!Array.isArray(data.orders) || data.orders.length === 0) && authedEmail) {
          try {
            const q = new URLSearchParams({ email: authedEmail }).toString();
            const byEmail = await apiGet(`/api/orders?${q}`);
            if (Array.isArray(byEmail.orders) && byEmail.orders.length) data = byEmail;
          } catch {}
        }

        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, authedEmail, user?.uid]);

  // Trust backend filtering; just sort by date
  const visibleOrders = useMemo(() => {
    const sorted = [...orders];
    sorted.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    return sorted;
  }, [orders]);

  if (loading) return <main className="orders-wrap"><p>Loading…</p></main>;
  if (error) return <main className="orders-wrap"><p className="err">{error}</p></main>;
  if (visibleOrders.length === 0) return <main className="orders-wrap"><p>No orders found.</p></main>;

  return (
    <main className="orders-wrap">
      <div className="orders-list">
        {visibleOrders.map((o) => {
          const items = Array.isArray(o.items) ? o.items.map(normalizeItem) : [];
          const statusKey = (o.paymentStatus || o.status || "processing").toLowerCase();
          const statusText = STATUS_TEXT[statusKey] || STATUS_TEXT.processing;
          const createdAt = o.createdAt ? new Date(o.createdAt) : null;
          const createdStr = createdAt ? createdAt.toLocaleString() : "";
          const eta = o.shipping?.eta ? new Date(o.shipping.eta) : null;
          const etaStr = eta && eta.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
          const origin = o.shipping?.from || "USA";
          const totalUSD = usd(o.amountTotal);
          const trackUrl = o.shipping?.tracking_url || o.trackingUrl;

          return (
            <article key={o.id || createdStr} className="order-card">
              {/* Row 1: order number left, date right */}
              <div className="row order-head">
                <div className="head-left"><span className="order-no">#{numericOrderId(o.id)}</span></div>
                <div className="head-right"><span className="order-date">{createdStr}</span></div>
              </div>

              {/* Row 2: status/arrival on left, track button on right */}
              <div className="row order-status-row">
                <div className="status-left">
                  <div className="status-text">{statusText}</div>
                  {etaStr && <div className="arrival">Arrives on {etaStr} from {origin}</div>}
                </div>
                <div className="status-right">
                  <a
                    href={trackUrl || "#"} target="_blank" rel="noreferrer"
                    onClick={(e) => !trackUrl && e.preventDefault()}
                    className={trackUrl ? "track-btn" : "track-btn disabled"}
                  >
                    Track shipment
                  </a>
                </div>
              </div>

              {/* Items */}
              <div className="items">
                {items.map((it) => {
                  const subUSD = usd(it.unit_amount * (it.quantity || 1));
                  return (
                    <div key={it.id} className="item-row">
                      <div className="item-left">
                        <div className="thumb">
                          <img
                            src={it.image} alt={it.name} loading="eager" decoding="async"
                            onError={(e) => { if (e.currentTarget.src !== "/placeholder.png") e.currentTarget.src = "/placeholder.png"; }}
                          />
                        </div>
                        <div className="title clamp-1">{it.name}</div>
                      </div>

                      <div className="item-right">
                        <div className="info-col">
                          <div className="info-label">Listing price</div>
                          <div className="info-strong">{usd(it.unit_amount)}</div>
                        </div>
                        <div className="info-col">
                          <div className="info-label">Units</div>
                          <div className="info-strong">{it.quantity}</div>
                        </div>
                        <div className="info-col">
                          <div className="info-label">SKU</div>
                          <div className="info-strong">{it.sku || "—"}</div>
                        </div>
                        <div className="info-col total">
                          <div className="info-label">Subtotal</div>
                          <div className="info-strong">{subUSD}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-foot">
                <div className="foot-gap" />
                <div className="foot-total">
                  <span className="label">Order total</span>
                  <span className="value">{totalUSD}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
