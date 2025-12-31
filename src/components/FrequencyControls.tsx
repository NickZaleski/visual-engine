import { useState, useEffect, useRef } from 'react';
import { getFrequencyGenerator, frequencyTypes, type FrequencyType } from '../audio/FrequencyGenerator';
import { useHoverSound } from '../hooks/useHoverSound';

interface FrequencyControlsProps {
  isPaid: boolean;
  onPaywallNeeded: () => void;
}

// The only frequency available for free users (scientifically proven for focus)
const FREE_FREQUENCY: FrequencyType = '40hz-gamma';

/**
 * UI component for controlling frequency/binaural beat generation
 */
export function FrequencyControls({ isPaid, onPaywallNeeded }: FrequencyControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentType, setCurrentType] = useState<FrequencyType>(FREE_FREQUENCY);
  const [volume, setVolume] = useState(0.15); // Default 15%
  const freqRef = useRef(getFrequencyGenerator());
  const hoverSound = useHoverSound();
  
  // Update generator when volume changes
  useEffect(() => {
    freqRef.current.setVolume(volume);
  }, [volume]);
  
  // Check if a frequency is locked for free users
  const isFrequencyLocked = (type: FrequencyType) => !isPaid && type !== FREE_FREQUENCY;
  
  // Toggle playback
  const handleToggle = async () => {
    try {
      // If stopping, just stop
      if (isPlaying) {
        freqRef.current.stop();
        setIsPlaying(false);
        return;
      }
      
      // Start playing
      await freqRef.current.start();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error toggling frequency:', error);
    }
  };
  
  // Change frequency type
  const handleTypeChange = async (type: FrequencyType) => {
    // If locked, show paywall instead
    if (isFrequencyLocked(type)) {
      onPaywallNeeded();
      return;
    }
    
    setCurrentType(type);
    try {
      await freqRef.current.setType(type);
    } catch (error) {
      console.error('Error changing frequency type:', error);
    }
  };

  // Get current frequency config
  const currentFreq = frequencyTypes.find(t => t.id === currentType);
  const isBinaural = currentFreq && currentFreq.beatFreq > 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-cosmic-200 font-display tracking-wide">
          Frequencies
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          isPlaying 
            ? 'bg-nebula-cyan/20 text-nebula-cyan' 
            : 'bg-cosmic-600/50 text-cosmic-300'
        }`}>
          {isPlaying ? 'Playing' : 'Stopped'}
        </span>
      </div>

      {/* Info about headphones for binaural */}
      <p className="text-[10px] text-cosmic-500 bg-cosmic-800/30 rounded-lg px-3 py-2">
        🎧 Use headphones for binaural beats. Pure tones work with speakers.
      </p>
      
      {/* Frequency Type Selector - Grid layout */}
      <div className="grid grid-cols-2 gap-2">
        {frequencyTypes.map((type) => {
          const isLocked = isFrequencyLocked(type.id);
          const isSelected = currentType === type.id;
          
          return (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              {...hoverSound}
              className={`
                relative px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 text-left
                ${isSelected
                  ? 'bg-gradient-to-r from-nebula-purple/30 to-nebula-blue/30 text-white border border-nebula-purple/50'
                  : isLocked
                    ? 'bg-cosmic-800/30 text-cosmic-500 border border-transparent cursor-pointer hover:bg-cosmic-700/30'
                    : 'bg-cosmic-700/30 text-cosmic-300 border border-transparent hover:bg-cosmic-600/40 hover:text-cosmic-100'
                }
              `}
            >
              <span className={`block font-semibold ${isLocked ? 'opacity-60' : ''}`}>
                {type.label}
              </span>
              {isSelected && !isLocked && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-nebula-cyan rounded-full animate-pulse" />
              )}
              {isLocked && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cosmic-700 rounded-full flex items-center justify-center border border-cosmic-500/50">
                  <LockIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Type Description */}
      <p className="text-xs text-cosmic-400 italic">
        {currentFreq?.description}
        {isBinaural && (
          <span className="text-nebula-cyan"> (Binaural)</span>
        )}
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
            : 'bg-gradient-to-r from-nebula-purple/80 to-nebula-blue/80 text-white shadow-lg shadow-nebula-purple/20'
          }
        `}
      >
        <span className="flex items-center justify-center gap-2">
          {isPlaying ? (
            <>
              <PauseIcon />
              Pause Frequency
            </>
          ) : (
            <>
              <PlayIcon />
              Start Frequency
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

function LockIcon() {
  return (
    <svg className="w-2.5 h-2.5 text-cosmic-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}
