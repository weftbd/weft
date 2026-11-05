import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

const metaEnv = ((import.meta as any) || {}).env || {};

// Official Taarok Firebase configuration (with optional env override)
export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyCtIO64LT4OMhvWdsb2O3Atou6-YXxoanc',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'taarok-official.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'taarok-official',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'taarok-official.firebasestorage.app',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '652099493300',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:652099493300:web:3e0f6c89670ed9e97c66e1',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || 'G-EXQ7WS32QM',
};

export const isFirebaseConfigured = true;

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore sync note:', JSON.stringify(errInfo));
}

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Initialize Firebase Analytics in browser environments
  if (typeof window !== 'undefined') {
    isAnalyticsSupported()
      .then((supported) => {
        if (supported && app) {
          try {
            analytics = getAnalytics(app);
          } catch {
            // Analytics optional fallback
          }
        }
      })
      .catch(() => {});
  }

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

export { app, analytics, auth, db };
