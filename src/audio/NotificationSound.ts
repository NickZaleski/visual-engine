import { getSharedAudioContext, ensureAudioContextReady } from './AudioContextManager';

/**
 * Notification sound generator for timer completion
 * Creates a gentle, mid-low-end bell/chime sound
 */

let isPlaying = false;
let oscillators: OscillatorNode[] = [];
let gainNodes: GainNode[] = [];

/**
 * Play a gentle notification sound
 * Mid-low frequency, not loud, pleasant chime
 */
export async function playNotificationSound(): Promise<void> {
  if (isPlaying) return;
  
  await ensureAudioContextReady();
  const ctx = getSharedAudioContext();
  isPlaying = true;
  
  // Frequencies for a gentle bell chord (mid-low range)
  const frequencies = [220, 277.18, 329.63]; // A3, C#4, E4 - A major chord, lower octave
  const volume = 0.15; // Not loud
  
  oscillators = [];
  gainNodes = [];
  
  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Use sine wave for softer sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Gentle attack and decay
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Stagger the notes slightly for a chime effect
    oscillator.start(ctx.currentTime + index * 0.05);
    oscillator.stop(ctx.currentTime + 3);
    
    oscillators.push(oscillator);
    gainNodes.push(gainNode);
  });
  
  // Reset playing state after sound finishes
  setTimeout(() => {
    isPlaying = false;
  }, 3000);
}

/**
 * Stop the notification sound
 */
export function stopNotificationSound(): void {
  if (!isPlaying) return;
  
  const ctx = getSharedAudioContext();
  const now = ctx.currentTime;
  
  // Fade out quickly
  gainNodes.forEach((gainNode) => {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  });
  
  // Stop oscillators
  setTimeout(() => {
    oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    oscillators = [];
    gainNodes = [];
    isPlaying = false;
  }, 150);
}

/**
 * Check if notification sound is currently playing
 */
export function isNotificationPlaying(): boolean {
  return isPlaying;
}

/**
 * Play a looping gentle notification (for when timer ends and user needs to dismiss)
 */
let loopInterval: number | null = null;

export async function startNotificationLoop(): Promise<void> {
  if (loopInterval) return;
  
  await playNotificationSound();
  loopInterval = window.setInterval(() => {
    playNotificationSound();
  }, 4000); // Repeat every 4 seconds
}

export function stopNotificationLoop(): void {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
  stopNotificationSound();
}

