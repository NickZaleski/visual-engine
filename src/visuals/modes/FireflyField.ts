import type { VisualModeFunction } from '../engine';

// Animation timing
const DRIFT_CYCLE = 20; // seconds for particle drift
const GLOW_CYCLE = 4; // seconds for glow pulsing
const WANDER_CYCLE = 8; // seconds for wandering motion

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
 * Smooth easing function
 */
function smoothstep(x: number): number {
  return x * x * (3 - 2 * x);
}

/**
 * Particle definition with 3D position
 */
interface Particle {
  // Base position (0-1 normalized)
  baseX: number;
  baseY: number;
  z: number; // Depth (0 = far, 1 = near)
  
  // Animation parameters
  wanderPhase: number;
  glowPhase: number;
  driftSpeed: number;
  
  // Visual properties
  hue: number;
  baseSize: number;
}

/**
 * Generate deterministic particles with 3D distribution
 */
function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    // Use deterministic pseudo-random based on index
    const seed1 = Math.sin(i * 127.1) * 43758.5453;
    const seed2 = Math.sin(i * 269.5) * 43758.5453;
    const seed3 = Math.sin(i * 419.2) * 43758.5453;
    const seed4 = Math.sin(i * 631.7) * 43758.5453;
    
    const rand1 = seed1 - Math.floor(seed1);
    const rand2 = seed2 - Math.floor(seed2);
    const rand3 = seed3 - Math.floor(seed3);
    const rand4 = seed4 - Math.floor(seed4);
    
    // Warm firefly colors - yellows, oranges, soft greens
    const hueOptions = [45, 50, 55, 60, 80, 35, 40]; // Warm yellows to soft greens
    
    particles.push({
      baseX: rand1,
      baseY: rand2,
      z: rand3, // Depth layer
      wanderPhase: rand4,
      glowPhase: (i * 0.1) % 1,
      driftSpeed: 0.7 + rand4 * 0.6,
      hue: hueOptions[i % hueOptions.length],
      baseSize: 2 + rand3 * 4, // Larger particles in front
    });
  }
  
  // Sort by depth (far to near) for proper layering
  particles.sort((a, b) => a.z - b.z);
  
  return particles;
}

/**
 * FireflyField - Thousands of soft glowing particles drifting in 3D space
 * Creates a magical, floating sensation among gentle lights
 */
export const FireflyField: VisualModeFunction = (ctx, t, w, h, _loopDuration, scale) => {
  const time = t;
  
  // Deep night sky background with subtle depth gradient
  const bgGradient = ctx.createRadialGradient(
    w * 0.5, h * 0.5, 0,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.8
  );
  bgGradient.addColorStop(0, '#0a0d12');
  bgGradient.addColorStop(0.4, '#060810');
  bgGradient.addColorStop(0.7, '#04060a');
  bgGradient.addColorStop(1, '#020305');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);
  
  // Draw distant stars for depth
  drawBackgroundStars(ctx, time, w, h, scale);
  
  // Generate particles based on scale
  const baseParticleCount = 200;
  const particleCount = Math.min(Math.max(Math.floor(baseParticleCount * scale * scale), 100), 1000);
  const particles = generateParticles(particleCount);
  
  // Draw all particles with depth-based effects
  for (const particle of particles) {
    drawFirefly(ctx, time, w, h, particle, scale);
  }
  
  // Add subtle atmospheric haze
  addAtmosphericHaze(ctx, time, w, h);
};

/**
 * Draw a single firefly particle with glow
 */
function drawFirefly(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  particle: Particle,
  scale: number
): void {
  // Depth-based parallax - closer particles move more
  const parallaxStrength = 0.05 + particle.z * 0.1;
  
  // Gentle wandering motion
  const wanderX = continuousSin(time, WANDER_CYCLE / particle.driftSpeed, particle.wanderPhase) * parallaxStrength;
  const wanderY = continuousCos(time, WANDER_CYCLE * 0.8 / particle.driftSpeed, particle.wanderPhase * 1.3) * parallaxStrength;
  
  // Slow drift
  const driftX = continuousSin(time, DRIFT_CYCLE, particle.wanderPhase * 0.5) * 0.02;
  const driftY = continuousCos(time, DRIFT_CYCLE * 1.2, particle.wanderPhase * 0.7) * 0.015;
  
  // Final position
  const x = (particle.baseX + wanderX + driftX) * w;
  const y = (particle.baseY + wanderY + driftY) * h;
  
  // Wrap around edges smoothly
  const wrappedX = ((x % w) + w) % w;
  const wrappedY = ((y % h) + h) % h;
  
  // Depth-based sizing (closer = larger)
  const depthSize = 0.4 + particle.z * 0.6;
  const baseSize = particle.baseSize * depthSize * Math.max(1, scale * 0.6);
  
  // Glow pulsing - fireflies blink on and off gently
  const glowCycle = GLOW_CYCLE * (0.8 + particle.glowPhase * 0.4);
  const glowPhase = (time / glowCycle + particle.glowPhase) % 1;
  
  // Firefly-like pulsing pattern (quick on, slow fade)
  let glowIntensity: number;
  if (glowPhase < 0.15) {
    // Quick brightening
    glowIntensity = smoothstep(glowPhase / 0.15);
  } else if (glowPhase < 0.4) {
    // Hold bright
    glowIntensity = 1;
  } else if (glowPhase < 0.7) {
    // Slow fade
    glowIntensity = 1 - smoothstep((glowPhase - 0.4) / 0.3);
  } else {
    // Off period
    glowIntensity = 0;
  }
  
  // Some particles have gentler, continuous glow
  if (particle.glowPhase > 0.7) {
    glowIntensity = 0.3 + continuousSin(time, GLOW_CYCLE * 0.5, particle.glowPhase) * 0.3 + 0.3;
  }
  
  // Skip if too dim
  if (glowIntensity < 0.05) return;
  
  // Depth-based opacity (closer = more visible)
  const depthAlpha = 0.3 + particle.z * 0.7;
  const alpha = glowIntensity * depthAlpha;
  
  // Glow radius
  const glowRadius = baseSize * (2 + glowIntensity * 2);
  
  // Draw outer glow
  const outerGlow = ctx.createRadialGradient(
    wrappedX, wrappedY, 0,
    wrappedX, wrappedY, glowRadius
  );
  
  const sat = 80 + glowIntensity * 20;
  const lit = 50 + glowIntensity * 30;
  
  outerGlow.addColorStop(0, `hsla(${particle.hue}, ${sat}%, ${lit + 30}%, ${alpha})`);
  outerGlow.addColorStop(0.2, `hsla(${particle.hue}, ${sat}%, ${lit + 15}%, ${alpha * 0.7})`);
  outerGlow.addColorStop(0.5, `hsla(${particle.hue}, ${sat - 10}%, ${lit}%, ${alpha * 0.3})`);
  outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(wrappedX, wrappedY, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw bright core
  if (glowIntensity > 0.3) {
    const coreRadius = baseSize * 0.5 * glowIntensity;
    
    const coreGlow = ctx.createRadialGradient(
      wrappedX, wrappedY, 0,
      wrappedX, wrappedY, coreRadius
    );
    
    coreGlow.addColorStop(0, `rgba(255, 255, 240, ${alpha})`);
    coreGlow.addColorStop(0.5, `hsla(${particle.hue}, 100%, 85%, ${alpha * 0.8})`);
    coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(wrappedX, wrappedY, coreRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw subtle background stars for depth
 */
function drawBackgroundStars(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number,
  scale: number
): void {
  const starCount = Math.min(Math.max(Math.floor(80 * scale), 40), 300);
  
  for (let i = 0; i < starCount; i++) {
    const seed1 = Math.sin(i * 311.7) * 43758.5453;
    const seed2 = Math.sin(i * 523.3) * 43758.5453;
    const x = (seed1 - Math.floor(seed1)) * w;
    const y = (seed2 - Math.floor(seed2)) * h;
    
    // Very subtle twinkling
    const twinkle = 0.15 + continuousSin(time, 5 + (i % 4), i * 0.1) * 0.1;
    
    const size = 0.3 + (i % 2) * 0.2;
    
    ctx.beginPath();
    ctx.arc(x, y, size * Math.max(1, scale * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 210, 255, ${twinkle})`;
    ctx.fill();
  }
}

/**
 * Add subtle atmospheric haze for depth
 */
function addAtmosphericHaze(
  ctx: CanvasRenderingContext2D,
  time: number,
  w: number,
  h: number
): void {
  // Very subtle warm glow in the center
  const hazeIntensity = 0.02 + continuousSin(time, DRIFT_CYCLE) * 0.008;
  
  const gradient = ctx.createRadialGradient(
    w * 0.5, h * 0.6, 0,
    w * 0.5, h * 0.6, Math.max(w, h) * 0.5
  );
  
  gradient.addColorStop(0, `rgba(255, 200, 100, ${hazeIntensity})`);
  gradient.addColorStop(0.5, `rgba(200, 150, 80, ${hazeIntensity * 0.4})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}


