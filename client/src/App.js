// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import AdminPage from './pages/AdminPage';
import EditProductPage from './pages/admin/EditProductPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import RequireRole from './components/RequireRole';

// Orders page (admin)
import OrdersPage from './pages/admin/OrdersPage';

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('❌ Failed to load products:', err);
      }
    };
    fetchProducts();
  }, []);

  const addProduct = async (newProduct) => {
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        const savedProduct = await res.json();
        setProducts((prev) => [...prev, savedProduct]);
      } else {
        console.error('❌ Failed to save product to backend.');
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage products={products} />} />
        <Route path="/product/:id" element={<ProductDetailPage products={products} />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminPage addProduct={addProduct} />
            </RequireRole>
          }
        />
        <Route
          path="/admin/edit/:id"
          element={
            <RequireRole role="admin">
              <EditProductPage />
            </RequireRole>
          }
        />

        {/* Orders (admin only) */}
        <Route
          path="/orders"
          element={
            <RequireRole role="admin">
              <OrdersPage />
            </RequireRole>
          }
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
