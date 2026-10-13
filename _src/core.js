/* ════════════════════════════════════════════════════════════════════════
   Sirpeltric · BG reference engine (shared by all six backgrounds)
   - FLAT 2D fills (Chiikawa / Kirby: one colour per shape, per-object depth tint, banded sky) + drawn edge lines;
     optional single cel shadow or the old 3D toon look; flat details as ink lines
   - every object belongs to an ELEMENT (city, trees, hills…) → exported as its own PNG
   - era grading + red wave / rotating wave / colour bleed / crack transitions
   - export: one long panorama of the shot (or a single 4K frame), colour · lineart · base colour,
     and a ZIP with one PNG per element per pass (holdout: stacking them rebuilds the full image)
   ════════════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.4/dist/tweakpane.min.js';   // floating config menu (as in jh3y's pen zxOJdEe)
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
// GLTFExporter + JSZip are loaded on demand (only when exporting) so the page opens light
const loadGLTF = () => import('three/addons/exporters/GLTFExporter.js').then(m => m.GLTFExporter);
const loadSTL = () => import('three/addons/exporters/STLExporter.js').then(m => m.STLExporter);
let zipLoading = null;
const loadZip = () => window.JSZip ? Promise.resolve() : (zipLoading ||= new Promise((res, rej) => {
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  s.onload = res; s.onerror = () => { zipLoading = null; rej(new Error('JSZip did not load (offline?)')); }; document.head.appendChild(s); }));

/* ── Era looks (palettes copied from the board) ─────────────────────────── */
const ERAS = {
  base:   { label: 'Base · kawaii',            pal: null, map: 0, sat: 1.04, tint: [1, 1, 1], grain: 0, vig: 0, bw: 0, post: 0, glow: 0, flick: 0, haze: [1, 1, 1, 0], paper: 0 },
  e1945:  { label: '1945 · B&W wartime',       pal: ['#111111', '#3A3A3A', '#6E6E6E', '#A8A8A8', '#E8E4DA'], map: 0.82, sat: 0, tint: [1, 1, 1], grain: 0.085, vig: 0.62, bw: 1, post: 0, glow: 0, flick: 0.07, haze: [0.9, 0.9, 0.88, 0.05], paper: 0.25 },
  e1950:  { label: '1950s · first colour',     pal: ['#2F4A5C', '#6E9C9A', '#D9C7A0', '#C0704B', '#F2E6CF'], map: 0.5, sat: 0.78, tint: [1.02, 1.0, 0.95], grain: 0.025, vig: 0.28, bw: 0, post: 0, glow: 0, flick: 0, haze: [0.95, 0.9, 0.8, 0.08], paper: 0.6 },
  e1960:  { label: '1960s · TV graphic',       pal: ['#1F3A68', '#3E7CB1', '#F2C14E', '#D94A38', '#F4F1E8'], map: 0.55, sat: 1.25, tint: [1, 1, 1], grain: 0, vig: 0.1, bw: 0, post: 5, glow: 0, flick: 0, haze: [1, 1, 1, 0], paper: 0.1 },
  e1970:  { label: '1970s · warm cel',         pal: ['#4B3B2A', '#7A8B3C', '#C98B3A', '#D9B98A', '#5B8DB8'], map: 0.42, sat: 0.82, tint: [1.07, 1.0, 0.86], grain: 0.065, vig: 0.32, bw: 0, post: 0, glow: 0, flick: 0.015, haze: [0.95, 0.85, 0.65, 0.07], paper: 0.45 },
  e1980:  { label: '1980s · saturated OVA',    pal: ['#1B1446', '#5B2A86', '#E94F8A', '#F29E4C', '#7ED3E6'], map: 0.34, sat: 1.38, tint: [1.02, 0.97, 1.06], grain: 0.02, vig: 0.24, bw: 0, post: 0, glow: 0.6, flick: 0, haze: [0.9, 0.5, 0.8, 0.05], paper: 0 },
  e1990:  { label: '1990s · late cel',         pal: ['#1E2A30', '#3F6E73', '#8FB3A8', '#D8C9A3', '#B04A3A'], map: 0.4, sat: 0.8, tint: [0.92, 1.0, 1.04], grain: 0.04, vig: 0.22, bw: 0, post: 0, glow: 0.12, flick: 0, haze: [0.55, 0.78, 0.78, 0.13], paper: 0 },
  colour: { label: 'Full colour · painterly',  pal: ['#2E5E3A', '#6BA368', '#F2D17B', '#4F8FC0', '#F6EFE0'], map: 0.16, sat: 1.12, tint: [1.02, 1.0, 0.97], grain: 0.012, vig: 0.16, bw: 0, post: 0, glow: 0.08, flick: 0, haze: [1, 0.97, 0.9, 0.03], paper: 0.35 },
  warp:   { label: 'Grey warp (end)',          pal: ['#111111', '#3A3A3A', '#6E6E6E', '#A8A8A8', '#E8E4DA'], map: 0.9, sat: 0, tint: [1, 1, 1], grain: 0.05, vig: 0.55, bw: 1, post: 0, glow: 0, flick: 0.04, haze: [0.5, 0.5, 0.5, 0.06], paper: 0 },
};
const ERA_KEYS = Object.keys(ERAS);
const TRANS = { none: 0, wave: 1, radial: 2, fade: 3, crack: 4 };
const INK = '#8A6B64';          // ink colour from the team's own city test (convert mp4 to threejs.html)
const INK_DARK = '#5A3A30';
const EXPORT_W = 3840, EXPORT_H = 2160, MAX_SIDE = 32000;
/** phones / tablets: lighter shapes, pixel ratio ≤ 1.5, no MSAA (the look stays the same, the GPU load drops a lot) */
const MOBILE = (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches) || Math.min(screen.width, screen.height) < 600;
const SEG = MOBILE ? { s: [20, 12], lo: [10, 7], cap: [3, 10], rb: 2, rbs: 3, lathe: 18, cone: 14, tor: [8, 32], disc: 32, half: [20, 8] }
                   : { s: [28, 18], lo: [14, 10], cap: [6, 14], rb: 4, rbs: 5, lathe: 28, cone: 24, tor: [12, 48], disc: 48, half: [28, 14] };

/* ── colour helpers (sRGB, same maths as the shader) ────────────────────── */
const hexToRgb = h => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const rgbToHex = c => '#' + c.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
function mapColour(hex, eraKey) {
  const e = ERAS[eraKey] || ERAS.base;
  let c = hexToRgb(hex);
  const L = c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
  c = c.map(v => L + (v - L) * e.sat).map((v, i) => v * e.tint[i]);
  if (e.post > 1.5) c = c.map(v => Math.floor(v * e.post + 0.5) / e.post);
  if (e.pal && e.map > 0) {
    const pal = e.pal.map(hexToRgb); let best;
    if (e.bw) {
      const L2 = Math.min(1, Math.max(0, c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114)) * 4, i0 = Math.min(3, Math.floor(L2)), f = L2 - i0, s = f < 0.35 ? 0 : f > 0.65 ? 1 : (f - 0.35) / 0.3;
      best = pal[i0].map((v, i) => v + (pal[i0 + 1][i] - v) * s); const Lc = c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114; c = [Lc, Lc, Lc];
    } else { let bd = 1e9; for (const p of pal) { const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2; if (d < bd) { bd = d; best = p; } } }
    c = c.map((v, i) => v + (best[i] - v) * e.map);
  }
  return rgbToHex(c.map((v, i) => v + (e.haze[i] - v) * e.haze[3]));
}

/* ── shaders ────────────────────────────────────────────────────────────── */
const HULL_VS = /* glsl */`
  uniform float uWidth; varying float vDepth;
  void main() {
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = modelMatrix * instanceMatrix;
    #endif
    vec4 wp = m * vec4(position, 1.0);
    vec4 vp = viewMatrix * wp;
    vec3 vn = normalize(mat3(viewMatrix) * normalize(mat3(m) * normal));
    float d = max(-vp.z, 0.001);
    vp.xyz += vn * uWidth * d; vDepth = d;
    gl_Position = projectionMatrix * vp;
  }`;
const HULL_FS = /* glsl */`
  uniform vec3 uColor; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uFogOn; varying float vDepth;
  void main() { gl_FragColor = vec4(mix(uColor, uFogColor, uFogOn * smoothstep(uFogNear, uFogFar, vDepth)), 1.0); }`;
const QUAD_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAME_FS = /* glsl */`
  uniform sampler2D tSrc; uniform sampler2D tLine; uniform float uLineOn; uniform vec2 uRes; uniform float uTime; uniform int uMode; uniform vec4 uTile;
  uniform vec3 uPalA[5]; uniform vec4 uA1; uniform vec4 uA2; uniform vec4 uA3; uniform vec4 uA4;
  uniform vec3 uPalB[5]; uniform vec4 uB1; uniform vec4 uB2; uniform vec4 uB3; uniform vec4 uB4;
  uniform int uTrType; uniform float uTr; uniform float uFour; uniform vec3 uQuad[4];
  uniform float uDepthWarm; uniform float uWash; uniform float uBlack; uniform float uNoVig; uniform float uClean; uniform float uGrey;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float n1(float x){ return vnoise(vec2(x, 7.31)); }
  vec3 toSRGB(vec3 c){ c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
  float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3 grade(vec3 c, vec2 uv, vec3 pal[5], vec4 p1, vec4 p2, vec4 p3, vec4 p4, vec3 glow){
    c += glow * p2.z;
    c = mix(vec3(luma(c)), c, p1.y) * p3.rgb;
    if (p2.y > 1.5) c = floor(c * p2.y + 0.5) / p2.y;
    if (p1.x > 0.0) {
      vec3 best = pal[0];
      if (p2.x > 0.5) { float L = clamp(luma(c), 0.0, 1.0) * 4.0; int i0 = int(min(3.0, floor(L))); best = mix(pal[i0], pal[i0 + 1], smoothstep(0.35, 0.65, L - float(i0))); c = vec3(luma(c)); }
      else { float bd = 1e9; for (int i = 0; i < 5; i++) { vec3 d = c - pal[i]; float dd = dot(d, d); if (dd < bd) { bd = dd; best = pal[i]; } } }
      c = mix(c, best, p1.x);
    }
    c = mix(c, p4.rgb, p4.a);
    float asp = uRes.x / uRes.y;
    if (p3.a > 0.0 && uClean < 0.5) { float pn = vnoise(uv * vec2(asp, 1.0) * 220.0) * 0.6 + vnoise(uv * vec2(asp, 1.0) * 37.0) * 0.4; c *= 1.0 - p3.a * 0.09 * (pn - 0.5) * 2.0; }
    c += (hash(uv * uRes + fract(uTime) * 91.0) - 0.5) * p1.z * (1.0 - uClean);
    vec2 q = uv - 0.5; q.x *= asp * 0.75; c *= 1.0 - p1.w * dot(q, q) * 1.5 * (1.0 - max(uNoVig, uClean));
    c *= 1.0 + p2.w * (hash(vec2(floor(uTime * 12.0), 3.1)) - 0.5);
    return c;
  }
  void main(){
    vec2 uv = uTile.xy + vUv * uTile.zw, suv = vUv; int quad = 0;
    if (uFour > 0.5) { vec2 g = vUv * 2.0; bool fx = g.x >= 1.0, fy = g.y < 1.0; quad = (fx ? 1 : 0) + (fy ? 2 : 0); vec2 fr = fract(g); suv = vec2(fx ? 1.0 - fr.x : fr.x, fy ? 1.0 - fr.y : fr.y); }
    float crackMask = 0.0, crackEdge = 0.0;
    if (uTrType == 4 && uTr > 0.0) {
      float y = 0.5 + 0.16 * (n1(uv.x * 5.0) - 0.5) + 0.06 * (n1(uv.x * 23.0) - 0.5) + 0.03 * (step(0.5, fract(uv.x * 11.0)) - 0.5);
      float open = clamp(uTr * 1.7 - (1.0 - uv.x) * 0.7, 0.0, 1.0), gap = 0.2 * open * uTr, d = uv.y - y;
      crackMask = step(abs(d), gap * 0.5); crackEdge = (1.0 - smoothstep(0.0, 0.006, abs(abs(d) - gap * 0.5))) * step(0.001, open);
      if (crackMask < 0.5) suv.y -= sign(d) * gap * 0.5; else suv = 0.5 + (suv - 0.5) * 0.92;
    }
    vec4 src = texture2D(tSrc, suv);
    if (uMode == 1) { vec3 c = toSRGB(src.rgb); if (uFour > 0.5) c *= uQuad[quad]; gl_FragColor = vec4(c, src.a); return; }
    vec3 rgb = toSRGB(src.rgb);
    vec4 ln = uLineOn > 0.5 ? texture2D(tLine, suv) : vec4(0.0);
    vec3 glow = vec3(0.0);
    if (uA2.z + uB2.z > 0.0) { vec2 px = 1.0 / uRes * (uRes.y / 1080.0);
      for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; glow += max(toSRGB(texture2D(tSrc, suv + vec2(cos(a), sin(a)) * px * 9.0).rgb) - 0.62, 0.0); } glow *= 0.35; }
    vec3 gA = grade(rgb, uv, uPalA, uA1, uA2, uA3, uA4, glow), gB = grade(rgb, uv, uPalB, uB1, uB2, uB3, uB4, glow);
    float m = 0.0, line = 0.0, asp = uRes.x / uRes.y;
    if (uTrType == 1) { float front = uTr * 1.3 - 0.15, wob = 0.035 * sin(uv.y * 16.0 + uTime * 2.5) + 0.012 * sin(uv.y * 47.0 - uTime * 4.0), e = (uv.x - (front + wob)) * asp;
      m = step(e, 0.0); line = (1.0 - smoothstep(0.004, 0.009, abs(e))) * step(0.001, uTr) * step(uTr, 0.999); }
    else if (uTrType == 2) { vec2 q = uv - 0.5; q.x *= asp; float ang = fract(atan(q.x, q.y) / 6.2831853 + 1.0), r = length(q), da = ang - (uTr + 0.02 * sin(r * 30.0 - uTime * 3.0));
      m = step(da, 0.0); line = (1.0 - smoothstep(0.004, 0.009, abs(da) * 6.2831853 * max(r, 0.02))) * step(0.001, uTr) * step(uTr, 0.999); }
    else if (uTrType == 3) m = uTr;
    else if (uTrType == 4) m = crackMask;
    vec3 c = mix(gA, gB, m);
    if (ln.a > 0.0) { vec3 lc = toSRGB(ln.rgb), lg = vec3(luma(lc) * 0.55); vec3 lA = uA2.x > 0.5 ? lg : lc, lB = uB2.x > 0.5 ? lg : lc; c = mix(c, mix(lA, lB, m), ln.a * src.a); }
    c = mix(c, vec3(0.88, 0.21, 0.17), line);
    c = mix(c, vec3(0.92, 0.98, 1.0), crackEdge * 0.9);
    if (uFour > 0.5) c *= uQuad[quad];
    c.r *= 1.0 - uDepthWarm * 0.5; c.g *= 1.0 - uDepthWarm * 0.12;
    c = mix(c, vec3(0.96, 0.94, 0.9), uWash * 0.55); c = mix(vec3(luma(c)), c, 1.0 - uWash * 0.6);
    c *= 1.0 - uBlack;
    if (uGrey > 0.5) c = vec3(luma(c));                                   // value check: read the FG / MG / BG planes in grey
    gl_FragColor = vec4(c, src.a);
  }`;

const EDGE_FS = /* glsl */`
  uniform sampler2D tNormal; uniform sampler2D tDepth; uniform sampler2D tMask; uniform float uMaskOn;
  uniform vec2 uRes; uniform float uThick; uniform vec3 uColor; uniform float uWobble; uniform float uNear; uniform float uFar;
  uniform float uFade; uniform float uFadeNear; uniform float uFadeFar;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float lin(float z){ return (2.0 * uNear * uFar) / (uFar + uNear - (z * 2.0 - 1.0) * (uFar - uNear)); }
  void main(){
    vec2 px = 1.0 / uRes * uThick;
    vec2 w = vec2(vnoise(vUv * uRes / 60.0), vnoise(vUv * uRes / 60.0 + 13.7)) - 0.5;
    vec2 uv = vUv + w * px * uWobble * 2.0;
    vec4 n0 = texture2D(tNormal, uv); float d0 = lin(texture2D(tDepth, uv).r), i0 = 1.0 / max(d0, 1e-4);
    float en = 0.0;
    vec2 o[4]; o[0] = vec2(px.x, 0.0); o[1] = vec2(-px.x, 0.0); o[2] = vec2(0.0, px.y); o[3] = vec2(0.0, -px.y);
    float iz[4];
    for (int i = 0; i < 4; i++) { vec4 n = texture2D(tNormal, uv + o[i]); iz[i] = 1.0 / max(lin(texture2D(tDepth, uv + o[i]).r), 1e-4);
      en += length(n.rgb - n0.rgb) * max(n.a, n0.a) + abs(n.a - n0.a) * 2.0; }
    float ed = (abs(iz[0] + iz[1] - 2.0 * i0) + abs(iz[2] + iz[3] - 2.0 * i0)) / i0;   // ≈ 0 on any flat surface, large at silhouettes
    float e = max(smoothstep(0.55, 1.1, en), smoothstep(0.1, 0.2, ed));
    e *= 1.0 - uFade * 0.7 * smoothstep(uFadeNear, uFadeFar, d0);
    if (uMaskOn > 0.5) { float mk = 0.0; for (int i = 0; i < 4; i++) mk = max(mk, texture2D(tMask, uv + o[i] * 1.5).a); mk = max(mk, texture2D(tMask, uv).a); e *= mk; }
    gl_FragColor = vec4(uColor, e);
  }`;

/* detail shading, inside every flat fill (uPix = 1; on by default, also feeds the pixel art mode): the base colour becomes a 5-step ramp (cool deep shadow →
   shadow → base → warm light → highlight) lit by the scene sun, with world-anchored detail so it does not swim:
   - greens (leaves, bushes, grass): clumps of leaves, each lit on its own + dark lines between clumps (Kirby / SNES look)
     · upward ground: scattered grass tufts instead
   - near-white (clouds, snow): soft billows with pale blue shade, no lines (calm sky look)
   - everything else (mountains, walls, wood…): painterly broken bands
   Detail cells never get smaller than ~4 art pixels (fwidth), and snap to powers of 2. */
const PIXEL_SHADE = /* glsl */`
  uniform float uPix; uniform float uPixBlock; uniform float uPixContrast; uniform float uPixDetail; uniform float uPixDither;
  vec3 pxH3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float pxN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(pxH3(i).x, pxH3(i + vec3(1,0,0)).x, f.x), mix(pxH3(i + vec3(0,1,0)).x, pxH3(i + vec3(1,1,0)).x, f.x), f.y),
               mix(mix(pxH3(i + vec3(0,0,1)).x, pxH3(i + vec3(1,0,1)).x, f.x), mix(pxH3(i + vec3(0,1,1)).x, pxH3(i + vec3(1,1,1)).x, f.x), f.y), f.z); }
  // voronoi: x = F1, y = F2 (distances), c = nearest cell centre
  // 2×2×2 cells on the near side of each axis (8 taps instead of 27): cheap enough for every fill, jitter kept ≤ 0.4 so it stays exact enough
  vec2 pxVor(vec3 p, out vec3 c){ vec3 i = floor(p), f = fract(p), s0 = step(0.5, f) - 1.0; float f1 = 9.0, f2 = 9.0; c = i;
    for (int z = 0; z <= 1; z++) for (int y = 0; y <= 1; y++) for (int x = 0; x <= 1; x++) {
      vec3 g = s0 + vec3(x, y, z), o = pxH3(i + g) * 0.4 + 0.3, r = g + o - f; float d = dot(r, r);
      if (d < f1) { f2 = f1; f1 = d; c = i + g + o; } else if (d < f2) f2 = d; }
    return vec2(sqrt(f1), sqrt(f2)); }
  float pxBayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float pxBayer(vec2 p){ return pxBayer2(0.5 * p) * 0.25 + pxBayer2(p) - 0.5; }
  float pxCell(float want, float minC){ return max(want, exp2(ceil(log2(max(minC, 1e-6))))); }
  vec3 pxRamp(vec3 b, float s){
    float k = floor(clamp(s, 0.0, 0.999) * 5.0);
    vec3 deep = b * vec3(0.40, 0.45, 0.66), sh = b * vec3(0.66, 0.71, 0.88);
    vec3 lt = min(mix(b, vec3(1.0, 0.95, 0.72), 0.2) * 1.16, vec3(1.0)), hi = min(mix(b, vec3(1.0, 1.0, 0.86), 0.5) * 1.22, vec3(1.0));
    return k < 0.5 ? deep : k < 1.5 ? sh : k < 2.5 ? b : k < 3.5 ? lt : hi; }
  vec3 pixelShade(vec3 b){
    vec3 n = normalize(vFlatN), nw = normalize(vFlatNW); if (!gl_FrontFacing) { n = -n; nw = -nw; }
    vec3 sb = pow(max(b, 0.0), vec3(1.0 / 2.2));
    float mx = max(sb.r, max(sb.g, sb.b)), mn = min(sb.r, min(sb.g, sb.b)), sat = mx > 0.0 ? (mx - mn) / mx : 0.0;
    bool green = sb.g >= sb.r && sb.g >= sb.b * 0.92 && sat > 0.22 && mx > 0.12, white = sat < 0.16 && mx > 0.8;
    float minC = length(fwidth(vFlatW)) * uPixBlock;                 // one art pixel, in world units
    float lit = dot(n, uSunV) * 0.5 + 0.5, s = lit, line = 0.0;
    vec2 ap = floor(gl_FragCoord.xy / uPixBlock);                     // art-pixel grid (dither)
    if (green && nw.y > 0.8 && vFlatS > 0.0 && minC * 6.0 > vFlatS * 0.04) {
      // ground: grass tufts — small dark strokes + a few light ones
      float cs = pxCell(0.0, minC * 6.0); vec3 q = vFlatW / cs * vec3(1.0, 0.0, 1.0), c; vec2 v = pxVor(q + vec3(0.0, 0.5, 0.0), c);
      vec3 d = q - c; float r = pxH3(c * 1.7).y;
      float tuft = step(abs(d.x) * 1.6 + max(d.z, 0.0) * 0.6, 0.22) * step(-0.26, d.z) * step(0.62, r);   // little upright tuft
      s = 0.5 + (step(0.55, pxN3(vFlatW / (cs * 9.0))) - 0.5) * 0.22 * uPixDetail;                     // light / dark grass patches
      s -= tuft * 0.45 * uPixDetail; s += step(v.x, 0.16) * step(r, 0.1) * 0.3 * uPixDetail;
    } else if (green) {
      // leaves: clumps lit on their own, dark line between clumps
      float cs = pxCell(vFlatS * 0.45, minC * 4.0); vec3 c; vec2 v = pxVor(vFlatW / cs, c);
      vec3 bump = normalize(vFlatW / cs - c), bv = normalize(mat3(viewMatrix) * bump), nn = normalize(mix(n, bv, 0.7 * uPixDetail));
      s = mix(lit, dot(nn, uSunV) * 0.5 + 0.5, 0.65) + (pxH3(c).z - 0.5) * 0.12 * uPixDetail;
      line = (1.0 - smoothstep(0.05, 0.11, v.y - v.x)) * uPixDetail * (1.0 - smoothstep(0.42, 0.62, s));   // leaf shadows only on the shade side
    } else if (white) {
      // clouds / snow: soft billows, pale blue shade, never dark
      float cs = pxCell(vFlatS * 0.5, minC * 7.0); vec3 c; vec2 v = pxVor(vFlatW / cs, c);
      vec3 bv = normalize(mat3(viewMatrix) * normalize(vFlatW / cs - c)), nn = normalize(mix(n, bv, 0.45 * uPixDetail));
      float cl = mix(lit, dot(nn, uSunV) * 0.5 + 0.5, 0.6) + pxBayer(ap) * 0.12 * uPixDither;
      cl = 0.5 + (cl - 0.5) * uPixContrast;
      return cl < 0.38 ? b * vec3(0.74, 0.83, 0.97) : cl < 0.6 ? b * vec3(0.87, 0.93, 1.0) : b;
    } else {
      // mountains, walls, wood…: broken bands + streaks
      float cs = pxCell(vFlatS * 0.18, minC * 5.0);
      s += (pxN3(vFlatW / cs) - 0.5) * 0.13 * uPixDetail + (pxN3(vFlatW / (cs * 0.35) * vec3(1.0, 3.0, 1.0)) - 0.5) * 0.08 * uPixDetail;
    }
    s = 0.5 + (s - 0.5) * uPixContrast + pxBayer(ap) * 0.09 * uPixDither;
    vec3 col = pxRamp(b, s);
    return mix(col, s > 0.6 ? pxRamp(b, 0.3) : b * vec3(0.22, 0.26, 0.42), line);   // lit side: soft inner line, shadow side: dark
  }`;

/* pixel art (2D game look): snap the finished picture to a block grid in image space (global coords, so tiles and
   panorama slices line up), keep thin ink lines as one block (darkest of 4×4 taps), posterize colours, hard alpha. Input is already sRGB. */
const PIXEL_FS = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uRes; uniform vec4 uTile; uniform float uSize; uniform float uLevels; uniform float uDither;
  varying vec2 vUv;
  float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
  float ink(vec4 s){ return luma(s.rgb) * s.a + (1.0 - s.a); }   // darkness over white: works for colour and transparent lineart
  float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer(vec2 p){ return bayer2(0.5 * p) * 0.25 + bayer2(p) - 0.5; }   // 4×4 ordered dither, −0.5…0.5
  vec4 at(vec2 g){ return texture2D(tSrc, clamp((g / uRes - uTile.xy) / uTile.zw, 0.0, 1.0)); }
  void main(){
    vec2 g = (uTile.xy + vUv * uTile.zw) * uRes, b = floor(g / uSize), o = b * uSize;
    vec4 c = at(o + 0.5 * uSize), best = c; float ci = ink(c), bi = ci, nd = 0.0;
    for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++) { vec4 s = at(o + (vec2(x, y) + 0.5) * 0.25 * uSize); float si = ink(s);
      if (si < bi) { bi = si; best = s; } nd += step(si, ci - 0.18); }
    if (ci - bi > 0.18 && nd >= 3.0) c = best;                     // a line crosses this block → the block becomes the line
    vec3 rgb = c.rgb;
    if (uLevels > 1.5) { float n = uLevels - 1.0; rgb = floor(clamp(rgb, 0.0, 1.0) * n + 0.5 + bayer(b) * uDither) / n; }
    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), step(0.5, c.a));
  }`;

const SKY_VS = /* glsl */`varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz); gl_Position = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position,1.0)).xyz, 1.0); gl_Position.z = gl_Position.w; }`;
const SKY_FS = /* glsl */`
  uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSun; uniform float uBands; varying vec3 vDir;
  float band(float t){ return uBands > 0.5 ? min(1.0, floor(t * uBands) / max(1.0, uBands - 1.0)) : t; }   // flat 2D: a few painted bands
  void main(){
    vec3 d = normalize(vDir); float h = d.y;
    vec3 c = h > 0.0 ? mix(uHorizon, uTop, band(pow(smoothstep(0.0, 0.75, h), 0.8))) : mix(uHorizon, uBottom, band(smoothstep(0.0, -0.25, h)));
    float s = max(dot(d, normalize(uSunDir)), 0.0), halo = pow(s, 24.0) * 0.25;
    if (uBands > 0.5) halo = step(0.45, pow(s, 24.0)) * 0.18;
    c = mix(c, uSunCol, uSun * (smoothstep(0.9965, 0.998, s) * 0.9 + halo));
    gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);
  }`;

/* ── engine ─────────────────────────────────────────────────────────────── */
export function startApp(cfg) {
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), overlay = $('#overlay'), octx = overlay.getContext('2d');
  // the canvas only ever receives one full-screen quad (the scene renders into targets), so MSAA and a preserved buffer
  // would only cost memory and fill-rate; exports read the canvas in the same task right after rendering.
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);
  // phones can drop the GPU context (memory pressure, app switch): say so instead of showing a frozen frame
  renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault(); document.body.classList.remove('ready');
    const t = document.getElementById('ldText'); if (t) t.innerHTML = 'The browser paused the 3D view<small>Tap here to reload the scene.</small>';
    const l = document.getElementById('loader'); if (l) { l.style.pointerEvents = 'auto'; l.style.cursor = 'pointer'; l.onclick = () => location.reload(); }
  });
  const gl = renderer.getContext();
  const MAX_RB = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), gl.getParameter(gl.MAX_TEXTURE_SIZE));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cfg.fov || 40, 16 / 9, 0.1, 5000);
  const groups = {};
  for (const n of ['SKY', 'BG', 'MG', 'FG']) { const g = new THREE.Group(); g.name = n; groups[n] = g; scene.add(g); }
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7f72, 1.8);
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(-0.4, 1, 0.55);
  scene.add(hemi, sun, sun.target);

  /* materials */
  const gradTex = new THREE.DataTexture(new Uint8Array([150, 208, 255]), 3, 1, THREE.RedFormat);
  gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter; gradTex.needsUpdate = true;
  const matCache = new Map();
  const toon = (hex, extra = {}) => { const k = hex + JSON.stringify(extra); if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color: new THREE.Color(hex), gradientMap: gradTex, ...extra })); return matCache.get(k); };
  const mkHull = (side = THREE.BackSide) => new THREE.ShaderMaterial({ uniforms: { uWidth: { value: 0.0016 }, uColor: { value: new THREE.Color(INK) }, uFogColor: { value: new THREE.Color() }, uFogNear: { value: 1 }, uFogFar: { value: 1000 }, uFogOn: { value: 0 } }, vertexShader: HULL_VS, fragmentShader: HULL_FS, side });
  const hullMat = mkHull(), lineHullMat = mkHull(), inkLineMat = mkHull(THREE.DoubleSide); inkLineMat.uniforms.uWidth.value = 0;
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
  const normalMat = new THREE.MeshNormalMaterial();
  const basicCache = new Map();
  const basic = (hex, side = THREE.FrontSide) => { const k = hex + side; if (!basicCache.has(k)) basicCache.set(k, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), side, depthWrite: side !== THREE.BackSide })); return basicCache.get(k); };
  const basicWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const inkFinal = new THREE.MeshBasicMaterial({ color: 0xffffff });     // ink keeps its own colour in the colour render (instance colours)

  /* FLAT 2D look (default): every toon fill gets an unlit twin = exactly its own colour, like a cel painting.
     - per-object fog: each shape takes ONE depth tint from its own origin (layered planes, no gradient across a shape)
     - big flat fx pieces (ground, roads) keep per-pixel fog, but quantised into a few painted steps
     - light colour / strength of the scene (hemi + sun) becomes one flat tint, so mood presets still work
     - optional single cel shadow (Kirby) on the side away from the sun */
  const flatU = { uTint: { value: new THREE.Color(1, 1, 1) }, uSunV: { value: new THREE.Vector3(0, 1, 0) }, uCel: { value: 0 }, uShade: { value: new THREE.Color('#DCD6EA') }, uFogSteps: { value: 0 },
    uPix: { value: 0 }, uPixBlock: { value: 6 }, uPixContrast: { value: 1.3 }, uPixDetail: { value: 1 }, uPixDither: { value: 0.5 },
    uVal: { value: new THREE.Vector4(0, 0, 0, 0) }, uValT: { value: new THREE.Vector4(0.04, 0.36, 0.6, 0.76) }, uHaze: { value: new THREE.Color(1, 1, 1) } };
  const FLAT_FS_HEAD = 'uniform vec3 uTint; uniform vec3 uSunV; uniform float uCel; uniform vec3 uShade; uniform float uFogSteps; uniform vec4 uVal; uniform vec4 uValT; uniform vec3 uHaze; varying vec3 vFlatN; varying vec3 vFlatW; varying vec3 vFlatNW; varying float vFlatS; varying float vFlatD;\n' + PIXEL_SHADE;
  function flatPatch(mat, perObjectFog) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, flatU);
      sh.vertexShader = 'varying vec3 vFlatN; varying vec3 vFlatW; varying vec3 vFlatNW; varying float vFlatS; varying float vFlatD;\n' + sh.vertexShader
        .replace('#include <project_vertex>', `#include <project_vertex>
          ${perObjectFog ? `{ vec4 dO = vec4(0.0, 0.0, 0.0, 1.0);
            #ifdef USE_INSTANCING
              dO = instanceMatrix * dO;
            #endif
            vFlatD = -(modelViewMatrix * dO).z; }` : 'vFlatD = -mvPosition.z;'}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec3 fn = normal; vec4 fw = vec4(transformed, 1.0); mat3 wm = mat3(modelMatrix);
            #ifdef USE_INSTANCING
              fn = mat3(instanceMatrix) * fn; fw = instanceMatrix * fw; wm = wm * mat3(instanceMatrix);
            #endif
            vFlatN = normalize(normalMatrix * fn);
            vFlatW = (modelMatrix * fw).xyz; vFlatNW = normalize(mat3(modelMatrix) * fn);       // pixel art: world-anchored detail
            vFlatS = (length(wm[0]) + length(wm[1]) + length(wm[2])) / 3.0;
          }`)
        .replace('#include <fog_vertex>', perObjectFog ? `#ifdef USE_FOG
            vec4 fogO = vec4(0.0, 0.0, 0.0, 1.0);
            #ifdef USE_INSTANCING
              fogO = instanceMatrix * fogO;
            #endif
            vFogDepth = -(modelViewMatrix * fogO).z;
          #endif` : '#include <fog_vertex>');
      sh.fragmentShader = (perObjectFog ? '' : '#define FLAT_FOG_STEPS\n') + FLAT_FS_HEAD + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
          if (uPix > 0.5) diffuseColor.rgb = pixelShade(diffuseColor.rgb);
          diffuseColor.rgb *= uTint;
          if (uVal.w > 0.0) {   // value structure: every plane is pulled to its own value (FG dark → far light), hue + inner shading kept
            vec3 cv = diffuseColor.rgb; float T = uValT.y, side = 0.0, ex = 0.65;   // side: −1 only darker, 1 only lighter, 0 both
            #ifdef FLAT_FOG_STEPS
              bool fgPlane = false;                                     // big ground / road pieces: the floor the characters stand on is never FG
            #else
              bool fgPlane = vFlatD < uVal.x && vFlatS < uVal.x * 0.45;   // big pieces (floors, paths, the dome) stay MG
            #endif
            if (fgPlane) { T = uValT.x; side = -1.0; ex = 0.45; cv *= vec3(0.92, 0.94, 1.08); }   // FG: darkest, a touch cooler
            else if (vFlatD > uVal.z) { T = uValT.w; side = 1.0; ex = 0.45; cv = mix(cv, uHaze, 0.45); } // far: lightest, mostly haze
            else if (vFlatD > uVal.y) { T = uValT.z; side = 1.0; ex = 0.5; cv = mix(cv, uHaze, 0.25); }  // BG
            float Lc = max(dot(cv, vec3(0.2126, 0.7152, 0.0722)), 1e-4), Ln = T * pow(Lc / T, ex);       // squeeze the plane around its value
            Ln = side < -0.5 ? min(Ln, Lc) : side > 0.5 ? max(Ln, Lc) : Ln;
            cv = min(cv * (Ln / Lc), vec3(1.0));
            if (side < -0.5) cv = max(mix(vec3(Ln), cv, 1.45), vec3(0.0));             // FG keeps its colour when it gets dark (no grey mud)
            diffuseColor.rgb = mix(diffuseColor.rgb, cv, uVal.w); }
          if (uCel > 0.5 && uPix < 0.5) { vec3 n = normalize(vFlatN); n = gl_FrontFacing ? n : -n; diffuseColor.rgb *= mix(uShade, vec3(1.0), step(0.05, dot(n, uSunV))); }`)
        .replace('#include <fog_fragment>', `#ifdef USE_FOG
            #ifdef FOG_EXP2
              float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #else
              float fogF = smoothstep(fogNear, fogFar, vFogDepth);
            #endif
            #ifdef FLAT_FOG_STEPS
              if (uFogSteps > 0.5) fogF = floor(fogF * uFogSteps + 0.5) / uFogSteps;
            #endif
            gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogF);
          #endif`);
    };
    mat.customProgramCacheKey = () => 'flat2d' + (perObjectFog ? 'o' : 'p');
    return mat;
  }
  const flatCache = new Map();
  /** unlit twin of a toon material (cached per source material + fog mode) */
  function flatOf(m, perObjectFog) {
    const k = m.uuid + perObjectFog; if (flatCache.has(k)) return flatCache.get(k);
    const b = new THREE.MeshBasicMaterial({ color: m.color, map: m.map, alphaMap: m.alphaMap, alphaTest: m.alphaTest, transparent: m.transparent, opacity: m.opacity, side: m.side,
      vertexColors: m.vertexColors, fog: m.fog, depthWrite: m.depthWrite, depthTest: m.depthTest, polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits });
    flatPatch(b, perObjectFog); flatCache.set(k, b); return b;
  }
  /** shading: 'flat' (default) | 'cel' (flat + one shadow) | 'toon' (the old soft 3D look) */
  function setShading(mode) {
    if (state.pixel && mode === 'toon') mode = 'flat';   // pixel art shades the unlit flat twins itself
    flatU.uCel.value = mode === 'cel' ? 1 : 0;
    for (const m of reg.fills) { const t = m.userData.toonMat || (m.userData.toonMat = m.userData.fillMat); if (t && t.isMeshToonMaterial) m.userData.fillMat = mode === 'toon' ? t : flatOf(t, true); }
    for (const f of reg.fx) { const t = f.userData.toonMat || (f.userData.toonMat = f.userData.fillMat); if (t && t.isMeshToonMaterial) f.userData.fillMat = mode === 'toon' ? t : flatOf(t, false); }
    skyMat.uniforms.uBands.value = mode === 'toon' ? 0 : state.skyBands;
    setPass('final');
  }
  const tmpV = new THREE.Vector3(), tmpC = new THREE.Color();
  const LIGHT_REF = 2.2 * 0.7 + 1.0 * 0.3;                              // the scenes' usual day light (hemi 2.2 + sun 1)
  function updateFlatLight() {
    tmpC.copy(hemi.color).lerp(new THREE.Color(1, 1, 1), 0.5);
    const k = Math.min(1, Math.max(0.35, (hemi.intensity * 0.7 + sun.intensity * 0.3) / LIGHT_REF));
    flatU.uTint.value.copy(tmpC).multiplyScalar(k);
    flatU.uSunV.value.copy(tmpV.copy(sun.position).sub(sun.target.position).normalize()).transformDirection(camera.matrixWorldInverse);
  }

  /* registry: fills (toon + hull), ink (lines drawn as geometry), fx (sky, water, light…) */
  const reg = { fills: [], hulls: [], fx: [], ink: [] };
  const elements = []; let curEl = 'scene';
  const setEl = name => { curEl = name; if (!elements.includes(name)) elements.push(name); };

  /* geometry kit */
  const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg);
  const rcPts = (() => { const p = [[0, 0], [0.92, 0], [0.99, 0.04], [1, 0.12]]; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; p.push([0.85 + 0.15 * Math.cos(a), 0.85 + 0.15 * Math.sin(a)]); } p.push([0, 1]); return p; })();
  const geo = {
    sphere: new THREE.SphereGeometry(1, ...SEG.s), sphereLo: new THREE.SphereGeometry(1, ...SEG.lo),
    capsule: new THREE.CapsuleGeometry(0.5, 1, ...SEG.cap), rbox: new RoundedBoxGeometry(1, 1, 1, SEG.rb, 0.16), rboxSoft: new RoundedBoxGeometry(1, 1, 1, SEG.rbs, 0.3),
    rcyl: lathe(rcPts, SEG.lathe), cone: lathe([[0, 0], [1, 0], [0.98, 0.08], [0.55, 0.62], [0.18, 0.95], [0, 1]], SEG.cone),
    torus: new THREE.TorusGeometry(1, 0.12, ...SEG.tor), disc: new THREE.CircleGeometry(1, SEG.disc).rotateX(-Math.PI / 2),
    halfSphere: new THREE.SphereGeometry(1, SEG.half[0], SEG.half[1], 0, Math.PI * 2, 0, Math.PI / 2),
    inkBar: new THREE.BoxGeometry(1, 1, 1),
  };
  geo.lathe = lathe;

  function register(mesh, hex, outline = true) {
    mesh.userData.baseHex = hex; mesh.userData.el = curEl; mesh.userData.fillMat = mesh.material; reg.fills.push(mesh);
    if (outline) { const h = new THREE.Mesh(mesh.geometry, hullMat); h.userData.isHull = true; mesh.add(h); reg.hulls.push(h); }
    return mesh;
  }
  function solid(g, hex, parent, o = {}) {
    const m = new THREE.Mesh(g, toon(hex, o.mat || {}));
    if (o.pos) m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot);
    if (o.scale != null) Array.isArray(o.scale) ? m.scale.set(...o.scale) : m.scale.setScalar(o.scale);
    register(m, hex, o.outline !== false); if (o.idColor) m.userData.idColor = o.idColor; parent.add(m); return m;
  }
  class Batch {
    constructor(g, parent, outline = true, ink = false) { this.g = g; this.parent = parent; this.outline = outline; this.ink = ink; this.el = curEl; this.items = []; }
    add(pos, scale = 1, hex = '#ffffff', rot = [0, 0, 0]) { this.items.push({ pos, scale, hex, rot }); return this; }
    build() {
      const n = this.items.length; if (!n) return null;
      const mesh = new THREE.InstancedMesh(this.g, this.ink ? inkFinal : new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradTex }), n);
      const o = new THREE.Object3D(), col = new THREE.Color();
      this.items.forEach((it, i) => { o.position.set(...it.pos); o.rotation.set(...it.rot); Array.isArray(it.scale) ? o.scale.set(...it.scale) : o.scale.setScalar(it.scale); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); mesh.setColorAt(i, col.set(it.hex)); });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.userData.bsVer = mesh.instanceMatrix.version;   // culled per batch
      mesh.userData.el = this.el; mesh.userData.fillMat = mesh.material; mesh.userData.hexes = this.items.map(i => i.hex); mesh.userData.origColors = mesh.instanceColor.array.slice();
      if (this.idColor) { mesh.userData.idColor = this.idColor; mesh.userData.idMaxD = this.idMaxD || 1e6; }
      if (this.ink) reg.ink.push(mesh); else reg.fills.push(mesh);
      if (this.outline && !this.ink) { const h = new THREE.InstancedMesh(this.g, hullMat, n); h.instanceMatrix = mesh.instanceMatrix; h.frustumCulled = false; h.userData.isHull = true; mesh.add(h); reg.hulls.push(h); }
      this.parent.add(mesh); this.mesh = mesh; return mesh;
    }
  }
  const batches = new Map();
  /** Shared batch per (group, geometry, element). ink = drawn line (shown in colour + lineart, hidden in base colour). */
  const B = (parent, key, outline = true, ink = false) => { const k = parent.uuid + '|' + key + '|' + outline + '|' + ink + '|' + curEl; if (!batches.has(k)) batches.set(k, new Batch(geo[key] || key, parent, outline, ink)); return batches.get(k); };
  const buildBatches = () => { for (const b of batches.values()) if (!b.mesh) b.build(); };
  /** Ink lines (dashes, tufts, hand-drawn marks): constant pixel width at any distance, like the drawn edges.
      segs = [x1,y1,z1,x2,y2,z2, …]; cols = one hex per segment (colour render); lineart uses the ink colour. */
  function inkLines(segs, cols, parent) {
    const g = new LineSegmentsGeometry(); g.setPositions(segs);
    const cc = [], c = new THREE.Color();
    for (let i = 0; i < segs.length / 6; i++) { c.set(Array.isArray(cols) ? cols[i] : cols); c.convertLinearToSRGB(); cc.push(c.r, c.g, c.b, c.r, c.g, c.b); }
    g.setColors(cc);
    const fillMat = new LineMaterial({ vertexColors: true, linewidth: 2, worldUnits: false });
    const lineMat = new LineMaterial({ color: new THREE.Color(INK), linewidth: 2, worldUnits: false });
    const m = new LineSegments2(g, fillMat); m.frustumCulled = false;
    Object.assign(m.userData, { el: curEl, fillMat, lineMat, inkLine: true });
    reg.ink.push(m); parent.add(m); return m;
  }
  const idCache = new Map();
  /** Flat-colour id material for the normal pass: gives flat decals (river, roads, windows) a drawn outline. */
  const idMat = (hex, maxD = 1e6) => { const k = hex + maxD; if (!idCache.has(k)) idCache.set(k, new THREE.ShaderMaterial({
    uniforms: { uId: { value: new THREE.Color(hex) }, uMaxD: { value: maxD } }, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
    vertexShader: `varying float vD; void main(){ mat4 m = modelMatrix;\n #ifdef USE_INSTANCING\n m = modelMatrix * instanceMatrix;\n #endif\n vec4 vp = viewMatrix * m * vec4(position, 1.0); vD = -vp.z; gl_Position = projectionMatrix * vp; }`,
    fragmentShader: `uniform vec3 uId; uniform float uMaxD; varying float vD; void main(){ if (vD > uMaxD) discard; gl_FragColor = vec4(uId, 1.0); }` })); return idCache.get(k); };
  /** Special meshes (sky, water, light): own material. occluder = hides what is behind it in element exports. */
  function fx(mesh, parent, o = {}) {
    Object.assign(mesh.userData, { fx: true, baseHex: o.baseHex || null, baseMat: o.baseMat || null, fillMat: mesh.material, inLineart: !!o.inLineart, el: o.el || curEl, occluder: o.occluder !== false, normalPass: !!o.normalPass, idColor: o.idColor || null, normalMat: o.normalMat || null });
    reg.fx.push(mesh); parent.add(mesh); return mesh;
  }

  /* sky */
  const skyMat = new THREE.ShaderMaterial({ uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(-0.4, 0.3, -1) }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uSun: { value: 0 }, uBands: { value: 4 } }, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false });
  setEl('sky');
  const sky = fx(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), skyMat), groups.SKY, { baseHex: '#9BD4F2', occluder: false });
  sky.renderOrder = -10; sky.frustumCulled = false; sky.userData.baseSide = THREE.BackSide;
  sky.onBeforeRender = () => { sky.position.copy(camera.position); sky.scale.setScalar(camera.far * 0.9); };
  function setSky(top, horizon, bottom, o = {}) {
    const s = (u, h) => { const c = hexToRgb(h); skyMat.uniforms[u].value.setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace); };
    s('uTop', top); s('uHorizon', horizon); s('uBottom', bottom || horizon); if (o.sunCol) s('uSunCol', o.sunCol);
    skyMat.uniforms.uSun.value = o.sun ?? 0; if (o.sunDir) skyMat.uniforms.uSunDir.value.set(...o.sunDir);
    sky.userData.baseHex = o.baseHex || top;
  }
  setEl('scene');

  /* render targets + full-screen passes */
  // colour stays half float (linear light); normals / ids, lines and masks are fine in 8 bit (half the memory + bandwidth)
  const mkRT = (depthTex = false, half = false) => { const t = new THREE.WebGLRenderTarget(4, 4, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType }); if (depthTex) t.depthTexture = new THREE.DepthTexture(4, 4); return t; };
  const rt = mkRT(false, true), rtN = mkRT(true), rtL = mkRT(), rtM = mkRT(), rtP = mkRT();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const pal5 = () => Array.from({ length: 5 }, () => new THREE.Vector3());
  const v4 = () => new THREE.Vector4();
  const frameMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: rt.texture }, tLine: { value: rtL.texture }, uLineOn: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uMode: { value: 0 }, uTile: { value: new THREE.Vector4(0, 0, 1, 1) },
      uPalA: { value: pal5() }, uA1: { value: v4() }, uA2: { value: v4() }, uA3: { value: v4() }, uA4: { value: v4() },
      uPalB: { value: pal5() }, uB1: { value: v4() }, uB2: { value: v4() }, uB3: { value: v4() }, uB4: { value: v4() },
      uTrType: { value: 0 }, uTr: { value: 0 }, uFour: { value: 0 }, uQuad: { value: [0, 1, 2, 3].map(() => new THREE.Vector3(1, 1, 1)) },
      uDepthWarm: { value: 0 }, uWash: { value: 0 }, uBlack: { value: 0 }, uNoVig: { value: 0 }, uClean: { value: 0 }, uGrey: { value: 0 } },
    vertexShader: QUAD_VS, fragmentShader: FRAME_FS, depthTest: false, depthWrite: false });
  const edgeMat = new THREE.ShaderMaterial({
    uniforms: { tNormal: { value: rtN.texture }, tDepth: { value: rtN.depthTexture }, tMask: { value: rtM.texture }, uMaskOn: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uThick: { value: 1.1 }, uColor: { value: new THREE.Color(INK) }, uWobble: { value: 0.6 }, uNear: { value: 0.1 }, uFar: { value: 1000 }, uFade: { value: 0 }, uFadeNear: { value: 100 }, uFadeFar: { value: 600 } },
    vertexShader: QUAD_VS, fragmentShader: EDGE_FS, depthTest: false, depthWrite: false, transparent: true });
  const quadScene = new THREE.Scene(); const q1 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), frameMat); q1.frustumCulled = false; quadScene.add(q1);
  const edgeScene = new THREE.Scene(); const q2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMat); q2.frustumCulled = false; edgeScene.add(q2);
  const pixelMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: rtP.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uTile: { value: new THREE.Vector4(0, 0, 1, 1) }, uSize: { value: 6 }, uLevels: { value: 12 }, uDither: { value: 0 } },
    vertexShader: QUAD_VS, fragmentShader: PIXEL_FS, depthTest: false, depthWrite: false });
  const pixelScene = new THREE.Scene(); const q3 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pixelMat); q3.frustumCulled = false; pixelScene.add(q3);

  function setGrade(slot, key) {
    const e = ERAS[key] || ERAS.base, u = frameMat.uniforms, P = u['uPal' + slot].value;
    for (let i = 0; i < 5; i++) { const c = hexToRgb(e.pal ? e.pal[i] : '#000000'); P[i].set(c[0], c[1], c[2]); }
    u['u' + slot + '1'].value.set(e.pal ? e.map : 0, e.sat, e.grain, e.vig); u['u' + slot + '2'].value.set(e.bw, e.post, e.glow, e.flick);
    u['u' + slot + '3'].value.set(e.tint[0], e.tint[1], e.tint[2], e.paper); u['u' + slot + '4'].value.set(...e.haze);
  }

  /* state */
  const state = {
    playing: true, T: 0, eraMode: 'auto', nextEra: 'e1945', waveType: 'wave', manual: null,
    outlines: false, edges: true, lineW: 2.4, pxScale: 1, lineColour: 'ink', lineWobble: 0.25, glbMode: 'instanced', whiteBg: false,
    shading: 'flat', skyBands: 4, fogSteps: 0, quality: 'auto', meshDetail: 'medium',
    detailShade: true, valueLayers: true, valueStrength: 1, valueCheck: false,
    pixel: false, pixelSize: 5, pixelLevels: 0, pixelDither: 0.5, pixelContrast: 1.2, pixelDetail: 1,   // pixel art (2D game look) — size in px at 1080p, so exports match the preview
    ov: { thirds: false, safe: false, horizon: false, vp: false, staging: false }, exportMode: 'pano', elVis: {}, eraShown: 'base', eraNow: 'base',
  };
  const fxU = { four: 0, quad: [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], depthWarm: 0, wash: 0, black: 0 };

  /* passes: final | base | linefill | normal | mask — iso = element exported on its own (others become holdout) */
  const lineColour = () => new THREE.Color(state.lineColour === 'black' ? '#000000' : state.lineColour === 'dark' ? INK_DARK : INK);
  function setPass(p, iso = null) {
    const era = state.eraShown;
    const shown = o => state.elVis[o.userData.el] !== false;
    const mine = o => !iso || o.userData.el === iso;
    for (const m of reg.fills) {
      m.visible = shown(m);
      if (p === 'normal') { m.material = m.userData.normalMat || (m.userData.idColor ? idMat(m.userData.idColor, m.userData.idMaxD) : normalMat); continue; }
      if (!mine(m)) { m.material = depthOnly; continue; }
      if (p === 'final') m.material = m.userData.fillMat;
      else if (p === 'base' || p === 'mask') {
        if (m.isInstancedMesh) {
          m.material = basicWhite;
          if (p === 'base') { const cache = m.userData.mapped || (m.userData.mapped = {}); if (!cache[era]) { const c = new THREE.Color(), arr = new Float32Array(m.userData.origColors.length); m.userData.hexes.forEach((h, i) => { c.set(mapColour(h, era)); arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }); cache[era] = arr; } m.instanceColor.array.set(cache[era]); m.instanceColor.needsUpdate = true; m.userData.mappedOn = true; }
        } else m.material = p === 'mask' ? basicWhite : basic(mapColour(m.userData.baseHex, era));
      } else if (p === 'linefill') m.material = depthOnly;
      if (p !== 'base' && m.userData.mappedOn) { m.instanceColor.array.set(m.userData.origColors); m.instanceColor.needsUpdate = true; m.userData.mappedOn = false; }
    }
    for (const h of reg.hulls) { const par = h.parent; h.renderOrder = 2; h.visible = state.outlines && (p === 'final' || p === 'linefill') && mine(par); h.material = p === 'linefill' ? lineHullMat : hullMat; }
    for (const k of reg.ink) {
      k.renderOrder = 2;
      k.visible = shown(k) && (p === 'final' || p === 'linefill') && mine(k);
      k.material = p === 'linefill' ? (k.userData.lineMat || inkLineMat) : k.userData.fillMat;
    }
    for (const f of reg.fx) {
      const on = shown(f) && f.userData.fxVisible !== false;
      if (p === 'normal') { f.visible = on && (f.userData.normalPass || !!f.userData.idColor || !!f.userData.normalMat); f.material = f.userData.normalMat || (f.userData.idColor ? idMat(f.userData.idColor) : normalMat); continue; }
      if (!mine(f)) { f.visible = on && f.userData.occluder; f.material = depthOnly; continue; }
      if (p === 'final') { f.visible = on; f.material = f.userData.fillMat; }
      else if (p === 'base') { f.visible = on && !!(f.userData.baseHex || f.userData.baseMat); if (f.visible) f.material = f.userData.baseMat || basic(mapColour(f.userData.baseHex, era), f.userData.baseSide || THREE.FrontSide); }
      else if (p === 'mask') { f.visible = on && !!(f.userData.baseHex || f.userData.baseMat); f.material = basicWhite; }
      else if (p === 'linefill') { f.visible = on && (f.userData.inLineart || f.userData.occluder); f.material = depthOnly; }
    }
    if (p === 'normal') for (const h of reg.hulls) h.visible = false;
  }
  /** exporting = huge 4K / panorama targets: no MSAA there (memory); the live preview gets 4× MSAA so edges don't crawl */
  function sizeTargets(w, h, exporting = false) {
    const samples = exporting || MOBILE || !renderer.capabilities.isWebGL2 ? 0 : 4;
    if (rt.samples !== samples) { rt.dispose(); rt.samples = samples; }
    for (const t of [rt, rtN, rtL, rtM, rtP]) t.setSize(w, h);
    rtN.depthTexture.image.width = w; rtN.depthTexture.image.height = h;
    frameMat.uniforms.uRes.value.set(w, h); edgeMat.uniforms.uRes.value.set(w, h);
  }
  function noFog(fn) { const f = scene.fog; scene.fog = null; fn(); scene.fog = f; }
  /** Draw edge lines (Sobel on normals + depth) into a target; with iso, keep only lines touching that element. */
  /** Keep every line the same width: Sobel half-width, ink line width and hull width all come from state.lineW. */
  function lineSizes() {
    const vp = renderer.getDrawingBufferSize(new THREE.Vector2()), px = state.lineW * state.pxScale;
    for (const k of reg.ink) for (const mat of [k.userData.fillMat, k.userData.lineMat]) { mat.resolution.set(vp.x, vp.y); mat.linewidth = px; }
    hullMat.uniforms.uWidth.value = lineHullMat.uniforms.uWidth.value = state.lineW * 0.55 / focalPx(1080);
    return px;
  }
  function edgesInto(target, iso, colour, wobble, fade) {
    noFog(() => {
      setPass('normal'); renderer.setRenderTarget(rtN); renderer.clear(); renderer.render(scene, camera);
      if (iso) { setPass('mask', iso); renderer.setRenderTarget(rtM); renderer.clear(); renderer.render(scene, camera); }
    });
    const u = edgeMat.uniforms; u.uMaskOn.value = iso ? 1 : 0; u.uColor.value.copy(colour); u.uThick.value = state.lineW * state.pxScale * 0.5; u.uWobble.value = wobble; u.uNear.value = camera.near; u.uFar.value = camera.far;
    u.uFade.value = fade ? 1 : 0; if (scene.fog) { u.uFadeNear.value = scene.fog.near; u.uFadeFar.value = scene.fog.far; }
    renderer.setRenderTarget(target); renderer.clear(); renderer.render(edgeScene, quadCam);
  }
  const pixelBlock = () => Math.max(1, Math.round(state.pixelSize * state.pxScale));   // one art pixel, in output pixels
  /** Render one pass of the current frame into the canvas. iso = one element (holdout export). */
  function renderPass(pass, iso = null) {
    const lc = lineColour();
    renderer.setClearColor(0x000000, 0); lineSizes();
    flatU.uPix.value = (state.pixel || state.detailShade) && pass === 'final' ? 1 : 0; flatU.uPixBlock.value = state.pixel ? pixelBlock() : Math.max(2, 3 * state.pxScale); flatU.uPixContrast.value = state.pixelContrast; flatU.uPixDetail.value = state.pixelDetail; flatU.uPixDither.value = state.pixel ? state.pixelDither : 0;   // pixel art: no film grain / paper / vignette (they turn into noisy blocks)
    if (pass === 'final') {
      for (const k of reg.ink) k.userData.lineMat.color.copy(lc);
      if (state.edges) edgesInto(rtL, iso, new THREE.Color(INK), 0, true);
      frameMat.uniforms.uLineOn.value = state.edges ? 1 : 0;
      camera.updateMatrixWorld(); updateFlatLight();
      setPass('final', iso); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
      frameMat.uniforms.uMode.value = 0;
    } else if (pass === 'base') {
      noFog(() => { setPass('base', iso); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera); });
      frameMat.uniforms.uMode.value = 1;
    } else {
      lineHullMat.uniforms.uColor.value.copy(lc); inkLineMat.uniforms.uColor.value.copy(lc);
      for (const k of reg.ink) k.userData.lineMat.color.copy(lc);
      edgesInto(rt, iso, lc, state.lineWobble, false);
      noFog(() => { setPass('linefill', iso); renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = true; });
      frameMat.uniforms.uMode.value = 1;
    }
    frameMat.uniforms.uClean.value = state.pixel ? 1 : 0; frameMat.uniforms.uGrey.value = state.valueCheck && pass === 'final' ? 1 : 0;
    if (state.pixel) {   // graded picture → rtP, then snapped to the pixel grid on the way to the canvas
      renderer.setRenderTarget(rtP); renderer.clear(); renderer.render(quadScene, quadCam);
      const u = pixelMat.uniforms; u.uRes.value.copy(frameMat.uniforms.uRes.value); u.uTile.value.copy(frameMat.uniforms.uTile.value);
      u.uSize.value = pixelBlock(); u.uLevels.value = state.pixelLevels; u.uDither.value = state.pixelDither;
      renderer.setRenderTarget(null); renderer.clear(); renderer.render(pixelScene, quadCam);
    } else { renderer.setRenderTarget(null); renderer.clear(); renderer.render(quadScene, quadCam); }
    setPass('final');
  }

  /* value structure planes (cfg.layers(api, shot) → [fg, mg, far] view distances): FG darkest → sky lightest */
  function setLayers(shot) {
    let L = state.valueLayers && cfg.layers ? cfg.layers(api, shot) : null; const u = flatU.uVal.value;
    if (L && free.on && free.ctl) { const d = Math.max(2, camera.position.distanceTo(free.ctl.target)); L = [d * 0.4, d * 1.8, d * 6]; }   // free view: planes around what you look at
    if (L) u.set(L[0], L[1], L[2], state.valueStrength); else u.set(0, 0, 0, 0);
    flatU.uHaze.value.copy(scene.fog ? scene.fog.color : skyMat.uniforms.uHorizon.value);
  }

  /* timeline */
  const shots = cfg.shots; let acc = 0; for (const s of shots) { s.t0 = acc; acc += s.dur; } const TOTAL = acc;
  const shotAt = T => { for (const s of shots) if (T < s.t0 + s.dur) return s; return shots[shots.length - 1]; };
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const api = { MOBILE, THREE, scene, camera, groups, renderer, geo, toon, solid, Batch, B, buildBatches, fx, setSky, sun, hemi, ease, state, fxU, mapColour, hexToRgb, rgbToHex, register, mergeGeometries, setEl, inkLines, idMat, INK,
    lerp: (a, b, k) => a + (b - a) * k, clamp: (v, a, b) => Math.min(b, Math.max(a, v)), smooth: (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); } };
  /* leafy trees + bushes (shared by every BG): simplified but believable — tapered trunk with branches into the crown,
     a crown built from many leaf clumps (dark inner masses, a lit shell, small clumps on the rim for a leafy edge),
     clumps lighter on top / toward the sun and darker underneath, so a tree never reads as one flat ball.
     s = size (round tree ≈ 4.4 s tall), o = { leaf: [hex], trunk: hex, kind: 'round' | 'pine' | 'tall', col: hex → hex (era / mirror tint) } */
  {
    let sd = 4242; const fr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }, bt = (a, b) => a + fr() * (b - a), pk = a => a[Math.floor(fr() * a.length)];
    const LIGHT = hexToRgb('#FFF4C4'), DARK = hexToRgb('#24465A');
    const shade = (hex, f) => { const c = hexToRgb(hex), t = f >= 0 ? LIGHT : DARK, k = Math.abs(f); return rgbToHex(c.map((v, i) => v + (t[i] - v) * k)); };
    const tone = (o, hex, f) => (o.col || (h => h))(shade(hex, f));
    api.tree = (g, x, y0, z, s, o = {}) => {
      const leaf = o.leaf || ['#93CF95', '#A6D6A0', '#86C984'], trunk = o.trunk || '#C99B72', kind = o.kind || 'round', far = !!o.far;   // far: light LOD (≈ half the clumps)
      if (kind === 'pine') {
        B(g, 'capsule').add([x, y0 + 1.1 * s, z], [0.32 * s, 1.1 * s, 0.32 * s], tone(o, trunk, -0.15));
        const hex = pk(leaf), tiers = 4;
        for (let t = 0; t < tiers; t++) { const k = t / (tiers - 1), y = y0 + (1.0 + t * 0.95) * s, r = (1.55 - k * 0.95) * s, f = -0.32 + k * 0.42;
          B(g, 'cone').add([x, y, z], [r, 1.35 * s, r], tone(o, hex, f));
          const n = far ? 0 : 7 - t; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + bt(0, 0.6), rr = r * 0.92;          // drooping needle tips = jagged skirt
            B(g, 'cone').add([x + Math.sin(a) * rr, y + 0.12 * s, z + Math.cos(a) * rr], [0.32 * s, 0.6 * s, 0.32 * s], tone(o, hex, f - 0.12), [Math.cos(a) * 2.3, 0, -Math.sin(a) * 2.3]); } }
        return;
      }
      const tall = kind === 'tall', H = tall ? 1.35 : 1;
      // trunk (wider at the root), root flare, 3 branches reaching into the crown
      B(g, 'capsule').add([x, y0 + 0.95 * s * H, z], [0.42 * s, 0.95 * s * H, 0.42 * s], tone(o, trunk, -0.08));
      B(g, 'sphereLo').add([x, y0 + 0.08 * s, z], [0.5 * s, 0.22 * s, 0.5 * s], tone(o, trunk, -0.2));
      for (let i = 0; i < (far ? 1 : 3); i++) { const a = i / 3 * 6.283 + bt(0, 1), lean = 0.75;
        B(g, 'capsule').add([x + Math.sin(a) * 0.45 * s, y0 + (1.85 * H + 0.25) * s, z + Math.cos(a) * 0.45 * s], [0.15 * s, 0.6 * s, 0.15 * s], tone(o, trunk, -0.12), [Math.cos(a) * lean, 0, -Math.sin(a) * lean]); }
      // crown: ellipsoid of clumps
      const cy = y0 + (2.85 * H + 0.1) * s, rx = (tall ? 1.35 : 1.7) * s, ry = (tall ? 1.7 : 1.25) * s, base = pk(leaf);
      for (let i = 0; i < (far ? 2 : 4); i++) { const a = i / (far ? 2 : 4) * 6.283 + 0.4;                            // dark inner masses (hidden edges: no outline)
        B(g, 'sphereLo', false).add([x + Math.sin(a) * rx * 0.35, cy - ry * 0.15, z + Math.cos(a) * rx * 0.35], [rx * 0.62, ry * 0.62, rx * 0.62], tone(o, base, -0.32)); }
      const N = far ? 8 : 13;
      for (let i = 0; i < N; i++) {                                                                                       // lit shell (fibonacci sphere, no bottom)
        const yy = 1 - (i + 0.5) / N * 1.55, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = i * 2.39996 + bt(-0.2, 0.2), r = bt(0.42, 0.6) * s;
        const f = yy > 0.45 ? 0.24 : yy > 0 ? 0.08 : -0.16;
        B(g, 'sphereLo').add([x + Math.sin(a) * rr * rx * 0.82, cy + yy * ry * 0.82, z + Math.cos(a) * rr * rx * 0.82], [r, r * 0.86, r], tone(o, pk(leaf), f)); }
      const nr = far ? 5 : 12;
      for (let i = 0; i < nr; i++) {                                                                                      // small rim clumps: leafy edge
        const a = i / nr * 6.283 + bt(-0.2, 0.2), e = bt(-0.55, 0.75), r = bt(0.24, 0.36) * s;
        B(g, 'sphereLo').add([x + Math.sin(a) * rx * Math.cos(e), cy + Math.sin(e) * ry, z + Math.cos(a) * rx * Math.cos(e)], [r, r * 0.85, r], tone(o, base, e > 0.3 ? 0.3 : e < -0.2 ? -0.24 : 0.04)); }
    };
    api.bush = (g, x, y0, z, s, o = {}) => {
      const leaf = o.leaf || ['#93CF95', '#A6D6A0', '#86C984'], base = pk(leaf);
      for (let i = 0; i < 3; i++) B(g, 'sphereLo', false).add([x + (i - 1) * 0.7 * s, y0 + 0.4 * s, z + bt(-0.2, 0.2) * s], [0.62 * s, 0.5 * s, 0.6 * s], tone(o, base, -0.28));
      for (let i = 0; i < 9; i++) { const a = fr() * 3.14, u = bt(-1.15, 1.15), r = bt(0.26, 0.4) * s, yy = Math.sin(a) * 0.55;
        B(g, 'sphereLo').add([x + u * s, y0 + (0.35 + yy) * s, z + Math.cos(a) * 0.45 * s], [r, r * 0.85, r], tone(o, pk(leaf), yy > 0.3 ? 0.26 : yy > 0.1 ? 0.08 : -0.12)); }
    };
  }
  /* free view (C): look around the set from anywhere — OrbitControls on the stage + WASD / Q E to walk. The shot still
     animates (eras, water, props); only the camera pose is ours. Single-frame exports use this view; panoramas keep the shot. */
  const free = { on: false, ctl: null, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), fov: 40, keys: new Set() };
  const savePose = () => { free.pos.copy(camera.position); free.quat.copy(camera.quaternion); free.fov = camera.fov; };
  let refreshGui = () => {};
  function applyTime(T) {
    const s = shotAt(T), k = Math.min(1, (T - s.t0) / s.dur);
    fxU.four = 0; fxU.depthWarm = 0; fxU.wash = 0; fxU.black = 0; fxU.quad = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]];
    s.update(k, T - s.t0, api);
    if (free.on) { camera.position.copy(free.pos); camera.quaternion.copy(free.quat); camera.fov = free.fov; camera.near = 0.05; camera.far = Math.max(camera.far, 6000); }
    if (cfg.update) cfg.update(T, api, s, k);
    setLayers(s);
    let A = s.era, Bk = s.era, type = 'none', p = 0;
    if (s.trans) { A = s.trans.from || s.era; Bk = s.trans.to; type = s.trans.type; const [a, b] = s.trans.at || [0, 1]; p = ease(Math.min(1, Math.max(0, (k - a) / (b - a)))); }
    if (state.eraMode !== 'auto') { A = Bk = state.eraMode; type = 'none'; p = 0; }
    if (state.manual) { const mk = Math.min(1, (performance.now() - state.manual.start) / 1600); A = state.manual.from; Bk = state.manual.to; type = state.manual.type; p = ease(mk);
      if (mk >= 1) { state.eraMode = state.manual.to; state.manual = null; refreshGui(); } }
    setGrade('A', A); setGrade('B', Bk);
    const u = frameMat.uniforms;
    u.uTrType.value = TRANS[type] || 0; u.uTr.value = p;
    state.eraNow = state.eraShown = (type === 'none' || p < 0.5) ? A : Bk;
    u.uFour.value = fxU.four; u.uDepthWarm.value = fxU.depthWarm; u.uWash.value = fxU.wash; u.uBlack.value = fxU.black; fxU.quad.forEach((q, i) => u.uQuad.value[i].set(...q));
    u.uTime.value = T;
    if (scene.fog) { hullMat.uniforms.uFogColor.value.copy(scene.fog.color); hullMat.uniforms.uFogNear.value = scene.fog.near; hullMat.uniforms.uFogFar.value = scene.fog.far; hullMat.uniforms.uFogOn.value = 1; } else hullMat.uniforms.uFogOn.value = 0;
    camera.updateProjectionMatrix();
    for (const m of reg.fills) if (m.isInstancedMesh && m.userData.bsVer !== m.instanceMatrix.version) { m.computeBoundingSphere(); m.userData.bsVer = m.instanceMatrix.version; }
    return s;
  }

  /* display sizing (16:9 stage) */
  /* preview resolution: sharp by default (pixel ratio up to 2). 'auto' steps down only when frames stay really slow
     (< ~25 fps) and never bounces back up by itself — resolution changes cause a visible hitch. Exports are unaffected. */
  let autoScale = 1;
  const previewDpr = () => {
    const dev = Math.min(MOBILE ? 1.5 : 2, window.devicePixelRatio || 1);
    if (state.quality === 'high') return dev;
    if (state.quality === 'low') return Math.max(0.75, dev * 0.6);
    return Math.max(0.75, dev * autoScale);
  };
  function resize() {
    const wrap = $('#stageWrap'), pad = document.body.classList.contains('clean') ? 0 : 24, W = wrap.clientWidth - pad, H = wrap.clientHeight - pad;
    let w = W, h = W * 9 / 16; if (h > H) { h = H; w = H * 16 / 9; }
    w = Math.max(16, Math.floor(w)); h = Math.max(9, Math.floor(h));
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    const dpr = previewDpr();
    renderer.setPixelRatio(dpr); renderer.setSize(w, h);
    overlay.width = Math.round(w * dpr); overlay.height = Math.round(h * dpr); overlay.style.width = w + 'px'; overlay.style.height = h + 'px';
    sizeTargets(Math.round(w * dpr), Math.round(h * dpr));
    state.pxScale = Math.round(h * dpr) / 1080;
    invalidate();
  }
  /* only render when something changed (playing, scrubbing, GUI, resize, transition) → an idle page costs ~nothing */
  let dirty = true;
  function invalidate() { dirty = true; }
  let needResize = false;   // resized inside the render loop, right before drawing → no blank frame
  window.addEventListener('resize', () => { needResize = true; dirty = true; });

  /* overlays (screen only, never exported) */
  const project = v => { const p = v.clone().project(camera); return [(p.x * 0.5 + 0.5) * overlay.width, (1 - (p.y * 0.5 + 0.5)) * overlay.height, p.z]; };
  function drawOverlay(shot) {
    const W = overlay.width, H = overlay.height, d = Math.min(2, window.devicePixelRatio || 1), ov = state.ov;
    octx.clearRect(0, 0, W, H); octx.lineWidth = d;
    if (ov.safe) { octx.strokeStyle = 'rgba(255,255,255,.55)'; octx.setLineDash([6 * d, 5 * d]); octx.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.9); octx.strokeRect(W * 0.1, H * 0.1, W * 0.8, H * 0.8); octx.setLineDash([]); }
    if (ov.thirds) { octx.strokeStyle = 'rgba(255,255,255,.35)'; octx.beginPath(); for (const f of [1 / 3, 2 / 3]) { octx.moveTo(W * f, 0); octx.lineTo(W * f, H); octx.moveTo(0, H * f); octx.lineTo(W, H * f); } octx.stroke(); }
    if (ov.horizon) { const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0;
      if (fwd.lengthSq() > 1e-6) { const p = project(camera.position.clone().add(fwd.normalize().multiplyScalar(camera.far * 0.5)));
        if (p[2] < 1) { octx.strokeStyle = 'rgba(80,200,255,.9)'; octx.beginPath(); octx.moveTo(0, p[1]); octx.lineTo(W, p[1]); octx.stroke(); octx.fillStyle = 'rgba(80,200,255,.95)'; octx.font = `${11 * d}px system-ui`; octx.fillText('horizon / eye line', 8 * d, p[1] - 5 * d); } } }
    if (ov.vp && cfg.vanishingPoint) { const p = project(cfg.vanishingPoint(api)); if (p[2] < 1) { octx.strokeStyle = '#FFD24A'; octx.beginPath(); octx.arc(p[0], p[1], 9 * d, 0, 7); octx.moveTo(p[0] - 16 * d, p[1]); octx.lineTo(p[0] + 16 * d, p[1]); octx.moveTo(p[0], p[1] - 16 * d); octx.lineTo(p[0], p[1] + 16 * d); octx.stroke(); } }
    if (ov.staging && cfg.staging) { const st = cfg.staging(api, shot); if (st) {
      const c = st.center, s = st.size, pts = [];
      for (const x of [-1, 1]) for (const y of [0, 1]) for (const z of [-1, 1]) pts.push(project(new THREE.Vector3(c[0] + x * s[0] / 2, c[1] + y * s[1], c[2] + z * s[2] / 2)));
      if (pts.every(p => p[2] < 1)) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        octx.fillStyle = 'rgba(236,72,153,.12)'; octx.fillRect(x0, y0, x1 - x0, y1 - y0); octx.strokeStyle = '#EC4899'; octx.setLineDash([7 * d, 5 * d]); octx.strokeRect(x0, y0, x1 - x0, y1 - y0); octx.setLineDash([]);
        octx.fillStyle = '#EC4899'; octx.font = `600 ${11 * d}px system-ui`; octx.fillText('characters here · not rendered', x0 + 4 * d, y0 - 6 * d); } } }
    if (cfg.drawOverlay) cfg.drawOverlay(octx, W, H, d, api, shot);
  }

  /* timeline bar */
  const shotSel = $('#shot'), scrub = $('#scrub'), playBtn = $('#play'), tRead = $('#tread'), info = $('#info'), eraChip = $('#eraChip'), marks = $('#marks');
  shots.forEach((s, i) => { const o = document.createElement('option'); o.value = i; o.textContent = `${i + 1} · ${s.name}`; shotSel.appendChild(o); });
  if (shots.length < 2) shotSel.style.display = 'none';
  if (marks) shots.slice(1).forEach(s => { const m = document.createElement('i'); m.style.left = (s.t0 / TOTAL * 100) + '%'; marks.appendChild(m); });
  scrub.max = TOTAL; scrub.step = 1 / 24;
  const setScrub = () => { scrub.value = state.T; scrub.style.setProperty('--p', (state.T / TOTAL * 100).toFixed(2) + '%'); };
  const setPlaying = on => { state.playing = on; playBtn.classList.toggle('on', on); playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play'); playBtn.title = (on ? 'Pause' : 'Play') + ' (Space)'; invalidate(); };
  const seek = T => { state.T = Math.min(TOTAL - 1e-3, Math.max(0, T)); setScrub(); invalidate(); };
  shotSel.onchange = () => { seek(shots[+shotSel.value].t0 + 0.001); shotSel.blur(); };
  scrub.oninput = () => { setPlaying(false); seek(+scrub.value); };
  playBtn.onclick = () => setPlaying(!state.playing);
  setPlaying(state.playing);
  $('#title').textContent = cfg.title; document.title = cfg.title + ' · Sirpeltric BG';

  /* top-bar tools + keyboard: Space play · ←/→ one frame (Shift = 1 s) · 1–9 shot · G guides · H clean view · F fullscreen · ? help */
  const GUIDE_KEYS = ['thirds', 'safe', 'horizon', 'staging'];
  const guidesOn = () => GUIDE_KEYS.some(k => state.ov[k]);
  const btnGuides = $('#btnGuides'), btnClean = $('#btnClean'), btnFull = $('#btnFull'), btnHelp = $('#btnHelp'), help = $('#help');
  const btnSettings = $('#btnSettings');
  const syncTools = () => { btnGuides?.classList.toggle('on', guidesOn()); btnClean?.classList.toggle('on', document.body.classList.contains('clean')); btnSettings?.classList.toggle('on', document.body.classList.contains('settings')); };
  const toggleSettings = force => { document.body.classList.toggle('settings', force); syncTools(); };
  btnSettings && (btnSettings.onclick = () => toggleSettings());
  const toggleGuides = () => { const on = !guidesOn(); GUIDE_KEYS.forEach(k => state.ov[k] = on && (k !== 'staging' || !!cfg.staging)); refreshGui(); syncTools(); invalidate(); };
  const toggleClean = () => { document.body.classList.toggle('clean'); syncTools(); resize(); };
  const toggleFull = () => { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.(); };
  const toggleHelp = force => { if (!help) return; help.hidden = force !== undefined ? !force : !help.hidden; };
  btnGuides && (btnGuides.onclick = toggleGuides); btnClean && (btnClean.onclick = toggleClean); btnFull && (btnFull.onclick = toggleFull); btnHelp && (btnHelp.onclick = () => toggleHelp());
  const btnFree = $('#btnFree'), freeHint = $('#freeHint');
  let OrbitControlsP = null;
  async function setFree(on) {
    if (on === free.on || busy) return;
    if (on) {
      OrbitControlsP ||= import('three/addons/controls/OrbitControls.js').then(m => m.OrbitControls);
      const OrbitControls = await OrbitControlsP;
      setPlaying(false); applyTime(state.T); camera.updateMatrixWorld();             // start from the shot's own camera
      const st = cfg.staging && cfg.staging(api, shotAt(state.T)), dir = camera.getWorldDirection(new THREE.Vector3());
      let dist = st ? camera.position.distanceTo(new THREE.Vector3(...st.center)) : 12; if (!(dist > 0.5 && dist < 2000)) dist = 12;
      if (camera.fov < 10) { camera.fov = 40; camera.position.addScaledVector(dir, camera.position.distanceTo(new THREE.Vector3(...(st ? st.center : [0, 0, 0]))) - 40); dist = 40; }   // near-ortho strip cams
      camera.up.set(0, 1, 0);
      if (!free.ctl) { free.ctl = new OrbitControls(camera, stage); free.ctl.screenSpacePanning = true; free.ctl.zoomSpeed = 0.8; free.ctl.rotateSpeed = 0.6; free.ctl.maxPolarAngle = Math.PI * 0.495;   // never below the ground
        free.ctl.addEventListener('change', () => { if (free.on) { savePose(); invalidate(); } }); }
      free.ctl.target.copy(camera.position).addScaledVector(dir, dist); free.ctl.enabled = true; free.on = true; free.ctl.update(); savePose();
    } else { free.on = false; if (free.ctl) free.ctl.enabled = false; free.keys.clear(); }
    document.body.classList.toggle('free', free.on); btnFree?.classList.toggle('on', free.on); if (freeHint) freeHint.hidden = !free.on; invalidate();
  }
  /** WASD walk (camera-relative, on the ground plane), Q / E down / up, Shift = faster; called every frame */
  function freeWalk(dt) {
    if (!free.on || !free.keys.size || !free.ctl) return;
    const f = camera.getWorldDirection(new THREE.Vector3()); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)), m = new THREE.Vector3(), K = free.keys;
    if (K.has('w')) m.add(f); if (K.has('s')) m.sub(f); if (K.has('d')) m.add(r); if (K.has('a')) m.sub(r); if (K.has('e')) m.y += 1; if (K.has('q')) m.y -= 1;
    if (!m.lengthSq()) return;
    const sp = Math.max(1.5, camera.position.distanceTo(free.ctl.target)) * 0.9 * (K.has('shift') ? 3 : 1);
    m.normalize().multiplyScalar(sp * dt); camera.position.add(m); free.ctl.target.add(m); free.ctl.update();
  }
  btnFree && (btnFree.onclick = () => setFree(!free.on));
  window.addEventListener('keyup', e => { free.keys.delete(e.key.toLowerCase()); if (e.key === 'Shift') free.keys.delete('shift'); });
  window.addEventListener('blur', () => free.keys.clear());
  help?.addEventListener('click', e => { if (e.target === help || e.target.closest('[data-close]')) toggleHelp(false); });
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || busy) return;
    const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' && e.target.type !== 'range' || tag === 'select' || tag === 'textarea' || e.target.closest?.('.tp-dfwv')) return;
    const k = e.key;
    if (free.on) {   // free view: WASD / Q E walk, R back to the shot camera; these keys do nothing else meanwhile
      const lk = k.toLowerCase();
      if ('wasdqe'.includes(lk) && lk.length === 1) { e.preventDefault(); free.keys.add(lk); if (e.shiftKey) free.keys.add('shift'); return; }
      if (k === 'Shift') { free.keys.add('shift'); return; }
      if (lk === 'r') { setFree(false).then(() => setFree(true)); return; }
      if (k === 'Escape') { setFree(false); return; }
    }
    if (k === 'c' || k === 'C') { setFree(!free.on); return; }
    if (k === ' ') { e.preventDefault(); setPlaying(!state.playing); }
    else if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); setPlaying(false); seek(state.T + (k === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 : 1 / 24)); }
    else if (k === 'Home') { seek(0); }
    else if (/^[1-9]$/.test(k) && shots[+k - 1]) seek(shots[+k - 1].t0 + 0.001);
    else if (k === 'g' || k === 'G') toggleGuides();
    else if (k === 'h' || k === 'H') toggleClean();
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'v' || k === 'V') { state.valueCheck = !state.valueCheck; refreshGui(); }
    else if (k === 'p' || k === 'P') { state.pixel = !state.pixel; setShading(state.shading); refreshGui(); }
    else if (k === '?' || k === '/') toggleHelp();
    else if (k === 'e' || k === 'E') toggleMenu();
    else if (k === 's' || k === 'S') toggleSettings();
    else if (k === '[') window.__sceneNav?.prev();
    else if (k === ']') window.__sceneNav?.next();
    else if (k === 'Escape') { toggleHelp(false); toggleMenu(false); toggleSettings(false); if (document.body.classList.contains('clean')) toggleClean(); }
  });
  document.addEventListener('fullscreenchange', () => { btnFull?.classList.toggle('on', !!document.fullscreenElement); });

  /* ── exports ── */
  /* export menu (one button → grouped menu) + a toast for progress */
  const menu = $('#exportMenu'), exportBtn = $('#exportBtn'), status = $('#status'), note = $('#exportNote'), bar = menu;
  let toastTimer = 0;
  const toast = (msg, kind = 'busy', hold = 0) => { status.textContent = msg; status.className = 'show ' + kind; clearTimeout(toastTimer); if (hold) toastTimer = setTimeout(() => { status.className = ''; }, hold); };
  const toggleMenu = force => { const open = force ?? menu.hidden; if (open && busy) return; menu.hidden = !open; exportBtn.setAttribute('aria-expanded', String(open)); if (open) { lastKey = ''; refreshExportLabels(); } };
  exportBtn.onclick = () => toggleMenu();
  menu.querySelector('[data-close]').onclick = () => toggleMenu(false);
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !exportBtn.contains(e.target)) toggleMenu(false); });
  menu.querySelectorAll('.seg button').forEach(b => b.onclick = () => { state.exportMode = b.dataset.mode; lastKey = ''; refreshExportLabels(); refreshGui(); });
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tick0 = () => new Promise(r => setTimeout(r, 20));
  const toBlob = c => new Promise(r => c.toBlob(r, 'image/png'));
  let downloadSink = null;   // batch mode (index page): files go to the parent page instead of the browser
  function download(blob, name) { if (downloadSink) return downloadSink(blob, name); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000); }
  const focalPx = H => (H / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  api.focalPx = focalPx;
  function withExportSize(w, h, fn) {
    const prevPR = renderer.getPixelRatio();
    renderer.setPixelRatio(1); renderer.setSize(w, h, false); sizeTargets(w, h, true); state.pxScale = EXPORT_H / 1080;
    try { fn(); } finally { camera.clearViewOffset(); frameMat.uniforms.uTile.value.set(0, 0, 1, 1); frameMat.uniforms.uNoVig.value = 0; renderer.setPixelRatio(prevPR); resize(); applyTime(state.T); }
  }
  /** Single 4K frame (tiles if the GPU limit is smaller). */
  function captureFrame(pass, iso, W = EXPORT_W, H = EXPORT_H) {
    const out = document.createElement('canvas'); out.width = W; out.height = H; const c2 = out.getContext('2d');
    if (pass === 'lineart' && state.whiteBg) { c2.fillStyle = '#fff'; c2.fillRect(0, 0, W, H); }
    const tw = Math.min(W, MAX_RB), th = Math.min(H, MAX_RB), nx = Math.ceil(W / tw), ny = Math.ceil(H / th);
    withExportSize(tw, th, () => {
      frameMat.uniforms.uRes.value.set(W, H);
      for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
        if (nx * ny > 1) { camera.setViewOffset(W, H, ix * tw, iy * th, tw, th); frameMat.uniforms.uTile.value.set(ix * tw / W, 1 - (iy + 1) * th / H, tw / W, th / H); }
        camera.updateProjectionMatrix(); renderPass(pass, iso);
        c2.drawImage(renderer.domElement, 0, 0, tw, th, ix * tw, iy * th, tw, th);
      }
    });
    return out;
  }
  /** One long panorama: thin slices along the shot's camera move, stitched side by side.
      shot.pano = { from, to, axis: 'x'|'y', reverse, pxPerUnit(H, api), setup(s, api), label } */
  function capturePano(pass, iso, spec, H = EXPORT_H) {
    const frameW = Math.round(H * 16 / 9), frameH = H, along = spec.axis === 'y';
    spec.setup(spec.from, api); camera.updateProjectionMatrix();
    const ppu = spec.pxPerUnit(frameH, api);
    let total = Math.abs(spec.to - spec.from) * ppu, scale = 1;
    if (total > MAX_SIDE) { scale = MAX_SIDE / total; total = MAX_SIDE; }
    const slice = Math.max(16, Math.min(256, Math.floor(frameW / 8))), M = state.pixel ? Math.max(12, Math.ceil(state.pixelSize * H / 1080)) : 12, n = Math.ceil(total / slice);
    const PW = along ? frameW : n * slice, PH = along ? n * slice : frameH;
    const out = document.createElement('canvas'); out.width = PW; out.height = PH; const c2 = out.getContext('2d');
    if (pass === 'lineart' && state.whiteBg) { c2.fillStyle = '#fff'; c2.fillRect(0, 0, PW, PH); }
    const era = state.eraShown, u = frameMat.uniforms, dir = Math.sign(spec.to - spec.from) || 1, du = slice / ppu / scale * dir;
    withExportSize(along ? frameW : slice + 2 * M, along ? slice + 2 * M : frameH, () => {
      u.uRes.value.set(PW, PH);
      for (let i = 0; i < n; i++) {
        spec.setup(spec.from + (i + 0.5) * du, api);
        u.uFour.value = 0; u.uNoVig.value = 1; u.uTrType.value = 0; u.uWash.value = 0; u.uBlack.value = 0; setGrade('A', era); setGrade('B', era);    // one continuous painting
        const p0 = (spec.reverse ? n - 1 - i : i) * slice;
        if (along) { camera.setViewOffset(frameW, frameH, 0, (frameH - slice) / 2 - M, frameW, slice + 2 * M); u.uTile.value.set(0, 1 - (p0 + slice + M) / PH, 1, (slice + 2 * M) / PH); }
        else { camera.setViewOffset(frameW, frameH, (frameW - slice) / 2 - M, 0, slice + 2 * M, frameH); u.uTile.value.set((p0 - M) / PW, 0, (slice + 2 * M) / PW, 1); }
        camera.updateProjectionMatrix(); renderPass(pass, iso);
        if (along) c2.drawImage(renderer.domElement, 0, M, frameW, slice, 0, p0, frameW, slice);
        else c2.drawImage(renderer.domElement, M, 0, slice, frameH, p0, 0, slice, frameH);
      }
    });
    return out;
  }
  const curPano = () => state.exportMode === 'pano' ? shotAt(state.T).pano || null : null;
  const grab = (pass, iso) => { const p = curPano(); return p ? capturePano(pass, iso, p) : captureFrame(pass, iso); };
  const baseName = () => { const s = shotAt(state.T); return `${cfg.id}_${slug(s.name)}_${curPano() ? 'panorama' : 'f' + String(Math.round(state.T * 24)).padStart(3, '0') + '_4k'}`; };
  let busy = false;
  async function job(btn, label, fn) {
    if (busy) return; busy = true; const was = state.playing; state.playing = false;
    toggleMenu(false); exportBtn.disabled = true; bar.querySelectorAll('.mi').forEach(b => b.disabled = true);
    const ld = $('#ldText'), ldWas = ld?.innerHTML; if (ld) ld.innerHTML = `Exporting ${label}…<small>Rendering at full quality — the preview comes back when it is done.</small>`;
    document.body.classList.add('exporting'); toast(label + ' — starting…');
    try { await fn(msg => toast(msg)); toast(label + ' saved', 'done', 3500); }
    catch (e) { console.error(e); toast('Export failed: ' + e.message, 'err', 7000); }
    document.body.classList.remove('exporting'); if (ld) ld.innerHTML = ldWas;
    exportBtn.disabled = false; bar.querySelectorAll('.mi').forEach(b => b.disabled = false); state.playing = was; busy = false; invalidate();
  }
  const PASS_NAME = { final: 'colour', lineart: 'lineart', base: 'basecolor' };
  async function single(pass, btn, label) {
    await job(btn, label, async say => {
      say(`${label} — ${curPano() ? 'stitching the long panorama' : 'rendering 3840×2160'}…`); await tick0(); applyTime(state.T);
      const c = grab(pass, null); say(`${label} — encoding ${c.width}×${c.height} PNG…`); await tick0();
      download(await toBlob(c), `${baseName()}_${PASS_NAME[pass]}.png`);
    });
  }
  async function zipSet(btn) {
    await job(btn, 'ZIP per element', async say => {
      say('ZIP — loading the zip library…'); await loadZip();
      const zip = new JSZip(), passes = ['final', 'lineart', 'base'], els = exportElements(); let n = 0; const total = passes.length * (els.length + 1);
      const order = [];
      for (const p of passes) {
        say(`ZIP — ${PASS_NAME[p]} / full (${++n}/${total})`); await tick0(); applyTime(state.T);
        zip.file(`${PASS_NAME[p]}/00_full_${PASS_NAME[p]}.png`, await toBlob(grab(p, null)));
        let i = 1;
        for (const el of els) {
          say(`ZIP — ${PASS_NAME[p]} / ${el} (${++n}/${total})`); await tick0(); applyTime(state.T);
          const name = `${String(i++).padStart(2, '0')}_${slug(el)}_${PASS_NAME[p]}.png`; zip.file(`${PASS_NAME[p]}/${name}`, await toBlob(grab(p, el)));
          if (p === 'final') order.push(name.replace('_colour.png', ''));
        }
      }
      zip.file('README.txt', `${cfg.title}\nShot: ${shotAt(state.T).name}\nFormat: ${curPano() ? 'long panorama (' + curPano().label + ')' : '3840x2160 frame'}\n\nFolders: colour/ lineart/ basecolor/ — one PNG per element + 00_full.\nEach element PNG only has the parts the camera really sees (holdout),\nso stacking all element PNGs of a folder rebuilds 00_full in any order.\nElements: ${order.join(', ')}\nBackground only — no characters.\n`);
      say('ZIP — compressing…'); await tick0();
      download(await zip.generateAsync({ type: 'blob' }), `${baseName()}_elements.zip`);
    });
  }
  const exportElements = () => elements.filter(e => e !== 'scene' && state.elVis[e] !== false && hasContent(e));
  const hasContent = e => [...reg.fills, ...reg.ink, ...reg.fx].some(o => o.userData.el === e);
  const ICON = {
    colour: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 18"/><circle cx="15.5" cy="8.5" r="1.5"/>',
    line: '<path d="M4 18c3-6 5-9 8-9s3 5 8 3M4 12c2-3 4-5 6-5"/>',
    fill: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    layers: '<path d="M12 4l8 4-8 4-8-4 8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    extra: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
  };
  /** one row in the export menu: icon · title · one-line description */
  const mkItem = (sec, icon, title, desc, fn, primary = false) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mi' + (primary ? ' primary' : '');
    b.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[icon]}</svg></span><span><b></b><small></small></span>`;
    const set = (t, d) => { b.querySelector('b').textContent = t; b.querySelector('small').textContent = d; };
    set(title, desc); b.onclick = () => fn(b); $(sec).appendChild(b); $(sec).classList.remove('empty'); return { b, set };
  };
  const mainItems = [
    mkItem('#expImages', 'colour', '', '', b => single('final', b, 'Colour PNG'), true),
    mkItem('#expImages', 'line', '', '', b => single('lineart', b, 'Lineart PNG')),
    mkItem('#expImages', 'fill', '', '', b => single('base', b, 'Base colour PNG')),
    mkItem('#expImages', 'layers', '', '', b => zipSet(b)),
  ];
  const ITEM_TEXT = {
    pano: [['Colour · long panorama', 'The whole camera move as one painting, 2160 px tall'], ['Lineart · long panorama', 'Lines only, transparent background'],
      ['Base colour · long panorama', 'Flat fills only — clean areas for the magic wand'], ['Every element · ZIP', 'One PNG per element for colour, lineart and base colour']],
    frame: [['Colour · 4K frame', 'This frame at 3840 × 2160'], ['Lineart · 4K frame', 'Lines only, transparent background'],
      ['Base colour · 4K frame', 'Flat fills only — clean areas for the magic wand'], ['Every element · ZIP', 'One PNG per element for colour, lineart and base colour'], ],
  };
  let lastKey = '';
  function refreshExportLabels() {
    const s = shotAt(state.T), k = curPano() ? 'pano' : 'frame', key = k + state.exportMode + shots.indexOf(s); if (key === lastKey || busy) return; lastKey = key;
    mainItems.forEach((it, i) => it.set(...ITEM_TEXT[k][i]));
    menu.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.exportMode)));
    note.textContent = k === 'pano' ? `This shot: ${s.pano.label} · width grows with the camera move` : (state.exportMode === 'pano' ? 'This shot has no camera travel, so it exports a single 4K frame' : 'The current frame of this shot · 3840 × 2160');
  }
  /* ── 3D export for Blender (.glb, glTF 2.0) ──
     one object per element (instances baked into plain meshes with vertex colours), ink lines as edges,
     and the shot camera with its animation (24 fps). Blender: File › Import › glTF 2.0. */
  function bakeGeometry(src, matrix, colour) {
    const pos = src.attributes.position, nor = src.attributes.normal, idx = src.index, vc = pos.count;
    const P = new Float32Array(vc * 3), N = new Float32Array(vc * 3), Cc = new Float32Array(vc * 3);
    const nm = new THREE.Matrix3().getNormalMatrix(matrix), v = new THREE.Vector3();
    for (let j = 0; j < vc; j++) {
      v.fromBufferAttribute(pos, j).applyMatrix4(matrix); P.set([v.x, v.y, v.z], j * 3);
      if (nor) { v.fromBufferAttribute(nor, j).applyMatrix3(nm).normalize(); N.set([v.x, v.y, v.z], j * 3); }
      Cc.set([colour.r, colour.g, colour.b], j * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); if (nor) g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    if (idx) g.setIndex(Array.from(idx.array)); if (matrix.determinant() < 0 && idx) { const a = g.index.array; for (let k = 0; k < a.length; k += 3) { const t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t; } }
    if (!nor) g.computeVertexNormals();
    return g;
  }
  function merged(list) { const ok = list.filter(Boolean); if (!ok.length) return null; if (ok.length === 1) return ok[0]; return mergeGeometries(ok.map(g => g.index ? g : g.setIndex([...Array(g.attributes.position.count).keys()]))); }
  let lowMap = null;
  const lowGeo = g => {
    if (!lowMap) lowMap = new Map([[geo.sphere, new THREE.SphereGeometry(1, 14, 10)], [geo.sphereLo, new THREE.SphereGeometry(1, 10, 7)], [geo.capsule, new THREE.CapsuleGeometry(0.5, 1, 3, 8)],
      [geo.rbox, new RoundedBoxGeometry(1, 1, 1, 2, 0.16)], [geo.rboxSoft, new RoundedBoxGeometry(1, 1, 1, 2, 0.3)], [geo.cone, lathe([[0, 0], [1, 0], [0.98, 0.08], [0.55, 0.62], [0.18, 0.95], [0, 1]], 10)],
      [geo.rcyl, lathe(rcPts, 12)], [geo.halfSphere, new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2)]]);
    return lowMap.get(g) || g;
  };
  let lightMap = null;   // even coarser copies for light .obj / .stl files
  const lightGeo = g => {
    if (!lightMap) lightMap = new Map([[geo.sphere, new THREE.SphereGeometry(1, 10, 7)], [geo.sphereLo, new THREE.SphereGeometry(1, 8, 6)], [geo.capsule, new THREE.CapsuleGeometry(0.5, 1, 2, 6)],
      [geo.rbox, new RoundedBoxGeometry(1, 1, 1, 1, 0.16)], [geo.rboxSoft, new RoundedBoxGeometry(1, 1, 1, 1, 0.3)], [geo.cone, lathe([[0, 0], [1, 0], [0.98, 0.08], [0.55, 0.62], [0.18, 0.95], [0, 1]], 8)],
      [geo.rcyl, lathe(rcPts, 8)], [geo.halfSphere, new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2)]]);
    return lightMap.get(g) || lowGeo(g);
  };
  const stdCache = new Map();
  const stdMat = hex => { if (!stdCache.has(hex)) stdCache.set(hex, new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 1, metalness: 0, name: hex })); return stdCache.get(hex); };
  async function export3D(say) {
    if (state.glbMode === 'instanced') return export3DInstanced(say);
    scene.updateMatrixWorld(true);
    const root = new THREE.Group(); root.name = cfg.id + '_' + slug(cfg.title);
    const els = new Map(), elGroup = name => { if (!els.has(name)) { const g = new THREE.Group(); g.name = name; root.add(g); els.set(name, { g, geos: [], mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, name: name }) }); } return els.get(name); };
    const shown = o => state.elVis[o.userData.el] !== false && o.visible !== false;
    // solid shapes: one mesh per element × colour, the colour on the material (not on every vertex) → about half the file size
    for (const { el, hex, geo: g } of await collectSolids(say, { fx: false })) { const mm = new THREE.Mesh(g, stdMat(hex)); mm.name = `${el}_${hex.replace('#', '')}`; elGroup(el).g.add(mm); }
    // flat pieces (ground, roads, river…) with their own colour or texture
    for (const f of reg.fx) {
      const mat = f.userData.fillMat; if (!shown(f) || !(mat && (mat.isMeshToonMaterial || mat.isMeshBasicMaterial || mat.isMeshStandardMaterial)) || !f.geometry) continue;
      const g = f.geometry.clone().applyMatrix4(f.matrixWorld);
      const out = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: mat.color ? mat.color.clone() : 0xffffff, map: mat.map || null, roughness: 1, metalness: 0, side: THREE.DoubleSide, name: f.userData.el }));
      out.name = f.userData.el + '_flat'; elGroup(f.userData.el).g.add(out);
    }
    // ink lines → edges
    for (const k of reg.ink) {
      k.renderOrder = 2;
      if (!shown(k) || !k.geometry.attributes.instanceStart) continue;
      const arr = k.geometry.attributes.instanceStart.data.array, g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3)); g.applyMatrix4(k.matrixWorld);
      const ls = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(INK), name: 'ink' })); ls.name = k.userData.el + '_ink'; elGroup(k.userData.el).g.add(ls);
    }
    // the shot camera, animated over the current shot at 24 fps
    const s = shotAt(state.T), cam = new THREE.PerspectiveCamera(camera.fov, 16 / 9, camera.near, camera.far); cam.name = 'ShotCamera';
    const times = [], P = [], Q = [], T0 = state.T, frames = Math.max(1, Math.round(s.dur * 24));
    for (let i = 0; i <= frames; i++) { applyTime(s.t0 + Math.min(s.dur - 1e-4, i / 24)); camera.updateMatrixWorld(); times.push(i / 24); P.push(...camera.position.toArray()); Q.push(...camera.quaternion.toArray()); }
    applyTime(T0); cam.position.copy(camera.position); cam.quaternion.copy(camera.quaternion); cam.fov = camera.fov; root.add(cam);
    const clip = new THREE.AnimationClip(slug(s.name), -1, [new THREE.VectorKeyframeTrack('ShotCamera.position', times, P), new THREE.QuaternionKeyframeTrack('ShotCamera.quaternion', times, Q)]);
    say('3D — writing .glb…'); await tick0();
    const GLTFExporter = await loadGLTF(); const data = await new Promise((res, rej) => new GLTFExporter().parse(root, res, rej, { binary: true, animations: [clip] }));
    download(new Blob([data], { type: 'model/gltf-binary' }), `${cfg.id}_${slug(s.name)}_scene.glb`);
  }
  /** small .glb: every instanced batch becomes one instanced mesh per colour (Blender 3.6+ imports them as linked copies) */
  async function export3DInstanced(say) {
    scene.updateMatrixWorld(true);
    const root = new THREE.Group(); root.name = cfg.id + '_' + slug(cfg.title);
    const groupsByEl = new Map(), elG = name => { if (!groupsByEl.has(name)) { const g = new THREE.Group(); g.name = name; root.add(g); groupsByEl.set(name, g); } return groupsByEl.get(name); };
    const shown = o => state.elVis[o.userData.el] !== false && o.visible !== false && (!o.parent || o.parent.visible !== false);
    const m = new THREE.Matrix4(); let n = 0;
    for (const mesh of reg.fills) {
      if (!shown(mesh)) continue;
      const g = elG(mesh.userData.el), lg = lowGeo(mesh.geometry);
      if (mesh.isInstancedMesh) {
        const byHex = new Map(); mesh.userData.hexes.forEach((h, i) => { if (!byHex.has(h)) byHex.set(h, []); byHex.get(h).push(i); });
        for (const [hex, idx] of byHex) {
          const im = new THREE.InstancedMesh(lg, stdMat(hex), idx.length); im.name = `${mesh.userData.el}_${hex.replace('#', '')}`;
          idx.forEach((i, j) => { mesh.getMatrixAt(i, m); im.setMatrixAt(j, m); });
          mesh.matrixWorld.decompose(im.position, im.quaternion, im.scale); g.add(im);
        }
      } else { const mm = new THREE.Mesh(lg, stdMat(mesh.userData.baseHex)); mesh.matrixWorld.decompose(mm.position, mm.quaternion, mm.scale); mm.name = mesh.userData.el; g.add(mm); }
      if (++n % 40 === 0) { say(`3D — collecting ${n} objects…`); await tick0(); }
    }
    for (const f of reg.fx) {
      const mat = f.userData.fillMat; if (!shown(f) || !(mat && (mat.isMeshToonMaterial || mat.isMeshBasicMaterial || mat.isMeshStandardMaterial)) || !f.geometry || !f.isMesh) continue;
      const out = new THREE.Mesh(f.geometry, new THREE.MeshStandardMaterial({ color: mat.color ? mat.color.clone() : 0xffffff, map: mat.map || null, roughness: 1, metalness: 0, side: THREE.DoubleSide, name: f.userData.el }));
      f.matrixWorld.decompose(out.position, out.quaternion, out.scale); out.name = f.userData.el + '_flat'; elG(f.userData.el).add(out);
    }
    for (const k of reg.ink) {
      if (!shown(k) || !k.geometry.attributes.instanceStart) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(k.geometry.attributes.instanceStart.data.array), 3)); g.applyMatrix4(k.matrixWorld);
      const ls = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(INK), name: 'ink' })); ls.name = k.userData.el + '_ink'; elG(k.userData.el).add(ls);
    }
    const s = shotAt(state.T), cam = new THREE.PerspectiveCamera(camera.fov, 16 / 9, camera.near, camera.far); cam.name = 'ShotCamera';
    const times = [], P = [], Q = [], T0 = state.T, frames = Math.max(1, Math.round(s.dur * 24));
    for (let i = 0; i <= frames; i++) { applyTime(s.t0 + Math.min(s.dur - 1e-4, i / 24)); camera.updateMatrixWorld(); times.push(i / 24); P.push(...camera.position.toArray()); Q.push(...camera.quaternion.toArray()); }
    applyTime(T0); cam.position.copy(camera.position); cam.quaternion.copy(camera.quaternion); root.add(cam);
    const clip = new THREE.AnimationClip(slug(s.name), -1, [new THREE.VectorKeyframeTrack('ShotCamera.position', times, P), new THREE.QuaternionKeyframeTrack('ShotCamera.quaternion', times, Q)]);
    say('3D — writing .glb…'); await tick0();
    const GLTFExporter = await loadGLTF(); const data = await new Promise((res, rej) => new GLTFExporter().parse(root, res, rej, { binary: true, animations: [clip] }));
    download(new Blob([data], { type: 'model/gltf-binary' }), `${cfg.id}_${slug(s.name)}_scene.glb`);
    return data.byteLength;
  }
  /* ── OBJ (+ .mtl colours) and STL: plain baked meshes in world space, one part per element × colour ── */
  const visibleDeep = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
  /** world-space position + normal only (so every part merges cleanly) */
  function bakePN(src, matrix) {
    const pos = src.attributes.position, nor = src.attributes.normal, vc = pos.count;
    const P = new Float32Array(vc * 3), N = new Float32Array(vc * 3), nm = new THREE.Matrix3().getNormalMatrix(matrix), v = new THREE.Vector3();
    for (let j = 0; j < vc; j++) {
      v.fromBufferAttribute(pos, j).applyMatrix4(matrix); P[j * 3] = v.x; P[j * 3 + 1] = v.y; P[j * 3 + 2] = v.z;
      if (nor) { v.fromBufferAttribute(nor, j).applyMatrix3(nm).normalize(); N[j * 3] = v.x; N[j * 3 + 1] = v.y; N[j * 3 + 2] = v.z; }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    let idx = src.index ? Array.from(src.index.array) : [...Array(vc).keys()];
    if (matrix.determinant() < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }   // mirrored copies keep their faces outward
    g.setIndex(idx); if (!nor) g.computeVertexNormals();
    return g;
  }
  /** → [{ el, hex, geo }] merged per element × colour, only what is visible (elements panel + scene toggles) */
  async function collectSolids(say, { fx = true } = {}) {
    scene.updateMatrixWorld(true);
    const parts = new Map(), put = (el, hex, g) => { const k = el + '|' + hex; if (!parts.has(k)) parts.set(k, { el, hex, list: [] }); parts.get(k).list.push(g); };
    const shown = o => state.elVis[o.userData.el] !== false && visibleDeep(o);
    const m = new THREE.Matrix4(); let n = 0;
    for (const mesh of reg.fills) {
      if (!shown(mesh)) continue;
      const lg = state.meshDetail === 'light' ? lightGeo(mesh.geometry) : lowGeo(mesh.geometry);
      if (mesh.isInstancedMesh) mesh.userData.hexes.forEach((hex, i) => { mesh.getMatrixAt(i, m); m.premultiply(mesh.matrixWorld); put(mesh.userData.el, hex, bakePN(lg, m)); });
      else put(mesh.userData.el, mesh.userData.baseHex, bakePN(lg, mesh.matrixWorld));
      if (++n % 40 === 0) { say(`3D — baking ${n} objects…`); await tick0(); }
    }
    if (fx) for (const f of reg.fx) {   // flat pieces: ground, roads, river…
      const mat = f.userData.fillMat;
      if (!f.isMesh || !f.geometry || !shown(f) || !(mat && (mat.isMeshToonMaterial || mat.isMeshBasicMaterial || mat.isMeshStandardMaterial))) continue;
      put(f.userData.el, f.userData.baseHex || '#' + (mat.color ? mat.color.getHexString() : 'ffffff'), bakePN(f.geometry, f.matrixWorld));
    }
    say('3D — merging…'); await tick0();
    return [...parts.values()].map(p => ({ el: p.el, hex: p.hex, geo: p.list.length === 1 ? p.list[0] : mergeGeometries(p.list) })).filter(p => p.geo);
  }
  const fileBase = () => `${cfg.id}_${slug(shotAt(state.T).name)}_scene`;
  async function exportOBJ(say) {
    await loadZip();
    const solids = await collectSolids(say), name = fileBase(), out = [], mtl = [`# ${cfg.title} — colours for ${name}.obj\n`], mats = new Set();
    out.push(`# ${cfg.title} · ${shotAt(state.T).name}\n# Sirpeltric BG · flat colour per part (see ${name}.mtl) · Y up · 1 unit = 1 m\nmtllib ${name}.mtl\n`);
    let base = 1, i = 0;
    for (const { el, hex, geo } of solids) {
      const id = hex.replace('#', '').toLowerCase(), mn = 'c_' + id;
      if (!mats.has(mn)) { mats.add(mn); const c = new THREE.Color(hex).toArray().map(v => v.toFixed(4)).join(' ') /* linear: Blender reads Kd as linear */; mtl.push(`newmtl ${mn}\nKa 0 0 0\nKd ${c}\nKs 0 0 0\nd 1\nillum 1\n`); }
      const P = geo.attributes.position.array, N = geo.attributes.normal.array, I = geo.index.array, vc = P.length / 3, lines = [`o ${slug(el)}_${id}\nusemtl ${mn}\n`];
      for (let j = 0; j < vc; j++) lines.push(`v ${+P[j * 3].toFixed(4)} ${+P[j * 3 + 1].toFixed(4)} ${+P[j * 3 + 2].toFixed(4)}\n`);
      for (let j = 0; j < vc; j++) lines.push(`vn ${+N[j * 3].toFixed(3)} ${+N[j * 3 + 1].toFixed(3)} ${+N[j * 3 + 2].toFixed(3)}\n`);
      for (let k = 0; k < I.length; k += 3) { const a = I[k] + base, b = I[k + 1] + base, c = I[k + 2] + base; lines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}\n`); }
      out.push(lines.join('')); base += vc;
      if (++i % 20 === 0) { say(`OBJ — writing ${i}/${solids.length} parts…`); await tick0(); }
    }
    say('OBJ — compressing…'); await tick0();
    const zip = new JSZip(); zip.file(`${name}.obj`, new Blob(out)); zip.file(`${name}.mtl`, mtl.join('\n'));
    zip.file('README.txt', `${cfg.title}\nShot: ${shotAt(state.T).name}\n\n${name}.obj + ${name}.mtl — one object per element × colour, flat colours in the .mtl.\nBlender: File › Import › Wavefront (.obj), keep both files in the same folder.\nBackground only — no characters. Ink lines and the camera are not part of OBJ (use the .glb for those).\n`);
    download(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), `${name}_obj.zip`);
  }
  async function exportSTL(say) {
    const [STLExporter, solids] = await Promise.all([loadSTL(), collectSolids(say)]);
    const root = new THREE.Group(); for (const { el, hex, geo } of solids) { const mm = new THREE.Mesh(geo); mm.name = el + '_' + hex; root.add(mm); }
    say('STL — writing binary .stl…'); await tick0();
    const data = new STLExporter().parse(root, { binary: true });
    download(new Blob([data], { type: 'model/stl' }), `${fileBase()}.stl`);
  }
  mkItem('#exp3d', 'cube', '.glb — Blender', 'Animated shot camera + ink lines · File › Import › glTF 2.0', b => job(b, '3D .glb', export3D));
  mkItem('#exp3d', 'cube', '.obj + .mtl', 'Flat colours per element, zipped · works in most 3D apps', b => job(b, '3D .obj', exportOBJ));
  mkItem('#exp3d', 'cube', '.stl', 'Shapes only, no colour · 3D printing or sculpting tools', b => job(b, '3D .stl', exportSTL));

  api.exportExtra = (label, fn) => mkItem('#expExtra', 'extra', label, 'Scene-specific export', b => job(b, label, async say => { await loadZip(); return fn({ say, captureFrame, capturePano, toBlob, download, zip: () => new JSZip(), applyTime, tick: tick0, state }); }));

  /* ── build scene ── */
  setEl('scene');
  cfg.build(api);
  buildBatches();
  elements.forEach(e => { if (state.elVis[e] === undefined) state.elVis[e] = true; });
  setShading(state.shading);

  /* ── settings panel: Tweakpane 4, opens from the gear button (S) so it never covers the picture ──
     a tiny lil-gui-style adapter keeps the scene code simple: f.add(obj, key, options | min, max, step).name().onChange() */
  const pane = new Pane({ title: 'Settings', expanded: true });
  const pretty = k => String(k).replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());   // 'night-lights' → 'Night lights'
  const wrap = tp => ({
    add(obj, key, a, b, c) {
      if (typeof obj[key] === 'function') { const btn = tp.addButton({ title: key }); btn.on('click', () => obj[key]()); return { name(n) { btn.title = n; return this; }, onChange() { return this; } }; }
      const p = { label: pretty(key) }; if (a && typeof a === 'object') p.options = a; else if (typeof a === 'number') { p.min = a; p.max = b; if (c !== undefined) p.step = c; }
      const bind = tp.addBinding(obj, key, p), hs = []; bind.on('change', e => hs.forEach(h => h(e.value)));
      return { name(n) { bind.label = pretty(n); return this; }, onChange(fn) { hs.push(fn); return this; } };
    },
    addFolder(title, expanded = false) { return wrap(tp.addFolder({ title: pretty(title), expanded })); },
    close() { tp.expanded = false; return this; }, open() { tp.expanded = true; return this; },
  });
  const gui = wrap(pane);
  const fLook = gui.addFolder('Look', true);
  fLook.add(state, 'shading', { 'Flat 2D (Chiikawa)': 'flat', 'Flat + cel shadow (Kirby)': 'cel', 'Soft 3D toon (old look)': 'toon' }).name('Style').onChange(setShading);
  fLook.add(state, 'detailShade').name('Detail shading (light ramp, leaf clumps, cloud billows)');
  fLook.add(state, 'pixelContrast', 0.6, 2, 0.05).name('Light / shadow contrast');
  fLook.add(state, 'pixelDetail', 0, 1, 0.05).name('Leaf / cloud detail');
  fLook.add(state, 'skyBands', 0, 8, 1).name('Sky bands').onChange(v => { if (state.shading !== 'toon') skyMat.uniforms.uBands.value = v; });
  fLook.add(state, 'fogSteps', 0, 8, 1).name('Ground tint steps').onChange(v => flatU.uFogSteps.value = v);
  fLook.add(state, 'edges').name('Ink lines'); fLook.add(state, 'lineW', 1, 6, 0.1).name('Line width (px at 1080p)'); fLook.add(state, 'outlines').name('Extra outline');
  const fVal = gui.addFolder('Depth / value structure', true);
  fVal.add(state, 'valueLayers').name('FG · MG · BG value planes');
  fVal.add(state, 'valueStrength', 0, 1, 0.05).name('Plane contrast');
  fVal.add(state, 'valueCheck').name('Value check (grey, V)');
  const fPix = gui.addFolder('Pixel art (2D game)', true);
  fPix.add(state, 'pixel').name('Pixel art (P)').onChange(() => setShading(state.shading));
  fPix.add(state, 'pixelSize', 2, 16, 1).name('Pixel size (px at 1080p)');
  fPix.add(state, 'pixelDither', 0, 1, 0.05).name('Dither between tones');
  fPix.add(state, 'pixelLevels', 0, 32, 1).name('Posterize (0 = off)');
  fLook.add(state, 'quality', { 'Auto (sharp, lowers if slow)': 'auto', 'High (always sharp)': 'high', 'Low (fastest)': 'low' }).name('Preview quality').onChange(() => { autoScale = 1; resize(); });
  const fEra = gui.addFolder('Era');
  const briefEras = cfg.eras || ERA_KEYS;                      // only the eras in this BG's brief
  const eraOpts = { 'Timeline (brief)': 'auto' }; briefEras.forEach(k => eraOpts[ERAS[k].label] = k);
  const nextOpts = {}; briefEras.forEach(k => nextOpts[ERAS[k].label] = k);
  if (!briefEras.includes(state.nextEra)) state.nextEra = briefEras[0];
  fEra.add(state, 'eraMode', eraOpts).name('Era look');
  fEra.add(state, 'nextEra', nextOpts).name('Transition to');
  fEra.add(state, 'waveType', { 'Red wave (sweep)': 'wave', 'Red wave (rotating 360°)': 'radial', 'Colour bleed': 'fade', 'Crack': 'crack' }).name('Transition style');
  fEra.add({ go: () => { state.manual = { from: state.eraMode === 'auto' ? state.eraNow : state.eraMode, to: state.nextEra, type: state.waveType, start: performance.now() }; } }, 'go').name('▶  Play transition');
  const fExp = gui.addFolder('Export options');
  fExp.add(state, 'exportMode', { 'Long panorama': 'pano', 'Single 4K frame': 'frame' }).name('Image format').onChange(() => { lastKey = ''; refreshExportLabels(); });
  fExp.add(state, 'lineColour', { 'Ink #8A6B64 (team)': 'ink', 'Dark brown #5A3A30': 'dark', 'Black': 'black' }).name('Lineart colour');
  fExp.add(state, 'lineWobble', 0, 2, 0.05).name('Hand wobble');
  fExp.add(state, 'whiteBg').name('Lineart on white');
  fExp.add(state, 'glbMode', { 'Instanced · small (Blender 3.6+)': 'instanced', 'Baked · one mesh per element': 'baked' }).name('.glb mode');
  fExp.add(state, 'meshDetail', { 'Medium (smooth)': 'medium', 'Light (small file)': 'light' }).name('3D detail (baked .glb, .obj, .stl)');
  const fEl = gui.addFolder('Elements (own PNG each)');
  elements.filter(e => e !== 'scene' && hasContent(e)).forEach(e => fEl.add(state.elVis, e));
  const fOv = gui.addFolder('Guides (screen only)');
  fOv.add(state.ov, 'thirds').name('Rule of thirds'); fOv.add(state.ov, 'safe').name('Title / action safe'); fOv.add(state.ov, 'horizon').name('Horizon / eye line');
  if (cfg.vanishingPoint) fOv.add(state.ov, 'vp').name('Vanishing point');
  if (cfg.staging) fOv.add(state.ov, 'staging').name('Staging guide');
  refreshGui = () => { pane.refresh(); invalidate(); };
  if (cfg.gui) cfg.gui(gui.addFolder(cfg.guiTitle || 'Scene', true), api, refreshGui);
  pane.on('change', () => { invalidate(); syncTools(); });
  resize(); syncTools();

  const qs = new URLSearchParams(location.search), batch = qs.get('batch') && window.parent !== window ? { format: qs.get('batch'), glb: qs.get('glb'), detail: qs.get('detail'), shot: qs.get('shot') } : null;
  if (batch) { state.playing = false; parent.postMessage({ source: 'sirpeltric', id: cfg.id, type: 'sp-progress', message: 'scene loaded' }, '*'); }
  /* loop — renders only when playing or when something changed */
  let last = performance.now(), slowAcc = 0, slowN = 0, slowHits = 0, firstFrame = true;
  function frame(now) {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;   // first rAF stamp can be older than performance.now()
    if (state.playing && !busy) { state.T += dt; if (state.T >= TOTAL) state.T = 0; setScrub(); }
    freeWalk(dt);
    if (!busy && (state.playing || dirty || state.manual)) {
      if (needResize) { needResize = false; resize(); slowAcc = slowN = 0; }
      dirty = false;
      const s = applyTime(state.T);
      renderPass('final');
      drawOverlay(s);
      shotSel.value = shots.indexOf(s);
      const mm = 12 / Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2);
      tRead.textContent = `${state.T.toFixed(2)}s / ${TOTAL.toFixed(1)}s · ${mm.toFixed(0)}mm`;
      const eraLabel = (ERAS[state.eraNow] || ERAS.base).label;
      info.textContent = s.name; if (eraChip) eraChip.textContent = eraLabel;
      refreshExportLabels();
      if (firstFrame) { firstFrame = false; document.body.classList.add('ready'); if (batch) setTimeout(runBatch, 50); }
      // auto quality: while playing, step the preview resolution down if frames are slow, back up when there is headroom
      if (state.playing && state.quality === 'auto' && dt > 0 && dt < 0.1 && autoScale > 0.6) {
        slowAcc += dt; slowN++;
        if (slowN >= 90) { const avg = slowAcc / slowN; slowAcc = slowN = 0;
          slowHits = avg > 0.04 ? slowHits + 1 : 0;                                  // two slow windows in a row (~3 s)
          if (slowHits >= 2) { slowHits = 0; autoScale = Math.max(0.6, autoScale - 0.2); resize(); } }
      }
    }
    requestAnimationFrame(frame);
  }
  setScrub();
  requestAnimationFrame(frame);
  window.__app = { api, state, applyTime, renderPass, captureFrame, capturePano, shots, elements, reg, export3D, exportOBJ, exportSTL, invalidate, setShading };

  /* ── batch mode: the index page opens this scene in a hidden frame with ?batch=glb|obj|stl and gets the file back.
     ?glb=baked|instanced · ?detail=medium|light · ?shot=N (camera of shot N, default 1). Messages: sp-progress / sp-file / sp-done / sp-error ── */
  function runBatch() {
    const tell = m => parent.postMessage({ source: 'sirpeltric', id: cfg.id, ...m }, '*');
    if (batch.glb) state.glbMode = batch.glb === 'instanced' ? 'instanced' : 'baked';
    if (batch.detail) state.meshDetail = batch.detail === 'light' ? 'light' : 'medium';
    const shot = shots[Math.max(0, Math.min(shots.length - 1, (+batch.shot || 1) - 1))];
    state.playing = false; state.T = shot.t0 + 0.001; applyTime(state.T);
    downloadSink = (blob, name) => tell({ type: 'sp-file', name, blob });
    const fn = { glb: export3D, obj: exportOBJ, stl: exportSTL }[batch.format];
    if (!fn) return tell({ type: 'sp-error', message: 'unknown format ' + batch.format });
    Promise.resolve(fn(msg => tell({ type: 'sp-progress', message: msg })))
      .then(() => tell({ type: 'sp-done' }), e => { console.error(e); tell({ type: 'sp-error', message: e.message || String(e) }); });
  }
}
