import type { VisualModeFunction } from '../engine';
import { getBlobColor, hexToHsl } from '../blobColorState';

// Fixed breathing cycle duration in seconds (controls speed)
const BREATH_CYCLE = 10;

/**
 * Helper to create continuous animation values
 * @param time - Raw time in seconds (not looped)
 * @param cycleDuration - Duration of one complete cycle in seconds
 * @param phase - Phase offset (0 to 1)
 */
function continuousSin(time: number, cycleDuration: number, phase: number = 0): number {
  return Math.sin((time / cycleDuration + phase) * Math.PI * 2);
}

function continuousCos(time: number, cycleDuration: number, phase: number = 0): number {
  return Math.cos((time / cycleDuration + phase) * Math.PI * 2);
}

/**
 * BreathingBlob - Radial gradient with sinusoidal breathing and hue shift
 * Creates a meditative, pulsing central blob effect
 * Supports custom color via the blobColorState
 * Scales properly for any screen size including 8000px+
 * Breathes infinitely with smooth continuous motion
 */
export const BreathingBlob: VisualModeFunction = (ctx, t, w, h, _loopDuration, scale) => {
  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);
  
  // Use raw time for infinite continuous breathing (no loop reset)
  const time = t;
  
  // Get the current blob color and convert to HSL
  const blobColor = getBlobColor();
  const baseHsl = hexToHsl(blobColor);
  
  // Draw dark background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  
  // Add subtle star field background first (behind blob)
  // Scale star count with screen area
  drawStarField(ctx, time, w, h, scale);
  
  // Draw the main blob layers - more layers for depth
  const layers = 6;
  
  for (let layer = layers - 1; layer >= 0; layer--) {
    drawBreathingLayer(ctx, time, cx, cy, minDim, layer, layers, baseHsl, scale);
  }
  
  // Add bright center glow
  drawCenterGlow(ctx, time, cx, cy, minDim, baseHsl);
};

/**
 * Draw a single breathing layer - stays true to selected color
 * Uses continuous time for infinite smooth breathing
 * Scales wobble effect with screen size
 */
function drawBreathingLayer(
  ctx: CanvasRenderingContext2D,
  time: number,
  cx: number,
  cy: number,
  minDim: number,
  layer: number,
  totalLayers: number,
  baseHsl: { h: number; s: number; l: number },
  scale: number
): void {
  const layerOffset = layer / totalLayers;
  
  // Breathing parameters - outer layers breathe slower, inner layers breathe faster
  // All based on the fixed BREATH_CYCLE duration
  const layerCycleDuration = BREATH_CYCLE * (1 + layer * 0.2); // Outer layers slower
  const breatheAmount = 0.1 + layer * 0.03;
  
  // Calculate size with breathing using continuous sine
  const baseSize = minDim * (0.25 + layer * 0.15);
  const breatheValue = continuousSin(time, layerCycleDuration, layerOffset);
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
  
  // Draw the blob with gentle movement
  // Scale wobble amount with screen size so it's visible on large displays
  const wobblePhase = layer * 0.1;
  const wobbleCycleDuration = BREATH_CYCLE * 0.7; // Wobble slightly faster than breath
  const wobbleAmount = 4 * scale; // Scale wobble with screen size
  const wobbleX = continuousSin(time, wobbleCycleDuration, wobblePhase) * wobbleAmount;
  const wobbleY = continuousCos(time, wobbleCycleDuration, wobblePhase) * wobbleAmount;
  
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
 * Uses continuous time for infinite smooth twinkling
 * Scales star count and size with screen dimensions
 */
function drawStarField(
  ctx: CanvasRenderingContext2D,
  time: number,
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
    
    // Twinkling effect - different stars twinkle at different rates
    const twinkleCycleDuration = 3 + (i % 5) * 2; // 3-11 seconds per twinkle
    const twinklePhase = (seed % 1); // Random phase based on seed
    const twinkle = continuousSin(time, twinkleCycleDuration, twinklePhase);
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
 * Uses continuous time for infinite smooth pulsing
 */
function drawCenterGlow(
  ctx: CanvasRenderingContext2D,
  time: number,
  cx: number,
  cy: number,
  minDim: number,
  baseHsl: { h: number; s: number; l: number }
): void {
  // Pulsing inner glow - pulses at half the breath cycle for nice rhythm
  const pulseCycleDuration = BREATH_CYCLE / 2;
  const pulseAmount = 1 + continuousSin(time, pulseCycleDuration) * 0.1;
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
