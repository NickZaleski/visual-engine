import { useRef, useEffect, useCallback } from 'react';
import { AnimationEngine } from '../visuals/engine';

interface VisualCanvasProps {
  modeId: string;
  loopDuration: number;
}

/**
 * Fullscreen canvas component for rendering visual modes
 * Automatically resizes to window and uses requestAnimationFrame
 */
export function VisualCanvas({ modeId, loopDuration }: VisualCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AnimationEngine | null>(null);
  const initializedRef = useRef(false);
  
  // Store latest props in refs for use in initialization
  const modeIdRef = useRef(modeId);
  const loopDurationRef = useRef(loopDuration);
  
  // Keep refs up to date
  useEffect(() => {
    modeIdRef.current = modeId;
  }, [modeId]);
  
  useEffect(() => {
    loopDurationRef.current = loopDuration;
  }, [loopDuration]);
  
  // Handle resize - works for any screen size including 8000px+
  const handleResize = useCallback(() => {
    if (canvasRef.current && engineRef.current) {
      // Cap DPR to prevent memory issues on huge displays
      // For 8000px screens, we don't need 2x DPR
      const rawDpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Dynamically adjust DPR based on screen size to prevent memory overflow
      // Above 4K, reduce DPR to keep canvas buffer reasonable
      const maxPixels = 16000000; // ~16MP max canvas buffer
      const targetPixels = width * height * rawDpr * rawDpr;
      const dpr = targetPixels > maxPixels 
        ? Math.sqrt(maxPixels / (width * height)) 
        : rawDpr;
      
      // Set display size
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      
      // Set actual size in memory (clamped for safety)
      const canvasWidth = Math.floor(width * dpr);
      const canvasHeight = Math.floor(height * dpr);
      
      // Reset canvas dimensions (this clears the canvas and resets transforms)
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;
      
      // Notify engine of the resize
      engineRef.current.resize(canvasWidth, canvasHeight, dpr);
      
      // Scale context for high-DPI displays
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Reset transform before scaling (important!)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    }
  }, []);
  
  // Initialize engine - only once on mount
  useEffect(() => {
    if (canvasRef.current && !initializedRef.current) {
      initializedRef.current = true;
      
      engineRef.current = new AnimationEngine(loopDurationRef.current);
      engineRef.current.init(canvasRef.current);
      engineRef.current.setMode(modeIdRef.current);
      handleResize();
      engineRef.current.start();
      
      // Add resize listener
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (engineRef.current) {
          engineRef.current.destroy();
          engineRef.current = null;
        }
        initializedRef.current = false;
      };
    }
  }, [handleResize]);
  
  // Update mode when modeId changes
  useEffect(() => {
    if (engineRef.current && initializedRef.current) {
      engineRef.current.setMode(modeId);
    }
  }, [modeId]);
  
  // Update loop duration when it changes
  useEffect(() => {
    if (engineRef.current && initializedRef.current) {
      engineRef.current.setLoopDuration(loopDuration);
    }
  }, [loopDuration]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        display: 'block',
        background: '#0a0a1a',
      }}
    />
  );
}
