// client/src/pages/public/ProductDetailPage.js
import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import StarRating from '../../components/StarRating';
import ProductGallery from '../../components/ProductGallery';
import './ProductDetailPage.css';

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { apiGet, apiPut } from '../../lib/apiClient';

function isUserAdmin(user) {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    user.isAdmin === true ||
    user?.customClaims?.role === 'admin' ||
    user?.claims?.role === 'admin' ||
    user?.claims?.admin === true
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const isAdmin = isUserAdmin(user);

  // Core state
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [qty, setQty] = useState(1);

  // Inline editing state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);

  // Respect ?edit=1 ONLY if admin
  useEffect(() => {
    const wantsEdit = searchParams.get('edit') === '1';
    if (wantsEdit && !isAdmin) {
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
      setEditMode(false);
      return;
    }
    setEditMode(Boolean(wantsEdit && isAdmin));
  }, [searchParams, isAdmin, setSearchParams]);

  // Load product + related + local reviews
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // ✅ fetch a single product by id
        const item = await apiGet(`/api/products/${id}`);
        if (!alive) return;
        setProduct(item || null);

        // ✅ fetch all products (or you could call a category endpoint if your API supports it)
        try {
          const all = await apiGet('/api/products');
          if (!alive) return;
          const list = Array.isArray(all) ? all : (all.items || all.products || []);
          setRelated(
            item
              ? list.filter((p) => p.category === item.category && String(p.id) !== String(item.id))
              : []
          );
        } catch {
          if (alive) setRelated([]);
        }
      } catch (err) {
        console.error('Failed to fetch product details', err);
        if (alive) setError('Failed to load product.');
      }

      // Load local reviews (not from API)
      try {
        const stored = JSON.parse(localStorage.getItem(`reviews-${id}`)) || [];
        if (alive) setReviews(stored);
      } catch {
        if (alive) setReviews([]);
      }
    };

    load();
    return () => { alive = false; };
  }, [id]);

  // Prepare draft when entering edit mode
  useEffect(() => {
    if (editMode && product) {
      setDraft({
        ...product,
        price: Number(product.price ?? 0),
        images:
          Array.isArray(product.images) && product.images.length
            ? product.images
            : product.image
            ? [product.image]
            : [],
        specs: product.specs ?? {},
        pricingTiers: product.pricingTiers ?? [],
      });
    }
  }, [editMode, product]);

  // Reviews
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    let name = 'Anonymous';
    if (user) {
      if (user.displayName) name = user.displayName;
      else if (user.email) name = user.email.split('@')[0];
    }
    const reviewObj = {
      name,
      text: newReview,
      rating: newRating,
      date: new Date().toLocaleString(),
    };
    const updated = [...reviews, reviewObj];
    setReviews(updated);
    localStorage.setItem(`reviews-${id}`, JSON.stringify(updated));
    setNewReview('');
    setNewRating(5);
  };

  // Pricing helper
  const getPriceForQty = (quantity) => {
    if (product && product.pricingTiers && product.pricingTiers.length) {
      const applicableTier = [...product.pricingTiers]
        .sort((a, b) => b.min - a.min)
        .find((tier) => quantity >= tier.min);
      return applicableTier ? Number(applicableTier.price) : Number(product.price || 0);
    }
    return product ? Number(product.price || 0) : 0;
  };

  if (!product && !error) return <div>Loading product...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!product) return <div className="p-6">Not found.</div>;

  const unitPrice = getPriceForQty(qty);
  const totalPrice = unitPrice * qty;

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  // Form field helpers
  const onField = (key, cast = (v) => v) => (e) => {
    setDraft((d) => ({ ...d, [key]: cast(e.target.value) }));
  };

  const onSpecsChange = (e) => {
    const txt = e.target.value;
    try {
      const parsed = JSON.parse(txt || '{}');
      setError('');
      setDraft((d) => ({ ...d, specs: parsed }));
    } catch {
      setError('Specs JSON is invalid.');
    }
  };

  const onImagesChange = (e) => {
    const val = e.target.value.trim();
    const arr = val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];
    setDraft((d) => ({ ...d, images: arr }));
  };

  const onPricingTiersChange = (e) => {
    const txt = e.target.value.trim();
    try {
      const parsed = JSON.parse(txt || '[]');
      if (!Array.isArray(parsed)) throw new Error('pricingTiers must be an array');
      setError('');
      setDraft((d) => ({ ...d, pricingTiers: parsed }));
    } catch {
      setError('Pricing tiers JSON is invalid (expected an array).');
    }
  };

  // Save (guard for admin)
  const saveDraft = async () => {
    if (!draft || !isAdmin) return;
    setSaving(true);
    setError('');

    const payload = {
      ...draft,
      image: draft.images?.[0] || draft.image || '',
    };

    try {
      const updated = await apiPut(`/api/products/${id}`, payload);
      setProduct(updated);

      // Exit edit mode
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
      setEditMode(false);
    } catch (e) {
      console.error(e);
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle edit
  const toggleEdit = () => {
    const wantsEdit = searchParams.get('edit') === '1';
    const next = new URLSearchParams(searchParams);
    if (!isAdmin) {
      next.delete('edit');
      setSearchParams(next, { replace: true });
      setEditMode(false);
      return;
    }
    if (wantsEdit) next.delete('edit');
    else next.set('edit', '1');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="product-detail-page">
      <div className="product-main">
        <div className="main-image-column">
          <ProductGallery
            images={(product.images && product.images.length ? product.images : [product.image]).filter(Boolean)}
          />
        </div>

        <div className="product-info">
          {!editMode ? (
            <>
              <h1 className="product-title">{product.name}</h1>

              <div className="star-rating-wrapper">
                {avgRating ? (
                  <>
                    <span className="rating-number">{avgRating}</span>
                    <span className="star-display">
                      {'★'.repeat(Math.round(avgRating))}
                      {'☆'.repeat(5 - Math.round(avgRating))}
                    </span>
                    <span className="rating-count">({reviews.length} ratings)</span>
                  </>
                ) : (
                  <span className="no-rating">No ratings yet</span>
                )}
              </div>

              <div className="quantity-control">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  id="quantity"
                  type="number"
                  value={qty}
                  min="1"
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>

              <p className="price">
                Unit Price: ${unitPrice.toFixed(2)}
                <br />
                Total: ${totalPrice.toFixed(2)}
              </p>

              <ul className="product-description">
                {(product.description
                  ? product.description.split(/[\n.]+/).filter(Boolean)
                  : [`This is a premium ${product.category} ideal for your needs.`]
                ).map((point, idx) => (
                  <li key={idx}>{point.trim()}</li>
                ))}
              </ul>

              <button
                onClick={() => addToCart(product, qty, unitPrice)}
                className="add-btn"
              >
                🛒 Add {qty} to Cart
              </button>

              {isAdmin && (
                <div className="admin-controls">
                  <button className="edit-btn" onClick={toggleEdit}>
                    ✏️ Edit here
                  </button>
                  <Link to={`/admin/edit/${id}`} className="edit-link">
                    Open full editor →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="product-title">Edit Product</h2>

              {error && <div className="error-banner">{error}</div>}

              <div className="edit-grid">
                <label>
                  Name
                  <input
                    type="text"
                    value={draft?.name || ''}
                    onChange={onField('name')}
                  />
                </label>

                <label>
                  Price (base)
                  <input
                    type="number"
                    step="0.01"
                    value={draft?.price ?? 0}
                    onChange={onField('price', Number)}
                  />
                </label>

                <label className="edit-grid-span2">
                  Description
                  <textarea
                    rows="4"
                    value={draft?.description || ''}
                    onChange={onField('description')}
                    placeholder="Use sentences or newline points"
                  />
                </label>

                <label>
                  Brand
                  <input
                    type="text"
                    value={draft?.brand || ''}
                    onChange={onField('brand')}
                  />
                </label>

                <label>
                  UPC
                  <input
                    type="text"
                    value={draft?.upc || ''}
                    onChange={onField('upc')}
                  />
                </label>

                <label>
                  Location
                  <input
                    type="text"
                    value={draft?.location || ''}
                    onChange={onField('location')}
                  />
                </label>

                <label>
                  Category
                  <input
                    type="text"
                    value={draft?.category || ''}
                    onChange={onField('category')}
                  />
                </label>

                <label className="edit-grid-span2">
                  Image URLs (comma-separated)
                  <input
                    type="text"
                    value={(draft?.images || []).join(', ')}
                    onChange={onImagesChange}
                    placeholder="https://... , https://... , ..."
                  />
                </label>

                <label className="edit-grid-span2">
                  Specs (JSON)
                  <textarea
                    rows="6"
                    onChange={onSpecsChange}
                    value={JSON.stringify(draft?.specs || {}, null, 2)}
                    spellCheck={false}
                  />
                </label>

                <label className="edit-grid-span2">
                  Pricing Tiers (JSON array)
                  <textarea
                    rows="5"
                    onChange={onPricingTiersChange}
                    value={JSON.stringify(draft?.pricingTiers || [], null, 2)}
                    spellCheck={false}
                  />
                </label>
              </div>

              <div className="admin-controls">
                <button
                  className="save-btn"
                  onClick={saveDraft}
                  disabled={saving}
                  aria-busy={saving ? 'true' : 'false'}
                >
                  {saving ? 'Saving…' : '💾 Save changes'}
                </button>
                <button
                  className="cancel-btn"
                  onClick={toggleEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TECHNICAL INFORMATION */}
      <div className="technical-info-section">
        <h2>Technical Information</h2>
        <table className="product-specs">
          <tbody>
            {product.brand && (
              <tr>
                <td><strong>Brand:</strong></td>
                <td>{product.brand}</td>
              </tr>
            )}
            {product.upc && (
              <tr>
                <td><strong>UPC:</strong></td>
                <td>{product.upc}</td>
              </tr>
            )}
            {product.location && (
              <tr>
                <td><strong>Location:</strong></td>
                <td>{product.location}</td>
              </tr>
            )}
            {product.specs &&
              Object.entries(product.specs).map(([key, value]) => (
                <tr key={key}>
                  <td><strong>{key.replace(/([A-Z])/g, ' $1')}:</strong></td>
                  <td>{String(value)}</td>
                </tr>
              ))}
            <tr>
              <td><strong>Category:</strong></td>
              <td>{product.category}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* REVIEWS */}
      <div className="review-section">
        <h3>Customer Reviews</h3>
        {reviews.length === 0 && <p>No reviews yet. Be the first to review!</p>}
        <ul>
          {reviews.map((rev, idx) => (
            <li key={idx}>
              <div className="user-rating">
                {'★'.repeat(rev.rating)}
                {'☆'.repeat(5 - rev.rating)}
              </div>
              <p>{rev.text}</p>
              <small>
                <strong>{rev.name || 'Anonymous'}</strong> • {rev.date}
              </small>
            </li>
          ))}
        </ul>

        <h3>Leave a Review</h3>
        <form onSubmit={handleReviewSubmit}>
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Write your review..."
            required
          />
          <label>Rating:</label>
          <StarRating rating={newRating} setRating={setNewRating} />
          <button type="submit">Submit Review</button>
        </form>
      </div>

      {/* RELATED PRODUCTS */}
      <hr />
      <h3>Related Products</h3>
      <div className="related-products">
        {related.map((item) => (
          <div key={item.id} className="related-card">
            <img src={item.image} alt={item.name} width="120" />
            <p>{item.name}</p>
            <p>${Number(item.price || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
