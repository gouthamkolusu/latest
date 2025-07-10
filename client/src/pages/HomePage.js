import React from 'react';
import { FaShippingFast, FaShieldAlt, FaClock } from 'react-icons/fa';
import '../App.css';

function HomePage() {
  return (
    <div className="homepage">

      {/* Hero Section */}
      <div className="hero-section">
        <h1>Welcome to The Hardware City</h1>
        <p>Your one-stop shop for tools, fasteners, paint, and more.</p>
        <a href="/products" className="hero-button" target="_blank" rel="noopener noreferrer">Shop Now</a>
      </div>

      {/* Why Choose Us */}
      <div className="why-us-section">
        <h2>Why Choose Us?</h2>
        <div className="why-us-grid">
          <div className="why-item">
            <FaShippingFast className="why-icon" />
            <p>Fast Delivery</p>
          </div>
          <div className="why-item">
            <FaShieldAlt className="why-icon" />
            <p>Trusted Quality</p>
          </div>
          <div className="why-item">
            <FaClock className="why-icon" />
            <p>24x7 Support</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Buttons */}
      <div className="quick-nav">
        <div className="quick-grid">
          <a href="/products" className="quick-btn" target="_blank" rel="noopener noreferrer">Browse Products</a>
          <a href="/cart" className="quick-btn" target="_blank" rel="noopener noreferrer">View Cart</a>
          <a href="/admin" className="quick-btn" target="_blank" rel="noopener noreferrer">Admin Panel</a>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
