import { getSharedAudioContext, ensureAudioContextReady } from './AudioContextManager';

/**
 * Noise type enumeration
 */
export type NoiseType = 'white' | 'pink' | 'brown';

/**
 * NoiseGenerator class for WebAudio-based noise generation
 * Supports white, pink, and brown noise with continuous playback
 * Uses short looping buffers for instant start
 */
export class NoiseGenerator {
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentType: NoiseType = 'brown';
  private volume: number = 0.5;
  
  // Short buffer duration (2 seconds) for instant start - loops seamlessly
  private readonly bufferDuration = 2;
  private readonly sampleRate = 44100;
  
  constructor() {
    // Gain node will be created on first play
  }
  
  /**
   * Initialize the gain node
   */
  private initGain(): void {
    if (!this.gainNode) {
      const audioContext = getSharedAudioContext();
      this.gainNode = audioContext.createGain();
      this.gainNode.connect(audioContext.destination);
      this.gainNode.gain.value = this.volume;
    }
  }
  
  /**
   * Generate white noise buffer
   */
  private generateWhiteNoise(): AudioBuffer {
    const audioContext = getSharedAudioContext();
    const bufferSize = this.sampleRate * this.bufferDuration;
    const buffer = audioContext.createBuffer(2, bufferSize, this.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    
    return buffer;
  }
  
  /**
   * Generate pink noise buffer using Paul Kellet's refined algorithm
   */
  private generatePinkNoise(): AudioBuffer {
    const audioContext = getSharedAudioContext();
    const bufferSize = this.sampleRate * this.bufferDuration;
    const buffer = audioContext.createBuffer(2, bufferSize, this.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        
        data[i] = pink * 0.11; // Scale to prevent clipping
      }
    }
    
    return buffer;
  }
  
  /**
   * Generate brown (Brownian/red) noise buffer
   */
  private generateBrownNoise(): AudioBuffer {
    const audioContext = getSharedAudioContext();
    const bufferSize = this.sampleRate * this.bufferDuration;
    const buffer = audioContext.createBuffer(2, bufferSize, this.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0;
      
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        
        // Brown noise is integrated white noise
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5; // Scale for volume
      }
    }
    
    return buffer;
  }
  
  /**
   * Get the appropriate noise buffer based on type
   */
  private getNoiseBuffer(type: NoiseType): AudioBuffer {
    switch (type) {
      case 'white':
        return this.generateWhiteNoise();
      case 'pink':
        return this.generatePinkNoise();
      case 'brown':
        return this.generateBrownNoise();
      default:
        return this.generateBrownNoise();
    }
  }
  
  /**
   * Start playing noise
   */
  async start(type?: NoiseType): Promise<void> {
    if (type) {
      this.currentType = type;
    }
    
    // Ensure audio context is ready
    await ensureAudioContextReady();
    
    // Initialize gain node
    this.initGain();
    
    if (!this.gainNode) {
      throw new Error('Failed to initialize gain node');
    }
    
    // Stop current noise if playing
    if (this.isPlaying) {
      this.stopPlayback();
    }
    
    // Create new noise buffer
    const buffer = this.getNoiseBuffer(this.currentType);
    
    // Create source node
    const audioContext = getSharedAudioContext();
    this.noiseNode = audioContext.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.gainNode);
    
    // Start playback immediately
    this.noiseNode.start(0);
    this.isPlaying = true;
  }
  
  /**
   * Stop the playback without changing state
   */
  private stopPlayback(): void {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {
        // Node may already be stopped
      }
      this.noiseNode = null;
    }
  }
  
  /**
   * Stop playing noise
   */
  stop(): void {
    this.stopPlayback();
    this.isPlaying = false;
  }
  
  /**
   * Set the noise type and restart if playing
   */
  async setType(type: NoiseType): Promise<void> {
    this.currentType = type;
    if (this.isPlaying) {
      await this.start(type);
    }
  }
  
  /**
   * Get current noise type
   */
  getType(): NoiseType {
    return this.currentType;
  }
  
  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    // Initialize gain if not already created
    if (!this.gainNode) {
      this.initGain();
    }
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }
  
  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
  
  /**
   * Check if noise is currently playing
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
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    if (this.gainNode) {
      this.gainNode.disconnect();
    this.gainNode = null;
    }
  }
}

// Singleton instance
let noiseGeneratorInstance: NoiseGenerator | null = null;

/**
 * Get the singleton NoiseGenerator instance
 */
export function getNoiseGenerator(): NoiseGenerator {
  if (!noiseGeneratorInstance) {
    noiseGeneratorInstance = new NoiseGenerator();
  }
  return noiseGeneratorInstance;
}
