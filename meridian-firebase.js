// ─────────────────────────────────────────────────────────
//  The Meridian™ — Firebase Configuration
//  Fill in your Firebase project credentials below.
//  Instructions: see FIREBASE-SETUP.md
// ─────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcXnFJV-ID_7dYxWAQBLs_DVYj_U_X_UQ",
  authDomain: "meridian-caf0d.firebaseapp.com",
  databaseURL: "https://meridian-caf0d-default-rtdb.firebaseio.com",
  projectId: "meridian-caf0d",
  storageBucket: "meridian-caf0d.firebasestorage.app",
  messagingSenderId: "1009618698372",
  appId: "1:1009618698372:web:a1d558cc120ce3da2fc2d1"

};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
