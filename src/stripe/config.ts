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
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key';

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Stripe Price IDs for your subscription products
// Create these in Stripe Dashboard: Products > Add Product > Add Price
export const STRIPE_PRICES = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_499',
  yearly: import.meta.env.VITE_STRIPE_PRICE_YEARLY || 'price_yearly_4999',
};

// Your backend server URL for creating checkout sessions
// In production, this should be your actual API endpoint
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4242';

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
  const response = await fetch(`${API_URL}/link-subscription`, {
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
    const response = await fetch(`${API_URL}/session-status?session_id=${sessionId}`);
    if (response.ok) {
      const data = await response.json();
      return data.customer_email;
    }
  } catch (err) {
    console.error('Failed to fetch session email:', err);
  }
  return undefined;
}

