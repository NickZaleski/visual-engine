import { useState } from 'react';
import { NoiseControls } from './NoiseControls';
import { FrequencyControls } from './FrequencyControls';
import { useHoverSound } from '../hooks/useHoverSound';

interface SoundPanelProps {
  isPaid: boolean;
  onPaywallNeeded: () => void;
}

/**
 * Left-side floating panel for sound/audio controls
 */
export function SoundPanel({ isPaid, onPaywallNeeded }: SoundPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
            <NoiseControls 
              isPaid={isPaid}
              onPaywallNeeded={onPaywallNeeded}
            />
          </section>
          
          {/* Divider */}
          <div className="border-t border-white/5" />
          
          {/* Frequency Controls */}
          <section>
            <FrequencyControls 
              isPaid={isPaid}
              onPaywallNeeded={onPaywallNeeded}
            />
          </section>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-cosmic-900/30">
          <p className="text-[10px] text-cosmic-500">
            Combine noise + frequencies for optimal focus
          </p>
        </div>
      </div>
      
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
