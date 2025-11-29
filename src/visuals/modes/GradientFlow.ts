import type { VisualModeFunction } from '../engine';

/**
 * Color stop for gradient
 */
interface ColorStop {
  hue: number;
  saturation: number;
  lightness: number;
  cycles: number; // Number of hue cycles per loop
  offset: number;
}

/**
 * Helper to create a loopable animation value
 */
function loopSin(normalizedTime: number, cycles: number, phase: number = 0): number {
  return Math.sin((normalizedTime + phase) * Math.PI * 2 * cycles);
}

// Predefined color palette for cosmic aesthetic
// Using cycle counts instead of speeds for seamless looping
const colorStops: ColorStop[] = [
  { hue: 280, saturation: 70, lightness: 30, cycles: 1, offset: 0 },
  { hue: 320, saturation: 80, lightness: 45, cycles: 2, offset: 0.25 },
  { hue: 200, saturation: 90, lightness: 50, cycles: 1.5, offset: 0.5 },
  { hue: 170, saturation: 75, lightness: 40, cycles: 2.5, offset: 0.75 },
  { hue: 240, saturation: 60, lightness: 25, cycles: 1, offset: 1 },
];

/**
 * GradientFlow - Slow animated multi-stop gradient
 * Creates a mesmerizing flowing gradient effect
 * Uses normalized time for seamless looping
 */
export const GradientFlow: VisualModeFunction = (ctx, t, w, h, loopDuration) => {
  // Calculate normalized time (0 to 1) for seamless looping
  const normalizedTime = (t % loopDuration) / loopDuration;
  
  // Calculate animated gradient angle - 1 complete rotation per loop
  const angle = normalizedTime * Math.PI * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // Calculate gradient line coordinates
  const diagonal = Math.sqrt(w * w + h * h);
  const cx = w / 2;
  const cy = h / 2;
  
  const x0 = cx - cos * diagonal / 2;
  const y0 = cy - sin * diagonal / 2;
  const x1 = cx + cos * diagonal / 2;
  const y1 = cy + sin * diagonal / 2;
  
  // Create linear gradient
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  
  // Add animated color stops
  colorStops.forEach((stop) => {
    // Animate hue over time - complete cycles for seamless loop
    // Each stop completes its cycles count of hue rotations
    const hueShift = normalizedTime * stop.cycles * 60; // 60 degrees per cycle
    const animatedHue = (stop.hue + hueShift) % 360;
    
    // Subtle lightness pulsing - 2 pulses per loop
    const pulse = loopSin(normalizedTime, 2, stop.offset) * 5;
    const animatedLightness = stop.lightness + pulse;
    
    // Animate position slightly - 1 cycle per loop
    const posOffset = loopSin(normalizedTime, 1, stop.offset) * 0.05;
    const position = Math.max(0, Math.min(1, stop.offset + posOffset));
    
    gradient.addColorStop(
      position,
      `hsl(${animatedHue}, ${stop.saturation}%, ${animatedLightness}%)`
    );
  });
  
  // Draw gradient background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // Add subtle radial overlay for depth
  const radialGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, diagonal / 2);
  // 2 pulses per loop for overlay alpha
  const overlayAlpha = 0.1 + loopSin(normalizedTime, 2) * 0.05;
  radialGradient.addColorStop(0, `rgba(255, 255, 255, ${overlayAlpha})`);
  radialGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  radialGradient.addColorStop(1, `rgba(0, 0, 0, ${overlayAlpha * 1.5})`);
  
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Add floating particles effect
  drawParticles(ctx, normalizedTime, w, h);
};

/**
 * Draw subtle floating particles
 */
function drawParticles(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.508; // Golden angle for distribution
    const speed = 0.05 + (i % 5) * 0.02;
    
    // Calculate position with smooth movement
    const x = (Math.sin(seed + t * speed) * 0.5 + 0.5) * w;
    const y = (Math.cos(seed * 0.7 + t * speed * 0.8) * 0.5 + 0.5) * h;
    
    // Pulsing size
    const baseSize = 1 + (i % 3);
    const size = baseSize + Math.sin(t * 0.5 + seed) * 0.5;
    
    // Pulsing opacity
    const alpha = 0.2 + Math.sin(t * 0.3 + seed) * 0.15;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

