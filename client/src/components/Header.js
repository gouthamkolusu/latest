// src/components/Header.js
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaUserCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import './Header.css';



function Header() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleUserClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowDropdown(false);
    navigate('/');
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
            <FaSearch className="icon" title="Search" />
            <FaBell className="icon" title="Notifications" />
            <div style={{ position: 'relative' }}>
              <FaUserCircle className="icon" onClick={handleUserClick} title="Profile/Login" />
              {showDropdown && user && (
                <div className="user-dropdown">
                  <p className="user-email">{user.email}</p>
                  <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}

export default Header;
