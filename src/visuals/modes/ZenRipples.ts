import type { VisualModeFunction } from '../engine';

// Animation timing
const RIPPLE_CYCLE = 12; // seconds for ripple expansion

/**
 * Helper for continuous sine wave animation
 */
function continuousSin(time: number, cycleDuration: number, phase: number = 0): number {
  return Math.sin((time / cycleDuration + phase) * Math.PI * 2);
}

/**
 * Ripple source definition
 */
interface RippleSource {
  x: number;
  y: number;
  phase: number;
  speed: number;
  color: { h: number; s: number; l: number };
}

/**
 * Generate deterministic ripple sources
 */
function generateRippleSources(count: number): RippleSource[] {
  const sources: RippleSource[] = [];
  
  // Color palette - calming blues, teals, and soft purples
  const colors = [
    { h: 200, s: 70, l: 55 }, // Sky blue
    { h: 180, s: 65, l: 50 }, // Teal
    { h: 220, s: 60, l: 50 }, // Soft blue
    { h: 260, s: 50, l: 55 }, // Lavender
    { h: 190, s: 75, l: 45 }, // Cyan
  ];
  
  for (let i = 0; i < count; i++) {
    // Use golden ratio for pleasant distribution
    const goldenAngle = i * 2.39996323;
    const radius = 0.15 + (i / count) * 0.35;
    
    sources.push({
      x: 0.5 + Math.cos(goldenAngle) * radius,
      y: 0.5 + Math.sin(goldenAngle) * radius,
      phase: i / count,
      speed: 0.8 + (i % 3) * 0.15,
      color: colors[i % colors.length],
    });
  }
  
  return sources;
}

/**
 * ZenRipples - Concentric circles emanating from multiple points
 * Creates interference patterns like rain on a still pond
 * Deeply calming and meditative
 * Uses smooth vector rendering for high quality
 */
export const ZenRipples: VisualModeFunction = (ctx, t, w, h, _loopDuration, scale) => {
  const time = t;
  
  // Deep, calm water-like background
  const bgGradient = ctx.createRadialGradient(
    w * 0.5, h * 0.5, 0,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.8
  );
  bgGradient.addColorStop(0, '#0a1520');
  bgGradient.addColorStop(0.5, '#061018');
  bgGradient.addColorStop(1, '#030810');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Generate ripple sources
  const sourceCount = 5;
  const sources = generateRippleSources(sourceCount);
  
  // Draw smooth ripples using vector arcs
  drawSmoothRipples(ctx, time, w, h, sources, scale);
  
  // Add subtle surface reflection
  addSurfaceReflection(ctx, time, w, h);
};

/**
 * Draw smooth ripples using canvas arc rendering
 * This produces crisp, anti-aliased circles
 */
function drawSmoothRipples(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  sources: RippleSource[],
  scale: number
): void {
  const maxRadius = Math.max(w, h) * 0.9;
  const ripplesPerSource = 6;
  
  ctx.save();
  
  // Enable smooth rendering
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw each source's ripples
  for (const source of sources) {
    const cx = source.x * w;
    const cy = source.y * h;
    
    for (let r = 0; r < ripplesPerSource; r++) {
      // Ripple timing - staggered spawns
      const rippleAge = (time * source.speed / RIPPLE_CYCLE + source.phase + r / ripplesPerSource) % 1;
      const rippleRadius = rippleAge * maxRadius;
      
      // Skip if too small
      if (rippleRadius < 2) continue;
      
      // Fade out as ripple expands
      const ageFade = 1 - rippleAge;
      const alpha = ageFade * 0.5;
      
      // Skip if too faint
      if (alpha < 0.02) continue;
      
      // Line width decreases as ripple expands
      const baseLineWidth = (3 + (1 - rippleAge) * 8) * Math.max(1, scale * 0.7);
      
      // Create gradient stroke for the ripple
      // We'll draw multiple concentric rings with varying opacity for a soft glow effect
      const layers = 3;
      
      for (let layer = 0; layer < layers; layer++) {
        const layerAlpha = alpha * (1 - layer * 0.3);
        const layerWidth = baseLineWidth * (1 + layer * 0.5);
        const layerRadius = rippleRadius + layer * 2;
        
        // Hue shifts slightly for iridescence
        const hueShift = layer * 10 + rippleAge * 20;
        const hue = (source.color.h + hueShift) % 360;
        const sat = source.color.s - layer * 5;
        const lit = source.color.l + layer * 5;
        
        ctx.beginPath();
        ctx.arc(cx, cy, layerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${layerAlpha})`;
        ctx.lineWidth = layerWidth;
        ctx.stroke();
      }
    }
    
    // Draw glowing source point
    drawRippleSource(ctx, time, w, h, source, scale);
  }
  
  ctx.restore();
}

/**
 * Draw a subtle glow at ripple source point
 */
function drawRippleSource(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  source: RippleSource,
  scale: number
): void {
  const cx = source.x * w;
  const cy = source.y * h;
  
  // Pulsing glow when "dropping" a new ripple
  const dropPhase = (time * source.speed / RIPPLE_CYCLE + source.phase) % 1;
  const dropIntensity = dropPhase < 0.15 ? (1 - dropPhase / 0.15) * 0.6 : 0.15;
  
  const radius = Math.min(w, h) * 0.04 * (1 + dropIntensity) * Math.max(1, scale * 0.5);
  
  // Multi-layer glow for soft effect
  const glowLayers = 4;
  for (let i = glowLayers - 1; i >= 0; i--) {
    const layerRadius = radius * (1 + i * 0.5);
    const layerAlpha = (0.4 + dropIntensity) / (i + 1);
    
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, layerRadius);
    gradient.addColorStop(0, `hsla(${source.color.h}, ${source.color.s}%, 80%, ${layerAlpha})`);
    gradient.addColorStop(0.4, `hsla(${source.color.h}, ${source.color.s}%, 60%, ${layerAlpha * 0.6})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, layerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Bright core
  const coreRadius = radius * 0.3;
  const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
  coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 + dropIntensity * 0.2})`);
  coreGradient.addColorStop(0.5, `hsla(${source.color.h}, 100%, 85%, ${0.5 + dropIntensity})`);
  coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Add subtle surface reflection effect
 */
function addSurfaceReflection(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number
): void {
  // Gentle shimmer across the surface
  const shimmerIntensity = 0.04 + continuousSin(time, 8) * 0.015;
  
  // Radial gradient for depth
  const gradient = ctx.createRadialGradient(
    w * 0.5, h * 0.3, 0,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.6
  );
  
  gradient.addColorStop(0, `rgba(150, 200, 255, ${shimmerIntensity})`);
  gradient.addColorStop(0.5, `rgba(100, 150, 200, ${shimmerIntensity * 0.4})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // Add subtle moving highlight
  const highlightX = w * (0.3 + continuousSin(time, 15) * 0.2);
  const highlightY = h * (0.2 + continuousSin(time, 12, 0.25) * 0.1);
  const highlightRadius = Math.min(w, h) * 0.3;
  
  const highlightGradient = ctx.createRadialGradient(
    highlightX, highlightY, 0,
    highlightX, highlightY, highlightRadius
  );
  
  highlightGradient.addColorStop(0, `rgba(200, 230, 255, ${shimmerIntensity * 0.5})`);
  highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = highlightGradient;
  ctx.fillRect(0, 0, w, h);
}
