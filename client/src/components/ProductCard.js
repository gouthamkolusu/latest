import React, { useContext, memo } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import './ProductCard.css';

// Prefer product.image, then images[0], then image_url, else a local fallback
function getPrimaryImage(p) {
  if (p?.image) return p.image;
  if (Array.isArray(p?.images) && p.images[0]) return p.images[0];
  if (p?.image_url) return p.image_url;
  return '/fallback.jpg';
}

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const imageUrl = getPrimaryImage(product);

  const handleAdd = () => {
    const cartItem = {
      id: product?.id,
      name: product?.name,
      price: Number(product?.price || 0), // dollars
      image: imageUrl,                    // ✅ ensure a top-level image
      quantity: 1,
      sku: product?.sku,
    };
    addToCart(cartItem);
  };

  return (
    <div className="product-card">
      {product?.badge && <span className="badge">{product.badge}</span>}

      <Link to={`/product/${product?.id}`} className="product-link">
        <div className="image-wrapper">
          <img
            className="product-img"
            src={imageUrl}
            alt={product?.name || 'Product'}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/fallback.jpg'; }}
          />
        </div>

        <div className="product-title">{product?.name}</div>
      </Link>

      <div className="price-section">
        <span className="product-price">
          ${Number(product?.price || 0).toFixed(2)}
        </span>
        {product?.oldPrice && (
          <span className="old-price">
            Typical: ${Number(product.oldPrice).toFixed(2)}
          </span>
        )}
      </div>

      <div className="prime-tag">✔ prime</div>

      <button className="cart-btn" onClick={handleAdd}>
        Add to Cart
      </button>
    </div>
  );
}

export default memo(ProductCard);
