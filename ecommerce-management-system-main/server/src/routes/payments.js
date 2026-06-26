// server/src/routes/payments.js
const { Router } = require("express");
const router = Router();

const path = require("path");
const fs = require("fs");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:3000";

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY missing. /api/payments will 500.");
}
const stripe = STRIPE_SECRET_KEY ? require("stripe")(STRIPE_SECRET_KEY) : null;

// Optional catalog helpers to backfill images by SKU/id
const CATALOG_PATHS = [
  path.join(__dirname, "..", "data", "products.json"),
  path.join(process.cwd(), "client", "src", "data", "products.json"),
];
let __catalog = null;
function loadCatalog() {
  if (__catalog) return __catalog;
  for (const p of CATALOG_PATHS) {
    try {
      const raw = fs.readFileSync(p, "utf8");
      const arr = JSON.parse(raw || "[]");
      const byId = {};
      for (const prod of arr) {
        const id = String(prod?.id ?? prod?._id ?? "").trim();
        if (id) byId[id] = prod;
      }
      __catalog = byId;
      break;
    } catch (_) {}
  }
  __catalog = __catalog || {};
  return __catalog;
}
function pickImage(prod) {
  if (!prod) return null;
  if (prod.image) return prod.image;
  if (Array.isArray(prod.images) && prod.images[0]) return prod.images[0];
  if (prod.image_url) return prod.image_url;
  return null;
}

router.post("/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");

    const { items = [], uid = null, email = null, successUrl, cancelUrl, metadata = {} } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    // Validate prices (CartPage sends dollars; convert to cents)
    for (const [i, it] of items.entries()) {
      const dollars = Number(it.unit_amount ?? it.price);
      if (!isFinite(dollars) || dollars <= 0) {
        throw new Error(`Invalid price for item[${i}]`);
      }
    }

    const catalog = loadCatalog();

    const line_items = items.map((it, idx) => {
      const unit_amount = Math.round((Number(it.unit_amount ?? it.price) || 0) * 100); // cents
      const quantity = Math.max(1, Number(it.quantity) || 1);

      const name = it.name || it.title || it.product?.name || `Item ${idx + 1}`;

      // Try to include an image (absolute URL preferred)
      let img =
        it.image ||
        (Array.isArray(it.images) && it.images[0]) ||
        pickImage(catalog[String(it.id || it.sku || it.productId || "")]);

      const product_data = {
        name,
        metadata: {
          sku: String(it.sku || it.id || it.productId || ""),
          ...(it.metadata || {}),
          image: img || null,   // ✅ carry to webhook for reliable rendering
          name,                 // ✅ carry name too
        },
      };
      if (img) product_data.images = [img];

      return {
        quantity,
        price_data: {
          currency: (it.currency || "usd").toLowerCase(),
          unit_amount,
          product_data,
        },
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email || undefined,
      client_reference_id: uid || undefined,
      line_items,
      success_url: successUrl || `${FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${FRONTEND_URL}/cart`,
      metadata: { ...(uid ? { uid } : {}), ...metadata },
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err?.type, err?.code, err?.message, err?.param || "", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

module.exports = router;
