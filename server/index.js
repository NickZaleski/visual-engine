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

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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

// Log configured prices on startup (for debugging)
console.log('\n📋 Configured Stripe Price IDs:');
console.log(`   Monthly: ${PRICES.monthly}`);
console.log(`   Yearly: ${PRICES.yearly}`);

// Validate that these are Price IDs, not Product IDs
if (PRICES.monthly.startsWith('prod_') || PRICES.yearly.startsWith('prod_')) {
  console.error('\n   ❌ ERROR: You are using PRODUCT IDs instead of PRICE IDs!');
  console.error('   Product IDs start with "prod_", but you need Price IDs that start with "price_"');
  console.error('   Go to Stripe Dashboard > Products > Your Product > Pricing section');
  console.error('   Copy the Price ID (not the Product ID)\n');
} else if (PRICES.monthly === 'price_monthly_499' || PRICES.yearly === 'price_yearly_4999') {
  console.warn('   ⚠️  Using default placeholder values! Make sure to set STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY in your .env file');
} else if (!PRICES.monthly.startsWith('price_') || !PRICES.yearly.startsWith('price_')) {
  console.warn('   ⚠️  Price IDs should start with "price_". Please verify these are correct Price IDs from Stripe.');
}
console.log('');

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
    
    // Debug logging
    console.log('\n🔍 Checkout Session Request:');
    console.log('   Received priceId:', priceId);
    console.log('   Configured prices:', PRICES);
    console.log('   Price ID type:', priceId?.startsWith('prod_') ? 'PRODUCT ID ❌' : priceId?.startsWith('price_') ? 'PRICE ID ✅' : 'UNKNOWN');
    
    // Validate price ID
    if (!priceId || !Object.values(PRICES).includes(priceId)) {
      const isProductId = priceId?.startsWith('prod_');
      const configuredAreProductIds = Object.values(PRICES).some(p => p.startsWith('prod_'));
      
      console.error('   ❌ Validation failed!');
      console.error('   Received:', priceId);
      console.error('   Expected one of:', Object.values(PRICES));
      
      return res.status(400).json({ 
        error: 'Invalid price ID',
        message: `Price ID "${priceId}" is not configured. Valid price IDs are: ${Object.values(PRICES).join(', ')}`,
        received: priceId,
        configuredPrices: PRICES,
        hint: configuredAreProductIds 
          ? '❌ You are using PRODUCT IDs (prod_...) instead of PRICE IDs (price_...). Go to Stripe Dashboard > Products > Your Product > Pricing section and copy the Price ID.'
          : priceId?.startsWith('prod_')
          ? '❌ You sent a PRODUCT ID (prod_...) but need a PRICE ID (price_...). Check your frontend configuration.'
          : 'Make sure STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY are set correctly in your .env file and match what frontend is sending',
        detectedIssue: isProductId || configuredAreProductIds ? 'Using Product ID instead of Price ID' : 'Price ID mismatch between frontend and backend'
      });
    }
    
    console.log('   ✅ Price ID validated successfully');
    
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

// Valid promotion codes mapping (code -> Stripe promo ID)
const PROMO_CODES = {
  'FOCUSMODE26': 'promo_1SmDu6GLI9gGYuFfl32F7hYF', // 30-day free trial for yearly
};

/**
 * Create a Subscription with embedded Payment Element
 * Returns clientSecret for Stripe Elements
 * Supports promotion codes for discounts/trials
 * POST /create-subscription
 */
app.post('/create-subscription', async (req, res) => {
  try {
    const { priceId, email, userId, promotionCode } = req.body;
    
    console.log('\n🔍 Create Subscription Request:');
    console.log('   Price ID:', priceId);
    console.log('   Email:', email);
    console.log('   User ID:', userId);
    console.log('   Promotion Code:', promotionCode || 'none');
    
    // Validate price ID
    if (!priceId || !Object.values(PRICES).includes(priceId)) {
      console.error('   ❌ Invalid price ID');
      return res.status(400).json({ 
        error: 'Invalid price ID',
        received: priceId,
        configuredPrices: PRICES
      });
    }
    
    // Validate promotion code if provided
    let stripePromoId = null;
    let discountApplied = false;
    
    if (promotionCode) {
      const upperCode = promotionCode.toUpperCase();
      
      // Only allow coupon for yearly plan
      if (priceId !== PRICES.yearly) {
        return res.status(400).json({
          error: 'Coupon only valid for yearly plan'
        });
      }
      
      if (PROMO_CODES[upperCode]) {
        stripePromoId = PROMO_CODES[upperCode];
        discountApplied = true;
        console.log('   ✅ Valid promotion code:', upperCode, '->', stripePromoId);
      } else {
        return res.status(400).json({
          error: 'Invalid coupon code'
        });
      }
    }
    
    // Create or get customer
    let customer;
    
    // Check if customer already exists by email
    if (email) {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('   Found existing customer:', customer.id);
      }
    }
    
    // Create new customer if not found
    if (!customer) {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          firebaseUserId: userId || ''
        }
      });
      console.log('   Created new customer:', customer.id);
    }
    
    // Build subscription parameters
    const subscriptionParams = {
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      metadata: {
        firebaseUserId: userId || '',
        promotionCode: promotionCode || ''
      }
    };
    
    // Apply promotion code if valid (gives 30-day free trial)
    if (stripePromoId) {
      subscriptionParams.promotion_code = stripePromoId;
      console.log('   Applying promotion code:', stripePromoId);
    }
    
    // Create the subscription
    const subscription = await stripe.subscriptions.create(subscriptionParams);
    
    // For free trials or $0 invoices, payment_intent can be null. Fallback to setup intent.
    const paymentIntent = subscription.latest_invoice?.payment_intent || null;
    const setupIntent = subscription.pending_setup_intent || null;
    const clientSecret = paymentIntent?.client_secret || setupIntent?.client_secret || null;
    
    if (!clientSecret) {
      console.error('   ❌ No client secret available on subscription', subscription.id);
      return res.status(500).json({ error: 'No client secret available for this subscription' });
    }
    
    console.log('   ✅ Subscription created:', subscription.id);
    if (paymentIntent?.id) console.log('   Payment Intent:', paymentIntent.id);
    if (setupIntent?.id) console.log('   Setup Intent:', setupIntent.id);
    console.log('   Discount Applied:', discountApplied);
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret,
      customerId: customer.id,
      discountApplied: discountApplied
    });
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Confirm subscription payment was successful
 * POST /confirm-subscription
 */
app.post('/confirm-subscription', async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' });
    }
    
    // Retrieve subscription to verify status
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      console.log('✅ Subscription confirmed:', subscriptionId);
      
      // Update Firebase if configured
      if (db && userId) {
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
      
      res.json({ 
        success: true, 
        status: subscription.status,
        plan: getPlanFromPriceId(subscription.items.data[0]?.price?.id)
      });
    } else {
      res.json({ 
        success: false, 
        status: subscription.status,
        message: 'Subscription is not active yet'
      });
    }
    
  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    firebase: db ? 'connected' : 'not configured',
    prices: {
      monthly: PRICES.monthly,
      yearly: PRICES.yearly,
      usingDefaults: PRICES.monthly === 'price_monthly_499' || PRICES.yearly === 'price_yearly_4999'
    }
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
