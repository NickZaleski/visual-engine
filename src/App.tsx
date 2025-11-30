import { useState, useEffect, useCallback, useRef } from 'react';
import { VisualCanvas } from './components/VisualCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { TimerOverlay } from './components/TimerOverlay';
import { setBlobColor } from './visuals/blobColorState';
import { stopNotificationLoop } from './audio/NotificationSound';
import { initializeAudioContext } from './audio/AudioContextManager';
import type { TimerState } from './components/TimerControls';

/**
 * Main application component
 * Combines the visual canvas with floating control panel
 */
function App() {
  const [modeId, setModeId] = useState('breathing-blob');
  const [loopDuration, setLoopDuration] = useState(20);
  const [blobColor, setBlobColorState] = useState('#c471ed'); // Default nebula purple
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  
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
  
  // Handle timer state changes from ControlsPanel
  const handleTimerStateChange = useCallback((state: TimerState, remainingSeconds: number) => {
    setTimerState(state);
    setTimerRemainingSeconds(remainingSeconds);
  }, []);
  
  // Dismiss timer notification
  const handleDismissTimer = useCallback(() => {
    stopNotificationLoop();
    setTimerState('idle');
  }, []);
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-cosmic-900">
      {/* Visual Canvas - Background */}
      <VisualCanvas modeId={modeId} loopDuration={loopDuration} />
      
      {/* Timer Overlay - shows countdown in center */}
      <TimerOverlay
        timerState={timerState}
        remainingSeconds={timerRemainingSeconds}
        onDismiss={handleDismissTimer}
      />
      
      {/* Floating Controls Panel */}
      <ControlsPanel
        modeId={modeId}
        onModeChange={setModeId}
        loopDuration={loopDuration}
        onLoopDurationChange={setLoopDuration}
        blobColor={blobColor}
        onBlobColorChange={setBlobColorState}
        onTimerStateChange={handleTimerStateChange}
      />
      
      {/* Subtle branding */}
      <div className="fixed bottom-4 left-4 z-40 opacity-30 hover:opacity-60 transition-opacity duration-500">
        <p className="text-[10px] text-cosmic-400 font-display tracking-widest">
          VISUAL ENGINE FOR FOCUS TIMER by Nick Zaleski
        </p>
      </div>
    </div>
  );
}

export default App;
