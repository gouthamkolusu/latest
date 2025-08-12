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
      <motion.div className="strip-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <motion.div className="strip-title" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          Welcome to Home Hardware
        </motion.div>

        <motion.div className="strip-right" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <nav className="strip-nav">
            <Link to="/" className="strip-link">Home</Link>
            <Link to="/products" className="strip-link">Products</Link>
            <Link to="/cart" className="strip-link">Cart</Link>

            {/* ✅ Only show Add Product for Admin (Admin link removed) */}
            {role === 'admin' && (
              <button
                className="add-product-btn"
                onClick={() => navigate('/admin')}
              >
                + Add Product
              </button>
            )}
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
