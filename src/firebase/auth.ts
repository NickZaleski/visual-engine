import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

/**
 * Firebase Authentication Helper Functions
 */

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured');
  }
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Create a new account with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured');
  }
  
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name if provided
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  
  return credential;
}

/**
 * Sign in with Google redirect (opens in new tab/same tab redirect)
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured');
  }
  return signInWithRedirect(auth, googleProvider);
}

/**
 * Get the result of a Google redirect sign-in
 * Call this on app initialization to check if user is returning from a redirect
 */
export async function getGoogleRedirectResult(): Promise<UserCredential | null> {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  return getRedirectResult(auth);
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured');
  }
  return firebaseSignOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured');
  }
  return sendPasswordResetEmail(auth, email);
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * Update user profile (display name, photo URL)
 */
export async function updateUserProfile(
  user: User,
  profile: { displayName?: string; photoURL?: string }
): Promise<void> {
  return updateProfile(user, profile);
}
