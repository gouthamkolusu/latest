// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaBell, FaUserCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Header.css';

function Header() {
  const handleClick = (label) => {
    alert(`${label} clicked`);
  };

  return (
    <motion.header
      className="custom-strip"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <motion.div
        className="strip-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="strip-title"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Welcome to Home Hardware
        </motion.div>

        <motion.div
          className="strip-right"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <nav className="strip-nav">
            <Link to="/" className="strip-link">Home</Link>
            <a href="/products" className="strip-link" target="_blank" rel="noopener noreferrer">Products</a>
            <a href="/cart" className="strip-link" target="_blank" rel="noopener noreferrer">Cart</a>
            <a href="/admin" className="strip-link" target="_blank" rel="noopener noreferrer">Admin</a>
          </nav>

          <div className="strip-icons">
            <FaSearch className="icon" onClick={() => handleClick('Search')} />
            <FaBell className="icon" onClick={() => handleClick('Notifications')} />
            <FaUserCircle className="icon" onClick={() => handleClick('Profile')} />
          </div>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}

export default Header;
