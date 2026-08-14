import {
  LensCalibration,
  OutputResolution,
  ProcessingProgress,
  StitchedResult,
} from '../types';
import { WebGLStitcherRenderer } from './smc200Shader';
import { injectSpatial360Metadata } from './spatialMetadata';

export class VideoStitcherEngine {
  private renderer: WebGLStitcherRenderer | null = null;
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async processMedia(
    sourceFile: File | Blob,
    calib: LensCalibration,
    res: OutputResolution,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<StitchedResult> {
    this.isCancelled = false;

    const isImage =
      sourceFile.type.startsWith('image/') ||
      (sourceFile instanceof File && /\.(jpe?g|png|webp|bmp)$/i.test(sourceFile.name));

    if (isImage) {
      return this.processImage(sourceFile, calib, res, onProgress);
    } else {
      return this.processVideo(sourceFile, calib, res, onProgress);
    }
  }

  private async processImage(
    sourceFile: File | Blob,
    calib: LensCalibration,
    res: OutputResolution,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<StitchedResult> {
    onProgress({
      status: 'analyzing',
      percentage: 10,
      currentFrame: 1,
      totalFrames: 1,
      currentTime: 0,
      duration: 0,
      fps: 0,
      etaSeconds: 0,
    });

    const img = new Image();
    const objectUrl = URL.createObjectURL(sourceFile);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = objectUrl;
    });

    onProgress({
      status: 'stitching',
      percentage: 50,
      currentFrame: 1,
      totalFrames: 1,
      currentTime: 0,
      duration: 0,
      fps: 1,
      etaSeconds: 0,
    });

    const renderer = new WebGLStitcherRenderer(res.width, res.height);
    renderer.renderFrame(img, calib);
    const canvas = renderer.getCanvas();

    onProgress({
      status: 'injecting_metadata',
      percentage: 85,
      currentFrame: 1,
      totalFrames: 1,
      currentTime: 0,
      duration: 0,
      fps: 0,
      etaSeconds: 0,
    });

    const rawBlob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.96);
    });

    const finalBlob = await injectSpatial360Metadata(rawBlob, 'stitched_360.jpg');
    const finalUrl = URL.createObjectURL(finalBlob);

    URL.revokeObjectURL(objectUrl);
    renderer.destroy();

    const origName = sourceFile instanceof File ? sourceFile.name : 'gear360_photo.jpg';
    const baseName = origName.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_360_Stitched.jpg`;

    onProgress({
      status: 'completed',
      percentage: 100,
      currentFrame: 1,
      totalFrames: 1,
      currentTime: 0,
      duration: 0,
      fps: 0,
      etaSeconds: 0,
    });

    return {
      blob: finalBlob,
      url: finalUrl,
      filename,
      fileSize: finalBlob.size,
      duration: 0,
      width: res.width,
      height: res.height,
      metadataInjected: true,
      isVideo: false,
    };
  }

  private async processVideo(
    sourceFile: File | Blob,
    calib: LensCalibration,
    res: OutputResolution,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<StitchedResult> {
    onProgress({
      status: 'analyzing',
      percentage: 5,
      currentFrame: 0,
      totalFrames: 0,
      currentTime: 0,
      duration: 0,
      fps: 0,
      etaSeconds: 0,
    });

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const objectUrl = URL.createObjectURL(sourceFile);
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to decode input video metadata.'));
    });

    const duration = video.duration || 5;
    const targetFps = 30;
    const totalFrames = Math.max(1, Math.floor(duration * targetFps));

    // Initialize WebGL Stitcher
    this.renderer = new WebGLStitcherRenderer(res.width, res.height);
    const canvas = this.renderer.getCanvas();

    // Prepare audio track if available
    let audioStream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const sourceNode = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      sourceNode.connect(dest);
      audioStream = dest.stream;
    } catch {
      // Ignore audio capture fallback if unsupported in current sandbox
    }

    const canvasStream = canvas.captureStream(targetFps);
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      audioStream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
    }

    // Determine highest quality supported codec
    const mimeCandidates = [
      'video/mp4;codecs=avc1.4d002a',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];

    let selectedMime = 'video/webm';
    for (const m of mimeCandidates) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    const bitrate = res.width >= 3840 ? 24_000_000 : res.width >= 2560 ? 16_000_000 : 8_000_000;
    const recorder = new MediaRecorder(canvasStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: bitrate,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.start(100); // 100ms chunks

    // Render loop
    const startTime = performance.now();
    let currentFrame = 0;
    const frameInterval = 1 / targetFps;

    try {
      video.currentTime = 0;
      await new Promise<void>((r) => (video.onseeked = () => r()));

      while (currentFrame < totalFrames && !this.isCancelled) {
        const targetTime = currentFrame * frameInterval;
        video.currentTime = Math.min(targetTime, duration);

        await new Promise<void>((r) => {
          const timeout = setTimeout(r, 250);
          video.onseeked = () => {
            clearTimeout(timeout);
            r();
          };
        });

        // Render current video frame through WebGL 360 shader
        this.renderer.renderFrame(video, calib);

        currentFrame++;
        const elapsedSec = (performance.now() - startTime) / 1000;
        const currentFps = currentFrame / Math.max(0.1, elapsedSec);
        const remainingFrames = totalFrames - currentFrame;
        const eta = Math.ceil(remainingFrames / Math.max(1, currentFps));
        const percentage = Math.min(95, Math.floor((currentFrame / totalFrames) * 90) + 5);

        onProgress({
          status: 'stitching',
          percentage,
          currentFrame,
          totalFrames,
          currentTime: Math.min(targetTime, duration),
          duration,
          fps: Math.round(currentFps),
          etaSeconds: eta,
        });

        // Yield to maintain smooth responsive UI
        await new Promise((r) => setTimeout(r, 2));
      }

      if (this.isCancelled) {
        recorder.stop();
        throw new Error('Processing cancelled by user');
      }

      onProgress({
        status: 'injecting_metadata',
        percentage: 95,
        currentFrame: totalFrames,
        totalFrames,
        currentTime: duration,
        duration,
        fps: targetFps,
        etaSeconds: 1,
      });

      // Stop recording and gather blob
      const recordedBlob: Blob = await new Promise((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: selectedMime }));
        };
        recorder.stop();
      });

      // Inject YouTube & Facebook 360 Spatial Media metadata
      const origName = sourceFile instanceof File ? sourceFile.name : 'SM-C200_Raw_Video.mp4';
      const baseName = origName.replace(/\.[^/.]+$/, '');
      const isMp4 = selectedMime.includes('mp4');
      const ext = isMp4 ? 'mp4' : 'webm';
      const filename = `${baseName}_360_Equirectangular.${ext}`;

      const spatialBlob = await injectSpatial360Metadata(recordedBlob, filename);
      const finalUrl = URL.createObjectURL(spatialBlob);

      onProgress({
        status: 'completed',
        percentage: 100,
        currentFrame: totalFrames,
        totalFrames,
        currentTime: duration,
        duration,
        fps: targetFps,
        etaSeconds: 0,
      });

      return {
        blob: spatialBlob,
        url: finalUrl,
        filename,
        fileSize: spatialBlob.size,
        duration,
        width: res.width,
        height: res.height,
        metadataInjected: true,
        isVideo: true,
      };
    } finally {
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      URL.revokeObjectURL(objectUrl);
      if (this.renderer) {
        this.renderer.destroy();
        this.renderer = null;
      }
    }
  }
}
