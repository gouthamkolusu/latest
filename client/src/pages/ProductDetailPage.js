import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import ProductGallery from '../components/ProductGallery';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        const selected = data.find(p => String(p.id) === String(id));
        setProduct(selected);
        if (selected) {
          setRelated(data.filter(p => p.category === selected.category && p.id !== selected.id));
        }
      } catch (err) {
        console.error('Failed to fetch product details', err);
      }
    };

    fetchProducts();
    const stored = JSON.parse(localStorage.getItem(`reviews-${id}`)) || [];
    setReviews(stored);
  }, [id]);

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

  const getPriceForQty = (quantity) => {
    if (product && product.pricingTiers) {
      const applicableTier = [...product.pricingTiers]
        .sort((a, b) => b.min - a.min)
        .find(tier => quantity >= tier.min);
      return applicableTier ? applicableTier.price : product.price;
    }
    return product ? product.price : 0;
  };

  if (!product) return <div>Loading product...</div>;

  const unitPrice = getPriceForQty(qty);
  const totalPrice = unitPrice * qty;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="product-detail-page">
      {/* TOP SECTION: Image + Basic Info */}
      <div className="product-main">
        <div className="main-image-column">
          <ProductGallery images={product.images || [product.image]} />
        </div>

        <div className="product-info">
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

          {/* Quantity Selector */}
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

          {/* Dynamic Pricing (smaller text via CSS) */}
          <p className="price">
            Unit Price: ${unitPrice.toFixed(2)}<br />
            Total: ${totalPrice.toFixed(2)}
          </p>

          {/* Bullet Point Description */}
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
        </div>
      </div>

      {/* TECHNICAL INFORMATION SECTION */}
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

            {/* Dynamic Specifications */}
            {product.specs && Object.entries(product.specs).map(([key, value]) => (
              <tr key={key}>
                <td><strong>{key.replace(/([A-Z])/g, ' $1')}:</strong></td>
                <td>{value}</td>
              </tr>
            ))}

            <tr>
              <td><strong>Category:</strong></td>
              <td>{product.category}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* REVIEWS SECTION */}
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
              <small><strong>{rev.name || 'Anonymous'}</strong> • {rev.date}</small>
            </li>
          ))}
        </ul>

        {/* Review Form */}
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

export default ProductDetailPage;
