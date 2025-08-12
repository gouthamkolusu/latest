// src/components/ProductCarousel.js
import React, { useRef } from 'react';
import './ProductCarousel.css';
import ProductCardCompact from './ProductCardCompact';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function ProductCarousel({ title, products }) {
  const scrollRef = useRef();

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
    scrollRef.current.scrollTo({ left: scrollLeft + scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="carousel-container">
      <div className="carousel-header">
        <h3 className="carousel-title">{title}</h3>
      </div>

      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={() => scroll('left')}>
          <FaChevronLeft />
        </button>

        <div className="carousel-track" ref={scrollRef}>
          {products.map((product) => (
            <div key={product.id} className="carousel-item">
              <ProductCardCompact product={product} />
            </div>
          ))}
        </div>

        <button className="carousel-arrow right" onClick={() => scroll('right')}>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default ProductCarousel;
