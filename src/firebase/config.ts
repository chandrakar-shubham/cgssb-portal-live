import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize or reuse Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore with resilient offline persistence
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    firebaseConfigData.firestoreDatabaseId || undefined
  );
} catch {
  firestoreDb = firebaseConfigData.firestoreDatabaseId
    ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreDb;

export const isFirebaseConfigured = Boolean(firebaseConfigData.apiKey && firebaseConfigData.projectId);

export const firebaseProjectId = firebaseConfigData.projectId || '';
export const firestoreDatabaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
