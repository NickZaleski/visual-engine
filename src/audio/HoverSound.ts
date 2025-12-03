import { getSharedAudioContext, ensureAudioContextReady, initializeAudioContext } from './AudioContextManager';

/**
 * HoverSound - Generates soft, calm hover sounds for UI interactions
 * Uses low to low-middle frequency tones with smooth envelopes
 */

class HoverSoundGenerator {
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;
  private isReady: boolean = false; // True after priming is complete
  private readonly volume: number = 0.08; // Very subtle volume - CONSTANT
  
  // Base frequency for the calm tone (around 180Hz - low/low-mid)
  private readonly baseFrequency = 180;
  
  constructor() {
    // Master gain will be created on first use
  }
  
  /**
   * Initialize the audio system (call on first user interaction)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    try {
      await initializeAudioContext();
      this.initGain();
      // Prime the audio system with a silent sound to prevent loud first play
      this.primAudio();
    } catch (error) {
      this.isInitialized = false;
      console.debug('HoverSound init failed:', error);
    }
  }
  
  /**
   * Initialize the master gain node
   */
  private initGain(): void {
    if (!this.masterGain) {
      const audioContext = getSharedAudioContext();
      this.masterGain = audioContext.createGain();
      // Set volume directly for consistency
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(audioContext.destination);
    }
  }
  
  /**
   * Prime the audio system with a silent sound
   * This prevents the first real sound from being unexpectedly loud
   */
  private primAudio(): void {
    if (!this.masterGain) return;
    
    const audioContext = getSharedAudioContext();
    const now = audioContext.currentTime;
    
    // Create a silent oscillator to prime the audio pipeline
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    // Set gain to 0 (silent)
    gain.gain.setValueAtTime(0, now);
    
    // Play for a tiny moment
    osc.start(now);
    osc.stop(now + 0.05);
    
    // Mark as ready after priming completes
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
      this.isReady = true;
    }, 100);
  }
  
  /**
   * Ensure audio context is ready
   */
  private async ensureContext(): Promise<void> {
    await ensureAudioContextReady();
    this.initGain();
  }
  
  /**
   * Play a soft hover sound
   * Creates a gentle, warm tone with smooth attack and release
   */
  async playHover(): Promise<void> {
    if (!this.isEnabled) return;
    
    // Don't play until audio system is primed and ready
    if (!this.isReady) {
      // Try to initialize if not done yet
      if (!this.isInitialized) {
        await this.init();
      }
      return; // Skip this sound, next hover will work
    }
    
    try {
      await this.ensureContext();
      
      if (!this.masterGain) return;
      
      const audioContext = getSharedAudioContext();
      const now = audioContext.currentTime;
      
      // Create oscillator for the fundamental tone
      const osc1 = audioContext.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = this.baseFrequency;
      
      // Create a second oscillator for subtle harmonic warmth (perfect fifth above, quieter)
      const osc2 = audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = this.baseFrequency * 1.5; // Perfect fifth
      
      // Create a third oscillator for sub-bass depth
      const osc3 = audioContext.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = this.baseFrequency * 0.5; // Octave below
      
      // Individual gain nodes for mixing
      const gain1 = audioContext.createGain();
      const gain2 = audioContext.createGain();
      const gain3 = audioContext.createGain();
      
      // Output envelope
      const envelope = audioContext.createGain();
      
      // Low-pass filter for warmth
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.5;
      
      // Connect the graph
      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);
      
      gain1.connect(filter);
      gain2.connect(filter);
      gain3.connect(filter);
      
      filter.connect(envelope);
      envelope.connect(this.masterGain);
      
      // Set mixing levels
      gain1.gain.value = 1.0;    // Fundamental - loudest
      gain2.gain.value = 0.15;   // Fifth - subtle
      gain3.gain.value = 0.3;    // Sub-bass - gentle foundation
      
      // Envelope: smooth attack and release
      const attackTime = 0.04;  // 40ms attack
      const holdTime = 0.06;    // 60ms hold
      const releaseTime = 0.15; // 150ms release
      
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(1, now + attackTime);
      envelope.gain.setValueAtTime(1, now + attackTime + holdTime);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + attackTime + holdTime + releaseTime);
      
      // Start oscillators
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      
      // Stop oscillators after envelope completes
      const stopTime = now + attackTime + holdTime + releaseTime + 0.05;
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      osc3.stop(stopTime);
      
      // Clean up nodes after they stop
      setTimeout(() => {
        osc1.disconnect();
        osc2.disconnect();
        osc3.disconnect();
        gain1.disconnect();
        gain2.disconnect();
        gain3.disconnect();
        filter.disconnect();
        envelope.disconnect();
      }, (attackTime + holdTime + releaseTime + 0.1) * 1000);
      
    } catch (error) {
      // Silently fail - audio is optional enhancement
      console.debug('Hover sound failed:', error);
    }
  }
  
  /**
   * Set the master volume (0-1)
   * Note: Volume is fixed at 0.08 for consistency
   */
  setVolume(_volume: number): void {
    // Volume is now fixed - ignore parameter for consistency
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }
  
  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
  
  /**
   * Enable or disable hover sounds
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Check if hover sounds are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.masterGain) {
      this.masterGain.disconnect();
    this.masterGain = null;
    }
  }
}

// Singleton instance
let hoverSoundInstance: HoverSoundGenerator | null = null;

/**
 * Get the singleton HoverSoundGenerator instance
 */
export function getHoverSound(): HoverSoundGenerator {
  if (!hoverSoundInstance) {
    hoverSoundInstance = new HoverSoundGenerator();
  }
  return hoverSoundInstance;
}

/**
 * Play a hover sound - convenience function
 */
export function playHoverSound(): void {
  getHoverSound().playHover();
}

/**
 * Initialize hover sound system - call on first user interaction
 */
export function initHoverSound(): void {
  getHoverSound().init();
}

