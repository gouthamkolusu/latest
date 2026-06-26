// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, getIdToken, signOut as fbSignOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDocFromServer } from "firebase/firestore";

export const AuthContext = createContext({
  user: null,
  role: "guest",
  token: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      try {
        setUser(u);
        if (!u) {
          setRole("guest");
          setToken(null);
          return;
        }

        // Optional: get an ID token for server requests
        try {
          const t = await getIdToken(u, /* forceRefresh */ false);
          if (!cancelled) setToken(t);
        } catch (e) {
          console.warn("ID token fetch failed (non-fatal):", e?.message || e);
        }

        // Fetch role/profile WITHOUT opening a realtime 'listen'
        try {
          const ref = doc(db, "users", u.uid);
          const snap = await getDocFromServer(ref);
          if (!cancelled) setRole(snap.exists() ? snap.data()?.role || "user" : "user");
        } catch (e) {
          console.warn("User doc fetch failed (non-fatal):", e?.message || e);
          if (!cancelled) setRole("user");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signOut = async () => fbSignOut(auth);

  const value = useMemo(() => ({ user, role, token, loading, signOut }), [user, role, token, loading]);

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
