import { useState, useRef, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { UserSubscription, SubscriptionPlan } from '../firebase/firestore';
import { createPortalSession } from '../stripe/config';

interface ProfileDropdownProps {
  user: User;
  subscription: UserSubscription | null;
  isPaid: boolean;
  onSignOut: () => void;
  onOpenAbout: () => void;
}

/**
 * Profile dropdown menu for signed-in users
 * Shows user info, subscription details, and actions
 */
export function ProfileDropdown({ 
  user, 
  subscription, 
  isPaid,
  onSignOut,
  onOpenAbout 
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Format subscription plan name
  const formatPlan = (plan: SubscriptionPlan): string => {
    if (plan === 'monthly') return 'Monthly';
    if (plan === 'yearly') return 'Yearly';
    return 'Free';
  };

  // Format renewal date
  const formatRenewalDate = (): string | null => {
    if (!subscription?.currentPeriodEnd) return null;
    const date = subscription.currentPeriodEnd.toDate();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle manage subscription click
  const handleManageSubscription = useCallback(async () => {
    if (!subscription?.stripeCustomerId) return;
    
    setIsLoadingPortal(true);
    try {
      const portalUrl = await createPortalSession(subscription.stripeCustomerId);
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      // Could show a toast/notification here
    } finally {
      setIsLoadingPortal(false);
    }
  }, [subscription?.stripeCustomerId]);

  // Handle about click
  const handleAboutClick = useCallback(() => {
    setIsOpen(false);
    onOpenAbout();
  }, [onOpenAbout]);

  // Handle sign out
  const handleSignOut = useCallback(() => {
    setIsOpen(false);
    onSignOut();
  }, [onSignOut]);

  const renewalDate = formatRenewalDate();

  return (
    <div ref={dropdownRef} className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                   bg-cosmic-800/40 backdrop-blur-sm border border-cosmic-600/20
                   opacity-60 hover:opacity-100 hover:bg-cosmic-700/50
                   transition-all duration-300"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="" 
            className="w-7 h-7 rounded-full ring-2 ring-cosmic-600/30"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nebula-purple to-nebula-pink 
                          flex items-center justify-center ring-2 ring-cosmic-600/30">
            <span className="text-xs text-white font-bold">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        
        {/* Premium badge */}
        {isPaid && (
          <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-nebula-purple to-nebula-pink
                          text-[9px] font-bold uppercase tracking-wider text-white
                          shadow-sm shadow-nebula-purple/40">
            Pro
          </span>
        )}
        
        {/* Dropdown arrow */}
        <svg 
          className={`w-3.5 h-3.5 text-cosmic-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 py-2 rounded-xl
                     bg-cosmic-850/95 backdrop-blur-xl border border-cosmic-600/30
                     shadow-2xl shadow-cosmic-900/80
                     animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-cosmic-600/20">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="" 
                  className="w-10 h-10 rounded-full ring-2 ring-cosmic-600/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nebula-purple to-nebula-pink 
                                flex items-center justify-center ring-2 ring-cosmic-600/30">
                  <span className="text-sm text-white font-bold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {user.displayName && (
                  <p className="text-sm font-medium text-cosmic-100 truncate">
                    {user.displayName}
                  </p>
                )}
                <p className="text-xs text-cosmic-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Status Section */}
          <div className="px-4 py-3 border-b border-cosmic-600/20">
            {isPaid && subscription ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-nebula-pink" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-cosmic-100">
                    Premium {formatPlan(subscription.plan)}
                  </span>
                </div>
                {renewalDate && (
                  <p className="text-xs text-cosmic-400 pl-6">
                    {subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'}: {renewalDate}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cosmic-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-cosmic-400">Free Plan</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Manage Subscription - only show for paid users with Stripe customer ID */}
            {isPaid && subscription?.stripeCustomerId && (
              <button
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                           text-sm text-cosmic-200 hover:text-white hover:bg-cosmic-700/50
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors duration-150"
              >
                {isLoadingPortal ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                <span>Manage Subscription</span>
              </button>
            )}

            {/* About */}
            <button
              onClick={handleAboutClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                         text-sm text-cosmic-200 hover:text-white hover:bg-cosmic-700/50
                         transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>About</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-1 border-t border-cosmic-600/20">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                         text-sm text-cosmic-400 hover:text-red-400 hover:bg-cosmic-700/50
                         transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

