import { useState, useEffect, useCallback, useRef } from 'react';
import { VisualCanvas } from './components/VisualCanvas';
import { SoundPanel } from './components/SoundPanel';
import { VisualPanel } from './components/VisualPanel';
import { TimerOverlay } from './components/TimerOverlay';
import { FullscreenControl } from './components/FullscreenControl';
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
          VISUAL ENGINE FOR FOCUS TIMER by Nick Zaleski
        </p>
      </div>
      
      {/* Coffee support link (desktop only) */}
      <a
        href="https://buymeacoffee.com/nickzaleski"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex fixed bottom-4 right-4 z-40 items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-cosmic-800/40 backdrop-blur-sm border border-cosmic-600/20
                   text-xs text-cosmic-300 font-display tracking-wider
                   opacity-40 hover:opacity-90 hover:bg-cosmic-700/50 hover:text-cosmic-100 hover:border-cosmic-500/30
                   transition-all duration-300"
      >
        <span>☕</span>
        <span>Support</span>
      </a>
    </div>
  );
}

export default App;
