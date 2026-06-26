// client/src/pages/public/CheckoutPage.js
import React, { useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getShippingRates, buyShippingLabel } from "../../lib/apiClient";
import { CartContext } from "../../contexts/CartContext";

/* ---------- tiny inline “logos” (SVG) so we don’t depend on external URLs --------- */
function CarrierLogo({ carrier }) {
  const c = String(carrier || "").toUpperCase();
  const wrap = { display: "inline-flex", alignItems: "center", gap: 8 };

  if (c.includes("USPS")) {
    return (
      <span style={wrap} aria-label="USPS">
        <svg width="22" height="16" viewBox="0 0 44 32" fill="none" aria-hidden="true">
          <rect width="44" height="32" rx="4" fill="#1E3A8A" />
          <path d="M5 18 L20 10 L39 10 L26 18 Z" fill="#fff" />
        </svg>
        <strong>USPS</strong>
      </span>
    );
  }
  if (c.includes("FEDEX")) {
    return (
      <span style={wrap} aria-label="FedEx">
        <svg width="22" height="16" viewBox="0 0 44 32" fill="none" aria-hidden="true">
          <rect width="44" height="32" rx="4" fill="#4F46E5" />
          <rect x="4" y="6" width="10" height="20" fill="#F59E0B" />
        </svg>
        <strong>FedEx</strong>
      </span>
    );
  }
  if (c.includes("UPS")) {
    return (
      <span style={wrap} aria-label="UPS">
        <svg width="22" height="16" viewBox="0 0 44 32" fill="none" aria-hidden="true">
          <rect width="44" height="32" rx="4" fill="#92400E" />
          <path d="M8 8 h28 v16 H8 Z" fill="#FBBF24" />
        </svg>
        <strong>UPS</strong>
      </span>
    );
  }
  return (
    <span style={wrap}>
      <svg width="22" height="16" viewBox="0 0 44 32" fill="none" aria-hidden="true">
        <rect width="44" height="32" rx="4" fill="#6B7280" />
        <path d="M10 22 h24 v-2 H10 Z" fill="#fff" />
      </svg>
      <strong>{carrier || "Carrier"}</strong>
    </span>
  );
}

/* ---------- helpers ---------- */
function money(val, currency = "USD") {
  const n = Number(val || 0);
  try { return n.toLocaleString(undefined, { style: "currency", currency }); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}
function cap(s = "") {
  return String(s).replace(/[_-]+/g, " ")
    .split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(" ");
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart } = useContext(CartContext);

  // ---- Address form (ship-to) ----
  const [shipTo, setShipTo] = useState({
    name: "", phone: "", address1: "", address2: "", city: "",
    state: "", postalCode: "", country: "US",
  });

  // ---- Ship-from (your warehouse / store) ----
  const shipFrom = {
    name: "Hardware City", phone: "555-111-2222",
    address1: "123 Warehouse Rd", address2: "",
    city: "Dallas", state: "TX", postalCode: "75201", country: "US",
  };

  // ---- Build parcel from cart ----
  const parcel = useMemo(() => {
    const totalWeight =
      cart?.reduce((sum, item) => {
        const w = Number(item.weight || 1); // lbs
        return sum + w * Number(item.quantity || 1);
      }, 0) || 1;
    return { length: 12, width: 8, height: 4, weight: Math.max(0.1, totalWeight), unit: "LB", dimUnit: "IN" };
  }, [cart]);

  // ---- UI state ----
  const [quotes, setQuotes] = useState([]);
  const [shipmentId, setShipmentId] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [label, setLabel] = useState(null);

  async function handleGetRates(e) {
    e.preventDefault();
    setLoading(true); setError(""); setInfo(""); setLabel(null); setSelectedRateId("");
    try {
      const { quotes, shipmentId } = await getShippingRates({ shipFrom, shipTo, parcels: [parcel] });
      setQuotes(quotes || []); setShipmentId(shipmentId || "");
      if (!quotes?.length) setInfo("No shipping options found for this address.");
    } catch (e) { setError(e?.message || "Failed to get shipping rates"); }
    finally { setLoading(false); }
  }

  async function handleBuyLabel() {
    if (!shipmentId || !selectedRateId) return;
    setLoading(true); setError(""); setInfo("");
    try {
      const result = await buyShippingLabel({ shipmentId, rateId: selectedRateId });
      setLabel(result);
      setInfo(`Label purchased. Tracking: ${result.trackingNumber}`);
    } catch (e) { setError(e?.message || "Failed to purchase shipping label"); }
    finally { setLoading(false); }
  }

  /* ----------------------------- styles ----------------------------- */
  const S = {
    page: { maxWidth: 960, margin: "32px auto", padding: "0 16px" },
    card: {
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20,
      boxShadow: "0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
    },
    h1: { margin: 0 },
    back: { textDecoration: "none" },

    // form grid
    formGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 14 },
    row3: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)",
      gap: 12,
      alignItems: "start",
      width: "100%",
    },

    // inputs
    field: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
    label: { fontSize: 13, fontWeight: 600, color: "#111827" },
    hint: { fontSize: 12, color: "#6b7280" },
    input: {
      width: "100%",
      boxSizing: "border-box",
      height: 46,
      padding: "0 14px",
      border: "1px solid #d1d5db",
      borderRadius: 12,
      fontSize: 14,
      background: "#f9fbff",
      outline: "none",
      transition: "box-shadow .2s, border-color .2s, background .2s",
    },
    inputFocus: {
      border: "1px solid #2563eb",
      boxShadow: "0 0 0 4px rgba(37,99,235,.15)",
      background: "#fff",
    },

    actionRow: { display: "flex", gap: 12, alignItems: "center", marginTop: 6, flexWrap: "wrap" },
    btn: {
      height: 42, padding: "0 16px", borderRadius: 10,
      border: "1px solid #2563eb", background: "#2563eb", color: "#fff",
      fontWeight: 700, cursor: "pointer",
    },
    small: { color: "#6b7280", whiteSpace: "nowrap" },

    // quotes
    quotesGrid: { display: "grid", gap: 10, marginTop: 10 },
    quoteRow: {
      display: "grid",
      gridTemplateColumns: "24px 1fr",
      gap: 10,
      alignItems: "center",
      padding: "10px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      background: "#fff",
    },
    radio: { width: 18, height: 18 },
    rightCol: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap", width: "100%",
    },
    price: { fontWeight: 800, color: "#111827" },
    eta: { color: "#6b7280", fontStyle: "italic" },

    buyRow: { marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    buyBtn: {
      height: 42, padding: "0 16px", borderRadius: 10,
      border: "1px solid #16a34a", background: "#16a34a", color: "#fff",
      fontWeight: 700, cursor: "pointer",
    },

    // messages
    msgWrap: { marginTop: 12, display: "grid", gap: 8 },
    err: { color: "crimson" },
    ok: { color: "green" },

    // label section
    labelBtns: { display: "flex", gap: 12, flexWrap: "wrap" },
    linkBtn: {
      display: "inline-flex", alignItems: "center", height: 36,
      padding: "0 12px", borderRadius: 8, border: "1px solid #d1d5db", textDecoration: "none",
    },
  };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <h1 style={S.h1}>Checkout</h1>
        <Link to="/cart" style={S.back}>← Back to Cart</Link>
      </header>

      {/* Address form (modern styling) */}
      <form onSubmit={handleGetRates} style={S.card}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Shipping Address</h3>

        <div style={S.formGrid}>
          <div style={S.field}>
            <label style={S.label}>Full Name</label>
            <input
              style={S.input}
              value={shipTo.name}
              onFocus={(e) => Object.assign(e.currentTarget.style, S.inputFocus)}
              onBlur={(e) => Object.assign(e.currentTarget.style, S.input)}
              onChange={(e) => setShipTo({ ...shipTo, name: e.target.value })}
              placeholder="e.g., Jane Doe"
              required
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Phone <span style={S.hint}>(optional)</span></label>
            <input
              style={S.input}
              value={shipTo.phone}
              onFocus={(e) => Object.assign(e.currentTarget.style, S.inputFocus)}
              onBlur={(e) => Object.assign(e.currentTarget.style, S.input)}
              onChange={(e) => setShipTo({ ...shipTo, phone: e.target.value })}
              placeholder="(555) 555-5555"
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Address Line 1</label>
            <input
              style={S.input}
              value={shipTo.address1}
              onFocus={(e) => Object.assign(e.currentTarget.style, S.inputFocus)}
              onBlur={(e) => Object.assign(e.currentTarget.style, S.input)}
              onChange={(e) => setShipTo({ ...shipTo, address1: e.target.value })}
              placeholder="Street address, house no."
              required
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Address Line 2 <span style={S.hint}>(optional)</span></label>
            <input
              style={S.input}
              value={shipTo.address2}
              onFocus={(e) => Object.assign(e.currentTarget.style, S.inputFocus)}
              onBlur={(e) => Object.assign(e.currentTarget.style, S.input)}
              onChange={(e) => setShipTo({ ...shipTo, address2: e.target.value })}
              placeholder="Apt, suite, unit, building, floor, etc."
            />
          </div>

          <div style={S.row3} data-row3>
            <div style={S.field}>
              <label style={S.label}>City</label>
              <input
                style={S.input}
                value={shipTo.city}
                onFocus={(e) => Object.assign(e.currentTarget.style, S.inputFocus)}
                onBlur={(e) => Object.assign(e.currentTarget.style, S.input)}
                onChange={(e) => setShipTo({ ...shipTo, city: e.target.value })}
                placeholder="City"
                required
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>State</label>
              <input
                style={S.input}
                value={shipTo.state}
                onFocus={(e) => Object.assign(e.currentTarget.style, S.inputFocus)}
                onBlur={(e) => Object.assign(e.currentTarget.style, S.input)}
                onChange={(e) => setShipTo({ ...shipTo, state: e.target.value })}
                placeholder="State"
                required
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>Postal Code</label>
              <input
                style={S.input}
                value={shipTo.postalCode}
                onFocus={(e) => Object.assign(e.currentTarget.style, S.inputFocus)}
                onBlur={(e) => Object.assign(e.currentTarget.style, S.input)}
                onChange={(e) => setShipTo({ ...shipTo, postalCode: e.target.value })}
                placeholder="ZIP / Postal"
                required
              />
            </div>
          </div>

          <div style={S.actionRow}>
            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? "Calculating…" : "Get Shipping Rates"}
            </button>
            <small style={S.small}>
              Parcel:&nbsp;{parcel.length}×{parcel.width}×{parcel.height}&nbsp;{parcel.dimUnit},&nbsp;
              {parcel.weight}&nbsp;{parcel.unit}
            </small>
          </div>
        </div>
      </form>

      {/* Rates list */}
      {quotes.length > 0 && (
        <section style={{ ...S.card, marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Choose a Shipping Option</h3>

          <div style={S.quotesGrid}>
            {quotes.map((q) => {
              const cr = String(q.carrier || "").toUpperCase();
              return (
                <label key={q.id} style={S.quoteRow}>
                  <input
                    type="radio"
                    name="rate"
                    value={q.id}
                    checked={selectedRateId === q.id}
                    onChange={() => setSelectedRateId(q.id)}
                    style={S.radio}
                  />
                  <div style={S.rightCol}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <CarrierLogo carrier={cr} />
                      <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{cap(q.service)}</div>
                        <div style={S.eta}>
                          {q.deliveryDays != null ? `ETA: ${q.deliveryDays} day${q.deliveryDays === 1 ? "" : "s"}` : "ETA: —"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={S.price}>{money(q.total, (q.currency || "USD").toUpperCase())}</div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div style={S.buyRow}>
            <button onClick={handleBuyLabel} disabled={!selectedRateId || loading} style={S.buyBtn}>
              {loading ? "Buying…" : "Buy Shipping Label"}
            </button>
            <small style={S.small}>You can attach the tracking number to the order after purchase.</small>
          </div>
        </section>
      )}

      {(error || info) && (
        <div style={S.msgWrap}>
          {error && <div style={S.err}>{error}</div>}
          {info && <div style={S.ok}>{info}</div>}
        </div>
      )}

      {label && (
        <section style={{ ...S.card, marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Label Purchased</h3>
          <p><strong>Tracking:</strong> {label.trackingNumber}</p>
          <div style={S.labelBtns}>
            {label.labelUrl && (
              <a href={label.labelUrl} target="_blank" rel="noreferrer" style={S.linkBtn}>
                Open Label (Image)
              </a>
            )}
            {label.labelPdfUrl && (
              <a href={label.labelPdfUrl} target="_blank" rel="noreferrer" style={S.linkBtn}>
                Open Label (PDF)
              </a>
            )}
            <Link to="/orders" style={S.linkBtn}>View Orders</Link>
            <button onClick={() => navigate("/")} style={S.linkBtn}>Continue Shopping</button>
          </div>
        </section>
      )}

      {/* Mobile tweak for the city/state/zip row */}
      <style>{`
        @media (max-width: 720px) {
          [data-row3] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
