import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { visualModeRegistry } from '../visuals/engine';
import { TimerControls, type TimerState } from './TimerControls';
import { useHoverSound } from '../hooks/useHoverSound';

interface VisualPanelProps {
  modeId: string;
  onModeChange: (modeId: string) => void;
  blobColor: string;
  onBlobColorChange: (color: string) => void;
  gradientColor: string;
  onGradientColorChange: (color: string) => void;
  onTimerStateChange: (state: TimerState, remainingSeconds: number) => void;
  timerReset?: boolean;
  onTimerResetHandled?: () => void;
  isPaid?: boolean;
  onPaywallNeeded?: () => void;
}

// Preset colors for visuals
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

// Free visual mode (only nebula-clouds is free)
const FREE_VISUAL_MODE = 'nebula-clouds';

/**
 * Right-side floating panel for visual controls
 */
export function VisualPanel({
  modeId,
  onModeChange,
  blobColor,
  onBlobColorChange,
  gradientColor,
  onGradientColorChange,
  onTimerStateChange,
  timerReset,
  onTimerResetHandled,
  isPaid = false,
  onPaywallNeeded,
}: VisualPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hoverSound = useHoverSound();

  // Check which color controls to show based on mode
  const showBlobColorControls = modeId === 'breathing-blob';
  const showGradientColorControls = modeId === 'gradient-flow';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isDropdownOpen]);

  // Handle mode selection
  const handleModeSelect = (selectedModeId: string) => {
    const isLocked = !isPaid && selectedModeId !== FREE_VISUAL_MODE;
    
    if (isLocked) {
      // Show paywall for locked modes
      onPaywallNeeded?.();
    } else {
      // Allow selection for free mode or paid users
      onModeChange(selectedModeId);
    }
    setIsDropdownOpen(false);
  };

  // Check if a mode is locked
  const isModeLockedFn = (checkModeId: string) => !isPaid && checkModeId !== FREE_VISUAL_MODE;
  
  
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
          className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} 
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
          <p className="text-xs text-cosmic-400 mt-1">Cosmic focus experience</p>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Timer Section - Always show with restrictions for free users */}
          <section className="space-y-3">
            <TimerControls 
              onTimerStateChange={onTimerStateChange}
              externalReset={timerReset}
              onResetHandled={onTimerResetHandled}
              isPaid={isPaid}
              onPaywallNeeded={onPaywallNeeded}
            />
          </section>
          
          {/* Divider */}
          <div className="border-t border-white/5" />
          
          {/* Visual Mode Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-display font-semibold text-cosmic-300 uppercase tracking-widest">
              Visual Mode
            </h2>
            
            {/* Custom Dropdown */}
            <div className="relative">
              {/* Dropdown Button */}
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                {...hoverSound}
                className="w-full px-4 py-3 rounded-xl bg-cosmic-700/40 text-white text-sm
                           border border-cosmic-500/20 hover:border-nebula-purple/50 focus:border-nebula-purple/50 focus:outline-none
                           cursor-pointer transition-all duration-300 font-body
                           flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {visualModeRegistry.find(m => m.id === modeId)?.name}
                </span>
                <svg 
                  className={`w-5 h-5 text-cosmic-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu - Rendered via portal to escape overflow clipping */}
              {isDropdownOpen && createPortal(
                <div 
                  ref={dropdownRef}
                  className="fixed py-2 rounded-xl bg-cosmic-800/95 backdrop-blur-xl
                             border border-cosmic-500/30 shadow-xl shadow-cosmic-900/50 z-[9999]
                             max-h-64 overflow-y-auto"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                  }}
                >
                  {visualModeRegistry.map((mode) => {
                    const isLocked = isModeLockedFn(mode.id);
                    const isSelected = mode.id === modeId;
                    
                    return (
                      <button
                        key={mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                        {...hoverSound}
                        className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-sm
                                   transition-all duration-200
                                   ${isSelected 
                                     ? 'bg-nebula-purple/20 text-white' 
                                     : isLocked
                                       ? 'text-cosmic-400 hover:bg-cosmic-700/50'
                                       : 'text-white hover:bg-cosmic-700/50'
                                   }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && (
                            <svg className="w-4 h-4 text-nebula-cyan" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={isSelected ? '' : 'ml-6'}>{mode.name}</span>
                        </span>
                        
                        {isLocked && (
                          <svg className="w-4 h-4 text-nebula-pink/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>,
                document.body
              )}
            </div>
            
            <p className="text-xs text-cosmic-400 italic">
              {visualModeRegistry.find(m => m.id === modeId)?.description}
            </p>
            
            {/* Unlock More Visuals - Show for free users on default mode */}
            {!isPaid && modeId === 'nebula-clouds' && (
              <button
                onClick={() => onPaywallNeeded?.()}
                {...hoverSound}
                className="w-full py-3 rounded-xl font-display font-medium text-sm tracking-wider
                         bg-gradient-to-r from-nebula-cyan/20 to-nebula-purple/20 text-white
                         border border-nebula-cyan/40
                         hover:from-nebula-cyan/30 hover:to-nebula-purple/30
                         hover:border-nebula-cyan/60 hover:shadow-lg hover:shadow-nebula-cyan/20
                         transition-all duration-300 group"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-nebula-cyan group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Unlock 6 More Visuals</span>
                  <svg className="w-4 h-4 text-nebula-cyan/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            )}
          </section>

          {/* Blob Color Section - Only show for Breathing Blob mode */}
          {showBlobColorControls && (
            <>
              <div className="border-t border-white/5" />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-display font-semibold text-cosmic-300 uppercase tracking-widest">
                    Blob Color
                  </h2>
                  {!isPaid && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-nebula-purple/30 to-nebula-pink/30 
                                   text-nebula-pink font-semibold uppercase tracking-wider border border-nebula-pink/30">
                      Premium
                    </span>
                  )}
                </div>
                
                {isPaid ? (
                  <>
                    {/* Color Picker */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={blobColor}
                          onChange={(e) => onBlobColorChange(e.target.value)}
                          {...hoverSound}
                          className="w-12 h-12 rounded-xl cursor-pointer border-2 border-cosmic-500/30 
                                     hover:border-nebula-purple/50 transition-all duration-300 overflow-hidden"
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

                    {/* Color Presets - Compact */}
                    <div className="flex flex-wrap gap-1.5">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => onBlobColorChange(preset.color)}
                          {...hoverSound}
                          className={`
                            relative w-7 h-7 rounded-md transition-all duration-300
                            hover:scale-110 hover:z-10 group
                            ${blobColor.toLowerCase() === preset.color.toLowerCase() 
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-cosmic-900 scale-105' 
                              : 'hover:ring-1 hover:ring-white/50'
                            }
                          `}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        >
                          {/* Checkmark for selected */}
                          {blobColor.toLowerCase() === preset.color.toLowerCase() && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-cosmic-400">
                      Customize your blob with beautiful color options.
                    </p>
                    <button
                      onClick={() => onPaywallNeeded?.()}
                      {...hoverSound}
                      className="w-full py-2.5 rounded-xl font-display font-medium text-sm tracking-wider
                               bg-gradient-to-r from-nebula-purple/30 to-nebula-pink/30 text-white
                               border border-nebula-purple/50
                               hover:from-nebula-purple/50 hover:to-nebula-pink/50
                               transition-all duration-300"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Unlock Colors
                      </span>
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {/* Gradient Color Section - Only show for Gradient Flow mode */}
          {showGradientColorControls && (
            <>
              <div className="border-t border-white/5" />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-display font-semibold text-cosmic-300 uppercase tracking-widest">
                    Gradient Color
                  </h2>
                  {!isPaid && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-nebula-purple/30 to-nebula-pink/30 
                                   text-nebula-pink font-semibold uppercase tracking-wider border border-nebula-pink/30">
                      Premium
                    </span>
                  )}
                </div>
                
                {isPaid ? (
                  <>
                    {/* Color Picker */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={gradientColor}
                          onChange={(e) => onGradientColorChange(e.target.value)}
                          {...hoverSound}
                          className="w-12 h-12 rounded-xl cursor-pointer border-2 border-cosmic-500/30 
                                     hover:border-nebula-purple/50 transition-all duration-300 overflow-hidden"
                          style={{ 
                            backgroundColor: gradientColor,
                            padding: 0,
                          }}
                        />
                        <div 
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{ 
                            background: `linear-gradient(135deg, ${gradientColor}40 0%, transparent 50%)`,
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                          {colorPresets.find(p => p.color.toLowerCase() === gradientColor.toLowerCase())?.name || 'Custom'}
                        </p>
                        <p className="text-xs text-cosmic-400 font-mono uppercase">{gradientColor}</p>
                      </div>
                    </div>

                    {/* Color Presets - Compact */}
                    <div className="flex flex-wrap gap-1.5">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => onGradientColorChange(preset.color)}
                          {...hoverSound}
                          className={`
                            relative w-7 h-7 rounded-md transition-all duration-300
                            hover:scale-110 hover:z-10 group
                            ${gradientColor.toLowerCase() === preset.color.toLowerCase() 
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-cosmic-900 scale-105' 
                              : 'hover:ring-1 hover:ring-white/50'
                            }
                          `}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        >
                          {/* Checkmark for selected */}
                          {gradientColor.toLowerCase() === preset.color.toLowerCase() && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-cosmic-400">
                      Customize your gradient with beautiful color options.
                    </p>
                    <button
                      onClick={() => onPaywallNeeded?.()}
                      {...hoverSound}
                      className="w-full py-2.5 rounded-xl font-display font-medium text-sm tracking-wider
                               bg-gradient-to-r from-nebula-purple/30 to-nebula-pink/30 text-white
                               border border-nebula-purple/50
                               hover:from-nebula-purple/50 hover:to-nebula-pink/50
                               transition-all duration-300"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Unlock Colors
                      </span>
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          
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
