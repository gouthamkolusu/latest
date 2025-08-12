// src/pages/AdminPage.js
import React from 'react';
import AddProductForm from '../components/AddProductForm';
import './AdminPage.css';

function AdminPage({ addProduct }) {
  return (
    <div className="admin-page">
      <AddProductForm onProductAdded={addProduct} />
    </div>
  );
}

export default AdminPage;
