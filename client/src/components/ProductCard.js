import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './ProductCard.css';

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const imageUrl = Array.isArray(product.images) ? product.images[0] : product.image;

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="image-wrapper">
          <img
            className="product-img"
            src={imageUrl || '/fallback.jpg'}
            alt={product.name}
            loading="lazy"
            onError={(e) => e.target.src = '/fallback.jpg'}
          />
        </div>
        <div className="product-title">{product.name}</div>
      </Link>
      <div className="product-price">${Number(product.price).toFixed(2)}</div>
      <button className="cart-btn" onClick={() => addToCart(product)}>Add to Cart</button>
    </div>
  );
}

export default ProductCard;
