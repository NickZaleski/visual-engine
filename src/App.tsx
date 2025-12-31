import { useState, useEffect, useCallback, useRef } from 'react';
import { VisualCanvas } from './components/VisualCanvas';
import { SoundPanel } from './components/SoundPanel';
import { VisualPanel } from './components/VisualPanel';
import { TimerOverlay } from './components/TimerOverlay';
import { FullscreenControl } from './components/FullscreenControl';
import { PaywallModal } from './components/PaywallModal';
import { LoginModal } from './components/LoginModal';
import { ActivateSubscriptionModal } from './components/ActivateSubscriptionModal';
import { TermsModal } from './components/TermsModal';
import { setBlobColor } from './visuals/blobColorState';
import { setGradientColor } from './visuals/gradientColorState';
import { stopNotificationLoop } from './audio/NotificationSound';
import { initializeAudioContext } from './audio/AudioContextManager';
import { useAuth } from './contexts/AuthContext';
import { useSubscription } from './hooks/useSubscription';
import { linkSubscription } from './stripe/config';
import type { TimerState } from './components/TimerControls';

/**
 * Main application component
 * Combines the visual canvas with floating control panel
 */
function App() {
  const { user, loading: authLoading, signOut, isConfigured, refreshUserData } = useAuth();
  const { isPaid, isLoading: subscriptionLoading } = useSubscription();
  
  const [modeId, setModeId] = useState('nebula-clouds');
  const [loopDuration] = useState(20);
  const [blobColor, setBlobColorState] = useState('#c471ed'); // Default nebula purple
  const [gradientColorState, setGradientColorState] = useState('#8b5cf6'); // Default violet
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  const [timerReset, setTimerReset] = useState(false);
  
  // Modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | undefined>(undefined);
  
  // Track if user has closed the initial paywall (determines free tier access)
  const [hasClosedPaywall, setHasClosedPaywall] = useState(() => {
    return !!localStorage.getItem('focusflow_paywall_closed');
  });
  
  // Check for pending checkout session on mount (user paid but didn't create account yet)
  useEffect(() => {
    const storedSessionId = localStorage.getItem('pending_checkout_session');
    const storedEmail = localStorage.getItem('pending_checkout_email');
    
    if (storedSessionId && !user) {
      // User has a pending subscription that needs to be linked
      setPendingSessionId(storedSessionId);
      setPendingEmail(storedEmail || undefined);
      setShowActivateModal(true);
      setShowPaywall(false);
    }
  }, [user]);
  
  // Show paywall immediately on app start for non-paid users (once per session or first visit)
  useEffect(() => {
    // Don't show during auth loading or if Firebase not configured
    if (authLoading && isConfigured) return;
    
    // If user is paid, don't show paywall
    if (isPaid) return;
    
    // If subscription is still loading for authenticated user, wait
    if (user && subscriptionLoading) return;
    
    // Show paywall if user hasn't closed it yet this session
    if (!hasClosedPaywall && isConfigured) {
      setShowPaywall(true);
    }
  }, [authLoading, isPaid, user, subscriptionLoading, hasClosedPaywall, isConfigured]);
  
  const handleSelectPlan = useCallback((plan: 'free' | 'monthly' | 'yearly') => {
    setShowPaywall(false);
    setHasClosedPaywall(true);
    localStorage.setItem('focusflow_paywall_closed', 'true');
    
    // If user selected a paid plan, they'll be redirected to Stripe
    // The webhook will update their subscription status
    if (plan === 'free') {
      // User chose to continue with free tier
      console.log('User selected free plan');
    }
  }, []);
  
  // Handle successful checkout for unauthenticated users
  const handleCheckoutSuccess = useCallback((sessionId: string, customerEmail?: string) => {
    // Store session info in localStorage (survives page refresh)
    localStorage.setItem('pending_checkout_session', sessionId);
    if (customerEmail) {
      localStorage.setItem('pending_checkout_email', customerEmail);
    }
    
    // Update state to show activation modal
    setPendingSessionId(sessionId);
    setPendingEmail(customerEmail);
    setShowPaywall(false);
    setShowActivateModal(true);
  }, []);
  
  // Handle linking subscription after account creation
  const handleLinkSubscription = useCallback(async (userId: string) => {
    if (!pendingSessionId) {
      throw new Error('No pending session to link');
    }
    
    await linkSubscription(pendingSessionId, userId);
    
    // Clear pending session from localStorage
    localStorage.removeItem('pending_checkout_session');
    localStorage.removeItem('pending_checkout_email');
    
    // Refresh user data to get updated subscription
    await refreshUserData();
  }, [pendingSessionId, refreshUserData]);
  
  // Handle activation complete
  const handleActivationComplete = useCallback(() => {
    setShowActivateModal(false);
    setPendingSessionId(null);
    setPendingEmail(undefined);
    setHasClosedPaywall(true);
    localStorage.setItem('focusflow_paywall_closed', 'true');
  }, []);
  
  // Show paywall when free user tries to use premium features
  const handlePaywallNeeded = useCallback(() => {
    if (!isPaid && isConfigured) {
      setShowPaywall(true);
    }
  }, [isPaid, isConfigured]);
  
  const handleOpenLogin = useCallback(() => {
    setShowLogin(true);
  }, []);
  
  const handleCloseLogin = useCallback(() => {
    setShowLogin(false);
  }, []);
  
  
  // Initialize audio context on first user interaction
  const audioInitialized = useRef(false);
  useEffect(() => {
    const handleInteraction = async () => {
      if (audioInitialized.current) return;
      audioInitialized.current = true;
      
      try {
        await initializeAudioContext();
      } catch (error) {
        console.debug('Audio context initialization:', error);
      }
      
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('touchstart', handleInteraction, true);
      document.removeEventListener('keydown', handleInteraction, true);
    };
    
    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('touchstart', handleInteraction, true);
    document.addEventListener('keydown', handleInteraction, true);
    
    return () => {
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('touchstart', handleInteraction, true);
      document.removeEventListener('keydown', handleInteraction, true);
    };
  }, []);
  
  // Sync blob color with the visual mode
  useEffect(() => {
    setBlobColor(blobColor);
  }, [blobColor]);
  
  // Sync gradient color with the visual mode
  useEffect(() => {
    setGradientColor(gradientColorState);
  }, [gradientColorState]);
  
  // Handle timer state changes from ControlsPanel
  const handleTimerStateChange = useCallback((state: TimerState, remainingSeconds: number) => {
    setTimerState(state);
    setTimerRemainingSeconds(remainingSeconds);
  }, []);
  
  // Dismiss timer notification
  const handleDismissTimer = useCallback(() => {
    stopNotificationLoop();
    setTimerState('idle');
    setTimerReset(true);
  }, []);
  
  // Handle when timer reset is complete
  const handleTimerResetHandled = useCallback(() => {
    setTimerReset(false);
  }, []);

  // Show loading screen while checking auth (only if Firebase is configured)
  if (authLoading && isConfigured) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-cosmic-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                          bg-cosmic-950 mb-4
                          shadow-lg shadow-nebula-purple/30 animate-pulse">
            <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c471ed" />
                  <stop offset="50%" stopColor="#12c2e9" />
                  <stop offset="100%" stopColor="#00f5d4" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="10" fill="url(#loadingGradient)" opacity="0.9"/>
              <circle cx="16" cy="16" r="7" fill="#0a0a1a" opacity="0.3"/>
              <circle cx="16" cy="16" r="4" fill="url(#loadingGradient)" opacity="0.6"/>
            </svg>
          </div>
          <p className="text-cosmic-400 text-sm">Loading Calm Down Space...</p>
        </div>
      </div>
    );
  }
  
  // In demo mode (Firebase not configured), give full access
  const effectiveIsPaid = !isConfigured || isPaid;
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-cosmic-900">
      {/* Visual Canvas - Background */}
      <VisualCanvas modeId={modeId} loopDuration={loopDuration} />
      
      {/* Demo Mode Banner - shown when Firebase is not configured */}
      {!isConfigured && (
        <div className="fixed top-0 left-0 right-0 z-[400] bg-gradient-to-r from-nebula-purple to-nebula-pink py-2 px-4 text-center">
          <p className="text-white text-xs font-medium">
            Demo Mode - Firebase not configured. All features unlocked. 
            <a 
              href="https://console.firebase.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline ml-2 hover:text-cosmic-200"
            >
              Set up Firebase
            </a>
          </p>
        </div>
      )}
      
      {/* Mobile Message Overlay - visible only on small screens (< 768px) */}
      <div className="fixed inset-0 z-50 flex md:hidden items-center justify-center bg-cosmic-900/80 backdrop-blur-md">
        <div className="text-center px-8 py-10 max-w-sm">
          <div className="mb-6 flex justify-center">
            <svg 
              className="w-16 h-16 text-nebula-purple opacity-80" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
          
          <h2 className="text-xl font-display font-semibold text-cosmic-100 mb-3 tracking-wide">
            Desktop Experience Only
          </h2>
          
          <p className="text-cosmic-300 text-sm leading-relaxed mb-6">
            This visual meditation tool is designed for larger screens. 
            Please visit on a desktop or laptop for the best experience.
          </p>
          
          <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-nebula-purple via-nebula-cyan to-nebula-pink rounded-full opacity-60" />
        </div>
      </div>
      
      {/* Timer Overlay - shows countdown in center (desktop only) */}
      <div className="hidden md:block">
        <TimerOverlay
          timerState={timerState}
          remainingSeconds={timerRemainingSeconds}
          onDismiss={handleDismissTimer}
        />
      </div>
      
      {/* Sound Panel - Left Side (desktop only) */}
      <div className="hidden md:block">
        <SoundPanel 
          isPaid={effectiveIsPaid}
          onPaywallNeeded={handlePaywallNeeded}
        />
      </div>
      
      {/* Visual Panel - Right Side (desktop only) */}
      <div className="hidden md:block">
        <VisualPanel
          modeId={modeId}
          onModeChange={setModeId}
          blobColor={blobColor}
          onBlobColorChange={setBlobColorState}
          gradientColor={gradientColorState}
          onGradientColorChange={setGradientColorState}
          onTimerStateChange={handleTimerStateChange}
          timerReset={timerReset}
          onTimerResetHandled={handleTimerResetHandled}
          isPaid={effectiveIsPaid}
          onPaywallNeeded={handlePaywallNeeded}
        />
      </div>
      
      {/* Fullscreen Controls - Bottom Center (desktop only) */}
      <div className="hidden md:block">
        <FullscreenControl />
      </div>
      
      {/* User Account Button (desktop only) - only show if Firebase is configured */}
      {isConfigured && user && (
        <div className="hidden md:block fixed top-4 right-4 z-[500]">
          <div className="flex items-center gap-3">
            {/* Subscription badge - only for authenticated paid users */}
            {isPaid && (
              <span className="px-2 py-1 rounded-full bg-gradient-to-r from-nebula-purple to-nebula-pink
                             text-[10px] font-bold uppercase tracking-wider text-white
                             shadow-md shadow-nebula-purple/40">
                Premium
              </span>
            )}
            
            {/* User avatar/button for authenticated users */}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-cosmic-800/40 backdrop-blur-sm border border-cosmic-600/20
                       text-xs text-cosmic-300 font-display tracking-wider
                       opacity-60 hover:opacity-100 hover:bg-cosmic-700/50 hover:text-cosmic-100
                       transition-all duration-300"
              title="Sign out"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="" 
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-nebula-purple/50 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Subtle branding & Terms (desktop only) */}
      <div className="hidden md:flex fixed bottom-4 left-4 z-40 items-center gap-4 opacity-30 hover:opacity-60 transition-opacity duration-500">
        <p className="text-[10px] text-cosmic-400 font-display tracking-widest">
          CALM DOWN SPACE by Nick Zaleski
        </p>
        <span className="text-cosmic-600">|</span>
        <TermsModal />
      </div>
      
      {/* Bottom right actions (desktop only) */}
      <div className="hidden md:flex fixed bottom-4 right-4 z-40 items-center gap-3">
        {/* Sign In button for unauthenticated users */}
        {isConfigured && !user && (
          <button
            onClick={handleOpenLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-gradient-to-r from-nebula-purple/80 to-nebula-pink/80
                     text-xs text-white font-display tracking-wider font-medium
                     shadow-lg shadow-nebula-purple/30
                     hover:shadow-nebula-purple/50 hover:scale-[1.02]
                     transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Sign In</span>
          </button>
        )}
      </div>
      
      {/* Login Modal - shown when user clicks sign in button */}
      {showLogin && isConfigured && <LoginModal onClose={handleCloseLogin} />}
      
      {/* Paywall Modal - shown for free users on app start (only if Firebase is configured) */}
      {!showLogin && !showActivateModal && showPaywall && isConfigured && (
        <PaywallModal 
          onSelectPlan={handleSelectPlan} 
          userId={user?.uid}
          userEmail={user?.email || undefined}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      )}
      
      {/* Activate Subscription Modal - shown after payment for unauthenticated users */}
      {showActivateModal && pendingSessionId && isConfigured && (
        <ActivateSubscriptionModal
          sessionId={pendingSessionId}
          prefillEmail={pendingEmail}
          onActivated={handleActivationComplete}
          onLinkSubscription={handleLinkSubscription}
        />
      )}
      
    </div>
  );
}

export default App;
