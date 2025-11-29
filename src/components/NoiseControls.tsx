import { useState, useEffect, useRef } from 'react';
import { getNoiseGenerator, type NoiseType } from '../audio/NoiseGenerator';
import { useHoverSound } from '../hooks/useHoverSound';

const noiseTypes: { id: NoiseType; label: string; description: string }[] = [
  { id: 'white', label: 'White', description: 'Bright, even frequencies' },
  { id: 'pink', label: 'Pink', description: 'Balanced, natural sound' },
  { id: 'brown', label: 'Brown', description: 'Deep, rumbling bass' },
];

/**
 * UI component for controlling noise generation
 */
export function NoiseControls() {
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
    setCurrentType(type);
    try {
      await noiseRef.current.setType(type);
    } catch (error) {
      console.error('Error changing noise type:', error);
    }
  };
  
  // Cycle through noise types
  const cycleType = async () => {
    const currentIndex = noiseTypes.findIndex(t => t.id === currentType);
    const nextIndex = (currentIndex + 1) % noiseTypes.length;
    await handleTypeChange(noiseTypes[nextIndex].id);
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
        {noiseTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeChange(type.id)}
            {...hoverSound}
            className={`
              relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
              ${currentType === type.id
                ? 'bg-gradient-to-r from-nebula-purple/30 to-nebula-blue/30 text-white border border-nebula-purple/50'
                : 'bg-cosmic-700/30 text-cosmic-300 border border-transparent hover:bg-cosmic-600/40 hover:text-cosmic-100'
              }
            `}
          >
            {type.label}
            {currentType === type.id && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-nebula-cyan rounded-full animate-pulse" />
            )}
          </button>
        ))}
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
      
      {/* Quick Cycle Button */}
      <button
        onClick={cycleType}
        {...hoverSound}
        className="w-full py-2 rounded-lg text-xs text-cosmic-400 hover:text-cosmic-200 
                   border border-cosmic-600/30 hover:border-cosmic-500/50 transition-all duration-300"
      >
        Cycle Noise Type →
      </button>
      
      {/* Buy Me a Coffee */}
      <a
        href="https://buymeacoffee.com/nickzaleski"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium
                   bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-[#0D0C22] transition-all duration-300
                   hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-[#FFDD00]/20"
      >
        <CoffeeIcon />
        Buy me a coffee
      </a>
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

function CoffeeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 19H18V21H4V19ZM18 10H19C19.5304 10 20.0391 10.2107 20.4142 10.5858C20.7893 10.9609 21 11.4696 21 12C21 12.5304 20.7893 13.0391 20.4142 13.4142C20.0391 13.7893 19.5304 14 19 14H18V10ZM6 8H18C18.5304 8 19.0391 8.21071 19.4142 8.58579C19.7893 8.96086 20 9.46957 20 10V16C20 16.5304 19.7893 17.0391 19.4142 17.4142C19.0391 17.7893 18.5304 18 18 18H6C5.46957 18 4.96086 17.7893 4.58579 17.4142C4.21071 17.0391 4 16.5304 4 16V10C4 9.46957 4.21071 8.96086 4.58579 8.58579C4.96086 8.21071 5.46957 8 6 8ZM6 3H18V5H6V3ZM9 6V7H15V6H9Z" />
    </svg>
  );
}

