import type { VisualModeFunction } from '../engine';

/**
 * Color stop for gradient
 */
interface ColorStop {
  hue: number;
  saturation: number;
  lightness: number;
  speed: number;
  offset: number;
}

// Predefined color palette for cosmic aesthetic
const colorStops: ColorStop[] = [
  { hue: 280, saturation: 70, lightness: 30, speed: 0.3, offset: 0 },
  { hue: 320, saturation: 80, lightness: 45, speed: 0.5, offset: 0.25 },
  { hue: 200, saturation: 90, lightness: 50, speed: 0.4, offset: 0.5 },
  { hue: 170, saturation: 75, lightness: 40, speed: 0.6, offset: 0.75 },
  { hue: 240, saturation: 60, lightness: 25, speed: 0.35, offset: 1 },
];

/**
 * GradientFlow - Slow animated multi-stop gradient
 * Creates a mesmerizing flowing gradient effect
 */
export const GradientFlow: VisualModeFunction = (ctx, t, w, h) => {
  // Calculate animated gradient angle
  const angle = (t * 0.1) % (Math.PI * 2);
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
    // Animate hue over time
    const animatedHue = (stop.hue + t * stop.speed * 20) % 360;
    
    // Subtle lightness pulsing
    const pulse = Math.sin(t * stop.speed * 2 + stop.offset * Math.PI * 2) * 5;
    const animatedLightness = stop.lightness + pulse;
    
    // Animate position slightly
    const posOffset = Math.sin(t * stop.speed + stop.offset * Math.PI * 2) * 0.05;
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
  const overlayAlpha = 0.1 + Math.sin(t * 0.2) * 0.05;
  radialGradient.addColorStop(0, `rgba(255, 255, 255, ${overlayAlpha})`);
  radialGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  radialGradient.addColorStop(1, `rgba(0, 0, 0, ${overlayAlpha * 1.5})`);
  
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Add floating particles effect
  drawParticles(ctx, t, w, h);
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

