import { useState, useEffect } from 'react';
import {
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  onSuccess: (email?: string) => void;
  onError: (error: string) => void;
  subscriptionId: string;
  userId?: string;
  defaultEmail?: string;
}

/**
 * Stripe Payment Element form component
 * Renders the embedded payment form with email collection and tabs layout
 */
export function StripePaymentForm({ 
  onSuccess, 
  onError,
  subscriptionId,
  userId,
  defaultEmail = ''
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState(defaultEmail);

  useEffect(() => {
    if (!stripe) return;

    // Check payment status on mount (in case of redirect back)
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent?.status) {
          case 'succeeded':
            setMessage('Payment succeeded!');
            onSuccess();
            break;
          case 'processing':
            setMessage('Your payment is processing.');
            break;
          case 'requires_payment_method':
            setMessage('Your payment was not successful, please try again.');
            break;
          default:
            setMessage('Something went wrong.');
            break;
        }
      });
    }
  }, [stripe, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL for 3D Secure and other redirects
        return_url: `${window.location.origin}?payment=success&subscription_id=${subscriptionId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      // Show error to customer
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An error occurred');
        onError(error.message || 'Payment failed');
      } else {
        setMessage('An unexpected error occurred.');
        onError('An unexpected error occurred');
      }
      setIsProcessing(false);
      return;
    }

    // Payment succeeded without redirect
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment successful!');
      onSuccess(email);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email collection with Stripe Link integration */}
      <LinkAuthenticationElement
        id="link-authentication-element"
        options={{
          defaultValues: {
            email: defaultEmail,
          },
        }}
        onChange={(e) => {
          setEmail(e.value.email);
        }}
      />
      
      {/* Payment methods */}
      <PaymentElement 
        id="payment-element"
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
            radios: false,
            spacedAccordionItems: true,
          },
          // Payment methods are determined by:
          // 1. What's enabled in Stripe Dashboard (Settings → Payment methods)
          // 2. Customer's country/currency
          // 3. Whether the payment method supports subscriptions
          // 
          // To add PayPal, SEPA, etc:
          // Go to https://dashboard.stripe.com/settings/payment_methods
          business: {
            name: 'Calm Down Space',
          },
        }}
      />
      
      {message && (
        <div className={`text-sm text-center p-2 rounded-lg ${
          message.includes('success') || message.includes('succeeded')
            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
            : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full py-3.5 rounded-xl font-semibold text-sm
                   bg-gradient-to-r from-nebula-purple to-nebula-pink text-white 
                   shadow-lg shadow-nebula-purple/30 
                   hover:shadow-xl hover:shadow-nebula-purple/40
                   transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Complete Payment
          </span>
        )}
      </button>
      
      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-[10px] text-cosmic-400">
          Secured by Stripe • 256-bit SSL encryption
        </span>
      </div>
    </form>
  );
}

