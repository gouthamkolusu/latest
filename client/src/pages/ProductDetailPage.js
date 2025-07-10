import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import StarRating from '../components/StarRating';
import ProductGallery from '../components/ProductGallery';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        const selected = data.find(p => p.id === parseInt(id));
        setProduct(selected);
        setRelated(data.filter(p => p.category === selected.category && p.id !== selected.id));
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
    const reviewObj = {
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

  if (!product) return <div>Loading product...</div>;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="product-detail-page">
      <div className="product-main">
        <ProductGallery images={product.images || [product.image]} />

        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>

          <div className="star-rating-wrapper">
            {avgRating ? (
              <>
                <span className="rating-number">{avgRating}</span>
                <span className="star full">★★★★★</span>
                <span className="rating-count">({reviews.length} ratings)</span>
              </>
            ) : (
              <span className="no-rating">No ratings yet</span>
            )}
          </div>

          <p className="price">${Number(product.price).toFixed(2)}</p>

          <table className="product-specs">
            <tbody>
              {product.brand && (
                <tr>
                  <td><strong>Brand:</strong></td>
                  <td>{product.brand}</td>
                </tr>
              )}
              {product.color && (
                <tr>
                  <td><strong>Color:</strong></td>
                  <td>{product.color}</td>
                </tr>
              )}
              {product.material && (
                <tr>
                  <td><strong>Material:</strong></td>
                  <td>{product.material}</td>
                </tr>
              )}
              {product.length && (
                <tr>
                  <td><strong>Item Length:</strong></td>
                  <td>{product.length}</td>
                </tr>
              )}
              {product.weight && (
                <tr>
                  <td><strong>Item Weight:</strong></td>
                  <td>{product.weight}</td>
                </tr>
              )}
              <tr>
                <td><strong>Category:</strong></td>
                <td>{product.category}</td>
              </tr>
            </tbody>
          </table>

          <p className="product-description">
            <strong>Description:</strong> {product.description || `This is a high-quality ${product.category} item perfect for your home needs.`}
          </p>

          <button onClick={() => addToCart(product)} className="add-btn">Add to Cart</button>
        </div>
      </div>

      <div className="review-section">
        <h3>Leave a Review</h3>
        <form onSubmit={handleReviewSubmit}>
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Write your review..."
            required
          />
          <br />
          <label>Rating:</label>
          <StarRating rating={newRating} setRating={setNewRating} />
          <br />
          <button type="submit">Submit Review</button>
        </form>

        <h3>Customer Reviews</h3>
        {reviews.length === 0 && <p>No reviews yet.</p>}
        <ul>
          {reviews.map((rev, idx) => (
            <li key={idx}>
              <div className="user-rating">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
              <p>{rev.text}</p>
              <small>{rev.date}</small>
            </li>
          ))}
        </ul>
      </div>

      <hr />
      <h3>Related Products</h3>
      <div className="related-products">
        {related.map((item) => (
          <div key={item.id} className="related-card">
            <img src={item.image} alt={item.name} width="120" />
            <p>{item.name}</p>
            <p>${Number(item.price).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductDetailPage;
