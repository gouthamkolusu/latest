import React, { useContext, memo } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './ProductCard.css';

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const imageUrl = Array.isArray(product?.images) ? product.images[0] : product?.image;

  return (
    <div className="product-card">
      {product?.badge && <span className="badge">{product.badge}</span>}

      <Link to={`/product/${product?.id}`} className="product-link">
        <div className="image-wrapper">
          <img
            className="product-img"
            src={imageUrl || '/fallback.jpg'}
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

      <button className="cart-btn" onClick={() => addToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}

export default memo(ProductCard);
