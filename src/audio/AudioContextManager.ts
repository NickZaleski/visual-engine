/**
 * Shared AudioContext manager
 * Ensures all audio components use the same AudioContext
 * and properly initializes it on first user interaction
 */

class AudioContextManager {
  private audioContext: AudioContext | null = null;

  /**
   * Get or create the shared AudioContext
   * Must be called after user interaction
   */
  getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Initialize the audio context (call on first user interaction)
   */
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Ensure context is ready (initialize if needed, resume if suspended)
   */
  async ensureReady(): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    } else if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Check if context has been initialized
   */
  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  /**
   * Get context state
   */
  getState(): AudioContextState | null {
    return this.audioContext?.state ?? null;
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let audioContextManager: AudioContextManager | null = null;

/**
 * Get the singleton AudioContextManager instance
 */
export function getAudioContextManager(): AudioContextManager {
  if (!audioContextManager) {
    audioContextManager = new AudioContextManager();
  }
  return audioContextManager;
}

/**
 * Get the shared AudioContext
 */
export function getSharedAudioContext(): AudioContext {
  return getAudioContextManager().getContext();
}

/**
 * Initialize audio context (call on first user interaction)
 */
export async function initializeAudioContext(): Promise<void> {
  await getAudioContextManager().initialize();
}

/**
 * Ensure audio context is ready
 */
export async function ensureAudioContextReady(): Promise<void> {
  await getAudioContextManager().ensureReady();
}

