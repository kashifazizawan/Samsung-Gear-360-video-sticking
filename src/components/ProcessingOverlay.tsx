import React from 'react';
import { Loader2, Zap, Film, Cpu, Check, AlertCircle, XCircle } from 'lucide-react';
import { ProcessingProgress } from '../types';

interface ProcessingOverlayProps {
  progress: ProcessingProgress;
  onCancel: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, onCancel }) => {
  const getStatusTitle = () => {
    switch (progress.status) {
      case 'analyzing':
        return 'Analyzing SM-C200 Dual-Lens Track...';
      case 'stitching':
        return 'GPU Hardware-Accelerated 360 Stitching...';
      case 'injecting_metadata':
        return 'Injecting YouTube & Facebook 360 Metadata...';
      case 'saving':
        return 'Saving 360 Video to Gallery...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div
      id="processing-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        {/* Animated Progress Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="#27272a"
              strokeWidth="8"
            />
            {/* Progress Stroke */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="url(#progress-gradient)"
              strokeWidth="8"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * progress.percentage) / 100}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Percentage Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{progress.percentage}%</span>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              {progress.fps > 0 ? `${progress.fps} FPS` : 'STITCH'}
            </span>
          </div>
        </div>

        {/* Status Heading */}
        <h3 className="text-xl font-bold text-white mb-2">{getStatusTitle()}</h3>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          Unwarping dual 195° fisheye circles, smoothing seam boundaries, and creating equirectangular 2:1 projection.
        </p>

        {/* Processing Steps Pipeline Checklist */}
        <div className="w-full bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 mb-6 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-2">
              {progress.percentage >= 10 ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              <span>Load Dual Fisheye Frames</span>
            </div>
            <span className="text-zinc-500 font-mono">195° FOV</span>
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-2">
              {progress.percentage >= 90 ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : progress.status === 'stitching' ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-zinc-800" />
              )}
              <span>WebGL Seam Blending & Equirectangular Warp</span>
            </div>
            <span className="text-zinc-500 font-mono">
              {progress.currentFrame}/{progress.totalFrames || '...'}
            </span>
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-2">
              {progress.percentage >= 98 ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : progress.status === 'injecting_metadata' ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-zinc-800" />
              )}
              <span>Google GSpherical & Spatial 360 Injection</span>
            </div>
            <span className="text-zinc-500 font-mono">YouTube / FB Tag</span>
          </div>
        </div>

        {/* ETA & Cancel */}
        <div className="w-full flex items-center justify-between">
          <div className="text-left">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Estimated Time</div>
            <div className="text-xs font-mono font-medium text-zinc-300">
              {progress.etaSeconds > 0 ? `~${progress.etaSeconds}s remaining` : 'Almost finished...'}
            </div>
          </div>

          <button
            type="button"
            id="btn-cancel-processing"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
