import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQvgQiVCZg7KOgL3FBoBDw0itHHR5gfPI",
  authDomain: "yash-b2c3a.firebaseapp.com",
  projectId: "yash-b2c3a",
  storageBucket: "yash-b2c3a.firebasestorage.app",
  messagingSenderId: "483665991418",
  appId: "1:483665991418:web:446f17f663d44e80b09b43",
  measurementId: "G-FEP4CNZMWL"
};

// Use a secondary app instance so creating users doesn't log the admin out of the primary app (if they had one)
const app = initializeApp(firebaseConfig, 'AdminUserCreator');
export const adminAuth = getAuth(app);
