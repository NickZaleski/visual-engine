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
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.55132 2.68377C4.68743 2.27543 5.06957 2 5.5 2H18.5C18.9304 2 19.3126 2.27543 19.4487 2.68377L20.2208 5H20.5C21.0523 5 21.5 5.44772 21.5 6C21.5 6.55228 21.0523 7 20.5 7H19.5H19.405L17.995 21.0995C17.9439 21.6107 17.5138 22 17 22H7C6.48625 22 6.05608 21.6107 6.00496 21.0995L4.59501 7H4.5H3.5C2.94772 7 2.5 6.55228 2.5 6C2.5 5.44772 2.94772 5 3.5 5H3.77924L4.55132 2.68377ZM6.60499 7L7.90499 20H16.095L17.395 7H6.60499ZM18.1126 5H5.88743L6.22076 4H17.7792L18.1126 5Z" />
    </svg>
  );
}

