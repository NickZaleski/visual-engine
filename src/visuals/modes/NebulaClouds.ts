import type { VisualModeFunction } from '../engine';

// Animation timing
const DRIFT_CYCLE = 30; // seconds for cloud drift
const MORPH_CYCLE = 15; // seconds for cloud morphing
const GLOW_CYCLE = 10; // seconds for internal glow pulsing

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
 * Attempt smooth noise using layered sine waves for cloud-like patterns
 */
function cloudNoise(x: number, y: number, time: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    const t = time * 0.02 * (1 + i * 0.3);
    value += amplitude * (
      Math.sin(x * frequency + t * 1.1 + i) * 0.5 +
      Math.sin(y * frequency * 0.9 + t * 0.8 + i * 2) * 0.3 +
      Math.sin((x + y) * frequency * 0.7 + t * 1.2) * 0.2
    );
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return (value / maxValue + 1) * 0.5; // Normalize to 0-1
}

/**
 * NebulaClouds - Soft, billowing cosmic clouds that slowly morph and drift
 * Creates a sense of floating through a gentle cosmic space
 */
export const NebulaClouds: VisualModeFunction = (ctx, t, w, h, _loopDuration, scale) => {
  const time = t;
  
  // Deep space background with subtle gradient
  const bgGradient = ctx.createRadialGradient(
    w * 0.5, h * 0.5, 0,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.8
  );
  bgGradient.addColorStop(0, '#0a0812');
  bgGradient.addColorStop(0.5, '#050408');
  bgGradient.addColorStop(1, '#020204');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Draw distant stars behind clouds
  drawDistantStars(ctx, time, w, h, scale);
  
  // Draw multiple cloud layers (back to front)
  const cloudLayers = 4;
  for (let i = 0; i < cloudLayers; i++) {
    drawCloudLayer(ctx, time, w, h, i, cloudLayers, scale);
  }
  
  // Add volumetric glow effect
  addVolumetricGlow(ctx, time, w, h);
};

/**
 * Draw a single nebula cloud layer
 */
function drawCloudLayer(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  index: number,
  total: number,
  scale: number
): void {
  const layerDepth = (index + 1) / total;
  
  // Cloud colors - deep purples, magentas, and teals
  const colorPalettes = [
    { h: 280, s: 60, l: 25 }, // Deep purple
    { h: 320, s: 50, l: 30 }, // Magenta
    { h: 200, s: 55, l: 28 }, // Deep teal
    { h: 260, s: 65, l: 22 }, // Violet
  ];
  
  const palette = colorPalettes[index % colorPalettes.length];
  
  // Hue shifts slowly over time
  const hueShift = continuousSin(time, MORPH_CYCLE * 2, index * 0.25) * 20;
  const hue = (palette.h + hueShift + 360) % 360;
  
  // Sample resolution based on scale
  const sampleSize = Math.max(4, Math.floor(8 / scale));
  const cols = Math.ceil(w / sampleSize);
  const rows = Math.ceil(h / sampleSize);
  
  // Cloud center drifts slowly
  const driftX = continuousSin(time, DRIFT_CYCLE, index * 0.3) * 0.3;
  const driftY = continuousCos(time, DRIFT_CYCLE * 0.8, index * 0.5) * 0.2;
  
  // Cloud center position
  const centerX = 0.3 + index * 0.15 + driftX;
  const centerY = 0.3 + index * 0.12 + driftY;
  
  ctx.save();
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * sampleSize;
      const y = row * sampleSize;
      
      // Normalized coordinates
      const xNorm = col / cols;
      const yNorm = row / rows;
      
      // Distance from cloud center
      const dx = xNorm - centerX;
      const dy = yNorm - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Cloud shape using noise
      const noiseScale = 2 + index * 0.5;
      const noiseVal = cloudNoise(
        xNorm * noiseScale + driftX,
        yNorm * noiseScale + driftY,
        time + index * 100,
        3
      );
      
      // Morphing effect
      const morph = continuousSin(time, MORPH_CYCLE, xNorm + yNorm + index * 0.2) * 0.15;
      
      // Cloud density based on distance and noise
      const baseRadius = 0.35 + index * 0.05;
      const cloudShape = Math.max(0, 1 - dist / (baseRadius + morph));
      const density = cloudShape * noiseVal;
      
      if (density > 0.1) {
        // Internal glow pulsing
        const glowPulse = 0.8 + continuousSin(time, GLOW_CYCLE, dist + index * 0.3) * 0.2;
        
        // Lightness varies with density for volumetric effect
        const lit = palette.l + density * 25 * glowPulse;
        const sat = palette.s + density * 15;
        
        // Alpha based on density and layer
        const alpha = density * (0.4 - index * 0.08) * layerDepth;
        
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;
        ctx.fillRect(x, y, sampleSize, sampleSize);
      }
    }
  }
  
  ctx.restore();
  
  // Add bright core glow for each cloud
  drawCloudCore(ctx, time, w, h, centerX, centerY, index, hue);
}

/**
 * Draw bright glowing core of cloud
 */
function drawCloudCore(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  centerX: number,
  centerY: number,
  index: number,
  hue: number
): void {
  const cx = centerX * w;
  const cy = centerY * h;
  
  // Pulsing core glow
  const pulse = 0.7 + continuousSin(time, GLOW_CYCLE * 0.7, index * 0.4) * 0.3;
  const radius = Math.min(w, h) * 0.15 * pulse;
  
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  
  gradient.addColorStop(0, `hsla(${(hue + 30) % 360}, 80%, 70%, 0.15)`);
  gradient.addColorStop(0.3, `hsla(${hue}, 70%, 50%, 0.08)`);
  gradient.addColorStop(0.7, `hsla(${(hue - 20 + 360) % 360}, 60%, 40%, 0.03)`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw distant twinkling stars
 */
function drawDistantStars(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  scale: number
): void {
  const starCount = Math.min(Math.max(Math.floor(150 * scale * scale), 80), 600);
  
  for (let i = 0; i < starCount; i++) {
    // Deterministic position
    const seed1 = Math.sin(i * 127.1 + 0.5) * 43758.5453;
    const seed2 = Math.sin(i * 269.5 + 0.3) * 43758.5453;
    const x = (seed1 - Math.floor(seed1)) * w;
    const y = (seed2 - Math.floor(seed2)) * h;
    
    // Gentle twinkling
    const twinkleCycle = 3 + (i % 5) * 1.5;
    const twinkle = 0.2 + (continuousSin(time, twinkleCycle, i * 0.1) * 0.5 + 0.5) * 0.5;
    
    // Vary star colors slightly
    const colorVariation = i % 4;
    let color: string;
    switch (colorVariation) {
      case 0: color = `rgba(255, 255, 255, ${twinkle})`; break;
      case 1: color = `rgba(200, 220, 255, ${twinkle})`; break;
      case 2: color = `rgba(255, 240, 220, ${twinkle})`; break;
      default: color = `rgba(220, 200, 255, ${twinkle})`; break;
    }
    
    const size = (0.4 + (i % 3) * 0.25) * Math.max(1, scale * 0.5);
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/**
 * Add overall volumetric glow effect
 */
function addVolumetricGlow(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number
): void {
  // Subtle overall atmospheric glow
  const glowIntensity = 0.04 + continuousSin(time, GLOW_CYCLE * 1.5) * 0.015;
  
  const gradient = ctx.createRadialGradient(
    w * 0.5, h * 0.5, 0,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.6
  );
  
  const hue = 280 + continuousSin(time, DRIFT_CYCLE) * 30;
  
  gradient.addColorStop(0, `hsla(${hue}, 50%, 50%, ${glowIntensity})`);
  gradient.addColorStop(0.5, `hsla(${hue + 40}, 40%, 40%, ${glowIntensity * 0.5})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}


