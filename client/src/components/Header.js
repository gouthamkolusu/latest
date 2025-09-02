// src/components/Header.js
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaUserCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import './Header.css';
import logo from '../assets/logo.png'; // ensure the filename matches

function Header() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [role, setRole] = useState(null);

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

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role);
        }
      } else {
        setRole(null);
      }
    };
    fetchUserRole();
  }, [user]);

  return (
    <motion.header
      className="custom-strip"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="strip-content">
        {/* Left: Logo + Title */}
        <div className="strip-left" onClick={() => navigate('/')}>
          <img src={logo} alt="Home Hardware Logo" className="header-logo-img" />
          <span className="strip-title">Home Hardware</span>
        </div>

        {/* Right: Navigation + Icons */}
        <div className="strip-right">
          <nav className="strip-nav">
            <Link to="/" className="strip-link">Home</Link>
            <Link to="/products" className="strip-link">Products</Link>
            <Link to="/cart" className="strip-link">Cart</Link>

            {/* ✅ Admin-only links */}
            {role === 'admin' && (
              <>
                <Link to="/admin" className="strip-link">Add Product</Link>
                <Link to="/orders" className="strip-link">Orders</Link>
              </>
            )}
          </nav>

          <div className="strip-icons">
            <FaSearch className="icon" title="Search" />
            <FaBell className="icon" title="Notifications" />
            <div style={{ position: 'relative' }}>
              <FaUserCircle
                className="icon"
                onClick={handleUserClick}
                title="Profile/Login"
              />
              {showDropdown && user && (
                <div className="user-dropdown">
                  <p className="user-email">{user.email}</p>
                  <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;
