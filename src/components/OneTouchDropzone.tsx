import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileVideo,
  Sparkles,
  Zap,
  Play,
  Film,
  CheckCircle2,
  Settings2,
  HardDrive,
  Info,
} from 'lucide-react';
import { ResolutionPreset, RESOLUTION_PRESETS, OutputResolution } from '../types';

interface OneTouchDropzoneProps {
  onFileSelected: (file: File | Blob, isSample?: boolean) => void;
  selectedFile: File | Blob | null;
  onStartProcessing: () => void;
  selectedResolution: ResolutionPreset;
  onResolutionChange: (res: ResolutionPreset) => void;
  autoSaveEnabled: boolean;
  onAutoSaveToggle: (enabled: boolean) => void;
  isLoadingSample: boolean;
  onLoadSample: () => void;
}

export const OneTouchDropzone: React.FC<OneTouchDropzoneProps> = ({
  onFileSelected,
  selectedFile,
  onStartProcessing,
  selectedResolution,
  onResolutionChange,
  autoSaveEnabled,
  onAutoSaveToggle,
  isLoadingSample,
  onLoadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  const fileName = selectedFile instanceof File ? selectedFile.name : selectedFile ? 'Sample_SM-C200_Raw_DualLens.mp4' : null;
  const fileSizeMb = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
      {/* Hero Banner / Quick Scope */}
      <div className="text-center max-w-2xl px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-semibold mb-3 shadow-inner">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Automated SM-C200 Equirectangular Transformation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          One-Touch 360° Video Stitching
        </h2>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Converts raw unstitched dual circular fisheye footage from Samsung Gear 360 (SM-C200) into seamless 360° VR videos with YouTube & Facebook spatial metadata.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        id="dropzone-smc200"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`w-full rounded-2xl p-6 sm:p-8 border-2 border-dashed transition-all duration-200 cursor-pointer text-center relative overflow-hidden ${
          isDragOver
            ? 'border-blue-500 bg-blue-950/20 scale-[1.01]'
            : selectedFile
            ? 'border-emerald-500/60 bg-zinc-900/90 shadow-xl'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/70 shadow-lg'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*,.mp4,.mov,.insv,.raw"
          className="hidden"
          onChange={handleInputChange}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-zinc-100 mb-1">
              Drag & Drop your Samsung SM-C200 raw video here
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mb-5">
              Supports raw dual-lens video/photos directly from your Gear 360 SD card (.MP4, .MOV, .INSV, .JPG)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                id="btn-browse-file"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                <span>Select Video File</span>
              </button>

              <button
                type="button"
                id="btn-load-sample"
                disabled={isLoadingSample}
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadSample();
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>{isLoadingSample ? 'Generating Sample...' : 'Try SM-C200 Demo Footage'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <FileVideo className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {fileName}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                  <span>{fileSizeMb} MB</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Dual-Lens SM-C200 Pattern Detected</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-change-file"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors shrink-0"
            >
              Choose Different File
            </button>
          </div>
        )}
      </div>

      {/* Settings Bar & Big 1-Touch Button */}
      <div className="w-full bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          {/* Resolution Selector */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Target 360 Output Resolution</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['4K', '2K', '1080p'] as ResolutionPreset[]).map((presetKey) => {
                const res = RESOLUTION_PRESETS[presetKey];
                const isSelected = selectedResolution === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    id={`btn-res-${presetKey.toLowerCase()}`}
                    onClick={() => onResolutionChange(presetKey)}
                    className={`px-3 py-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/50 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="text-xs font-bold">{presetKey}</div>
                    <div className="text-[10px] opacity-75">{res.width}×{res.height}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto Save Toggle */}
          <div className="flex items-center gap-3 self-end sm:self-center bg-zinc-950/60 px-3.5 py-2.5 rounded-xl border border-zinc-800">
            <input
              type="checkbox"
              id="chk-autosave"
              checked={autoSaveEnabled}
              onChange={(e) => onAutoSaveToggle(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-700 bg-zinc-900 cursor-pointer"
            />
            <label htmlFor="chk-autosave" className="text-xs font-medium text-zinc-300 cursor-pointer">
              Auto-save to Gallery / Downloads
            </label>
          </div>
        </div>

        {/* ONE TOUCH ACTION BUTTON */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            id="btn-one-touch-stitch"
            disabled={!selectedFile}
            onClick={onStartProcessing}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
              selectedFile
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:via-indigo-500 hover:to-emerald-400 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ring-2 ring-blue-400/40'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
            <span>⚡ ONE-TOUCH STITCH & EXPORT 360 VIDEO</span>
          </button>

          <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 text-center">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              Single-click auto-stitching, seamless 195° fisheye blending, and Google Spatial 360 metadata injection for instant YouTube & Facebook compatibility.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
