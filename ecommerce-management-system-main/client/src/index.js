// client/src/index.js
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { makeRouter } from "./app/routes";

import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import "./index.css";

// ✅ Use the shared data helpers / apiClient (no hardcoded ports)
import { fetchProducts as fetchProductsFromData } from "./data/index";



function Root() {
  const [products, setProducts] = useState([]);

  // Load products once on app start
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchProductsFromData();
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("❌ Failed to load products:", err);
      }
    })();
  }, []);


  const router = useMemo(() => makeRouter(products), [products]);

  return <RouterProvider router={router} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <Root />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
