import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore 
} from 'firebase/firestore';

// Firebase configuration from environment or safe defaults for local development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment12345678",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "genzday-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "genzday-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "genzday-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isFirebaseConfigured = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Check if real config is provided
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    isFirebaseConfigured = true;
  }
} catch (error) {
  console.warn('Firebase initialized in fallback offline mode:', error);
  // Safe dummy initialization to avoid crashes
  app = initializeApp(firebaseConfig, 'fallback-app');
  auth = getAuth(app);
  db = getFirestore(app);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, googleProvider, isFirebaseConfigured };
