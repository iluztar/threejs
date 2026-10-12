import { startApp } from './core.js';
/* BG 6 · Forward pathway · storyboard scenes 21–24 (scene 22 is the main one)
   Brief eras: Sc 21–22 full colour (the BG fades during the truck-out) · Sc 23–24 the last warp hole → grey → black (bookend to 1945 values).
   Refs read: Kirby Green Greens illustration (round trees, white puffy clouds), Kirby Waddle Dee Town path, Kawaguchiko momiji tunnel with Fuji,
   English tree tunnels, Dülmen / Epping / Lammassari forest paths, FRI Museum arcade (repetition), We Bare Bears road with fence and the
   movie's pines, Doraemon Time Tunnel (purple/teal swirl, floating ring clocks), Chiikawa field (dashes, tufts).
   Background only: the path centre stays clear; the dolly zoom keeps an invisible subject point the same size. */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(2400);
const L = 12, N = 18, SPAN = L * N, WARP_X = 4000, SIDE_D = 5000;
const C = { path: '#F3E3B5', edge: '#E3CFA0', grass: '#A6D68A', green: ['#A6D6A0', '#B8E2A9', '#93CF95', '#8CCB7E'], pine: ['#7FB98A', '#6FAE80', '#8CC496'], trunk: '#E2C1A4',
  fence: '#D9B48A', lamp: '#8C93A3', bulb: '#FFF3C2', flower: ['#F6B9CF', '#FFF3B0', '#FFFFFF', '#C9B8F0'], rock: ['#C9C4D6', '#BDB8CC'], log: '#B98A6A', mount: '#B9B3E3', snow: '#F4F0FA' };
const S = { modules: [] };
const opts = { trees: 'round' };

function build(api) {
  const { THREE, groups: G, geo, solid, B, fx, setEl, inkLines } = api;
  const { SKY, BG, MG, FG } = G;

  setEl('ground');
  fx(new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: C.grass })), BG, { baseHex: C.grass, normalPass: true }).position.y = -0.02;

  /* repeating modules (each its own group so it can wrap around the camera) */
  for (let m = 0; m < N; m++) {
    const g = new THREE.Group(); MG.add(g); S.modules.push({ g, z0: -m * L });
    const r = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(500 + m);
    const bt = (a, b) => a + r() * (b - a), pk = a => a[Math.floor(r() * a.length)];
    setEl('path');
    solid(geo.rboxSoft, C.path, g, { pos: [0, 0.05, -L / 2], scale: [4.4, 0.22, L + 0.02] });
    for (const s of [-1, 1]) B(g, 'capsule').add([s * 2.25, 0.12, -L / 2], [0.36, L * 0.5, 0.36], C.edge, [Math.PI / 2, 0, 0]);
    setEl('trees');
    for (const s of [-1, 1]) { const x = s * bt(5.5, 7), z = -bt(2, 10), k = bt(1.1, 1.5);
      const round = new THREE.Group(), pine = new THREE.Group(), arch = new THREE.Group(); g.add(round, pine, arch); (S.styles = S.styles || []).push({ round, pine, arch });
      B(round, 'capsule').add([x, 1.3 * k, z], [0.6 * k, 1.5 * k, 0.6 * k], C.trunk); B(round, 'sphere').add([x, 3.7 * k, z], 1.9 * k, pk(C.green)); B(round, 'sphere').add([x + 1.2 * k * s, 3.1 * k, z + 0.4], 1.4 * k, pk(C.green)); B(round, 'sphere').add([x - 1.1 * k * s, 3.2 * k, z - 0.3], 1.4 * k, pk(C.green));
      B(pine, 'capsule').add([x, 1.0 * k, z], [0.45 * k, 1.2 * k, 0.45 * k], C.trunk); for (let t = 0; t < 3; t++) B(pine, 'cone').add([x, (1.6 + t * 1.5) * k, z], [(2.2 - t * 0.55) * k, 2.4 * k, (2.2 - t * 0.55) * k], pk(C.pine));
      B(arch, 'capsule').add([s * 4.2, 2.6, z], [0.55, 4.6, 0.55], C.trunk, [0, 0, -s * 0.18]); B(arch, 'sphere').add([s * 3.4, 6.4, z], [3, 2.4, 2.6], pk(C.green)); B(arch, 'sphere').add([0, 7.6, z], [3.2, 1.8, 2.6], pk(C.green)); }
    setEl('bushes');
    for (let i = 0; i < 3; i++) { const s = r() < 0.5 ? -1 : 1, x = s * bt(3.4, 9), z = -bt(0, L); for (let k = 0; k < 3; k++) B(g, 'sphere').add([x + (k - 1) * 0.7, 0.4, z + bt(-0.3, 0.3)], [bt(0.6, 0.9), bt(0.5, 0.7), 0.7], pk(C.green)); }
    setEl('lamps');
    if (m % 2 === 0) { const s = m % 4 === 0 ? 1 : -1; B(g, 'capsule').add([s * 3.1, 1.6, -L / 2], [0.16, 3, 0.16], C.lamp); B(g, 'sphere').add([s * 3.1, 3.4, -L / 2], 0.42, C.bulb); }
    setEl('fences');
    for (let k = 0; k < 4; k++) { const z = -k * 3 - 0.5; B(g, 'capsule').add([-3.9, 0.55, z], [0.16, 0.9, 0.16], C.fence); B(g, 'rbox').add([-3.9, 0.75, z - 1.5], [0.1, 0.14, 3], C.fence); B(g, 'rbox').add([-3.9, 0.4, z - 1.5], [0.1, 0.12, 3], C.fence); }
    setEl('flowers');
    for (let i = 0; i < 9; i++) { const s = r() < 0.5 ? -1 : 1, x = s * bt(2.8, 8), z = -bt(0, L); B(g, 'capsule').add([x, 0.17, z], [0.05, 0.34, 0.05], '#7CBF70'); B(g, 'sphereLo').add([x, 0.4, z], [0.17, 0.1, 0.17], pk(C.flower)); }
    setEl('grass');
    for (let i = 0; i < 12; i++) { const s = r() < 0.5 ? -1 : 1, x = s * bt(2.7, 9), z = -bt(0, L), k = bt(0.35, 0.6); for (let j = -2; j <= 2; j++) B(g, 'cone').add([x + j * 0.2 * k, 0, z], [0.16 * k, (1.1 - Math.abs(j) * 0.2) * k, 0.16 * k], pk(['#8FCB80', '#7CBF70']), [0, 0, j * 0.28]); }
    setEl('rocks');
    if (r() < 0.6) { const s = r() < 0.5 ? -1 : 1, x = s * bt(3, 7), z = -bt(1, L - 1), k = bt(0.4, 0.9); B(g, 'sphereLo').add([x, k * 0.25, z], [k, k * 0.6, k * 0.85], pk(C.rock)); }
    setEl('logs');
    if (m % 5 === 2) { const s = m % 2 ? 1 : -1; B(g, 'capsule').add([s * 7.5, 0.3, -6], [0.6, 2.4, 0.6], C.log, [Math.PI / 2, 0.6, 0]); }
    setEl('dashes');
    { const segs = [], cols = []; for (let i = 0; i < 10; i++) { const s = r() < 0.5 ? -1 : 1, x = s * bt(2.8, 9), z = -bt(0, L), Lh = bt(0.3, 0.6); segs.push(x, 0.02, z, x + Lh, 0.02, z); cols.push('#8A6B64'); } inkLines(segs, cols, g); }
  }

  /* vanishing point: soft mountain with a pastel cap (Fuji at the end of the momiji tunnel) + clouds */
  setEl('mountain');
  solid(geo.cone, C.mount, BG, { pos: [0, -1, -900], scale: [420, 260, 200] }); solid(geo.cone, C.snow, BG, { pos: [0, 168, -905], scale: [130, 92, 66] });
  for (const [x, h] of [[-520, 120], [480, 140], [-300, 90], [330, 80]]) solid(geo.cone, '#C9C3EA', BG, { pos: [x, -1, -820], scale: [h * 1.8, h, 120] });
  setEl('clouds');
  for (let i = 0; i < 18; i++) { const x = (rand() - 0.5) * 1400, y = 60 + rand() * 180, z = -500 - rand() * 600, s = 18 + rand() * 30, n = 3 + Math.floor(rand() * 4);
    for (let k = 0; k < n; k++) B(SKY, 'sphereLo').add([x + (k - n / 2) * s * 0.9, y + (k % 2) * s * 0.3, z], [s, s * 0.8, s * 0.6], '#FFFFFF'); }

  /* the warp tunnel (Doraemon Time Tunnel), far away so it never shows in the path shots */
  setEl('warp');
  const tw = new THREE.Group(); tw.position.x = WARP_X; BG.add(tw); S.warp = tw;
  S.warpMat = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uTime; varying vec2 vUv; void main(){ float a = vUv.x * 6.2831, s = sin(a * 3.0 + vUv.y * 40.0 - uTime * 6.0); vec3 c = mix(vec3(0.36, 0.25, 0.63), vec3(0.25, 0.75, 0.78), smoothstep(-0.2, 0.6, s)); c = mix(c, vec3(0.86, 0.36, 0.78), smoothstep(0.85, 1.0, sin(a * 7.0 - vUv.y * 22.0 + uTime * 3.0)) * 0.6); gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0); }' });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 400, 48, 1, true).rotateX(Math.PI / 2), S.warpMat); tube.position.z = -180;
  fx(tube, tw, { baseHex: '#5B3FA0', normalPass: true });
  { const segs = [], cols = []; for (let h = 0; h < 6; h++) for (let i = 0; i < 160; i++) { const a0 = h / 6 * 6.283 + i * 0.12, a1 = a0 + 0.12, z0 = 10 - i * 2.4, z1 = z0 - 2.4;
      segs.push(Math.cos(a0) * 8.9, Math.sin(a0) * 8.9, z0, Math.cos(a1) * 8.9, Math.sin(a1) * 8.9, z1); cols.push('#7FE0E6'); } inkLines(segs, cols, tw); }
  for (let i = 0; i < 26; i++) { const a = rand() * 6.283, rr = 3 + rand() * 4.5, z = -10 - rand() * 330, s = 0.8 + rand() * 1.2, col = ['#F27AC4', '#7FE0A0', '#7FE0E6', '#FFE38A'][i % 4];
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr; solid(geo.torus, col, tw, { pos: [x, y, z], scale: [s, s, s * 1.2], rot: [rand(), rand(), 0] });
    solid(geo.rcyl, '#FFFDF6', tw, { pos: [x, y, z], scale: [s * 0.85, 0.05, s * 0.85], rot: [Math.PI / 2 + 0.3, 0, 0] });
    solid(geo.capsule, '#5B3FA0', tw, { pos: [x, y + s * 0.25, z + 0.06], scale: [0.06, s * 0.5, 0.06] }); }
  setStyle(opts.trees);
}
function setStyle(v) { for (const st of S.styles || []) { st.round.visible = v === 'round'; st.pine.visible = v === 'pine'; st.arch.visible = v === 'arch'; } }
/** wrap the modules around a camera z so the path never ends (seamless loop) */
function layout(camZ) { for (const md of S.modules) { const z = md.z0; md.g.position.z = camZ + 2 * L - (((camZ + 2 * L - z) % SPAN) + SPAN) % SPAN; } }

const look = (api, p, t, fovDeg, near = 0.1, far = 4000) => { const { camera } = api; camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...t); camera.fov = fovDeg; camera.near = near; camera.far = far; };
const mm = v => 2 * Math.atan(12 / v) * 180 / Math.PI;
const sideCam = (api, z) => { layout(z); api.scene.fog = null; look(api, [SIDE_D, 3.4, z], [0, 3.4, z], 2 * Math.atan(7.5 / SIDE_D) * 180 / Math.PI, SIDE_D - 30, SIDE_D + 40); };

const shots = [
  { name: 'Sc 21 · slow truck out, BG fades', dur: 5, era: 'colour',
    update(k, ts, api) { const z = api.lerp(0, 9, api.ease(k)); layout(z); look(api, [0, 1.6, z], [0, 1.5, z - 30], mm(28)); api.fxU.wash = api.smooth(0.2, 1, k) * 0.85; },
    pano: { label: 'side strip of the path rows', axis: 'x', from: 0, to: -SPAN, reverse: false, pxPerUnit: (H, api) => api.focalPx(H) / SIDE_D, setup: (s, api) => sideCam(api, s) } },
  { name: 'Sc 22 · dolly zoom on the path (loops)', dur: 8, era: 'colour',
    update(k, ts, api) { const subj = -40 + 10 * k, d = api.lerp(6, 22, api.ease(k)), z = subj + d; layout(z);
      look(api, [0, 1.5, z], [0, 1.3, subj - 20], 2 * Math.atan(3 / d) * 180 / Math.PI); this.subj = subj; },
    pano: { label: 'side strip of the path rows', axis: 'x', from: 0, to: -SPAN, reverse: false, pxPerUnit: (H, api) => api.focalPx(H) / SIDE_D, setup: (s, api) => sideCam(api, s) } },
  { name: 'Sc 23–24 · warp hole → grey → black', dur: 6, era: 'colour', trans: { type: 'fade', to: 'warp', at: [0.25, 0.65] },
    update(k, ts, api) { const z = api.lerp(30, -140, api.ease(k)); look(api, [WARP_X, 0, z], [WARP_X, 0, z - 40], mm(20)); api.fxU.black = api.smooth(0.72, 1, k); } },
];

startApp({
  id: 'bg6', title: 'BG 6 · Forward pathway — Scene 22', fov: 40, shots, build,
  eras: ['colour', 'warp'],
  update(T, api) { const { hemi, sun, setSky, scene, THREE } = api; if (S.warpMat) S.warpMat.uniforms.uTime.value = T;
    setSky('#7FC4EE', '#EAF6FB', '#EAF6FB', { baseHex: '#9FD3F0' }); hemi.intensity = 2.2; hemi.color.set('#FFFFFF'); hemi.groundColor.set('#C9D9A8'); sun.intensity = 1.0; sun.position.set(-0.5, 1, 0.6);
    if (!scene.fog) scene.fog = new THREE.Fog('#EAF6FB', 120, 1100); },
  vanishingPoint: api => new api.THREE.Vector3(0, 1.5, api.camera.position.z - 3000),
  staging: (api, shot) => shot === shots[1] ? { center: [0, 0, shot.subj || -30], size: [2.6, 1.3, 1.4] } : null,
  guiTitle: 'BG 6 · Path',
  gui(f) { f.add(opts, 'trees', { 'Round trees (Kirby)': 'round', 'Pines (WBB)': 'pine', 'Tree tunnel arches': 'arch' }).name('Tree style').onChange(setStyle); },
});
