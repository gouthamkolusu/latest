// src/components/ProductCardCompact.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './ProductCardCompact.css';

function ProductCardCompact({ product }) {
  const { addToCart } = useContext(CartContext);
  const imageUrl = Array.isArray(product.images) ? product.images[0] : product.image;

  return (
    <div className="product-card-compact">
      <Link to={`/product/${product.id}`} className="compact-link">
        <img
          src={imageUrl || '/fallback.jpg'}
          alt={product.name}
          onError={(e) => (e.target.src = '/fallback.jpg')}
          className="compact-img"
        />
        <div className="compact-title" title={product.name}>
          {product.name}
        </div>
      </Link>
      <div className="compact-price">${Number(product.price).toFixed(2)}</div>
      <button className="compact-btn" onClick={() => addToCart(product)}>
        +
      </button>
    </div>
  );
}

export default ProductCardCompact;
