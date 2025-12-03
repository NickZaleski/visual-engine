import { useState, useCallback, useEffect } from 'react';
import { useHoverSound } from '../hooks/useHoverSound';

/**
 * Fullscreen control component - positioned at bottom center of viewport
 */
export function FullscreenControl() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hoverSound = useHoverSound();
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      {isFullscreen ? (
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
          <p className="text-xs text-cosmic-300">
            Press <kbd className="px-1.5 py-0.5 rounded bg-cosmic-700/50 text-cosmic-200 font-mono text-[10px]">ESC</kbd> to exit fullscreen
          </p>
          <button
            onClick={toggleFullscreen}
            {...hoverSound}
            className="px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-cosmic-700/50 text-cosmic-200 border border-cosmic-500/20
                       hover:bg-cosmic-600/50 hover:text-white hover:border-cosmic-400/30
                       transition-all duration-300 flex items-center gap-1.5"
          >
            <ExitFullscreenIcon />
            Exit
          </button>
        </div>
      ) : (
        <button
          onClick={toggleFullscreen}
          {...hoverSound}
          className="glass rounded-xl px-4 py-2.5 font-display font-medium text-sm tracking-wider
                     text-cosmic-200 hover:text-white
                     hover:bg-white/10 transition-all duration-300 
                     flex items-center gap-2"
        >
          <FullscreenIcon />
          Enter Fullscreen
        </button>
      )}
    </div>
  );
}

function FullscreenIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 9V4m0 5H4m0 0l5-5m5 9v5m0-5h5m0 0l-5 5M9 15v5m0-5H4m0 0l5 5m5-15v-5m0 5h5m0 0l-5-5" />
    </svg>
  );
}


