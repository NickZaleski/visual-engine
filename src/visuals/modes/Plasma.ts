import type { VisualModeFunction } from '../engine';

/**
 * Plasma - Classic morphing plasma field
 * Creates an organic, flowing plasma effect using multiple sine waves
 */
export const Plasma: VisualModeFunction = (ctx, t, w, h) => {
  // Create image data for pixel manipulation
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  
  // Plasma parameters
  const scale = 0.01; // Size of the plasma cells
  const timeScale = 0.5; // Speed of animation
  
  // Precompute some values
  const cx = w / 2;
  const cy = h / 2;
  
  // Sample at lower resolution for performance, then scale
  const sampleRate = 2; // Sample every 2 pixels
  
  for (let y = 0; y < h; y += sampleRate) {
    for (let x = 0; x < w; x += sampleRate) {
      // Calculate plasma value using multiple sine waves
      const value = calculatePlasmaValue(x, y, t, cx, cy, scale, timeScale);
      
      // Convert to color
      const color = plasmaColorPalette(value, t);
      
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
  
  // Add subtle glow overlay
  addGlowOverlay(ctx, t, w, h);
};

/**
 * Calculate the plasma value at a given point
 */
function calculatePlasmaValue(
  x: number,
  y: number,
  t: number,
  cx: number,
  cy: number,
  scale: number,
  timeScale: number
): number {
  const time = t * timeScale;
  
  // Multiple overlapping sine patterns
  let value = 0;
  
  // Horizontal waves
  value += Math.sin(x * scale + time);
  
  // Vertical waves
  value += Math.sin(y * scale * 0.8 + time * 1.2);
  
  // Diagonal waves
  value += Math.sin((x * scale + y * scale) * 0.5 + time * 0.7);
  
  // Circular waves from center
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  value += Math.sin(dist * scale * 0.5 - time);
  
  // Additional complexity
  value += Math.sin((x * scale * 0.5) * Math.cos(y * scale * 0.5) + time * 0.5);
  
  // Normalize to 0-1 range
  return (value + 5) / 10;
}

/**
 * Convert plasma value to color using a cosmic palette
 */
function plasmaColorPalette(
  value: number,
  t: number
): { r: number; g: number; b: number } {
  // Shift the palette over time
  const shift = t * 0.1;
  const v = (value + shift) % 1;
  
  // Create a vibrant cosmic palette
  const r = Math.floor(128 + 127 * Math.sin(v * Math.PI * 2));
  const g = Math.floor(128 + 127 * Math.sin(v * Math.PI * 2 + Math.PI * 2 / 3));
  const b = Math.floor(128 + 127 * Math.sin(v * Math.PI * 2 + Math.PI * 4 / 3));
  
  return { r, g, b };
}

/**
 * Add a subtle glow overlay for depth
 */
function addGlowOverlay(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.max(w, h) * 0.7;
  
  // Pulsing radial glow
  const pulseRadius = maxRadius * (0.8 + Math.sin(t * 0.3) * 0.2);
  
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

