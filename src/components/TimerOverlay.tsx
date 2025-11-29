import type { TimerState } from './TimerControls';

interface TimerOverlayProps {
  timerState: TimerState;
  remainingSeconds: number;
  onDismiss: () => void;
}

/**
 * Full-screen overlay showing countdown timer
 * Semi-transparent so visuals can still be seen
 */
export function TimerOverlay({ timerState, remainingSeconds, onDismiss }: TimerOverlayProps) {
  // Only show when timer is running, paused, or finished
  if (timerState === 'idle') {
    return null;
  }
  
  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
      {/* Timer display */}
      <div className={`
        text-center transition-all duration-500
        ${timerState === 'finished' ? 'pointer-events-auto' : ''}
      `}>
        {/* Countdown - running or paused */}
        {(timerState === 'running' || timerState === 'paused') && (
          <div className="relative">
            {/* Glow effect behind text */}
            <div 
              className="absolute inset-0 blur-3xl opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(196, 113, 237, 0.4) 0%, transparent 70%)',
              }}
            />
            
            {/* Time display */}
            <div className={`
              relative font-mono text-8xl md:text-9xl font-bold tracking-wider
              ${timerState === 'paused' ? 'animate-pulse' : ''}
            `}
              style={{
                color: 'rgba(255, 255, 255, 0.25)',
                textShadow: '0 0 60px rgba(196, 113, 237, 0.3)',
              }}
            >
              {formatTime(remainingSeconds)}
            </div>
            
            {/* Status indicator */}
            {timerState === 'paused' && (
              <div className="mt-4 text-lg font-display tracking-widest uppercase"
                style={{ color: 'rgba(196, 113, 237, 0.4)' }}
              >
                Paused
              </div>
            )}
          </div>
        )}
        
        {/* Finished state - with dismiss button */}
        {timerState === 'finished' && (
          <div className="relative">
            {/* Animated glow */}
            <div 
              className="absolute inset-0 blur-3xl animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, transparent 70%)',
              }}
            />
            
            {/* Completion message */}
            <div className="relative">
              <div 
                className="font-display text-4xl md:text-5xl font-bold tracking-wider mb-6 animate-pulse"
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  textShadow: '0 0 40px rgba(244, 63, 94, 0.5)',
                }}
              >
                Time's Up!
              </div>
              
              {/* Dismiss button */}
              <button
                onClick={onDismiss}
                className="px-8 py-4 rounded-2xl font-display font-medium text-lg tracking-wider
                           bg-gradient-to-r from-nebula-pink/90 to-nebula-purple/90 text-white
                           shadow-2xl shadow-nebula-pink/40 animate-bounce
                           hover:shadow-nebula-pink/60 hover:scale-105
                           transition-all duration-300 pointer-events-auto"
              >
                <span className="flex items-center justify-center gap-3">
                  <BellOffIcon />
                  Dismiss
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BellOffIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm0-19.5c-.83 0-1.5.67-1.5 1.5v.68l7.5 7.5V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5zM5.41 3.35L4 4.76l2.81 2.81C6.29 8.57 6 9.74 6 11v5l-2 2v1h14.24l1.74 1.74 1.41-1.41L5.41 3.35zM16 17H8v-6c0-.68.12-1.32.34-1.9L16 16.76V17z" />
    </svg>
  );
}

export default TimerOverlay;

