import { useState, useEffect, useCallback, useRef } from 'react';
import { useHoverSound } from '../hooks/useHoverSound';
import { startNotificationLoop, stopNotificationLoop } from '../audio/NotificationSound';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

interface TimerControlsProps {
  onTimerStateChange: (state: TimerState, remainingSeconds: number) => void;
}

const PRESET_MINUTES = [10, 25, 60];

/**
 * Timer controls component with start/pause/stop functionality
 */
export function TimerControls({ onTimerStateChange }: TimerControlsProps) {
  const [duration, setDuration] = useState(25); // minutes
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const intervalRef = useRef<number | null>(null);
  const hoverSound = useHoverSound();
  
  // Update parent when state changes
  useEffect(() => {
    onTimerStateChange(timerState, remainingSeconds);
  }, [timerState, remainingSeconds, onTimerStateChange]);
  
  // Timer tick logic
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Timer finished
            setTimerState('finished');
            startNotificationLoop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);
  
  // Handle duration change from slider
  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
    if (timerState === 'idle') {
      setRemainingSeconds(newDuration * 60);
    }
  }, [timerState]);
  
  // Start timer
  const startTimer = useCallback(() => {
    if (timerState === 'idle') {
      setRemainingSeconds(duration * 60);
    }
    setTimerState('running');
  }, [duration, timerState]);
  
  // Pause timer
  const pauseTimer = useCallback(() => {
    setTimerState('paused');
  }, []);
  
  // Resume timer
  const resumeTimer = useCallback(() => {
    setTimerState('running');
  }, []);
  
  // Stop timer
  const stopTimer = useCallback(() => {
    setTimerState('idle');
    setRemainingSeconds(duration * 60);
    stopNotificationLoop();
  }, [duration]);
  
  // Dismiss notification
  const dismissNotification = useCallback(() => {
    stopNotificationLoop();
    setTimerState('idle');
    setRemainingSeconds(duration * 60);
  }, [duration]);
  
  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-cosmic-200 font-display tracking-wide">
          Meditation Timer
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          timerState === 'running' 
            ? 'bg-nebula-cyan/20 text-nebula-cyan'
            : timerState === 'paused'
            ? 'bg-nebula-purple/20 text-nebula-purple'
            : timerState === 'finished'
            ? 'bg-nebula-pink/20 text-nebula-pink animate-pulse'
            : 'bg-cosmic-600/50 text-cosmic-300'
        }`}>
          {timerState === 'idle' && 'Ready'}
          {timerState === 'running' && 'Running'}
          {timerState === 'paused' && 'Paused'}
          {timerState === 'finished' && 'Finished!'}
        </span>
      </div>
      
      {/* Timer finished notification */}
      {timerState === 'finished' && (
        <button
          onClick={dismissNotification}
          {...hoverSound}
          className="w-full py-3 rounded-xl font-display font-medium text-sm tracking-wider
                     bg-gradient-to-r from-nebula-pink to-nebula-purple text-white
                     shadow-lg shadow-nebula-pink/30 animate-pulse
                     hover:shadow-nebula-pink/50 transition-all duration-300"
        >
          <span className="flex items-center justify-center gap-2">
            <BellIcon />
            Dismiss Notification
          </span>
        </button>
      )}
      
      {/* Duration selector - only when idle */}
      {timerState === 'idle' && (
        <>
          {/* Quick preset buttons */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_MINUTES.map((mins) => (
              <button
                key={mins}
                onClick={() => handleDurationChange(mins)}
                {...hoverSound}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${duration === mins
                    ? 'bg-gradient-to-r from-nebula-purple/30 to-nebula-blue/30 text-white border border-nebula-purple/50'
                    : 'bg-cosmic-700/30 text-cosmic-300 border border-transparent hover:bg-cosmic-600/40 hover:text-cosmic-100'
                  }
                `}
              >
                {mins}m
              </button>
            ))}
          </div>
          
          {/* Duration slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cosmic-400">Duration</span>
              <span className="text-sm text-nebula-cyan font-mono font-medium">
                {duration} min
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={duration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
              {...hoverSound}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-cosmic-500">
              <span>1m</span>
              <span>30m</span>
              <span>60m</span>
            </div>
          </div>
        </>
      )}
      
      {/* Timer display when not idle */}
      {timerState !== 'idle' && timerState !== 'finished' && (
        <div className="text-center py-2">
          <span className="text-2xl font-mono text-white font-medium">
            {formatTime(remainingSeconds)}
          </span>
        </div>
      )}
      
      {/* Control buttons */}
      <div className="flex gap-2">
        {timerState === 'idle' && (
          <button
            onClick={startTimer}
            {...hoverSound}
            className="flex-1 py-2.5 rounded-xl font-display font-medium text-sm tracking-wider
                       bg-gradient-to-r from-nebula-blue/80 to-nebula-cyan/80 text-white
                       shadow-lg shadow-nebula-blue/20 hover:shadow-nebula-blue/40
                       transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <PlayIcon />
              Start Timer
            </span>
          </button>
        )}
        
        {timerState === 'running' && (
          <>
            <button
              onClick={pauseTimer}
              {...hoverSound}
              className="flex-1 py-2.5 rounded-xl font-display font-medium text-sm tracking-wider
                         bg-gradient-to-r from-nebula-purple/80 to-nebula-pink/80 text-white
                         shadow-lg shadow-nebula-purple/20 hover:shadow-nebula-purple/40
                         transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <PauseIcon />
                Pause
              </span>
            </button>
            <button
              onClick={stopTimer}
              {...hoverSound}
              className="px-4 py-2.5 rounded-xl font-display font-medium text-sm tracking-wider
                         bg-cosmic-700/50 text-cosmic-200 border border-cosmic-500/30
                         hover:bg-cosmic-600/50 hover:text-white
                         transition-all duration-300"
            >
              <StopIcon />
            </button>
          </>
        )}
        
        {timerState === 'paused' && (
          <>
            <button
              onClick={resumeTimer}
              {...hoverSound}
              className="flex-1 py-2.5 rounded-xl font-display font-medium text-sm tracking-wider
                         bg-gradient-to-r from-nebula-blue/80 to-nebula-cyan/80 text-white
                         shadow-lg shadow-nebula-blue/20 hover:shadow-nebula-blue/40
                         transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <PlayIcon />
                Resume
              </span>
            </button>
            <button
              onClick={stopTimer}
              {...hoverSound}
              className="px-4 py-2.5 rounded-xl font-display font-medium text-sm tracking-wider
                         bg-cosmic-700/50 text-cosmic-200 border border-cosmic-500/30
                         hover:bg-cosmic-600/50 hover:text-white
                         transition-all duration-300"
            >
              <StopIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Icon components
function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
    </svg>
  );
}

export default TimerControls;

