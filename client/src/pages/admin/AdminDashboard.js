// src/pages/admin/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) setUserEmail(user.email);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:5000/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const res = await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Admin Dashboard</h2>
      <p>Logged in as: {userEmail}</p>
      <button onClick={handleLogout}>Logout</button>

      <h3 style={{ marginTop: '2rem' }}>Products</h3>
      <table border="1" cellPadding="10" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Price</th><th>Category</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>${p.price}</td>
              <td>{p.category}</td>
              <td>
                <button onClick={() => navigate(`/admin/edit/${p.id}`)}>Edit</button>
                <button onClick={() => handleDelete(p.id)} style={{ marginLeft: '8px', color: 'red' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
