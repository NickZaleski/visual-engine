import { getSharedAudioContext, ensureAudioContextReady } from './AudioContextManager';

/**
 * Frequency type - scientifically studied frequencies
 */
export type FrequencyType = 
  | '40hz-gamma'      // Gamma waves - focus, cognition
  | '432hz-natural'   // Natural tuning - relaxation
  | '528hz-healing'   // Solfeggio - DNA repair (claimed)
  | '639hz-connection'// Solfeggio - relationships
  | 'alpha-10hz'      // Alpha waves - relaxation, creativity
  | 'theta-6hz'       // Theta waves - meditation, sleep
  | 'delta-2hz';      // Delta waves - deep sleep

/**
 * Frequency definitions with scientific context
 */
export const frequencyTypes: { 
  id: FrequencyType; 
  label: string; 
  description: string;
  baseFreq: number;
  beatFreq: number; // For binaural beats (0 = pure tone)
}[] = [
  { 
    id: '40hz-gamma', 
    label: '40Hz Gamma', 
    description: 'Focus & cognition enhancement',
    baseFreq: 200,
    beatFreq: 40
  },
  { 
    id: 'alpha-10hz', 
    label: '10Hz Alpha', 
    description: 'Relaxation & creativity',
    baseFreq: 200,
    beatFreq: 10
  },
  { 
    id: 'theta-6hz', 
    label: '6Hz Theta', 
    description: 'Deep meditation & intuition',
    baseFreq: 200,
    beatFreq: 6
  },
  { 
    id: 'delta-2hz', 
    label: '2Hz Delta', 
    description: 'Deep sleep & healing',
    baseFreq: 200,
    beatFreq: 2
  },
  { 
    id: '432hz-natural', 
    label: '432Hz', 
    description: 'Natural harmonic tuning',
    baseFreq: 432,
    beatFreq: 0
  },
  { 
    id: '528hz-healing', 
    label: '528Hz', 
    description: 'Solfeggio transformation tone',
    baseFreq: 528,
    beatFreq: 0
  },
  { 
    id: '639hz-connection', 
    label: '639Hz', 
    description: 'Solfeggio harmony tone',
    baseFreq: 639,
    beatFreq: 0
  },
];

/**
 * FrequencyGenerator class for binaural beats and pure tones
 * Uses WebAudio API for precise frequency generation
 * Uses separate envelope and volume gain nodes for smooth fades
 */
export class FrequencyGenerator {
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;    // For volume control
  private envelopeGain: GainNode | null = null;  // For fade in/out
  private pannerLeft: StereoPannerNode | null = null;
  private pannerRight: StereoPannerNode | null = null;
  private isPlaying: boolean = false;
  private isFading: boolean = false;
  private currentType: FrequencyType = '40hz-gamma';
  private volume: number = 0.3;
  private fadeInTime: number = 0.8;  // 800ms fade in
  private fadeOutTime: number = 0.5; // 500ms fade out
  
  constructor() {
    // Will be initialized on first play
  }
  
  /**
   * Initialize gain nodes
   */
  private initGains(): void {
    if (!this.masterGain) {
      const audioContext = getSharedAudioContext();
      
      // Master gain for volume control
      this.masterGain = audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(audioContext.destination);
      
      // Envelope gain for fade in/out (connected to master)
      this.envelopeGain = audioContext.createGain();
      this.envelopeGain.gain.value = 0;
      this.envelopeGain.connect(this.masterGain);
    }
  }
  
  /**
   * Start playing frequency with smooth fade-in
   */
  async start(type?: FrequencyType): Promise<void> {
    if (type) {
      this.currentType = type;
    }
    
    // If we're fading out, stop immediately and continue
    if (this.isFading) {
      this.stopImmediate();
      this.isFading = false;
    }
    
    await ensureAudioContextReady();
    this.initGains();
    
    if (!this.envelopeGain || !this.masterGain) {
      throw new Error('Failed to initialize gain nodes');
    }
    
    // Stop current if playing (immediate, no fade since we'll fade in new sound)
    if (this.isPlaying || this.leftOsc) {
      this.stopImmediate();
    }
    
    const audioContext = getSharedAudioContext();
    const freqConfig = frequencyTypes.find(f => f.id === this.currentType);
    
    if (!freqConfig) return;
    
    // Create oscillators
    this.leftOsc = audioContext.createOscillator();
    this.leftOsc.type = 'sine';
    
    if (freqConfig.beatFreq > 0) {
      // Binaural beat - different frequencies in each ear
      this.rightOsc = audioContext.createOscillator();
      this.rightOsc.type = 'sine';
      
      // Left ear gets base frequency
      this.leftOsc.frequency.value = freqConfig.baseFreq;
      // Right ear gets base + beat frequency
      this.rightOsc.frequency.value = freqConfig.baseFreq + freqConfig.beatFreq;
      
      // Create stereo panners
      this.pannerLeft = audioContext.createStereoPanner();
      this.pannerRight = audioContext.createStereoPanner();
      this.pannerLeft.pan.value = -1; // Full left
      this.pannerRight.pan.value = 1;  // Full right
      
      // Connect left channel
      this.leftOsc.connect(this.pannerLeft);
      this.pannerLeft.connect(this.envelopeGain);
      
      // Connect right channel
      this.rightOsc.connect(this.pannerRight);
      this.pannerRight.connect(this.envelopeGain);
      
      this.rightOsc.start();
    } else {
      // Pure tone - same frequency in both ears
      this.leftOsc.frequency.value = freqConfig.baseFreq;
      this.leftOsc.connect(this.envelopeGain);
    }
    
    // Start oscillators
    this.leftOsc.start();
    this.isPlaying = true;
    this.isFading = false;
    
    // Smooth fade in using envelope
    const now = audioContext.currentTime;
    this.envelopeGain.gain.cancelScheduledValues(now);
    this.envelopeGain.gain.setValueAtTime(0, now);
    this.envelopeGain.gain.linearRampToValueAtTime(1, now + this.fadeInTime);
  }
  
  /**
   * Stop oscillators immediately (no fade)
   */
  private stopImmediate(): void {
    if (this.leftOsc) {
      try {
        this.leftOsc.stop();
        this.leftOsc.disconnect();
      } catch {
        // Already stopped
      }
      this.leftOsc = null;
    }
    
    if (this.rightOsc) {
      try {
        this.rightOsc.stop();
        this.rightOsc.disconnect();
      } catch {
        // Already stopped
      }
      this.rightOsc = null;
    }
    
    if (this.pannerLeft) {
      this.pannerLeft.disconnect();
      this.pannerLeft = null;
    }
    
    if (this.pannerRight) {
      this.pannerRight.disconnect();
      this.pannerRight = null;
    }
    
    // Reset envelope to 0 for next start
    if (this.envelopeGain) {
      const audioContext = getSharedAudioContext();
      this.envelopeGain.gain.cancelScheduledValues(audioContext.currentTime);
      this.envelopeGain.gain.setValueAtTime(0, audioContext.currentTime);
    }
  }
  
  /**
   * Stop playing with smooth fade-out
   */
  stop(): void {
    if (!this.isPlaying && !this.isFading) {
      return;
    }
    
    // If already fading out, just wait
    if (this.isFading && !this.isPlaying) {
      return;
    }
    
    this.isPlaying = false;
    this.isFading = true;
    
    if (!this.envelopeGain) {
      this.stopImmediate();
      this.isFading = false;
      return;
    }
    
    const audioContext = getSharedAudioContext();
    const now = audioContext.currentTime;
    
    // Smooth fade out using envelope
    this.envelopeGain.gain.cancelScheduledValues(now);
    this.envelopeGain.gain.setValueAtTime(this.envelopeGain.gain.value, now);
    this.envelopeGain.gain.linearRampToValueAtTime(0, now + this.fadeOutTime);
    
    // Stop oscillators after fade completes
    setTimeout(() => {
      this.stopImmediate();
      this.isFading = false;
    }, this.fadeOutTime * 1000 + 50);
  }
  
  /**
   * Set frequency type with smooth crossfade if playing
   */
  async setType(type: FrequencyType): Promise<void> {
    if (type === this.currentType) return;
    
    this.currentType = type;
    
    if (this.isPlaying && !this.isFading && this.envelopeGain) {
      // Crossfade: fade out current, then fade in new
      const audioContext = getSharedAudioContext();
      const now = audioContext.currentTime;
      const crossfadeTime = 0.3; // 300ms crossfade
      
      // Fade out current
      this.envelopeGain.gain.cancelScheduledValues(now);
      this.envelopeGain.gain.setValueAtTime(this.envelopeGain.gain.value, now);
      this.envelopeGain.gain.linearRampToValueAtTime(0, now + crossfadeTime);
      
      // Wait for fade out, then switch and fade in
      await new Promise(resolve => setTimeout(resolve, crossfadeTime * 1000 + 50));
      
      // Stop old oscillators
      this.stopImmediate();
      
      // Start new frequency (will fade in automatically)
      this.isPlaying = false; // Reset so start() works properly
      await this.start(type);
    }
  }
  
  /**
   * Get current type
   */
  getType(): FrequencyType {
    return this.currentType;
  }
  
  /**
   * Set volume (0-1) with smooth transition
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (!this.masterGain) {
      this.initGains();
    }
    if (this.masterGain && this.isPlaying) {
      const audioContext = getSharedAudioContext();
      const now = audioContext.currentTime;
      // Smooth volume change to avoid clicks
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
    } else if (this.masterGain) {
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
   * Check if playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Toggle playback
   */
  async toggle(): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    } else {
      await this.start();
    }
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.stopImmediate();
    if (this.envelopeGain) {
      this.envelopeGain.disconnect();
      this.envelopeGain = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
  }
}

// Singleton instance
let frequencyGeneratorInstance: FrequencyGenerator | null = null;

/**
 * Get singleton FrequencyGenerator instance
 */
export function getFrequencyGenerator(): FrequencyGenerator {
  if (!frequencyGeneratorInstance) {
    frequencyGeneratorInstance = new FrequencyGenerator();
  }
  return frequencyGeneratorInstance;
}

