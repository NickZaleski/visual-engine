import { useState, useEffect, useCallback } from 'react';
import { VisualCanvas } from './components/VisualCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { TimerOverlay } from './components/TimerOverlay';
import { setBlobColor } from './visuals/blobColorState';
import { stopNotificationLoop } from './audio/NotificationSound';
import type { TimerState } from './components/TimerControls';

/**
 * Main application component
 * Combines the visual canvas with floating control panel
 */
function App() {
  const [modeId, setModeId] = useState('breathing-blob');
  const [loopDuration, setLoopDuration] = useState(30);
  const [blobColor, setBlobColorState] = useState('#c471ed'); // Default nebula purple
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  
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
          VISUAL ENGINE v1.0
        </p>
      </div>
    </div>
  );
}

export default App;
