import type { VisualModeFunction } from '../engine';
import { getGradientColor, hexToHsl } from '../gradientColorState';

// Fixed cycle duration in seconds (controls speed)
const CYCLE_DURATION = 20;

/**
 * Helper to create continuous animation values
 */
function continuousSin(time: number, cycleDuration: number, phase: number = 0): number {
  return Math.sin((time / cycleDuration + phase) * Math.PI * 2);
}

/**
 * Generate color stops based on the selected base color
 */
function generateColorStops(baseHsl: { h: number; s: number; l: number }) {
  const baseHue = baseHsl.h;
  const baseSat = baseHsl.s;
  const baseLit = baseHsl.l;
  
  return [
    { hue: baseHue, saturation: Math.min(100, baseSat + 10), lightness: Math.max(20, baseLit - 15), cycleDuration: CYCLE_DURATION, offset: 0 },
    { hue: (baseHue + 40) % 360, saturation: Math.min(100, baseSat + 20), lightness: Math.min(60, baseLit + 10), cycleDuration: CYCLE_DURATION * 0.5, offset: 0.25 },
    { hue: (baseHue + 180) % 360, saturation: Math.min(100, baseSat + 30), lightness: Math.min(65, baseLit + 15), cycleDuration: CYCLE_DURATION * 0.67, offset: 0.5 },
    { hue: (baseHue + 220) % 360, saturation: Math.min(100, baseSat + 15), lightness: Math.min(55, baseLit + 5), cycleDuration: CYCLE_DURATION * 0.4, offset: 0.75 },
    { hue: (baseHue - 40 + 360) % 360, saturation: baseSat, lightness: Math.max(15, baseLit - 20), cycleDuration: CYCLE_DURATION, offset: 1 },
];
}

/**
 * GradientFlow - Slow animated multi-stop gradient
 * Creates a mesmerizing flowing gradient effect
 * Uses continuous time for infinite smooth animation
 * Scales properly for any screen size including 8000px+
 * Supports custom color via the gradientColorState
 */
export const GradientFlow: VisualModeFunction = (ctx, t, w, h, _loopDuration, scale) => {
  // Use raw time for infinite continuous animation
  const time = t;
  
  // Get the current gradient color and generate color stops
  const gradientColor = getGradientColor();
  const baseHsl = hexToHsl(gradientColor);
  const colorStops = generateColorStops(baseHsl);
  
  // Calculate animated gradient angle - continuous rotation
  const angle = (time / CYCLE_DURATION) * Math.PI * 2;
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
    // Animate hue over time - continuous rotation
    const hueShift = (time / stop.cycleDuration) * 60; // 60 degrees per cycle
    const animatedHue = (stop.hue + hueShift) % 360;
    
    // Subtle lightness pulsing
    const pulse = continuousSin(time, CYCLE_DURATION / 2, stop.offset) * 5;
    const animatedLightness = stop.lightness + pulse;
    
    // Animate position slightly
    const posOffset = continuousSin(time, CYCLE_DURATION, stop.offset) * 0.05;
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
  const overlayAlpha = 0.1 + continuousSin(time, CYCLE_DURATION / 2) * 0.05;
  radialGradient.addColorStop(0, `rgba(255, 255, 255, ${overlayAlpha})`);
  radialGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  radialGradient.addColorStop(1, `rgba(0, 0, 0, ${overlayAlpha * 1.5})`);
  
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Add floating particles effect - scale with screen size
  drawParticles(ctx, time, w, h, scale);
};

/**
 * Draw subtle floating particles
 * Uses continuous time for infinite smooth animation
 * Scales particle count and size with screen dimensions
 */
function drawParticles(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  scale: number
): void {
  // Scale particle count with screen area (more particles on larger screens)
  // Base: 30 particles at 1920x1080, scales up proportionally
  const baseParticleCount = 30;
  const particleCount = Math.floor(baseParticleCount * scale * scale);
  
  // Clamp to reasonable range to prevent performance issues
  const clampedParticleCount = Math.min(Math.max(particleCount, 15), 300);
  
  for (let i = 0; i < clampedParticleCount; i++) {
    const seed = i * 137.508; // Golden angle for distribution
    const seedNorm = (seed % 1); // Normalized seed for phase
    
    // Different particles move at different speeds
    const moveCycleDuration = CYCLE_DURATION / (1 + (i % 5) * 0.4);
    
    // Calculate position with smooth movement
    const xPhase = continuousSin(time, moveCycleDuration, seedNorm);
    const yPhase = continuousSin(time, moveCycleDuration * 1.25, seedNorm * 0.7);
    
    // Use golden ratio spiral for better distribution on large screens
    const goldenAngle = i * 2.39996323; // Golden angle in radians
    const radius = Math.sqrt(i / clampedParticleCount);
    const baseX = 0.5 + radius * Math.cos(goldenAngle) * 0.5;
    const baseY = 0.5 + radius * Math.sin(goldenAngle) * 0.5;
    
    // Scale movement range with screen size
    const movementScale = 0.1 * Math.max(1, scale * 0.5);
    const x = (baseX + xPhase * movementScale) * w;
    const y = (baseY + yPhase * movementScale) * h;
    
    // Pulsing size
    // Scale particle size with screen size
    const baseSize = (1 + (i % 3)) * Math.max(1, scale * 0.7);
    const size = baseSize + continuousSin(time, CYCLE_DURATION / 2, seedNorm) * 0.5 * scale;
    
    // Pulsing opacity
    const alpha = 0.2 + continuousSin(time, CYCLE_DURATION / 3, seedNorm) * 0.15;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

