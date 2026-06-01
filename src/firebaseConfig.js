// src/firebaseConfig.js
// Uses your real Firebase project values directly.
// For production, replace with VITE_* env vars once you've set up .env

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyAeuDFfyNEh83f6UqwPmR77_nHz-2HUvg8",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "ini-trust-f0f99.firebaseapp.com",
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || "https://ini-trust-f0f99-default-rtdb.firebaseio.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "ini-trust-f0f99",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "ini-trust-f0f99.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "559303441101",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:559303441101:web:510902842d413d6ae84784",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "G-WRD4RH77YG",
};

const app = initializeApp(firebaseConfig);

// Analytics is browser-only — skip in SSR / non-browser contexts
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;
