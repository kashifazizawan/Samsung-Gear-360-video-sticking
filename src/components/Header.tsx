import React from 'react';
import { Camera, HelpCircle, Sliders, Sparkles, Youtube, Facebook } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  onOpenCalibration: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide, onOpenCalibration }) => {
  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Model */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Gear 360 Stitcher
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/60 text-[10px] font-semibold uppercase tracking-wider">
                SM-C200 Auto
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-normal">
              One-touch dual-lens stitch & social 360 metadata injector
            </p>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-open-calibration"
            onClick={onOpenCalibration}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
            title="Fine-tune optical lens parameters"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Calibration</span>
          </button>

          <button
            id="btn-open-social-guide"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-xs font-medium text-blue-300 hover:text-blue-100 transition-all shadow-sm"
            title="YouTube & Facebook 360 Upload Guidelines"
          >
            <div className="flex items-center gap-1">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <Facebook className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="hidden md:inline">Social 360 Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
