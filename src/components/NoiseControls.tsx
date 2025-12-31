import { useState, useEffect, useRef } from 'react';
import { getNoiseGenerator, type NoiseType } from '../audio/NoiseGenerator';
import { useHoverSound } from '../hooks/useHoverSound';

interface NoiseControlsProps {
  isPaid: boolean;
  onPaywallNeeded: () => void;
}

const noiseTypes: { id: NoiseType; label: string; description: string; premium: boolean }[] = [
  { id: 'white', label: 'White', description: 'Bright, even frequencies', premium: true },
  { id: 'pink', label: 'Pink', description: 'Balanced, natural sound', premium: true },
  { id: 'brown', label: 'Brown', description: 'Deep, rumbling bass', premium: false },
];

/**
 * UI component for controlling noise generation
 */
export function NoiseControls({ isPaid, onPaywallNeeded }: NoiseControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentType, setCurrentType] = useState<NoiseType>('brown');
  const [volume, setVolume] = useState(0.01); // Default 1%
  const noiseRef = useRef(getNoiseGenerator());
  const hoverSound = useHoverSound();
  
  // Update noise generator when volume changes
  useEffect(() => {
    noiseRef.current.setVolume(volume);
  }, [volume]);
  
  // Toggle playback
  const handleToggle = async () => {
    try {
      await noiseRef.current.toggle();
      setIsPlaying(noiseRef.current.getIsPlaying());
    } catch (error) {
      console.error('Error toggling noise:', error);
    }
  };
  
  // Change noise type
  const handleTypeChange = async (type: NoiseType) => {
    const noiseConfig = noiseTypes.find(t => t.id === type);
    
    // If trying to select a premium noise type and user is not paid, show paywall
    if (noiseConfig?.premium && !isPaid) {
      onPaywallNeeded();
      return;
    }
    
    setCurrentType(type);
    try {
      await noiseRef.current.setType(type);
    } catch (error) {
      console.error('Error changing noise type:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-cosmic-200 font-display tracking-wide">
          Ambient Noise
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          isPlaying 
            ? 'bg-nebula-cyan/20 text-nebula-cyan' 
            : 'bg-cosmic-600/50 text-cosmic-300'
        }`}>
          {isPlaying ? 'Playing' : 'Stopped'}
        </span>
      </div>
      
      {/* Noise Type Selector */}
      <div className="grid grid-cols-3 gap-2">
        {noiseTypes.map((type) => {
          const isLocked = type.premium && !isPaid;
          return (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              {...hoverSound}
              className={`
                relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${currentType === type.id && !isLocked
                  ? 'bg-gradient-to-r from-nebula-purple/30 to-nebula-blue/30 text-white border border-nebula-purple/50'
                  : isLocked
                  ? 'bg-cosmic-800/30 text-cosmic-500 border border-cosmic-700/30 cursor-pointer hover:border-nebula-purple/30'
                  : 'bg-cosmic-700/30 text-cosmic-300 border border-transparent hover:bg-cosmic-600/40 hover:text-cosmic-100'
                }
              `}
            >
              <span className="flex items-center justify-center gap-1">
                {isLocked && (
                  <svg className="w-3 h-3 text-nebula-pink/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {type.label}
              </span>
              {currentType === type.id && !isLocked && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-nebula-cyan rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Type Description */}
      <p className="text-xs text-cosmic-400 italic">
        {noiseTypes.find(t => t.id === currentType)?.description}
      </p>
      
      {/* Volume Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-cosmic-400">Volume</span>
          <span className="text-xs text-cosmic-300 font-mono">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          {...hoverSound}
          className="w-full"
        />
      </div>
      
      {/* Play/Pause Button */}
      <button
        onClick={handleToggle}
        {...hoverSound}
        className={`
          w-full py-3 rounded-xl font-display font-medium text-sm tracking-wider
          transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
          ${isPlaying
            ? 'bg-gradient-to-r from-nebula-pink/80 to-nebula-purple/80 text-white shadow-lg shadow-nebula-pink/20'
            : 'bg-gradient-to-r from-nebula-blue/80 to-nebula-cyan/80 text-white shadow-lg shadow-nebula-blue/20'
          }
        `}
      >
        <span className="flex items-center justify-center gap-2">
          {isPlaying ? (
            <>
              <PauseIcon />
              Pause Noise
            </>
          ) : (
            <>
              <PlayIcon />
              Start Noise
            </>
          )}
        </span>
      </button>
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

