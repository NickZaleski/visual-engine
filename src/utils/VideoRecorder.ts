import { getVisualMode } from '../visuals/engine';

export interface VideoRecorderOptions {
  width: number;
  height: number;
  fps: number;
  duration: number; // in seconds
  modeId: string;
  onProgress?: (progress: number) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

/**
 * Records a visual mode to a video file
 */
export class VideoRecorder {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;
  private animationFrameId: number | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
  }

  /**
   * Start recording a video
   */
  async record(options: VideoRecorderOptions): Promise<void> {
    const { width, height, fps, duration, modeId, onProgress, onComplete, onError } = options;

    if (this.isRecording) {
      onError?.(new Error('Already recording'));
      return;
    }

    // Get the visual mode
    const mode = getVisualMode(modeId);
    if (!mode) {
      onError?.(new Error(`Visual mode "${modeId}" not found`));
      return;
    }

    // Set up canvas
    this.canvas.width = width;
    this.canvas.height = height;
    this.chunks = [];
    this.isRecording = true;

    // Get supported MIME type - prefer MP4
    const { mimeType, extension } = this.getSupportedFormat();
    if (!mimeType) {
      onError?.(new Error('No supported video format found'));
      return;
    }

    try {
      // Create media stream from canvas
      const stream = this.canvas.captureStream(fps);
      
      // Create media recorder with high quality settings
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 12000000, // 12 Mbps for high quality
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mimeType });
        // Pass the extension for proper file naming
        (blob as any).__extension = extension;
        onComplete?.(blob);
        this.cleanup();
      };

      this.mediaRecorder.onerror = (e) => {
        onError?.(new Error(`Recording error: ${e}`));
        this.cleanup();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

      // Render frames
      const totalFrames = Math.ceil(duration * fps);
      const frameDuration = 1000 / fps;
      let frameCount = 0;
      const startTime = performance.now();

      const renderFrame = () => {
        if (!this.isRecording || frameCount >= totalFrames) {
          this.stop();
          return;
        }

        // Calculate time for this frame (simulated time based on frame count)
        // Time goes from 0 to duration (exclusive of duration to avoid duplicate frame)
        const simulatedTime = (frameCount / fps);

        // Clear and render with loop duration for seamless looping
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, width, height);
        mode.render(this.ctx, simulatedTime, width, height, duration);

        frameCount++;
        onProgress?.(frameCount / totalFrames);

        // Schedule next frame
        const elapsed = performance.now() - startTime;
        const expectedTime = frameCount * frameDuration;
        const delay = Math.max(0, expectedTime - elapsed);

        if (this.isRecording) {
          setTimeout(() => {
            this.animationFrameId = requestAnimationFrame(renderFrame);
          }, delay);
        }
      };

      // Start rendering
      this.animationFrameId = requestAnimationFrame(renderFrame);
    } catch (error) {
      onError?.(error as Error);
      this.cleanup();
    }
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
  }

  /**
   * Cancel recording
   */
  cancel(): void {
    this.isRecording = false;
    this.cleanup();
  }

  /**
   * Get recording status
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  /**
   * Get the best supported format - prefer MP4
   */
  private getSupportedFormat(): { mimeType: string | null; extension: string } {
    // Prefer MP4 for better compatibility
    const formats = [
      { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
      { mime: 'video/mp4;codecs=h264', ext: 'mp4' },
      { mime: 'video/mp4', ext: 'mp4' },
      { mime: 'video/webm;codecs=h264', ext: 'webm' },
      { mime: 'video/webm;codecs=vp9', ext: 'webm' },
      { mime: 'video/webm;codecs=vp8', ext: 'webm' },
      { mime: 'video/webm', ext: 'webm' },
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format.mime)) {
        return { mimeType: format.mime, extension: format.ext };
      }
    }

    return { mimeType: null, extension: 'webm' };
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get the file extension from a blob
 */
export function getBlobExtension(blob: Blob): string {
  return (blob as any).__extension || 'webm';
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
