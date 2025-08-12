// src/pages/CartPage.js
import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import './CartPage.css';

function CartPage() {
  const {
    cart,
    removeFromCart,
    clearCart,
    updateQuantity
  } = useContext(CartContext);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
                <img src={item.image} alt={item.name} />
                <div className="cart-details">
                  <p>{item.name}</p>
                  <p>Price: ${item.price.toFixed(2)}</p>
                  <div className="qty-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <p>Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <p>Total: ${total.toFixed(2)}</p>
            <button onClick={clearCart}>Clear Cart</button>
            <button>Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
