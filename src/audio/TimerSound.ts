import { getSharedAudioContext, ensureAudioContextReady } from './AudioContextManager';

/**
 * Play a subtle finger click sound when timer starts
 * Mimics the soft pop of a finger snap/click
 */
export async function playTimerStartSound(): Promise<void> {
  try {
    await ensureAudioContextReady();
    const audioContext = getSharedAudioContext();
    const now = audioContext.currentTime;
    
    // === Noise burst for organic "click" texture ===
    const bufferSize = audioContext.sampleRate * 0.015; // 15ms of noise
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    // Generate filtered noise (more like pink noise for warmth)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02; // Simple lowpass
      noiseData[i] = lastOut * 3.5; // Boost to compensate for filtering
    }
    
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    // Noise envelope - ultra short pop
    const noiseEnv = audioContext.createGain();
    noiseEnv.gain.setValueAtTime(0, now);
    noiseEnv.gain.linearRampToValueAtTime(0.12, now + 0.001); // 1ms attack
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.018); // 17ms decay
    
    // Band-pass filter for the noise to sound like finger contact
    const noiseBandpass = audioContext.createBiquadFilter();
    noiseBandpass.type = 'bandpass';
    noiseBandpass.frequency.value = 2800;
    noiseBandpass.Q.value = 1.2;
    
    // === Tonal "thump" for body ===
    const thump = audioContext.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(450, now);
    thump.frequency.exponentialRampToValueAtTime(180, now + 0.025);
    
    const thumpEnv = audioContext.createGain();
    thumpEnv.gain.setValueAtTime(0, now);
    thumpEnv.gain.linearRampToValueAtTime(0.06, now + 0.001);
    thumpEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    // === Master output with subtle compression feel ===
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.7; // Subtle overall level
    
    // Connect noise path
    noiseSource.connect(noiseBandpass);
    noiseBandpass.connect(noiseEnv);
    noiseEnv.connect(masterGain);
    
    // Connect thump path
    thump.connect(thumpEnv);
    thumpEnv.connect(masterGain);
    
    // Output
    masterGain.connect(audioContext.destination);
    
    // Start and stop
    noiseSource.start(now);
    thump.start(now);
    noiseSource.stop(now + 0.025);
    thump.stop(now + 0.04);
    
    // Cleanup
    setTimeout(() => {
      noiseSource.disconnect();
      noiseBandpass.disconnect();
      noiseEnv.disconnect();
      thump.disconnect();
      thumpEnv.disconnect();
      masterGain.disconnect();
    }, 100);
    
  } catch (error) {
    console.debug('Timer sound failed:', error);
  }
}

