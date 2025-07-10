import React, { useEffect, useState } from 'react';
import AddProductForm from '../components/AddProductForm';
import './AdminPage.css';

function AdminPage() {
  const [products, setProducts] = useState([]);
  const [reload, setReload] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [reload]);

  return (
    <div className="admin-page">
      <h2>Admin Panel</h2>
      <AddProductForm onProductAdded={() => setReload(!reload)} />
      <div className="product-list">
        <h3>All Products</h3>
        <ul>
          {products.map((product) => (
            <li key={product.id} className="product-item">
              <img src={product.image} alt={product.name} />
              <div>
                <strong>{product.name}</strong> — ${Number(product.price).toFixed(2)}<br />
                <small>{product.category}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminPage;
