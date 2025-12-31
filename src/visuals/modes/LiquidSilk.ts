import type { VisualModeFunction } from '../engine';

// Animation timing
const WAVE_CYCLE = 20; // seconds for main wave motion
const SHIMMER_CYCLE = 8; // seconds for iridescent shimmer

/**
 * Helper for continuous sine wave animation
 */
function continuousSin(time: number, cycleDuration: number, phase: number = 0): number {
  return Math.sin((time / cycleDuration + phase) * Math.PI * 2);
}

function continuousCos(time: number, cycleDuration: number, phase: number = 0): number {
  return Math.cos((time / cycleDuration + phase) * Math.PI * 2);
}

/**
 * Attempt smooth noise using layered sine waves (simplex-like approximation)
 */
function smoothValue(x: number, y: number, time: number, freq: number = 1): number {
  const t = time * 0.05;
  return (
    Math.sin(x * freq + t * 1.1) * 0.4 +
    Math.sin(y * freq * 0.8 + t * 0.9) * 0.3 +
    Math.sin((x + y) * freq * 0.6 + t * 1.3) * 0.2 +
    Math.sin((x - y) * freq * 0.5 + t * 0.7) * 0.1
  );
}

/**
 * LiquidSilk - Ultra-smooth flowing fabric-like waves with iridescent sheen
 * Creates a sensation of floating on gentle ocean currents of light
 */
export const LiquidSilk: VisualModeFunction = (ctx, t, w, h, _loopDuration, scale) => {
  const time = t;
  
  // Deep, rich background
  const bgGradient = ctx.createLinearGradient(0, 0, w, h);
  bgGradient.addColorStop(0, '#0a0a15');
  bgGradient.addColorStop(0.5, '#0f0f20');
  bgGradient.addColorStop(1, '#0a0a18');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Draw multiple silk wave layers (back to front)
  const layerCount = 6;
  for (let i = 0; i < layerCount; i++) {
    drawSilkLayer(ctx, time, w, h, i, layerCount, scale);
  }
  
  // Add soft overall luminosity
  addSilkGlow(ctx, time, w, h);
};

/**
 * Draw a single flowing silk layer
 */
function drawSilkLayer(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  index: number,
  total: number,
  scale: number
): void {
  const layerDepth = index / total;
  const layerSpeed = 0.7 + layerDepth * 0.5;
  
  // Base vertical position - layers spread across screen
  const baseY = h * (0.2 + layerDepth * 0.6);
  const waveHeight = h * (0.15 + (1 - layerDepth) * 0.1);
  
  // Iridescent color based on layer and time
  // Shifts through blues, purples, teals, and subtle pinks
  const baseHue = 200 + index * 25;
  const hueShift = continuousSin(time, SHIMMER_CYCLE, layerDepth) * 30;
  const hue = (baseHue + hueShift) % 360;
  
  // Deeper layers are more transparent
  const baseAlpha = 0.4 - layerDepth * 0.15;
  
  // Number of points for smooth curve
  const points = Math.floor(w / (3 / Math.max(1, scale * 0.5)));
  
  ctx.save();
  ctx.beginPath();
  
  // Start from bottom left
  ctx.moveTo(0, h);
  
  // Draw the flowing wave top edge
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const xNorm = i / points;
    
    // Multiple wave frequencies for organic silk-like motion
    const wave1 = continuousSin(time, WAVE_CYCLE / layerSpeed, xNorm * 1.5 + layerDepth) * waveHeight * 0.5;
    const wave2 = continuousSin(time, WAVE_CYCLE * 0.6 / layerSpeed, xNorm * 2.5 + layerDepth * 2) * waveHeight * 0.25;
    const wave3 = continuousSin(time, WAVE_CYCLE * 0.35, xNorm * 4 + layerDepth * 3) * waveHeight * 0.12;
    const wave4 = continuousCos(time, WAVE_CYCLE * 0.8, xNorm * 1.8 + layerDepth) * waveHeight * 0.18;
    
    // Combine waves with smooth noise for fabric-like undulation
    const noiseVal = smoothValue(xNorm * 3, time * 0.02, time, 2 + index) * waveHeight * 0.1;
    
    const y = baseY + wave1 + wave2 + wave3 + wave4 + noiseVal;
    
    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      // Use quadratic curves for extra smoothness
      const prevX = ((i - 1) / points) * w;
      const cpX = (prevX + x) / 2;
      ctx.quadraticCurveTo(prevX, y, cpX, y);
    }
  }
  
  // Complete the shape
  ctx.lineTo(w, h);
  ctx.closePath();
  
  // Create gradient fill for silk sheen effect
  const gradient = ctx.createLinearGradient(0, baseY - waveHeight, 0, h);
  
  // Iridescent gradient stops
  const sat = 70 + continuousSin(time, SHIMMER_CYCLE * 0.7, layerDepth) * 15;
  const lit = 50 + continuousSin(time, SHIMMER_CYCLE * 0.5, layerDepth * 2) * 10;
  
  gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${lit + 20}%, ${baseAlpha * 1.2})`);
  gradient.addColorStop(0.2, `hsla(${(hue + 15) % 360}, ${sat}%, ${lit + 10}%, ${baseAlpha})`);
  gradient.addColorStop(0.5, `hsla(${(hue + 30) % 360}, ${sat - 10}%, ${lit}%, ${baseAlpha * 0.8})`);
  gradient.addColorStop(0.8, `hsla(${(hue + 20) % 360}, ${sat - 15}%, ${lit - 10}%, ${baseAlpha * 0.5})`);
  gradient.addColorStop(1, `hsla(${hue}, ${sat - 20}%, ${lit - 20}%, ${baseAlpha * 0.2})`);
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add subtle highlight along the wave crest
  drawSilkHighlight(ctx, time, w, h, baseY, waveHeight, index, total, hue, scale);
  
  ctx.restore();
}

/**
 * Draw subtle highlight along wave crests for silk sheen effect
 */
function drawSilkHighlight(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  _h: number,
  baseY: number,
  waveHeight: number,
  index: number,
  total: number,
  hue: number,
  scale: number
): void {
  const layerDepth = index / total;
  const layerSpeed = 0.7 + layerDepth * 0.5;
  
  const points = Math.floor(w / (6 / Math.max(1, scale * 0.5)));
  
  ctx.beginPath();
  
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const xNorm = i / points;
    
    // Match the main wave motion
    const wave1 = continuousSin(time, WAVE_CYCLE / layerSpeed, xNorm * 1.5 + layerDepth) * waveHeight * 0.5;
    const wave2 = continuousSin(time, WAVE_CYCLE * 0.6 / layerSpeed, xNorm * 2.5 + layerDepth * 2) * waveHeight * 0.25;
    const wave3 = continuousSin(time, WAVE_CYCLE * 0.35, xNorm * 4 + layerDepth * 3) * waveHeight * 0.12;
    const wave4 = continuousCos(time, WAVE_CYCLE * 0.8, xNorm * 1.8 + layerDepth) * waveHeight * 0.18;
    
    const y = baseY + wave1 + wave2 + wave3 + wave4;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  // Shimmer intensity varies along the highlight
  const shimmerIntensity = 0.15 + continuousSin(time, SHIMMER_CYCLE * 0.4, layerDepth) * 0.1;
  
  ctx.strokeStyle = `hsla(${(hue + 60) % 360}, 100%, 85%, ${shimmerIntensity})`;
  ctx.lineWidth = 2 * Math.max(1, scale * 0.5);
  ctx.lineCap = 'round';
  ctx.stroke();
}

/**
 * Add overall soft glow for depth
 */
function addSilkGlow(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number
): void {
  // Gentle pulsing central glow
  const pulseIntensity = 0.08 + continuousSin(time, WAVE_CYCLE * 0.5) * 0.03;
  
  const gradient = ctx.createRadialGradient(
    w * 0.5, h * 0.6, 0,
    w * 0.5, h * 0.6, Math.max(w, h) * 0.7
  );
  
  const glowHue = 220 + continuousSin(time, SHIMMER_CYCLE) * 20;
  
  gradient.addColorStop(0, `hsla(${glowHue}, 60%, 60%, ${pulseIntensity})`);
  gradient.addColorStop(0.4, `hsla(${glowHue + 30}, 50%, 50%, ${pulseIntensity * 0.5})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

