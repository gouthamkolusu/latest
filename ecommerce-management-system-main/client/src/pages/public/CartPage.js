// client/src/pages/public/CartPage.js
import React, { useContext, useState } from 'react';
import { CartContext } from '../../contexts/CartContext';
import './CartPage.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function CartPage() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useContext(CartContext);
  const [checkingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleStripeCheckout = async () => {
    if (cart.length === 0 || checkingOut) return;
    setCheckingOut(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            id: i.id,
            sku: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image
          })),
          uid: user?.uid || null,
          email: user?.email || null,
        })
      });

      if (!res.ok) throw new Error(`Failed to start checkout (${res.status})`);
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error(err);
      alert('Unable to start checkout. Please try again.');
      setCheckingOut(false);
    }
  };

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map((item) => (
              <li key={item.id} className="cart-item">
                {item.image && <img src={item.image} alt={item.name} />}
                <div className="cart-details">
                  <p className="item-title">{item.name}</p>
                  <p className="item-price">Price: ${item.price.toFixed(2)}</p>

                  <div className="qty-controls">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>

                  <p className="item-subtotal">
                    Subtotal: ${(item.price * item.quantity).toFixed(2)}
                  </p>

                  {/* Restore small gray remove button */}
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-summary">
            <p className="total-line">
              <span>Total:</span>
              <span className="total">${total.toFixed(2)}</span>
            </p>

            <div className="cart-actions">
              <div className="actions-left">
                <button className="btn btn-ghost" onClick={clearCart}>
                  Clear Cart
                </button>
              </div>

              <div className="actions-right">
                <Link to="/checkout" className="btn btn-secondary">
                  Proceed to Checkout
                </Link>
                <button
                  className="btn btn-primary"
                  onClick={handleStripeCheckout}
                  disabled={checkingOut}
                  aria-busy={checkingOut}
                >
                  {checkingOut ? 'Redirecting…' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
