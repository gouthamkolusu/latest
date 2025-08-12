import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaShoppingCart, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import catalog from '../data/catalog';
import fieldConfigData from '../data/fieldConfig';
import InputField from './InputField';
import './AddProductForm.css';

const { fieldConfig, fieldTemplates } = fieldConfigData;

const AddProductForm = ({ onProductAdded }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', brand: '', price: '', description: '', images: [], upc: '', location: ''
  });
  const [extras, setExtras] = useState({});
  const [fields, setFields] = useState([]);
  const [path, setPath] = useState([]);
  const [node, setNode] = useState(catalog);
  const [options, setOptions] = useState(Object.keys(catalog));
  const [dragActive, setDragActive] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  /** Pick Category */
  const pickCategory = (label) => {
    const next = node[label];
    const newPath = [...path, label];
    setPath(newPath);

    if (!next || typeof next !== 'object' || Object.keys(next).length === 0) {
      const templateKey = fieldConfig[label] || fieldConfig.default;
      const meta = fieldTemplates[templateKey] || [];
      const initialExtras = {};
      meta.forEach(f => (initialExtras[f.label] = ''));
      setExtras(initialExtras);
      setFields(meta);
      setOptions([]);
      setStep(2);
    } else {
      setNode(next);
      setOptions(Object.keys(next));
    }
  };

  /** Breadcrumb Navigation */
  const goBackBreadcrumb = (i) => {
    const newPath = path.slice(0, i + 1);
    let temp = catalog;
    newPath.forEach((p) => { temp = temp[p]; });
    setPath(newPath);
    setNode(temp);
    setOptions(Object.keys(temp));
  };

  /** Reset Form */
  const resetForm = () => {
    setStep(1);
    setForm({ name: '', brand: '', price: '', description: '', images: [], upc: '', location: '' });
    setExtras({});
    setFields([]);
    setPath([]);
    setNode(catalog);
    setOptions(Object.keys(catalog));
  };

  /** Input Handlers */
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleExtraChange = (e) => setExtras({ ...extras, [e.target.name]: e.target.value });

  /** Upload Images (Drag & Drop) */
  const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    try {
      const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm((prev) => ({ ...prev, images: [...prev.images, ...data.urls] }));
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('❌ Image upload failed. Check server and uploads folder permissions.');
    }
  };

  /** Drag Events */
  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  };

  /** Add Image via URL (External like Amazon) */
  const handleAddImageUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url || !url.startsWith('http')) {
      alert('❌ Enter a valid image URL');
      return;
    }

    // Optional validation (skip blocking errors if HEAD fails)
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        alert('⚠ Warning: This URL may not be an image, but it will be added.');
      }
    } catch {
      console.warn('Image HEAD check failed, adding anyway.');
    }

    setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    setImageUrlInput('');
  };

  /** Remove Image */
  const handleRemoveImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  /** Submit Product */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const product = {
      ...form,
      price: parseFloat(form.price),
      specs: extras,
      category: path.join(' › '),
      image: form.images[0] || '',
      images: form.images,
    };

    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        const savedProduct = await res.json();
        alert('✅ Product added successfully!');
        if (onProductAdded) onProductAdded(savedProduct);
        resetForm();
        navigate('/products');
      } else {
        alert('❌ Failed to add product!');
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  return (
    <div className="add-product-container">
      <div className="form-header">
        <FaArrowLeft className="back-icon" onClick={() => (step === 2 ? setStep(1) : navigate('/admin'))} />
        <div className="header-center">
          <FaShoppingCart className="cart-icon" />
          <h2 className="header-title">Add Product</h2>
        </div>
      </div>

      <form className="add-product-form" onSubmit={handleSubmit}>
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="category-step">
            <label className="category-label">Choose Category</label>
            {path.length > 0 && (
              <div className="breadcrumb">
                {path.map((p, i) => (
                  <span key={i}>
                    <span className="breadcrumb-item clickable" onClick={() => goBackBreadcrumb(i)}>{p}</span>
                    {i < path.length - 1 && <span className="breadcrumb-separator">›</span>}
                  </span>
                ))}
              </div>
            )}
            <ul className="category-list">
              {options.map(opt => (
                <li key={opt} onClick={() => pickCategory(opt)}>
                  {opt} <span className="arrow">›</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={resetForm} className="reset-btn">Reset</button>
          </div>
        )}

        {/* Step 2: Product Form */}
        {step === 2 && (
          <>
            <div className="form-row">
              <div>
                <label className="field-label">Product Name</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="field-label">Brand</label>
                <input name="brand" value={form.brand} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="field-label">Price</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-section">
              <label className="field-label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>

            <div className="form-section specifications">
              <h4 className="section-title">Specifications</h4>
              {fields.map((f, idx) => (
                <InputField key={idx} field={f} value={extras[f.label] || ''} onChange={handleExtraChange} />
              ))}
            </div>

            <div className="form-row">
              <div>
                <label>UPC</label>
                <input name="upc" value={form.upc} onChange={handleChange} required />
              </div>
              <div>
                <label>Location</label>
                <input name="location" value={form.location} onChange={handleChange} />
              </div>
            </div>

            {/* Drag & Drop Image Uploader + URL */}
            <div
              className={`image-uploader ${dragActive ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p>{dragActive ? 'Drop images here...' : '📷 Drag & drop images here OR add image URL below'}</p>

              {/* External URL Input */}
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Paste image URL (Amazon etc.)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleAddImageUrl}>Add URL</button>
              </div>

              {/* Image Previews */}
              <div className="image-preview-grid">
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img} alt="Preview" className="image-preview" />
                    <FaTimesCircle
                      className="remove-icon"
                      style={{ position: 'absolute', top: '-6px', right: '-6px', color: 'red', cursor: 'pointer', fontSize: '18px' }}
                      onClick={() => handleRemoveImage(i)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn">+ Add Product</button>
          </>
        )}
      </form>
    </div>
  );
};

export default AddProductForm;
