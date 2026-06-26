import React from 'react';
import { FaShippingFast, FaShieldAlt, FaClock } from 'react-icons/fa';
import './WhyChooseUs.css';

function WhyChooseUs() {
  return (
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
  );
}

export default WhyChooseUs;
