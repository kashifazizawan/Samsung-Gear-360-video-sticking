import React from 'react';
import { X, Youtube, Facebook, Glasses, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

interface SocialUploadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialUploadGuideModal: React.FC<SocialUploadGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center text-white">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">YouTube & Facebook 360 Publishing</h3>
              <p className="text-xs text-zinc-400">
                How our injected spatial metadata enables automatic 360 VR playback
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

        {/* Content */}
        <div className="space-y-4 text-xs">
          {/* YouTube Guide */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <Youtube className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-zinc-100">Publishing to YouTube 360</h4>
              </div>
              <a
                href="https://studio.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
              >
                <span>YouTube Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-2 text-zinc-300 list-decimal list-inside leading-relaxed">
              <li>
                <span className="font-semibold text-white">Upload as standard video:</span> Drag your stitched file directly into YouTube Studio.
              </li>
              <li>
                <span className="font-semibold text-white">Automatic 360 Detection:</span> YouTube automatically reads the embedded <code className="text-emerald-400 font-mono bg-zinc-900 px-1 py-0.5 rounded">GSpherical:Spherical=true</code> metadata box.
              </li>
              <li>
                <span className="font-semibold text-white">Processing Time:</span> Standard 2D versions process first; 360 VR pan-and-tilt controls activate 5–15 minutes after upload.
              </li>
            </ol>
          </div>

          {/* Facebook Guide */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Facebook className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-zinc-100">Publishing to Facebook 360</h4>
              </div>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Facebook Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-2 text-zinc-300 list-decimal list-inside leading-relaxed">
              <li>
                <span className="font-semibold text-white">Create a Post:</span> Select your stitched 360 MP4 / JPG file.
              </li>
              <li>
                <span className="font-semibold text-white">360 Controls Tab:</span> Facebook displays a 360 indicator and lets you pick the initial default viewing angle.
              </li>
              <li>
                <span className="font-semibold text-white">Mobile & Feed Gyro:</span> Followers can rotate their smartphone or drag to look in any direction.
              </li>
            </ol>
          </div>

          {/* VR Headsets */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                <Glasses className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-zinc-100">Meta Quest & VR Headset Direct Playback</h4>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              You can also copy the stitched MP4 directly to your Meta Quest / Pico VR headset via USB-C (or Google Drive / Dropbox) and open it in the built-in VR Media Gallery for full spherical immersion.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            Got it, Let&apos;s Stitch!
          </button>
        </div>
      </div>
    </div>
  );
};
