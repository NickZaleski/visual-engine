import type { VisualModeFunction } from '../engine';
import { getBlobColor, hexToHsl } from '../blobColorState';

/**
 * Helper to create a loopable animation value
 * @param normalizedTime - Time from 0 to 1 representing progress through the loop
 * @param cycles - Number of complete cycles to perform within the loop
 * @param phase - Phase offset (0 to 1)
 */
function loopSin(normalizedTime: number, cycles: number, phase: number = 0): number {
  return Math.sin((normalizedTime + phase) * Math.PI * 2 * cycles);
}

function loopCos(normalizedTime: number, cycles: number, phase: number = 0): number {
  return Math.cos((normalizedTime + phase) * Math.PI * 2 * cycles);
}

/**
 * BreathingBlob - Radial gradient with sinusoidal breathing and hue shift
 * Creates a meditative, pulsing central blob effect
 * Supports custom color via the blobColorState
 * Scales properly for any screen size including 8000px+
 */
export const BreathingBlob: VisualModeFunction = (ctx, t, w, h, loopDuration, scale) => {
  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);
  
  // Calculate normalized time (0 to 1) for seamless looping
  const normalizedTime = (t % loopDuration) / loopDuration;
  
  // Get the current blob color and convert to HSL
  const blobColor = getBlobColor();
  const baseHsl = hexToHsl(blobColor);
  
  // Draw dark background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  
  // Add subtle star field background first (behind blob)
  // Scale star count with screen area
  drawStarField(ctx, normalizedTime, w, h, scale);
  
  // Draw the main blob layers - more layers for depth
  const layers = 6;
  
  for (let layer = layers - 1; layer >= 0; layer--) {
    drawBreathingLayer(ctx, normalizedTime, cx, cy, minDim, layer, layers, baseHsl, scale);
  }
  
  // Add bright center glow
  drawCenterGlow(ctx, normalizedTime, cx, cy, minDim, baseHsl);
};

/**
 * Draw a single breathing layer - stays true to selected color
 * Uses normalized time for seamless looping
 * Scales wobble effect with screen size
 */
function drawBreathingLayer(
  ctx: CanvasRenderingContext2D,
  normalizedTime: number,
  cx: number,
  cy: number,
  minDim: number,
  layer: number,
  totalLayers: number,
  baseHsl: { h: number; s: number; l: number },
  scale: number
): void {
  const layerOffset = layer / totalLayers;
  
  // Breathing parameters - use whole cycle counts for seamless looping
  // Outer layers breathe slower (fewer cycles), inner layers breathe faster
  const breatheCycles = 3 - layer * 0.3; // ~3 cycles for innermost, ~1.2 for outermost
  const breatheAmount = 0.1 + layer * 0.03;
  
  // Calculate size with breathing using loopable sine
  const baseSize = minDim * (0.25 + layer * 0.15);
  const breatheValue = loopSin(normalizedTime, breatheCycles, layerOffset);
  const size = baseSize * (1 + breatheValue * breatheAmount);
  
  // Keep the hue very close to selected color - only subtle variation per layer
  const hueVariation = layer * 5;
  const hue = (baseHsl.h + hueVariation) % 360;
  
  // Keep saturation high, adjust lightness per layer
  const saturation = Math.max(60, Math.min(100, baseHsl.s + 15));
  const lightness = Math.max(30, Math.min(65, baseHsl.l + 10 - layer * 4));
  
  // Higher alpha for more visibility
  const alpha = 0.85 - layer * 0.12;
  
  // Create radial gradient for the blob
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
  
  // Inner color is bright and saturated
  gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${Math.min(90, lightness + 30)}%, ${alpha})`);
  gradient.addColorStop(0.25, `hsla(${hue}, ${saturation}%, ${lightness + 15}%, ${alpha * 0.85})`);
  gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.6})`);
  gradient.addColorStop(0.75, `hsla(${hue}, ${saturation - 15}%, ${lightness - 10}%, ${alpha * 0.35})`);
  gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
  
  // Draw the blob with gentle movement - use 2 cycles for wobble
  // Scale wobble amount with screen size so it's visible on large displays
  const wobblePhase = layer * 0.1;
  const wobbleAmount = 4 * scale; // Scale wobble with screen size
  const wobbleX = loopSin(normalizedTime, 2, wobblePhase) * wobbleAmount;
  const wobbleY = loopCos(normalizedTime, 2, wobblePhase) * wobbleAmount;
  
  ctx.save();
  ctx.translate(wobbleX, wobbleY);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a subtle animated star field
 * Uses normalized time for seamless looping
 * Scales star count and size with screen dimensions
 */
function drawStarField(
  ctx: CanvasRenderingContext2D,
  normalizedTime: number,
  w: number,
  h: number,
  scale: number
): void {
  // Scale star count with screen area (more stars on larger screens)
  // Base: 80 stars at 1920x1080, scales up proportionally
  const baseStarCount = 80;
  const starCount = Math.floor(baseStarCount * scale * scale);
  
  // Clamp to reasonable range to prevent performance issues
  const clampedStarCount = Math.min(Math.max(starCount, 40), 800);
  
  for (let i = 0; i < clampedStarCount; i++) {
    const seed = i * 97.531;
    
    // Fixed position based on seed - use better distribution for large screens
    // Use golden ratio for more even distribution
    const goldenAngle = i * 2.39996323; // Golden angle in radians
    const radius = Math.sqrt(i / clampedStarCount);
    const x = (0.5 + radius * Math.cos(goldenAngle) * 0.5) * w;
    const y = (0.5 + radius * Math.sin(goldenAngle) * 0.5) * h;
    
    // Twinkling effect - different stars twinkle at different rates (1-3 cycles)
    const twinkleCycles = 1 + (i % 5) * 0.5;
    const twinklePhase = (seed % 1); // Random phase based on seed
    const twinkle = loopSin(normalizedTime, twinkleCycles, twinklePhase);
    const alpha = 0.2 + (twinkle * 0.5 + 0.5) * 0.4;
    
    // Scale star size with screen size
    const baseSize = 0.8 + (twinkle * 0.5 + 0.5) * 1.5;
    const size = baseSize * Math.max(1, scale * 0.7);
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

/**
 * Draw a bright center glow - matches selected color
 * Uses normalized time for seamless looping
 */
function drawCenterGlow(
  ctx: CanvasRenderingContext2D,
  normalizedTime: number,
  cx: number,
  cy: number,
  minDim: number,
  baseHsl: { h: number; s: number; l: number }
): void {
  // Pulsing inner glow - 2 complete pulses per loop for nice rhythm
  const pulseAmount = 1 + loopSin(normalizedTime, 2) * 0.1;
  const glowSize = minDim * 0.2 * pulseAmount;
  
  // Use the exact hue from selected color
  const hue = baseHsl.h;
  const sat = Math.max(70, baseHsl.s + 20);
  
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
  gradient.addColorStop(0, `hsla(${hue}, 100%, 98%, 1)`);
  gradient.addColorStop(0.15, `hsla(${hue}, ${sat}%, 90%, 0.9)`);
  gradient.addColorStop(0.35, `hsla(${hue}, ${sat}%, 75%, 0.6)`);
  gradient.addColorStop(0.6, `hsla(${hue}, ${sat}%, 55%, 0.25)`);
  gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Bright core
  const coreSize = glowSize * 0.12;
  const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
  coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  coreGradient.addColorStop(0.4, `hsla(${hue}, 100%, 95%, 0.8)`);
  coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
  ctx.fill();
}
