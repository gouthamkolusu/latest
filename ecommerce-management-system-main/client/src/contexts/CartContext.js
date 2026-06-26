// client/src/contexts/CartContext.js
import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

const STORAGE_KEY = "hardware_city_cart_v1";

function normalizeCartImage(p = {}) {
  return p.image || (Array.isArray(p.images) && p.images[0]) || p.image_url || "/fallback.jpg";
}

export const CartProvider = ({ children }) => {
  const { user, authReady } = useContext(AuthContext);

  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [cartLoaded, setCartLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const lastSavedHashRef = useRef("");
  const cartHash = useMemo(() => JSON.stringify(cart), [cart]);

  // Persist to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  // Load cart on auth changes (guest = localStorage; signed-in = Firestore)
  useEffect(() => {
    if (!authReady) return;

    (async () => {
      setCartLoaded(false);
      if (!user?.uid) {
        // guest
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const items = raw ? JSON.parse(raw) : [];
          const normalized = items.map((it) => ({ ...it, image: normalizeCartImage(it) }));
          setCart(normalized);
          lastSavedHashRef.current = JSON.stringify(normalized);
        } catch {
          setCart([]);
          lastSavedHashRef.current = "[]";
        } finally {
          setCartLoaded(true);
        }
        return;
      }

      // signed-in
      try {
        const ref = doc(db, "carts", user.uid);
        const snap = await getDoc(ref);
        const items = Array.isArray(snap.data()?.items) ? snap.data().items : [];
        const normalized = items.map((it) => ({ ...it, image: normalizeCartImage(it) }));
        setCart(normalized);
        lastSavedHashRef.current = JSON.stringify(normalized);
      } catch (err) {
        console.error("Failed to load cart:", err);
        setCart([]);
        lastSavedHashRef.current = "[]";
      } finally {
        setCartLoaded(true);
      }
    })();
  }, [user?.uid, authReady]);

  // Debounced save to Firestore (only when signed in)
  useEffect(() => {
    if (!authReady || !user?.uid || !cartLoaded) return;
    if (cartHash === lastSavedHashRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const ref = doc(db, "carts", user.uid);
        await setDoc(ref, { items: cart }, { merge: true });
        lastSavedHashRef.current = cartHash;
      } catch (err) {
        console.error("Failed to save cart:", err);
      }
    }, 400);

    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
  }, [cartHash, cart, user?.uid, authReady, cartLoaded]);

  const addToCart = (productOrItem) => {
    const item = { ...productOrItem, image: normalizeCartImage(productOrItem) };
    setCart((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === String(item.id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: (Number(next[idx].quantity) || 1) + (Number(item.quantity) || 1), image: next[idx].image || item.image };
        return next;
      }
      return [...prev, { ...item, quantity: Number(item.quantity) || 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((p) => String(p.id) !== String(id)));
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map((p) => (String(p.id) === String(id) ? { ...p, quantity } : p)));
  };

  // NEW: persist immediately; prevents Firestore loader from restoring old items
  const clearCartNow = async () => {
    setCart([]);
    lastSavedHashRef.current = "[]";
    try { localStorage.setItem(STORAGE_KEY, "[]"); } catch {}
    if (authReady && user?.uid) {
      try {
        const ref = doc(db, "carts", user.uid);
        await setDoc(ref, { items: [] }, { merge: true });
        lastSavedHashRef.current = "[]";
      } catch (err) {
        console.error("Failed to persist empty cart:", err);
      }
    }
  };

  const value = { cart, addToCart, removeFromCart, updateQuantity, clear:clearCartNow, };
    [cart,addToCart, removeFromCart, updateQuantity, clearCartNow]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
