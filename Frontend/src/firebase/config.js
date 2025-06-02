// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcanAdO4OKjS1pxn-SsyZ9pEE6AvkX6tc",
  authDomain: "brocab-1c545.firebaseapp.com",
  projectId: "brocab-1c545",
  storageBucket: "brocab-1c545.firebasestorage.app",
  messagingSenderId: "356073188733",
  appId: "1:356073188733:web:bb28d65ad93102eedd3014",
  measurementId: "G-TYGDGMPTYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);
auth.useDeviceLanguage(); // Set language to device default

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export auth instance, providers and app
export { auth, googleProvider };
export default app;