// client/src/pages/public/CheckoutSuccess.js
import { useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../../contexts/CartContext";

export default function CheckoutSuccess() {
  const { clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const { search } = useLocation();           // stable primitive string
  const ran = useRef(false);                  // guard against StrictMode double-run

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // optional: log session id for debugging
    const params = new URLSearchParams(search);
    const sid = params.get("session_id");
    if (sid) console.log("Checkout success session:", sid);

    (async () => {
      try {
        await clearCart();                    // persist immediately
        // give the webhook ~1–2s to write the order
        await new Promise((r) => setTimeout(r, 1500));
      } finally {
        navigate("/orders", { replace: true });
      }
    })();
  }, [clearCart, navigate, search]);

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", textAlign: "center" }}>
      <h1>✅ Payment Successful</h1>
      <p>Finalizing your order…</p>
    </main>
  );
}
