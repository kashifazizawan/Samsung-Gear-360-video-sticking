import { LensCalibration } from '../types';

export const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 v_uv;
uniform sampler2D u_texture;

// Calibration parameters
uniform vec2 u_center1;
uniform float u_radius1;
uniform vec2 u_center2;
uniform float u_radius2;

uniform float u_fovRad;
uniform float u_blendWidthRad;

uniform vec3 u_rot1; // yaw, pitch, roll in radians
uniform vec3 u_rot2; // yaw, pitch, roll in radians

uniform float u_vignetteComp;
uniform float u_exposureMatch;

#define PI 3.1415926535897932384626433832795

// 3D rotation helper
vec3 rotateEuler(vec3 p, vec3 rot) {
  // Yaw (around Y)
  float cy = cos(rot.x);
  float sy = sin(rot.x);
  vec3 p1 = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  
  // Pitch (around X)
  float cp = cos(rot.y);
  float sp = sin(rot.y);
  vec3 p2 = vec3(p1.x, cp * p1.y - sp * p1.z, sp * p1.y + cp * p1.z);
  
  // Roll (around Z)
  float cr = cos(rot.z);
  float sr = sin(rot.z);
  return vec3(cr * p2.x - sr * p2.y, sr * p2.x + cr * p2.y, p2.z);
}

void main() {
  // Equirectangular mapping: v_uv.x -> longitude [-PI, PI], v_uv.y -> latitude [PI/2, -PI/2]
  float lon = (v_uv.x - 0.5) * 2.0 * PI;
  float lat = (0.5 - v_uv.y) * PI;

  // 3D unit ray on sphere
  float cosLat = cos(lat);
  vec3 ray = vec3(cosLat * sin(lon), sin(lat), cosLat * cos(lon));

  float maxTheta = u_fovRad * 0.5;

  // -------------------------------------------------------------
  // LENS 1 (Front Lens, nominal pointing at +Z, yaw = 0)
  // -------------------------------------------------------------
  vec3 ray1 = rotateEuler(ray, u_rot1);
  float theta1 = acos(clamp(ray1.z, -1.0, 1.0));
  float phi1 = atan(ray1.y, ray1.x);

  // Fisheye equidistant projection: r = theta / maxTheta
  float r1 = theta1 / maxTheta;
  vec2 uv1 = u_center1 + vec2(cos(phi1), sin(phi1)) * (r1 * u_radius1);
  
  // -------------------------------------------------------------
  // LENS 2 (Rear Lens, nominal pointing at -Z, yaw = 180 deg = PI)
  // -------------------------------------------------------------
  vec3 ray2 = rotateEuler(ray, u_rot2);
  float theta2 = acos(clamp(ray2.z, -1.0, 1.0));
  float phi2 = atan(ray2.y, ray2.x);

  float r2 = theta2 / maxTheta;
  vec2 uv2 = u_center2 + vec2(cos(phi2), sin(phi2)) * (r2 * u_radius2);

  // -------------------------------------------------------------
  // SEAM BLENDING & WEIGHTS
  // -------------------------------------------------------------
  float w1 = 0.0;
  float w2 = 0.0;

  if (theta1 < maxTheta && uv1.x >= 0.0 && uv1.x <= 0.5 && uv1.y >= 0.0 && uv1.y <= 1.0) {
    w1 = smoothstep(maxTheta, maxTheta - u_blendWidthRad, theta1);
  }
  
  if (theta2 < maxTheta && uv2.x >= 0.5 && uv2.x <= 1.0 && uv2.y >= 0.0 && uv2.y <= 1.0) {
    w2 = smoothstep(maxTheta, maxTheta - u_blendWidthRad, theta2);
  }

  float totalW = w1 + w2;

  if (totalW < 0.0001) {
    // Fallback if point is outside valid lens circles (edge margin)
    if (theta1 <= theta2) {
      vec4 col = texture2D(u_texture, clamp(uv1, vec2(0.0, 0.0), vec2(0.5, 1.0)));
      gl_FragColor = col;
    } else {
      vec4 col = texture2D(u_texture, clamp(uv2, vec2(0.5, 0.0), vec2(1.0, 1.0)));
      gl_FragColor = col;
    }
    return;
  }

  w1 /= totalW;
  w2 /= totalW;

  vec4 col1 = vec4(0.0);
  vec4 col2 = vec4(0.0);

  if (w1 > 0.0) {
    col1 = texture2D(u_texture, uv1);
    // Vignette compensation
    if (u_vignetteComp > 0.0) {
      float vig = 1.0 + u_vignetteComp * pow(r1, 2.5);
      col1.rgb = min(col1.rgb * vig, vec3(1.0));
    }
  }

  if (w2 > 0.0) {
    col2 = texture2D(u_texture, uv2);
    // Vignette compensation
    if (u_vignetteComp > 0.0) {
      float vig = 1.0 + u_vignetteComp * pow(r2, 2.5);
      col2.rgb = min(col2.rgb * vig, vec3(1.0));
    }
  }

  // Exposure leveling blend
  vec3 finalRgb = col1.rgb * w1 + col2.rgb * w2;

  gl_FragColor = vec4(finalRgb, 1.0);
}
`;

export class WebGLStitcherRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private positionBuffer: WebGLBuffer;

  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};

  constructor(width: number = 3840, height: number = 1920) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const gl = this.canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL not supported on this browser/device');
    }

    this.gl = gl;
    this.program = this.createProgram(VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);
    this.initBuffers();
    this.initTexture();
    this.cacheUniformLocations();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public resize(width: number, height: number) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const err = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${err}`);
    }
    return shader;
  }

  private createProgram(vertSrc: string, fragSrc: string): WebGLProgram {
    const vert = this.createShader(this.gl.VERTEX_SHADER, vertSrc);
    const frag = this.createShader(this.gl.FRAGMENT_SHADER, fragSrc);
    const prog = this.gl.createProgram()!;
    this.gl.attachShader(prog, vert);
    this.gl.attachShader(prog, frag);
    this.gl.linkProgram(prog);
    if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
      const err = this.gl.getProgramInfoLog(prog);
      throw new Error(`Program link error: ${err}`);
    }
    return prog;
  }

  private initBuffers() {
    const gl = this.gl;
    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    // Full screen quad (2 triangles)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
  }

  private initTexture() {
    const gl = this.gl;
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private cacheUniformLocations() {
    const gl = this.gl;
    const names = [
      'u_texture',
      'u_center1', 'u_radius1',
      'u_center2', 'u_radius2',
      'u_fovRad', 'u_blendWidthRad',
      'u_rot1', 'u_rot2',
      'u_vignetteComp', 'u_exposureMatch',
    ];
    for (const name of names) {
      this.uniformLocations[name] = gl.getUniformLocation(this.program, name);
    }
  }

  public renderFrame(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    calib: LensCalibration
  ) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);

    // Upload current frame texture to GPU
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    const deg2rad = Math.PI / 180;

    gl.uniform1i(this.uniformLocations['u_texture'], 0);
    gl.uniform2f(this.uniformLocations['u_center1'], calib.centerX1, calib.centerY1);
    gl.uniform1f(this.uniformLocations['u_radius1'], calib.radius1);
    gl.uniform2f(this.uniformLocations['u_center2'], calib.centerX2, calib.centerY2);
    gl.uniform1f(this.uniformLocations['u_radius2'], calib.radius2);

    gl.uniform1f(this.uniformLocations['u_fovRad'], calib.fov * deg2rad);
    gl.uniform1f(this.uniformLocations['u_blendWidthRad'], calib.blendWidth * deg2rad);

    gl.uniform3f(
      this.uniformLocations['u_rot1'],
      calib.yaw1 * deg2rad,
      calib.pitch1 * deg2rad,
      calib.roll1 * deg2rad
    );

    gl.uniform3f(
      this.uniformLocations['u_rot2'],
      calib.yaw2 * deg2rad,
      calib.pitch2 * deg2rad,
      calib.roll2 * deg2rad
    );

    gl.uniform1f(this.uniformLocations['u_vignetteComp'], calib.vignetteComp);
    gl.uniform1f(this.uniformLocations['u_exposureMatch'], calib.exposureMatch);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public destroy() {
    const gl = this.gl;
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.program) gl.deleteProgram(this.program);
  }
}
