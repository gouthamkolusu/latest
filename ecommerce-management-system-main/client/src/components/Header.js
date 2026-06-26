import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaBell, FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import "./Header.css";
import logo from "../assets/logo.png";

function Header() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleUserClick = () => (user ? setShowDropdown(v => !v) : navigate("/login"));
  const handleLogout = async () => { await signOut(auth); setShowDropdown(false); navigate("/"); };

  return (
    <motion.header
      className="custom-strip"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="strip-content">
        <div className="strip-left" onClick={() => navigate("/")}>
          <img src={logo} alt="Hardware City Logo" className="header-logo-img" />
          <span className="strip-title">Hardware City</span>
        </div>

        <div className="strip-right">
          <nav className="strip-nav">
            <Link to="/" className="strip-link">Home</Link>
            <Link to="/products" className="strip-link">Products</Link>
            <Link to="/cart" className="strip-link">Cart</Link>
            <Link to="/orders" className="strip-link">My Orders</Link>

            {role === "admin" && (
              <>
                {/* ✅ point to /admin/add instead of /admin */}
                <Link to="/admin/add" className="strip-link">Add Product</Link>
                <Link to="/admin/orders" className="strip-link">Admin Orders</Link>
              </>
            )}
          </nav>

          <div className="strip-icons">
            <FaSearch className="icon" title="Search" />
            <FaBell className="icon" title="Notifications" />
            <div style={{ position: "relative" }}>
              <FaUserCircle className="icon" onClick={handleUserClick} title="Profile/Login" />
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
