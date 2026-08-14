import React from 'react';
import {
  CheckCircle,
  Download,
  Share2,
  Youtube,
  Facebook,
  Sparkles,
  ArrowRight,
  FolderDown,
  RotateCcw,
  FileCheck,
  Globe,
} from 'lucide-react';
import { StitchedResult } from '../types';

interface ExportSuccessCardProps {
  result: StitchedResult;
  onDownloadAgain: () => void;
  onReset: () => void;
}

export const ExportSuccessCard: React.FC<ExportSuccessCardProps> = ({
  result,
  onDownloadAgain,
  onReset,
}) => {
  const sizeMb = (result.fileSize / (1024 * 1024)).toFixed(2);

  return (
    <div id="export-success-card" className="w-full bg-zinc-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                360° Video Stitched & Saved!
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                Ready for Social
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Saved to your Downloads & Gallery • Spatial 360 metadata injected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            id="btn-download-again"
            onClick={onDownloadAgain}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Save to Device</span>
          </button>

          <button
            type="button"
            id="btn-stitch-another"
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Stitch New File</span>
          </button>
        </div>
      </div>

      {/* Metadata & Technical Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 text-left">
          <div className="text-[10px] uppercase font-semibold text-zinc-400">Projection</div>
          <div className="text-xs sm:text-sm font-bold text-zinc-100 mt-1">2:1 Equirectangular</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">360° × 180° Full Sphere</div>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 text-left">
          <div className="text-[10px] uppercase font-semibold text-zinc-400">Resolution</div>
          <div className="text-xs sm:text-sm font-bold text-zinc-100 mt-1">
            {result.width} × {result.height}
          </div>
          <div className="text-[10px] text-blue-400 font-mono mt-0.5">
            {result.width >= 3840 ? '4K Ultra HD' : result.width >= 2560 ? '2K Quad HD' : 'Full HD'}
          </div>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 text-left">
          <div className="text-[10px] uppercase font-semibold text-zinc-400">File Size</div>
          <div className="text-xs sm:text-sm font-bold text-zinc-100 mt-1">{sizeMb} MB</div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{result.filename}</div>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 text-left">
          <div className="text-[10px] uppercase font-semibold text-zinc-400">Spatial 360 Box</div>
          <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5" />
            <span>GSpherical Injected</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">YouTube / FB Auto-Detect</div>
        </div>
      </div>

      {/* Instant Social Upload Direct Launchers */}
      <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-zinc-100">
              Direct Upload to Social Media 360
            </h4>
          </div>
          <span className="text-[11px] text-zinc-400">Optimized 360 format</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* YouTube 360 Button */}
          <a
            id="link-upload-youtube"
            href="https://studio.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-zinc-200 hover:text-white transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow">
                <Youtube className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-red-200">
                  Upload to YouTube 360
                </div>
                <div className="text-[10px] text-zinc-400">
                  Plays in 4K 360 VR with gyro navigation
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
          </a>

          {/* Facebook 360 Button */}
          <a
            id="link-upload-facebook"
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-zinc-200 hover:text-white transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-blue-200">
                  Upload to Facebook 360
                </div>
                <div className="text-[10px] text-zinc-400">
                  Interactive newsfeed sphere & Quest VR
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};
