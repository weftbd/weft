import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

const metaEnv = ((import.meta as any) || {}).env || {};

// Only initialize Firebase when genuine configuration is present in environment variables.
// Avoid initializing with dummy/placeholder project IDs that cause 10-second backend connection timeouts.
const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID;
const apiKey = metaEnv.VITE_FIREBASE_API_KEY;

export const isFirebaseConfigured = Boolean(
  apiKey &&
  projectId &&
  projectId !== 'weft-c9999' &&
  !projectId.includes('placeholder')
);

export const firebaseConfig = isFirebaseConfigured
  ? {
      apiKey: apiKey,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: metaEnv.VITE_FIREBASE_APP_ID || '',
      measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || '',
    }
  : null;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured && firebaseConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } catch {
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn('Firebase initialization status:', err);
  }
}

export { app, auth, db };

