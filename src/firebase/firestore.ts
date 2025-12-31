import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, isFirebaseConfigured } from './config';

/**
 * User subscription status types
 */
export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'past_due';
export type SubscriptionPlan = 'monthly' | 'yearly' | null;

/**
 * User subscription data structure
 */
export interface UserSubscription {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * User preferences data structure
 */
export interface UserPreferences {
  favoriteVisualMode: string;
  blobColor: string;
  gradientColor: string;
  recentSounds: string[];
}

/**
 * Full user document structure in Firestore
 */
export interface UserDocument {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  subscription: UserSubscription;
  preferences: UserPreferences;
}

/**
 * Default subscription for new users
 */
const defaultSubscription: UserSubscription = {
  status: 'free',
  plan: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

/**
 * Default preferences for new users
 */
const defaultPreferences: UserPreferences = {
  favoriteVisualMode: 'nebula-clouds',
  blobColor: '#c471ed',
  gradientColor: '#8b5cf6',
  recentSounds: [],
};

/**
 * Create or update user document on sign in
 */
export async function createOrUpdateUser(user: User): Promise<UserDocument> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured');
  }
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // User exists, update last login
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
    return userSnap.data() as UserDocument;
  } else {
    // New user, create document
    const newUser: Omit<UserDocument, 'createdAt' | 'lastLoginAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      lastLoginAt: ReturnType<typeof serverTimestamp>;
    } = {
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      subscription: defaultSubscription,
      preferences: defaultPreferences,
    };

    await setDoc(userRef, newUser);
    return {
      ...newUser,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    } as UserDocument;
  }
}

/**
 * Get user document by UID
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  if (!isFirebaseConfigured || !db) {
    return null;
  }
  
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserDocument;
  }
  return null;
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(
  uid: string,
  subscription: Partial<UserSubscription>
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured');
  }
  
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    subscription: subscription,
  });
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  uid: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured');
  }
  
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const currentPrefs = userSnap.data().preferences || defaultPreferences;
    await updateDoc(userRef, {
      preferences: { ...currentPrefs, ...preferences },
    });
  }
}

/**
 * Check if user has an active subscription
 */
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  if (subscription.status === 'active') {
    // Check if subscription hasn't expired
    if (subscription.currentPeriodEnd) {
      return subscription.currentPeriodEnd.toDate() > new Date();
    }
    return true;
  }
  return false;
}

/**
 * Check if user is a paid user (has active subscription)
 */
export async function isPaidUser(uid: string): Promise<boolean> {
  const userDoc = await getUserDocument(uid);
  if (!userDoc) return false;
  return isSubscriptionActive(userDoc.subscription);
}
