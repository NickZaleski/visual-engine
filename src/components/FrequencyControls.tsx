import { useState, useEffect, useRef } from 'react';
import { getFrequencyGenerator, frequencyTypes, type FrequencyType } from '../audio/FrequencyGenerator';
import { useHoverSound } from '../hooks/useHoverSound';

/**
 * UI component for controlling frequency/binaural beat generation
 */
export function FrequencyControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentType, setCurrentType] = useState<FrequencyType>('40hz-gamma');
  const [volume, setVolume] = useState(0.15); // Default 15%
  const freqRef = useRef(getFrequencyGenerator());
  const hoverSound = useHoverSound();
  
  // Update generator when volume changes
  useEffect(() => {
    freqRef.current.setVolume(volume);
  }, [volume]);
  
  // Toggle playback
  const handleToggle = async () => {
    try {
      await freqRef.current.toggle();
      setIsPlaying(freqRef.current.getIsPlaying());
    } catch (error) {
      console.error('Error toggling frequency:', error);
    }
  };
  
  // Change frequency type
  const handleTypeChange = async (type: FrequencyType) => {
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
        🎧 Use headphones for binaural beats (Hz values). Pure tones work with speakers.
      </p>
      
      {/* Frequency Type Selector - Grid layout */}
      <div className="grid grid-cols-2 gap-2">
        {frequencyTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeChange(type.id)}
            {...hoverSound}
            className={`
              relative px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 text-left
              ${currentType === type.id
                ? 'bg-gradient-to-r from-nebula-purple/30 to-nebula-blue/30 text-white border border-nebula-purple/50'
                : 'bg-cosmic-700/30 text-cosmic-300 border border-transparent hover:bg-cosmic-600/40 hover:text-cosmic-100'
              }
            `}
          >
            <span className="block font-semibold">{type.label}</span>
            {currentType === type.id && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-nebula-cyan rounded-full animate-pulse" />
            )}
          </button>
        ))}
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

