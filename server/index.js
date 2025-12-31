/**
 * Stripe Checkout Server with Firebase Integration
 * 
 * This Express server handles Stripe checkout session creation
 * and syncs subscription data to Firebase Firestore.
 * 
 * Setup:
 * 1. npm install express stripe cors dotenv firebase-admin
 * 2. Create a .env file with your Stripe secret key and Firebase config
 * 3. Download Firebase service account key from Firebase Console
 * 4. Run: node server/index.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin
// Option 1: Use service account JSON file
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (process.env.FIREBASE_PROJECT_ID) {
  // Option 2: Use environment variables (for cloud deployments)
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} else {
  console.warn('⚠️ Firebase not configured. Subscription sync will be disabled.');
}

const db = admin.apps.length ? admin.firestore() : null;

const app = express();
const PORT = process.env.PORT || 4242;

// Middleware
app.use(cors());

// Use JSON parser for all routes except webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Price IDs from Stripe Dashboard
const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_499',
  yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_4999',
};

/**
 * Helper: Update user subscription in Firestore
 */
async function updateUserSubscription(userId, subscriptionData) {
  if (!db) {
    console.log('Firebase not configured, skipping subscription update');
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      subscription: subscriptionData,
    });
    console.log(`✅ Updated subscription for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to update subscription for user ${userId}:`, error);
  }
}

/**
 * Helper: Find user by Stripe customer ID
 */
async function findUserByStripeCustomerId(customerId) {
  if (!db) return null;

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }
}

/**
 * Helper: Get plan type from price ID
 */
function getPlanFromPriceId(priceId) {
  if (priceId === PRICES.monthly || priceId?.includes('monthly')) {
    return 'monthly';
  }
  if (priceId === PRICES.yearly || priceId?.includes('yearly')) {
    return 'yearly';
  }
  return null;
}

/**
 * Create a Stripe Checkout Session
 * POST /create-checkout-session
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl, userId, userEmail } = req.body;
    
    // Validate price ID
    if (!priceId || !Object.values(PRICES).includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }
    
    // Build checkout session options
    const sessionOptions = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.origin}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}?checkout=cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      // Store Firebase user ID in metadata for webhook processing
      metadata: {
        firebaseUserId: userId || '',
      },
    };

    // Pre-fill customer email if provided
    if (userEmail) {
      sessionOptions.customer_email = userEmail;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionOptions);
    
    res.json({ 
      id: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create Customer Portal Session (for managing subscriptions)
 * POST /create-portal-session
 */
app.post('/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || req.headers.origin,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get session status (verify payment)
 * GET /session-status?session_id=xxx
 */
app.get('/session-status', async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    res.json({
      status: session.payment_status,
      customer_email: session.customer_details?.email,
      subscription_id: session.subscription,
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Link a Stripe subscription to a Firebase user account
 * Used for "Pay First, Create Account After" flow
 * POST /link-subscription
 */
app.post('/link-subscription', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    if (!sessionId || !userId) {
      return res.status(400).json({ error: 'Missing sessionId or userId' });
    }
    
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Validate payment was completed
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // Check if session has already been linked to a user
    if (session.metadata?.firebaseUserId && session.metadata.firebaseUserId !== '') {
      // Session was already linked during checkout (user was logged in)
      if (session.metadata.firebaseUserId !== userId) {
        return res.status(400).json({ 
          error: 'This subscription is already linked to a different account' 
        });
      }
      // Same user, already linked - just return success
      return res.json({ success: true, alreadyLinked: true });
    }
    
    // Get subscription details
    if (!session.subscription) {
      return res.status(400).json({ error: 'No subscription found for this session' });
    }
    
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const priceId = subscription.items.data[0]?.price?.id;
    
    // Update Firebase user with subscription data
    if (db) {
      await updateUserSubscription(userId, {
        status: 'active',
        plan: getPlanFromPriceId(priceId),
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
          subscription.current_period_end * 1000
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    }
    
    // Update Stripe customer metadata with Firebase user ID for future webhooks
    await stripe.customers.update(session.customer, {
      metadata: { firebaseUserId: userId },
    });
    
    // Also update the subscription metadata
    await stripe.subscriptions.update(session.subscription, {
      metadata: { firebaseUserId: userId },
    });
    
    console.log(`✅ Linked subscription ${session.subscription} to user ${userId}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error linking subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook endpoint for Stripe events
 * POST /webhook
 */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body.toString());
      console.warn('⚠️ Webhook signature verification skipped (no secret configured)');
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('✅ Checkout completed:', session.id);
      
      // Get Firebase user ID from metadata
      const firebaseUserId = session.metadata?.firebaseUserId;
      
      if (firebaseUserId && session.subscription) {
        // Fetch subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0]?.price?.id;
        
        // Update Firestore with subscription info
        await updateUserSubscription(firebaseUserId, {
          status: 'active',
          plan: getPlanFromPriceId(priceId),
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
            subscription.current_period_end * 1000
          ),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      }
      break;
    }
      
    case 'customer.subscription.created': {
      const subscription = event.data.object;
      console.log('📝 Subscription created:', subscription.id);
      
      // Find user by Stripe customer ID
      const userId = await findUserByStripeCustomerId(subscription.customer);
      if (userId) {
        const priceId = subscription.items.data[0]?.price?.id;
        await updateUserSubscription(userId, {
          status: 'active',
          plan: getPlanFromPriceId(priceId),
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
            subscription.current_period_end * 1000
          ),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      }
      break;
    }
      
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log('🔄 Subscription updated:', subscription.id);
      
      const userId = await findUserByStripeCustomerId(subscription.customer);
      if (userId) {
        const priceId = subscription.items.data[0]?.price?.id;
        
        // Determine status based on subscription state
        let status = 'active';
        if (subscription.status === 'canceled') {
          status = 'cancelled';
        } else if (subscription.status === 'past_due') {
          status = 'past_due';
        } else if (subscription.cancel_at_period_end) {
          status = 'active'; // Still active until period end
        }
        
        await updateUserSubscription(userId, {
          status,
          plan: getPlanFromPriceId(priceId),
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
            subscription.current_period_end * 1000
          ),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      }
      break;
    }
      
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('❌ Subscription cancelled:', subscription.id);
      
      const userId = await findUserByStripeCustomerId(subscription.customer);
      if (userId) {
        await updateUserSubscription(userId, {
          status: 'cancelled',
          plan: null,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        });
      }
      break;
    }
      
    case 'invoice.paid': {
      const invoice = event.data.object;
      console.log('💰 Invoice paid:', invoice.id);
      
      // Subscription renewed successfully
      if (invoice.subscription) {
        const userId = await findUserByStripeCustomerId(invoice.customer);
        if (userId) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const priceId = subscription.items.data[0]?.price?.id;
          
          await updateUserSubscription(userId, {
            status: 'active',
            plan: getPlanFromPriceId(priceId),
            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
              subscription.current_period_end * 1000
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
      }
      break;
    }
      
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log('⚠️ Payment failed:', invoice.id);
      
      const userId = await findUserByStripeCustomerId(invoice.customer);
      if (userId) {
        await updateUserSubscription(userId, {
          status: 'past_due',
        });
      }
      break;
    }
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    firebase: db ? 'connected' : 'not configured',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Stripe Checkout Server running on port ${PORT}

Endpoints:
  POST /create-checkout-session  - Create checkout session
  POST /create-portal-session    - Create customer portal session
  GET  /session-status           - Get checkout session status
  POST /webhook                  - Stripe webhook endpoint
  GET  /health                   - Health check

Firebase: ${db ? '✅ Connected' : '⚠️ Not configured'}

Environment Variables Required:
  STRIPE_SECRET_KEY        - Your Stripe secret key (sk_test_xxx or sk_live_xxx)
  STRIPE_PRICE_MONTHLY     - Price ID for monthly subscription
  STRIPE_PRICE_YEARLY      - Price ID for yearly subscription
  STRIPE_WEBHOOK_SECRET    - Webhook signing secret

Firebase Configuration (choose one):
  Option 1: FIREBASE_SERVICE_ACCOUNT_KEY - Path to service account JSON file
  Option 2: FIREBASE_PROJECT_ID          - Project ID (for cloud deployments with ADC)
  `);
});
