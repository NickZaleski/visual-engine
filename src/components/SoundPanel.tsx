import { useState } from 'react';
import { NoiseControls } from './NoiseControls';
import { FrequencyControls } from './FrequencyControls';
import { useHoverSound } from '../hooks/useHoverSound';

/**
 * Left-side floating panel for sound/audio controls
 */
export function SoundPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);
  const hoverSound = useHoverSound();
  
  return (
    <div
      className={`
        fixed top-6 left-6 z-50 transition-all duration-500 ease-out
        ${isCollapsed ? 'w-12' : 'w-72'}
      `}
    >
      {/* Collapse Toggle - on the right side for left panel */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        {...hoverSound}
        className="absolute -right-3 top-4 w-6 h-6 rounded-full glass flex items-center justify-center
                   text-cosmic-300 hover:text-white transition-colors duration-300 z-10
                   shadow-lg shadow-cosmic-900/50"
        aria-label={isCollapsed ? 'Expand controls' : 'Collapse controls'}
      >
        <svg 
          className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Main Panel */}
      <div
        className={`
          glass rounded-2xl overflow-hidden transition-all duration-500
          ${isCollapsed ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}
        `}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-nebula-pink/10 to-nebula-purple/10">
          <h1 className="font-display font-bold text-lg text-white tracking-wider">
            SOUND ENGINE
          </h1>
          <p className="text-xs text-cosmic-400 mt-1">Ambient audio experience</p>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Noise Controls */}
          <section>
            <NoiseControls />
          </section>
          
          {/* Divider */}
          <div className="border-t border-white/5" />
          
          {/* Frequency Controls */}
          <section>
            <FrequencyControls />
          </section>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-cosmic-900/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-cosmic-500">
              Combine noise + frequencies for optimal focus
            </p>
            {/* Spotify Button */}
            <button
              onClick={() => setShowSpotify(true)}
              {...hoverSound}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md
                         bg-[#1DB954]/10 hover:bg-[#1DB954]/20
                         text-[#1DB954] text-[10px] font-medium
                         transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Music</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Spotify Modal */}
      {showSpotify && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-cosmic-900/80 backdrop-blur-sm"
          onClick={() => setShowSpotify(false)}
        >
          <div 
            className="relative w-[400px] max-w-[90vw] glass rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowSpotify(false)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full glass flex items-center justify-center
                         text-cosmic-300 hover:text-white transition-colors duration-200 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Header */}
            <div className="mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <h3 className="font-display font-semibold text-white tracking-wide">Focus Music</h3>
            </div>
            
            {/* Spotify Embed */}
            <iframe 
              src="https://open.spotify.com/embed/artist/6dLjH4CwfSpjjLTa2xsIFv?utm_source=generator&theme=0" 
              width="100%" 
              height="352" 
              frameBorder="0" 
              allowFullScreen 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              className="rounded-xl"
              style={{ borderRadius: '12px' }}
            />
          </div>
        </div>
      )}
      
      {/* Collapsed indicator */}
      {isCollapsed && (
        <div 
          className="glass rounded-xl p-3 animate-pulse-slow cursor-pointer"
          onClick={() => setIsCollapsed(false)}
          {...hoverSound}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-nebula-pink to-nebula-purple animate-glow" />
        </div>
      )}
    </div>
  );
}

