import type { VisualModeFunction } from '../engine';

/**
 * Plasma - Classic morphing plasma field
 * Creates an organic, flowing plasma effect using multiple sine waves
 * Uses normalized time for seamless looping
 */
export const Plasma: VisualModeFunction = (ctx, t, w, h, loopDuration) => {
  // Calculate normalized time (0 to 1) for seamless looping
  const normalizedTime = (t % loopDuration) / loopDuration;
  
  // Create image data for pixel manipulation
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  
  // Plasma parameters
  const scale = 0.01; // Size of the plasma cells
  
  // Precompute some values
  const cx = w / 2;
  const cy = h / 2;
  
  // Sample at lower resolution for performance, then scale
  const sampleRate = 2; // Sample every 2 pixels
  
  for (let y = 0; y < h; y += sampleRate) {
    for (let x = 0; x < w; x += sampleRate) {
      // Calculate plasma value using multiple sine waves with normalized time
      const value = calculatePlasmaValue(x, y, normalizedTime, cx, cy, scale);
      
      // Convert to color with normalized time
      const color = plasmaColorPalette(value, normalizedTime);
      
      // Fill the sampled area
      for (let dy = 0; dy < sampleRate && y + dy < h; dy++) {
        for (let dx = 0; dx < sampleRate && x + dx < w; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = 255;
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Add subtle glow overlay with normalized time
  addGlowOverlay(ctx, normalizedTime, w, h);
};

/**
 * Calculate the plasma value at a given point
 * Uses normalized time (0 to 1) for seamless looping
 */
function calculatePlasmaValue(
  x: number,
  y: number,
  normalizedTime: number,
  cx: number,
  cy: number,
  scale: number
): number {
  // Use 2π * normalizedTime for complete cycles
  // Each wave pattern completes whole cycles within the loop
  const TWO_PI = Math.PI * 2;
  
  // Multiple overlapping sine patterns with whole cycle counts
  let value = 0;
  
  // Horizontal waves - 2 cycles per loop
  value += Math.sin(x * scale + normalizedTime * TWO_PI * 2);
  
  // Vertical waves - 3 cycles per loop (different rate for variety)
  value += Math.sin(y * scale * 0.8 + normalizedTime * TWO_PI * 3);
  
  // Diagonal waves - 1 cycle per loop
  value += Math.sin((x * scale + y * scale) * 0.5 + normalizedTime * TWO_PI);
  
  // Circular waves from center - 2 cycles per loop
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  value += Math.sin(dist * scale * 0.5 - normalizedTime * TWO_PI * 2);
  
  // Additional complexity - 1 cycle per loop
  value += Math.sin((x * scale * 0.5) * Math.cos(y * scale * 0.5) + normalizedTime * TWO_PI);
  
  // Normalize to 0-1 range
  return (value + 5) / 10;
}

/**
 * Convert plasma value to color using a cosmic palette
 * Uses normalized time for seamless looping
 */
function plasmaColorPalette(
  value: number,
  normalizedTime: number
): { r: number; g: number; b: number } {
  // Shift the palette over time - 1 complete cycle for seamless loop
  const shift = normalizedTime;
  const v = (value + shift) % 1;
  
  // Create a vibrant cosmic palette
  const r = Math.floor(128 + 127 * Math.sin(v * Math.PI * 2));
  const g = Math.floor(128 + 127 * Math.sin(v * Math.PI * 2 + Math.PI * 2 / 3));
  const b = Math.floor(128 + 127 * Math.sin(v * Math.PI * 2 + Math.PI * 4 / 3));
  
  return { r, g, b };
}

/**
 * Add a subtle glow overlay for depth
 * Uses normalized time for seamless looping
 */
function addGlowOverlay(
  ctx: CanvasRenderingContext2D,
  normalizedTime: number,
  w: number,
  h: number
): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.max(w, h) * 0.7;
  
  // Pulsing radial glow - 2 complete pulses per loop
  const pulse = Math.sin(normalizedTime * Math.PI * 2 * 2);
  const pulseRadius = maxRadius * (0.8 + pulse * 0.2);
  
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

