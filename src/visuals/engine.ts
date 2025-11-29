import { lerp, map, cycle, randomColor } from '../utils';
import { GradientFlow } from './modes/GradientFlow';
import { BreathingBlob } from './modes/BreathingBlob';

/**
 * Visual mode render function signature
 * @param ctx - Canvas rendering context
 * @param t - Current time in seconds (looped within duration)
 * @param w - Canvas width (display size, not buffer size)
 * @param h - Canvas height (display size, not buffer size)
 * @param loopDuration - Duration of one complete loop in seconds (for seamless looping)
 * @param scale - Scale factor for size-dependent elements (based on screen dimensions)
 */
export type VisualModeFunction = (
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number,
  loopDuration: number,
  scale: number
) => void;

/**
 * Visual mode definition
 */
export interface VisualMode {
  id: string;
  name: string;
  description: string;
  render: VisualModeFunction;
}

/**
 * Registry of all available visual modes
 */
export const visualModeRegistry: VisualMode[] = [
  {
    id: 'gradient-flow',
    name: 'Gradient Flow',
    description: 'Slow animated multi-stop gradient',
    render: GradientFlow,
  },
  {
    id: 'breathing-blob',
    name: 'Breathing Blob',
    description: 'Radial gradient with sinusoidal breathing and hue shift',
    render: BreathingBlob,
  },
];

/**
 * Get a visual mode by ID
 */
export function getVisualMode(id: string): VisualMode | undefined {
  return visualModeRegistry.find((mode) => mode.id === id);
}

/**
 * Time system for perfect loops
 */
export class TimeSystem {
  private startTime: number = 0;
  private loopDuration: number = 30; // seconds
  private paused: boolean = false;
  private pausedTime: number = 0;

  constructor(loopDuration: number = 30) {
    this.loopDuration = loopDuration;
    this.startTime = performance.now();
  }

  /**
   * Set the loop duration in seconds (8s - 60s)
   */
  setLoopDuration(seconds: number): void {
    this.loopDuration = Math.max(8, Math.min(60, seconds));
  }

  /**
   * Get the loop duration in seconds
   */
  getLoopDuration(): number {
    return this.loopDuration;
  }

  /**
   * Get current time in seconds, looped within duration
   */
  getTime(): number {
    if (this.paused) {
      return this.pausedTime % this.loopDuration;
    }
    const elapsed = (performance.now() - this.startTime) / 1000;
    return elapsed % this.loopDuration;
  }

  /**
   * Get normalized time (0-1) within the loop
   */
  getNormalizedTime(): number {
    return this.getTime() / this.loopDuration;
  }

  /**
   * Get raw elapsed time in seconds (not looped)
   */
  getRawTime(): number {
    if (this.paused) {
      return this.pausedTime;
    }
    return (performance.now() - this.startTime) / 1000;
  }

  /**
   * Pause the time system
   */
  pause(): void {
    if (!this.paused) {
      this.pausedTime = (performance.now() - this.startTime) / 1000;
      this.paused = true;
    }
  }

  /**
   * Resume the time system
   */
  resume(): void {
    if (this.paused) {
      this.startTime = performance.now() - this.pausedTime * 1000;
      this.paused = false;
    }
  }

  /**
   * Reset the time system
   */
  reset(): void {
    this.startTime = performance.now();
    this.pausedTime = 0;
  }
}

/**
 * Animation engine for managing the render loop
 * Supports any screen size including 8000px+ displays
 */
export class AnimationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private currentMode: VisualMode;
  private timeSystem: TimeSystem;
  private isRunning: boolean = false;
  
  // Display dimensions (CSS pixels, what users see)
  private displayWidth: number = 0;
  private displayHeight: number = 0;
  private dpr: number = 1;
  
  // Reference size for scaling (based on 1920x1080 as baseline)
  private static readonly REFERENCE_AREA = 1920 * 1080;

  constructor(loopDuration: number = 30) {
    this.currentMode = visualModeRegistry[0];
    this.timeSystem = new TimeSystem(loopDuration);
  }

  /**
   * Initialize the engine with a canvas element
   */
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
  }

  /**
   * Set the current visual mode
   */
  setMode(modeId: string): void {
    const mode = getVisualMode(modeId);
    if (mode) {
      this.currentMode = mode;
    }
  }

  /**
   * Get the current mode ID
   */
  getCurrentModeId(): string {
    return this.currentMode.id;
  }

  /**
   * Set loop duration
   */
  setLoopDuration(seconds: number): void {
    this.timeSystem.setLoopDuration(seconds);
  }

  /**
   * Get loop duration
   */
  getLoopDuration(): number {
    return this.timeSystem.getLoopDuration();
  }

  /**
   * Calculate scale factor for the current screen size
   * Returns a value that scales visual elements proportionally
   */
  private getScaleFactor(): number {
    const currentArea = this.displayWidth * this.displayHeight;
    // Scale proportionally to screen area, with square root for perceptual balance
    return Math.sqrt(currentArea / AnimationEngine.REFERENCE_AREA);
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.canvas || !this.ctx || !this.isRunning) return;

    // Use display dimensions (CSS pixels), not canvas buffer size
    const w = this.displayWidth || this.canvas.width / this.dpr;
    const h = this.displayHeight || this.canvas.height / this.dpr;
    const t = this.timeSystem.getTime();
    const loopDuration = this.timeSystem.getLoopDuration();
    const scale = this.getScaleFactor();

    // Clear canvas (using display dimensions since context is scaled)
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, w, h);

    // Render current mode with loop duration and scale factor for seamless looping
    this.currentMode.render(this.ctx, t, w, h, loopDuration, scale);

    // Continue the loop
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Start the animation
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timeSystem.resume();
    this.animate();
  }

  /**
   * Stop the animation
   */
  stop(): void {
    this.isRunning = false;
    this.timeSystem.pause();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Check if animation is running
   */
  isAnimating(): boolean {
    return this.isRunning;
  }

  /**
   * Resize the canvas
   * @param bufferWidth - Actual canvas buffer width (pixels)
   * @param bufferHeight - Actual canvas buffer height (pixels)
   * @param dpr - Device pixel ratio used
   */
  resize(bufferWidth: number, bufferHeight: number, dpr: number = 1): void {
    if (this.canvas) {
      this.canvas.width = bufferWidth;
      this.canvas.height = bufferHeight;
      this.dpr = dpr;
      // Store display dimensions for rendering calculations
      this.displayWidth = bufferWidth / dpr;
      this.displayHeight = bufferHeight / dpr;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
  }
}

// Re-export utilities for convenience
export { lerp, map, cycle, randomColor };

