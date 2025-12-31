import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Configuration
 * 
 * To set up Firebase:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication (Email/Password, Google Sign-In)
 * 3. Create a Firestore database
 * 4. Get your config from Project Settings > General > Your apps > Web app
 * 5. Add the config values to your .env file:
 * 
 *    VITE_FIREBASE_API_KEY=your_api_key
 *    VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
 *    VITE_FIREBASE_PROJECT_ID=your-project-id
 *    VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
 *    VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
 *    VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'undefined'
);

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn(
    '⚠️ Firebase is not configured. Please add your Firebase config to .env file:\n' +
    '   VITE_FIREBASE_API_KEY=your_api_key\n' +
    '   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com\n' +
    '   VITE_FIREBASE_PROJECT_ID=your-project-id\n' +
    '   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com\n' +
    '   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789\n' +
    '   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef\n\n' +
    '   Running in demo mode without authentication.'
  );
}

export { app, auth, db };
