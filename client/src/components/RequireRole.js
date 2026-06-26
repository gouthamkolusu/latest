// client/src/components/RequireRole.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireRole({ role = "admin", children }) {
  const { user, role: userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading" style={{ padding: 24 }}>Checking permissions…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (userRole !== role) return <Navigate to="/" replace />;

  return children;
}
