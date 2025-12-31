# Payment Server Setup

## Important: You Need to Run This Server!

**Stripe Checkout is hosted by Stripe**, but **you need YOUR backend server** to create the checkout session first.

### Architecture Flow:
1. **Frontend** → Calls your backend server (`localhost:4242`) to create checkout session
2. **Backend** → Calls Stripe API to create session
3. **Backend** → Returns Stripe checkout URL
4. **Frontend** → Redirects to Stripe-hosted checkout page
5. **After payment** → Stripe redirects back to your app

## Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   cd server
   npm install
   ```

2. **Make sure your `.env` file exists** in the `server/` directory with:
   ```
   STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
   STRIPE_PRICE_MONTHLY=price_...
   STRIPE_PRICE_YEARLY=price_...
   PORT=4242
   
   # Firebase Configuration (optional - for subscription sync)
   # Option 1: Use Project ID (for Google Cloud deployments with ADC)
   FIREBASE_PROJECT_ID=calm-down-space
   
   # Option 2: Use Service Account Key (recommended for local development)
   # FIREBASE_SERVICE_ACCOUNT_KEY=./path/to/service-account-key.json
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Verify it's running**:
   - You should see: `🚀 Stripe Checkout Server running on port 4242`
   - Test the health endpoint: `http://localhost:4242/health`

## Troubleshooting

### "Cannot connect to payment server" error

This means the backend server isn't running or isn't accessible. Check:

1. **Is the server running?**
   ```bash
   lsof -ti:4242
   ```
   If nothing is returned, the server isn't running.

2. **Is the port correct?**
   - Server should be on port `4242`
   - Frontend expects `http://localhost:4242` (see `src/stripe/config.ts`)

3. **Check server logs** for errors when starting

4. **Verify `.env` file** has correct Stripe keys

### Running Both Frontend and Backend

You need **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Firebase Configuration

The server supports two methods for Firebase authentication:

### Option 1: Project ID (for Google Cloud deployments)
Add to your `.env`:
```
FIREBASE_PROJECT_ID=calm-down-space
```
This uses Application Default Credentials (ADC) and works when running on Google Cloud.

### Option 2: Service Account Key (recommended for local development)
1. Download service account key from Firebase Console:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file
2. Add to your `.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY=./path/to/service-account-key.json
   ```

**Current Configuration:**
- Project ID: `calm-down-space`
- Project Number: `848620401092` (for reference)

## Production Deployment

For production, you'll need to:
1. Deploy the backend server (e.g., Heroku, Railway, Render)
2. Update `VITE_API_URL` environment variable to point to your deployed server
3. Set up Stripe webhooks to point to your deployed server's `/webhook` endpoint
4. Configure Firebase using one of the methods above

