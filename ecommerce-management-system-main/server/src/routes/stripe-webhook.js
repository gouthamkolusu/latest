import { Router } from "express";
import Stripe from "stripe";
import { addOrder } from "../data/orders.store.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe needs raw body to verify signature
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // You should set these when creating the Checkout Session:
    // - client_reference_id: Firebase UID
    // - metadata: anything else you want to persist
    const userId = session.client_reference_id || session.metadata?.userId || null;
    const email = session.customer_details?.email || null;

    // Minimal order record; enhance as needed
    const order = {
      id: session.id,
      createdAt: new Date().toISOString(),
      userId,
      email,
      amountTotal: session.amount_total,     // in cents
      currency: session.currency,
      paymentStatus: session.payment_status, // "paid"
      // If you also want line items:
      // lineItems: await stripe.checkout.sessions.listLineItems(session.id)  <-- needs async handling
    };

    try {
      addOrder(order);
    } catch (e) {
      console.error("Failed to persist order:", e);
      return res.status(500).end();
    }
  }

  res.json({ received: true });
});

export default router;
