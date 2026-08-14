import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Compass,
  Layers,
  Eye,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface Interactive360ViewerProps {
  mediaUrl: string;
  isVideo: boolean;
  onSaveSnapshot?: (dataUrl: string) => void;
}

export const Interactive360Viewer: React.FC<Interactive360ViewerProps> = ({
  mediaUrl,
  isVideo,
  onSaveSnapshot,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [viewMode, setViewMode] = useState<'spherical' | 'flat' | 'vrSplit'>('spherical');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [gyroActive, setGyroActive] = useState<boolean>(false);
  const [fov, setFov] = useState<number>(75);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);

  // Interactive rotation state
  const isUserInteracting = useRef<boolean>(false);
  const onPointerDownPointerX = useRef<number>(0);
  const onPointerDownPointerY = useRef<number>(0);
  const onPointerDownLon = useRef<number>(0);
  const onPointerDownLat = useRef<number>(0);
  const lon = useRef<number>(0);
  const lat = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current || viewMode === 'flat') return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 1100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Texture & Sphere
    let texture: THREE.Texture;
    if (isVideo) {
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = isMuted;
      video.playsInline = true;
      video.play().catch(() => {});
      videoRef.current = video;

      texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
    } else {
      const loader = new THREE.TextureLoader();
      texture = loader.load(mediaUrl);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
    textureRef.current = texture;

    // Sphere geometry (inverted normals for inside-out 360 view)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    sphereMeshRef.current = mesh;

    // Event listeners for dragging
    const onMouseDown = (event: MouseEvent) => {
      isUserInteracting.current = true;
      onPointerDownPointerX.current = event.clientX;
      onPointerDownPointerY.current = event.clientY;
      onPointerDownLon.current = lon.current;
      onPointerDownLat.current = lat.current;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isUserInteracting.current) return;
      lon.current = (onPointerDownPointerX.current - event.clientX) * 0.18 + onPointerDownLon.current;
      lat.current = (event.clientY - onPointerDownPointerY.current) * 0.18 + onPointerDownLat.current;
    };

    const onMouseUp = () => {
      isUserInteracting.current = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isUserInteracting.current = true;
        onPointerDownPointerX.current = event.touches[0].pageX;
        onPointerDownPointerY.current = event.touches[0].pageY;
        onPointerDownLon.current = lon.current;
        onPointerDownLat.current = lat.current;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isUserInteracting.current && event.touches.length === 1) {
        lon.current = (onPointerDownPointerX.current - event.touches[0].pageX) * 0.22 + onPointerDownLon.current;
        lat.current = (event.touches[0].pageY - onPointerDownPointerY.current) * 0.22 + onPointerDownLat.current;
      }
    };

    const onTouchEnd = () => {
      isUserInteracting.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setFov((prev) => {
        const next = Math.max(30, Math.min(110, prev + event.deltaY * 0.05));
        if (cameraRef.current) {
          cameraRef.current.fov = next;
          cameraRef.current.updateProjectionMatrix();
        }
        return next;
      });
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      lat.current = Math.max(-85, Math.min(85, lat.current));
      const phi = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);

      if (viewMode === 'vrSplit') {
        // VR Stereo Split Screen
        const fullW = container.clientWidth;
        const fullH = container.clientHeight;
        const halfW = fullW / 2;

        renderer.setScissorTest(true);

        // Left eye
        renderer.setScissor(0, 0, halfW, fullH);
        renderer.setViewport(0, 0, halfW, fullH);
        camera.aspect = halfW / fullH;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        // Right eye
        renderer.setScissor(halfW, 0, halfW, fullH);
        renderer.setViewport(halfW, 0, halfW, fullH);
        camera.aspect = halfW / fullH;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        renderer.setScissorTest(false);
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      domElement.removeEventListener('wheel', onWheel);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current = null;
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [mediaUrl, isVideo, viewMode]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const resetOrientation = () => {
    lon.current = 0;
    lat.current = 0;
    setFov(75);
    if (cameraRef.current) {
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.parentElement?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div id="interactive-360-viewer-card" className="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl">
      {/* Top Overlay Badge & Quick Mode Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700/60 shadow-lg text-xs font-medium text-zinc-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive 360° Stitched Sphere</span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-700/60 shadow-lg pointer-events-auto">
          <button
            id="btn-mode-spherical"
            onClick={() => setViewMode('spherical')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'spherical'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            360° Sphere
          </button>
          <button
            id="btn-mode-vr"
            onClick={() => setViewMode('vrSplit')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'vrSplit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 inline mr-1" />
            VR Headset
          </button>
          <button
            id="btn-mode-flat"
            onClick={() => setViewMode('flat')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'flat'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            2:1 Flat Map
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {viewMode === 'flat' ? (
        <div className="w-full h-[420px] sm:h-[480px] bg-zinc-950 flex items-center justify-center p-2">
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              loop
              className="max-h-full max-w-full rounded-lg object-contain shadow-lg border border-zinc-800"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Stitched 360 Flat"
              className="max-h-full max-w-full rounded-lg object-contain shadow-lg border border-zinc-800"
            />
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full h-[420px] sm:h-[480px] cursor-grab active:cursor-grabbing bg-black select-none touch-none"
        />
      )}

      {/* Interactive Helper Overlay (Fades out when dragged) */}
      {viewMode !== 'flat' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none bg-zinc-900/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-zinc-700/50 text-[11px] text-zinc-300 shadow">
          Drag to look around 360° • Scroll / pinch to zoom
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-700/60 shadow-lg text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          {isVideo && (
            <>
              <button
                id="btn-toggle-play"
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                id="btn-toggle-mute"
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          )}

          <button
            id="btn-reset-view"
            onClick={resetOrientation}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            title="Reset to center viewpoint"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Center Horizon</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-zinc-400 font-mono text-[11px]">FOV {Math.round(fov)}°</span>
          <button
            id="btn-fullscreen-toggle"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
