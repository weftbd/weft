import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const metaEnv = ((import.meta as any) || {}).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyA1s9iRmze4oIyn1YzbUSaukAjFid8HHXo',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'weft-c9999.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'weft-c9999',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'weft-c9999.firebasestorage.app',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '977794129942',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:977794129942:web:d3a3b67c9f4e942329d537',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || 'G-N8540MRK62',
};

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.warn('Firebase initialized in fallback/hybrid mode:', err);
}

export { app, auth, db };
