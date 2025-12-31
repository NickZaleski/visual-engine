import { loadStripe } from '@stripe/stripe-js';

/**
 * Stripe Configuration
 * 
 * To set up Stripe:
 * 1. Create a Stripe account at https://dashboard.stripe.com/register
 * 2. Get your API keys from https://dashboard.stripe.com/apikeys
 * 3. Create products and prices in Stripe Dashboard:
 *    - Go to Products > Add Product
 *    - Create "Focus Flow Monthly" at $4.99/month
 *    - Create "Focus Flow Yearly" at $49.99/year
 *    - Copy the price IDs (price_xxx) and add them below
 * 4. Set environment variables or update the values below
 */

// Stripe publishable key
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51ScUdCGLI9gGYuFf5j6mFy5b4J8xxNw5jZqeRgHY5OG1CNKOzj0U78De1IaWZfgPHKIsvvdgmeef7XEMtbHkqHoj00Quqeprng';

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Stripe Price IDs for your subscription products
// Create these in Stripe Dashboard: Products > Add Product > Add Price
export const STRIPE_PRICES = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_1SkOx6GLI9gGYuFfKpivFSc1',
  yearly: import.meta.env.VITE_STRIPE_PRICE_YEARLY || 'price_1SkOxfGLI9gGYuFfUkxLgHsK',
};

// Firebase Functions region
const FIREBASE_REGION = 'us-central1';
const FIREBASE_PROJECT = 'calm-down-space';

// Your backend server URL for creating checkout sessions
// Uses Firebase Cloud Functions in production, localhost for development
const getApiUrl = () => {
  // If explicitly set in environment, use that
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development (localhost), use local server or Firebase emulator
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Use localhost:4242 for local development (legacy server)
    // Or use Firebase emulator: http://localhost:5001/calm-down-space/us-central1
    return 'http://localhost:4242';
  }
  
  // In production, use Firebase Cloud Functions
  return `https://${FIREBASE_REGION}-${FIREBASE_PROJECT}.cloudfunctions.net`;
};

export const API_URL = getApiUrl();

// Firebase Functions endpoints mapping
// Maps local server endpoints to Firebase Functions names
export const ENDPOINTS = {
  createCheckoutSession: '/create-checkout-session',
  createPortalSession: '/create-portal-session',
  sessionStatus: '/session-status',
  linkSubscription: '/link-subscription',
  createSubscription: '/create-subscription',
  confirmSubscription: '/confirm-subscription',
};

// Get the full endpoint URL (handles both local and Firebase)
export const getEndpointUrl = (endpoint: keyof typeof ENDPOINTS) => {
  const baseUrl = API_URL;
  
  // If using Firebase Functions (production)
  if (baseUrl.includes('cloudfunctions.net')) {
    // Firebase Functions use camelCase names
    const firebaseFunctionNames: Record<string, string> = {
      '/create-checkout-session': '/createCheckoutSession',
      '/create-portal-session': '/createPortalSession',
      '/session-status': '/sessionStatus',
      '/link-subscription': '/linkSubscription',
      '/create-subscription': '/createSubscription',
      '/confirm-subscription': '/confirmSubscription',
    };
    return `${baseUrl}${firebaseFunctionNames[ENDPOINTS[endpoint]] || ENDPOINTS[endpoint]}`;
  }
  
  // Local server uses kebab-case
  return `${baseUrl}${ENDPOINTS[endpoint]}`;
};

// Success and cancel URLs for Stripe Checkout
export const getCheckoutUrls = () => {
  const baseUrl = window.location.origin;
  return {
    success: `${baseUrl}?checkout=success`,
    cancel: `${baseUrl}?checkout=cancel`,
  };
};

/**
 * Link a Stripe checkout session to a Firebase user account
 * Used for "Pay First, Create Account After" flow
 */
export async function linkSubscription(sessionId: string, userId: string): Promise<void> {
  const response = await fetch(getEndpointUrl('linkSubscription'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, userId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to link subscription');
  }
  
  const data = await response.json();
  return data;
}

/**
 * Fetch customer email from a checkout session
 * Used to pre-fill signup form after payment
 */
export async function getSessionEmail(sessionId: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${getEndpointUrl('sessionStatus')}?session_id=${sessionId}`);
    if (response.ok) {
      const data = await response.json();
      return data.customer_email;
    }
  } catch (err) {
    console.error('Failed to fetch session email:', err);
  }
  return undefined;
}

/**
 * Create a Stripe Customer Portal session
 * Allows customers to manage their subscription (cancel, update payment method, etc.)
 */
export async function createPortalSession(customerId: string): Promise<string> {
  const response = await fetch(getEndpointUrl('createPortalSession'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      customerId, 
      returnUrl: window.location.origin 
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create portal session');
  }
  
  const data = await response.json();
  return data.url;
}

