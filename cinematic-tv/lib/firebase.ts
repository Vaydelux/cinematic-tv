import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

function readFirebaseConfig(): FirebaseOptions | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const required = [
    config.apiKey,
    config.authDomain,
    config.projectId,
    config.messagingSenderId,
    config.appId,
  ];

  if (required.some((value) => !value)) return null;
  return config as FirebaseOptions;
}

const firebaseConfig = readFirebaseConfig();
export const firebaseConfigured = Boolean(firebaseConfig);

const app: FirebaseApp | null = firebaseConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const auth: Auth | null = app ? getAuth(app) : null;
const db: Firestore | null = app
  ? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID
    ? getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID)
    : getFirestore(app)
  : null;
const googleProvider: GoogleAuthProvider | null = auth ? new GoogleAuthProvider() : null;

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  writeBatch,
};
