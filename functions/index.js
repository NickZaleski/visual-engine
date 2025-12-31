/**
 * Firebase Cloud Functions for Stripe Integration
 * 
 * These functions handle:
 * - Creating Stripe Checkout sessions
 * - Managing customer portal sessions
 * - Processing Stripe webhooks
 * - Syncing subscription data to Firestore
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Stripe with secret key from Firebase config
// Set with: firebase functions:config:set stripe.secret_key="sk_live_..."
const stripe = require("stripe")(functions.config().stripe?.secret_key);

// Helper function for Stripe calls
function getStripe() {
  return stripe;
}

// Price IDs from Stripe Dashboard
const PRICES = {
  monthly: "price_1SkOx6GLI9gGYuFfKpivFSc1",
  yearly: "price_1SkOxfGLI9gGYuFfUkxLgHsK",
};

/**
 * Helper: Update user subscription in Firestore
 */
async function updateUserSubscription(userId, subscriptionData) {
  try {
    const userRef = db.collection("users").doc(userId);
    await userRef.set({
      subscription: subscriptionData,
    }, { merge: true });
    console.log(`✅ Updated subscription for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to update subscription for user ${userId}:`, error);
  }
}

/**
 * Helper: Find user by Stripe customer ID
 */
async function findUserByStripeCustomerId(customerId) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("subscription.stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error finding user by Stripe customer ID:", error);
    return null;
  }
}

/**
 * Helper: Get plan type from price ID
 */
function getPlanFromPriceId(priceId) {
  if (priceId === PRICES.monthly || priceId?.includes("monthly")) {
    return "monthly";
  }
  if (priceId === PRICES.yearly || priceId?.includes("yearly")) {
    return "yearly";
  }
  return null;
}

/**
 * Create a Stripe Checkout Session
 * POST /createCheckoutSession
 */
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { priceId, successUrl, cancelUrl, userId, userEmail } = req.body;

      console.log("🔍 Checkout Session Request:");
      console.log("   Received priceId:", priceId);
      console.log("   Configured prices:", PRICES);

      // Validate price ID
      if (!priceId || !Object.values(PRICES).includes(priceId)) {
        return res.status(400).json({
          error: "Invalid price ID",
          message: `Price ID "${priceId}" is not configured. Valid price IDs are: ${Object.values(PRICES).join(", ")}`,
          configuredPrices: PRICES,
        });
      }

      // Build checkout session options
      const sessionOptions = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${req.headers.origin}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.origin}?checkout=cancel`,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        metadata: {
          firebaseUserId: userId || "",
        },
      };

      // Pre-fill customer email if provided
      if (userEmail) {
        sessionOptions.customer_email = userEmail;
      }

      // Create Stripe Checkout Session
      const session = await getStripe().checkout.sessions.create(sessionOptions);

      console.log("✅ Checkout session created:", session.id);

      res.json({
        id: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create Customer Portal Session
 * POST /createPortalSession
 */
exports.createPortalSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { customerId, returnUrl } = req.body;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || req.headers.origin,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get session status (verify payment)
 * GET /sessionStatus?session_id=xxx
 */
exports.sessionStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { session_id } = req.query;

      if (!session_id) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const session = await getStripe().checkout.sessions.retrieve(session_id);

      res.json({
        status: session.payment_status,
        customer_email: session.customer_details?.email,
        subscription_id: session.subscription,
      });
    } catch (error) {
      console.error("Error retrieving session:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Link a Stripe subscription to a Firebase user account
 * POST /linkSubscription
 */
exports.linkSubscription = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { sessionId, userId } = req.body;

      if (!sessionId || !userId) {
        return res.status(400).json({ error: "Missing sessionId or userId" });
      }

      // Retrieve the checkout session from Stripe
      const session = await getStripe().checkout.sessions.retrieve(sessionId);

      // Validate payment was completed
      if (session.payment_status !== "paid") {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Check if session has already been linked to a user
      if (session.metadata?.firebaseUserId && session.metadata.firebaseUserId !== "") {
        if (session.metadata.firebaseUserId !== userId) {
          return res.status(400).json({
            error: "This subscription is already linked to a different account",
          });
        }
        return res.json({ success: true, alreadyLinked: true });
      }

      // Get subscription details
      if (!session.subscription) {
        return res.status(400).json({ error: "No subscription found for this session" });
      }

      const subscription = await getStripe().subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0]?.price?.id;

      // Update Firebase user with subscription data
      await updateUserSubscription(userId, {
        status: "active",
        plan: getPlanFromPriceId(priceId),
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
          subscription.current_period_end * 1000
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      // Update Stripe customer metadata with Firebase user ID
      await getStripe().customers.update(session.customer, {
        metadata: { firebaseUserId: userId },
      });

      // Also update the subscription metadata
      await getStripe().subscriptions.update(session.subscription, {
        metadata: { firebaseUserId: userId },
      });

      console.log(`✅ Linked subscription ${session.subscription} to user ${userId}`);

      res.json({ success: true });
    } catch (error) {
      console.error("Error linking subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Stripe Webhook Handler
 * POST /stripeWebhook
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 
                         functions.config().stripe?.webhook_secret;

  let event;

  try {
    if (endpointSecret) {
      event = getStripe().webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } else {
      event = req.body;
      console.warn("⚠️ Webhook signature verification skipped (no secret configured)");
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("✅ Checkout completed:", session.id);

      const firebaseUserId = session.metadata?.firebaseUserId;

      if (firebaseUserId && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0]?.price?.id;

        await updateUserSubscription(firebaseUserId, {
          status: "active",
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

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      console.log("🔄 Subscription updated:", subscription.id);

      const userId = await findUserByStripeCustomerId(subscription.customer);
      if (userId) {
        const priceId = subscription.items.data[0]?.price?.id;

        let status = "active";
        if (subscription.status === "canceled") {
          status = "cancelled";
        } else if (subscription.status === "past_due") {
          status = "past_due";
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

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log("❌ Subscription cancelled:", subscription.id);

      const userId = await findUserByStripeCustomerId(subscription.customer);
      if (userId) {
        await updateUserSubscription(userId, {
          status: "cancelled",
          plan: null,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.log("⚠️ Payment failed:", invoice.id);

      const userId = await findUserByStripeCustomerId(invoice.customer);
      if (userId) {
        await updateUserSubscription(userId, {
          status: "past_due",
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Create a Subscription with Payment Element
 * POST /createSubscription
 * Returns clientSecret for embedded payment form
 */
exports.createSubscription = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { priceId, email, userId } = req.body;

      console.log("🔍 Create Subscription Request:");
      console.log("   Price ID:", priceId);
      console.log("   Email:", email);
      console.log("   User ID:", userId);

      // Validate price ID
      if (!priceId || !Object.values(PRICES).includes(priceId)) {
        return res.status(400).json({
          error: "Invalid price ID",
          received: priceId,
          configuredPrices: PRICES,
        });
      }

      // Create or get customer
      let customer;

      // Check if customer already exists by email
      if (email) {
        const existingCustomers = await getStripe().customers.list({
          email: email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          console.log("   Found existing customer:", customer.id);
        }
      }

      // Create new customer if not found
      if (!customer) {
        customer = await getStripe().customers.create({
          email: email,
          metadata: {
            firebaseUserId: userId || "",
          },
        });
        console.log("   Created new customer:", customer.id);
      }

      // Create the subscription with payment_behavior: 'default_incomplete'
      const subscription = await getStripe().subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          firebaseUserId: userId || "",
        },
      });

      const paymentIntent = subscription.latest_invoice.payment_intent;

      console.log("   ✅ Subscription created:", subscription.id);
      console.log("   Payment Intent:", paymentIntent.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Confirm a Subscription payment
 * POST /confirmSubscription
 */
exports.confirmSubscription = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { subscriptionId, userId } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ error: "Subscription ID required" });
      }

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

      if (subscription.status === "active" || subscription.status === "trialing") {
        // Update Firebase user if userId provided
        if (userId) {
          const priceId = subscription.items.data[0]?.price?.id;
          await updateUserSubscription(userId, {
            status: "active",
            plan: getPlanFromPriceId(priceId),
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
              subscription.current_period_end * 1000
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }

        res.json({ success: true, status: subscription.status });
      } else {
        res.status(400).json({
          success: false,
          status: subscription.status,
          message: `Subscription status is ${subscription.status}`,
        });
      }
    } catch (error) {
      console.error("Error confirming subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Health check endpoint
 * GET /health
 */
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      status: "ok",
      prices: PRICES,
      timestamp: new Date().toISOString(),
    });
  });
});

