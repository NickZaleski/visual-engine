import { useState, useEffect, useCallback, useRef } from 'react';
import { VisualCanvas } from './components/VisualCanvas';
import { SoundPanel } from './components/SoundPanel';
import { VisualPanel } from './components/VisualPanel';
import { TimerOverlay } from './components/TimerOverlay';
import { FullscreenControl } from './components/FullscreenControl';
import { WelcomePopup } from './components/WelcomePopup';
import { setBlobColor } from './visuals/blobColorState';
import { setGradientColor } from './visuals/gradientColorState';
import { stopNotificationLoop } from './audio/NotificationSound';
import { initializeAudioContext } from './audio/AudioContextManager';
import type { TimerState } from './components/TimerControls';

/**
 * Main application component
 * Combines the visual canvas with floating control panel
 */
function App() {
  const [modeId, setModeId] = useState('breathing-blob');
  const [loopDuration] = useState(20);
  const [blobColor, setBlobColorState] = useState('#c471ed'); // Default nebula purple
  const [gradientColorState, setGradientColorState] = useState('#8b5cf6'); // Default violet
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  const [timerReset, setTimerReset] = useState(false);
  
  // Welcome popup state
  const [showWelcome, setShowWelcome] = useState(() => {
    // Show popup if user hasn't seen it yet
    return !localStorage.getItem('focusflow_welcome_seen');
  });
  
  const handleCloseWelcome = useCallback(() => {
    localStorage.setItem('focusflow_welcome_seen', 'true');
    setShowWelcome(false);
  }, []);
  
  // Initialize audio context on first user interaction
  // Note: Browsers require a real user gesture (click/touch/keydown) for audio
  // Hover sounds will work after the first click anywhere on the page
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
      
      // Remove all listeners after initialization
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('touchstart', handleInteraction, true);
      document.removeEventListener('keydown', handleInteraction, true);
    };
    
    // Use capture phase to ensure we catch the event before any stopPropagation
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
    setTimerReset(true); // Trigger reset in TimerControls
  }, []);
  
  // Handle when timer reset is complete
  const handleTimerResetHandled = useCallback(() => {
    setTimerReset(false);
  }, []);
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-cosmic-900">
      {/* Visual Canvas - Background */}
      <VisualCanvas modeId={modeId} loopDuration={loopDuration} />
      
      {/* Mobile Message Overlay - visible only on small screens (< 768px) */}
      <div className="fixed inset-0 z-50 flex md:hidden items-center justify-center bg-cosmic-900/80 backdrop-blur-md">
        <div className="text-center px-8 py-10 max-w-sm">
          {/* Desktop icon */}
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
          
          {/* Title */}
          <h2 className="text-xl font-display font-semibold text-cosmic-100 mb-3 tracking-wide">
            Desktop Experience Only
          </h2>
          
          {/* Message */}
          <p className="text-cosmic-300 text-sm leading-relaxed mb-6">
            This visual meditation tool is designed for larger screens. 
            Please visit on a desktop or laptop for the best experience.
          </p>
          
          {/* Decorative gradient line */}
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
        <SoundPanel />
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
        />
      </div>
      
      {/* Fullscreen Controls - Bottom Center (desktop only) */}
      <div className="hidden md:block">
        <FullscreenControl />
      </div>
      
      {/* Subtle branding (desktop only) */}
      <div className="hidden md:block fixed bottom-4 left-4 z-40 opacity-30 hover:opacity-60 transition-opacity duration-500">
        <p className="text-[10px] text-cosmic-400 font-display tracking-widest">
          FOCUS FLOW by Nick Zaleski
        </p>
      </div>
      
      {/* Support & Contact (desktop only) */}
      <div className="hidden md:flex fixed bottom-4 right-4 z-40 items-center gap-4">
        {/* Email - plain text */}
        <a
          href="mailto:sidfedner27@gmail.com"
          className="text-[11px] text-cosmic-500 hover:text-cosmic-300 
                     transition-colors duration-300 opacity-60 hover:opacity-100"
        >
          sidfedner27@gmail.com
        </a>
        
        {/* Instagram */}
        <a
          href="https://www.instagram.com/calmdownspace/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cosmic-500 hover:text-[#E1306C] 
                     transition-colors duration-300 opacity-60 hover:opacity-100"
          title="@calmdownspace"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        
        {/* Coffee support */}
        <a
          href="https://buymeacoffee.com/nickzaleski"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-cosmic-800/40 backdrop-blur-sm border border-cosmic-600/20
                     text-xs text-cosmic-300 font-display tracking-wider
                     opacity-40 hover:opacity-90 hover:bg-cosmic-700/50 hover:text-cosmic-100 hover:border-cosmic-500/30
                     transition-all duration-300"
        >
          <span>☕</span>
          <span>Support</span>
        </a>
      </div>
      
      {/* Welcome Popup - shown on first visit */}
      {showWelcome && <WelcomePopup onClose={handleCloseWelcome} />}
    </div>
  );
}

export default App;
