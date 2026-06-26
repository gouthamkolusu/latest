// server/src/routes/orders.js
const { Router } = require("express");
const fs = require("fs");
const path = require("path");
const {
  readAll,
  findByUserId,
  findByEmail,
  upsert,
} = require("../data/orders.store");

// ---------------- Catalog helpers (read-only, cached) ----------------
const CATALOG_PATHS = [
  // Prefer server-side catalog if present
  path.join(__dirname, "..", "data", "products.json"),
  // Fallback to client catalog, if that’s what you maintain
  path.join(process.cwd(), "client", "src", "data", "products.json"),
];

let __catalogCache = { ts: 0, byId: {} };

function loadCatalogById() {
  // 10s soft cache
  const now = Date.now();
  if (now - __catalogCache.ts < 10_000 && Object.keys(__catalogCache.byId).length) {
    return __catalogCache.byId;
  }
  for (const p of CATALOG_PATHS) {
    try {
      const stat = fs.statSync(p);
      if (!stat.isFile()) continue;
      const raw = fs.readFileSync(p, "utf8");
      const arr = JSON.parse(raw || "[]");
      const byId = {};
      for (const prod of arr) {
        const id = String(prod?.id ?? prod?._id ?? "").trim();
        if (!id) continue;
        byId[id] = prod;
      }
      __catalogCache = { ts: Date.now(), byId };
      return byId;
    } catch (_e) {
      // try next path
    }
  }
  __catalogCache = { ts: Date.now(), byId: {} };
  return {};
}

function pickImageFromProduct(prod = {}) {
  if (prod.image) return prod.image;
  if (Array.isArray(prod.images) && prod.images[0]) return prod.images[0];
  if (prod.image_url) return prod.image_url; // some entries use image_url
  return null;
}

function resolveImageForSku(skuLike) {
  if (skuLike == null) return null;
  const byId = loadCatalogById();
  const prod = byId[String(skuLike)];
  return prod ? pickImageFromProduct(prod) : null;
}

// Enrich each order's items with an image if missing
function enrichOrderImages(orders = []) {
  return orders.map((o) => {
    if (!Array.isArray(o.items)) return o;
    const items = o.items.map((it) => {
      if (it?.image) return it; // already has an image
      const sku =
        it?.sku ||
        it?.product?.id ||
        it?.price?.product ||
        it?.id;
      const fallback = resolveImageForSku(sku);
      return fallback ? { ...it, image: fallback } : it;
    });
    return { ...o, items };
  });
}

// ---------------- Existing route (kept), plus enrichment ----------------

// Try to load firebase-admin (optional)
let admin = null;
try {
  admin = require("../core/firebaseAdmin");
  admin = admin?.default || admin;
} catch {
  admin = null;
}

/**
 * GET /api/orders/all  (debug/admin)
 */
const router = Router();
router.get("/all", (_req, res) => {
  const enriched = enrichOrderImages(readAll());
  res.json({ orders: enriched });
});

/**
 * GET /api/orders
 * Priority:
 *  1) If Authorization header with Firebase token -> return by uid (and email fallback)
 *  2) Else if ?email= or ?userId= provided -> return by those
 */
router.get("/", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const hasBearer = auth.toLowerCase().startsWith("bearer ");

    if (hasBearer && admin && admin.auth) {
      try {
        const idToken = auth.slice(7).trim();
        const decoded = await admin.auth().verifyIdToken(idToken);
        const uid = decoded.uid;
        const email = decoded.email || null;

        let orders = findByUserId(uid);
        if (!orders.length && email) {
          orders = findByEmail(email);
        }
        return res.json({ orders: enrichOrderImages(orders) });
      } catch (e) {
        // Fall through to email/userId query if verification fails
        console.warn("⚠️ Firebase token verification failed:", e?.message || e);
      }
    }

    // Guest or no admin: use query params
    const { email, userId } = req.query;
    if (email) return res.json({ orders: enrichOrderImages(findByEmail(email)) });
    if (userId) return res.json({ orders: enrichOrderImages(findByUserId(userId)) });

    return res
      .status(400)
      .json({ error: "Provide Authorization, or ?email= or ?userId=" });
  } catch (err) {
    console.error("Orders GET error:", err);
    return res.status(500).json({ error: "Failed to read orders" });
  }
});

/**
 * POST /api/orders  (optional fallback for manual tests)
 * Saves an order record directly; useful if you're not using Stripe during dev.
 */
router.post("/", (req, res) => {
  try {
    const o = req.body || {};
    if (!o.amountTotal || !o.currency) {
      return res
        .status(400)
        .json({ error: "amountTotal and currency are required" });
    }
    const saved = upsert({
      id: o.id || o.sessionId || `ord_${Date.now()}`,
      amountTotal: o.amountTotal,
      currency: String(o.currency).toLowerCase(),
      email: o.email || null,
      uid: o.userId || o.uid || null,
      paymentStatus: o.paymentStatus || "paid",
      status: o.status || "paid",
      createdAt: o.createdAt || Date.now(),
      items: Array.isArray(o.items) ? o.items : [],
      metadata: o.metadata || {},
    });
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Orders POST error:", err);
    return res.status(500).json({ error: "Failed to save order" });
  }
});
// PATCH /api/orders/:id
router.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body || {};
    const all = readAll();
    const order = all.find(o => String(o.id) === String(id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    const updated = upsert({
      ...order,
      ...(status && { status, paymentStatus: status }),
      ...(trackingNumber !== undefined && { trackingNumber }),
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update order" });
  }
});
module.exports = router;
