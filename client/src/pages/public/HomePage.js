// client/src/pages/public/HomePage.js
import React from "react";
import { FaShippingFast, FaShieldAlt, FaClock, FaTools, FaHardHat, FaWrench, FaBolt } from "react-icons/fa";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Welcome to The Hardware City</h1>
        <p>Your one-stop shop for tools, fasteners, paint, and more.</p>
        <a href="/products" className="hero-button">Shop Now</a>
      </div>

      {/* Category Cards */}
      <div className="categories-section">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          <a href="/products" className="category-card">
            <FaTools className="category-icon" />
            <span>Power Tools</span>
          </a>
          <a href="/products" className="category-card">
            <FaHardHat className="category-icon" />
            <span>Safety Gear</span>
          </a>
          <a href="/products" className="category-card">
            <FaWrench className="category-icon" />
            <span>Hand Tools</span>
          </a>
          <a href="/products" className="category-card">
            <FaBolt className="category-icon" />
            <span>Electrical</span>
          </a>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="why-us-section">
        <h2>Why Choose Us?</h2>
        <div className="why-us-grid">
          <div className="why-item">
            <FaShippingFast className="why-icon" />
            <p>Fast Delivery</p>
            <span>Orders ship within 24 hours</span>
          </div>
          <div className="why-item">
            <FaShieldAlt className="why-icon" />
            <p>Trusted Quality</p>
            <span>Top brands you can rely on</span>
          </div>
          <div className="why-item">
            <FaClock className="why-icon" />
            <p>24x7 Support</p>
            <span>Always here to help you</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="quick-nav">
        <div className="quick-grid">
          <a href="/products" className="quick-btn">Browse Products</a>
          <a href="/cart" className="quick-btn">View Cart</a>
          <a href="/orders" className="quick-btn">My Orders</a>
        </div>
      </div>
    </div>
  );
}

export default HomePage;