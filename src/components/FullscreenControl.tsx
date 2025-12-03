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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {/* Top-left corner - arrow pointing out */}
      <path d="M8 3H5a2 2 0 00-2 2v3" />
      <path d="M3 3l6 6" />
      {/* Top-right corner - arrow pointing out */}
      <path d="M16 3h3a2 2 0 012 2v3" />
      <path d="M21 3l-6 6" />
      {/* Bottom-left corner - arrow pointing out */}
      <path d="M8 21H5a2 2 0 01-2-2v-3" />
      <path d="M3 21l6-6" />
      {/* Bottom-right corner - arrow pointing out */}
      <path d="M16 21h3a2 2 0 002-2v-3" />
      <path d="M21 21l-6-6" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {/* Top-left corner - arrow pointing in */}
      <path d="M4 14h4v4" />
      <path d="M3 21l5-5" />
      {/* Top-right corner - arrow pointing in */}
      <path d="M20 14h-4v4" />
      <path d="M21 21l-5-5" />
      {/* Bottom-left corner - arrow pointing in */}
      <path d="M4 10h4V6" />
      <path d="M3 3l5 5" />
      {/* Bottom-right corner - arrow pointing in */}
      <path d="M20 10h-4V6" />
      <path d="M21 3l-5 5" />
    </svg>
  );
}


