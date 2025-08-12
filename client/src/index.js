// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function Root() {
  return (
    <AuthProvider>
      <WaitForAuth />
    </AuthProvider>
  );
}

function WaitForAuth() {
  const { authReady } = React.useContext(AuthContext);
  if (!authReady) return null;

  return (
    <CartProvider>
      <App />
    </CartProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
