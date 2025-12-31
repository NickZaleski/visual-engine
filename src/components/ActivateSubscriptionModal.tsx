import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ActivateSubscriptionModalProps {
  sessionId: string;
  prefillEmail?: string;
  onActivated: () => void;
  onLinkSubscription: (userId: string) => Promise<void>;
}

/**
 * Modal shown after successful Stripe checkout for unauthenticated users.
 * Requires account creation to activate the subscription.
 * Cannot be dismissed without creating an account.
 */
export function ActivateSubscriptionModal({
  sessionId,
  prefillEmail,
  onActivated,
  onLinkSubscription,
}: ActivateSubscriptionModalProps) {
  const { signIn, signUp, signInGoogle, error: authError, loading: authLoading, user } = useAuth();
  
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Update email when prefillEmail changes
  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  // When user is authenticated, link the subscription
  useEffect(() => {
    if (user && sessionId && !isLinking) {
      handleLinkSubscription(user.uid);
    }
  }, [user, sessionId]);

  const handleLinkSubscription = async (userId: string) => {
    setIsLinking(true);
    setLinkError(null);
    
    try {
      await onLinkSubscription(userId);
      onActivated();
    } catch (err) {
      console.error('Failed to link subscription:', err);
      setLinkError(
        err instanceof Error 
          ? err.message 
          : 'Failed to activate subscription. Please contact support.'
      );
      setIsLinking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        // useEffect will handle linking after auth state updates
      } else {
        if (password.length < 6) {
          setLocalError('Password must be at least 6 characters');
          return;
        }
        await signUp(email, password, displayName || undefined);
        // useEffect will handle linking after auth state updates
      }
    } catch {
      // Error is handled by the context
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      await signInGoogle();
      // useEffect will handle linking after auth state updates
    } catch {
      // Error is handled by the context
    }
  };

  const displayError = localError || authError || linkError;

  return (
    <div
      className={`fixed inset-0 z-[400] flex items-center justify-center p-4
                  transition-all duration-500
                  ${isVisible ? 'bg-cosmic-950/98 backdrop-blur-xl' : 'bg-transparent'}`}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl overflow-hidden
                    bg-gradient-to-b from-cosmic-800/90 via-cosmic-900/95 to-cosmic-950/90
                    border border-white/10 shadow-2xl
                    transition-all duration-700 ease-out
                    ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8'}`}
      >
        {/* Decorative background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-nebula-cyan/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative p-8">
          {/* Success Icon & Message */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                          bg-green-500/20 border border-green-500/30 mb-4"
            >
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-wide">
              Payment Successful!
            </h1>
            <p className="text-cosmic-300 text-sm mt-2">
              {mode === 'signup' 
                ? 'Create an account to activate your premium subscription'
                : 'Sign in to activate your premium subscription'}
            </p>
          </div>

          {/* Linking in progress */}
          {isLinking && (
            <div className="mb-4 p-4 rounded-xl bg-nebula-purple/20 border border-nebula-purple/30">
              <div className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-nebula-purple" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-nebula-purple text-sm">Activating your subscription...</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {displayError && !isLinking && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
              <p className="text-red-300 text-sm text-center">{displayError}</p>
            </div>
          )}

          {/* Form */}
          {!isLinking && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-cosmic-300 text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder-cosmic-500
                             focus:outline-none focus:border-nebula-purple/50 focus:ring-1 focus:ring-nebula-purple/50
                             transition-all duration-200"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-cosmic-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder-cosmic-500
                           focus:outline-none focus:border-nebula-purple/50 focus:ring-1 focus:ring-nebula-purple/50
                           transition-all duration-200"
                />
                {prefillEmail && mode === 'signup' && (
                  <p className="text-cosmic-500 text-xs mt-1">
                    Pre-filled from your payment
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-cosmic-300 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder-cosmic-500
                           focus:outline-none focus:border-nebula-purple/50 focus:ring-1 focus:ring-nebula-purple/50
                           transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 rounded-2xl font-semibold text-base
                         bg-gradient-to-r from-green-500 to-emerald-500 text-white
                         shadow-lg shadow-green-500/30
                         hover:shadow-xl hover:shadow-green-500/40
                         transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    {mode === 'signup' ? 'Create Account & Activate' : 'Sign In & Activate'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          {!isLinking && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 py-1 rounded-full bg-cosmic-900/90 text-cosmic-300 border border-white/10">
                  or continue with
                </span>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          {!isLinking && (
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full py-3 rounded-xl font-medium text-sm
                       bg-white/5 border border-white/10 text-white
                       hover:bg-white/10 hover:border-white/20
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-3"
            >
              {/* Google Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          )}

          {/* Mode switcher */}
          {!isLinking && (
            <div className="mt-6 text-center">
              {mode === 'signup' ? (
                <p className="text-cosmic-300 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signin');
                      setLocalError(null);
                    }}
                    className="text-nebula-purple hover:text-nebula-pink transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-cosmic-300 text-sm">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setLocalError(null);
                    }}
                    className="text-nebula-purple hover:text-nebula-pink transition-colors font-medium"
                  >
                    Sign up
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Help text */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-cosmic-500 text-xs text-center">
              Your payment has been processed. Create an account to access your premium features.
              Need help? Contact{' '}
              <a 
                href="mailto:support@calmdownspace.com" 
                className="text-nebula-purple hover:text-nebula-pink transition-colors"
              >
                support@calmdownspace.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

