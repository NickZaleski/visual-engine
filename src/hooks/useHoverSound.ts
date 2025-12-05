/**
 * Hook to add hover sound to any element
 * Currently disabled - returns empty handlers
 */
export function useHoverSound() {
  // Hover sounds disabled
  return {};
}

/**
 * Hook to control hover sound settings
 * Currently disabled
 */
export function useHoverSoundControls() {
  return {
    setVolume: () => {},
    setEnabled: () => {},
    getVolume: () => 0,
    getEnabled: () => false,
  };
}

