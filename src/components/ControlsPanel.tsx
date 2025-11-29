import { useState, useCallback } from 'react';
import { visualModeRegistry } from '../visuals/engine';
import { NoiseControls } from './NoiseControls';
import { useHoverSound } from '../hooks/useHoverSound';

interface ControlsPanelProps {
  modeId: string;
  onModeChange: (modeId: string) => void;
  loopDuration: number;
  onLoopDurationChange: (duration: number) => void;
  blobColor: string;
  onBlobColorChange: (color: string) => void;
}

// Preset colors for the blob
const colorPresets = [
  { name: 'Nebula Purple', color: '#c471ed' },
  { name: 'Ocean Blue', color: '#12c2e9' },
  { name: 'Sunset Pink', color: '#ff6b9d' },
  { name: 'Aurora Green', color: '#00f5d4' },
  { name: 'Golden Hour', color: '#f5af19' },
  { name: 'Deep Violet', color: '#8b5cf6' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Mint', color: '#34d399' },
];

/**
 * Floating control panel for visual and audio settings
 */
export function ControlsPanel({
  modeId,
  onModeChange,
  loopDuration,
  onLoopDurationChange,
  blobColor,
  onBlobColorChange,
}: ControlsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
  useState(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  // Check if we should show blob color controls
  const showBlobColorControls = modeId === 'breathing-blob';
  
  return (
    <div
      className={`
        fixed top-6 right-6 z-50 transition-all duration-500 ease-out
        ${isCollapsed ? 'w-12' : 'w-80'}
      `}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        {...hoverSound}
        className="absolute -left-3 top-4 w-6 h-6 rounded-full glass flex items-center justify-center
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
        <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-nebula-purple/10 to-nebula-blue/10">
          <h1 className="font-display font-bold text-lg text-white tracking-wider">
            VISUAL ENGINE
          </h1>
          <p className="text-xs text-cosmic-400 mt-1">Cosmic meditation experience</p>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Visual Mode Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-display font-semibold text-cosmic-300 uppercase tracking-widest">
              Visual Mode
            </h2>
            <select
              value={modeId}
              onChange={(e) => onModeChange(e.target.value)}
              {...hoverSound}
              className="w-full px-4 py-3 rounded-xl bg-cosmic-700/40 text-white text-sm
                         border border-cosmic-500/20 focus:border-nebula-purple/50 focus:outline-none
                         cursor-pointer transition-all duration-300 font-body
                         appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238a8aca'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {visualModeRegistry.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-cosmic-400 italic">
              {visualModeRegistry.find(m => m.id === modeId)?.description}
            </p>
          </section>

          {/* Blob Color Section - Only show for Breathing Blob mode */}
          {showBlobColorControls && (
            <>
              <div className="border-t border-white/5" />
              <section className="space-y-3">
                <h2 className="text-xs font-display font-semibold text-cosmic-300 uppercase tracking-widest">
                  Blob Color
                </h2>
                
                {/* Color Picker */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={blobColor}
                      onChange={(e) => onBlobColorChange(e.target.value)}
                      {...hoverSound}
                      className="w-12 h-12 rounded-xl cursor-pointer border-2 border-cosmic-500/30 
                                 hover:border-nebula-purple/50 transition-all duration-300"
                      style={{ 
                        backgroundColor: blobColor,
                        padding: 0,
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ 
                        background: `linear-gradient(135deg, ${blobColor}40 0%, transparent 50%)`,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                      {colorPresets.find(p => p.color.toLowerCase() === blobColor.toLowerCase())?.name || 'Custom'}
                    </p>
                    <p className="text-xs text-cosmic-400 font-mono uppercase">{blobColor}</p>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => onBlobColorChange(preset.color)}
                      {...hoverSound}
                      className={`
                        relative w-full aspect-square rounded-lg transition-all duration-300
                        hover:scale-110 hover:z-10 group
                        ${blobColor.toLowerCase() === preset.color.toLowerCase() 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-cosmic-900 scale-105' 
                          : 'hover:ring-1 hover:ring-white/50'
                        }
                      `}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    >
                      {/* Glow effect */}
                      <div 
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ 
                          boxShadow: `0 0 20px ${preset.color}80`,
                        }}
                      />
                      {/* Checkmark for selected */}
                      {blobColor.toLowerCase() === preset.color.toLowerCase() && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          
          {/* Loop Duration Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-display font-semibold text-cosmic-300 uppercase tracking-widest">
              Loop Duration
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cosmic-400">Duration</span>
                <span className="text-sm text-nebula-cyan font-mono font-medium">
                  {loopDuration}s
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="60"
                step="1"
                value={loopDuration}
                onChange={(e) => onLoopDurationChange(parseInt(e.target.value))}
                {...hoverSound}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-cosmic-500">
                <span>8s</span>
                <span>30s</span>
                <span>60s</span>
              </div>
            </div>
          </section>
          
          {/* Divider */}
          <div className="border-t border-white/5" />
          
          {/* Noise Controls */}
          <section>
            <NoiseControls />
          </section>
          
          {/* Divider */}
          <div className="border-t border-white/5" />
          
          {/* Fullscreen Toggle */}
          <section>
            <button
              onClick={toggleFullscreen}
              {...hoverSound}
              className="w-full py-3 rounded-xl font-display font-medium text-sm tracking-wider
                         bg-cosmic-700/40 text-cosmic-200 border border-cosmic-500/20
                         hover:bg-cosmic-600/50 hover:text-white hover:border-cosmic-400/30
                         transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isFullscreen ? (
                <>
                  <ExitFullscreenIcon />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <FullscreenIcon />
                  Enter Fullscreen
                </>
              )}
            </button>
          </section>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-cosmic-900/30">
          <p className="text-[10px] text-cosmic-500 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-cosmic-700/50 text-cosmic-300 font-mono">ESC</kbd> to exit fullscreen
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
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-nebula-purple to-nebula-blue animate-glow" />
        </div>
      )}
    </div>
  );
}

// Icon components
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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 9V4m0 5H4m0 0l5-5m5 9v5m0-5h5m0 0l-5 5M9 15v5m0-5H4m0 0l5 5m5-15v-5m0 5h5m0 0l-5-5" />
    </svg>
  );
}
