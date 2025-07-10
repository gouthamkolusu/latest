import React from 'react';
import './HeroBanner.css';

function HeroBanner() {
  return (
    <div className="hero-banner">
      <div className="banner-text">
        <h4>DEALS 7/7</h4>
        <h1>HARDWARE SALE</h1>
        <p><strong>Up to 35% OFF</strong></p>
        <p>12 months easy EMI available</p>
      </div>
      <img src="/assets/drill.png" alt="promo" className="banner-image" />
    </div>
  );
}

export default HeroBanner;