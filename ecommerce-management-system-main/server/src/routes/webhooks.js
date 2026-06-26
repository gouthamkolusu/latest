// server/src/routes/webhooks.js
const express = require("express");
const Stripe = require("stripe");
const { upsert, getById } = require("../data/orders.store");
const { resolveImageForSku } = require("../utils/catalog");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (getById(session.id)) return res.json({ received: true });

    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price.product"],
    });

    const items = (full.line_items?.data || []).map((li) => {
      const product = li.price?.product;
      const qty = li.quantity || 1;

      // Prefer metadata set in payments.js
      const meta = product?.metadata || {};
      let image =
        meta.image ||
        (product?.images && product.images[0]) ||
        li.metadata?.image ||
        null;

      // Prefer metadata.sku, then fallbacks
      const sku =
        meta.sku ||
        product?.id ||
        li.price?.product ||
        li.id;

      if (!image) image = resolveImageForSku(sku);

      const name = meta.name || li.description || product?.name || "Item";

      return {
        id: li.id,
        name,
        sku,
        quantity: qty,
        unit_amount:
          li.price?.unit_amount ??
          (li.amount_subtotal && qty ? Math.round(li.amount_subtotal / qty) : 0),
        currency: (li.price?.currency || session.currency || "usd").toLowerCase(),
        image,
      };
    });

    upsert({
      id: session.id,
      amountTotal: session.amount_total,
      currency: (session.currency || "usd").toLowerCase(),
      email: session.customer_details?.email || session.customer_email || null,
      uid: session.metadata?.uid || null,
      paymentStatus: session.payment_status,
      status: "paid",
      createdAt: Date.now(),
      items,
    });
  }

  res.json({ received: true });
});

module.exports = router;
