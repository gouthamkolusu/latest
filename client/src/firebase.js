// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDlPKIpZrGHDXxofrWr8544fMIM9Z2WKFw",
  authDomain: "hardware-f5c43.firebaseapp.com",
  projectId: "hardware-f5c43",
  storageBucket: "hardware-f5c43.appspot.com", // ✅ corrected
  messagingSenderId: "1057564009384",
  appId: "1:1057564009384:web:7f716f5416ab7ea767b39d",
  measurementId: "G-2QBQWWTCT0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
