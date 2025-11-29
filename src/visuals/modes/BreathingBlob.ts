import type { VisualModeFunction } from '../engine';
import { getBlobColor, hexToHsl } from '../blobColorState';

/**
 * BreathingBlob - Radial gradient with sinusoidal breathing and hue shift
 * Creates a meditative, pulsing central blob effect
 * Supports custom color via the blobColorState
 */
export const BreathingBlob: VisualModeFunction = (ctx, t, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);
  
  // Get the current blob color and convert to HSL
  const blobColor = getBlobColor();
  const baseHsl = hexToHsl(blobColor);
  
  // Draw dark background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  
  // Add subtle star field background first (behind blob)
  drawStarField(ctx, t, w, h);
  
  // Draw the main blob layers - more layers for depth
  const layers = 6;
  
  for (let layer = layers - 1; layer >= 0; layer--) {
    drawBreathingLayer(ctx, t, cx, cy, minDim, layer, layers, baseHsl);
  }
  
  // Add bright center glow
  drawCenterGlow(ctx, t, cx, cy, minDim, baseHsl);
};

/**
 * Draw a single breathing layer - stays true to selected color
 */
function drawBreathingLayer(
  ctx: CanvasRenderingContext2D,
  t: number,
  cx: number,
  cy: number,
  minDim: number,
  layer: number,
  totalLayers: number,
  baseHsl: { h: number; s: number; l: number }
): void {
  const layerOffset = layer / totalLayers;
  
  // Breathing parameters - slower for outer layers
  const breatheSpeed = 0.2 - layer * 0.015;
  const breathePhase = t * breatheSpeed + layerOffset * Math.PI;
  const breatheAmount = 0.1 + layer * 0.03;
  
  // Calculate size with breathing - MUCH LARGER
  const baseSize = minDim * (0.25 + layer * 0.15);
  const size = baseSize * (1 + Math.sin(breathePhase) * breatheAmount);
  
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
  const wobbleX = Math.sin(t * 0.12 + layer * 0.4) * 4;
  const wobbleY = Math.cos(t * 0.1 + layer * 0.4) * 4;
  
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
 */
function drawStarField(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  const starCount = 80;
  
  for (let i = 0; i < starCount; i++) {
    const seed = i * 97.531;
    
    // Fixed position based on seed
    const x = (Math.sin(seed) * 0.5 + 0.5) * w;
    const y = (Math.cos(seed * 1.3) * 0.5 + 0.5) * h;
    
    // Twinkling effect
    const twinkle = Math.sin(t * (0.3 + (i % 5) * 0.08) + seed);
    const alpha = 0.2 + (twinkle * 0.5 + 0.5) * 0.4;
    const size = 0.8 + (twinkle * 0.5 + 0.5) * 1.5;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

/**
 * Draw a bright center glow - matches selected color
 */
function drawCenterGlow(
  ctx: CanvasRenderingContext2D,
  t: number,
  cx: number,
  cy: number,
  minDim: number,
  baseHsl: { h: number; s: number; l: number }
): void {
  // Pulsing inner glow - slow pulse
  const pulseAmount = 1 + Math.sin(t * 0.35) * 0.1;
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
