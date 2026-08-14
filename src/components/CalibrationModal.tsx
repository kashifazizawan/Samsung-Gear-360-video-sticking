import React, { useState } from 'react';
import { X, RotateCcw, Sliders, Check, Sparkles, HelpCircle } from 'lucide-react';
import { LensCalibration, DEFAULT_SMC200_CALIBRATION } from '../types';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibration: LensCalibration;
  onSaveCalibration: (calib: LensCalibration) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  calibration,
  onSaveCalibration,
}) => {
  const [localCalib, setLocalCalib] = useState<LensCalibration>(calibration);

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalCalib({ ...DEFAULT_SMC200_CALIBRATION });
  };

  const handleSave = () => {
    onSaveCalibration(localCalib);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">SM-C200 Optical Calibration</h3>
              <p className="text-xs text-zinc-400">
                Precision alignment for Samsung Gear 360 dual circular fisheye sensors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-6 text-xs">
          {/* Lens FOV & Seam Blending */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-zinc-200 font-bold">
              <span>Optics & Seam Transition</span>
              <span className="text-indigo-400 font-mono text-[11px]">FOV: {localCalib.fov}°</span>
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1.5">
                <span>Lens Field of View (FOV)</span>
                <span className="font-mono text-white">{localCalib.fov.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="180"
                max="210"
                step="0.5"
                value={localCalib.fov}
                onChange={(e) =>
                  setLocalCalib({ ...localCalib, fov: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1.5">
                <span>Seam Feathering / Blend Angle Width</span>
                <span className="font-mono text-white">{localCalib.blendWidth.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                step="0.5"
                value={localCalib.blendWidth}
                onChange={(e) =>
                  setLocalCalib({ ...localCalib, blendWidth: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Front Lens 1 Offset */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-zinc-200 font-bold">
              <span>Front Fisheye Circle (Lens 1)</span>
              <span className="text-blue-400 font-mono text-[11px]">Radius: {(localCalib.radius1 * 100).toFixed(1)}%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1.5">
                  <span>Center X</span>
                  <span className="font-mono text-white">{localCalib.centerX1.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.30"
                  step="0.001"
                  value={localCalib.centerX1}
                  onChange={(e) =>
                    setLocalCalib({ ...localCalib, centerX1: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1.5">
                  <span>Center Y</span>
                  <span className="font-mono text-white">{localCalib.centerY1.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.45"
                  max="0.55"
                  step="0.001"
                  value={localCalib.centerY1}
                  onChange={(e) =>
                    setLocalCalib({ ...localCalib, centerY1: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Rear Lens 2 Offset */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-zinc-200 font-bold">
              <span>Rear Fisheye Circle (Lens 2)</span>
              <span className="text-purple-400 font-mono text-[11px]">Radius: {(localCalib.radius2 * 100).toFixed(1)}%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1.5">
                  <span>Center X</span>
                  <span className="font-mono text-white">{localCalib.centerX2.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="0.80"
                  step="0.001"
                  value={localCalib.centerX2}
                  onChange={(e) =>
                    setLocalCalib({ ...localCalib, centerX2: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1.5">
                  <span>Center Y</span>
                  <span className="font-mono text-white">{localCalib.centerY2.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.45"
                  max="0.55"
                  step="0.001"
                  value={localCalib.centerY2}
                  onChange={(e) =>
                    setLocalCalib({ ...localCalib, centerY2: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Vignette & Exposure leveling */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-zinc-200 font-bold">
              <span>Sensor Edge Vignette & Light Compensation</span>
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1.5">
                <span>Vignette Edge Brightness Boost</span>
                <span className="font-mono text-white">{Math.round(localCalib.vignetteComp * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localCalib.vignetteComp}
                onChange={(e) =>
                  setLocalCalib({ ...localCalib, vignetteComp: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset SM-C200 Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Calibration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
