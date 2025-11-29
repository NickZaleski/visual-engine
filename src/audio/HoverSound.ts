/**
 * HoverSound - Generates soft, calm hover sounds for UI interactions
 * Uses low to low-middle frequency tones with smooth envelopes
 */

class HoverSoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.08; // Very subtle volume
  
  // Base frequency for the calm tone (around 180Hz - low/low-mid)
  private readonly baseFrequency = 180;
  
  constructor() {
    // AudioContext will be created on first interaction
  }
  
  /**
   * Initialize the audio context (must be called after user interaction)
   */
  private initContext(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
    }
  }
  
  /**
   * Ensure audio context is ready
   */
  private async ensureContext(): Promise<void> {
    this.initContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  /**
   * Play a soft hover sound
   * Creates a gentle, warm tone with smooth attack and release
   */
  async playHover(): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      await this.ensureContext();
      
      if (!this.audioContext || !this.masterGain) return;
      
      const now = this.audioContext.currentTime;
      
      // Create oscillator for the fundamental tone
      const osc1 = this.audioContext.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = this.baseFrequency;
      
      // Create a second oscillator for subtle harmonic warmth (perfect fifth above, quieter)
      const osc2 = this.audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = this.baseFrequency * 1.5; // Perfect fifth
      
      // Create a third oscillator for sub-bass depth
      const osc3 = this.audioContext.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = this.baseFrequency * 0.5; // Octave below
      
      // Individual gain nodes for mixing
      const gain1 = this.audioContext.createGain();
      const gain2 = this.audioContext.createGain();
      const gain3 = this.audioContext.createGain();
      
      // Output envelope
      const envelope = this.audioContext.createGain();
      
      // Low-pass filter for warmth
      const filter = this.audioContext.createBiquadFilter();
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
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
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
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
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

