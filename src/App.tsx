/**
 * Samsung SM-C200 Dual-Lens 360 Video Stitcher
 * One-touch automated stitching and YouTube / Facebook 360 spatial metadata injection
 */

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { OneTouchDropzone } from './components/OneTouchDropzone';
import { Interactive360Viewer } from './components/Interactive360Viewer';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { ExportSuccessCard } from './components/ExportSuccessCard';
import { CalibrationModal } from './components/CalibrationModal';
import { SocialUploadGuideModal } from './components/SocialUploadGuideModal';
import {
  LensCalibration,
  DEFAULT_SMC200_CALIBRATION,
  ResolutionPreset,
  RESOLUTION_PRESETS,
  ProcessingProgress,
  StitchedResult,
} from './types';
import { VideoStitcherEngine } from './utils/videoStitcherEngine';
import { createSMC200SampleVideoBlob } from './utils/sampleFootageGenerator';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionPreset>('2K');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [calibration, setCalibration] = useState<LensCalibration>(DEFAULT_SMC200_CALIBRATION);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    status: 'idle',
    percentage: 0,
    currentFrame: 0,
    totalFrames: 0,
    currentTime: 0,
    duration: 0,
    fps: 0,
    etaSeconds: 0,
  });

  const [stitchedResult, setStitchedResult] = useState<StitchedResult | null>(null);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);

  const engineRef = useRef<VideoStitcherEngine | null>(null);

  const handleFileSelected = (file: File | Blob) => {
    setSelectedFile(file);
    setStitchedResult(null);
  };

  const handleLoadSample = async () => {
    try {
      setIsLoadingSample(true);
      const sampleBlob = await createSMC200SampleVideoBlob();
      setSelectedFile(sampleBlob);
      setStitchedResult(null);
    } catch (err) {
      console.error('Failed to generate SM-C200 sample:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const triggerDownload = (result: StitchedResult) => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const engine = new VideoStitcherEngine();
    engineRef.current = engine;

    try {
      const targetRes = RESOLUTION_PRESETS[selectedResolution];
      const result = await engine.processMedia(
        selectedFile,
        calibration,
        targetRes,
        (p) => setProgress(p)
      );

      setStitchedResult(result);
      setIsProcessing(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }

      // Auto-save to gallery / downloads if enabled (one-touch promise)
      if (autoSaveEnabled) {
        triggerDownload(result);
      }
    } catch (err: unknown) {
      console.error('Stitching error:', err);
      setIsProcessing(false);
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Unknown error during stitching',
      }));
    }
  };

  const handleCancelProcessing = () => {
    if (engineRef.current) {
      engineRef.current.cancel();
      engineRef.current = null;
    }
    setIsProcessing(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStitchedResult(null);
    setProgress({
      status: 'idle',
      percentage: 0,
      currentFrame: 0,
      totalFrames: 0,
      currentTime: 0,
      duration: 0,
      fps: 0,
      etaSeconds: 0,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Top Navigation */}
      <Header
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main App Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8">
        {!stitchedResult ? (
          /* One-Touch Upload & Stitch Interface */
          <OneTouchDropzone
            onFileSelected={handleFileSelected}
            selectedFile={selectedFile}
            onStartProcessing={handleStartProcessing}
            selectedResolution={selectedResolution}
            onResolutionChange={setSelectedResolution}
            autoSaveEnabled={autoSaveEnabled}
            onAutoSaveToggle={setAutoSaveEnabled}
            isLoadingSample={isLoadingSample}
            onLoadSample={handleLoadSample}
          />
        ) : (
          /* Stitched Output & Interactive 360 Viewer */
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Interactive 360 VR Player */}
            <Interactive360Viewer
              mediaUrl={stitchedResult.url}
              isVideo={stitchedResult.isVideo}
            />

            {/* Saved Confirmation & Social Upload Direct Launchers */}
            <ExportSuccessCard
              result={stitchedResult}
              onDownloadAgain={() => triggerDownload(stitchedResult)}
              onReset={handleReset}
            />
          </div>
        )}
      </main>

      {/* Processing Modal Overlay */}
      {isProcessing && (
        <ProcessingOverlay
          progress={progress}
          onCancel={handleCancelProcessing}
        />
      )}

      {/* Calibration Fine Tuning Drawer/Modal */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        calibration={calibration}
        onSaveCalibration={setCalibration}
      />

      {/* YouTube & Facebook Social Guide */}
      <SocialUploadGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-400">
        <p>
          Samsung Gear 360 (SM-C200) Dual-Lens Stitcher • Google Spatial Media 360 Compatible
        </p>
      </footer>
    </div>
  );
}
