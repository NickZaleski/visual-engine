import type { VisualModeFunction } from '../engine';

// Aurora animation timing
const AURORA_CYCLE = 25; // seconds for one complete aurora wave cycle
const SHIMMER_CYCLE = 3; // seconds for shimmer effect

/**
 * Helper for continuous sine wave animation
 */
function continuousSin(time: number, cycleDuration: number, phase: number = 0): number {
  return Math.sin((time / cycleDuration + phase) * Math.PI * 2);
}

/**
 * AuroraDrift - Ethereal northern lights ribbons undulating across the sky
 * Creates a deeply relaxing, floating sensation with soft color gradients
 */
export const AuroraDrift: VisualModeFunction = (ctx, t, w, h, _loopDuration, scale) => {
  const time = t;
  
  // Draw deep space background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
  bgGradient.addColorStop(0, '#020810');
  bgGradient.addColorStop(0.4, '#051020');
  bgGradient.addColorStop(0.7, '#0a1628');
  bgGradient.addColorStop(1, '#0d1a30');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Draw twinkling stars behind aurora
  drawStars(ctx, time, w, h, scale);
  
  // Draw multiple aurora ribbon layers
  const ribbonCount = 5;
  for (let i = 0; i < ribbonCount; i++) {
    drawAuroraRibbon(ctx, time, w, h, i, ribbonCount, scale);
  }
  
  // Add subtle overall glow overlay
  addAuroraGlow(ctx, time, w, h);
};

/**
 * Draw a single aurora ribbon with undulating motion
 */
function drawAuroraRibbon(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  index: number,
  total: number,
  scale: number
): void {
  const ribbonPhase = index / total;
  const ribbonSpeed = 1 + index * 0.15;
  
  // Vertical position varies per ribbon - spread across upper portion of screen
  const baseY = h * (0.15 + index * 0.12);
  const ribbonHeight = h * (0.25 - index * 0.03);
  
  // Aurora colors - greens, teals, purples, pinks
  const colors = [
    { h: 140, s: 85, l: 55 }, // Green
    { h: 165, s: 80, l: 50 }, // Teal
    { h: 180, s: 75, l: 45 }, // Cyan
    { h: 280, s: 70, l: 55 }, // Purple
    { h: 320, s: 65, l: 50 }, // Pink
  ];
  
  const colorIndex = index % colors.length;
  const color = colors[colorIndex];
  
  // Animate hue slightly over time
  const hueShift = continuousSin(time, AURORA_CYCLE * 2, ribbonPhase) * 15;
  const animatedHue = (color.h + hueShift + 360) % 360;
  
  // Number of segments for smooth ribbon
  const segments = Math.floor(w / (4 / scale));
  const segmentWidth = w / segments;
  
  ctx.save();
  
  // Draw ribbon as a series of vertical gradient strips
  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth;
    const xNorm = i / segments;
    
    // Wave motion - multiple frequencies for organic feel
    const wave1 = continuousSin(time, AURORA_CYCLE / ribbonSpeed, xNorm * 2 + ribbonPhase) * ribbonHeight * 0.3;
    const wave2 = continuousSin(time, AURORA_CYCLE * 0.7 / ribbonSpeed, xNorm * 3 + ribbonPhase * 2) * ribbonHeight * 0.15;
    const wave3 = continuousSin(time, AURORA_CYCLE * 0.4, xNorm * 5 + ribbonPhase) * ribbonHeight * 0.08;
    
    const yOffset = wave1 + wave2 + wave3;
    const y = baseY + yOffset;
    
    // Height varies along ribbon
    const heightVariation = 0.7 + continuousSin(time, AURORA_CYCLE * 0.5, xNorm * 4 + ribbonPhase) * 0.3;
    const localHeight = ribbonHeight * heightVariation;
    
    // Shimmer effect - rapid brightness variation
    const shimmer = 0.6 + continuousSin(time, SHIMMER_CYCLE, xNorm * 10 + index) * 0.4;
    
    // Intensity varies along ribbon (fades at edges)
    const edgeFade = Math.sin(xNorm * Math.PI);
    const intensity = edgeFade * shimmer;
    
    // Create vertical gradient for this segment
    const gradient = ctx.createLinearGradient(x, y - localHeight * 0.5, x, y + localHeight * 0.5);
    
    // Soft falloff at top and bottom
    gradient.addColorStop(0, `hsla(${animatedHue}, ${color.s}%, ${color.l}%, 0)`);
    gradient.addColorStop(0.2, `hsla(${animatedHue}, ${color.s}%, ${color.l + 10}%, ${intensity * 0.3})`);
    gradient.addColorStop(0.4, `hsla(${animatedHue}, ${color.s}%, ${color.l + 20}%, ${intensity * 0.6})`);
    gradient.addColorStop(0.5, `hsla(${animatedHue}, ${color.s}%, ${color.l + 25}%, ${intensity * 0.8})`);
    gradient.addColorStop(0.6, `hsla(${animatedHue}, ${color.s}%, ${color.l + 20}%, ${intensity * 0.6})`);
    gradient.addColorStop(0.8, `hsla(${animatedHue}, ${color.s}%, ${color.l + 10}%, ${intensity * 0.3})`);
    gradient.addColorStop(1, `hsla(${animatedHue}, ${color.s}%, ${color.l}%, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 1, y - localHeight * 0.5, segmentWidth + 2, localHeight);
  }
  
  ctx.restore();
}

/**
 * Draw twinkling stars in the background
 */
function drawStars(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  scale: number
): void {
  const starCount = Math.min(Math.max(Math.floor(100 * scale * scale), 50), 500);
  
  for (let i = 0; i < starCount; i++) {
    // Deterministic position based on index
    const seed1 = Math.sin(i * 127.1) * 43758.5453;
    const seed2 = Math.sin(i * 269.5) * 43758.5453;
    const x = (seed1 - Math.floor(seed1)) * w;
    const y = (seed2 - Math.floor(seed2)) * h * 0.7; // Stars mostly in upper portion
    
    // Twinkling
    const twinkleCycle = 2 + (i % 7);
    const twinklePhase = (i * 0.1) % 1;
    const twinkle = 0.3 + (continuousSin(time, twinkleCycle, twinklePhase) * 0.5 + 0.5) * 0.7;
    
    const size = (0.5 + (i % 3) * 0.3) * Math.max(1, scale * 0.5);
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
    ctx.fill();
  }
}

/**
 * Add overall atmospheric glow
 */
function addAuroraGlow(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number
): void {
  // Subtle pulsing glow in the upper portion
  const glowIntensity = 0.05 + continuousSin(time, AURORA_CYCLE) * 0.02;
  
  const gradient = ctx.createRadialGradient(
    w * 0.5, h * 0.2, 0,
    w * 0.5, h * 0.2, h * 0.8
  );
  
  gradient.addColorStop(0, `rgba(100, 255, 200, ${glowIntensity})`);
  gradient.addColorStop(0.5, `rgba(80, 200, 255, ${glowIntensity * 0.5})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

