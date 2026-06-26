// client/src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
} from "firebase/firestore";

// Use env if present, fall back to your current values
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FB_API_KEY || process.env.REACT_APP_FB_API_KEY || "AIzaSyDlPKIpZrGHDXxofrWr8544fMIM9Z2WKFw",
  authDomain: import.meta.env?.VITE_FB_AUTH_DOMAIN || process.env.REACT_APP_FB_AUTH_DOMAIN || "hardware-f5c43.firebaseapp.com",
  projectId: import.meta.env?.VITE_FB_PROJECT_ID || process.env.REACT_APP_FB_PROJECT_ID || "hardware-f5c43",
  storageBucket: import.meta.env?.VITE_FB_STORAGE_BUCKET || process.env.REACT_APP_FB_STORAGE_BUCKET || "hardware-f5c43.appspot.com",
  messagingSenderId: import.meta.env?.VITE_FB_SENDER_ID || process.env.REACT_APP_FB_SENDER_ID || "1057564009384",
  appId: import.meta.env?.VITE_FB_APP_ID || process.env.REACT_APP_FB_APP_ID || "1:1057564009384:web:7f716f5416ab7ea767b39d",
  measurementId: import.meta.env?.VITE_FB_MEASUREMENT_ID || process.env.REACT_APP_FB_MEASUREMENT_ID || "G-2QBQWWTCT0",
};

const app = initializeApp(firebaseConfig);

/**
 * Avoid QUIC/WebChannel flakiness by preferring long polling and
 * disabling fetch streams. (You can also force long polling if needed.)
 */
initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
  // experimentalForceLongPolling: true, // uncomment only if required
});

// Quieter Firestore logs while developing
setLogLevel("error");

export const auth = getAuth(app);
export const db = getFirestore(app);
