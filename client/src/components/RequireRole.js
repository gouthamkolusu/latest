// src/components/RequireRole.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';

function RequireRole({ role, children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setAllowed(false);
      const snap = await getDoc(doc(db, 'users', user.uid));
      setAllowed(snap.exists() && snap.data().role === role);
    });
    return () => unsub();
  }, [role]);

  if (allowed === null) return <div className="loading">Loading...</div>;
  return allowed ? children : <Navigate to="/login" />;
}

export default RequireRole;
