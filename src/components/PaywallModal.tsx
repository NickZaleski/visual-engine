import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { 
  STRIPE_PRICES, 
  API_URL, 
  getEndpointUrl,
  stripePromise 
} from '../stripe/config';
import { StripePaymentForm } from './StripePaymentForm';

interface PaywallModalProps {
  onSelectPlan: (plan: 'free' | 'monthly' | 'yearly') => void;
  userId?: string;
  userEmail?: string;
  onCheckoutSuccess?: (sessionId: string, customerEmail?: string) => void;
}

type Step = 'select-plan' | 'payment';

/**
 * Paywall modal with embedded Stripe Payment Element
 * Uses tabs layout for payment methods
 */
export function PaywallModal({ onSelectPlan, userId, userEmail, onCheckoutSuccess }: PaywallModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'free'>('yearly');
  const [step, setStep] = useState<Step>('select-plan');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stripe Elements state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  
  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Check for successful payment on page load (redirect back from 3D Secure)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const subId = params.get('subscription_id');
    
    if (paymentStatus === 'success' && subId) {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Confirm subscription and grant access
      confirmSubscription(subId);
    }
  }, []);
  
  const confirmSubscription = async (subId: string) => {
    try {
      const response = await fetch(getEndpointUrl('confirmSubscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId, userId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onSelectPlan(data.plan || 'yearly');
        }
      }
    } catch (err) {
      console.error('Failed to confirm subscription:', err);
    }
  };
  
  const handleContinue = async () => {
    if (selectedPlan === 'free') {
      onSelectPlan('free');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const priceId = selectedPlan === 'yearly' ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;
    
    console.log('💳 Creating subscription:', {
      plan: selectedPlan,
      priceId,
      apiUrl: API_URL
    });
    
    try {
      // Create subscription and get client secret for Payment Element
      const response = await fetch(getEndpointUrl('createSubscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          email: userEmail,
          userId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setSubscriptionId(data.subscriptionId);
        setStep('payment');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to start payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(`Could not connect to payment server. Please try again.`);
    }
    
    setIsLoading(false);
  };
  
  const handlePaymentSuccess = async (customerEmail?: string) => {
    if (subscriptionId) {
      await confirmSubscription(subscriptionId);
    }
    // Call onCheckoutSuccess with email if provided
    if (customerEmail && onCheckoutSuccess) {
      onCheckoutSuccess(subscriptionId || '', customerEmail);
    }
    onSelectPlan(selectedPlan === 'free' ? 'free' : selectedPlan);
  };
  
  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };
  
  const handleBack = () => {
    setStep('select-plan');
    setClientSecret(null);
    setSubscriptionId(null);
    setError(null);
  };
  
  // Stripe Elements appearance (dark theme to match app)
  const stripeAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#c471ed',
      colorBackground: '#1a1a2e',
      colorText: '#ffffff',
      colorDanger: '#ff6b6b',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      '.Input:focus': {
        border: '1px solid #c471ed',
        boxShadow: '0 0 0 1px #c471ed',
      },
      '.Tab': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      '.Tab:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      '.Tab--selected': {
        backgroundColor: 'rgba(196, 113, 237, 0.2)',
        borderColor: '#c471ed',
      },
      '.Label': {
        color: 'rgba(255, 255, 255, 0.7)',
      },
    },
  };
  
  return (
    <div 
      className={`fixed inset-0 z-[300] flex items-center justify-center p-4
                  transition-all duration-500
                  ${isVisible ? 'bg-cosmic-950/95 backdrop-blur-xl' : 'bg-transparent'}`}
    >
      <div 
        className={`relative w-full max-w-md rounded-2xl overflow-hidden
                    bg-gradient-to-b from-cosmic-800/90 via-cosmic-900/95 to-cosmic-950/90
                    border border-white/10 shadow-2xl
                    transition-all duration-700 ease-out
                    ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8'}`}
      >
        {/* Decorative background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-nebula-purple/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-nebula-cyan/20 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative p-4 sm:p-6">
          {step === 'select-plan' ? (
            <>
              {/* Logo/Brand */}
              <div className="text-center mb-3 sm:mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl 
                                bg-cosmic-950 mb-2 sm:mb-3
                                shadow-lg shadow-nebula-purple/30">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="none">
                    <defs>
                      <linearGradient id="paywallGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c471ed" />
                        <stop offset="50%" stopColor="#12c2e9" />
                        <stop offset="100%" stopColor="#00f5d4" />
                      </linearGradient>
                    </defs>
                    <circle cx="16" cy="16" r="10" fill="url(#paywallGradient)" opacity="0.9"/>
                    <circle cx="16" cy="16" r="7" fill="#0a0a1a" opacity="0.3"/>
                    <circle cx="16" cy="16" r="4" fill="url(#paywallGradient)" opacity="0.6"/>
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide">
                  Calm Down Space
                </h1>
                <p className="text-cosmic-400 text-xs sm:text-sm mt-1">
                  Ambient sounds & visuals for deep focus
                </p>
              </div>
              
              {/* Plan Options */}
              <div className="space-y-2 mb-3 sm:mb-4">
                {/* Yearly - Best Value */}
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative w-full p-3 rounded-xl text-left transition-all duration-300
                             ${selectedPlan === 'yearly' 
                               ? 'bg-gradient-to-r from-nebula-purple/30 to-nebula-pink/30 border-2 border-nebula-purple/60 shadow-lg shadow-nebula-purple/20' 
                               : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                >
                  <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full
                                  bg-gradient-to-r from-nebula-purple to-nebula-pink
                                  text-[9px] font-bold uppercase tracking-wider text-white
                                  shadow-md shadow-nebula-purple/40">
                    Best Value
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                       transition-colors duration-200
                                       ${selectedPlan === 'yearly' 
                                         ? 'border-nebula-purple bg-nebula-purple' 
                                         : 'border-cosmic-500'}`}>
                        {selectedPlan === 'yearly' && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Yearly</p>
                        <p className="text-cosmic-400 text-[10px]">Save 17% vs monthly</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-base">$49.99</p>
                      <p className="text-cosmic-400 text-[10px]">per year</p>
                    </div>
                  </div>
                </button>
                
                {/* Monthly */}
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-3 rounded-xl text-left transition-all duration-300
                             ${selectedPlan === 'monthly' 
                               ? 'bg-gradient-to-r from-nebula-cyan/20 to-nebula-purple/20 border-2 border-nebula-cyan/50 shadow-lg shadow-nebula-cyan/10' 
                               : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                       transition-colors duration-200
                                       ${selectedPlan === 'monthly' 
                                         ? 'border-nebula-cyan bg-nebula-cyan' 
                                         : 'border-cosmic-500'}`}>
                        {selectedPlan === 'monthly' && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Monthly</p>
                        <p className="text-cosmic-400 text-[10px]">Cancel anytime</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-base">$4.99</p>
                      <p className="text-cosmic-400 text-[10px]">per month</p>
                    </div>
                  </div>
                </button>
                
                {/* Free */}
                <button
                  onClick={() => setSelectedPlan('free')}
                  className={`w-full p-3 rounded-xl text-left transition-all duration-300
                             ${selectedPlan === 'free' 
                               ? 'bg-white/10 border-2 border-white/30' 
                               : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                       transition-colors duration-200
                                       ${selectedPlan === 'free' 
                                         ? 'border-white bg-white' 
                                         : 'border-cosmic-500'}`}>
                        {selectedPlan === 'free' && (
                          <svg className="w-2.5 h-2.5 text-cosmic-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Free</p>
                        <p className="text-cosmic-400 text-[10px]">Limited sound selection</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-base">$0</p>
                      <p className="text-cosmic-400 text-[10px]">forever</p>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Features comparison */}
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-white/5">
                <p className="text-cosmic-300 text-[10px] font-medium mb-1.5 uppercase tracking-wider">
                  {selectedPlan === 'free' ? 'Free includes:' : 'Premium includes:'}
                </p>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <li className="flex items-center gap-1.5 text-xs text-cosmic-200">
                    <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Visual modes</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-xs text-cosmic-200">
                    <svg className={`w-3 h-3 flex-shrink-0 ${selectedPlan === 'free' ? 'text-cosmic-500' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={selectedPlan === 'free' ? 'text-cosmic-500' : ''}>
                      {selectedPlan === 'free' ? 'Basic sounds' : 'All sounds'}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5 text-xs text-cosmic-200">
                    <svg className={`w-3 h-3 flex-shrink-0 ${selectedPlan === 'free' ? 'text-cosmic-500' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={selectedPlan === 'free' ? 'text-cosmic-500' : ''}>
                      {selectedPlan === 'free' ? 'Limited freq.' : 'All frequencies'}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5 text-xs text-cosmic-200">
                    <svg className={`w-3 h-3 flex-shrink-0 ${selectedPlan === 'free' ? 'text-cosmic-500' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      {selectedPlan === 'free' ? (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span className={selectedPlan === 'free' ? 'text-cosmic-500 line-through' : ''}>
                      Focus timer
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5 text-xs text-cosmic-200">
                    <svg className={`w-3 h-3 flex-shrink-0 ${selectedPlan === 'free' ? 'text-cosmic-500' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      {selectedPlan === 'free' ? (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span className={selectedPlan === 'free' ? 'text-cosmic-500 line-through' : ''}>
                      Color options
                    </span>
                  </li>
                </ul>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}
              
              {/* CTA Button */}
              <button
                onClick={handleContinue}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-semibold text-sm
                           transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           ${selectedPlan === 'free'
                             ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                             : 'bg-gradient-to-r from-nebula-purple to-nebula-pink text-white shadow-lg shadow-nebula-purple/30 hover:shadow-xl hover:shadow-nebula-purple/40'
                           }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : selectedPlan === 'free' ? (
                  'Continue with Free'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Subscribe for ${selectedPlan === 'yearly' ? '49.99/year' : '4.99/month'}
                  </span>
                )}
              </button>
              
              {/* Trust Section & Terms */}
              <div className="mt-3 space-y-2">
                {selectedPlan !== 'free' && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[10px] text-cosmic-300">Secure</span>
                      </div>
                      <span className="text-cosmic-600">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-cosmic-400">via</span>
                        <img src="/stripe.svg" alt="Stripe" className="h-4" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-5 bg-white rounded flex items-center justify-center p-0.5">
                        <img src="/visa.svg" alt="Visa" className="h-full w-full object-contain" />
                      </div>
                      <div className="w-8 h-5 bg-white rounded flex items-center justify-center p-0.5">
                        <img src="/mastercard.svg" alt="Mastercard" className="h-full w-full object-contain" />
                      </div>
                      <div className="w-8 h-5 rounded flex items-center justify-center overflow-hidden">
                        <img src="/american_express.svg" alt="American Express" className="h-full w-full object-cover" />
                      </div>
                      <div className="w-8 h-5 bg-white rounded flex items-center justify-center p-0.5">
                        <img src="/paypal.svg" alt="PayPal" className="h-full w-full object-contain" />
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-cosmic-400 text-[10px] text-center">
                  {selectedPlan !== 'free' && (
                    <>Cancel anytime. By subscribing, you agree to our Terms.</>
                  )}
                  {selectedPlan === 'free' && (
                    <>Upgrade anytime to unlock all features.</>
                  )}
                </p>
              </div>
            </>
          ) : (
            /* Payment Step with Stripe Elements */
            <>
              {/* Header with back button */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">Complete Payment</h2>
                  <p className="text-cosmic-400 text-xs">
                    {selectedPlan === 'yearly' ? 'Yearly plan • $49.99/year' : 'Monthly plan • $4.99/month'}
                  </p>
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}
              
              {/* Stripe Payment Element */}
              {clientSecret && subscriptionId && (
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    appearance: stripeAppearance,
                    // Enable all payment methods configured in Stripe Dashboard
                    // Payment methods will be shown based on customer location and currency
                    loader: 'auto',
                  }}
                >
                  <StripePaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    subscriptionId={subscriptionId}
                    userId={userId}
                    defaultEmail={userEmail}
                  />
                </Elements>
              )}
              
              {/* Cancel anytime note */}
              <p className="text-cosmic-400 text-[10px] text-center mt-4">
                Cancel anytime. By subscribing, you agree to our Terms.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
