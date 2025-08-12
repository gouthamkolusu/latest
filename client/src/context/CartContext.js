// src/context/CartContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, authReady } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // ✅ Reset cart when user logs out or switches
  useEffect(() => {
    if (!authReady) return;

    setCart([]);
    setCartLoaded(false);
    console.log('🧹 Cart reset for user:', user?.uid || 'no user');
  }, [user, authReady]);

  // 🔁 Load cart from Firestore
  useEffect(() => {
    if (!authReady || !user) return;

    const loadCart = async () => {
      try {
        const ref = doc(db, 'carts', user.uid);
        console.log('📥 Attempting to load cart for user:', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setCart(data.items || []);
          console.log('✅ Cart loaded from Firestore:', data);
        } else {
          console.log('📭 No cart found in Firestore');
          setCart([]);
        }
        setCartLoaded(true);
      } catch (err) {
        console.error('❌ Failed to load cart:', err);
      }
    };

    loadCart();
  }, [user, authReady]);

  // 💾 Save cart after load
  useEffect(() => {
    if (!authReady || !user || !cartLoaded) return;

    const saveCart = async () => {
      try {
        const ref = doc(db, 'carts', user.uid);
        console.log('📤 Attempting to save cart:', cart, 'for user:', user.uid);
        await setDoc(ref, { items: cart });
        console.log('✅ Cart saved to Firestore');
      } catch (err) {
        console.error('❌ Failed to save cart:', err);
      }
    };

    saveCart();
  }, [cart, user, authReady, cartLoaded]);

  // ➕ Add product
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ❌ Remove product
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  // 🔢 Update quantity
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart(prev =>
      prev.map(p => (p.id === id ? { ...p, quantity } : p))
    );
  };

  // 🧹 Clear cart
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
