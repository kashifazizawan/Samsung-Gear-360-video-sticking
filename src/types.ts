export interface LensCalibration {
  centerX1: number; // Front lens center X (0..1)
  centerY1: number; // Front lens center Y (0..1)
  radius1: number;   // Front lens circle radius (0..1)
  
  centerX2: number; // Rear lens center X (0..1)
  centerY2: number; // Rear lens center Y (0..1)
  radius2: number;   // Rear lens circle radius (0..1)
  
  fov: number;       // Field of view in degrees (typically 195° for SM-C200)
  blendWidth: number;// Seam transition angle width in degrees (e.g. 15°)
  yaw1: number;      // Front lens yaw trim (-180..180)
  pitch1: number;    // Front lens pitch trim (-90..90)
  roll1: number;     // Front lens roll trim (-180..180)
  yaw2: number;      // Rear lens yaw trim (-180..180)
  pitch2: number;    // Rear lens pitch trim (-90..90)
  roll2: number;     // Rear lens roll trim (-180..180)
  
  exposureMatch: number; // 0..1 color/exposure smoothing across seam
  vignetteComp: number;  // 0..1 edge vignette compensation
}

export const DEFAULT_SMC200_CALIBRATION: LensCalibration = {
  centerX1: 0.25,
  centerY1: 0.50,
  radius1: 0.238,

  centerX2: 0.75,
  centerY2: 0.50,
  radius2: 0.238,

  fov: 195.0,
  blendWidth: 14.0,
  yaw1: 0.0,
  pitch1: 0.0,
  roll1: 0.0,
  yaw2: 180.0,
  pitch2: 0.0,
  roll2: 0.0,

  exposureMatch: 0.5,
  vignetteComp: 0.4,
};

export type ResolutionPreset = '4K' | '2K' | '1080p' | 'original';

export interface OutputResolution {
  name: ResolutionPreset;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const RESOLUTION_PRESETS: Record<ResolutionPreset, OutputResolution> = {
  '4K': {
    name: '4K',
    label: '4K Ultra HD (3840 × 1920)',
    width: 3840,
    height: 1920,
    description: 'Recommended for YouTube 360 & VR Headsets',
  },
  '2K': {
    name: '2K',
    label: '2K Quad HD (2560 × 1280)',
    width: 2560,
    height: 1280,
    description: 'Fast processing, high quality for Facebook 360',
  },
  '1080p': {
    name: '1080p',
    label: 'Full HD (1920 × 960)',
    width: 1920,
    height: 960,
    description: 'Lightweight & instant mobile sharing',
  },
  'original': {
    name: 'original',
    label: 'Source Aspect Ratio (Auto 2:1)',
    width: 3840,
    height: 1920,
    description: 'Matches raw camera dimension resolution',
  },
};

export type ProcessingStatus = 'idle' | 'analyzing' | 'stitching' | 'injecting_metadata' | 'saving' | 'completed' | 'error';

export interface ProcessingProgress {
  status: ProcessingStatus;
  percentage: number;
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  duration: number;
  fps: number;
  etaSeconds: number;
  errorMessage?: string;
}

export interface StitchedResult {
  blob: Blob;
  url: string;
  filename: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;
  metadataInjected: boolean;
  isVideo: boolean;
}
