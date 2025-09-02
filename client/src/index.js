// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Context providers
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// ✅ enable global styles
import './index.css';

function Providers({ children }) {
  return (
    <AuthProvider>
      <AuthGate>
        <CartProvider>{children}</CartProvider>
      </AuthGate>
    </AuthProvider>
  );
}

/**
 * Waits for Firebase Auth to initialize before rendering the app.
 * Shows a minimal, accessible loading state instead of returning null.
 */
function AuthGate({ children }) {
  const { authReady } = React.useContext(AuthContext);

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'Segoe UI, sans-serif',
          color: '#374151',
        }}
        aria-busy="true"
        aria-live="polite"
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid #e5e7eb',
              borderTopColor: '#111827',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <div>Loading…</div>
          <style>{`
            @keyframes spin { 
              to { transform: rotate(360deg); } 
            }
          `}</style>
        </div>
      </div>
    );
  }

  return children;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);
