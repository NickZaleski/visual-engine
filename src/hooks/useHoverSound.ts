import { useCallback, useRef } from 'react';
import { playHoverSound, getHoverSound } from '../audio/HoverSound';

/**
 * Hook to add hover sound to any element
 * Returns event handlers to spread onto the element
 */
export function useHoverSound() {
  // Debounce to prevent rapid-fire sounds
  const lastPlayTime = useRef(0);
  const debounceMs = 80; // Minimum 80ms between sounds
  
  const onMouseEnter = useCallback(() => {
    const now = Date.now();
    if (now - lastPlayTime.current >= debounceMs) {
      lastPlayTime.current = now;
      playHoverSound();
    }
  }, []);
  
  return {
    onMouseEnter,
  };
}

/**
 * Hook to control hover sound settings
 */
export function useHoverSoundControls() {
  const hoverSound = getHoverSound();
  
  const setVolume = useCallback((volume: number) => {
    hoverSound.setVolume(volume);
  }, [hoverSound]);
  
  const setEnabled = useCallback((enabled: boolean) => {
    hoverSound.setEnabled(enabled);
  }, [hoverSound]);
  
  return {
    setVolume,
    setEnabled,
    getVolume: () => hoverSound.getVolume(),
    getEnabled: () => hoverSound.getEnabled(),
  };
}

