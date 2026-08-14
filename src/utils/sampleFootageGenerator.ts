/**
 * Generates realistic Samsung Gear 360 (SM-C200) raw dual-lens footage.
 * Raw format consists of two circular 195° fisheye views side-by-side with black borders.
 */

export function generateSMC200SampleCanvas(
  timeSeconds = 0,
  width = 1920,
  height = 960
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill black background (typical for raw unstitched dual fisheye)
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, width, height);

  const radius = height * 0.476; // circular fisheye radius
  const c1x = width * 0.25;
  const c1y = height * 0.5;
  const c2x = width * 0.75;
  const c2y = height * 0.5;

  // Render Front Lens 1 (Circle Left)
  renderFisheyeLens(ctx, c1x, c1y, radius, 0, timeSeconds, 'FRONT LENS (SM-C200)');

  // Render Rear Lens 2 (Circle Right - 180 deg offset)
  renderFisheyeLens(ctx, c2x, c2y, radius, Math.PI, timeSeconds, 'REAR LENS (SM-C200)');

  return canvas;
}

function renderFisheyeLens(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  baseYaw: number,
  t: number,
  label: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  skyGrad.addColorStop(0, '#0f3b6c');
  skyGrad.addColorStop(0.45, '#3b82f6');
  skyGrad.addColorStop(0.55, '#f59e0b');
  skyGrad.addColorStop(0.7, '#10b981');
  skyGrad.addColorStop(1, '#064e3b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Horizon circle grid / mountains
  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.15, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Sun or bright landmark in one lens
  if (baseYaw === 0) {
    // Front lens: Blue sky, sun at upper-left
    const sunX = cx - r * 0.35 + Math.sin(t * 0.5) * 10;
    const sunY = cy - r * 0.45;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, r * 0.3);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, '#fef08a');
    sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Hot air balloon or architectural landmark
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    const bx = cx + Math.sin(t * 0.8) * 35;
    const by = cy - r * 0.25 + Math.cos(t * 0.5) * 15;
    ctx.arc(bx, by, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx - 4, by + 16, 8, 8);
  } else {
    // Rear lens: Sunset mountains and ocean horizon
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Sailboat on water
    const sx = cx + r * 0.25 - ((t * 20) % (r * 0.6));
    const sy = cy + r * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 18, sy);
    ctx.lineTo(sx + 12, sy + 7);
    ctx.lineTo(sx + 4, sy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy);
    ctx.lineTo(sx + 8, sy - 14);
    ctx.lineTo(sx + 16, sy - 3);
    ctx.closePath();
    ctx.fill();
  }

  // Compass markings / 360 grid ring for optical alignment testing
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
  ctx.stroke();

  // Draw 8 tick marks along the circumference (45 degree intervals)
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(angle) * (r * 0.88);
    const y1 = cy + Math.sin(angle) * (r * 0.88);
    const x2 = cx + Math.cos(angle) * (r * 0.95);
    const y2 = cy + Math.sin(angle) * (r * 0.95);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Label and timecode
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `600 ${Math.max(12, Math.floor(r * 0.08))}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + r * 0.78);

  const formattedTime = new Date(t * 1000).toISOString().substr(14, 5);
  ctx.font = `400 ${Math.max(10, Math.floor(r * 0.06))}px monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(`FOV: 195° | F2.0 | REC ${formattedTime}`, cx, cy + r * 0.86);

  ctx.restore();

  // Subtle circular lens rim border
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Creates a playable sample SM-C200 raw video blob dynamically (5 seconds loop)
 */
export async function createSMC200SampleVideoBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 960;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/mp4')
    ? 'video/mp4'
    : 'video/webm;codecs=vp9';

  const recorder = new MediaRecorder(stream, {
    mimeType: mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.start();

    let frame = 0;
    const totalFrames = 30 * 4; // 4 seconds sample
    const fps = 30;

    const interval = setInterval(() => {
      const t = frame / fps;
      const sample = generateSMC200SampleCanvas(t, 1920, 960);
      ctx.drawImage(sample, 0, 0);

      frame++;
      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000 / fps);
  });
}
