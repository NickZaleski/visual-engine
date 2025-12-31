import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword,
} from '../firebase/auth';
import {
  UserDocument,
  UserSubscription,
  UserPreferences,
  createOrUpdateUser,
  getUserDocument,
  updateUserPreferences,
  isSubscriptionActive,
} from '../firebase/firestore';

/**
 * Auth context state
 */
interface AuthContextState {
  // User state
  user: User | null;
  userDocument: UserDocument | null;
  loading: boolean;
  error: string | null;
  
  // Firebase configuration status
  isConfigured: boolean;

  // Subscription helpers
  isPaid: boolean;
  subscription: UserSubscription | null;
  preferences: UserPreferences | null;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;

  // Preference actions
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;

  // Refresh user data
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured); // Only loading if Firebase is configured
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const isPaid = userDocument?.subscription
    ? isSubscriptionActive(userDocument.subscription)
    : false;
  const subscription = userDocument?.subscription || null;
  const preferences = userDocument?.preferences || null;

  // Fetch user document from Firestore
  const fetchUserDocument = useCallback(async (firebaseUser: User) => {
    if (!isFirebaseConfigured) return;
    
    try {
      const doc = await createOrUpdateUser(firebaseUser);
      setUserDocument(doc);
    } catch (err) {
      console.error('Error fetching user document:', err);
      setError('Failed to load user data');
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // If Firebase isn't configured, don't try to listen to auth state
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchUserDocument(firebaseUser);
      } else {
        setUserDocument(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserDocument]);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up with email/password
  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!isFirebaseConfigured) {
        setError('Firebase is not configured');
        return;
      }
      
      setError(null);
      setLoading(true);
      try {
        await signUpWithEmail(email, password, displayName);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign in with Google
  const signInGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    
    setError(null);
    try {
      await firebaseSignOut();
      setUserDocument(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Send password reset email
  const sendPasswordReset = useCallback(async (email: string) => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured');
      return;
    }
    
    setError(null);
    try {
      await resetPassword(email);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update user preferences
  const updatePreferencesHandler = useCallback(
    async (prefs: Partial<UserPreferences>) => {
      if (!user || !isFirebaseConfigured) return;

      try {
        await updateUserPreferences(user.uid, prefs);
        // Update local state
        setUserDocument((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            preferences: { ...prev.preferences, ...prefs },
          };
        });
      } catch (err) {
        console.error('Error updating preferences:', err);
      }
    },
    [user]
  );

  // Refresh user data from Firestore
  const refreshUserData = useCallback(async () => {
    if (!user || !isFirebaseConfigured) return;

    try {
      const doc = await getUserDocument(user.uid);
      if (doc) {
        setUserDocument(doc);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  }, [user]);

  const value: AuthContextState = {
    user,
    userDocument,
    loading,
    error,
    isConfigured: isFirebaseConfigured,
    isPaid,
    subscription,
    preferences,
    signIn,
    signUp,
    signInGoogle,
    signOut,
    sendPasswordReset,
    updatePreferences: updatePreferencesHandler,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
