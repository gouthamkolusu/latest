// src/pages/admin/EditProductPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    image: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setForm({
          name: data.name,
          price: data.price,
          category: data.category,
          image: data.image
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch product:', err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        alert('Product updated!');
        navigate('/products');
      } else {
        alert('Failed to update product.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating product.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div style={styles.container}>
      <h2>Edit Product</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Name:</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Price:</label>
        <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />

        <label>Category:</label>
        <input name="category" value={form.category} onChange={handleChange} required />

        <label>Image URL:</label>
        <input name="image" value={form.image} onChange={handleChange} />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '2rem auto',
    fontFamily: 'Arial, sans-serif'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  }
};

export default EditProductPage;
