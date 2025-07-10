import React, { useState } from 'react';
import axios from 'axios';
import './AddProductForm.css';

function AddProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    images: ['']  // array of image URLs
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (index, value) => {
    const updated = [...formData.images];
    updated[index] = value;
    setFormData({ ...formData, images: updated });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const product = {
        name: formData.name,
        price: formData.price,
        category: formData.category,
        images: formData.images,
        image: formData.images[0]  // primary image
      };

      await axios.post('http://localhost:5000/api/products', product);
      alert('✅ Product added!');
      setFormData({ name: '', price: '', category: '', images: [''] });
      onProductAdded();
    } catch (err) {
      console.error('Add product error:', err.response?.data || err.message);
      alert('❌ Failed to add product.');
    }
  };

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h3>Add New Product</h3>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="category"
        placeholder="Category"
        value={formData.category}
        onChange={handleChange}
        required
      />

      <label>Product Images:</label>
      {formData.images.map((url, idx) => (
        <input
          key={idx}
          type="text"
          placeholder={`Image URL ${idx + 1}`}
          value={url}
          onChange={(e) => handleImageChange(idx, e.target.value)}
          required={idx === 0}
          style={{ marginBottom: '8px', display: 'block' }}
        />
      ))}
      <button type="button" onClick={addImageField}>+ Add Another Image</button>

      <button type="submit">Add Product</button>
    </form>
  );
}

export default AddProductForm;
