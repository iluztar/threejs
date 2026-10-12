import { startApp } from './core.js';
/* BG 4 · Mirrored background · storyboard scenes 11–18
   Brief eras: Sc 11 red wave → 1970s · Sc 12–14 mirrored platform, B&W close-up (1945 values) · Sc 15 rotating red wave → 1980s ·
   Sc 16 wave → 1990s (wide) · Sc 17–18 4-box mirrored BG, a colour per side (full colour).
   Refs read: Salar de Uyuni (pink→blue horizon, perfect reflection, cloud-patch ripples), Kanuti / Norway lakes (mirrored clouds),
   Schloss Buldern on a lily pond, Jefferson Memorial at night, a neon waterfront at night (1980s mood),
   Kirby & the Amazing Mirror (white pillars with glass orbs, arches, cloudscape, sparkles), Inception folding city.
   The reflection is a real mirrored copy (darker, softer) so every export has it; the platform stays empty (characters). */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(1975);
const pick = a => a[Math.floor(rand() * a.length)];
const between = (a, b) => a + rand() * (b - a);
const FOLD_Z = 90;
const C = { cloud: ['#FFFFFF', '#FDF6FA', '#F4F7FF'], platform: '#F7F4FA', rim: '#E6E0F2', gold: '#F5D27A', pillar: '#F4F2FA', orb: '#CFEFFF', arch: '#F1EEF8', island: '#FFFFFF' };
const S = {}; const opts = { fold: 0, ring: true };

function build(api) {
  const { THREE, groups: G, geo, solid, B, fx, setEl, inkLines, hexToRgb, rgbToHex } = api;
  const { SKY, BG, MG, FG } = G;
  const darken = h => { const c = hexToRgb(h), t = [0.36, 0.43, 0.61]; return rgbToHex(c.map((v, i) => (v + (t[i] - v) * 0.18) * 0.86)); };

  /** the world above the mirror; built twice (the second time mirrored, darker, as one "reflection" element) */
  function world(parent, mirror) {
    const el = n => setEl(mirror ? 'reflection' : n), col = h => mirror ? darken(h) : h;
    const r0 = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(77);   // same layout both times
    const bt = (a, b) => a + r0() * (b - a);
    el('platform');
    solid(geo.rcyl, col(C.platform), parent, { pos: [0, -0.2, 0], scale: [6.4, 1, 6.4] });
    solid(geo.torus, col(C.rim), parent, { pos: [0, 0.82, 0], scale: [6.2, 6.2, 2.4], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; solid(geo.capsule, col(C.platform), parent, { pos: [Math.sin(a) * 5.9, 1.3, Math.cos(a) * 5.9], scale: [0.3, 0.9, 0.3] }); solid(geo.sphere, col(C.gold), parent, { pos: [Math.sin(a) * 5.9, 2.0, Math.cos(a) * 5.9], scale: 0.28 }); }
    el('pillars');
    for (const s of [-1, 1]) { solid(geo.rcyl, col(C.rim), parent, { pos: [s * 8, 0, -9], scale: [1.6, 1, 1.6] }); solid(geo.capsule, col(C.pillar), parent, { pos: [s * 8, 8, -9], scale: [2.2, 13, 2.2] });
      solid(geo.rcyl, col(C.rim), parent, { pos: [s * 8, 14.6, -9], scale: [1.7, 0.8, 1.7] }); solid(geo.sphere, col(C.orb), parent, { pos: [s * 8, 16.8, -9], scale: 1.7 }); }
    el('mirror-ring');
    const ring = solid(geo.torus, col(C.gold), parent, { pos: [0, 8.5, -9.5], scale: [5.4, 5.4, 4], rot: [0, 0, 0] }); ring.userData.ringToggle = true; S.rings = S.rings || []; S.rings.push(ring);
    el('arches');
    for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, R = 185, x = Math.sin(a) * R, z = Math.cos(a) * R, ry = a;
      for (const s of [-1, 1]) solid(geo.capsule, col(C.arch), parent, { pos: [x + Math.cos(ry) * s * 7, 9, z - Math.sin(ry) * s * 7], scale: [2.4, 16, 2.4] });
      const top = new THREE.TorusGeometry(7, 1.2, 10, 24, Math.PI); solid(top, col(C.arch), parent, { pos: [x, 17, z], rot: [0, ry, 0] }); }
    el('clouds');
    for (let i = 0; i < 46; i++) {                                            // banks around the horizon + higher puffs, varied sizes
      const a = r0() * 6.283, d = bt(120, 420), high = r0() < 0.35, s = high ? bt(4, 9) : bt(9, 24), n = high ? 3 + Math.floor(r0() * 2) : 5 + Math.floor(r0() * 4);
      const y = high ? bt(30, 70) : bt(2, 10), x = Math.sin(a) * d, z = Math.cos(a) * d, tx = Math.cos(a), tz = -Math.sin(a);
      for (let k = 0; k < n; k++) { const u = (k - (n - 1) / 2) / Math.max(1, (n - 1) / 2), r = s * (1 - Math.abs(u) * 0.4) * bt(0.8, 1.15), off = u * s * n * 0.42;
        B(parent, 'sphereLo').add([x + tx * off, y + r * 0.55 + bt(0, 0.3) * s, z + tz * off], [r, r * 0.8, r * 0.75], col(pick(C.cloud))); } }
    el('cloud-islands');
    for (let i = 0; i < 7; i++) { const a = bt(-1.2, 1.2) + (r0() < 0.5 ? 0 : Math.PI), d = bt(45, 95), x = Math.sin(a) * d, z = -Math.cos(a) * d, y = bt(14, 26), s = bt(4, 7);
      for (let k = 0; k < 5; k++) B(parent, 'sphereLo').add([x + (k - 2) * s * 0.8, y + (k % 2) * s * 0.3, z + bt(-1, 1)], [s, s * 0.6, s * 0.8], col(C.island));
      B(parent, 'cone').add([x, y - s * 0.3, z], [s * 1.6, s * 1.2, s * 1.6], col('#F3EEFA'), [Math.PI, 0, 0]); }
  }

  /* sky (pink → blue, Uyuni) */
  api.setSky('#8FC3F0', '#FBD9E4', '#FBD9E4', { baseHex: '#B9D6F2' });
  world(MG, false);
  const pivot = new THREE.Group(); pivot.position.set(0, 0, -FOLD_Z); BG.add(pivot); S.pivot = pivot;
  const refl = new THREE.Group(); refl.position.set(0, 0, FOLD_Z); refl.scale.y = -1; pivot.add(refl);
  world(refl, true);

  /* water film: ripples + a soft darkening (colour render); ripple rings and sparkles as ink */
  setEl('water');
  S.waterMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float uTime; varying vec3 vW; void main(){ float r = length(vW.xz); float ring = smoothstep(0.85, 1.0, sin(r * 1.4 - uTime * 2.0)) * smoothstep(40.0, 8.0, r) * 0.25; float a = 0.12 + ring; gl_FragColor = vec4(pow(mix(vec3(0.55, 0.62, 0.8), vec3(1.0), ring * 3.0), vec3(2.2)), a); }' });
  fx(new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), S.waterMat), FG, { occluder: false }).renderOrder = 1;
  { const segs = [], cols = [];
    for (const [cx, cz, rr] of [[0, 0, 8.5], [0, 0, 11], [0, 0, 14], [14, 18, 3], [-18, 10, 2.4], [24, -20, 4], [-30, 26, 3.2]]) for (let k = 0; k < 40; k++) { if (k % 5 === 4) continue; const a0 = k / 40 * 6.283, a1 = (k + 1) / 40 * 6.283;
      segs.push(cx + Math.cos(a0) * rr, 0.02, cz + Math.sin(a0) * rr, cx + Math.cos(a1) * rr, 0.02, cz + Math.sin(a1) * rr); cols.push('#C9C2E6'); }
    inkLines(segs, cols, FG); }
  setEl('sparkles');
  { const segs = [], cols = [];
    for (let i = 0; i < 140; i++) { const a = rand() * 6.283, d = between(30, 260), x = Math.sin(a) * d, z = Math.cos(a) * d, y = between(8, 90), s = between(0.6, 2.2) * d / 80;
      segs.push(x - s, y, z, x + s, y, z, x, y - s, z, x, y + s, z); cols.push('#FFF6C8', '#FFF6C8'); }
    inkLines(segs, cols, SKY); }
  setFold(opts.fold);
}
function setFold(v) { if (S.pivot) S.pivot.rotation.x = -v * Math.PI / 2; }

const look = (api, p, t, mm = 28) => { const { camera } = api; camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...t); camera.fov = 2 * Math.atan(12 / mm) * 180 / Math.PI; camera.near = 0.1; camera.far = 3000; };
/** long panorama of a shot: the camera turns in place (seamless) ±75° around its view to the platform */
const panFrom = (p, t, mm, label) => { const yaw0 = Math.atan2(t[0] - p[0], -(t[2] - p[2])), pitch = Math.atan2(t[1] - p[1], Math.hypot(t[0] - p[0], t[2] - p[2]));
  return { label, axis: 'x', from: yaw0 - 1.3, to: yaw0 + 1.3, reverse: false, pxPerUnit: (H, api) => api.focalPx(H),
    setup: (s, api) => look(api, p, [p[0] + Math.sin(s) * 10, p[1] + Math.tan(pitch) * 10, p[2] - Math.cos(s) * 10], mm) }; };

const shots = [
  { name: 'Sc 11 · wide, red wave → 1970s', dur: 5, era: 'e1960', trans: { type: 'wave', to: 'e1970', at: [0.15, 0.8] },
    update(k, ts, api) { const a = api.lerp(-0.25, 0.25, api.ease(k)); look(api, [Math.sin(a) * 42, 7, Math.cos(a) * 42], [0, 3, 0], 26); },
    pano: panFrom([0, 7, 42], [0, 3, 0], 26, '150° pan · wide') },
  { name: 'Sc 12–14 · platform → B&W close-up', dur: 5, era: 'e1970', trans: { type: 'fade', to: 'e1945', at: [0.6, 0.95] },
    update(k, ts, api) { const e = api.ease(k); look(api, [api.lerp(3, 1, e), api.lerp(3.6, 2.4, e), api.lerp(18, 8, e)], [0, 1.6, 0], api.lerp(32, 50, e)); },
    pano: panFrom([3, 3.6, 18], [0, 1.6, 0], 32, '150° pan · platform') },
  { name: 'Sc 15 · rotating red wave → 1980s', dur: 5, era: 'e1945', trans: { type: 'radial', to: 'e1980', at: [0.1, 0.9] },
    update(k, ts, api) { const a = api.lerp(0.4, -0.2, k); look(api, [Math.sin(a) * 24, 4.5, Math.cos(a) * 24], [0, 3.5, 0], 30); },
    pano: panFrom([0, 4.5, 24], [0, 3.5, 0], 30, '150° pan · mid') },
  { name: 'Sc 16 · high wide, wave → 1990s', dur: 5, era: 'e1980', trans: { type: 'wave', to: 'e1990', at: [0.15, 0.85] },
    update(k, ts, api) { const e = api.ease(k); look(api, [0, api.lerp(26, 32, e), api.lerp(66, 74, e)], [0, 0, -10], 24); },
    pano: panFrom([0, 30, 70], [0, 0, -10], 24, '150° pan · high wide') },
  { name: 'Sc 17–18 · 4-box, colour per side', dur: 6, era: 'e1990', trans: { type: 'fade', to: 'colour', at: [0, 0.3] },
    update(k, ts, api) { const e = api.ease(k); look(api, [0, api.lerp(5, 3.6, e), api.lerp(30, 20, e)], [0, 2.5, 0], 28);
      api.fxU.four = 1; api.fxU.quad = [[1.06, 1.0, 0.84], [1.06, 0.9, 0.98], [0.9, 1.06, 0.95], [0.88, 0.97, 1.1]]; },
    pano: panFrom([0, 5, 30], [0, 2.5, 0], 28, '150° pan · source for the 4-box') },
];

startApp({
  id: 'bg4', title: 'BG 4 · Mirrored background', fov: 40, shots, build,
  eras: ['e1960', 'e1970', 'e1945', 'e1980', 'e1990', 'colour'],
  update(T, api) { if (S.waterMat) S.waterMat.uniforms.uTime.value = T; const { hemi, sun, scene, THREE } = api; hemi.intensity = 2.2; hemi.color.set('#FFFFFF'); hemi.groundColor.set('#D8D2EE'); sun.intensity = 0.9; sun.position.set(-0.6, 1, 0.8);
    if (!scene.fog) scene.fog = new THREE.Fog('#FBE4EC', 160, 900); (S.rings || []).forEach(r => r.visible = opts.ring); },
  vanishingPoint: api => new api.THREE.Vector3(0, 0, -2000),
  staging: () => ({ center: [0, 0.85, 0], size: [2.6, 1.3, 1.4] }),
  guiTitle: 'BG 4 · Mirror',
  gui(f) { f.add(opts, 'fold', 0, 1, 0.01).name('Fold the mirror world (Inception)').onChange(setFold); f.add(opts, 'ring').name('Golden mirror ring'); },
});
