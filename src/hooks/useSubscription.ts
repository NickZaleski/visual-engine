import { useAuth } from '../contexts/AuthContext';
import { SubscriptionStatus, SubscriptionPlan } from '../firebase/firestore';

/**
 * Subscription feature flags
 */
export interface SubscriptionFeatures {
  // Sound features
  allSounds: boolean;
  allFrequencies: boolean;
  
  // Visual features
  colorCustomization: boolean;
  allVisualModes: boolean;
  
  // Timer features
  timer: boolean;
  timerNotifications: boolean;
  
  // Other features
  noAds: boolean;
  prioritySupport: boolean;
}

/**
 * Subscription hook return type
 */
export interface UseSubscriptionReturn {
  // Status
  isPaid: boolean;
  isLoading: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: SubscriptionPlan;
  
  // Expiration
  expiresAt: Date | null;
  isExpiringSoon: boolean; // Within 7 days
  
  // Feature flags
  features: SubscriptionFeatures;
  
  // Helpers
  canAccess: (feature: keyof SubscriptionFeatures) => boolean;
}

/**
 * Free tier features
 */
const FREE_FEATURES: SubscriptionFeatures = {
  allSounds: false,
  allFrequencies: false,
  colorCustomization: false,
  allVisualModes: true, // Visual modes are free
  timer: false,
  timerNotifications: false,
  noAds: false,
  prioritySupport: false,
};

/**
 * Paid tier features
 */
const PAID_FEATURES: SubscriptionFeatures = {
  allSounds: true,
  allFrequencies: true,
  colorCustomization: true,
  allVisualModes: true,
  timer: true,
  timerNotifications: true,
  noAds: true,
  prioritySupport: true,
};

/**
 * Hook to check subscription status and feature access
 */
export function useSubscription(): UseSubscriptionReturn {
  const { isPaid, subscription, loading } = useAuth();

  // Calculate expiration
  const expiresAt = subscription?.currentPeriodEnd?.toDate() || null;
  const isExpiringSoon = expiresAt
    ? expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  // Determine features based on subscription
  const features = isPaid ? PAID_FEATURES : FREE_FEATURES;

  // Helper to check feature access
  const canAccess = (feature: keyof SubscriptionFeatures): boolean => {
    return features[feature];
  };

  return {
    isPaid,
    isLoading: loading,
    subscriptionStatus: subscription?.status || null,
    subscriptionPlan: subscription?.plan || null,
    expiresAt,
    isExpiringSoon,
    features,
    canAccess,
  };
}

/**
 * List of free sounds (for feature gating)
 */
export const FREE_SOUNDS = ['rain', 'white-noise'];

/**
 * List of free frequencies (for feature gating)
 */
export const FREE_FREQUENCIES = ['alpha']; // 10 Hz Alpha waves

/**
 * Check if a sound is available for free users
 */
export function isSoundFree(soundId: string): boolean {
  return FREE_SOUNDS.includes(soundId);
}

/**
 * Check if a frequency is available for free users
 */
export function isFrequencyFree(frequencyId: string): boolean {
  return FREE_FREQUENCIES.includes(frequencyId);
}


