// client/src/pages/admin/EditProductPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from '../../lib/apiClient';

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
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGet(`/api/products/${id}`);
        if (!alive) return;
        setProduct(data);
        setForm({
          name: data?.name || '',
          price: data?.price ?? '',
          category: data?.category || '',
          image: (Array.isArray(data?.images) && data.images[0]) || data?.image || ''
        });
      } catch (err) {
        console.error('Failed to fetch product:', err);
        if (alive) setError('Failed to fetch product.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...product,
        ...form,
        images: form.image ? [form.image] : product?.images || [],
        image: form.image || product?.image || ''
      };
      await apiPut(`/api/products/${id}`, payload);
      alert('Product updated!');
      navigate(`/products/${id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to update product.');
      alert('Failed to update product.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
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
